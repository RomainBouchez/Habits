<?php
// habits.php - Habits management

// Include database configuration
require_once 'config.php';

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// Verify user ID
if ($user_id <= 0) {
    json_response(false, 'Invalid user ID');
}

// Handle GET request (Get habits)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if specific habit ID is provided
    if (isset($_GET['habit_id'])) {
        // Get single habit
        $habit_id = intval($_GET['habit_id']);
        
        // Query database for habit
        $stmt = $conn->prepare("
            SELECT h.*, c.name as category_name, hf.*
            FROM habits h
            LEFT JOIN categories c ON h.category_id = c.id
            LEFT JOIN habit_frequency hf ON h.id = hf.habit_id
            WHERE h.id = ? AND h.user_id = ?
        ");
        $stmt->bind_param("ii", $habit_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $habit = $result->fetch_assoc();
            json_response(true, 'Habit retrieved successfully', ['habit' => $habit]);
        } else {
            json_response(false, 'Habit not found');
        }
    } else {
        // Get all habits for user
        $today = isset($_GET['today']) ? filter_var($_GET['today'], FILTER_VALIDATE_BOOLEAN) : false;
        
        if ($today) {
            // Get today's habits
            $today_date = date('Y-m-d');
            $day_of_week = strtolower(date('l')); // e.g., 'monday', 'tuesday', etc.
            
            // Query habits for today (daily, weekly on this day, or custom on this day)
            $query = "
                SELECT h.*, c.name as category_name, 
                    (SELECT completed FROM habit_logs 
                     WHERE habit_id = h.id AND completed_date = ?) as completed
                FROM habits h
                LEFT JOIN categories c ON h.category_id = c.id
                LEFT JOIN habit_frequency hf ON h.id = hf.habit_id
                WHERE h.user_id = ? AND h.active = 1 AND (
                    h.frequency = 'daily' 
                    OR (h.frequency = 'weekly' AND DAYOFWEEK(?) = 1) 
                    OR (h.frequency = 'custom' AND hf.{$day_of_week} = 1)
                )
                ORDER BY h.name
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("sis", $today_date, $user_id, $today_date);
        } else {
            // Get all active habits
            $query = "
                SELECT h.*, c.name as category_name
                FROM habits h
                LEFT JOIN categories c ON h.category_id = c.id
                WHERE h.user_id = ? AND h.active = 1
                ORDER BY h.name
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $user_id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $habits = [];
        while ($row = $result->fetch_assoc()) {
            $habits[] = $row;
        }
        
        json_response(true, 'Habits retrieved successfully', ['habits' => $habits]);
    }
}

// Handle POST request (Create new habit)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if all required fields are provided
    if (empty($_POST['name']) || empty($_POST['frequency'])) {
        json_response(false, 'Name and frequency are required');
    }
    
    // Get habit data
    $name = sanitize_input($_POST['name']);
    $description = isset($_POST['description']) ? sanitize_input($_POST['description']) : '';
    $category_id = isset($_POST['category_id']) ? intval($_POST['category_id']) : null;
    $frequency = sanitize_input($_POST['frequency']);
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Insert habit
        $stmt = $conn->prepare("
            INSERT INTO habits (user_id, category_id, name, description, frequency) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("iisss", $user_id, $category_id, $name, $description, $frequency);
        $stmt->execute();
        
        // Get new habit ID
        $habit_id = $conn->insert_id;
        
        // Handle custom frequency if needed
        if ($frequency === 'custom' && isset($_POST['days'])) {
            $days = json_decode($_POST['days'], true);
            
            if (!$days || !is_array($days)) {
                throw new Exception('Invalid days format');
            }
            
            // Insert habit frequency
            $stmt = $conn->prepare("
                INSERT INTO habit_frequency (habit_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $monday = isset($days['monday']) ? 1 : 0;
            $tuesday = isset($days['tuesday']) ? 1 : 0;
            $wednesday = isset($days['wednesday']) ? 1 : 0;
            $thursday = isset($days['thursday']) ? 1 : 0;
            $friday = isset($days['friday']) ? 1 : 0;
            $saturday = isset($days['saturday']) ? 1 : 0;
            $sunday = isset($days['sunday']) ? 1 : 0;
            
            $stmt->bind_param("iiiiiii", $habit_id, $monday, $tuesday, $wednesday, $thursday, $friday, $saturday, $sunday);
            $stmt->execute();
        }
        
        // Commit transaction
        $conn->commit();
        
        json_response(true, 'Habit created successfully', ['habit_id' => $habit_id]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        json_response(false, 'Error creating habit: ' . $e->getMessage());
    }
}

// Handle PUT request (Update habit)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get PUT data
    parse_str(file_get_contents("php://input"), $put_data);
    
    // Check if habit ID is provided
    if (empty($put_data['habit_id'])) {
        json_response(false, 'Habit ID is required');
    }
    
    $habit_id = intval($put_data['habit_id']);
    
    // Verify habit belongs to user
    $stmt = $conn->prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $habit_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        json_response(false, 'Habit not found or access denied');
    }
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Update fields that are provided
        $updates = [];
        $types = "";
        $params = [];
        
        if (isset($put_data['name'])) {
            $updates[] = "name = ?";
            $types .= "s";
            $params[] = sanitize_input($put_data['name']);
        }
        
        if (isset($put_data['description'])) {
            $updates[] = "description = ?";
            $types .= "s";
            $params[] = sanitize_input($put_data['description']);
        }
        
        if (isset($put_data['category_id'])) {
            $updates[] = "category_id = ?";
            $types .= "i";
            $params[] = intval($put_data['category_id']);
        }
        
        if (isset($put_data['frequency'])) {
            $updates[] = "frequency = ?";
            $types .= "s";
            $params[] = sanitize_input($put_data['frequency']);
        }
        
        if (isset($put_data['active'])) {
            $updates[] = "active = ?";
            $types .= "i";
            $params[] = filter_var($put_data['active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }
        
        if (!empty($updates)) {
            // Add habit_id and user_id to params
            $params[] = $habit_id;
            $params[] = $user_id;
            $types .= "ii";
            
            // Create update query
            $query = "UPDATE habits SET " . implode(", ", $updates) . " WHERE id = ? AND user_id = ?";
            
            // Prepare statement
            $stmt = $conn->prepare($query);
            
            // Bind parameters dynamically
            $bind_params = array($types);
            foreach ($params as $key => $value) {
                $bind_params[] = &$params[$key];
            }
            call_user_func_array(array($stmt, 'bind_param'), $bind_params);
            
            // Execute update
            $stmt->execute();
        }
        
        // Handle custom frequency if needed
        if (isset($put_data['frequency']) && $put_data['frequency'] === 'custom' && isset($put_data['days'])) {
            $days = json_decode($put_data['days'], true);
            
            if (!$days || !is_array($days)) {
                throw new Exception('Invalid days format');
            }
            
            // Delete existing frequency data
            $stmt = $conn->prepare("DELETE FROM habit_frequency WHERE habit_id = ?");
            $stmt->bind_param("i", $habit_id);
            $stmt->execute();
            
            // Insert new habit frequency
            $stmt = $conn->prepare("
                INSERT INTO habit_frequency (habit_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $monday = isset($days['monday']) ? 1 : 0;
            $tuesday = isset($days['tuesday']) ? 1 : 0;
            $wednesday = isset($days['wednesday']) ? 1 : 0;
            $thursday = isset($days['thursday']) ? 1 : 0;
            $friday = isset($days['friday']) ? 1 : 0;
            $saturday = isset($days['saturday']) ? 1 : 0;
            $sunday = isset($days['sunday']) ? 1 : 0;
            
            $stmt->bind_param("iiiiiiii", $habit_id, $monday, $tuesday, $wednesday, $thursday, $friday, $saturday, $sunday);
            $stmt->execute();
        }
        
        // Commit transaction
        $conn->commit();
        
        json_response(true, 'Habit updated successfully');
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        json_response(false, 'Error updating habit: ' . $e->getMessage());
    }
}

// Handle DELETE request (Delete habit)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get DELETE data
    parse_str(file_get_contents("php://input"), $delete_data);
    
    // Check if habit ID is provided
    if (empty($delete_data['habit_id'])) {
        json_response(false, 'Habit ID is required');
    }
    
    $habit_id = intval($delete_data['habit_id']);
    
    // Verify habit belongs to user
    $stmt = $conn->prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $habit_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        json_response(false, 'Habit not found or access denied');
    }
    
    // Begin transaction
    $conn->begin_transaction();
    
    try {
        // Delete habit frequency
        $stmt = $conn->prepare("DELETE FROM habit_frequency WHERE habit_id = ?");
        $stmt->bind_param("i", $habit_id);
        $stmt->execute();
        
        // Delete habit logs
        $stmt = $conn->prepare("DELETE FROM habit_logs WHERE habit_id = ?");
        $stmt->bind_param("i", $habit_id);
        $stmt->execute();
        
        // Delete habit
        $stmt = $conn->prepare("DELETE FROM habits WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $habit_id, $user_id);
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        json_response(true, 'Habit deleted successfully');
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        json_response(false, 'Error deleting habit: ' . $e->getMessage());
    }
}