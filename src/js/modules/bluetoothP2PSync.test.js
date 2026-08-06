import { describe, test, expect, mock, beforeEach } from "bun:test";
import { executeUniversalP2PSync } from "./bluetoothP2PSync.js";

// Setup browser globals needed for the test
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; }
};

globalThis.RTCPeerConnection = class {
  createDataChannel() {
    return {
      send: () => {}
    };
  }
};

describe("executeUniversalP2PSync passcode validation", () => {
  beforeEach(() => {
    // Clear localStorage mock store
    for (const key in store) {
      delete store[key];
    }
  });

  test("fails on undefined passcode", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await executeUniversalP2PSync(undefined, {}, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("fails on null passcode", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await executeUniversalP2PSync(null, {}, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("fails on empty string passcode", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await executeUniversalP2PSync("", {}, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("fails on passcode shorter than 6 characters", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await executeUniversalP2PSync("12345", {}, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("fails on passcode with spaces that resolves to less than 6 characters", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await executeUniversalP2PSync("  12345  ", {}, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("succeeds validation and proceeds with valid 6-digit passcode", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    // This is valid (length >= 6) and will run the rest of the function
    const promise = executeUniversalP2PSync("123456", { state: "test" }, onProgress, onComplete, onError);

    // It should have proceeded past the passcode validation check and called onProgress
    expect(onError).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(15, expect.stringContaining("Establishing P2P DataChannel connection"));

    await promise;
  });
});
