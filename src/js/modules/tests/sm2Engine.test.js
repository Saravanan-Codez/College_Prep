import { expect, test, describe } from "bun:test";
import { calculateSM2 } from "../sm2Engine.js";

describe("calculateSM2", () => {
    // Helper to calculate expected easeFactor according to:
    // easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    function calculateExpectedEaseFactor(initialEf, q) {
        const factor = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
        return Math.max(1.3, initialEf + factor);
    }

    test("handles empty/default cardState with perfect score (q = 5)", () => {
        const cardState = {};
        const q = 5;
        const result = calculateSM2(cardState, q);

        // Under q = 5, repetitions is initially 0 (default), so repetitions becomes 1
        // repetitions was 0 => interval = 1
        // repetitions updated to 1
        // easeFactor initially 2.5 (default). With q = 5:
        // formula: 2.5 + (0.1 - 0) = 2.6
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
        expect(result.easeFactor).toBe(2.6);

        // Check nextReview date
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 1);
        expect(result.nextReview).toBe(expectedDate.toDateString());
    });

    test("handles repetitions === 1 and correct score (q = 4)", () => {
        const cardState = {
            interval: 1,
            repetitions: 1,
            easeFactor: 2.5
        };
        const q = 4;
        const result = calculateSM2(cardState, q);

        // repetitions was 1 => interval = 6
        // repetitions becomes 2
        // easeFactor: 2.5 + (0.1 - 1 * (0.08 + 0.02)) = 2.5 + (0.1 - 0.1) = 2.50
        expect(result.interval).toBe(6);
        expect(result.repetitions).toBe(2);
        expect(result.easeFactor).toBeCloseTo(2.5, 5);

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 6);
        expect(result.nextReview).toBe(expectedDate.toDateString());
    });

    test("handles repetitions > 1 and correct score (q = 3)", () => {
        const cardState = {
            interval: 6,
            repetitions: 2,
            easeFactor: 2.5
        };
        const q = 3;
        const result = calculateSM2(cardState, q);

        // repetitions was 2 => interval = Math.round(6 * 2.5) = 15
        // repetitions becomes 3
        // easeFactor updated with q = 3:
        // diff = 0.1 - 2 * (0.08 + 2 * 0.02) = 0.1 - 2 * 0.12 = 0.1 - 0.24 = -0.14
        // EF = 2.5 - 0.14 = 2.36
        expect(result.interval).toBe(15);
        expect(result.repetitions).toBe(3);
        expect(result.easeFactor).toBeCloseTo(2.36, 5);

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 15);
        expect(result.nextReview).toBe(expectedDate.toDateString());
    });

    test("resets interval and repetitions on incorrect score (q < 2)", () => {
        const cardState = {
            interval: 15,
            repetitions: 3,
            easeFactor: 2.36
        };
        const q = 1; // Incorrect quality score
        const result = calculateSM2(cardState, q);

        // q < 2 => interval resets to 1, repetitions resets to 0
        // easeFactor updated with q = 1:
        // diff = 0.1 - 4 * (0.08 + 4 * 0.02) = 0.1 - 4 * (0.16) = 0.1 - 0.64 = -0.54
        // EF = 2.36 - 0.54 = 1.82
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.easeFactor).toBeCloseTo(1.82, 5);

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 1);
        expect(result.nextReview).toBe(expectedDate.toDateString());
    });

    test("clamps easeFactor to a minimum of 1.3", () => {
        const cardState = {
            interval: 5,
            repetitions: 2,
            easeFactor: 1.35
        };
        const q = 0; // Extremely low score
        const result = calculateSM2(cardState, q);

        // q < 2 => repetitions = 0, interval = 1
        // EF modification for q = 0:
        // diff = 0.1 - 5 * (0.08 + 5 * 0.02) = 0.1 - 5 * 0.18 = 0.1 - 0.9 = -0.8
        // EF = 1.35 - 0.8 = 0.55, which is < 1.3, so clamped to 1.3
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.easeFactor).toBe(1.3);

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 1);
        expect(result.nextReview).toBe(expectedDate.toDateString());
    });

    test("preserves extra properties in cardState", () => {
        const cardState = {
            id: "card_123",
            front: "Hello",
            back: "World",
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5
        };
        const q = 5;
        const result = calculateSM2(cardState, q);

        expect(result.id).toBe("card_123");
        expect(result.front).toBe("Hello");
        expect(result.back).toBe("World");
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
        expect(result.easeFactor).toBe(2.6);
    });
});
