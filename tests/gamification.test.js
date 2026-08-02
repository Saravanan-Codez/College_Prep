import { describe, expect, test } from "bun:test";
import { getUserLevelInfo, USER_LEVELS } from "../src/js/modules/gamification.js";

describe("getUserLevelInfo", () => {
    test("handles undefined xp", () => {
        const result = getUserLevelInfo(undefined);
        expect(result).toBeDefined();
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles no arguments (implicitly undefined xp)", () => {
        const result = getUserLevelInfo();
        expect(result).toBeDefined();
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles null xp", () => {
        const result = getUserLevelInfo(null);
        expect(result).toBeDefined();
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles zero xp", () => {
        const result = getUserLevelInfo(0);
        expect(result).toBeDefined();
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles typical xp within level 1", () => {
        const result = getUserLevelInfo(100);
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(100);
        expect(result.percent).toBe(50); // (100 / 200) * 100 = 50%
    });

    test("handles exact boundary transition to level 2", () => {
        const result = getUserLevelInfo(200);
        expect(result.level).toBe(2);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles typical xp within level 2", () => {
        const result = getUserLevelInfo(350);
        expect(result.level).toBe(2);
        expect(result.progressInLvl).toBe(150);
        expect(result.percent).toBe(50); // (150 / (500 - 200)) * 100 = 50%
    });

    test("handles exact boundary transition to level 10", () => {
        const result = getUserLevelInfo(10000);
        expect(result.level).toBe(10);
        expect(result.progressInLvl).toBe(0);
        expect(result.percent).toBe(0);
    });

    test("handles very large xp exceeding maximum level range limits percent to 100", () => {
        const result = getUserLevelInfo(110000);
        expect(result.level).toBe(10);
        expect(result.progressInLvl).toBe(100000);
        expect(result.percent).toBe(100);
    });

    test("handles negative xp correctly", () => {
        const result = getUserLevelInfo(-50);
        expect(result.level).toBe(1);
        expect(result.progressInLvl).toBe(-50);
        expect(result.percent).toBe(-25); // Math.round((-50 / 200) * 100) = -25
    });
});
