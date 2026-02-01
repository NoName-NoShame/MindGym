/**
 * SART Test (Sustained Attention to Response Task)
 * A validated psychological test for inhibition control
 * Press SPACE for every number EXCEPT the target number
 */

class SARTTest {
    constructor() {
        this.isRunning = false;
        this.settings = {
            targetNumber: 3,
            speed: 'normal', // slow, normal, fast, expert
            totalTrials: 45
        };
        this.speedMap = {
            slow: 1200,
            normal: 900,
            fast: 600,
            expert: 400
        };
        this.currentTrial = 0;
        this.currentNumber = null;
        this.trialSequence = [];
        this.responseTimes = [];
        this.stats = {
            correct: 0,
            commissionErrors: 0, // Pressed on target (should have inhibited)
            omissionErrors: 0,   // Didn't press on non-target (should have pressed)
        };
        this.responded = false;
        this.trialStartTime = 0;
        this.trialTimeout = null;
        this.sessionStartTime = 0;

        this.init();
    }

    init() {
        // Settings elements
        this.targetSelect = document.getElementById('sart-target');
        this.speedSelect = document.getElementById('sart-speed');
        this.trialsInput = document.getElementById('sart-trials');
        this.startBtn = document.getElementById('focus-start');

        // Active elements
        this.settingsPanel = document.getElementById('focus-settings');
        this.activePanel = document.getElementById('focus-active');
        this.resultsPanel = document.getElementById('focus-results');

        this.currentDisplay = document.getElementById('sart-current');
        this.totalDisplay = document.getElementById('sart-total');
        this.numberDisplay = document.getElementById('sart-number');
        this.maskDisplay = document.getElementById('sart-mask');
        this.targetDisplay = document.getElementById('sart-target-display');
        this.feedbackDisplay = document.getElementById('sart-feedback');

        this.correctDisplay = document.getElementById('sart-correct');
        this.commissionDisplay = document.getElementById('sart-commission');
        this.omissionDisplay = document.getElementById('sart-omission');

        this.cancelBtn = document.getElementById('sart-cancel');

        // Results elements
        this.finalAccuracy = document.getElementById('focus-final-accuracy');
        this.finalCorrect = document.getElementById('sart-final-correct');
        this.finalCommission = document.getElementById('sart-final-commission');
        this.finalOmission = document.getElementById('sart-final-omission');
        this.finalRT = document.getElementById('sart-final-rt');
        this.finalTime = document.getElementById('focus-final-time');
        this.restartBtn = document.getElementById('focus-restart');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.cancelBtn.addEventListener('click', () => this.cancel());
        this.restartBtn.addEventListener('click', () => this.reset());

        // Keyboard listener for SPACE
        this.keyHandler = (e) => {
            if (e.code === 'Space' && this.isRunning && !this.responded) {
                e.preventDefault();
                this.handleResponse();
            }
        };
    }

    generateTrialSequence() {
        // Generate a pseudo-random sequence with target appearing ~11% of the time (1 in 9)
        this.trialSequence = [];

        for (let i = 0; i < this.settings.totalTrials; i++) {
            // Each trial, pick a random number 1-9
            const num = Math.floor(Math.random() * 9) + 1;
            this.trialSequence.push(num);
        }

        // Ensure we have a reasonable number of targets (at least ~10%)
        const targetCount = this.trialSequence.filter(n => n === this.settings.targetNumber).length;
        const minTargets = Math.floor(this.settings.totalTrials * 0.1);

        if (targetCount < minTargets) {
            // Add more targets at random positions
            const needed = minTargets - targetCount;
            for (let i = 0; i < needed; i++) {
                const pos = Math.floor(Math.random() * this.settings.totalTrials);
                this.trialSequence[pos] = this.settings.targetNumber;
            }
        }
    }

    start() {
        // Read settings
        this.settings.targetNumber = parseInt(this.targetSelect.value);
        this.settings.speed = this.speedSelect.value;
        this.settings.totalTrials = parseInt(this.trialsInput.value) || 45;

        // Initialize
        audio.init();
        this.currentTrial = 0;
        this.stats = { correct: 0, commissionErrors: 0, omissionErrors: 0 };
        this.responseTimes = [];
        this.isRunning = true;
        this.sessionStartTime = Date.now();

        // Generate trial sequence
        this.generateTrialSequence();

        // Update UI
        this.settingsPanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');
        this.activePanel.classList.remove('hidden');

        this.totalDisplay.textContent = this.settings.totalTrials;
        this.targetDisplay.textContent = this.settings.targetNumber;
        this.numberDisplay.textContent = '-';
        this.feedbackDisplay.textContent = '';
        this.feedbackDisplay.className = 'sart-feedback';
        this.updateStatsDisplay();

        // Add keyboard listener
        document.addEventListener('keydown', this.keyHandler);

        // Start after brief delay
        setTimeout(() => this.runTrial(), 1000);
    }

    runTrial() {
        if (!this.isRunning) return;

        if (this.currentTrial >= this.settings.totalTrials) {
            this.complete();
            return;
        }

        // Get current number
        this.currentNumber = this.trialSequence[this.currentTrial];
        this.currentTrial++;
        this.responded = false;
        this.trialStartTime = Date.now();

        // Update display
        this.currentDisplay.textContent = this.currentTrial;
        this.numberDisplay.textContent = this.currentNumber;
        this.numberDisplay.className = 'sart-number';
        this.feedbackDisplay.textContent = '';
        this.feedbackDisplay.className = 'sart-feedback';

        // Show mask briefly after stimulus
        const stimulusDuration = this.speedMap[this.settings.speed] * 0.25; // Show number for 25% of interval
        const maskDuration = this.speedMap[this.settings.speed] * 0.75;     // Mask for remaining 75%

        // Set trial timeout (for detecting omission errors)
        this.trialTimeout = setTimeout(() => {
            if (!this.responded) {
                // Time's up - check if this was an error
                if (this.currentNumber !== this.settings.targetNumber) {
                    // Should have pressed but didn't = omission error
                    this.stats.omissionErrors++;
                    this.showFeedback('Missed!', 'error');
                    audio.playError();
                } else {
                    // Correctly inhibited response
                    this.stats.correct++;
                    this.showFeedback('✓ Good!', 'correct');
                }
                this.updateStatsDisplay();
            }

            // Show mask
            this.numberDisplay.textContent = '';
            this.maskDisplay.textContent = '×';
            this.maskDisplay.classList.add('visible');

            setTimeout(() => {
                this.maskDisplay.classList.remove('visible');
                this.maskDisplay.textContent = '';
                this.runTrial();
            }, maskDuration);

        }, stimulusDuration);
    }

    handleResponse() {
        if (!this.isRunning || this.responded) return;

        this.responded = true;
        const responseTime = Date.now() - this.trialStartTime;

        if (this.currentNumber === this.settings.targetNumber) {
            // Pressed on target = commission error (failed to inhibit)
            this.stats.commissionErrors++;
            this.showFeedback('Don\'t press for ' + this.settings.targetNumber + '!', 'error');
            this.numberDisplay.classList.add('flash-error');
            audio.playError();
        } else {
            // Correctly pressed on non-target
            this.stats.correct++;
            this.responseTimes.push(responseTime);
            this.showFeedback('✓', 'correct');
            this.numberDisplay.classList.add('flash-correct');
        }

        this.updateStatsDisplay();
    }

    showFeedback(message, type) {
        this.feedbackDisplay.textContent = message;
        this.feedbackDisplay.className = `sart-feedback ${type}`;
    }

    updateStatsDisplay() {
        this.correctDisplay.textContent = this.stats.correct;
        this.commissionDisplay.textContent = this.stats.commissionErrors;
        this.omissionDisplay.textContent = this.stats.omissionErrors;
    }

    cancel() {
        this.isRunning = false;
        clearTimeout(this.trialTimeout);
        document.removeEventListener('keydown', this.keyHandler);
        this.reset();
    }

    complete() {
        this.isRunning = false;
        clearTimeout(this.trialTimeout);
        document.removeEventListener('keydown', this.keyHandler);

        const totalDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const totalTrials = this.settings.totalTrials;
        const accuracy = Math.round((this.stats.correct / totalTrials) * 100);

        // Calculate average response time
        const avgRT = this.responseTimes.length > 0
            ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
            : 0;

        // Record session with full details
        analytics.recordSession('focus-counter', totalDuration, accuracy, {
            testType: 'SART',
            targetNumber: this.settings.targetNumber,
            speed: this.settings.speed,
            totalTrials: totalTrials,
            correct: this.stats.correct,
            commissionErrors: this.stats.commissionErrors,
            omissionErrors: this.stats.omissionErrors,
            avgResponseTime: avgRT,
            responseTimes: this.responseTimes
        });

        // Show results
        this.activePanel.classList.add('hidden');
        this.resultsPanel.classList.remove('hidden');

        this.finalAccuracy.textContent = `${accuracy}%`;
        this.finalCorrect.textContent = this.stats.correct;
        this.finalCommission.textContent = this.stats.commissionErrors;
        this.finalOmission.textContent = this.stats.omissionErrors;
        this.finalRT.textContent = `${avgRT}ms`;
        this.finalTime.textContent = `${totalDuration}s`;

        // Color code accuracy
        if (accuracy >= 90) {
            this.finalAccuracy.style.color = 'var(--success)';
            audio.playSuccess();
        } else if (accuracy >= 70) {
            this.finalAccuracy.style.color = 'var(--warning)';
            audio.playBell('gentle');
        } else {
            this.finalAccuracy.style.color = 'var(--error)';
            audio.playBell('gentle');
        }

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    reset() {
        clearTimeout(this.trialTimeout);
        document.removeEventListener('keydown', this.keyHandler);

        this.activePanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');
        this.settingsPanel.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
let sartTest;
document.addEventListener('DOMContentLoaded', () => {
    sartTest = new SARTTest();
});
