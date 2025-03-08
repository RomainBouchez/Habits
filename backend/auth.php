<?php
// auth.php - User authentication

// Include database configuration
require_once 'config.php';

// Handle login request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if username and password are provided
    if (empty($_POST['username']) || empty($_POST['password'])) {
        json_response(false, 'Username and password are required');
    }
    
    // Get username and password
    $username = sanitize_input($_POST['username']);
    $password = $_POST['password']; // Not sanitizing password before verification
    
    // Query database for user
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        // User found
        $user = $result->fetch_assoc();
        
        // Verify password
        if (password_verify($password, $user['password'])) {
            // Password is correct
            json_response(true, 'Login successful', [
                'user_id' => $user['id'],
                'username' => $user['username']
            ]);
        } else {
            // Password is incorrect
            json_response(false, 'Invalid username or password');
        }
    } else {
        // User not found
        json_response(false, 'Invalid username or password');
    }
}

// Handle registration request
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get PUT data
    parse_str(file_get_contents("php://input"), $put_data);
    
    // Check if all required fields are provided
    if (empty($put_data['username']) || empty($put_data['password'])) {
        json_response(false, 'Username and password are required');
    }
    
    // Get username and password
    $username = sanitize_input($put_data['username']);
    $password = $put_data['password']; // Not sanitizing password before hashing
    
    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        json_response(false, 'Username already exists');
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hashed_password);
    
    if ($stmt->execute()) {
        // Get new user ID
        $user_id = $conn->insert_id;
        
        json_response(true, 'Registration successful', [
            'user_id' => $user_id,
            'username' => $username
        ]);
    } else {
        json_response(false, 'Error creating user: ' . $conn->error);
    }
}

// Handle check auth request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Just for checking if the authentication endpoint works
    json_response(true, 'Authentication endpoint is working');
}