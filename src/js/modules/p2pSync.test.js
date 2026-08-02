import { describe, test, expect } from 'bun:test';
import {
  createSyncPayload,
  buildSyncBundle,
  parseSyncPayload,
  describeSyncPayload
} from './p2pSync.js';

describe('p2pSync module tests', () => {
  describe('createSyncPayload', () => {
    test('should construct a valid payload structure', () => {
      const snapshot = { currentDay: 4, xp: 150 };
      const syncCode = '123456';
      const result = createSyncPayload(snapshot, syncCode);

      expect(result.version).toBe(1);
      expect(result.appVersion).toBe('2.0.0');
      expect(result.syncCode).toBe(syncCode);
      expect(result.state).toEqual(snapshot);
      expect(typeof result.exportedAt).toBe('string');

      // Verify exportedAt is a valid ISO string
      expect(isNaN(Date.parse(result.exportedAt))).toBe(false);
    });
  });

  describe('buildSyncBundle', () => {
    test('should build a bundle with a 6-digit numeric string syncCode and valid payload string', () => {
      const snapshot = { currentDay: 12, xp: 420 };
      const bundle = buildSyncBundle(snapshot);

      expect(bundle).toHaveProperty('syncCode');
      expect(bundle).toHaveProperty('payload');

      expect(typeof bundle.syncCode).toBe('string');
      expect(bundle.syncCode).toMatch(/^\d{6}$/);

      const parsedPayload = JSON.parse(bundle.payload);
      expect(parsedPayload.syncCode).toBe(bundle.syncCode);
      expect(parsedPayload.state).toEqual(snapshot);
    });
  });

  describe('parseSyncPayload', () => {
    test('should parse a valid JSON payload string containing state', () => {
      const rawText = JSON.stringify({
        version: 1,
        state: { currentDay: 2, xp: 10 }
      });
      const parsed = parseSyncPayload(rawText);
      expect(parsed).not.toBeNull();
      expect(parsed.state).toEqual({ currentDay: 2, xp: 10 });
    });

    test('should handle trimmed string payloads', () => {
      const rawText = `   \n ${JSON.stringify({ state: { xp: 5 } })} \n   `;
      const parsed = parseSyncPayload(rawText);
      expect(parsed).not.toBeNull();
      expect(parsed.state).toEqual({ xp: 5 });
    });

    test('should return null for non-string input', () => {
      expect(parseSyncPayload(null)).toBeNull();
      expect(parseSyncPayload(undefined)).toBeNull();
      expect(parseSyncPayload(123)).toBeNull();
      expect(parseSyncPayload({})).toBeNull();
    });

    test('should return null for invalid JSON string', () => {
      expect(parseSyncPayload('invalid-json')).toBeNull();
      expect(parseSyncPayload('{invalid}')).toBeNull();
    });

    test('should return null if parsed payload has no state property', () => {
      const rawText = JSON.stringify({ version: 1, noStateHere: true });
      expect(parseSyncPayload(rawText)).toBeNull();
    });
  });

  describe('describeSyncPayload', () => {
    test('should handle null/undefined/empty payload gracefully', () => {
      const expectedDefault = 'Day 1 • 0 task(s) completed • 0 XP';
      expect(describeSyncPayload(null)).toBe(expectedDefault);
      expect(describeSyncPayload(undefined)).toBe(expectedDefault);
      expect(describeSyncPayload({})).toBe(expectedDefault);
    });

    test('should correctly describe a flat state object (no .state wrapper)', () => {
      const flatPayload = {
        currentDay: 5,
        xp: 120,
        completedTasks: {
          'task1': true,
          'task2': false,
          'task3': true
        }
      };
      const result = describeSyncPayload(flatPayload);
      expect(result).toBe('Day 5 • 2 task(s) completed • 120 XP');
    });

    test('should correctly describe a nested payload (with .state wrapper)', () => {
      const nestedPayload = {
        version: 1,
        state: {
          currentDay: 8,
          xp: 300,
          completedTasks: {
            'taskA': true,
            'taskB': true,
            'taskC': true,
            'taskD': false
          }
        }
      };
      const result = describeSyncPayload(nestedPayload);
      expect(result).toBe('Day 8 • 3 task(s) completed • 300 XP');
    });

    test('should default missing values correctly', () => {
      const payload = {
        state: {
          // missing currentDay (should default to 1)
          // missing xp (should default to 0)
          completedTasks: {}
        }
      };
      const result = describeSyncPayload(payload);
      expect(result).toBe('Day 1 • 0 task(s) completed • 0 XP');
    });

    test('should correctly filter non-boolean and falsy completed task values', () => {
      const payload = {
        completedTasks: {
          t1: 'yes',     // truthy string -> counts
          t2: null,      // falsy -> ignored
          t3: undefined, // falsy -> ignored
          t4: 0,         // falsy -> ignored
          t5: true,      // truthy -> counts
          t6: false      // falsy -> ignored
        }
      };
      const result = describeSyncPayload(payload);
      expect(result).toBe('Day 1 • 2 task(s) completed • 0 XP');
    });
  });
});
