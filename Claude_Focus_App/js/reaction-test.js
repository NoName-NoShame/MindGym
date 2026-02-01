/**
 * Reaction Test Module
 * Measure and improve reaction time
 */

class ReactionTest {
    constructor() {
        this.isRunning = false;
        this.settings = {
            trials: 5,
            type: 'visual' // visual, audio, both
        };
        this.currentTrial = 0;
        this.results = [];
        this.state = 'idle'; // idle, waiting, ready, clicked
        this.waitTimeout = null;
        this.readyTime = 0;

        this.init();
    }

    init() {
        // Settings elements
        this.trialsInput = document.getElementById('reaction-trials');
        this.typeSelect = document.getElementById('reaction-type');
        this.startBtn = document.getElementById('reaction-start');

        // Active elements
        this.settingsPanel = document.getElementById('reaction-settings');
        this.activePanel = document.getElementById('reaction-active');
        this.resultsPanel = document.getElementById('reaction-results');
        this.reactionZone = document.getElementById('reaction-zone');
        this.promptDisplay = document.getElementById('reaction-prompt');
        this.trialDisplay = document.getElementById('reaction-trial');
        this.totalDisplay = document.getElementById('reaction-total');

        // Results elements
        this.avgDisplay = document.getElementById('reaction-avg');
        this.bestDisplay = document.getElementById('reaction-best');
        this.worstDisplay = document.getElementById('reaction-worst');
        this.trialResults = document.getElementById('reaction-trial-results');
        this.restartBtn = document.getElementById('reaction-restart');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.reactionZone.addEventListener('click', () => this.handleClick());
        this.restartBtn.addEventListener('click', () => this.reset());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.isRunning && e.code === 'Space') {
                e.preventDefault();
                this.handleClick();
            }
        });
    }

    start() {
        // Read settings
        this.settings.trials = parseInt(this.trialsInput.value) || 5;
        this.settings.type = this.typeSelect.value;

        // Initialize
        audio.init();
        this.currentTrial = 0;
        this.results = [];
        this.isRunning = true;
        this.sessionStartTime = Date.now();

        // Show active panel
        this.settingsPanel.classList.add('hidden');
        this.activePanel.classList.remove('hidden');
        this.resultsPanel.classList.add('hidden');

        this.totalDisplay.textContent = this.settings.trials;

        this.startTrial();
    }

    startTrial() {
        this.currentTrial++;
        this.trialDisplay.textContent = this.currentTrial;

        this.setState('waiting');

        // Random delay between 1.5 and 5 seconds
        const delay = Math.random() * 3500 + 1500;

        this.waitTimeout = setTimeout(() => {
            this.setState('ready');
        }, delay);
    }

    setState(state) {
        this.state = state;
        this.reactionZone.className = 'reaction-zone ' + state;

        switch (state) {
            case 'waiting':
                this.promptDisplay.textContent = 'Wait for green...';
                break;
            case 'ready':
                this.promptDisplay.textContent = 'Click NOW!';
                this.readyTime = Date.now();
                // Play audio cue if enabled
                if (this.settings.type === 'audio' || this.settings.type === 'both') {
                    audio.playBeep(800, 0.15);
                }
                break;
            case 'clicked':
                // Handled in handleClick
                break;
            case 'too-early':
                this.promptDisplay.textContent = 'Too early! Wait for green.';
                break;
        }
    }

    handleClick() {
        if (!this.isRunning) return;

        if (this.state === 'waiting') {
            // Too early
            clearTimeout(this.waitTimeout);
            this.setState('too-early');
            audio.playError();

            // Restart trial after delay
            setTimeout(() => {
                this.currentTrial--;
                this.startTrial();
            }, 1500);
            return;
        }

        if (this.state === 'ready') {
            const reactionTime = Date.now() - this.readyTime;
            this.results.push(reactionTime);

            this.setState('clicked');
            this.promptDisplay.textContent = `${reactionTime}ms`;
            audio.playSuccess();

            // Next trial or complete
            if (this.currentTrial < this.settings.trials) {
                setTimeout(() => this.startTrial(), 1500);
            } else {
                setTimeout(() => this.complete(), 1000);
            }
        }
    }

    complete() {
        this.isRunning = false;
        const totalDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);

        const avgTime = Math.round(
            this.results.reduce((a, b) => a + b, 0) / this.results.length
        );
        const bestTime = Math.min(...this.results);
        const worstTime = Math.max(...this.results);

        // Record session
        analytics.recordSession('reaction-test', totalDuration, null, {
            trials: this.results.length,
            avgTime,
            bestTime,
            worstTime,
            results: this.results
        });

        // Show results
        this.activePanel.classList.add('hidden');
        this.resultsPanel.classList.remove('hidden');

        this.avgDisplay.textContent = `${avgTime}ms`;
        this.bestDisplay.textContent = `${bestTime}ms`;
        this.worstDisplay.textContent = `${worstTime}ms`;

        // Build trial results
        this.trialResults.innerHTML = this.results.map((time, i) => {
            return `<div class="trial-result">#${i + 1}: ${time}ms</div>`;
        }).join('');

        // Play completion sound
        audio.playBell('gentle');

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    reset() {
        this.resultsPanel.classList.add('hidden');
        this.settingsPanel.classList.remove('hidden');
        this.reactionZone.className = 'reaction-zone';
    }
}

// Initialize when DOM is ready
let reactionTest;
document.addEventListener('DOMContentLoaded', () => {
    reactionTest = new ReactionTest();
});
