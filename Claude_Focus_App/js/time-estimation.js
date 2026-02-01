/**
 * Time Estimation Module (Updated)
 * Two modes: Target Mode (see time, stop when ready) and Mystery Mode (unknown time, guess after signal)
 */

class TimeEstimation {
    constructor() {
        this.isRunning = false;
        this.mode = 'target'; // 'target' or 'mystery'
        this.settings = {
            minTime: 10,
            maxTime: 60,
            rounds: 5,
            blindMode: false
        };
        this.currentRound = 0;
        this.targetTime = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.results = [];
        this.timerInterval = null;
        this.mysteryTimeout = null;

        this.init();
    }

    init() {
        // Mode selector buttons
        this.modeTargetBtn = document.getElementById('mode-target');
        this.modeMysteryBtn = document.getElementById('mode-mystery');
        this.blindModeOption = document.getElementById('blind-mode-option');

        // Settings elements
        this.minTimeInput = document.getElementById('time-min');
        this.maxTimeInput = document.getElementById('time-max');
        this.roundsInput = document.getElementById('time-rounds');
        this.blindModeCheckbox = document.getElementById('time-blind-mode');
        this.startBtn = document.getElementById('time-start');

        // Target Mode active elements
        this.settingsPanel = document.getElementById('time-settings');
        this.activePanel = document.getElementById('time-active');
        this.targetDisplay = document.getElementById('time-target');
        this.roundDisplay = document.getElementById('time-round');
        this.totalRoundsDisplay = document.getElementById('time-total-rounds');
        this.elapsedDisplay = document.getElementById('time-elapsed');
        this.stopBtn = document.getElementById('time-stop-btn');
        this.cancelBtn = document.getElementById('time-cancel');

        // Mystery Mode active elements
        this.mysteryActivePanel = document.getElementById('time-mystery-active');
        this.mysteryRoundDisplay = document.getElementById('mystery-round');
        this.mysteryTotalRoundsDisplay = document.getElementById('mystery-total-rounds');
        this.mysteryCircle = document.querySelector('.mystery-circle');
        this.mysteryCancelBtn = document.getElementById('mystery-cancel');

        // Mystery Mode input elements
        this.mysteryInputPanel = document.getElementById('time-mystery-input');
        this.userGuessInput = document.getElementById('time-user-guess');
        this.submitGuessBtn = document.getElementById('time-submit-guess');

        // Results elements
        this.resultsPanel = document.getElementById('time-results');
        this.finalAccuracy = document.getElementById('time-final-accuracy');
        this.roundResults = document.getElementById('time-round-results');
        this.restartBtn = document.getElementById('time-restart');

        this.bindEvents();
    }

    bindEvents() {
        // Mode selection
        this.modeTargetBtn.addEventListener('click', () => this.setMode('target'));
        this.modeMysteryBtn.addEventListener('click', () => this.setMode('mystery'));

        // Start
        this.startBtn.addEventListener('click', () => this.start());

        // Target mode controls
        this.stopBtn.addEventListener('click', () => this.stopCounting());
        this.cancelBtn.addEventListener('click', () => this.cancel());

        // Mystery mode controls
        this.mysteryCancelBtn.addEventListener('click', () => this.cancel());
        this.submitGuessBtn.addEventListener('click', () => this.submitMysteryGuess());

        // Enter key for mystery input
        this.userGuessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitMysteryGuess();
            }
        });

        // Keyboard support for target mode
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isRunning && !this.mysteryActivePanel.classList.contains('hidden')) {
                e.preventDefault();
                return; // Mystery mode uses space differently
            }
            if (e.code === 'Space' && this.isRunning && !this.activePanel.classList.contains('hidden')) {
                e.preventDefault();
                this.stopCounting();
            }
        });

        this.restartBtn.addEventListener('click', () => this.reset());
    }

    setMode(mode) {
        this.mode = mode;

        // Update UI
        this.modeTargetBtn.classList.toggle('active', mode === 'target');
        this.modeMysteryBtn.classList.toggle('active', mode === 'mystery');

        // Show/hide blind mode option (only for target mode)
        if (this.blindModeOption) {
            this.blindModeOption.style.display = mode === 'target' ? 'block' : 'none';
        }

        // Re-initialize icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    start() {
        // Read settings
        this.settings.minTime = parseInt(this.minTimeInput.value) || 10;
        this.settings.maxTime = parseInt(this.maxTimeInput.value) || 60;
        this.settings.rounds = parseInt(this.roundsInput.value) || 5;
        this.settings.blindMode = this.blindModeCheckbox.checked;

        // Validate
        if (this.settings.minTime >= this.settings.maxTime) {
            this.settings.maxTime = this.settings.minTime + 10;
        }

        // Initialize
        audio.init();
        this.currentRound = 0;
        this.results = [];
        this.isRunning = true;
        this.sessionStartTime = Date.now();

        // Hide settings
        this.settingsPanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');

        // Start first round based on mode
        this.startRound();
    }

    startRound() {
        this.currentRound++;

        // Generate random target time
        this.targetTime = this.settings.minTime +
            Math.floor(Math.random() * (this.settings.maxTime - this.settings.minTime + 1));

        this.startTime = Date.now();
        this.elapsedTime = 0;

        if (this.mode === 'target') {
            this.startTargetRound();
        } else {
            this.startMysteryRound();
        }
    }

    startTargetRound() {
        // Show target mode panel
        this.activePanel.classList.remove('hidden');
        this.mysteryActivePanel.classList.add('hidden');
        this.mysteryInputPanel.classList.add('hidden');

        // Update display
        this.targetDisplay.textContent = this.targetTime;
        this.roundDisplay.textContent = this.currentRound;
        this.totalRoundsDisplay.textContent = this.settings.rounds;

        // Reset elapsed visual
        const visual = this.elapsedDisplay.querySelector('.elapsed-visual');
        if (visual) visual.style.width = '0%';

        // Apply blind mode
        if (this.settings.blindMode) {
            this.elapsedDisplay.classList.add('blind');
        } else {
            this.elapsedDisplay.classList.remove('blind');
        }

        // Start visual timer
        this.timerInterval = setInterval(() => this.updateElapsedVisual(), 100);
    }

    startMysteryRound() {
        // Show mystery mode panel
        this.mysteryActivePanel.classList.remove('hidden');
        this.activePanel.classList.add('hidden');
        this.mysteryInputPanel.classList.add('hidden');

        // Update display
        this.mysteryRoundDisplay.textContent = this.currentRound;
        this.mysteryTotalRoundsDisplay.textContent = this.settings.rounds;

        // Reset circle visual
        if (this.mysteryCircle) {
            this.mysteryCircle.classList.remove('signal');
        }

        // Set timeout for the random time to elapse
        this.mysteryTimeout = setTimeout(() => {
            this.mysteryTimeUp();
        }, this.targetTime * 1000);
    }

    updateElapsedVisual() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const progress = Math.min((elapsed / this.targetTime) * 100, 150); // Allow overshoot

        const visual = this.elapsedDisplay.querySelector('.elapsed-visual');
        if (visual) {
            visual.style.width = `${Math.min(progress, 100)}%`;
            visual.style.backgroundColor = progress > 100 ? 'var(--warning)' : 'var(--accent)';
        }
    }

    stopCounting() {
        if (!this.isRunning) return;

        clearInterval(this.timerInterval);

        const elapsed = (Date.now() - this.startTime) / 1000;
        const accuracy = this.calculateAccuracy(this.targetTime, elapsed);

        // Record result
        this.results.push({
            round: this.currentRound,
            target: this.targetTime,
            actual: Math.round(elapsed * 10) / 10,
            accuracy: accuracy
        });

        // Feedback
        if (accuracy >= 90) {
            audio.playSuccess();
        } else if (accuracy >= 70) {
            audio.playBeep(500, 0.1);
        } else {
            audio.playError();
        }

        // Next round or complete
        if (this.currentRound < this.settings.rounds) {
            setTimeout(() => this.startRound(), 1000);
        } else {
            this.complete();
        }
    }

    mysteryTimeUp() {
        if (!this.isRunning) return;

        // Record actual elapsed time
        this.elapsedTime = this.targetTime;

        // Play signal
        audio.playBell('singing-bowl');

        // Visual signal
        if (this.mysteryCircle) {
            this.mysteryCircle.classList.add('signal');
        }

        // Show input panel after short delay
        setTimeout(() => {
            this.mysteryActivePanel.classList.add('hidden');
            this.mysteryInputPanel.classList.remove('hidden');
            this.userGuessInput.value = '';
            this.userGuessInput.focus();
        }, 500);
    }

    submitMysteryGuess() {
        const userGuess = parseInt(this.userGuessInput.value);

        if (isNaN(userGuess) || userGuess < 1) {
            this.userGuessInput.classList.add('error');
            return;
        }

        this.userGuessInput.classList.remove('error');

        const accuracy = this.calculateAccuracy(this.targetTime, userGuess);

        // Record result
        this.results.push({
            round: this.currentRound,
            target: this.targetTime,
            actual: userGuess,
            accuracy: accuracy,
            mode: 'mystery'
        });

        // Feedback
        if (accuracy >= 90) {
            audio.playSuccess();
        } else if (accuracy >= 70) {
            audio.playBeep(500, 0.1);
        } else {
            audio.playError();
        }

        // Next round or complete
        if (this.currentRound < this.settings.rounds) {
            setTimeout(() => this.startRound(), 1000);
        } else {
            this.complete();
        }
    }

    calculateAccuracy(target, actual) {
        const error = Math.abs(target - actual);
        const accuracy = Math.max(0, 100 - (error / target) * 100);
        return Math.round(accuracy);
    }

    cancel() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearTimeout(this.mysteryTimeout);
        this.reset();
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearTimeout(this.mysteryTimeout);

        const totalDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const avgAccuracy = Math.round(
            this.results.reduce((sum, r) => sum + r.accuracy, 0) / this.results.length
        );

        // Record session
        analytics.recordSession('time-estimation', totalDuration, avgAccuracy, {
            mode: this.mode,
            rounds: this.settings.rounds,
            results: this.results
        });

        // Hide all active panels
        this.activePanel.classList.add('hidden');
        this.mysteryActivePanel.classList.add('hidden');
        this.mysteryInputPanel.classList.add('hidden');

        // Show results
        this.resultsPanel.classList.remove('hidden');
        this.finalAccuracy.textContent = `${avgAccuracy}%`;

        // Color code
        if (avgAccuracy >= 90) {
            this.finalAccuracy.style.color = 'var(--success)';
        } else if (avgAccuracy >= 70) {
            this.finalAccuracy.style.color = 'var(--warning)';
        } else {
            this.finalAccuracy.style.color = 'var(--error)';
        }

        // Build round results
        this.roundResults.innerHTML = this.results.map(r => {
            const accClass = r.accuracy >= 90 ? 'good' : (r.accuracy >= 70 ? 'ok' : 'poor');
            const actualLabel = this.mode === 'mystery' ? 'Your guess' : 'You stopped at';
            return `
                <div class="round-result-item">
                    <span class="target">Round ${r.round}: ${r.target}s target</span>
                    <span class="actual">${actualLabel}: ${r.actual}s</span>
                    <span class="accuracy ${accClass}">${r.accuracy}%</span>
                </div>
            `;
        }).join('');

        // Play completion sound
        audio.playBell('gentle');

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    reset() {
        clearInterval(this.timerInterval);
        clearTimeout(this.mysteryTimeout);

        this.activePanel.classList.add('hidden');
        this.mysteryActivePanel.classList.add('hidden');
        this.mysteryInputPanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');
        this.settingsPanel.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
let timeEstimation;
document.addEventListener('DOMContentLoaded', () => {
    timeEstimation = new TimeEstimation();
});
