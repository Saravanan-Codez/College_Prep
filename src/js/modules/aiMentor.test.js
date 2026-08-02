import { describe, test, expect, mock, spyOn } from "bun:test";
import { sendGeminiPrompt } from "./aiMentor.js";

describe("sendGeminiPrompt", () => {
    const mockContext = {
        currentDay: 5,
        currentDayData: {
            math: { topic: "Calculus Limits" }
        },
        levelInfo: { title: "Apprentice" },
        xp: 120,
        completedToday: 2,
        activeCode: "int main() { return 0; }"
    };

    test("should throw an error when apiKey is missing, empty, or whitespace-only", async () => {
        const expectedError = "API Key missing! Please enter your Google AI Studio API Key in settings.";

        // Undefined API Key
        expect(sendGeminiPrompt("Hello", undefined, mockContext)).rejects.toThrow(expectedError);

        // Null API Key
        expect(sendGeminiPrompt("Hello", null, mockContext)).rejects.toThrow(expectedError);

        // Empty API Key
        expect(sendGeminiPrompt("Hello", "", mockContext)).rejects.toThrow(expectedError);

        // Whitespace-only API Key
        expect(sendGeminiPrompt("Hello", "   ", mockContext)).rejects.toThrow(expectedError);
    });

    test("should successfully return responses on a valid prompt and key", async () => {
        const mockResponse = {
            candidates: [
                {
                    content: {
                        parts: [{ text: "This is a mocked response from Gemini." }]
                    }
                }
            ]
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock((url, init) => {
            return Promise.resolve(new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        });

        try {
            const result = await sendGeminiPrompt("Hello", "valid-key-123", mockContext);
            expect(result).toBe("This is a mocked response from Gemini.");
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test("should handle response when custom or partially missing context fields are passed", async () => {
        const mockResponse = {
            candidates: [
                {
                    content: {
                        parts: [{ text: "Custom context response" }]
                    }
                }
            ]
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock((url, init) => {
            // Verify payload includes default fallbacks
            const payload = JSON.parse(init.body);
            const systemPrompt = payload.contents[0].parts[0].text;
            expect(systemPrompt).toContain("Study Day: Day undefined of 20");
            expect(systemPrompt).toContain("Active Subject / Topic: General CS");
            expect(systemPrompt).toContain("Current Level: Novice (0 XP)");
            expect(systemPrompt).toContain("Completed Sessions Today: 0 / 6");
            expect(systemPrompt).toContain("// No code written");

            return Promise.resolve(new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        });

        try {
            const result = await sendGeminiPrompt("Hello", "valid-key-123", {});
            expect(result).toBe("Custom context response");
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test("should throw detailed API request failure error when response is not ok (without custom error field)", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock((url, init) => {
            return Promise.resolve(new Response(JSON.stringify({}), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            }));
        });

        try {
            await expect(sendGeminiPrompt("Hello", "valid-key-123", mockContext)).rejects.toThrow("API Request failed with status 400");
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test("should throw custom api error message when response is not ok and contains error object", async () => {
        const errorResponse = {
            error: {
                message: "API Key not valid."
            }
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock((url, init) => {
            return Promise.resolve(new Response(JSON.stringify(errorResponse), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            }));
        });

        try {
            await expect(sendGeminiPrompt("Hello", "valid-key-123", mockContext)).rejects.toThrow("API Key not valid.");
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test("should throw error if response has no candidates", async () => {
        const mockResponse = {
            candidates: []
        };

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock((url, init) => {
            return Promise.resolve(new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        });

        try {
            await expect(sendGeminiPrompt("Hello", "valid-key-123", mockContext)).rejects.toThrow("No response content generated by Gemini.");
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
