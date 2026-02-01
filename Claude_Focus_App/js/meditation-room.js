/**
 * Meditation Room Module
 * Ambient soundscape mixer
 */

class MeditationRoom {
    constructor() {
        this.activeSounds = new Map();
        this.timerRunning = false;
        this.timerSeconds = 0;
        this.timerInterval = null;
        this.sessionStartTime = null;

        this.init();
    }

    init() {
        this.soundCards = document.querySelectorAll('.sound-card');
        this.timerDisplay = document.getElementById('room-timer-display');
        this.timerResetBtn = document.getElementById('room-timer-reset');
        this.timerToggleBtn = document.getElementById('room-timer-toggle');

        this.bindEvents();
    }

    bindEvents() {
        // Sound card controls
        this.soundCards.forEach(card => {
            const soundType = card.dataset.sound;
            const slider = card.querySelector('.sound-volume');

            slider.addEventListener('input', () => {
                this.handleVolumeChange(soundType, slider.value, card);
            });

            // Click on card to toggle
            card.addEventListener('click', (e) => {
                if (e.target !== slider) {
                    audio.init();
                    if (slider.value === '0') {
                        slider.value = 50;
                        this.handleVolumeChange(soundType, 50, card);
                    } else {
                        slider.value = 0;
                        this.handleVolumeChange(soundType, 0, card);
                    }
                }
            });
        });

        // Timer controls
        this.timerResetBtn.addEventListener('click', () => this.resetTimer());
        this.timerToggleBtn.addEventListener('click', () => this.toggleTimer());
    }

    handleVolumeChange(soundType, volume, card) {
        audio.init();

        volume = parseInt(volume);

        if (volume > 0) {
            if (!this.activeSounds.has(soundType)) {
                // Start new sound
                audio.startAmbient(soundType, volume / 100);
                this.activeSounds.set(soundType, volume);
                card.classList.add('active');
            } else {
                // Update volume
                audio.updateAmbientVolume(soundType, volume / 100);
                this.activeSounds.set(soundType, volume);
            }
        } else {
            // Stop sound
            audio.stopAmbient(soundType);
            this.activeSounds.delete(soundType);
            card.classList.remove('active');
        }

        // Start session tracking if not already
        if (this.activeSounds.size > 0 && !this.sessionStartTime) {
            this.sessionStartTime = Date.now();
        }

        // End session if all sounds stopped
        if (this.activeSounds.size === 0 && this.sessionStartTime) {
            this.recordSession();
        }
    }

    toggleTimer() {
        if (this.timerRunning) {
            // Pause
            this.timerRunning = false;
            clearInterval(this.timerInterval);
            this.updateTimerIcon(false);
        } else {
            // Start
            this.timerRunning = true;
            this.timerInterval = setInterval(() => this.tickTimer(), 1000);
            this.updateTimerIcon(true);
        }
    }

    tickTimer() {
        this.timerSeconds++;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        this.timerDisplay.textContent =
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimerIcon(running) {
        const icon = this.timerToggleBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', running ? 'pause' : 'play');
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    resetTimer() {
        this.timerSeconds = 0;
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        this.updateTimerIcon(false);
    }

    recordSession() {
        if (!this.sessionStartTime) return;

        const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);

        // Only record if more than 30 seconds
        if (duration >= 30) {
            analytics.recordSession('meditation-room', duration, null, {
                sounds: Array.from(this.activeSounds.keys())
            });

            // Update dashboard
            if (window.app) {
                window.app.updateDashboard();
            }
        }

        this.sessionStartTime = null;
    }

    // Called when leaving the view
    cleanup() {
        audio.stopAllAmbient();
        this.activeSounds.clear();
        this.soundCards.forEach(card => card.classList.remove('active'));

        if (this.sessionStartTime) {
            this.recordSession();
        }

        this.resetTimer();
    }
}

// Initialize when DOM is ready
let meditationRoom;
document.addEventListener('DOMContentLoaded', () => {
    meditationRoom = new MeditationRoom();
});
