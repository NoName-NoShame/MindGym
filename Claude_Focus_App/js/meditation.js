/**
 * Guided Meditation Module
 * Text-based guided meditation sessions
 */

class GuidedMeditation {
    constructor() {
        this.isPlaying = false;
        this.currentMeditation = null;
        this.currentStep = 0;
        this.stepTimeout = null;
        this.startTime = 0;
        this.totalDuration = 0;

        // Pre-built meditation programs
        this.meditations = [
            {
                id: 'breathing-basics',
                title: 'Breathing Basics',
                description: 'A simple breathing exercise to calm your mind',
                duration: 5,
                icon: 'wind',
                steps: [
                    { text: 'Find a comfortable position and close your eyes.', duration: 5 },
                    { text: 'Take a deep breath in through your nose...', duration: 4 },
                    { text: 'Hold...', duration: 4 },
                    { text: 'Slowly exhale through your mouth...', duration: 6 },
                    { text: 'Feel your body relax with each breath.', duration: 5 },
                    { text: 'Breathe in deeply...', duration: 4 },
                    { text: 'Hold...', duration: 4 },
                    { text: 'Release slowly...', duration: 6 },
                    { text: 'Let go of any tension in your shoulders.', duration: 5 },
                    { text: 'Continue breathing naturally.', duration: 5 },
                    { text: 'With each exhale, release any stress.', duration: 6 },
                    { text: 'Breathe in calm...', duration: 4 },
                    { text: 'Breathe out tension...', duration: 5 },
                    { text: 'Feel yourself becoming more relaxed.', duration: 6 },
                    { text: 'Take one final deep breath...', duration: 4 },
                    { text: 'Hold...', duration: 3 },
                    { text: 'And release completely.', duration: 5 },
                    { text: 'When you\'re ready, gently open your eyes.', duration: 5 }
                ]
            },
            {
                id: 'body-scan',
                title: 'Body Scan Relaxation',
                description: 'Progressive relaxation from head to toe',
                duration: 8,
                icon: 'user',
                steps: [
                    { text: 'Settle into a comfortable position.', duration: 5 },
                    { text: 'Close your eyes and take three deep breaths.', duration: 8 },
                    { text: 'Bring your attention to the top of your head.', duration: 5 },
                    { text: 'Notice any tension and let it melt away.', duration: 6 },
                    { text: 'Move your awareness to your forehead.', duration: 5 },
                    { text: 'Soften the muscles around your eyes.', duration: 5 },
                    { text: 'Relax your jaw, letting it drop slightly.', duration: 5 },
                    { text: 'Feel the relaxation flow down your neck.', duration: 6 },
                    { text: 'Release any tension in your shoulders.', duration: 6 },
                    { text: 'Let your arms feel heavy and relaxed.', duration: 5 },
                    { text: 'Notice your hands, letting them soften.', duration: 5 },
                    { text: 'Bring awareness to your chest.', duration: 5 },
                    { text: 'Feel it rise and fall with each breath.', duration: 6 },
                    { text: 'Relax your stomach and lower back.', duration: 6 },
                    { text: 'Let the relaxation spread through your hips.', duration: 5 },
                    { text: 'Feel your legs becoming heavy and warm.', duration: 6 },
                    { text: 'Relax your feet, each toe releasing tension.', duration: 6 },
                    { text: 'Your whole body is now deeply relaxed.', duration: 6 },
                    { text: 'Rest in this peaceful state.', duration: 8 },
                    { text: 'Slowly begin to wiggle your fingers and toes.', duration: 5 },
                    { text: 'When ready, gently open your eyes.', duration: 5 }
                ]
            },
            {
                id: 'focus-anchor',
                title: 'Focus Anchor',
                description: 'Build concentration through single-point focus',
                duration: 6,
                icon: 'target',
                steps: [
                    { text: 'Sit comfortably with your back straight.', duration: 5 },
                    { text: 'Take three slow, deep breaths.', duration: 8 },
                    { text: 'Choose a point to focus on - your breath.', duration: 5 },
                    { text: 'Notice the sensation of air entering your nose.', duration: 6 },
                    { text: 'Follow the breath as it fills your lungs.', duration: 5 },
                    { text: 'Feel the pause at the top of the inhale.', duration: 4 },
                    { text: 'Notice the release as you exhale.', duration: 5 },
                    { text: 'Keep your attention on this one thing.', duration: 6 },
                    { text: 'When your mind wanders, gently return.', duration: 6 },
                    { text: 'No judgment, just redirect your focus.', duration: 5 },
                    { text: 'Each return to focus strengthens your mind.', duration: 6 },
                    { text: 'Continue watching your breath.', duration: 8 },
                    { text: 'In... and out...', duration: 6 },
                    { text: 'Steady and calm.', duration: 5 },
                    { text: 'Your focus is your anchor.', duration: 5 },
                    { text: 'Rest in this concentrated state.', duration: 8 },
                    { text: 'Gradually expand your awareness.', duration: 5 },
                    { text: 'Notice the room around you.', duration: 5 },
                    { text: 'Open your eyes when ready.', duration: 5 }
                ]
            },
            {
                id: 'calm-mind',
                title: 'Calm Mind',
                description: 'Quiet the mental chatter',
                duration: 7,
                icon: 'cloud',
                steps: [
                    { text: 'Find stillness in your body.', duration: 5 },
                    { text: 'Close your eyes and breathe naturally.', duration: 6 },
                    { text: 'Imagine your thoughts as clouds in the sky.', duration: 6 },
                    { text: 'Watch them drift by without attachment.', duration: 7 },
                    { text: 'You are the sky, vast and unchanging.', duration: 6 },
                    { text: 'Thoughts come and go, but you remain.', duration: 7 },
                    { text: 'Let each thought float away.', duration: 6 },
                    { text: 'Don\'t chase them, don\'t push them away.', duration: 6 },
                    { text: 'Simply observe with gentle awareness.', duration: 7 },
                    { text: 'Notice the spaces between thoughts.', duration: 6 },
                    { text: 'Rest in those quiet moments.', duration: 7 },
                    { text: 'The gaps grow wider...', duration: 6 },
                    { text: 'Peace fills the space.', duration: 6 },
                    { text: 'Your mind becomes still like a calm lake.', duration: 7 },
                    { text: 'Reflect this inner peace outward.', duration: 6 },
                    { text: 'Carry this calm with you.', duration: 6 },
                    { text: 'Slowly return to the present moment.', duration: 5 },
                    { text: 'Open your eyes, refreshed and clear.', duration: 5 }
                ]
            },
            {
                id: 'gratitude',
                title: 'Gratitude Practice',
                description: 'Cultivate appreciation and positive feelings',
                duration: 6,
                icon: 'heart',
                steps: [
                    { text: 'Settle into a comfortable position.', duration: 5 },
                    { text: 'Take a few deep breaths to center yourself.', duration: 6 },
                    { text: 'Bring to mind something you\'re grateful for.', duration: 7 },
                    { text: 'It can be something small or significant.', duration: 6 },
                    { text: 'Feel the warmth of gratitude in your heart.', duration: 7 },
                    { text: 'Let this feeling expand in your chest.', duration: 6 },
                    { text: 'Think of a person you appreciate.', duration: 6 },
                    { text: 'Silently thank them for their presence.', duration: 7 },
                    { text: 'Feel your connection to them.', duration: 6 },
                    { text: 'Now think of your body.', duration: 5 },
                    { text: 'Thank it for carrying you through each day.', duration: 7 },
                    { text: 'Appreciate your breath, your heartbeat.', duration: 6 },
                    { text: 'Extend gratitude to this moment.', duration: 6 },
                    { text: 'Right here, right now, you are alive.', duration: 6 },
                    { text: 'Let gratitude fill your entire being.', duration: 7 },
                    { text: 'Carry this appreciation with you.', duration: 6 },
                    { text: 'Slowly open your eyes.', duration: 4 },
                    { text: 'Face the world with a grateful heart.', duration: 5 }
                ]
            }
        ];

        this.init();
    }

    init() {
        this.listContainer = document.getElementById('meditation-list');
        this.playerContainer = document.getElementById('meditation-player');
        this.titleDisplay = document.getElementById('meditation-title');
        this.descriptionDisplay = document.getElementById('meditation-description');
        this.textDisplay = document.getElementById('player-text');
        this.progressFill = document.getElementById('meditation-progress');
        this.timeDisplay = document.getElementById('meditation-time');
        this.breathingCircle = document.getElementById('breathing-circle');
        this.backBtn = document.getElementById('meditation-back');
        this.toggleBtn = document.getElementById('meditation-toggle');

        this.renderList();
        this.bindEvents();
    }

    renderList() {
        this.listContainer.innerHTML = this.meditations.map(med => `
            <div class="meditation-card" data-id="${med.id}">
                <div class="meditation-card-icon">
                    <i data-lucide="${med.icon}"></i>
                </div>
                <h4>${med.title}</h4>
                <p>${med.description}</p>
                <div class="meditation-duration">
                    <i data-lucide="clock"></i>
                    ${med.duration} minutes
                </div>
            </div>
        `).join('');

        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    bindEvents() {
        // Card clicks
        this.listContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.meditation-card');
            if (card) {
                const id = card.dataset.id;
                const meditation = this.meditations.find(m => m.id === id);
                if (meditation) {
                    this.startMeditation(meditation);
                }
            }
        });

        this.backBtn.addEventListener('click', () => this.stopMeditation());
        this.toggleBtn.addEventListener('click', () => this.togglePause());
    }

    startMeditation(meditation) {
        audio.init();

        this.currentMeditation = meditation;
        this.currentStep = 0;
        this.isPlaying = true;
        this.startTime = Date.now();

        // Calculate total duration
        this.totalDuration = meditation.steps.reduce((sum, step) => sum + step.duration, 0);

        // Show player
        this.listContainer.classList.add('hidden');
        this.playerContainer.classList.remove('hidden');

        // Update display
        this.titleDisplay.textContent = meditation.title;
        this.descriptionDisplay.textContent = meditation.description;
        this.updateToggleIcon();

        // Start first step
        this.showStep();
    }

    showStep() {
        if (!this.isPlaying || !this.currentMeditation) return;

        const step = this.currentMeditation.steps[this.currentStep];
        if (!step) {
            this.completeMeditation();
            return;
        }

        // Update text
        this.textDisplay.textContent = step.text;

        // Update progress
        this.updateProgress();

        // Play soft bell occasionally
        if (this.currentStep > 0 && this.currentStep % 5 === 0) {
            audio.playBell('gentle');
        }

        // Schedule next step
        this.stepTimeout = setTimeout(() => {
            this.currentStep++;
            this.showStep();
        }, step.duration * 1000);
    }

    updateProgress() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const progress = (elapsed / this.totalDuration) * 100;
        this.progressFill.style.width = `${Math.min(progress, 100)}%`;

        const elapsedMins = Math.floor(elapsed / 60);
        const elapsedSecs = Math.floor(elapsed % 60);
        const totalMins = Math.floor(this.totalDuration / 60);
        const totalSecs = Math.floor(this.totalDuration % 60);

        this.timeDisplay.textContent =
            `${elapsedMins}:${elapsedSecs.toString().padStart(2, '0')} / ${totalMins}:${totalSecs.toString().padStart(2, '0')}`;
    }

    togglePause() {
        if (this.isPlaying) {
            this.isPlaying = false;
            clearTimeout(this.stepTimeout);
        } else {
            this.isPlaying = true;
            const step = this.currentMeditation.steps[this.currentStep];
            if (step) {
                this.stepTimeout = setTimeout(() => {
                    this.currentStep++;
                    this.showStep();
                }, step.duration * 1000 / 2); // Resume with half remaining
            }
        }
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        const icon = this.toggleBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', this.isPlaying ? 'pause' : 'play');
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    stopMeditation() {
        this.isPlaying = false;
        clearTimeout(this.stepTimeout);

        // Record partial session if they exit early
        if (this.currentStep > 0) {
            const elapsed = Math.round((Date.now() - this.startTime) / 1000);
            analytics.recordSession('meditation', elapsed, null, {
                meditation: this.currentMeditation.id,
                completed: false,
                stepsCompleted: this.currentStep
            });
        }

        // Hide player
        this.playerContainer.classList.add('hidden');
        this.listContainer.classList.remove('hidden');

        // Update dashboard
        if (window.app) {
            window.app.updateDashboard();
        }
    }

    completeMeditation() {
        this.isPlaying = false;

        const elapsed = Math.round((Date.now() - this.startTime) / 1000);

        // Play completion bell
        audio.playBell('singing-bowl');

        // Record session
        analytics.recordSession('meditation', elapsed, null, {
            meditation: this.currentMeditation.id,
            completed: true
        });

        // Show completion message
        this.textDisplay.textContent = 'Session complete. Namaste. 🙏';
        this.progressFill.style.width = '100%';

        // Return to list after delay
        setTimeout(() => {
            this.playerContainer.classList.add('hidden');
            this.listContainer.classList.remove('hidden');

            // Update dashboard
            if (window.app) {
                window.app.updateDashboard();
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
let guidedMeditation;
document.addEventListener('DOMContentLoaded', () => {
    guidedMeditation = new GuidedMeditation();
});
