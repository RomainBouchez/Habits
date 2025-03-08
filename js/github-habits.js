// github-habits.js - Functions for GitHub-style habit tracking visualization

// Generate GitHub-style contribution grid for a habit
function generateGitHubGrid(habitId, month, year) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Calculate first and last day of month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Format dates for API request
    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);
    
    // Create request URL for habit logs
    const url = `backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}&start_date=${startDate}&end_date=${endDate}`;
    
    // Fetch habit logs for the month
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Create a map of completion data by date
                const completionMap = {};
                
                // Initialize all dates in the month with no completion (level 0)
                for (let day = 1; day <= lastDay.getDate(); day++) {
                    const date = new Date(year, month - 1, day);
                    const dateStr = formatDate(date);
                    completionMap[dateStr] = {
                        completed: false,
                        value: "No activity"
                    };
                }
                
                // Add completion data
                if (data.logs) {
                    data.logs.forEach(log => {
                        const dateStr = log.completed_date;
                        completionMap[dateStr] = {
                            completed: log.completed == 1,
                            value: log.notes || (log.completed == 1 ? "Completed" : "Not completed")
                        };
                    });
                }
                
                // Get habit details to determine how to calculate levels
                getHabitDetails(habitId, habit => {
                    // Render the GitHub grid
                    renderGitHubGrid(habitId, month, year, completionMap, habit);
                });
            } else {
                console.error('Failed to load habit logs:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Get habit details from the server
function getHabitDetails(habitId, callback) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habits.php?user_id=${userId}&habit_id=${habitId}`;
    
    // Fetch habit details
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                callback(data.habit);
            } else {
                console.error('Failed to load habit details:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Render GitHub-style contribution grid
function renderGitHubGrid(habitId, month, year, completionMap, habit) {
    // Get the container for this habit's grid
    const gridContainer = document.getElementById(`github-grid-${habitId}`);
    if (!gridContainer) return;
    
    // Clear previous content
    gridContainer.innerHTML = '';
    
    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    // Create month header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.innerHTML = `
        <div class="month-title">${monthNames[month - 1]} ${year}</div>
    `;
    gridContainer.appendChild(monthHeader);
    
    // Create day labels (Mon-Sun)
    const dayLabels = document.createElement('div');
    dayLabels.className = 'day-labels';
    
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    dayNames.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = day;
        dayLabels.appendChild(dayLabel);
    });
    
    gridContainer.appendChild(dayLabels);
    
    // Create GitHub grid
    const githubGrid = document.createElement('div');
    githubGrid.className = 'github-grid';
    
    // Get first day of month
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Adjust for Monday as first day of week (convert 0=Sunday to 6, otherwise subtract 1)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'github-day empty';
        githubGrid.appendChild(emptyDay);
    }
    
    // Get last day of month
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = formatDate(date);
        const formattedDate = `${monthNames[month - 1]} ${day}`;
        
        // Get completion data for this date
        const completion = completionMap[dateStr] || { completed: false, value: "No activity" };
        
        // Determine completion level (0-4)
        let level = 0;
        if (completion.completed) {
            // Calculate level based on habit type and completion
            level = calculateCompletionLevel(habit, completion);
        }
        
        // Create day cell
        const dayCell = document.createElement('div');
        dayCell.className = `github-day level-${level}`;
        dayCell.setAttribute('data-date', formattedDate);
        dayCell.setAttribute('data-value', completion.value);
        
        githubGrid.appendChild(dayCell);
    }
    
    gridContainer.appendChild(githubGrid);
    
    // Add color legend
    const colorLegend = document.createElement('div');
    colorLegend.className = 'color-legend';
    
    // Customize legend based on habit type
    const legendItems = getLegendItems(habit);
    
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const legendSquare = document.createElement('div');
        legendSquare.className = `legend-square level-${item.level}`;
        
        const legendLabel = document.createElement('span');
        legendLabel.textContent = item.label;
        
        legendItem.appendChild(legendSquare);
        legendItem.appendChild(legendLabel);
        colorLegend.appendChild(legendItem);
    });
    
    gridContainer.appendChild(colorLegend);
}

// Calculate completion level (0-4) based on habit type
function calculateCompletionLevel(habit, completion) {
    // Default level for completed is 3
    let level = 3;
    
    // If notes contains numeric information, we can use that for levels
    if (completion.value && !isNaN(parseInt(completion.value))) {
        const value = parseInt(completion.value);
        
        // Example for a habit with a numeric target (like "8 glasses of water")
        if (habit.name.toLowerCase().includes('water') || 
            habit.description.toLowerCase().includes('glass')) {
            // Assuming target is 8 glasses
            const target = 8;
            if (value < target * 0.5) level = 1;
            else if (value < target * 0.8) level = 2;
            else if (value === target) level = 3;
            else if (value > target) level = 4;
        }
        // For exercise or time-based habits
        else if (habit.name.toLowerCase().includes('exercise') || 
                habit.name.toLowerCase().includes('workout') ||
                habit.name.toLowerCase().includes('minutes') ||
                habit.description.toLowerCase().includes('minutes')) {
            // Assuming target is 30 minutes
            const target = 30;
            if (value < target * 0.5) level = 1;
            else if (value < target) level = 2;
            else if (value === target) level = 3;
            else if (value > target) level = 4;
        }
        // For reading or study habits
        else if (habit.name.toLowerCase().includes('read') ||
                habit.name.toLowerCase().includes('study')) {
            // Assuming target is 30 minutes
            const target = 30;
            if (value < target * 0.5) level = 1;
            else if (value < target) level = 2;
            else if (value === target) level = 3;
            else if (value > target) level = 4;
        }
    }
    
    return level;
}

// Get legend items based on habit type
function getLegendItems(habit) {
    // Default legend
    let items = [
        { level: 0, label: 'None' },
        { level: 1, label: 'Low' },
        { level: 2, label: 'Medium' },
        { level: 3, label: 'Target' },
        { level: 4, label: 'Above' }
    ];
    
    // Customize based on habit
    if (habit.name.toLowerCase().includes('water') || 
        habit.description.toLowerCase().includes('glass')) {
        items = [
            { level: 0, label: 'None' },
            { level: 1, label: '1-3' },
            { level: 2, label: '4-7' },
            { level: 3, label: '8' },
            { level: 4, label: '9+' }
        ];
    }
    else if (habit.name.toLowerCase().includes('exercise') || 
            habit.name.toLowerCase().includes('workout')) {
        items = [
            { level: 0, label: 'None' },
            { level: 1, label: 'Light' },
            { level: 2, label: 'Medium' },
            { level: 3, label: 'Target' },
            { level: 4, label: 'High' }
        ];
    }
    else if (habit.name.toLowerCase().includes('read') ||
            habit.name.toLowerCase().includes('study') ||
            habit.description.toLowerCase().includes('minutes')) {
        items = [
            { level: 0, label: 'None' },
            { level: 1, label: '<15min' },
            { level: 2, label: '<30min' },
            { level: 3, label: '30min' },
            { level: 4, label: '>30min' }
        ];
    }
    
    return items;
}

// Generate monthly stats for a habit
function generateMonthlyStats(habitId, month, year) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Calculate first and last day of month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Format dates for API request
    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);
    
    // Create request URL for habit logs
    const url = `backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}&start_date=${startDate}&end_date=${endDate}`;
    
    // Fetch habit logs for the month
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const statsContainer = document.getElementById(`habit-stats-${habitId}`);
                if (!statsContainer) return;
                
                // Calculate stats
                const totalDays = lastDay.getDate();
                const completedDays = data.logs ? data.logs.filter(log => log.completed == 1).length : 0;
                const completionRate = Math.round((completedDays / totalDays) * 100);
                
                // Get current streak
                const currentStreak = data.current_streak || 0;
                
                // Update stats display
                statsContainer.innerHTML = `
                    <div class="stat">
                        <div class="stat-value">${completionRate}%</div>
                        <div class="stat-label">COMPLETION</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${completedDays}</div>
                        <div class="stat-label">DAYS</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${currentStreak}</div>
                        <div class="stat-label">STREAK</div>
                    </div>
                `;
            } else {
                console.error('Failed to load habit logs:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Create a GitHub-style habit card
function createGitHubHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.id = `habit-card-${habit.id}`;
    
    // Add category-based styling
    if (habit.category_name) {
        const categoryClass = habit.category_name.toLowerCase().replace(/\s+/g, '-');
        card.classList.add(`${categoryClass}-category`);
    }
    
    // Mark as completed if needed
    if (habit.completed) {
        card.classList.add('completed');
    }
    
    // Determine icon based on habit name or category
    let icon = '📋'; // Default icon
    
    if (habit.name.toLowerCase().includes('water') || habit.name.toLowerCase().includes('drink')) {
        icon = '💧';
    } else if (habit.name.toLowerCase().includes('exercise') || 
              habit.name.toLowerCase().includes('workout') || 
              habit.name.toLowerCase().includes('gym') ||
              habit.name.toLowerCase().includes('run')) {
        icon = '🏃';
    } else if (habit.name.toLowerCase().includes('read')) {
        icon = '📚';
    } else if (habit.name.toLowerCase().includes('meditate') || 
              habit.name.toLowerCase().includes('meditation')) {
        icon = '🧘';
    } else if (habit.name.toLowerCase().includes('sleep') || 
              habit.name.toLowerCase().includes('bed')) {
        icon = '😴';
    } else if (habit.name.toLowerCase().includes('code') || 
              habit.name.toLowerCase().includes('program')) {
        icon = '💻';
    } else if (habit.name.toLowerCase().includes('journal')) {
        icon = '✏️';
    } else if (habit.category_name) {
        // Set icon based on category
        const category = habit.category_name.toLowerCase();
        if (category.includes('health')) icon = '❤️';
        else if (category.includes('product')) icon = '⚡';
        else if (category.includes('learn')) icon = '🎓';
        else if (category.includes('personal')) icon = '🌱';
    }
    
    // Get icon background class based on category
    let iconClass = 'bg-blue';
    if (habit.category_name) {
        const category = habit.category_name.toLowerCase();
        if (category.includes('health')) iconClass = 'bg-green';
        else if (category.includes('product')) iconClass = 'bg-blue';
        else if (category.includes('learn')) iconClass = 'bg-purple';
        else if (category.includes('personal')) iconClass = 'bg-orange';
    }
    
    // Frequency text
    let frequencyText = 'Daily';
    if (habit.frequency === 'weekly') {
        frequencyText = 'Weekly';
    } else if (habit.frequency === 'custom') {
        frequencyText = 'Custom';
    }
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    card.innerHTML = `
        <div class="habit-header">
            <div>
                <div class="habit-title">${habit.name}</div>
                <div class="habit-subtitle">${frequencyText}${habit.description ? ' · ' + habit.description : ''}</div>
            </div>
            <div class="habit-icon ${iconClass}">${icon}</div>
        </div>
        
        <div class="habit-checkbox-container mb-3">
            <label class="d-flex align-items-center">
                <input type="checkbox" class="habit-checkbox me-2" 
                    id="habit-${habit.id}" 
                    data-habit-id="${habit.id}" 
                    ${habit.completed ? 'checked' : ''}>
                <span>Mark as complete for today</span>
            </label>
        </div>
        
        <div class="habit-progress">
            <div id="github-grid-${habit.id}" class="github-grid-container">
                <!-- GitHub grid will be loaded here -->
                <div class="text-center py-2">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span class="ms-2 small">Loading activity data...</span>
                </div>
            </div>
            
            <div class="streak-info">
                <span>Current streak: <span id="current-streak-${habit.id}">...</span> days</span>
                <span>Best: <span id="best-streak-${habit.id}">...</span> days</span>
            </div>
        </div>
        
        <div id="habit-stats-${habit.id}" class="habit-stats">
            <!-- Stats will be loaded here -->
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">COMPLETION</div>
            </div>
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">DAYS</div>
            </div>
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">STREAK</div>
            </div>
        </div>
    `;
    
    // Get streak info
    const userId = localStorage.getItem('user_id');
    
    // Get streak info
    fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habit.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update streak information
                document.getElementById(`current-streak-${habit.id}`).textContent = data.current_streak || 0;
                document.getElementById(`best-streak-${habit.id}`).textContent = data.longest_streak || 0;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    
    // Add event listener to checkbox
    card.querySelector('.habit-checkbox').addEventListener('change', function(e) {
        toggleHabitCompletion(habit.id, e.target.checked);
    });
    
    // Load GitHub grid and stats
    setTimeout(() => {
        generateGitHubGrid(habit.id, currentMonth, currentYear);
        generateMonthlyStats(habit.id, currentMonth, currentYear);
    }, 100);
    
    return card;
}

// Fixed toggleHabitCompletion function for GitHub-style habit tracker
function toggleHabitCompletion(habitId, completed) {
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
    formData.append('date', getTodayDate());
    
    // Add additional notes with timestamp to track in GitHub style
    if (completed) {
        // You can customize this to include more useful information
        const timestamp = new Date().toLocaleTimeString();
        formData.append('notes', `Completed at ${timestamp}`);
    }
    
    // Show loading indicator
    const checkbox = document.querySelector(`.habit-checkbox[data-habit-id="${habitId}"]`);
    const habitCard = checkbox.closest('.habit-card');
    const originalBackground = habitCard.style.backgroundColor;
    habitCard.style.backgroundColor = 'rgba(56, 139, 253, 0.1)';
    
    // Send request
    fetch(`backend/habit_logs.php?user_id=${userId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset background
        habitCard.style.backgroundColor = originalBackground;
        
        if (data.success) {
            // Add completed class
            if (completed) {
                habitCard.classList.add('completed');
                habitCard.classList.add('complete-animation');
                
                // Update streak info
                if (data.current_streak) {
                    document.getElementById(`current-streak-${habitId}`).textContent = data.current_streak;
                }
            } else {
                // Remove completed class
                habitCard.classList.remove('completed');
                
                // Update streak info
                if (data.current_streak !== undefined) {
                    document.getElementById(`current-streak-${habitId}`).textContent = data.current_streak;
                }
            }
            
            // Refresh the GitHub grid after a short delay to include the new data
            setTimeout(() => {
                const now = new Date();
                const currentMonth = now.getMonth() + 1; // 1-12
                const currentYear = now.getFullYear();
                
                generateGitHubGrid(habitId, currentMonth, currentYear);
                generateMonthlyStats(habitId, currentMonth, currentYear);
                
                // Also update dashboard stats
                loadDashboardStats();
            }, 500);
            
        } else {
            console.error('Failed to update habit:', data.message);
            showError('Failed to update habit. Please try again.');
            
            // Revert checkbox state
            checkbox.checked = !completed;
        }
    })
    .catch(error => {
        // Reset background
        habitCard.style.backgroundColor = originalBackground;
        
        console.error('Error:', error);
        showError('An error occurred. Please try again.');
        
        // Revert checkbox state
        checkbox.checked = !completed;
    });
}

// Add a more visible error function
function showError(message) {
    // Check if error container exists, create if not
    let errorContainer = document.getElementById('error-notification');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-notification';
        errorContainer.style.position = 'fixed';
        errorContainer.style.top = '20px';
        errorContainer.style.right = '20px';
        errorContainer.style.backgroundColor = '#f85149';
        errorContainer.style.color = 'white';
        errorContainer.style.padding = '12px 20px';
        errorContainer.style.borderRadius = '6px';
        errorContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        errorContainer.style.zIndex = '9999';
        errorContainer.style.maxWidth = '300px';
        document.body.appendChild(errorContainer);
    }
    
    // Set error message
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Override the original loadTodayHabits function to use GitHub style
function loadGitHubStyleHabits() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habits.php?user_id=${userId}&today=true`;
    
    // Show loading indicator
    const habitsContainer = document.getElementById('today-habits-list');
    habitsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading your habits...</p>
        </div>
    `;
    
    // Fetch today's habits
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear container
                habitsContainer.innerHTML = '';
                
                if (data.habits.length === 0) {
                    // Show empty state
                    showEmptyState(habitsContainer, 'You have no habits scheduled for today.', 'fa-calendar-plus');
                    return;
                }
                
                // Add habits using GitHub style
                data.habits.forEach(habit => {
                    const habitCard = createGitHubHabitCard(habit);
                    habitsContainer.appendChild(habitCard);
                });
                
                // Load statistics
                loadDashboardStats();
            } else {
                console.error('Failed to load habits:', data.message);
                showError('Failed to load habits. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        });
}

// Initialize GitHub style habit tracker
document.addEventListener('DOMContentLoaded', function() {
    // Replace the original loadTodayHabits function with our GitHub style version
    if (typeof window.originalLoadTodayHabits === 'undefined') {
        window.originalLoadTodayHabits = window.loadTodayHabits;
        window.loadTodayHabits = loadGitHubStyleHabits;
    }
    
    // Apply dark theme to body
    document.body.classList.add('github-theme');
});


// Mobile optimization updates for github-habits.js

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 576; // Typical mobile breakpoint
}

// Modify the renderGitHubGrid function to be more mobile-friendly
function renderGitHubGrid(habitId, month, year, completionMap, habit) {
    // Get the container for this habit's grid
    const gridContainer = document.getElementById(`github-grid-${habitId}`);
    if (!gridContainer) return;
    
    // Clear previous content
    gridContainer.innerHTML = '';
    
    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    
    // Create month header - simplified for mobile
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.innerHTML = `
        <div class="month-title">${monthNames[month - 1].substring(0, 3)} ${year}</div>
    `;
    gridContainer.appendChild(monthHeader);
    
    // Only add day labels if not on mobile
    if (!isMobileDevice()) {
        // Create day labels (Mon-Sun)
        const dayLabels = document.createElement('div');
        dayLabels.className = 'day-labels';
        
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        dayNames.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = day.substring(0, 1); // Just show first letter on smaller screens
            dayLabels.appendChild(dayLabel);
        });
        
        gridContainer.appendChild(dayLabels);
    }
    
    // Create GitHub grid
    const githubGrid = document.createElement('div');
    githubGrid.className = 'github-grid';
    
    // Get first day of month
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Adjust for Monday as first day of week (convert 0=Sunday to 6, otherwise subtract 1)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // For mobile, we might want to show fewer empty cells at the beginning
    const emptyToShow = isMobileDevice() ? Math.min(adjustedFirstDay, 3) : adjustedFirstDay;
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < emptyToShow; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'github-day empty';
        githubGrid.appendChild(emptyDay);
    }
    
    // Get last day of month
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // Determine how many days to show based on screen size
    const maxDaysToShow = isMobileDevice() ? 21 : daysInMonth; // Show up to 3 weeks on mobile
    const daysToShow = Math.min(daysInMonth, maxDaysToShow);
    
    // Add days of the month
    for (let day = 1; day <= daysToShow; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = formatDate(date);
        // Shorter date format for mobile
        const formattedDate = isMobileDevice() 
            ? `${month}/${day}` 
            : `${monthNames[month - 1]} ${day}`;
        
        // Get completion data for this date
        const completion = completionMap[dateStr] || { completed: false, value: "No activity" };
        
        // Determine completion level (0-4)
        let level = 0;
        if (completion.completed) {
            // Calculate level based on habit type and completion
            level = calculateCompletionLevel(habit, completion);
        }
        
        // Create day cell
        const dayCell = document.createElement('div');
        dayCell.className = `github-day level-${level}`;
        dayCell.setAttribute('data-date', formattedDate);
        
        // Simplify tooltips on mobile
        const tooltipValue = isMobileDevice() 
            ? (completion.completed ? "Yes" : "No") 
            : completion.value;
        dayCell.setAttribute('data-value', tooltipValue);
        
        githubGrid.appendChild(dayCell);
    }
    
    gridContainer.appendChild(githubGrid);
    
    // Add simplified color legend for mobile
    const colorLegend = document.createElement('div');
    colorLegend.className = 'color-legend';
    
    // Get legend items, but simplify for mobile
    let legendItems = getLegendItems(habit);
    
    // On mobile, show fewer legend items
    if (isMobileDevice()) {
        // Just show none, low, and high levels
        legendItems = [
            legendItems[0], // None
            legendItems[1], // Low/Min
            legendItems[4]  // High/Max
        ];
    }
    
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const legendSquare = document.createElement('div');
        legendSquare.className = `legend-square level-${item.level}`;
        
        const legendLabel = document.createElement('span');
        legendLabel.textContent = item.label;
        
        legendItem.appendChild(legendSquare);
        legendItem.appendChild(legendLabel);
        colorLegend.appendChild(legendItem);
    });
    
    gridContainer.appendChild(colorLegend);
}

// Modify the createGitHubHabitCard function for mobile
function createMobileOptimizedHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.id = `habit-card-${habit.id}`;
    
    // Add category-based styling
    if (habit.category_name) {
        const categoryClass = habit.category_name.toLowerCase().replace(/\s+/g, '-');
        card.classList.add(`${categoryClass}-category`);
    }
    
    // Mark as completed if needed
    if (habit.completed) {
        card.classList.add('completed');
    }
    
    // Determine icon based on habit name or category (same as before)
    let icon = '📋'; // Default icon
    
    if (habit.name.toLowerCase().includes('water') || habit.name.toLowerCase().includes('drink')) {
        icon = '💧';
    } else if (habit.name.toLowerCase().includes('exercise') || 
              habit.name.toLowerCase().includes('workout') || 
              habit.name.toLowerCase().includes('gym') ||
              habit.name.toLowerCase().includes('run')) {
        icon = '🏃';
    } else if (habit.name.toLowerCase().includes('read')) {
        icon = '📚';
    } else if (habit.name.toLowerCase().includes('meditate') || 
              habit.name.toLowerCase().includes('meditation')) {
        icon = '🧘';
    } else if (habit.name.toLowerCase().includes('sleep') || 
              habit.name.toLowerCase().includes('bed')) {
        icon = '😴';
    } else if (habit.name.toLowerCase().includes('code') || 
              habit.name.toLowerCase().includes('program')) {
        icon = '💻';
    } else if (habit.name.toLowerCase().includes('journal')) {
        icon = '✏️';
    } else if (habit.category_name) {
        // Set icon based on category
        const category = habit.category_name.toLowerCase();
        if (category.includes('health')) icon = '❤️';
        else if (category.includes('product')) icon = '⚡';
        else if (category.includes('learn')) icon = '🎓';
        else if (category.includes('personal')) icon = '🌱';
    }
    
    // Get icon background class based on category
    let iconClass = 'bg-blue';
    if (habit.category_name) {
        const category = habit.category_name.toLowerCase();
        if (category.includes('health')) iconClass = 'bg-green';
        else if (category.includes('product')) iconClass = 'bg-blue';
        else if (category.includes('learn')) iconClass = 'bg-purple';
        else if (category.includes('personal')) iconClass = 'bg-orange';
    }
    
    // Simplify frequency text for mobile
    let frequencyText = '';
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Create a more compact card for mobile
    card.innerHTML = `
        <div class="habit-header">
            <div>
                <div class="habit-title">${habit.name}</div>
                <div class="habit-subtitle">${frequencyText}</div>
            </div>
            <div class="habit-icon ${iconClass}">${icon}</div>
        </div>
        
        <div class="habit-checkbox-container mb-2">
            <label class="d-flex align-items-center">
                <input type="checkbox" class="habit-checkbox me-1" 
                    id="habit-${habit.id}" 
                    data-habit-id="${habit.id}" 
                    ${habit.completed ? 'checked' : ''}>
                <span>Complete</span>
            </label>
        </div>
        
        <div class="habit-progress">
            <div id="github-grid-${habit.id}" class="github-grid-container">
                <!-- GitHub grid will be loaded here -->
                <div class="text-center py-1">
                    <div class="spinner-border spinner-border-sm text-primary" style="width: 12px; height: 12px;" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            
            <div class="streak-info">
                <span>Streak: <span id="current-streak-${habit.id}">...</span></span>
                <span>Best: <span id="best-streak-${habit.id}">...</span></span>
            </div>
        </div>
        
        <div id="habit-stats-${habit.id}" class="habit-stats">
            <!-- Stats will be loaded here -->
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">%</div>
            </div>
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">DAYS</div>
            </div>
            <div class="stat">
                <div class="stat-value">--</div>
                <div class="stat-label">STREAK</div>
            </div>
        </div>
    `;
    
    // Get streak info - code remains the same
    const userId = localStorage.getItem('user_id');
    
    fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habit.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update streak information
                document.getElementById(`current-streak-${habit.id}`).textContent = data.current_streak || 0;
                document.getElementById(`best-streak-${habit.id}`).textContent = data.longest_streak || 0;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    
    // Add event listener to checkbox
    card.querySelector('.habit-checkbox').addEventListener('change', function(e) {
        toggleHabitCompletion(habit.id, e.target.checked);
    });
    
    // Load GitHub grid and stats
    setTimeout(() => {
        generateGitHubGrid(habit.id, currentMonth, currentYear);
        generateMonthlyStats(habit.id, currentMonth, currentYear);
    }, 100);
    
    return card;
}

// Override the loadGitHubStyleHabits function to use mobile optimized cards on small screens
function loadOptimizedHabits() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habits.php?user_id=${userId}&today=true`;
    
    // Show loading indicator
    const habitsContainer = document.getElementById('today-habits-list');
    habitsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading habits...</p>
        </div>
    `;
    
    // Fetch today's habits
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear container
                habitsContainer.innerHTML = '';
                
                if (data.habits.length === 0) {
                    // Show empty state
                    showEmptyState(habitsContainer, 'No habits today.', 'fa-calendar-plus');
                    return;
                }
                
                // Add habits using the appropriate card style based on screen size
                const isMobile = isMobileDevice();
                
                // Add habits using appropriate cards
                data.habits.forEach(habit => {
                    const habitCard = isMobile 
                        ? createMobileOptimizedHabitCard(habit) 
                        : createGitHubHabitCard(habit);
                    habitsContainer.appendChild(habitCard);
                });
                
                // Load statistics
                loadDashboardStats();
            } else {
                console.error('Failed to load habits:', data.message);
                showError('Failed to load habits. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        });
}

// Update initialization to use optimized loading
document.addEventListener('DOMContentLoaded', function() {
    // Replace the original loadTodayHabits function with our optimized version
    if (typeof window.originalLoadTodayHabits === 'undefined') {
        window.originalLoadTodayHabits = window.loadTodayHabits;
        window.loadTodayHabits = loadOptimizedHabits;
    }
    
    // Apply dark theme to body
    document.body.classList.add('github-theme');
    
    // Add mobile-specific class if on small screen
    if (isMobileDevice()) {
        document.body.classList.add('mobile-view');
    }
    
    // Add window resize listener to handle orientation changes
    window.addEventListener('resize', function() {
        const wasMobile = document.body.classList.contains('mobile-view');
        const isMobile = isMobileDevice();
        
        // If mobile state changed, reload the habits
        if (wasMobile !== isMobile) {
            if (isMobile) {
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
            
            // Reload habits with new layout
            loadOptimizedHabits();
        }
    });
});