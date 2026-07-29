export function renderQRMode(currentState, contentContainer) {
    const statePayload = JSON.stringify(currentState);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(statePayload.slice(0, 300))}`;

    contentContainer.innerHTML = `
        <div class="space-y-3">
            <div class="p-3 bg-white inline-block rounded-2xl border border-slate-700 shadow-xl">
                <img src="${qrUrl}" alt="Progress QR Code Payload" class="w-44 h-44 mx-auto">
            </div>
            <div>
                <span class="text-xs font-bold text-cyan-400 block">Scan with Phone Camera to Sync</span>
                <p class="text-[11px] text-slate-400 mt-0.5">Or use 6-digit Sync PIN on your second device:</p>
            </div>
            <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xl font-extrabold text-amber-400 tracking-widest inline-block px-6">
                ${Math.floor(100000 + Math.random() * 900000)}
            </div>
        </div>
    `;
}

export function renderBluetoothMode(contentContainer, onScanClick) {
    contentContainer.innerHTML = `
        <div class="space-y-4 py-2">
            <div class="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-2xl mx-auto animate-pulse">
                <i class="fa-bluetooth"></i>
            </div>
            <div>
                <h4 class="text-sm font-bold text-white">Web Bluetooth Offline Discovery</h4>
                <p class="text-xs text-slate-400 mt-1">Scan for nearby laptop or mobile device running College Prep OS.</p>
            </div>
            <button id="trigger-bt-scan-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30">
                Scan Nearby Devices
            </button>
        </div>
    `;

    document.getElementById('trigger-bt-scan-btn').onclick = onScanClick;
}
