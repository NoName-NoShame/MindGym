/**
 * Memory Sequence Module
 * Simon-style pattern memory game
 */

class MemorySequence {
    constructor() {
        this.isRunning = false;
        this.settings = {
            gridSize: 3,
            speed: 'normal'
        };
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.isShowingPattern = false;
        this.speedMs = {
            slow: 800,
            normal: 500,
            fast: 300
        };

        this.init();
    }

    init() {
        // Settings elements
        this.gridSizeSelect = document.getElementById('memory-grid-size');
        this.speedSelect = document.getElementById('memory-speed');
        this.startBtn = document.getElementById('memory-start');

        // Active elements
        this.settingsPanel = document.getElementById('memory-settings');
        this.activePanel = document.getElementById('memory-active');
        this.resultsPanel = document.getElementById('memory-results');
        this.levelDisplay = document.getElementById('memory-level');
        this.statusDisplay = document.getElementById('memory-status');
        this.gridContainer = document.getElementById('memory-grid');

        // Results elements
        this.finalLevelDisplay = document.getElementById('memory-final-level');
        this.restartBtn = document.getElementById('memory-restart');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.reset());
    }

    start() {
        // Read settings
        this.settings.gridSize = parseInt(this.gridSizeSelect.value) || 3;
        this.settings.speed = this.speedSelect.value || 'normal';

        // Initialize
        audio.init();
        this.level = 1;
        this.sequence = [];
        this.playerSequence = [];
        this.isRunning = true;
        this.sessionStartTime = Date.now();

        // Show active panel
        this.settingsPanel.classList.add('hidden');
        this.activePanel.classList.remove('hidden');
        this.resultsPanel.classList.add('hidden');

        // Create grid
        this.createGrid();

        // Start first level
        this.startLevel();
    }

    createGrid() {
        const size = this.settings.gridSize;
        this.gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.gridContainer.innerHTML = '';

        const totalCells = size * size;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'memory-cell disabled';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleCellClick(i));
            this.gridContainer.appendChild(cell);
        }
    }

    startLevel() {
        this.levelDisplay.textContent = this.level;
        this.statusDisplay.textContent = 'Watch the pattern...';
        this.playerSequence = [];

        // Disable cells during pattern display
        this.setCellsDisabled(true);

        // Add one to sequence
        const totalCells = this.settings.gridSize * this.settings.gridSize;
        this.sequence.push(Math.floor(Math.random() * totalCells));

        // Show pattern after a brief delay
        setTimeout(() => this.showPattern(), 500);
    }

    async showPattern() {
        this.isShowingPattern = true;
        const speed = this.speedMs[this.settings.speed];
        const cells = this.gridContainer.querySelectorAll('.memory-cell');

        for (let i = 0; i < this.sequence.length; i++) {
            const cellIndex = this.sequence[i];
            const cell = cells[cellIndex];

            // Highlight cell
            cell.classList.add('active');
            audio.playBeep(400 + (cellIndex * 50), 0.15);

            await this.sleep(speed);

            cell.classList.remove('active');

            await this.sleep(speed / 2);
        }

        this.isShowingPattern = false;
        this.statusDisplay.textContent = 'Your turn! Repeat the pattern';
        this.setCellsDisabled(false);
    }

    handleCellClick(index) {
        if (!this.isRunning || this.isShowingPattern) return;

        const cells = this.gridContainer.querySelectorAll('.memory-cell');
        const cell = cells[index];

        // Visual feedback
        cell.classList.add('active');
        audio.playBeep(400 + (index * 50), 0.1);
        setTimeout(() => cell.classList.remove('active'), 200);

        // Record player input
        this.playerSequence.push(index);

        // Check if correct
        const currentStep = this.playerSequence.length - 1;
        if (this.playerSequence[currentStep] !== this.sequence[currentStep]) {
            // Wrong!
            this.gameOver(false);
            return;
        }

        // Check if level complete
        if (this.playerSequence.length === this.sequence.length) {
            // Level complete!
            audio.playSuccess();
            this.statusDisplay.textContent = 'Correct! Next level...';
            this.level++;
            this.setCellsDisabled(true);

            setTimeout(() => this.startLevel(), 1000);
        }
    }

    gameOver(success) {
        this.isRunning = false;

        if (!success) {
            audio.playError();
            this.statusDisplay.textContent = 'Wrong! Game over.';

            // Show correct cell
            const cells = this.gridContainer.querySelectorAll('.memory-cell');
            const correctIndex = this.sequence[this.playerSequence.length - 1];
            cells[correctIndex].classList.add('correct');
            cells[this.playerSequence[this.playerSequence.length - 1]].classList.add('wrong');
        }

        setTimeout(() => this.complete(), 1500);
    }

    complete() {
        const totalDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const finalLevel = this.level - 1; // Subtract 1 as they failed at current level

        // Record session
        analytics.recordSession('memory-sequence', totalDuration, null, {
            level: finalLevel,
            gridSize: this.settings.gridSize,
            speed: this.settings.speed
        });

        // Show results
        this.activePanel.classList.add('hidden');
        this.resultsPanel.classList.remove('hidden');

        this.finalLevelDisplay.textContent = finalLevel;

        // Play completion sound
        audio.playBell('gentle');

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    setCellsDisabled(disabled) {
        const cells = this.gridContainer.querySelectorAll('.memory-cell');
        cells.forEach(cell => {
            if (disabled) {
                cell.classList.add('disabled');
            } else {
                cell.classList.remove('disabled');
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.resultsPanel.classList.add('hidden');
        this.settingsPanel.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
let memorySequence;
document.addEventListener('DOMContentLoaded', () => {
    memorySequence = new MemorySequence();
});
