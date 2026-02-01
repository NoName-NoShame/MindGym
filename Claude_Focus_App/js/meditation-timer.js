/**
 * Meditation Timer Module
 * Customizable meditation timer with interval bells
 */

class MeditationTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.settings = {
            minutes: 10,
            intervalMinutes: 5,
            endBell: 'singing-bowl'
        };
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        this.timerInterval = null;
        this.lastIntervalBell = 0;

        this.init();
    }

    init() {
        // Setup elements
        this.minutesInput = document.getElementById('timer-minutes');
        this.intervalSelect = document.getElementById('timer-interval');
        this.endBellSelect = document.getElementById('timer-end-bell');
        this.startBtn = document.getElementById('timer-start');

        // Active elements
        this.setupPanel = document.getElementById('timer-setup');
        this.activePanel = document.getElementById('timer-active');
        this.completePanel = document.getElementById('timer-complete');
        this.timeDisplay = document.getElementById('timer-time');
        this.ringProgress = document.getElementById('timer-ring');
        this.cancelBtn = document.getElementById('timer-cancel');
        this.pauseBtn = document.getElementById('timer-pause');

        // Complete elements
        this.finalDuration = document.getElementById('timer-final-duration');
        this.restartBtn = document.getElementById('timer-restart');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.cancelBtn.addEventListener('click', () => this.cancel());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.reset());
    }

    start() {
        // Read settings
        this.settings.minutes = parseInt(this.minutesInput.value) || 10;
        this.settings.intervalMinutes = parseInt(this.intervalSelect.value) || 0;
        this.settings.endBell = this.endBellSelect.value || 'singing-bowl';

        // Initialize
        audio.init();
        this.totalSeconds = this.settings.minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = true;
        this.isPaused = false;
        this.lastIntervalBell = 0;
        this.sessionStartTime = Date.now();

        // Show active panel
        this.setupPanel.classList.add('hidden');
        this.activePanel.classList.remove('hidden');
        this.completePanel.classList.add('hidden');

        // Play start bell
        audio.playBell('gentle');

        // Start timer
        this.updateDisplay();
        this.timerInterval = setInterval(() => this.tick(), 1000);
        this.updatePauseIcon();
    }

    tick() {
        if (this.isPaused) return;

        this.remainingSeconds--;

        // Check for interval bell
        if (this.settings.intervalMinutes > 0) {
            const elapsed = this.totalSeconds - this.remainingSeconds;
            const intervalSecs = this.settings.intervalMinutes * 60;
            const currentInterval = Math.floor(elapsed / intervalSecs);

            if (currentInterval > this.lastIntervalBell && this.remainingSeconds > 0) {
                this.lastIntervalBell = currentInterval;
                audio.playBell('gentle');
            }
        }

        this.updateDisplay();

        if (this.remainingSeconds <= 0) {
            this.complete();
        }
    }

    updateDisplay() {
        // Time display
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        this.timeDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Ring progress
        const progress = ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds);
        const circumference = 2 * Math.PI * 90; // r = 90
        const offset = circumference * (1 - progress);
        this.ringProgress.style.strokeDashoffset = offset;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.updatePauseIcon();
    }

    updatePauseIcon() {
        const icon = this.pauseBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', this.isPaused ? 'play' : 'pause');
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    cancel() {
        this.isRunning = false;
        clearInterval(this.timerInterval);

        // Record partial session
        const elapsed = Math.round((Date.now() - this.sessionStartTime) / 1000);
        if (elapsed >= 30) {
            analytics.recordSession('meditation-timer', elapsed, null, {
                targetMinutes: this.settings.minutes,
                completed: false
            });
        }

        this.reset();
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.timerInterval);

        // Play end bell
        audio.playBell(this.settings.endBell);

        // Record session
        analytics.recordSession('meditation-timer', this.totalSeconds, null, {
            targetMinutes: this.settings.minutes,
            completed: true
        });

        // Show complete panel
        this.activePanel.classList.add('hidden');
        this.completePanel.classList.remove('hidden');
        this.finalDuration.textContent = this.settings.minutes;

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    reset() {
        this.completePanel.classList.add('hidden');
        this.activePanel.classList.add('hidden');
        this.setupPanel.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
let meditationTimer;
document.addEventListener('DOMContentLoaded', () => {
    meditationTimer = new MeditationTimer();
});
