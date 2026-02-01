/**
 * Analytics Engine - Persistent data storage and tracking
 */

class Analytics {
    constructor() {
        this.STORAGE_KEY = 'mindgym_analytics';
        this.data = this.load();
    }

    // Load data from localStorage
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load analytics:', e);
        }
        return this.getDefaultData();
    }

    // Get default data structure
    getDefaultData() {
        return {
            sessions: [],
            totals: {
                timeSpent: 0,
                sessionsCompleted: 0
            },
            streaks: {
                current: 0,
                longest: 0,
                lastDate: null
            },
            moduleStats: {
                'beep-tracker': { sessions: 0, totalScore: 0, bestScore: 0 },
                'time-estimation': { sessions: 0, totalScore: 0, bestScore: 0 },
                'reaction-test': { sessions: 0, totalTime: 0, bestTime: Infinity },
                'memory-sequence': { sessions: 0, bestLevel: 0 },
                'focus-counter': { sessions: 0, totalScore: 0, bestScore: 0 },
                'meditation': { sessions: 0, totalTime: 0 },
                'meditation-timer': { sessions: 0, totalTime: 0 }
            },
            settings: {
                masterVolume: 70,
                soundEffects: true,
                theme: 'dark'
            }
        };
    }

    // Save data to localStorage
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save analytics:', e);
        }
    }

    // Record a new session
    recordSession(module, duration, score = null, metrics = {}) {
        const session = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            module,
            startTime: new Date(Date.now() - duration * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration, // in seconds
            score,
            metrics
        };

        this.data.sessions.push(session);
        this.data.totals.timeSpent += duration;
        this.data.totals.sessionsCompleted++;

        // Update module-specific stats
        this.updateModuleStats(module, score, duration, metrics);

        // Update streak
        this.updateStreak();

        this.save();
        return session;
    }

    // Update module-specific statistics
    updateModuleStats(module, score, duration, metrics) {
        const stats = this.data.moduleStats[module];
        if (!stats) return;

        stats.sessions++;

        switch (module) {
            case 'beep-tracker':
            case 'time-estimation':
            case 'focus-counter':
                if (score !== null) {
                    stats.totalScore += score;
                    stats.bestScore = Math.max(stats.bestScore, score);
                }
                break;
            case 'reaction-test':
                if (metrics.avgTime) {
                    stats.totalTime += metrics.avgTime;
                    stats.bestTime = Math.min(stats.bestTime, metrics.bestTime || Infinity);
                }
                break;
            case 'memory-sequence':
                if (metrics.level) {
                    stats.bestLevel = Math.max(stats.bestLevel, metrics.level);
                }
                break;
            case 'meditation':
            case 'meditation-timer':
                stats.totalTime += duration;
                break;
        }
    }

    // Update streak tracking
    updateStreak() {
        const today = new Date().toDateString();
        const lastDate = this.data.streaks.lastDate;

        if (!lastDate) {
            // First session ever
            this.data.streaks.current = 1;
            this.data.streaks.longest = 1;
        } else if (lastDate === today) {
            // Already logged today, no change
            return;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate === yesterday.toDateString()) {
                // Consecutive day
                this.data.streaks.current++;
                this.data.streaks.longest = Math.max(
                    this.data.streaks.longest,
                    this.data.streaks.current
                );
            } else {
                // Streak broken
                this.data.streaks.current = 1;
            }
        }

        this.data.streaks.lastDate = today;
    }

    // Get sessions for a specific date range
    getSessionsByDateRange(startDate, endDate) {
        return this.data.sessions.filter(session => {
            const date = new Date(session.startTime);
            return date >= startDate && date <= endDate;
        });
    }

    // Get sessions for today
    getTodaySessions() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getSessionsByDateRange(today, tomorrow);
    }

    // Get sessions for this week
    getWeeklySessions() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return this.getSessionsByDateRange(startOfWeek, new Date());
    }

    // Get time spent today (in seconds)
    getTodayTime() {
        return this.getTodaySessions().reduce((sum, s) => sum + s.duration, 0);
    }

    // Get weekly activity data for charts
    getWeeklyActivityData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = new Array(7).fill(0);

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        this.data.sessions.forEach(session => {
            const date = new Date(session.startTime);
            if (date >= startOfWeek) {
                const dayIndex = date.getDay();
                data[dayIndex] += session.duration / 60; // Convert to minutes
            }
        });

        return { labels: days, data };
    }

    // Get module breakdown data for charts
    getModuleBreakdown() {
        const modules = {};
        this.data.sessions.forEach(session => {
            if (!modules[session.module]) {
                modules[session.module] = 0;
            }
            modules[session.module] += session.duration;
        });

        const labels = Object.keys(modules).map(m => this.getModuleName(m));
        const data = Object.values(modules).map(d => Math.round(d / 60));

        return { labels, data };
    }

    // Get performance trend data
    getPerformanceTrends(module = null) {
        let sessions = this.data.sessions;
        if (module) {
            sessions = sessions.filter(s => s.module === module);
        }

        // Get last 10 sessions with scores
        const scoredSessions = sessions
            .filter(s => s.score !== null)
            .slice(-10);

        const labels = scoredSessions.map((s, i) => `Session ${i + 1}`);
        const data = scoredSessions.map(s => s.score);

        return { labels, data };
    }

    // Get recent sessions
    getRecentSessions(limit = 10) {
        return this.data.sessions
            .slice(-limit)
            .reverse()
            .map(session => ({
                ...session,
                moduleName: this.getModuleName(session.module),
                formattedTime: this.formatRelativeTime(session.startTime),
                formattedDuration: this.formatDuration(session.duration)
            }));
    }

    // Get all sessions (for history view)
    getAllSessions() {
        return this.data.sessions
            .slice()
            .reverse()
            .map(session => ({
                ...session,
                moduleName: this.getModuleName(session.module),
                formattedDate: new Date(session.startTime).toLocaleDateString(),
                formattedDuration: this.formatDuration(session.duration)
            }));
    }

    // Helper: Get friendly module name
    getModuleName(module) {
        const names = {
            'beep-tracker': 'Beep Tracker',
            'time-estimation': 'Time Estimation',
            'reaction-test': 'Reaction Test',
            'memory-sequence': 'Memory Sequence',
            'focus-counter': 'SART Test',
            'meditation': 'Guided Meditation',
            'meditation-timer': 'Meditation Timer',
            'meditation-room': 'Meditation Room'
        };
        return names[module] || module;
    }

    // Helper: Format duration in seconds to human readable
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    // Helper: Format total time
    formatTotalTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }

    // Helper: Format relative time
    formatRelativeTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    // Export data as JSON
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `mindgym-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import data from JSON
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            // Validate structure
            if (imported.sessions && imported.totals && imported.streaks) {
                // Merge sessions
                const existingIds = new Set(this.data.sessions.map(s => s.id));
                imported.sessions.forEach(session => {
                    if (!existingIds.has(session.id)) {
                        this.data.sessions.push(session);
                    }
                });

                // Recalculate totals
                this.data.totals.timeSpent = this.data.sessions.reduce((sum, s) => sum + s.duration, 0);
                this.data.totals.sessionsCompleted = this.data.sessions.length;

                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        this.data = this.getDefaultData();
        this.save();
    }

    // Get settings
    getSettings() {
        return this.data.settings;
    }

    // Update settings
    updateSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.save();
    }
}

// Create singleton instance
const analytics = new Analytics();
