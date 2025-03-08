// app.js - Main application functionality

// Navigation handling
document.addEventListener('DOMContentLoaded', function() {
    // Navigation links
    const dashboardLink = document.getElementById('dashboard-link');
    const habitsLink = document.getElementById('habits-link');
    const statsLink = document.getElementById('stats-link');
    
    // Content sections
    const dashboardSection = document.getElementById('dashboard-section');
    const habitsSection = document.getElementById('habits-section');
    const statsSection = document.getElementById('stats-section');
    
    // Dashboard navigation
    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide other sections
        habitsSection.classList.add('d-none');
        statsSection.classList.add('d-none');
        
        // Show dashboard
        dashboardSection.classList.remove('d-none');
        
        // Update active link
        updateActiveLink(this);
        
        // Load dashboard data
        loadTodayHabits();
    });
    
    // Habits navigation
    habitsLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide other sections
        dashboardSection.classList.add('d-none');
        statsSection.classList.add('d-none');
        
        // Show habits
        habitsSection.classList.remove('d-none');
        
        // Update active link
        updateActiveLink(this);
        
        // Load habits data
        loadAllHabits();
    });
    
    // Stats navigation
    statsLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hide other sections
        dashboardSection.classList.add('d-none');
        habitsSection.classList.add('d-none');
        
        // Show stats
        statsSection.classList.remove('d-none');
        
        // Update active link
        updateActiveLink(this);
        
        // Load stats data
        loadStats();
    });
    
    // Custom frequency toggle
    const frequencyRadios = document.querySelectorAll('input[name="frequency"]');
    const customDaysSection = document.getElementById('custom-days');
    
    frequencyRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDaysSection.classList.remove('d-none');
            } else {
                customDaysSection.classList.add('d-none');
            }
        });
    });
    
    // Initialize by loading categories for the add habit form
    loadCategories();
});

// Update active navigation link
function updateActiveLink(activeLink) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current link
    activeLink.classList.add('active');
}

// Load categories for the add habit form
function loadCategories() {
    const categorySelect = document.getElementById('habit-category');
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        console.error('User not logged in');
        return;
    }
    
    // Create request URL
    const url = `backend/categories.php?user_id=${userId}`;
    
    // Fetch categories
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear select options
                categorySelect.innerHTML = '';
                
                // Add categories
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            } else {
                console.error('Failed to load categories:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    return formatDate(new Date());
}

// Show error message
function showError(message) {
    alert(message);
}

// Show empty state for habits list
function showEmptyState(container, message, icon = 'fa-calendar-check') {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <h4>No habits found</h4>
            <p class="text-muted">${message}</p>
        </div>
    `;
}