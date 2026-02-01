/**
 * Advanced Analytics Dashboard
 * Comprehensive data visualization and analysis
 */

class AdvancedAnalytics {
    constructor() {
        this.charts = {};
        this.currentFilters = {
            startDate: null,
            endDate: null,
            module: 'all',
            chartType: 'line',
            metrics: ['accuracy'],
            aggregation: 'none'
        };
        this.filteredData = [];
        this.currentPage = 1;
        this.pageSize = 15;
        this.sortColumn = 'date';
        this.sortDirection = 'desc';

        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Date inputs
        this.startDateInput = document.getElementById('analytics-start-date');
        this.endDateInput = document.getElementById('analytics-end-date');

        // Set default dates (last 90 days) using value strings to avoid timezone issues
        const today = new Date();
        const past90 = new Date(today);
        past90.setDate(past90.getDate() - 90);

        // Format as YYYY-MM-DD for input value
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (this.startDateInput && this.endDateInput) {
            this.startDateInput.value = formatDate(past90);
            this.endDateInput.value = formatDate(today);
            this.currentFilters.startDate = new Date(past90.getFullYear(), past90.getMonth(), past90.getDate(), 0, 0, 0);
            this.currentFilters.endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        }

        // Module filter
        this.moduleFilter = document.getElementById('analytics-module-filter');

        // Aggregation
        this.aggregationSelect = document.getElementById('analytics-aggregation');

        // Metric checkboxes
        this.metricAccuracy = document.getElementById('metric-accuracy');
        this.metricDuration = document.getElementById('metric-duration');
        this.metricScore = document.getElementById('metric-score');

        // Charts
        this.mainChartCanvas = document.getElementById('main-analytics-chart');
        this.moduleChartCanvas = document.getElementById('module-distribution-chart');
        this.timeOfDayChartCanvas = document.getElementById('time-of-day-chart');

        // Table
        this.tableBody = document.getElementById('sessions-table-body');
        this.pageInfo = document.getElementById('page-info');
        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');

        this.bindEvents();
        this.applyFilters();
    }

    bindEvents() {
        // Quick range buttons
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const range = btn.dataset.range;
                const today = new Date();
                let startDate = new Date();

                if (range === 'all') {
                    startDate = new Date('2020-01-01');
                } else {
                    startDate.setDate(today.getDate() - parseInt(range));
                }

                if (this.startDateInput && this.endDateInput) {
                    this.startDateInput.valueAsDate = startDate;
                    this.endDateInput.valueAsDate = today;
                }
            });
        });

        // Chart type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilters.chartType = btn.dataset.chart;
                this.updateMainChart();
            });
        });

        // Apply filters button
        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }

        // Metric toggles
        [this.metricAccuracy, this.metricDuration, this.metricScore].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateMetricSelection();
                    this.updateMainChart();
                });
            }
        });

        // Aggregation change
        if (this.aggregationSelect) {
            this.aggregationSelect.addEventListener('change', () => {
                this.currentFilters.aggregation = this.aggregationSelect.value;
                this.updateMainChart();
            });
        }

        // Table sorting
        document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'desc';
                }
                this.renderTable();
            });
        });

        // Pagination
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTable();
                }
            });
        }

        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderTable();
                }
            });
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('export-csv');
        const exportJsonBtn = document.getElementById('export-json');
        const exportDataBtn = document.getElementById('export-data');
        const importDataBtn = document.getElementById('import-data');
        const clearDataBtn = document.getElementById('clear-data');
        const importFile = document.getElementById('import-file');

        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => this.exportCSV());
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => this.exportJSON());
        if (exportDataBtn) exportDataBtn.addEventListener('click', () => analytics.exportData());
        if (importDataBtn) importDataBtn.addEventListener('click', () => importFile?.click());
        if (clearDataBtn) clearDataBtn.addEventListener('click', () => this.clearData());

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (analytics.importData(event.target.result)) {
                            this.applyFilters();
                            alert('Data imported successfully!');
                        } else {
                            alert('Failed to import data. Invalid format.');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    }

    updateMetricSelection() {
        this.currentFilters.metrics = [];
        if (this.metricAccuracy?.checked) this.currentFilters.metrics.push('accuracy');
        if (this.metricDuration?.checked) this.currentFilters.metrics.push('duration');
        if (this.metricScore?.checked) this.currentFilters.metrics.push('score');
    }

    applyFilters() {
        // Get filter values - handle date inputs properly  
        if (this.startDateInput && this.startDateInput.value) {
            // Parse as local date, not UTC
            const parts = this.startDateInput.value.split('-');
            this.currentFilters.startDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
        } else {
            this.currentFilters.startDate = new Date('2020-01-01');
        }

        if (this.endDateInput && this.endDateInput.value) {
            // Parse as local date at end of day
            const parts = this.endDateInput.value.split('-');
            this.currentFilters.endDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
        } else {
            this.currentFilters.endDate = new Date();
        }

        if (this.moduleFilter) {
            this.currentFilters.module = this.moduleFilter.value;
        }

        // Filter data
        const allSessions = analytics.data.sessions;
        console.log('Total sessions in analytics:', allSessions.length);
        console.log('Date range:', this.currentFilters.startDate, 'to', this.currentFilters.endDate);

        this.filteredData = allSessions.filter(session => {
            const sessionDate = new Date(session.startTime);

            // Date filter
            if (sessionDate < this.currentFilters.startDate || sessionDate > this.currentFilters.endDate) {
                return false;
            }

            // Module filter
            if (this.currentFilters.module !== 'all' && session.module !== this.currentFilters.module) {
                return false;
            }

            return true;
        });

        console.log('Filtered sessions:', this.filteredData.length);

        // Reset pagination
        this.currentPage = 1;

        // Update all views
        this.updateStats();
        this.updateMainChart();
        this.updateSecondaryCharts();
        this.renderTable();

        // Re-init icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    updateStats() {
        const sessions = this.filteredData;

        // Total sessions
        const statSessions = document.getElementById('stat-total-sessions');
        if (statSessions) statSessions.textContent = sessions.length;

        // Total time
        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        const statTime = document.getElementById('stat-total-time');
        if (statTime) statTime.textContent = analytics.formatDuration(totalTime);

        // Get sessions with accuracy scores
        const scoredSessions = sessions.filter(s => s.score !== null && s.score !== undefined);

        if (scoredSessions.length > 0) {
            const accuracies = scoredSessions.map(s => s.score);

            // Average
            const avg = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
            const statAvg = document.getElementById('stat-avg-accuracy');
            if (statAvg) statAvg.textContent = `${avg}%`;

            // Best
            const best = Math.max(...accuracies);
            const statBest = document.getElementById('stat-best-accuracy');
            if (statBest) statBest.textContent = `${best}%`;

            // Worst
            const worst = Math.min(...accuracies);
            const statWorst = document.getElementById('stat-worst-accuracy');
            if (statWorst) statWorst.textContent = `${worst}%`;

            // Standard deviation
            const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
            const squareDiffs = accuracies.map(v => Math.pow(v - mean, 2));
            const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
            const stdDev = Math.round(Math.sqrt(avgSquareDiff) * 10) / 10;
            const statStdDev = document.getElementById('stat-std-dev');
            if (statStdDev) statStdDev.textContent = `±${stdDev}`;
        } else {
            // No scored sessions
            ['stat-avg-accuracy', 'stat-best-accuracy', 'stat-worst-accuracy', 'stat-std-dev'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '-';
            });
        }
    }

    updateMainChart() {
        if (!this.mainChartCanvas) return;

        const chartType = this.currentFilters.chartType;
        const datasets = [];

        // Prepare data based on aggregation
        let chartData = this.prepareChartData();

        // Build datasets based on selected metrics
        if (this.currentFilters.metrics.includes('accuracy')) {
            datasets.push({
                label: 'Accuracy (%)',
                data: chartData.map(d => d.accuracy),
                borderColor: '#6366f1',
                backgroundColor: chartType === 'bar' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.1)',
                fill: chartType === 'line',
                tension: 0.3,
                yAxisID: 'y'
            });
        }

        if (this.currentFilters.metrics.includes('duration')) {
            datasets.push({
                label: 'Duration (min)',
                data: chartData.map(d => d.duration),
                borderColor: '#10b981',
                backgroundColor: chartType === 'bar' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.1)',
                fill: chartType === 'line',
                tension: 0.3,
                yAxisID: 'y1'
            });
        }

        if (this.currentFilters.metrics.includes('score')) {
            datasets.push({
                label: 'Score',
                data: chartData.map(d => d.score),
                borderColor: '#f59e0b',
                backgroundColor: chartType === 'bar' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.1)',
                fill: chartType === 'line',
                tension: 0.3,
                yAxisID: 'y'
            });
        }

        // Destroy existing chart
        if (this.charts.main) {
            this.charts.main.destroy();
        }

        const ctx = this.mainChartCanvas.getContext('2d');
        this.charts.main = new Chart(ctx, {
            type: chartType === 'scatter' ? 'scatter' : chartType,
            data: {
                labels: chartData.map(d => d.label),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#94a3b8' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#64748b' },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: this.currentFilters.metrics.includes('duration'),
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#10b981' }
                    }
                }
            }
        });
    }

    prepareChartData() {
        const aggregation = this.currentFilters.aggregation;
        const sessions = [...this.filteredData].sort((a, b) =>
            new Date(a.startTime) - new Date(b.startTime)
        );

        if (aggregation === 'none') {
            // Individual sessions
            return sessions.map((s, i) => ({
                label: new Date(s.startTime).toLocaleDateString(),
                accuracy: s.score,
                duration: Math.round(s.duration / 60 * 10) / 10,
                score: s.score
            }));
        }

        // Aggregate by day or week
        const groups = {};
        sessions.forEach(s => {
            const date = new Date(s.startTime);
            let key;

            if (aggregation === 'day') {
                key = date.toISOString().split('T')[0];
            } else { // week
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            }

            if (!groups[key]) {
                groups[key] = { sessions: [], totalDuration: 0, totalScore: 0, scoreCount: 0 };
            }
            groups[key].sessions.push(s);
            groups[key].totalDuration += s.duration;
            if (s.score !== null) {
                groups[key].totalScore += s.score;
                groups[key].scoreCount++;
            }
        });

        return Object.entries(groups).map(([key, data]) => ({
            label: new Date(key).toLocaleDateString(),
            accuracy: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : null,
            duration: Math.round(data.totalDuration / 60 * 10) / 10,
            score: data.scoreCount > 0 ? Math.round(data.totalScore / data.scoreCount) : null
        }));
    }

    updateSecondaryCharts() {
        // Module distribution chart
        if (this.moduleChartCanvas) {
            const moduleData = {};
            this.filteredData.forEach(s => {
                const name = analytics.getModuleName(s.module);
                moduleData[name] = (moduleData[name] || 0) + 1;
            });

            if (this.charts.module) this.charts.module.destroy();

            const ctx = this.moduleChartCanvas.getContext('2d');
            this.charts.module = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(moduleData),
                    datasets: [{
                        data: Object.values(moduleData),
                        backgroundColor: [
                            '#6366f1', '#10b981', '#f59e0b', '#ef4444',
                            '#8b5cf6', '#ec4899', '#06b6d4'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#94a3b8', boxWidth: 12 }
                        }
                    }
                }
            });
        }

        // Time of day chart
        if (this.timeOfDayChartCanvas) {
            const hourData = new Array(24).fill(0);
            this.filteredData.forEach(s => {
                const hour = new Date(s.startTime).getHours();
                hourData[hour]++;
            });

            if (this.charts.timeOfDay) this.charts.timeOfDay.destroy();

            const ctx = this.timeOfDayChartCanvas.getContext('2d');
            this.charts.timeOfDay = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hourData.map((_, i) => `${i}:00`),
                    datasets: [{
                        label: 'Sessions',
                        data: hourData,
                        backgroundColor: 'rgba(99, 102, 241, 0.5)',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#64748b',
                                callback: (val, i) => i % 4 === 0 ? `${i}:00` : ''
                            }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.06)' },
                            ticks: { color: '#64748b' },
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    renderTable() {
        if (!this.tableBody) return;

        // Sort data
        const sorted = [...this.filteredData].sort((a, b) => {
            let aVal, bVal;

            switch (this.sortColumn) {
                case 'date':
                    aVal = new Date(a.startTime);
                    bVal = new Date(b.startTime);
                    break;
                case 'module':
                    aVal = a.module;
                    bVal = b.module;
                    break;
                case 'duration':
                    aVal = a.duration;
                    bVal = b.duration;
                    break;
                case 'accuracy':
                case 'score':
                    aVal = a.score ?? -1;
                    bVal = b.score ?? -1;
                    break;
                default:
                    return 0;
            }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Paginate
        const totalPages = Math.ceil(sorted.length / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        const pageData = sorted.slice(start, start + this.pageSize);

        // Render
        this.tableBody.innerHTML = pageData.map(session => {
            const date = new Date(session.startTime);
            const accuracyClass = session.score >= 90 ? 'good' :
                session.score >= 70 ? 'ok' : 'poor';

            return `
                <tr>
                    <td>${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${analytics.getModuleName(session.module)}</td>
                    <td>${analytics.formatDuration(session.duration)}</td>
                    <td class="accuracy-cell ${session.score !== null ? accuracyClass : ''}">${session.score !== null ? session.score + '%' : '-'}</td>
                    <td>${session.score !== null ? session.score : '-'}</td>
                    <td><button class="details-btn" data-id="${session.id}">View</button></td>
                </tr>
            `;
        }).join('');

        // Update pagination
        if (this.pageInfo) {
            this.pageInfo.textContent = `Page ${this.currentPage} of ${Math.max(1, totalPages)}`;
        }
        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage <= 1;
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.disabled = this.currentPage >= totalPages;
        }
    }

    exportCSV() {
        const headers = ['Date', 'Module', 'Duration (s)', 'Accuracy', 'Score'];
        const rows = this.filteredData.map(s => [
            new Date(s.startTime).toISOString(),
            s.module,
            s.duration,
            s.score ?? '',
            s.score ?? ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csv, 'mindgym-sessions.csv', 'text/csv');
    }

    exportJSON() {
        const json = JSON.stringify(this.filteredData, null, 2);
        this.downloadFile(json, 'mindgym-sessions.json', 'application/json');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
            analytics.clearAllData();
            this.applyFilters();
            alert('All data has been cleared.');
        }
    }
}

// Initialize
const advancedAnalytics = new AdvancedAnalytics();
