// Function to update habit data
function updateHabit(habitId, habitData) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Show loading indicator
    const habitCard = document.getElementById(`habit-card-${habitId}`);
    if (habitCard) {
        habitCard.classList.add('updating');
    }
    
    // Create form data for PUT request
    let formData = new URLSearchParams();
    formData.append('habit_id', habitId);
    
    // Add all habit data to form
    for (const [key, value] of Object.entries(habitData)) {
        if (value !== null) {
            formData.append(key, value);
        }
    }
    
    // Send request
    fetch(`backend/habits.php?user_id=${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload habits to reflect changes
            if (typeof loadMobileHabits === 'function') {
                loadMobileHabits();
            } else if (typeof loadEnhancedMobileHabits === 'function') {
                loadEnhancedMobileHabits();
            } else {
                loadGitHubStyleHabits();
            }
            
            // Show success message
            showMobileSuccess('Habit updated');
        } else {
            console.error('Failed to update habit:', data.message);
            
            // Remove loading state
            if (habitCard) {
                habitCard.classList.remove('updating');
            }
            
            showMobileError('Failed to update habit');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Remove loading state
        if (habitCard) {
            habitCard.classList.remove('updating');
        }
        
        showMobileError('An error occurred');
    });
}

// Function to delete habit
function deleteHabit(habitId) {
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create form data
    let formData = `habit_id=${habitId}`;
    
    // Send delete request
    fetch(`backend/habits.php?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove the habit card with animation
            const habitCard = document.getElementById(`habit-card-${habitId}`);
            if (habitCard) {
                habitCard.classList.add('removing');
                setTimeout(() => {
                    if (habitCard.parentNode) {
                        habitCard.parentNode.removeChild(habitCard);
                    }
                }, 300);
            }
            
            // Show success message
            showMobileSuccess('Habit deleted');
        } else {
            console.error('Failed to delete habit:', data.message);
            showMobileError('Failed to delete habit');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMobileError('An error occurred');
    });
}

// Function to load mobile-optimized habits
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
                
                // First get habit stats to enhance habit objects
                getHabitsStats(userId)
                    .then(statsData => {
                        // Enhance habits with stats data
                        const enhancedHabits = enhanceHabitsWithStats(data.habits, statsData);
                        
                        // Add habits with mobile cards
                        enhancedHabits.forEach(habit => {
                            const habitCard = createMobileHabitCard(habit);
                            cardContainer.appendChild(habitCard);
                        });
                    })
                    .catch(error => {
                        console.error('Error loading stats:', error);
                        
                        // If stats failed to load, still show habits without enhanced stats
                        data.habits.forEach(habit => {
                            const habitCard = createMobileHabitCard(habit);
                            cardContainer.appendChild(habitCard);
                        });
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

// Function to get habits stats
function getHabitsStats(userId) {
    return new Promise((resolve, reject) => {
        fetch(`backend/habit_logs.php?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.stats || []);
                } else {
                    reject(new Error(data.message));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Function to enhance habits with stats data
function enhanceHabitsWithStats(habits, statsData) {
    return habits.map(habit => {
        // Find matching stats
        const stats = statsData.find(stat => stat.id === habit.id);
        
        if (stats) {
            // Enhance habit with stats data
            return {
                ...habit,
                current_streak: stats.current_streak || 0,
                longest_streak: stats.longest_streak || 0,
                completion_rate: stats.completion_rate || 0,
                completed_count: stats.completed_count || 0,
                total_days: stats.total_days || 0
            };
        }
        
        return habit;
    });
}

// Show success toast message
function showMobileSuccess(message) {
    let successToast = document.getElementById('mobile-success-toast');
    
    if (!successToast) {
        successToast = document.createElement('div');
        successToast.id = 'mobile-success-toast';
        successToast.className = 'mobile-toast success-toast';
        document.body.appendChild(successToast);
    }
    
    successToast.textContent = message;
    successToast.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
        successToast.classList.remove('show');
    }, 2000);
}

// Show error toast message
function showMobileError(message) {
    let errorToast = document.getElementById('mobile-error-toast');
    
    if (!errorToast) {
        errorToast = document.createElement('div');
        errorToast.id = 'mobile-error-toast';
        errorToast.className = 'mobile-toast error-toast';
        document.body.appendChild(errorToast);
    }
    
    errorToast.textContent = message;
    errorToast.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
        errorToast.classList.remove('show');
    }, 2000);
}

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 767;
}

// Helper function to get habit data by ID
function getHabitData(habitId) {
    return new Promise((resolve, reject) => {
        // Get user ID from localStorage
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            reject(new Error('User not logged in'));
            return;
        }
        
        // Create request URL
        const url = `backend/habits.php?user_id=${userId}&habit_id=${habitId}`;
        
        // Fetch habit data
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Get habit stats
                    return getHabitStats(habitId).then(stats => {
                        // Combine habit data with stats
                        resolve({
                            ...data.habit,
                            ...stats
                        });
                    });
                } else {
                    reject(new Error(data.message));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Function to get habit stats
function getHabitStats(habitId) {
    return new Promise((resolve, reject) => {
        // Get user ID from localStorage
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            reject(new Error('User not logged in'));
            return;
        }
        
        // Create request URL
        const url = `backend/habit_logs.php?user_id=${userId}&habit_id=${habitId}`;
        
        // Fetch habit stats
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Extract stats
                    resolve({
                        current_streak: data.current_streak || 0,
                        longest_streak: data.longest_streak || 0,
                        logs: data.logs || []
                    });
                } else {
                    reject(new Error(data.message));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Utility function to format date in YYYY-MM-DD format
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Utility function to get today's date
function getTodayDate() {
    return formatDate(new Date());
}