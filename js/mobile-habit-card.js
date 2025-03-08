// mobile-habit-card.js - Functions for creating and managing mobile habit cards

// Function to create a mobile habit card
function createMobileHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.id = `habit-card-${habit.id}`;
    
    // Determine color based on category
    let cardColor = '#2196F3'; // Default blue
    if (habit.category_name) {
        const category = habit.category_name.toLowerCase();
        if (category.includes('health')) cardColor = '#4CAF50'; // Green
        else if (category.includes('product')) cardColor = '#2196F3'; // Blue
        else if (category.includes('learn')) cardColor = '#9C27B0'; // Purple
        else if (category.includes('personal')) cardColor = '#FF9800'; // Orange
    }
    
    // Set custom property for card color
    card.style.setProperty('--habit-color', cardColor);
    
    // Determine icon based on habit name or category
    let icon = 'clipboard-list'; // Default icon
    if (habit.name.toLowerCase().includes('water') || habit.name.toLowerCase().includes('drink')) {
        icon = 'tint';
    } else if (habit.name.toLowerCase().includes('exercise') || 
               habit.name.toLowerCase().includes('workout') || 
               habit.name.toLowerCase().includes('gym')) {
        icon = 'running';
    } else if (habit.name.toLowerCase().includes('read')) {
        icon = 'book';
    } else if (habit.name.toLowerCase().includes('meditate')) {
        icon = 'om';
    } else if (habit.name.toLowerCase().includes('sleep')) {
        icon = 'bed';
    } else if (habit.name.toLowerCase().includes('study')) {
        icon = 'graduation-cap';
    } else if (habit.name.toLowerCase().includes('work') || habit.name.toLowerCase().includes('review')) {
        icon = 'briefcase';
    }
    
    // Get streak information
    const currentStreak = habit.current_streak || 0;
    const longestStreak = habit.longest_streak || 0;
    
    // Generate motivational message based on streak
    let message = '';
    if (currentStreak === 0) {
        message = 'Start your streak today! 🚀';
    } else if (currentStreak === 1) {
        message = 'Great start! Keep going! ⭐';
    } else if (currentStreak < 5) {
        message = 'Building momentum! 💪';
    } else if (currentStreak < 10) {
        message = 'Impressive streak! 🔥';
    } else {
        message = 'Amazing dedication! 🏆';
    }
    
    // Create card HTML
    card.innerHTML = `
        <div class="habit-header">
            <div class="habit-title-area">
                <div class="habit-icon-container" style="background-color: ${cardColor}20;">
                    <i class="fas fa-${icon}" style="color: ${cardColor};"></i>
                </div>
                <div class="habit-details">
                    <h3>${habit.name}</h3>
                    <div class="habit-metadata">
                        ${currentStreak > 0 ? 
                        `<div class="streak-info"><i class="fas fa-fire"></i> ${currentStreak}d</div>` 
                        : '<div class="streak-info"><i class="fas fa-fire"></i> 0d</div>'}
                        ${longestStreak > 0 ? 
                        `<div class="trophy-info"><i class="fas fa-trophy"></i> ${longestStreak}d</div>` 
                        : ''}
                    </div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="action-button settings-button" data-habit-id="${habit.id}">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="action-button info-button" data-habit-id="${habit.id}">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="action-button calendar-button" data-habit-id="${habit.id}">
                    <i class="fas fa-calendar-alt"></i>
                </button>
            </div>
        </div>
        
        <div class="habit-message" style="color: ${cardColor};">
            ${message}
        </div>
        
        <div class="grid-container">
            <div class="github-grid" id="grid-${habit.id}">
                ${generateMiniGrid(habit, cardColor)}
            </div>
        </div>
        
        <div class="habit-footer">
            <div class="habit-category" style="color: ${cardColor};">
                ${habit.category_name || 'Uncategorized'}
            </div>
            <div class="habit-stats">
                <div class="stat-buttons">
                    <button class="stat-button" data-habit-id="${habit.id}" data-action="stats">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="stat-button" data-habit-id="${habit.id}" data-action="notes">
                        <i class="fas fa-comment-alt"></i>
                    </button>
                    <button class="stat-button" data-habit-id="${habit.id}" data-action="progress">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                </div>
                <div class="frequency-display">
                    ${habit.completed ? '1/1d' : '0/1d'}
                </div>
            </div>
        </div>
        
        <div class="completion-indicator ${habit.completed ? 'completed' : ''}"></div>
    `;
    
    // Add event listeners after creating the card
    setTimeout(() => {
        addCardEventListeners(card, habit);
    }, 0);
    
    return card;
}

// Helper function to generate a mini habit grid
function generateMiniGrid(habit, color) {
    // Generate a 7x7 grid for visualization
    let gridHtml = '';
    
    // Get today and past 48 days
    const today = new Date();
    const days = [];
    
    for (let i = 48; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        days.push(day);
    }
    
    // Create grid cells
    days.forEach((day, index) => {
        // For demo, randomly determine if day is completed 
        // In a real implementation, this would use actual data
        let isCompleted = false;
        
        // If the habit is currently completed, make the recent days completed
        if (habit.completed && index > 44) {
            isCompleted = true;
        } else if (Math.random() > 0.7) { // Random pattern for older days
            isCompleted = true;
        }
        
        const cellStyle = isCompleted ? `background-color: ${color};` : 'background-color: #1e2937;';
        gridHtml += `<div class="github-day" style="${cellStyle}"></div>`;
    });
    
    return gridHtml;
}

// Function to add event listeners to card elements
function addCardEventListeners(card, habit) {
    // Card click for completion toggle
    card.addEventListener('click', function(e) {
        // Only toggle completion if not clicking a button
        if (!e.target.closest('.action-button') && 
            !e.target.closest('.stat-button')) {
            toggleHabitCompletion(card, habit);
        }
    });
    
    // Settings button
    const settingsBtn = card.querySelector('.settings-button');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            // Call settings modal with this habit
            if (typeof showSettingsModal === 'function') {
                showSettingsModal(habit);
            } else {
                console.log('Settings clicked for habit:', habit.id);
            }
        });
    }
    
    // Info button
    const infoBtn = card.querySelector('.info-button');
    if (infoBtn) {
        infoBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            // Call info modal with this habit
            if (typeof showInfoModal === 'function') {
                showInfoModal(habit);
            } else {
                console.log('Info clicked for habit:', habit.id);
            }
        });
    }
    
    // Calendar button
    const calendarBtn = card.querySelector('.calendar-button');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            // Call calendar modal with this habit
            if (typeof showCalendarModal === 'function') {
                showCalendarModal(habit);
            } else {
                console.log('Calendar clicked for habit:', habit.id);
            }
        });
    }
    
    // Stat buttons
    const statButtons = card.querySelectorAll('.stat-button');
    statButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            const action = this.getAttribute('data-action');
            console.log(`Stat action '${action}' clicked for habit:`, habit.id);
            
            // Show info modal for stats action
            if (action === 'stats' && typeof showInfoModal === 'function') {
                showInfoModal(habit);
            }
        });
    });
}

// Function to toggle habit completion
function toggleHabitCompletion(cardElement, habit) {
    const indicator = cardElement.querySelector('.completion-indicator');
    const isCompleted = indicator.classList.contains('completed');
    
    // Toggle local UI state
    if (isCompleted) {
        indicator.classList.remove('completed');
        habit.completed = false;
        
        // Update frequency display
        const freqDisplay = cardElement.querySelector('.frequency-display');
        if (freqDisplay) freqDisplay.textContent = '0/1d';
    } else {
        indicator.classList.add('completed');
        habit.completed = true;
        
        // Add animation
        cardElement.classList.add('completion-animation');
        setTimeout(() => {
            cardElement.classList.remove('completion-animation');
        }, 1000);
        
        // Update frequency display
        const freqDisplay = cardElement.querySelector('.frequency-display');
        if (freqDisplay) freqDisplay.textContent = '1/1d';
    }
    
    // Call the backend update function if available
    if (typeof toggleHabitCompletion === 'function' && typeof toggleHabitCompletion !== 'undefined') {
        console.log('Updating habit completion status in backend...');
        // Use the original function from habits.js but supply only the ID and completion state
        window.originalToggleHabitCompletion(habit.id, !isCompleted);
    }
}

// Initialize function to setup the habits display for mobile
function initMobileHabitsDisplay() {
    console.log("Initializing mobile habits display...");
    
    // Backup original toggle function if it exists
    if (typeof window.toggleHabitCompletion === 'function' && 
        typeof window.originalToggleHabitCompletion === 'undefined') {
        window.originalToggleHabitCompletion = window.toggleHabitCompletion;
    }
    
    // Modify container to show 3 cards per row
    const habitsContainer = document.getElementById('today-habits-list');
    if (habitsContainer) {
        // Clear existing content
        habitsContainer.innerHTML = '';
        
        // Create a card container for the grid layout
        const cardContainer = document.createElement('div');
        cardContainer.className = 'mobile-card-container';
        
        // Add the container to the original container
        habitsContainer.appendChild(cardContainer);
    }
    
    // Apply dark theme
    document.body.classList.add('dark-theme');
    
    // Create sample habits immediately for demo
    createSampleHabits();
    
    // Check if we need to load real data as well
    const userId = localStorage.getItem('user_id');
    if (userId && typeof loadMobileHabits === 'function') {
        // Load real habits if logged in
        // Uncomment the line below if you want to load real data instead
        // loadMobileHabits();
    }
}

// Function to create sample habits when not logged in
function createSampleHabits() {
    const cardContainer = document.querySelector('.mobile-card-container');
    if (!cardContainer) {
        console.error("Card container not found!");
        return;
    }
    
    // Clear container
    cardContainer.innerHTML = '';
    
    // Create exactly 3 sample habits
    const sampleHabits = [
        {
            id: 1,
            name: 'Daily Exercise',
            category_name: 'Health',
            current_streak: 5,
            longest_streak: 10,
            completed: true,
            description: 'A quick 20-minute workout'
        },
        {
            id: 2,
            name: 'Read 30 Minutes',
            category_name: 'Learning',
            current_streak: 0,
            longest_streak: 7,
            completed: false,
            description: 'Read a book daily'
        },
        {
            id: 3,
            name: 'Meditate',
            category_name: 'Personal',
            current_streak: 2,
            longest_streak: 14,
            completed: false,
            description: '10 minutes of mindfulness'
        }
    ];
    
    // Add sample habits to container
    sampleHabits.forEach(habit => {
        const card = createMobileHabitCard(habit);
        cardContainer.appendChild(card);
    });
}

// Run initialization when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile habits display after a short delay
    setTimeout(initMobileHabitsDisplay, 100);
});