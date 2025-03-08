<?php
// habit_logs.php - Habit completion tracking

// Include database configuration
require_once 'config.php';

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// Verify user ID
if ($user_id <= 0) {
    json_response(false, 'Invalid user ID');
}

// Handle GET request (Get habit logs)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if specific habit ID is provided
    if (isset($_GET['habit_id'])) {
        $habit_id = intval($_GET['habit_id']);
        
        // Verify habit belongs to user
        $stmt = $conn->prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $habit_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows !== 1) {
            json_response(false, 'Habit not found or access denied');
        }
        
        // Get start and end dates if provided
        $start_date = isset($_GET['start_date']) ? sanitize_input($_GET['start_date']) : date('Y-m-d', strtotime('-30 days'));
        $end_date = isset($_GET['end_date']) ? sanitize_input($_GET['end_date']) : date('Y-m-d');
        
        // Query database for habit logs
        $stmt = $conn->prepare("
            SELECT * FROM habit_logs 
            WHERE habit_id = ? AND completed_date BETWEEN ? AND ? 
            ORDER BY completed_date DESC
        ");
        $stmt->bind_param("iss", $habit_id, $start_date, $end_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        // Get streak information
        $current_streak = get_current_streak($conn, $habit_id);
        $longest_streak = get_longest_streak($conn, $habit_id);
        
        json_response(true, 'Habit logs retrieved successfully', [
            'logs' => $logs,
            'current_streak' => $current_streak,
            'longest_streak' => $longest_streak
        ]);
    } else if (isset($_GET['date'])) {
        // Get logs for a specific date for all habits
        $date = sanitize_input($_GET['date']);
        
        // Query database for habit logs
        $stmt = $conn->prepare("
            SELECT hl.*, h.name as habit_name, h.frequency, c.name as category_name
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            LEFT JOIN categories c ON h.category_id = c.id
            WHERE h.user_id = ? AND hl.completed_date = ?
            ORDER BY h.name
        ");
        $stmt->bind_param("is", $user_id, $date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        json_response(true, 'Habit logs retrieved successfully', ['logs' => $logs]);
    } else {
        // Get summary stats for all habits
        $stmt = $conn->prepare("
            SELECT h.id, h.name, h.frequency, c.name as category_name,
                (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND completed = 1) as completed_count,
                (SELECT COUNT(DISTINCT completed_date) FROM habit_logs WHERE habit_id = h.id) as total_days
            FROM habits h
            LEFT JOIN categories c ON h.category_id = c.id
            WHERE h.user_id = ? AND h.active = 1
            ORDER BY h.name
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $stats = [];
        while ($row = $result->fetch_assoc()) {
            $habit_id = $row['id'];
            $row['current_streak'] = get_current_streak($conn, $habit_id);
            $row['longest_streak'] = get_longest_streak($conn, $habit_id);
            $row['completion_rate'] = ($row['total_days'] > 0) 
                ? round(($row['completed_count'] / $row['total_days']) * 100, 1) 
                : 0;
            
            $stats[] = $row;
        }
        
        json_response(true, 'Habit statistics retrieved successfully', ['stats' => $stats]);
    }
}

// Handle POST request (Mark habit as completed or not completed)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if all required fields are provided
    if (empty($_POST['habit_id']) || !isset($_POST['completed']) || empty($_POST['date'])) {
        json_response(false, 'Habit ID, completion status, and date are required');
    }
    
    $habit_id = intval($_POST['habit_id']);
    $completed = filter_var($_POST['completed'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $date = sanitize_input($_POST['date']);
    $notes = isset($_POST['notes']) ? sanitize_input($_POST['notes']) : '';
    
    // Verify habit belongs to user
    $stmt = $conn->prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $habit_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        json_response(false, 'Habit not found or access denied');
    }
    
    // Check if log already exists for this date
    $stmt = $conn->prepare("SELECT id FROM habit_logs WHERE habit_id = ? AND completed_date = ?");
    $stmt->bind_param("is", $habit_id, $date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing log
        $stmt = $conn->prepare("
            UPDATE habit_logs 
            SET completed = ?, notes = ? 
            WHERE habit_id = ? AND completed_date = ?
        ");
        $stmt->bind_param("isis", $completed, $notes, $habit_id, $date);
    } else {
        // Insert new log
        $stmt = $conn->prepare("
            INSERT INTO habit_logs (habit_id, completed_date, completed, notes) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("isis", $habit_id, $date, $completed, $notes);
    }
    
    if ($stmt->execute()) {
        // Get updated streak
        $current_streak = get_current_streak($conn, $habit_id);
        
        json_response(true, 'Habit log updated successfully', [
            'current_streak' => $current_streak
        ]);
    } else {
        json_response(false, 'Error updating habit log: ' . $conn->error);
    }
}

// Function to get current streak
function get_current_streak($conn, $habit_id) {
    // Get habit frequency
    $stmt = $conn->prepare("SELECT frequency FROM habits WHERE id = ?");
    $stmt->bind_param("i", $habit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $habit = $result->fetch_assoc();
    
    if (!$habit) {
        return 0;
    }
    
    $frequency = $habit['frequency'];
    
    // Get completed dates in descending order
    $stmt = $conn->prepare("
        SELECT completed_date, completed 
        FROM habit_logs 
        WHERE habit_id = ? 
        ORDER BY completed_date DESC
    ");
    $stmt->bind_param("i", $habit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    if (empty($logs)) {
        return 0;
    }
    
    // Calculate streak
    $streak = 0;
    $today = new DateTime(date('Y-m-d'));
    $prev_date = null;
    
    foreach ($logs as $log) {
        $log_date = new DateTime($log['completed_date']);
        
        // If not completed, break streak
        if (!$log['completed']) {
            break;
        }
        
        // For the first iteration
        if ($prev_date === null) {
            $streak = 1;
            $prev_date = $log_date;
            continue;
        }
        
        $diff = $prev_date->diff($log_date)->days;
        
        // Check if dates are consecutive based on frequency
        $is_consecutive = false;
        
        switch ($frequency) {
            case 'daily':
                $is_consecutive = ($diff == 1);
                break;
            case 'weekly':
                $is_consecutive = ($diff <= 7 && $diff > 0);
                break;
            case 'custom':
                // For custom, we need to check if the date is within the expected range
                // This is a simplified check
                $is_consecutive = ($diff <= 7);
                break;
        }
        
        if ($is_consecutive) {
            $streak++;
            $prev_date = $log_date;
        } else {
            break;
        }
    }
    
    return $streak;
}

// Function to get longest streak
function get_longest_streak($conn, $habit_id) {
    // Get completed dates in ascending order
    $stmt = $conn->prepare("
        SELECT completed_date, completed 
        FROM habit_logs 
        WHERE habit_id = ? AND completed = 1
        ORDER BY completed_date ASC
    ");
    $stmt->bind_param("i", $habit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $dates = [];
    while ($row = $result->fetch_assoc()) {
        $dates[] = $row['completed_date'];
    }
    
    if (empty($dates)) {
        return 0;
    }
    
    // Calculate longest streak
    $current_streak = 1;
    $longest_streak = 1;
    $prev_date = new DateTime($dates[0]);
    
    for ($i = 1; $i < count($dates); $i++) {
        $current_date = new DateTime($dates[$i]);
        $diff = $prev_date->diff($current_date)->days;
        
        if ($diff == 1) {
            $current_streak++;
            if ($current_streak > $longest_streak) {
                $longest_streak = $current_streak;
            }
        } else {
            $current_streak = 1;
        }
        
        $prev_date = $current_date;
    }
    
    return $longest_streak;
}