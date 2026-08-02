import { expect, test, describe } from "bun:test";
import { getUserLevelInfo, USER_LEVELS } from "../src/js/modules/gamification.js";

describe("getUserLevelInfo XP calculation tests", () => {
    test("handles default/empty values correctly", () => {
        // null, undefined, zero, empty string, etc.
        const defaultLevel = USER_LEVELS[0];
        const range = defaultLevel.maxXp - defaultLevel.minXp;

        expect(getUserLevelInfo(0)).toEqual({
            ...defaultLevel,
            progressInLvl: 0,
            lvlRange: range,
            percent: 0
        });

        expect(getUserLevelInfo(null)).toEqual({
            ...defaultLevel,
            progressInLvl: 0,
            lvlRange: range,
            percent: 0
        });

        expect(getUserLevelInfo(undefined)).toEqual({
            ...defaultLevel,
            progressInLvl: 0,
            lvlRange: range,
            percent: 0
        });
    });

    test("correctly calculates levels and progress within boundaries", () => {
        // level 1 middle value: 100 XP
        // minXp: 0, maxXp: 200, range: 200, progress: 100, percent: 50%
        expect(getUserLevelInfo(100)).toEqual({
            level: 1,
            title: "Novice Coder",
            minXp: 0,
            maxXp: 200,
            progressInLvl: 100,
            lvlRange: 200,
            percent: 50
        });

        // Exact boundary value: 200 XP (should transition to Level 2)
        // minXp: 200, maxXp: 500, range: 300, progress: 0, percent: 0%
        expect(getUserLevelInfo(200)).toEqual({
            level: 2,
            title: "Syntax Apprentice",
            minXp: 200,
            maxXp: 500,
            progressInLvl: 0,
            lvlRange: 300,
            percent: 0
        });

        // Value just below Level 2 transition: 199 XP
        // minXp: 0, maxXp: 200, range: 200, progress: 199, percent: 100% (due to Math.round(199/200 * 100) = 100)
        expect(getUserLevelInfo(199)).toEqual({
            level: 1,
            title: "Novice Coder",
            minXp: 0,
            maxXp: 200,
            progressInLvl: 199,
            lvlRange: 200,
            percent: 100
        });

        // Middle value of level 2: 350 XP
        // minXp: 200, maxXp: 500, range: 300, progress: 150, percent: 50%
        expect(getUserLevelInfo(350)).toEqual({
            level: 2,
            title: "Syntax Apprentice",
            minXp: 200,
            maxXp: 500,
            progressInLvl: 150,
            lvlRange: 300,
            percent: 50
        });
    });

    test("handles high level transitions and final level limits", () => {
        // Exact level 10 boundary (highest level in array): 10000 XP
        // level: 10, minXp: 10000, maxXp: 99999, range: 89999
        expect(getUserLevelInfo(10000)).toEqual({
            level: 10,
            title: "CS Prep Titan",
            minXp: 10000,
            maxXp: 99999,
            progressInLvl: 0,
            lvlRange: 89999,
            percent: 0
        });

        // Exceeding the highest level max XP: 150000 XP
        // minXp: 10000, maxXp: 99999, range: 89999, progress: 140000.
        // percent should be capped at 100
        expect(getUserLevelInfo(150000)).toEqual({
            level: 10,
            title: "CS Prep Titan",
            minXp: 10000,
            maxXp: 99999,
            progressInLvl: 140000,
            lvlRange: 89999,
            percent: 100
        });
    });

    test("handles negative inputs gracefully", () => {
        // Negative XP: should fall to Level 1, progress negative, percentage capped?
        // Wait, progressInLvl = -50 - 0 = -50.
        // lvlRange = 200.
        // progressInLvl / lvlRange * 100 = -25%
        // percent = Math.min(100, Math.round(-25)) = -25
        expect(getUserLevelInfo(-50)).toEqual({
            level: 1,
            title: "Novice Coder",
            minXp: 0,
            maxXp: 200,
            progressInLvl: -50,
            lvlRange: 200,
            percent: -25
        });
    });
});
