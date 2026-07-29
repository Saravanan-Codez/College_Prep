let activeAmbientSound = null;
let ambientAudioCtx = null;

export function playPopSound(soundMuted) {
    if (soundMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch(e){}
}

export function playLevelUpSound(soundMuted) {
    if (soundMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.1);
            osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
        });
    } catch(e){}
}

export function toggleAmbientSound(type, showToast) {
    if (ambientAudioCtx) {
        ambientAudioCtx.close();
        ambientAudioCtx = null;
    }

    if (type === 'off' || activeAmbientSound === type) {
        activeAmbientSound = null;
        showToast("Ambient soundscape stopped 🔇");
        return;
    }

    activeAmbientSound = type;
    try {
        ambientAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'alpha') {
            const oscLeft = ambientAudioCtx.createOscillator();
            const oscRight = ambientAudioCtx.createOscillator();
            const merger = ambientAudioCtx.createChannelMerger(2);

            oscLeft.frequency.value = 200;
            oscRight.frequency.value = 210;

            oscLeft.connect(merger, 0, 0);
            oscRight.connect(merger, 0, 1);

            const gain = ambientAudioCtx.createGain();
            gain.gain.value = 0.15;

            merger.connect(gain);
            gain.connect(ambientAudioCtx.destination);

            oscLeft.start();
            oscRight.start();
            showToast("Playing 10Hz Alpha Binaural Beats (Deep Focus) 🧠");
        } else if (type === 'rain' || type === 'pink') {
            const bufferSize = ambientAudioCtx.sampleRate * 2;
            const noiseBuffer = ambientAudioCtx.createBuffer(1, bufferSize, ambientAudioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }

            const whiteNoise = ambientAudioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const gain = ambientAudioCtx.createGain();
            gain.gain.value = 0.1;

            whiteNoise.connect(gain);
            gain.connect(ambientAudioCtx.destination);
            whiteNoise.start();

            showToast(type === 'rain' ? "Playing Soft Rain Soundscape 🌧️" : "Playing Pink Noise 📻");
        }
    } catch(e) {
        console.error("Audio Soundscape Error", e);
    }
}
