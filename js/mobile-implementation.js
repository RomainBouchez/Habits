// Replace the current code in mobile-implementation.js with this file

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark theme immediately
    document.body.classList.add('dark-theme');
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 767;
    
    if (isMobile) {
        // Replace the original content with mobile-optimized UI
        initializeMobileUI();
    }
});

function initializeMobileUI() {
    // Hide original container content
    const originalContainer = document.querySelector('.container');
    if (originalContainer) {
        // Preserve the container but hide its original content
        const containerChildren = Array.from(originalContainer.children);
        containerChildren.forEach(child => {
            child.style.display = 'none';
        });
        
        // Create and add our new mobile UI
        const mobileUI = createMobileUI();
        originalContainer.appendChild(mobileUI);
        
        // Add floating action button
        const floatingButton = createFloatingActionButton();
        document.body.appendChild(floatingButton);
    }
}

function createMobileUI() {
    const mobileUI = document.createElement('div');
    mobileUI.className = 'mobile-habit-tracker';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'fruity-header';
    header.innerHTML = `
        <div class="app-title">
            <span class="fruity-icon">🍐</span>
            <span class="title-text">
                <span class="fruity-text">F<span style="color:#FF5252">R</span><span style="color:#FF9800">U</span><span style="color:#FFEB3B">I</span><span style="color:#4CAF50">T</span><span style="color:#2196F3">Y</span> HABITS</span>
                <span class="day-indicator">| Saturday</span>
            </span>
        </div>
        <div class="settings-icon">
            <i class="fas fa-cog"></i>
        </div>
    `;
    
    // Create habit cards container
    const habitsContainer = document.createElement('div');
    habitsContainer.className = 'habits-container';
    
    // Add sample habit cards
    habitsContainer.appendChild(createHabitCard({
        id: 1,
        name: 'Weekly Review',
        category: 'Productivity',
        icon: 'briefcase',
        streak: 1,
        trophies: 1,
        message: 'Great start! Keep going! ⭐',
        color: '#2196F3',
        completed: true,
        frequency: 'daily'
    }));
    
    habitsContainer.appendChild(createHabitCard({
        id: 2,
        name: 'Sleep Early',
        category: 'Health',
        icon: 'bed',
        streak: 0,
        trophies: 0,
        message: 'Start your streak today! 🚀',
        color: '#FF5252',
        completed: false,
        frequency: 'daily'
    }));
    
    habitsContainer.appendChild(createHabitCard({
        id: 3,
        name: 'Study',
        category: 'Learning',
        icon: 'graduation-cap',
        streak: 0,
        trophies: 1,
        message: 'Start your streak today! 🚀',
        color: '#9C27B0',
        completed: false,
        frequency: 'daily'
    }));
    
    mobileUI.appendChild(header);
    mobileUI.appendChild(habitsContainer);
    
    return mobileUI;
}

function createHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.style.setProperty('--habit-color', habit.color);
    
    // Create card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'habit-header';
    
    // Icon and title
    const iconClass = `fas fa-${habit.icon}`;
    cardHeader.innerHTML = `
        <div class="habit-title-area">
            <div class="habit-icon-container" style="background-color: ${habit.color}20;">
                <i class="${iconClass}" style="color: ${habit.color};"></i>
            </div>
            <div class="habit-details">
                <h3>${habit.name}</h3>
                <div class="habit-metadata">
                    ${habit.streak > 0 ? 
                    `<div class="streak-info"><i class="fas fa-fire"></i> ${habit.streak}d</div>` 
                    : '<div class="streak-info"><i class="fas fa-fire"></i> 0d</div>'}
                    ${habit.trophies > 0 ? 
                    `<div class="trophy-info"><i class="fas fa-trophy"></i> ${habit.trophies}d</div>` 
                    : ''}
                </div>
            </div>
        </div>
        <div class="habit-actions">
            <button class="action-button settings-button">
                <i class="fas fa-cog"></i>
            </button>
            <button class="action-button info-button">
                <i class="fas fa-info-circle"></i>
            </button>
            <button class="action-button calendar-button">
                <i class="fas fa-calendar-alt"></i>
            </button>
        </div>
    `;
    
    // Create message
    const message = document.createElement('div');
    message.className = 'habit-message';
    message.textContent = habit.message;
    message.style.color = habit.color;
    
    // Create GitHub-style grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    
    const grid = document.createElement('div');
    grid.className = 'github-grid';
    
    // Create a 7x7 grid (49 days)
    for (let i = 0; i < 49; i++) {
        const day = document.createElement('div');
        day.className = 'github-day';
        
        // Randomly determine if the day is filled
        // In a real app, this would come from your habit data
        if (habit.completed && i < 5) {
            day.style.backgroundColor = habit.color;
            day.classList.add('completed-day');
        } else if (Math.random() > 0.8 && i < 40) {
            day.style.backgroundColor = habit.color;
            day.classList.add('completed-day');
        } else {
            day.style.backgroundColor = '#1e2937';
        }
        
        grid.appendChild(day);
    }
    
    gridContainer.appendChild(grid);
    
    // Create footer with category and stats
    const footer = document.createElement('div');
    footer.className = 'habit-footer';
    footer.innerHTML = `
        <div class="habit-category" style="color: ${habit.color};">${habit.category}</div>
        <div class="habit-stats">
            <div class="stat-buttons">
                <button class="stat-button">
                    <i class="fas fa-chart-line"></i>
                </button>
                <button class="stat-button">
                    <i class="fas fa-comment-alt"></i>
                </button>
                <button class="stat-button">
                    <i class="fas fa-chart-bar"></i>
                </button>
            </div>
            <div class="frequency-display">
                ${habit.completed ? '1/1d' : '0/1d'}
            </div>
        </div>
    `;
    
    // Add completion indicator on the right side
    const completionIndicator = document.createElement('div');
    completionIndicator.className = 'completion-indicator';
    if (habit.completed) {
        completionIndicator.classList.add('completed');
    }
    
    // Assemble the card
    card.appendChild(cardHeader);
    card.appendChild(message);
    card.appendChild(gridContainer);
    card.appendChild(footer);
    card.appendChild(completionIndicator);
    
    // Add event listeners
    card.addEventListener('click', function() {
        toggleHabitCompletion(card, habit);
    });
    
    return card;
}

function toggleHabitCompletion(cardElement, habit) {
    const indicator = cardElement.querySelector('.completion-indicator');
    const isCompleted = indicator.classList.contains('completed');
    
    if (isCompleted) {
        indicator.classList.remove('completed');
        habit.completed = false;
        
        // Update frequency display
        const freqDisplay = cardElement.querySelector('.frequency-display');
        freqDisplay.textContent = '0/1d';
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
        freqDisplay.textContent = '1/1d';
    }
}

function createFloatingActionButton() {
    const button = document.createElement('button');
    button.className = 'floating-action-button';
    button.innerHTML = '<i class="fas fa-plus"></i>';
    
    button.addEventListener('click', function() {
        // Show add habit modal - in a real app, this would open your modal
        const modal = document.getElementById('add-habit-modal');
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        } else {
            alert('Add Habit button clicked!');
        }
    });
    
    return button;
}