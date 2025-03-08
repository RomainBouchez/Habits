// mobile-github-habits.js - Mobile-optimized functions for GitHub-style habit tracking

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 767; // Typical mobile breakpoint
}

// Function to check if device is very small (iPhone SE, etc.)
function isSmallDevice() {
    return window.innerWidth <= 375;
}

// Mobile-optimized function to render GitHub grid
function renderMobileGitHubGrid(habitId, month, year, completionMap, habit) {
    // Get the container for this habit's grid
    const gridContainer = document.getElementById(`github-grid-${habitId}`);
    if (!gridContainer) return;
    
    // Clear previous content
    gridContainer.innerHTML = '';
    
    // Get month name - use abbreviation on mobile
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const monthAbbrev = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Create month header - simplified for mobile
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.innerHTML = `
        <div class="month-title">${isSmallDevice() ? monthAbbrev[month - 1] : monthAbbrev[month - 1]} ${year}</div>
    `;
    gridContainer.appendChild(monthHeader);
    
    // Only add day labels if screen is not too small
    if (!isSmallDevice()) {
        // Create day labels (Mon-Sun) - just first letter on mobile
        const dayLabels = document.createElement('div');
        dayLabels.className = 'day-labels';
        
        const dayNames = ["M", "T", "W", "T", "F", "S", "S"]; // First letters for mobile
        dayNames.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'day-label';
            dayLabel.textContent = day;
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
    
    // For mobile, we show fewer empty cells at the beginning
    const emptyToShow = isSmallDevice() ? Math.min(adjustedFirstDay, 2) : adjustedFirstDay;
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < emptyToShow; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'github-day empty';
        githubGrid.appendChild(emptyDay);
    }
    
    // Get last day of month
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // For small devices, limit number of days shown
    const maxDaysToShow = isSmallDevice() ? 24 : daysInMonth;
    const daysToShow = Math.min(daysInMonth, maxDaysToShow);
    
    // Add days of the month
    for (let day = 1; day <= daysToShow; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = formatDate(date);
        // Shorter date format for mobile
        const formattedDate = isSmallDevice() 
            ? `${month}/${day}` 
            : `${monthAbbrev[month - 1]} ${day}`;
        
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
        const tooltipValue = isSmallDevice() 
            ? (completion.completed ? "Done" : "No") 
            : (completion.value.length > 15 ? completion.value.substring(0, 15) + "..." : completion.value);
        
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
    if (isSmallDevice()) {
        // Just show none and done levels
        legendItems = [
            { level: 0, label: 'None' },
            { level: 4, label: 'Done' }
        ];
    } else {
        // Show three levels for regular mobile
        legendItems = [
            { level: 0, label: 'None' },
            { level: 2, label: 'Some' },
            { level: 4, label: 'Done' }
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

// Mobile-optimized function to generate monthly stats
function generateMobileMonthlyStats(habitId, month, year) {
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
                
                // Simpler stats for small devices
                if (isSmallDevice()) {
                    statsContainer.innerHTML = `
                        <div class="stat">
                            <div class="stat-value">${completionRate}%</div>
                            <div class="stat-label">RATE</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${currentStreak}</div>
                            <div class="stat-label">STREAK</div>
                        </div>
                    `;
                } else {
                    // Regular mobile stats (3 columns)
                    statsContainer.innerHTML = `
                        <div class="stat">
                            <div class="stat-value">${completionRate}%</div>
                            <div class="stat-label">RATE</div>
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
                }
            } else {
                console.error('Failed to load habit logs:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Create a mobile-optimized habit card
function createMobileHabitCard(habit) {
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
    
    // Determine icon based on habit name or category (same as desktop)
    let icon = '📋'; // Default icon
    
    if (habit.name.toLowerCase().includes('water') || habit.name.toLowerCase().includes('drink')) {
        icon = '💧';
    } else if (habit.name.toLowerCase().includes('exercise') || 
              habit.name.toLowerCase().includes('workout') || 
              habit.name.toLowerCase().includes('gym') ||
              habit.name.toLowerCase().includes('run') ||
              habit.name.toLowerCase().includes('step') ||
              habit.name.toLowerCase().includes('steps')) {
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
    if (habit.description) {
        frequencyText = habit.description.length > 15 ? habit.description.substring(0, 15) : habit.description;
    } else if (habit.frequency === 'daily') {
        frequencyText = 'Daily';
    } else if (habit.frequency === 'weekly') {
        frequencyText = 'Weekly';
    }
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Create compact card for mobile
    card.innerHTML = `
        <div class="habit-header">
            <div>
                <div class="habit-title">${habit.name}</div>
                <div class="habit-subtitle">${frequencyText}</div>
            </div>
            <div class="habit-icon ${iconClass}">${icon}</div>
        </div>
        
        <div class="habit-checkbox-container">
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
                    <div class="spinner-border spinner-border-sm text-primary" style="width: 10px; height: 10px;" role="status">
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
                <div class="stat-label">RATE</div>
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
    
    // Load GitHub grid and stats with mobile optimizations
    setTimeout(() => {
        // Use mobile-optimized functions
        if (isMobileDevice()) {
            // Get completion data
            const userId = localStorage.getItem('user_id');
            if (!userId) return;
            
            // Calculate dates
            const firstDay = new Date(currentYear, currentMonth - 1, 1);
            const lastDay = new Date(currentYear, currentMonth, 0);
            const startDate = formatDate(firstDay);
            const endDate = formatDate(lastDay);
            
            // Fetch data for mobile grid
            fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}&start_date=${startDate}&end_date=${endDate}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Create completion map
                        const completionMap = {};
                        
                        // Initialize dates
                        for (let day = 1; day <= lastDay.getDate(); day++) {
                            const date = new Date(currentYear, currentMonth - 1, day);
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
                        
                        // Get habit details for mobile grid
                        getHabitDetails(habitId, habit => {
                            renderMobileGitHubGrid(habitId, currentMonth, currentYear, completionMap, habit);
                            generateMobileMonthlyStats(habitId, currentMonth, currentYear);
                        });
                    }
                })
                .catch(error => console.error('Error loading mobile grid:', error));
        } else {
            // Use desktop functions for larger screens
            generateGitHubGrid(habitId, currentMonth, currentYear);
            generateMonthlyStats(habitId, currentMonth, currentYear);
        }
    }, 100);
    
    return card;
}

// Mobile-optimized toggleHabitCompletion function
function toggleMobileHabitCompletion(habitId, completed) {
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
    
    // Add notes with simplified format for mobile
    if (completed) {
        // Simpler notes for mobile
        formData.append('notes', `Done`);
    }
    
    // Show loading indicator
    const checkbox = document.querySelector(`.habit-checkbox[data-habit-id="${habitId}"]`);
    const habitCard = checkbox.closest('.habit-card');
    
    // Simple loading indicator for mobile
    habitCard.style.opacity = '0.7';
    
    // Send request
    fetch(`backend/habit_logs.php?user_id=${userId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset opacity
        habitCard.style.opacity = '1';
        
        if (data.success) {
            // Add or remove completed class
            if (completed) {
                habitCard.classList.add('completed');
                
                // Update streak info
                if (data.current_streak) {
                    document.getElementById(`current-streak-${habitId}`).textContent = data.current_streak;
                }
            } else {
                habitCard.classList.remove('completed');
                
                // Update streak info
                if (data.current_streak !== undefined) {
                    document.getElementById(`current-streak-${habitId}`).textContent = data.current_streak;
                }
            }
            
            // Refresh data after short delay
            setTimeout(() => {
                const now = new Date();
                
                // Use mobile-optimized refresh if on mobile
                if (isMobileDevice()) {
                    // Get completion data for refresh
                    const userId = localStorage.getItem('user_id');
                    if (!userId) return;
                    
                    // Calculate dates
                    const currentMonth = now.getMonth() + 1;
                    const currentYear = now.getFullYear();
                    const firstDay = new Date(currentYear, currentMonth - 1, 1);
                    const lastDay = new Date(currentYear, currentMonth, 0);
                    const startDate = formatDate(firstDay);
                    const endDate = formatDate(lastDay);
                    
                    // Fetch updated data
                    fetch(`backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}&start_date=${startDate}&end_date=${endDate}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Create completion map
                                const completionMap = {};
                                
                                // Initialize dates
                                for (let day = 1; day <= lastDay.getDate(); day++) {
                                    const date = new Date(currentYear, currentMonth - 1, day);
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
                                
                                // Update mobile grid and stats
                                getHabitDetails(habitId, habit => {
                                    renderMobileGitHubGrid(habitId, currentMonth, currentYear, completionMap, habit);
                                    generateMobileMonthlyStats(habitId, currentMonth, currentYear);
                                });
                                
                                // Update dashboard stats
                                loadDashboardStats();
                            }
                        })
                        .catch(error => console.error('Error refreshing mobile grid:', error));
                } else {
                    // Use desktop refresh for larger screens
                    generateGitHubGrid(habitId, now.getMonth() + 1, now.getFullYear());
                    generateMonthlyStats(habitId, now.getMonth() + 1, now.getFullYear());
                    loadDashboardStats();
                }
            }, 300);
        } else {
            console.error('Failed to update habit:', data.message);
            showMobileError('Update failed');
            
            // Revert checkbox state
            checkbox.checked = !completed;
        }
    })
    .catch(error => {
        // Reset opacity
        habitCard.style.opacity = '1';
        
        console.error('Error:', error);
        showMobileError('Error occurred');
        
        // Revert checkbox state
        checkbox.checked = !completed;
    });
}

// Show error in mobile-friendly way
function showMobileError(message) {
    // Create simpler error notification that works better on mobile
    let errorToast = document.getElementById('mobile-error-toast');
    
    if (!errorToast) {
        errorToast = document.createElement('div');
        errorToast.id = 'mobile-error-toast';
        errorToast.style.position = 'fixed';
        errorToast.style.bottom = '20px';
        errorToast.style.left = '50%';
        errorToast.style.transform = 'translateX(-50%)';
        errorToast.style.backgroundColor = '#f85149';
        errorToast.style.color = 'white';
        errorToast.style.padding = '8px 16px';
        errorToast.style.borderRadius = '20px';
        errorToast.style.fontSize = '14px';
        errorToast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        errorToast.style.zIndex = '9999';
        document.body.appendChild(errorToast);
    }
    
    errorToast.textContent = message;
    errorToast.style.display = 'block';
    
    // Hide after 3 seconds (shorter for mobile)
    setTimeout(() => {
        errorToast.style.display = 'none';
    }, 3000);
}

// Load habits with mobile optimization
function loadMobileHabits() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habits.php?user_id=${userId}&today=true`;
    
    // Show loading indicator optimized for mobile
    const habitsContainer = document.getElementById('today-habits-list');
    habitsContainer.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-primary" style="width: 1.5rem; height: 1.5rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted small">Loading habits...</p>
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
                    // Show mobile-friendly empty state
                    habitsContainer.innerHTML = `
                        <div class="text-center py-3">
                            <i class="fas fa-check-circle text-muted mb-2" style="font-size: 1.5rem;"></i>
                            <p class="text-muted small">No habits for today.</p>
                        </div>
                    `;
                    return;
                }
                
                // Create card container optimized for mobile
                const cardContainer = document.createElement('div');
                cardContainer.className = 'card-container';
                habitsContainer.appendChild(cardContainer);
                
                // Add habits with mobile cards
                data.habits.forEach(habit => {
                    const habitCard = createMobileHabitCard(habit);
                    cardContainer.appendChild(habitCard);
                });
                
                // Load mobile-optimized dashboard stats
                loadDashboardStats();
            } else {
                console.error('Failed to load habits:', data.message);
                showMobileError('Failed to load');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMobileError('Error occurred');
        });
}

// Re-route functions based on device type
document.addEventListener('DOMContentLoaded', function() {
    // Check if mobile
    const isMobile = isMobileDevice();
    
    // Apply mobile theme if needed
    if (isMobile) {
        document.body.classList.add('mobile-view');
        
        // Replace functions with mobile versions
        window.originalToggleHabitCompletion = window.toggleHabitCompletion;
        window.toggleHabitCompletion = toggleMobileHabitCompletion;
        
        window.originalLoadTodayHabits = window.loadTodayHabits;
        window.loadTodayHabits = loadMobileHabits;
        
        // Call mobile loading function
        loadMobileHabits();
    } else {
        // Apply desktop theme
        document.body.classList.add('desktop-view');
    }
    
    // Handle resize events for orientation changes
    window.addEventListener('resize', debounce(function() {
        const wasMobile = document.body.classList.contains('mobile-view');
        const isNowMobile = isMobileDevice();
        
        // Only reload if device type changed
        if (wasMobile !== isNowMobile) {
            // Update classes
            if (isNowMobile) {
                document.body.classList.add('mobile-view');
                document.body.classList.remove('desktop-view');
                
                // Update functions
                window.toggleHabitCompletion = toggleMobileHabitCompletion;
                window.loadTodayHabits = loadMobileHabits;
                
                // Reload with mobile view
                loadMobileHabits();
            } else {
                document.body.classList.remove('mobile-view');
                document.body.classList.add('desktop-view');
                
                // Restore original functions
                window.toggleHabitCompletion = window.originalToggleHabitCompletion;
                window.loadTodayHabits = window.originalLoadTodayHabits;
                
                // Reload with desktop view
                loadGitHubStyleHabits();
            }
        }
    }, 250));
});

// Utility function to debounce resize events
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}