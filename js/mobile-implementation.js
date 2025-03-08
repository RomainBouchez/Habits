// mobile-implementation.js - Modified to keep only the Image 1 style

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark theme immediately
    document.body.classList.add('dark-theme');
    
    // IMPORTANT: Do not check for mobile - we want the same layout for all screen sizes
    // Initialize the three-card layout for all devices
    initializeThreeCardLayout();
    
    // Remove any floating action buttons that might have been added
    const existingFab = document.querySelector('.floating-action-button');
    if (existingFab) {
        existingFab.remove();
    }
});

function initializeThreeCardLayout() {
    // Make dashboard section visible
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.classList.remove('d-none');
    }
    
    // Get the container for habits
    const habitsContainer = document.getElementById('today-habits-list');
    if (habitsContainer) {
        // Clear existing content
        habitsContainer.innerHTML = '';
        
        // Create a card container for the grid layout
        const cardContainer = document.createElement('div');
        cardContainer.className = 'three-card-container';
        
        // Add the container to the original container
        habitsContainer.appendChild(cardContainer);
        
        // Create the three specific habit cards from Image 1
        createThreeSpecificCards();
    }
}

function createThreeSpecificCards() {
    const cardContainer = document.querySelector('.three-card-container');
    if (!cardContainer) {
        console.error("Card container not found!");
        return;
    }
    
    // Create exactly 3 specific habits matching Image 1
    const specificHabits = [
        {
            id: 1,
            name: 'Daily Exercise',
            category_name: 'Health',
            current_streak: 5,
            longest_streak: 10,
            completed: true,
            message: 'Impressive streak! 🔥'
        },
        {
            id: 2,
            name: 'Read 30 Minutes',
            category_name: 'Learning',
            current_streak: 0,
            longest_streak: 7,
            completed: false,
            message: 'Start your streak today! 🚀'
        },
        {
            id: 3,
            name: 'Meditate',
            category_name: 'Personal',
            current_streak: 2,
            longest_streak: 14,
            completed: false,
            message: 'Building momentum! 💪'
        }
    ];
    
    // Add habit cards to container
    specificHabits.forEach(habit => {
        const card = createHabitCardImageOneStyle(habit);
        cardContainer.appendChild(card);
    });
}

// Create a habit card with the specific style from Image 1
function createHabitCardImageOneStyle(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card image-one-style';
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
    
    // Determine icon based on name
    let icon = '🏃';
    if (habit.name.includes('Exercise')) {
        icon = '🏃';
    } else if (habit.name.includes('Read')) {
        icon = '📚';
    } else if (habit.name.includes('Meditate')) {
        icon = '🧘';
    }
    
    // Create Github-style grid HTML
    let gridHtml = '';
    for (let i = 0; i < 49; i++) {
        // Specific pattern for each habit to match Image 1
        let isActive = false;
        
        if (habit.id === 1) { // Exercise - Green pattern
            isActive = [0,1,4,5,6,12,24,30,31,35,36,39,40,42,48].includes(i);
        } else if (habit.id === 2) { // Reading - Purple pattern
            isActive = [10,11,16,17,18,22,23,24,27,33,38,39,40,41,42,46,47].includes(i);
        } else if (habit.id === 3) { // Meditate - Orange pattern
            isActive = [10,17,23,30,36,37,41,42,43,45,48].includes(i);
        }
        
        gridHtml += `<div class="github-day ${isActive ? 'active-day' : ''}"></div>`;
    }
    
    card.innerHTML = `
        <div class="habit-header">
            <div class="habit-icon">${icon}</div>
            <div class="habit-title">${habit.name}</div>
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
        
        <div class="habit-message">
            ${habit.message}
        </div>
        
        <div class="github-grid">
            ${gridHtml}
        </div>
        
        <div class="habit-footer">
            <div class="habit-category">
                ${habit.category_name}
            </div>
            <div class="habit-stats">
                <span>${habit.completed ? '1/1d' : '0/1d'}</span>
            </div>
        </div>
        
        <div class="completion-indicator ${habit.completed ? 'completed' : ''}"></div>
    `;
    
    // Add event listeners for buttons
    setTimeout(() => {
        addCardEventListeners(card, habit);
    }, 0);
    
    return card;
}

// Button event listeners
function addCardEventListeners(card, habit) {
    // Card click for completion toggle
    card.addEventListener('click', function(e) {
        // Only toggle completion if not clicking a button
        if (!e.target.closest('.action-button')) {
            toggleCompletion(habit.id);
        }
    });
    
    // Button event listeners
    const buttons = card.querySelectorAll('.action-button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            
            if (this.classList.contains('settings-button')) {
                alert(`Settings for ${habit.name}`);
            } else if (this.classList.contains('info-button')) {
                alert(`Info for ${habit.name}`);
            } else if (this.classList.contains('calendar-button')) {
                alert(`Calendar for ${habit.name}`);
            }
        });
    });
}

// Toggle completion status
function toggleCompletion(habitId) {
    const card = document.getElementById(`habit-card-${habitId}`);
    if (!card) return;
    
    const indicator = card.querySelector('.completion-indicator');
    if (!indicator) return;
    
    // Toggle completion
    if (indicator.classList.contains('completed')) {
        indicator.classList.remove('completed');
        card.querySelector('.habit-stats span').textContent = '0/1d';
    } else {
        indicator.classList.add('completed');
        card.querySelector('.habit-stats span').textContent = '1/1d';
        
        // Add animation
        card.classList.add('completion-animation');
        setTimeout(() => {
            card.classList.remove('completion-animation');
        }, 1000);
    }
}