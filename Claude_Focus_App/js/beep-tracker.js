/**
 * Beep Tracker Module (Updated)
 * Count random beeps and enter your total at the end
 */

class BeepTracker {
    constructor() {
        this.isRunning = false;
        this.settings = {
            minInterval: 2,
            maxInterval: 8,
            duration: 2 // minutes
        };
        this.beepCount = 0;
        this.remainingSeconds = 0;
        this.timerInterval = null;
        this.beepTimeout = null;

        this.init();
    }

    init() {
        // Settings elements
        this.minIntervalInput = document.getElementById('beep-min-interval');
        this.maxIntervalInput = document.getElementById('beep-max-interval');
        this.durationInput = document.getElementById('beep-duration');
        this.startBtn = document.getElementById('beep-start');

        // Active elements
        this.settingsPanel = document.getElementById('beep-settings');
        this.activePanel = document.getElementById('beep-active');
        this.inputPanel = document.getElementById('beep-input');
        this.resultsPanel = document.getElementById('beep-results');
        this.timerDisplay = document.getElementById('beep-timer');
        this.statusDisplay = document.getElementById('beep-status');
        this.focusCircle = document.querySelector('#beep-visual .focus-circle');
        this.stopBtn = document.getElementById('beep-stop');

        // Input elements
        this.userCountInput = document.getElementById('beep-user-count');
        this.submitBtn = document.getElementById('beep-submit');

        // Results elements
        this.finalAccuracy = document.getElementById('beep-final-accuracy');
        this.finalTotal = document.getElementById('beep-final-total');
        this.finalUserCount = document.getElementById('beep-final-user-count');
        this.finalDifference = document.getElementById('beep-final-difference');
        this.restartBtn = document.getElementById('beep-restart');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.endSession());
        this.submitBtn.addEventListener('click', () => this.submitCount());
        this.restartBtn.addEventListener('click', () => this.reset());

        // Allow Enter key to submit
        this.userCountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitCount();
            }
        });
    }

    start() {
        // Read settings
        this.settings.minInterval = parseInt(this.minIntervalInput.value) || 2;
        this.settings.maxInterval = parseInt(this.maxIntervalInput.value) || 8;
        this.settings.duration = parseInt(this.durationInput.value) || 2;

        // Validate
        if (this.settings.minInterval >= this.settings.maxInterval) {
            this.settings.maxInterval = this.settings.minInterval + 2;
        }

        // Initialize
        audio.init();
        this.beepCount = 0;
        this.remainingSeconds = this.settings.duration * 60;
        this.isRunning = true;
        this.sessionStartTime = Date.now();

        // Show active panel
        this.settingsPanel.classList.add('hidden');
        this.activePanel.classList.remove('hidden');
        this.inputPanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');

        // Update display
        this.updateTimerDisplay();
        this.statusDisplay.textContent = 'Listen and count each beep...';

        // Start timer countdown
        this.timerInterval = setInterval(() => this.tick(), 1000);

        // Schedule first beep
        this.scheduleNextBeep();
    }

    tick() {
        this.remainingSeconds--;
        this.updateTimerDisplay();

        if (this.remainingSeconds <= 0) {
            this.endSession();
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        this.timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    scheduleNextBeep() {
        if (!this.isRunning) return;

        const minMs = this.settings.minInterval * 1000;
        const maxMs = this.settings.maxInterval * 1000;
        const delay = minMs + Math.random() * (maxMs - minMs);

        this.beepTimeout = setTimeout(() => {
            if (this.isRunning) {
                this.playBeep();
                this.scheduleNextBeep();
            }
        }, delay);
    }

    playBeep() {
        // Increment count
        this.beepCount++;

        // Play sound
        audio.playBeep(600, 0.15);

        // Visual feedback - flash the circle
        if (this.focusCircle) {
            this.focusCircle.classList.add('beep');
            setTimeout(() => {
                this.focusCircle.classList.remove('beep');
            }, 300);
        }
    }

    endSession() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearTimeout(this.beepTimeout);

        // Play end signal
        audio.playBell('gentle');

        // Show input panel
        this.activePanel.classList.add('hidden');
        this.inputPanel.classList.remove('hidden');
        this.userCountInput.value = '';
        this.userCountInput.focus();
    }

    submitCount() {
        const userCount = parseInt(this.userCountInput.value);

        if (isNaN(userCount) || userCount < 0) {
            this.userCountInput.classList.add('error');
            return;
        }

        this.userCountInput.classList.remove('error');
        this.complete(userCount);
    }

    complete(userCount) {
        const totalDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const actualBeeps = this.beepCount;
        const difference = Math.abs(userCount - actualBeeps);

        // Calculate accuracy (100% if exact, decreases with each miss)
        let accuracy;
        if (actualBeeps === 0) {
            accuracy = userCount === 0 ? 100 : 0;
        } else {
            accuracy = Math.max(0, Math.round((1 - difference / actualBeeps) * 100));
        }

        // Record session
        analytics.recordSession('beep-tracker', totalDuration, accuracy, {
            actualBeeps: actualBeeps,
            userCount: userCount,
            difference: difference,
            minInterval: this.settings.minInterval,
            maxInterval: this.settings.maxInterval
        });

        // Show results
        this.inputPanel.classList.add('hidden');
        this.resultsPanel.classList.remove('hidden');

        this.finalAccuracy.textContent = `${accuracy}%`;
        this.finalTotal.textContent = actualBeeps;
        this.finalUserCount.textContent = userCount;
        this.finalDifference.textContent = difference === 0 ? 'Perfect!' :
            (userCount > actualBeeps ? `+${difference}` : `-${difference}`);

        // Color code accuracy
        if (accuracy >= 90) {
            this.finalAccuracy.style.color = 'var(--success)';
        } else if (accuracy >= 70) {
            this.finalAccuracy.style.color = 'var(--warning)';
        } else {
            this.finalAccuracy.style.color = 'var(--error)';
        }

        // Play result sound
        if (accuracy >= 80) {
            audio.playSuccess();
        } else {
            audio.playBell('gentle');
        }

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    reset() {
        this.resultsPanel.classList.add('hidden');
        this.settingsPanel.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
let beepTracker;
document.addEventListener('DOMContentLoaded', () => {
    beepTracker = new BeepTracker();
});
