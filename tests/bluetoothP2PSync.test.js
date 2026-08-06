import { describe, test, expect, mock } from "bun:test";
import { executeUniversalP2PSync } from "../src/js/modules/bluetoothP2PSync.js";

describe("executeUniversalP2PSync - invalid passcode check", () => {
  test("should call onError when targetPasscode is null", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync(null, masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when targetPasscode is undefined", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync(undefined, masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when targetPasscode is empty", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync("", masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when targetPasscode is less than 6 characters", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync("12345", masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when targetPasscode is whitespace-only", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync("      ", masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when targetPasscode is less than 6 characters after trimming", async () => {
    const onProgress = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});
    const masterState = {};

    await executeUniversalP2PSync("  12345  ", masterState, onProgress, onComplete, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("Please enter a valid 6-digit sync passcode.");
    expect(onProgress).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
