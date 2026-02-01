/**
 * Mind Gym - Main Application Controller
 */

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.charts = {};

        this.init();
    }

    init() {
        // Initialize Lucide icons
        lucide.createIcons();

        // Initialize audio on first interaction (iOS requires touch event)
        const initAudio = async () => {
            await audio.init();
            await audio.resume();
        };
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });

        // Navigation
        this.setupNavigation();

        // Quick actions
        this.setupQuickActions();

        // Settings
        this.setupSettings();

        // Analytics page
        this.setupAnalytics();

        // Mobile menu
        this.setupMobileMenu();

        // Update dashboard
        this.updateDashboard();

        // Apply saved theme
        this.applyTheme();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.navigateTo(view);
            });
        });
    }

    navigateTo(viewName) {
        // Clean up previous view if needed
        if (this.currentView === 'meditation-room' && meditationRoom) {
            meditationRoom.cleanup();
        }

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Show/hide views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // Close mobile menu
        document.getElementById('sidebar').classList.remove('open');

        // Update charts if navigating to analytics
        if (viewName === 'analytics') {
            this.updateAnalyticsCharts();
        }

        // Reinitialize icons
        lucide.createIcons();
    }

    setupQuickActions() {
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.navigateTo(action);
            });
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');

        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    setupSettings() {
        const settings = analytics.getSettings();

        // Master volume
        const volumeSlider = document.getElementById('master-volume');
        if (volumeSlider) {
            volumeSlider.value = settings.masterVolume;
            volumeSlider.addEventListener('input', () => {
                const volume = parseInt(volumeSlider.value);
                analytics.updateSettings({ masterVolume: volume });
                audio.setMasterVolume(volume / 100);
            });
        }

        // Sound effects toggle
        const soundEffectsCheckbox = document.getElementById('sound-effects');
        if (soundEffectsCheckbox) {
            soundEffectsCheckbox.checked = settings.soundEffects;
            soundEffectsCheckbox.addEventListener('change', () => {
                analytics.updateSettings({ soundEffects: soundEffectsCheckbox.checked });
            });
        }

        // Theme toggle
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = settings.theme || 'dark';
            themeSelect.addEventListener('change', () => {
                analytics.updateSettings({ theme: themeSelect.value });
                this.applyTheme();
            });
        }

        // Clear all data
        const clearBtn = document.getElementById('clear-all-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
                    analytics.clearAllData();
                    this.updateDashboard();
                    alert('All data has been cleared.');
                }
            });
        }
    }

    applyTheme() {
        const theme = analytics.getSettings().theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    setupAnalytics() {
        // Export data
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                analytics.exportData();
            });
        }

        // Import data
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const success = analytics.importData(event.target.result);
                        if (success) {
                            alert('Data imported successfully!');
                            this.updateDashboard();
                            this.updateAnalyticsCharts();
                        } else {
                            alert('Failed to import data. Please check the file format.');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    }

    updateDashboard() {
        // Update header stats
        const todayTime = analytics.getTodayTime();
        document.getElementById('today-time').textContent =
            todayTime < 60 ? `${todayTime}s` : `${Math.floor(todayTime / 60)}m`;

        document.getElementById('sessions-today').textContent =
            analytics.getTodaySessions().length;

        // Update streak display
        const streakCount = document.getElementById('streak-count');
        if (streakCount) {
            streakCount.textContent = analytics.data.streaks.current;
        }

        // Update dashboard stats
        document.getElementById('total-time').textContent =
            analytics.formatTotalTime(analytics.data.totals.timeSpent);
        document.getElementById('total-sessions').textContent =
            analytics.data.totals.sessionsCompleted;
        document.getElementById('current-streak').textContent =
            `${analytics.data.streaks.current} days`;
        document.getElementById('best-streak').textContent =
            `${analytics.data.streaks.longest} days`;

        // Update recent sessions
        this.updateRecentSessions();

        // Update weekly chart
        this.updateWeeklyChart();

        // Reinitialize icons
        lucide.createIcons();
    }

    updateRecentSessions() {
        const container = document.getElementById('recent-sessions');
        const sessions = analytics.getRecentSessions(5);

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No sessions yet. Start training!</p>';
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <span class="session-module">${session.moduleName}</span>
                    <span class="session-time">${session.formattedTime} • ${session.formattedDuration}</span>
                </div>
                ${session.score !== null ? `<span class="session-score">${session.score}%</span>` : ''}
            </div>
        `).join('');
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        const data = analytics.getWeeklyActivityData();

        // Destroy existing chart
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Minutes',
                    data: data.data,
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)'
                        }
                    }
                }
            }
        });
    }

    updateAnalyticsCharts() {
        // Update overview stats
        const totalTime = analytics.data.totals.timeSpent;
        const totalSessions = analytics.data.totals.sessionsCompleted;
        const avgSession = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;

        document.getElementById('analytics-total-time').textContent =
            analytics.formatTotalTime(totalTime);
        document.getElementById('analytics-total-sessions').textContent = totalSessions;
        document.getElementById('analytics-avg-session').textContent =
            `${Math.round(avgSession / 60)}m`;

        // Activity over time chart
        this.updateActivityChart();

        // Module breakdown chart
        this.updateModuleChart();

        // Performance trends chart
        this.updatePerformanceChart();

        // Session history
        this.updateSessionHistory();
    }

    updateActivityChart() {
        const ctx = document.getElementById('analytics-activity-chart');
        if (!ctx) return;

        // Get last 30 days of data
        const labels = [];
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const sessions = analytics.getSessionsByDateRange(date, nextDate);
            const minutes = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(Math.round(minutes * 10) / 10);
        }

        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Minutes',
                    data,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            maxTicksLimit: 7
                        }
                    }
                }
            }
        });
    }

    updateModuleChart() {
        const ctx = document.getElementById('analytics-module-chart');
        if (!ctx) return;

        const data = analytics.getModuleBreakdown();

        if (this.charts.modules) {
            this.charts.modules.destroy();
        }

        const colors = [
            '#6366f1', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];

        this.charts.modules = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: colors.slice(0, data.labels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: 10
                        }
                    }
                }
            }
        });
    }

    updatePerformanceChart() {
        const ctx = document.getElementById('analytics-performance-chart');
        if (!ctx) return;

        const data = analytics.getPerformanceTrends();

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Score %',
                    data: data.data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                    }
                }
            }
        });
    }

    updateSessionHistory() {
        const container = document.getElementById('session-history');
        if (!container) return;

        const sessions = analytics.getAllSessions().slice(0, 50);

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No session history yet.</p>';
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="history-item">
                <div>
                    <span class="history-module">${session.moduleName}</span>
                    <span class="history-date">${session.formattedDate}</span>
                </div>
                <span class="history-score">
                    ${session.score !== null ? session.score + '%' : session.formattedDuration}
                </span>
            </div>
        `).join('');
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // Make available globally for other modules
});
