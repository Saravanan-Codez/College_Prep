let activeAmbientSound = null;
let ambientAudioCtx = null;
let htmlAudioElement = null;

export function getAudioContext() {
    if (!ambientAudioCtx) {
        ambientAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ambientAudioCtx.state === 'suspended') {
        ambientAudioCtx.resume();
    }
    return ambientAudioCtx;
}

export function playPopSound(soundMuted) {
    if (soundMuted) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch(e){}
}

export function playLevelUpSound(soundMuted) {
    if (soundMuted) return;
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.1);
            osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
        });
    } catch(e){}
}

export function toggleAmbientSound(type, showToast) {
    // Stop existing sounds
    if (ambientAudioCtx) {
        try {
            ambientAudioCtx.close();
        } catch(e){}
        ambientAudioCtx = null;
    }
    if (htmlAudioElement) {
        try {
            htmlAudioElement.pause();
            htmlAudioElement.src = '';
        } catch(e){}
        htmlAudioElement = null;
    }

    if (type === 'off' || activeAmbientSound === type) {
        activeAmbientSound = null;
        if (showToast) showToast("Ambient soundscape stopped 🔇");
        return;
    }

    activeAmbientSound = type;
    try {
        const ctx = getAudioContext();

        if (type === 'alpha') {
            // 10Hz Alpha Binaural Beat (200Hz Left, 210Hz Right)
            const oscLeft = ctx.createOscillator();
            const oscRight = ctx.createOscillator();
            const merger = ctx.createChannelMerger(2);

            oscLeft.type = 'sine';
            oscRight.type = 'sine';
            oscLeft.frequency.value = 200;
            oscRight.frequency.value = 210;

            oscLeft.connect(merger, 0, 0);
            oscRight.connect(merger, 0, 1);

            const gain = ctx.createGain();
            gain.gain.value = 0.18;

            merger.connect(gain);
            gain.connect(ctx.destination);

            oscLeft.start();
            oscRight.start();
            if (showToast) showToast("Playing 10Hz Alpha Binaural Beats (Deep Focus) 🧠");
        } else if (type === 'rain' || type === 'pink' || type === 'brown') {
            // Brown / Pink Noise Generator for Rain / Study Focus
            const bufferSize = ctx.sampleRate * 3;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                if (type === 'brown' || type === 'rain') {
                    // Brown noise (smoothed for deep rain feel)
                    output[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = output[i];
                    output[i] *= 3.5;
                } else {
                    // Pink noise
                    output[i] = white * 0.15;
                }
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = noiseBuffer;
            noiseNode.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
            filter.frequency.value = type === 'rain' ? 800 : 1000;

            const gain = ctx.createGain();
            gain.gain.value = 0.15;

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noiseNode.start();

            if (showToast) showToast(type === 'rain' ? "Playing Soft Rain Soundscape 🌧️" : "Playing Focus Noise 📻");
        } else if (type === 'lofi') {
            // Royalty-free Lofi Chill Stream
            htmlAudioElement = new Audio("https://stream.zeno.fm/f3wvbbqmdg8uv");
            htmlAudioElement.volume = 0.4;
            htmlAudioElement.play().then(() => {
                if (showToast) showToast("Playing Live Lofi Radio 🎧");
            }).catch(err => {
                if (showToast) showToast("⚠️ Tap play to enable Lofi Stream");
            });
        }
    } catch(e) {
        console.error("Audio Soundscape Error", e);
        if (showToast) showToast("⚠️ Audio Context Error");
    }
}
