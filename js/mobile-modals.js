// Settings Modal Function
function showSettingsModal(habit) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'mobile-modal settings-modal';
    modal.id = 'settings-modal';
    
    // Get category options
    const categoryOptions = getCategoryOptions(habit.category_id);
    
    // Create icon selection options
    const iconOptions = [
        { emoji: '💧', name: 'Water' },
        { emoji: '🏃', name: 'Exercise' },
        { emoji: '📚', name: 'Reading' },
        { emoji: '😴', name: 'Sleep' },
        { emoji: '💼', name: 'Work' },
        { emoji: '🎓', name: 'Study' },
        { emoji: '🍎', name: 'Nutrition' },
        { emoji: '🧘', name: 'Meditation' },
        { emoji: '💻', name: 'Coding' },
        { emoji: '✏️', name: 'Journal' }
    ];
    
    const iconSelectors = iconOptions.map(icon => 
        `<div class="icon-option ${habit.icon === icon.emoji ? 'selected' : ''}" 
              data-icon="${icon.emoji}">
           <span class="icon-emoji">${icon.emoji}</span>
           <span class="icon-name">${icon.name}</span>
         </div>`
    ).join('');
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Habit</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-habit-form">
                    <div class="form-group">
                        <label for="edit-name">Habit Name</label>
                        <input type="text" id="edit-name" class="form-control" 
                               value="${habit.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Icon</label>
                        <div class="icon-selector">
                            ${iconSelectors}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-category">Category</label>
                        <select id="edit-category" class="form-control">
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Frequency</label>
                        <div class="frequency-options">
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="daily" 
                                       ${habit.frequency === 'daily' ? 'checked' : ''}>
                                <span>Daily</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="weekly" 
                                       ${habit.frequency === 'weekly' ? 'checked' : ''}>
                                <span>Weekly</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="frequency" value="custom" 
                                       ${habit.frequency === 'custom' ? 'checked' : ''}>
                                <span>Custom</span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="custom-days-select" class="form-group" 
                         ${habit.frequency !== 'custom' ? 'style="display:none;"' : ''}>
                        <label>Active Days</label>
                        <div class="day-selector">
                            <label class="day-option">
                                <input type="checkbox" name="days" value="monday">
                                <span>M</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="tuesday">
                                <span>T</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="wednesday">
                                <span>W</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="thursday">
                                <span>T</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="friday">
                                <span>F</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="saturday">
                                <span>S</span>
                            </label>
                            <label class="day-option">
                                <input type="checkbox" name="days" value="sunday">
                                <span>S</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group action-buttons">
                        <button type="button" class="delete-btn" data-habit-id="${habit.id}">
                            Delete Habit
                        </button>
                        <button type="submit" class="save-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const form = modal.querySelector('#edit-habit-form');
    const deleteBtn = modal.querySelector('.delete-btn');
    const frequencyRadios = modal.querySelectorAll('input[name="frequency"]');
    const customDaysSelect = modal.querySelector('#custom-days-select');
    const iconOptions = modal.querySelectorAll('.icon-option');
    
    // Close button event
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Icon selection event
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });
    
    // Frequency change event
    frequencyRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDaysSelect.style.display = 'block';
            } else {
                customDaysSelect.style.display = 'none';
            }
        });
    });
    
    // Form submit event
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value;
        const category = document.getElementById('edit-category').value;
        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const selectedIcon = modal.querySelector('.icon-option.selected').dataset.icon;
        
        // Get custom days if applicable
        const days = {};
        if (frequency === 'custom') {
            const dayCheckboxes = modal.querySelectorAll('input[name="days"]:checked');
            dayCheckboxes.forEach(checkbox => {
                days[checkbox.value] = true;
            });
        }
        
        // Update habit data
        updateHabit(habit.id, {
            name: name,
            category_id: category,
            frequency: frequency,
            icon: selectedIcon,
            days: frequency === 'custom' ? JSON.stringify(days) : null
        });
        
        // Close modal
        closeModal(modal);
    });
    
    // Delete button event
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this habit? This cannot be undone.')) {
            deleteHabit(habit.id);
            closeModal(modal);
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Information Modal Function
function showInfoModal(habit) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'mobile-modal info-modal';
    modal.id = 'info-modal';
    
    // Get streak information
    const currentStreak = habit.current_streak || 0;
    const longestStreak = habit.longest_streak || 0;
    
    // Calculate rewards based on streaks
    const rewards = [
        { days: 3, name: "Bronze Badge", icon: "🥉", unlocked: currentStreak >= 3 },
        { days: 7, name: "Silver Badge", icon: "🥈", unlocked: currentStreak >= 7 },
        { days: 14, name: "Gold Badge", icon: "🥇", unlocked: currentStreak >= 14 },
        { days: 21, name: "Trophy", icon: "🏆", unlocked: currentStreak >= 21 },
        { days: 30, name: "Star", icon: "⭐", unlocked: currentStreak >= 30 },
        { days: 60, name: "Diamond", icon: "💎", unlocked: currentStreak >= 60 },
        { days: 100, name: "Crown", icon: "👑", unlocked: currentStreak >= 100 }
    ];
    
    // Create rewards HTML
    const rewardsHtml = rewards.map(reward => `
        <div class="reward-item ${reward.unlocked ? 'unlocked' : 'locked'}">
            <div class="reward-icon">${reward.unlocked ? reward.icon : '🔒'}</div>
            <div class="reward-info">
                <div class="reward-name">${reward.name}</div>
                <div class="reward-days">${reward.days} days</div>
            </div>
        </div>
    `).join('');
    
    // Calculate completion rate
    const completionRate = habit.completion_rate || 0;
    
    // Get statistics
    const statistics = [
        { name: "Completion Rate", value: `${completionRate}%` },
        { name: "Current Streak", value: `${currentStreak} days` },
        { name: "Best Streak", value: `${longestStreak} days` },
        { name: "Total Completions", value: habit.completed_count || 0 }
    ];
    
    // Create statistics HTML
    const statisticsHtml = statistics.map(stat => `
        <div class="stat-item">
            <div class="stat-name">${stat.name}</div>
            <div class="stat-value">${stat.value}</div>
        </div>
    `).join('');
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${habit.name}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <section class="info-section">
                    <h4>Current Progress</h4>
                    <div class="streak-progress">
                        <div class="streak-icon">🔥</div>
                        <div class="streak-bar-container">
                            <div class="streak-bar" style="width: ${Math.min(100, (currentStreak / 30) * 100)}%"></div>
                        </div>
                        <div class="streak-count">${currentStreak} days</div>
                    </div>
                    <div class="next-milestone">
                        ${getNextMilestone(currentStreak, rewards)}
                    </div>
                </section>
                
                <section class="info-section">
                    <h4>Statistics</h4>
                    <div class="statistics">
                        ${statisticsHtml}
                    </div>
                </section>
                
                <section class="info-section">
                    <h4>Rewards</h4>
                    <div class="rewards-container">
                        ${rewardsHtml}
                    </div>
                </section>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    
    // Close button event
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Calendar Modal Function
function showCalendarModal(habit) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'mobile-modal calendar-modal';
    modal.id = 'calendar-modal';
    
    // Get current date and month info
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Create month selector
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Set modal content with placeholder calendar (will be filled by JavaScript)
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Habit Calendar</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="month-selector">
                    <button class="prev-month-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="current-month">
                        <span id="month-year-display">${months[currentMonth]} ${currentYear}</span>
                    </div>
                    <button class="next-month-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="calendar">
                    <div class="calendar-header">
                        <div class="weekday">S</div>
                        <div class="weekday">M</div>
                        <div class="weekday">T</div>
                        <div class="weekday">W</div>
                        <div class="weekday">T</div>
                        <div class="weekday">F</div>
                        <div class="weekday">S</div>
                    </div>
                    <div class="calendar-grid" id="calendar-grid">
                        <div class="calendar-loading">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <span>Loading calendar data...</span>
                        </div>
                    </div>
                </div>
                
                <div class="calendar-legend">
                    <div class="legend-item">
                        <div class="legend-color bg-success"></div>
                        <span>Completed</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color bg-danger"></div>
                        <span>Missed</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color bg-secondary"></div>
                        <span>Not Scheduled</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const prevMonthBtn = modal.querySelector('.prev-month-btn');
    const nextMonthBtn = modal.querySelector('.next-month-btn');
    
    // Close button event
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    // Load initial calendar
    loadCalendar(habit.id, currentMonth, currentYear);
    
    // Previous month button event
    prevMonthBtn.addEventListener('click', () => {
        let newMonth = currentMonth - 1;
        let newYear = currentYear;
        
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }
        
        loadCalendar(habit.id, newMonth, newYear);
        
        // Update display
        document.getElementById('month-year-display').textContent = `${months[newMonth]} ${newYear}`;
    });
    
    // Next month button event
    nextMonthBtn.addEventListener('click', () => {
        let newMonth = currentMonth + 1;
        let newYear = currentYear;
        
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        
        loadCalendar(habit.id, newMonth, newYear);
        
        // Update display
        document.getElementById('month-year-display').textContent = `${months[newMonth]} ${newYear}`;
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Helper function to close a modal
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

// Helper function to get category options
function getCategoryOptions(selectedCategoryId) {
    const categories = [
        { id: 1, name: 'Health' },
        { id: 2, name: 'Productivity' },
        { id: 3, name: 'Learning' },
        { id: 4, name: 'Personal' }
    ];
    
    return categories.map(category => 
        `<option value="${category.id}" ${category.id == selectedCategoryId ? 'selected' : ''}>
            ${category.name}
         </option>`
    ).join('');
}

// Helper function to get next milestone
function getNextMilestone(currentStreak, rewards) {
    // Find the next milestone
    for (const reward of rewards) {
        if (currentStreak < reward.days) {
            const daysLeft = reward.days - currentStreak;
            return `
                <div class="next-reward">
                    <span>Next reward in ${daysLeft} days: </span>
                    <span class="reward-badge">${reward.icon} ${reward.name}</span>
                </div>
            `;
        }
    }
    
    // If all milestones achieved
    return `<div class="next-reward">All milestones achieved! 🎉</div>`;
}

// Function to load calendar data
function loadCalendar(habitId, month, year) {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Show loading state
    calendarGrid.innerHTML = `
        <div class="calendar-loading">
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span>Loading calendar data...</span>
        </div>
    `;
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Format dates for API request
    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Fetch habit logs for the month
    fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}&start_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Create map of completion status by date
                const completionMap = {};
                
                // Initialize all dates
                for (let day = 1; day <= lastDay.getDate(); day++) {
                    const date = new Date(year, month, day);
                    const dateStr = formatDate(date);
                    completionMap[dateStr] = {
                        status: 'none', // none, completed, missed, not-scheduled
                        notes: ''
                    };
                }
                
                // Add completion data
                if (data.logs) {
                    data.logs.forEach(log => {
                        const dateStr = log.completed_date;
                        
                        if (completionMap[dateStr]) {
                            completionMap[dateStr] = {
                                status: log.completed == 1 ? 'completed' : 'missed',
                                notes: log.notes || (log.completed == 1 ? 'Completed' : 'Missed')
                            };
                        }
                    });
                }
                
                // Render calendar
                renderCalendar(calendarGrid, firstDay, lastDay, completionMap, habitId);
            } else {
                console.error('Failed to load habit logs:', data.message);
                calendarGrid.innerHTML = `
                    <div class="error-message">
                        Failed to load calendar data. Please try again.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            calendarGrid.innerHTML = `
                <div class="error-message">
                    An error occurred. Please try again.
                </div>
            `;
        });
}

// Function to render calendar
function renderCalendar(container, firstDay, lastDay, completionMap, habitId) {
    container.innerHTML = '';
    
    // Get today's date for highlighting
    const today = new Date();
    const todayStr = formatDate(today);
    
    // Get first day of the week (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        container.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
        const dateStr = formatDate(date);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        // Add today class if it's today
        if (dateStr === todayStr) {
            dayCell.classList.add('today');
        }
        
        // Add completion status class
        if (completionMap[dateStr]) {
            dayCell.classList.add(completionMap[dateStr].status);
        }
        
        // Create day content
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            ${completionMap[dateStr] && completionMap[dateStr].status === 'completed' ? 
                '<div class="day-check">✓</div>' : ''}
        `;
        
        // Add completion data as attributes
        if (completionMap[dateStr]) {
            dayCell.setAttribute('data-status', completionMap[dateStr].status);
            dayCell.setAttribute('data-notes', completionMap[dateStr].notes);
            dayCell.setAttribute('data-date', dateStr);
            
            // Allow checking/unchecking past days
            if (date < today && !dayCell.classList.contains('empty')) {
                dayCell.addEventListener('click', function() {
                    togglePastDate(habitId, dateStr, completionMap[dateStr].status !== 'completed');
                });
            }
        }
        
        container.appendChild(dayCell);
    }
}

// Function to toggle completion status for a past date
function togglePastDate(habitId, dateStr, completed) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('habit_id', habitId);
    formData.append('completed', completed ? '1' : '0');
    formData.append('date', dateStr);
    
    // Show loading indicator on the specific day cell
    const dayCell = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayCell) {
        dayCell.classList.add('loading');
    }
    
    // Send request
    fetch(`backend/habit_logs.php?user_id=${userId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI
            if (dayCell) {
                dayCell.classList.remove('loading');
                dayCell.classList.remove('completed', 'missed');
                dayCell.classList.add(completed ? 'completed' : 'missed');
                
                // Update check mark
                if (completed) {
                    if (!dayCell.querySelector('.day-check')) {
                        const checkMark = document.createElement('div');
                        checkMark.className = 'day-check';
                        checkMark.textContent = '✓';
                        dayCell.appendChild(checkMark);
                    }
                } else {
                    const checkMark = dayCell.querySelector('.day-check');
                    if (checkMark) {
                        dayCell.removeChild(checkMark);
                    }
                }
                
                // Update data attributes
                dayCell.setAttribute('data-status', completed ? 'completed' : 'missed');
            }
            
            // Update streaks on the main habit card
            updateHabitStreaks(habitId);
            
        } else {
            console.error('Failed to update habit log:', data.message);
            
            // Remove loading state
            if (dayCell) {
                dayCell.classList.remove('loading');
            }
            
            showMobileError('Failed to update habit log');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Remove loading state
        if (dayCell) {
            dayCell.classList.remove('loading');
        }
        
        showMobileError('An error occurred');
    });
}

// Function to update habit streaks
function updateHabitStreaks(habitId) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Fetch updated streak info
    fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update streak display on the habit card
                const currentStreakElement = document.querySelector(`#habit-card-${habitId} .streak-count`);
                const trophyCountElement = document.querySelector(`#habit-card-${habitId} .trophy-count`);
                
                if (currentStreakElement) {
                    currentStreakElement.textContent = `${data.current_streak || 0}d`;
                }
                
                if (trophyCountElement) {
                    trophyCountElement.textContent = `${data.longest_streak || 0}d`;
                }
                
                // Update streak flame visibility
                const streakFlame = document.querySelector(`#habit-card-${habitId} .streak-flame`);
                if (streakFlame) {
                    if (data.current_streak > 0) {
                        streakFlame.classList.add('active');
                    } else {
                        streakFlame.classList.remove('active');
                    }
                }
                
                // Update trophy visibility
                const trophy = document.querySelector(`#habit-card-${habitId} .trophy`);
                if (trophy) {
                    if (data.longest_streak > 0) {
                        trophy.classList.add('active');
                    } else {
                        trophy.classList.remove('active');
                    }
                }
            }
        })
        .catch(error => console.error('Error updating streaks:', error));
}