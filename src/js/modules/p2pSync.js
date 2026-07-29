const SYNC_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

export function createSyncPayload(snapshot, syncCode) {
  return {
    version: 1,
    appVersion: '2.0.0',
    exportedAt: new Date().toISOString(),
    syncCode,
    state: snapshot
  };
}

export function buildSyncBundle(snapshot) {
  const syncCode = `${Math.floor(100000 + Math.random() * 900000)}`;
  const payload = JSON.stringify(createSyncPayload(snapshot, syncCode));
  return { syncCode, payload };
}

export function parseSyncPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  try {
    const parsed = JSON.parse(rawText.trim());
    if (parsed && parsed.state) {
      return parsed;
    }
  } catch (error) {
    return null;
  }

  return null;
}

export function describeSyncPayload(payload) {
  const state = payload?.state || payload || {};
  const completedCount = Object.values(state.completedTasks || {}).filter(Boolean).length;
  const day = state.currentDay || 1;
  const xp = state.xp || 0;
  return `Day ${day} • ${completedCount} task(s) completed • ${xp} XP`;
}

export function isBluetoothAvailable() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export async function attemptBluetoothDiscovery(onStatus) {
  if (!isBluetoothAvailable()) {
    onStatus?.('Web Bluetooth is not available in this browser. Use the QR or copy/share flow instead.');
    return false;
  }

  onStatus?.('Checking Bluetooth availability...');

  try {
    const available = await navigator.bluetooth.getAvailability();
    if (!available) {
      onStatus?.('Bluetooth hardware is unavailable on this device. Use the QR or copy/share flow instead.');
      return false;
    }

    onStatus?.('Requesting a nearby device...');
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SYNC_SERVICE_UUID] }],
      optionalServices: [SYNC_SERVICE_UUID]
    });

    onStatus?.(`Device selected: ${device.name || 'a nearby device'}. The app uses the shared payload flow for the actual transfer.`);
    return true;
  } catch (error) {
    onStatus?.(`Bluetooth discovery was cancelled or failed: ${error.message}`);
    return false;
  }
}
