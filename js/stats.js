// stats.js - Handles statistics functionality

// Charts
let completionChart = null;
let streakChart = null;

// Load statistics
function loadStats() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habit_logs.php?user_id=${userId}`;
    
    // Show loading indicator
    document.getElementById('stats-table-body').innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading statistics...</p>
            </td>
        </tr>
    `;
    
    // Fetch stats
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update table
                updateStatsTable(data.stats);
                
                // Create charts
                createCompletionChart(data.stats);
                createStreakChart(data.stats);
            } else {
                console.error('Failed to load stats:', data.message);
                showError('Failed to load statistics. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        });
}

// Update stats table
function updateStatsTable(stats) {
    const tableBody = document.getElementById('stats-table-body');
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (stats.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <p class="text-muted">No data available. Start tracking habits to see statistics.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Add rows
    stats.forEach(stat => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <strong>${stat.name}</strong>
                ${stat.category_name ? `<br><span class="badge bg-secondary">${stat.category_name}</span>` : ''}
            </td>
            <td>${stat.current_streak}</td>
            <td>${stat.longest_streak}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="progress flex-grow-1" style="height: 10px;">
                        <div class="progress-bar bg-success" role="progressbar" 
                            style="width: ${stat.completion_rate}%;" 
                            aria-valuenow="${stat.completion_rate}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                        </div>
                    </div>
                    <span class="ms-2">${stat.completion_rate}%</span>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Create completion chart
function createCompletionChart(stats) {
    // Prepare data
    const labels = stats.map(stat => stat.name);
    const data = stats.map(stat => stat.completion_rate);
    const colors = stats.map(stat => getColorForRate(stat.completion_rate));
    
    // Get canvas context
    const ctx = document.getElementById('completion-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (completionChart) {
        completionChart.destroy();
    }
    
    // Create new chart
    completionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate (%)',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Completion Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Habit'
                    }
                }
            }
        }
    });
}

// Create streak chart
function createStreakChart(stats) {
    // Prepare data
    const labels = stats.map(stat => stat.name);
    const currentStreaks = stats.map(stat => stat.current_streak);
    const longestStreaks = stats.map(stat => stat.longest_streak);
    
    // Get canvas context
    const ctx = document.getElementById('streak-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (streakChart) {
        streakChart.destroy();
    }
    
    // Create new chart
    streakChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Streak',
                    data: currentStreaks,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Longest Streak',
                    data: longestStreaks,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Habit'
                    }
                }
            }
        }
    });
}

// Get color based on completion rate
function getColorForRate(rate) {
    if (rate >= 80) {
        return 'rgba(40, 167, 69, 0.7)'; // Green
    } else if (rate >= 60) {
        return 'rgba(23, 162, 184, 0.7)'; // Blue
    } else if (rate >= 40) {
        return 'rgba(255, 193, 7, 0.7)'; // Yellow
    } else if (rate >= 20) {
        return 'rgba(255, 128, 0, 0.7)'; // Orange
    } else {
        return 'rgba(220, 53, 69, 0.7)'; // Red
    }
}