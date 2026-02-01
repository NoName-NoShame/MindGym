/**
 * Audio Engine - Web Audio API based sound generation
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.activeNodes = new Map();
        this.initialized = false;
    }

    // Initialize audio context (must be called after user interaction)
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.setMasterVolume(analytics.getSettings().masterVolume / 100);
            this.initialized = true;
        } catch (e) {
            console.error('Failed to initialize audio:', e);
        }
    }

    // Ensure audio context is running (iOS fix)
    async resume() {
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (e) {
                console.error('Failed to resume audio:', e);
            }
        }
    }

    // Set master volume (0-1)
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    // Play a simple beep tone
    playBeep(frequency = 800, duration = 0.15, type = 'sine') {
        if (!this.initialized || !analytics.getSettings().soundEffects) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play success sound
    playSuccess() {
        if (!this.initialized || !analytics.getSettings().soundEffects) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // Two-tone success jingle
        [523.25, 659.25].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    // Play error sound
    playError() {
        if (!this.initialized || !analytics.getSettings().soundEffects) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // Play a bell/chime sound
    playBell(type = 'gentle') {
        if (!this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;
        const frequencies = {
            'gentle': [523.25, 659.25, 783.99],
            'singing-bowl': [261.63, 329.63, 392.00, 523.25],
            'gong': [130.81, 164.81, 196.00]
        };

        const freqs = frequencies[type] || frequencies['gentle'];
        const duration = type === 'gong' ? 3 : type === 'singing-bowl' ? 2 : 1;

        freqs.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2 / freqs.length, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // Generate noise (white, pink, brown)
    createNoise(type = 'white') {
        if (!this.initialized) return null;

        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;

            if (type === 'pink') {
                // Simple approximation of pink noise
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            } else if (type === 'brown') {
                // Brown noise
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            } else {
                data[i] = white;
            }
        }

        return buffer;
    }

    // Start ambient sound
    startAmbient(type, volume = 0.5) {
        if (!this.initialized) return;
        this.resume();

        // Stop existing ambient of same type
        this.stopAmbient(type);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 1);
        gainNode.connect(this.masterGain);

        let source;

        switch (type) {
            case 'whitenoise':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('white');
                source.loop = true;
                break;
            case 'rain':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('pink');
                source.loop = true;
                // Add low-pass filter for rain effect
                const rainFilter = this.audioContext.createBiquadFilter();
                rainFilter.type = 'lowpass';
                rainFilter.frequency.value = 1000;
                source.connect(rainFilter);
                rainFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: rainFilter });
                return;
            case 'ocean':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('brown');
                source.loop = true;
                // Modulate for waves
                const oceanFilter = this.audioContext.createBiquadFilter();
                oceanFilter.type = 'lowpass';
                oceanFilter.frequency.value = 400;
                source.connect(oceanFilter);
                oceanFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: oceanFilter });
                return;
            case 'forest':
            case 'birds':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('pink');
                source.loop = true;
                const forestFilter = this.audioContext.createBiquadFilter();
                forestFilter.type = 'bandpass';
                forestFilter.frequency.value = 2000;
                forestFilter.Q.value = 0.5;
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume * 0.15, this.audioContext.currentTime + 1);
                source.connect(forestFilter);
                forestFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: forestFilter });
                return;
            case 'fire':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('brown');
                source.loop = true;
                const fireFilter = this.audioContext.createBiquadFilter();
                fireFilter.type = 'lowpass';
                fireFilter.frequency.value = 200;
                source.connect(fireFilter);
                fireFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: fireFilter });
                return;
            case 'wind':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('pink');
                source.loop = true;
                const windFilter = this.audioContext.createBiquadFilter();
                windFilter.type = 'lowpass';
                windFilter.frequency.value = 300;
                source.connect(windFilter);
                windFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: windFilter });
                return;
            case 'thunder':
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('brown');
                source.loop = true;
                const thunderFilter = this.audioContext.createBiquadFilter();
                thunderFilter.type = 'lowpass';
                thunderFilter.frequency.value = 100;
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume * 0.4, this.audioContext.currentTime + 1);
                source.connect(thunderFilter);
                thunderFilter.connect(gainNode);
                source.start();
                this.activeNodes.set(type, { source, gain: gainNode, filter: thunderFilter });
                return;
            default:
                source = this.audioContext.createBufferSource();
                source.buffer = this.createNoise('white');
                source.loop = true;
        }

        source.connect(gainNode);
        source.start();
        this.activeNodes.set(type, { source, gain: gainNode });
    }

    // Update ambient volume
    updateAmbientVolume(type, volume) {
        const node = this.activeNodes.get(type);
        if (node && node.gain) {
            node.gain.gain.linearRampToValueAtTime(
                volume * 0.3,
                this.audioContext.currentTime + 0.1
            );
        }
    }

    // Stop ambient sound
    stopAmbient(type) {
        const node = this.activeNodes.get(type);
        if (node) {
            try {
                node.gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
                setTimeout(() => {
                    try {
                        node.source.stop();
                    } catch (e) { }
                }, 600);
            } catch (e) { }
            this.activeNodes.delete(type);
        }
    }

    // Stop all ambient sounds
    stopAllAmbient() {
        this.activeNodes.forEach((_, type) => this.stopAmbient(type));
    }

    // Play click sound
    playClick() {
        if (!this.initialized || !analytics.getSettings().soundEffects) return;
        this.playBeep(1000, 0.05, 'sine');
    }
}

// Create singleton instance
const audio = new AudioEngine();
