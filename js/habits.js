// habits.js - Handles habits functionality

// Load today's habits
function loadTodayHabits() {
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
                
                // Add habits
                data.habits.forEach(habit => {
                    const habitCard = createHabitCard(habit);
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

// Load all habits
function loadAllHabits() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habits.php?user_id=${userId}`;
    
    // Show loading indicator
    const habitsList = document.getElementById('habits-list');
    habitsList.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading your habits...</p>
        </div>
    `;
    
    // Fetch habits
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear list
                habitsList.innerHTML = '';
                
                if (data.habits.length === 0) {
                    // Show empty state
                    habitsList.innerHTML = `
                        <div class="text-center py-5">
                            <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                            <h4>No habits found</h4>
                            <p class="text-muted">Click the "Add New Habit" button to create your first habit.</p>
                        </div>
                    `;
                    return;
                }
                
                // Add habits
                data.habits.forEach(habit => {
                    const habitItem = document.createElement('div');
                    habitItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    // Set category-based border color
                    if (habit.category_name) {
                        const categoryClass = habit.category_name.toLowerCase().replace(/\s+/g, '-');
                        habitItem.classList.add(`${categoryClass}-category`);
                    }
                    
                    // Frequency text
                    let frequencyText = 'Daily';
                    if (habit.frequency === 'weekly') {
                        frequencyText = 'Weekly';
                    } else if (habit.frequency === 'custom') {
                        frequencyText = 'Custom';
                    }
                    
                    habitItem.innerHTML = `
                        <div>
                            <h5 class="mb-1">${habit.name}</h5>
                            <p class="mb-1 text-muted">${habit.description || ''}</p>
                            <small class="text-muted">
                                ${habit.category_name ? `<span class="badge bg-secondary me-2">${habit.category_name}</span>` : ''}
                                <span class="badge bg-info">${frequencyText}</span>
                            </small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-2 edit-habit-btn" data-habit-id="${habit.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-habit-btn" data-habit-id="${habit.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    habitsList.appendChild(habitItem);
                });
                
                // Add event listeners to buttons
                addHabitButtonListeners();
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

// Create habit card for today's view
function createHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'card mb-3 habit-card';
    
    // Add category-based styling
    if (habit.category_name) {
        const categoryClass = habit.category_name.toLowerCase().replace(/\s+/g, '-');
        card.classList.add(`${categoryClass}-category`);
    }
    
    // Mark as completed if needed
    if (habit.completed) {
        card.classList.add('completed');
    }
    
    // Get streak info
    const streak = getStreakInfo(habit.id);
    
    card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <div class="form-check">
                    <input class="form-check-input habit-checkbox" type="checkbox" 
                        id="habit-${habit.id}" 
                        data-habit-id="${habit.id}" 
                        ${habit.completed ? 'checked' : ''}>
                </div>
                <div class="ms-3">
                    <h5 class="card-title mb-1">${habit.name}</h5>
                    <p class="card-text text-muted mb-0 small">
                        ${habit.category_name ? `<span class="badge bg-secondary me-2">${habit.category_name}</span>` : ''}
                    </p>
                </div>
            </div>
            <div class="text-end">
                ${streak > 0 ? `
                    <span class="streak-badge">
                        <i class="fas fa-fire"></i> ${streak}
                    </span>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add event listener to checkbox
    card.querySelector('.habit-checkbox').addEventListener('change', function(e) {
        toggleHabitCompletion(habit.id, e.target.checked);
    });
    
    return card;
}

// Add event listeners to habit management buttons
function addHabitButtonListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-habit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const habitId = this.getAttribute('data-habit-id');
            editHabit(habitId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-habit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const habitId = this.getAttribute('data-habit-id');
            deleteHabit(habitId);
        });
    });
}

// Toggle habit completion
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
    
    // Send request
    fetch(`backend/habit_logs.php?user_id=${userId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Find the habit card
            const habitCard = document.querySelector(`.habit-card .habit-checkbox[data-habit-id="${habitId}"]`).closest('.habit-card');
            
            if (completed) {
                // Add completed class
                habitCard.classList.add('completed');
                habitCard.classList.add('complete-animation');
                
                // Update streak badge
                let streakBadge = habitCard.querySelector('.streak-badge');
                const streak = data.current_streak;
                
                if (streak > 0) {
                    if (streakBadge) {
                        streakBadge.innerHTML = `<i class="fas fa-fire"></i> ${streak}`;
                    } else {
                        // Create new streak badge
                        const badgeContainer = habitCard.querySelector('.text-end');
                        badgeContainer.innerHTML = `
                            <span class="streak-badge">
                                <i class="fas fa-fire"></i> ${streak}
                            </span>
                        `;
                    }
                }
            } else {
                // Remove completed class
                habitCard.classList.remove('completed');
                
                // Update streak badge
                const streakBadge = habitCard.querySelector('.streak-badge');
                if (streakBadge && data.current_streak === 0) {
                    streakBadge.remove();
                } else if (streakBadge) {
                    streakBadge.innerHTML = `<i class="fas fa-fire"></i> ${data.current_streak}`;
                }
            }
            
            // Update dashboard stats
            loadDashboardStats();
        } else {
            console.error('Failed to update habit:', data.message);
            showError('Failed to update habit. Please try again.');
            
            // Revert checkbox
            document.querySelector(`.habit-checkbox[data-habit-id="${habitId}"]`).checked = !completed;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('An error occurred. Please try again.');
        
        // Revert checkbox
        document.querySelector(`.habit-checkbox[data-habit-id="${habitId}"]`).checked = !completed;
    });
}

// Load dashboard statistics
function loadDashboardStats() {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/habit_logs.php?user_id=${userId}`;
    
    // Fetch stats
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update streak count
                let totalStreak = 0;
                
                // Find highest streak
                if (data.stats && data.stats.length > 0) {
                    data.stats.forEach(stat => {
                        if (stat.current_streak > totalStreak) {
                            totalStreak = stat.current_streak;
                        }
                    });
                }
                
                document.getElementById('current-streak-count').textContent = totalStreak;
                
                // Calculate completion rate
                let completed = 0;
                let total = 0;
                
                // Get today's habits
                const todayHabits = document.querySelectorAll('.habit-checkbox');
                total = todayHabits.length;
                
                // Count completed habits
                todayHabits.forEach(checkbox => {
                    if (checkbox.checked) {
                        completed++;
                    }
                });
                
                // Calculate rate
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                document.getElementById('completion-rate').textContent = `${rate}%`;
            } else {
                console.error('Failed to load stats:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Get streak info for a habit
function getStreakInfo(habitId) {
    // This is a simplified version - normally you'd fetch this from the server
    // For now, we'll return a placeholder value
    return 0;
}

// Edit habit
function editHabit(habitId) {
    // This would open a modal to edit the habit
    // For simplicity, we're not implementing this fully
    alert(`Edit habit ${habitId} - This would open an edit modal`);
}

// Delete habit
function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
        // Get user ID from localStorage
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            console.error('User not logged in');
            return;
        }
        
        // Create request body
        const data = `habit_id=${habitId}`;
        
        // Send delete request
        fetch(`backend/habits.php?user_id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload habits
                loadAllHabits();
                
                // Show success message
                alert('Habit deleted successfully.');
            } else {
                console.error('Failed to delete habit:', data.message);
                showError('Failed to delete habit. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred. Please try again.');
        });
    }
}

// Add event listener for save habit button
document.getElementById('save-habit-btn').addEventListener('click', function() {
    // Get form data
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-description').value;
    const categoryId = document.getElementById('habit-category').value;
    const frequency = document.querySelector('input[name="frequency"]:checked').value;
    
    // Validate form
    if (!name) {
        alert('Please enter a habit name.');
        return;
    }
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category_id', categoryId);
    formData.append('frequency', frequency);
    
    // Handle custom frequency
    if (frequency === 'custom') {
        const days = {};
        document.querySelectorAll('#custom-days input[type="checkbox"]:checked').forEach(checkbox => {
            days[checkbox.value] = true;
        });
        
        formData.append('days', JSON.stringify(days));
    }
    
    // Send request
    fetch(`backend/habits.php?user_id=${userId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('add-habit-modal'));
            modal.hide();
            
            // Reset form
            document.getElementById('add-habit-form').reset();
            
            // Reload habits if on habits page
            if (!document.getElementById('habits-section').classList.contains('d-none')) {
                loadAllHabits();
            }
            
            // Show success message
            alert('Habit created successfully.');
        } else {
            console.error('Failed to create habit:', data.message);
            showError('Failed to create habit. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('An error occurred. Please try again.');
    });
});