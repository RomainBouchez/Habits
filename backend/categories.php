<?php
// categories.php - Categories management

// Include database configuration
require_once 'config.php';

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// Verify user ID
if ($user_id <= 0) {
    json_response(false, 'Invalid user ID');
}

// Handle GET request (Get categories)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all categories
    $stmt = $conn->prepare("SELECT id, name, description FROM categories ORDER BY name");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    json_response(true, 'Categories retrieved successfully', ['categories' => $categories]);
}

// Handle POST request (Create new category)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if name is provided
    if (empty($_POST['name'])) {
        json_response(false, 'Category name is required');
    }
    
    $name = sanitize_input($_POST['name']);
    $description = isset($_POST['description']) ? sanitize_input($_POST['description']) : '';
    
    // Check if category already exists
    $stmt = $conn->prepare("SELECT id FROM categories WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        json_response(false, 'Category with this name already exists');
    }
    
    // Insert new category
    $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $description);
    
    if ($stmt->execute()) {
        $category_id = $conn->insert_id;
        json_response(true, 'Category created successfully', ['category_id' => $category_id]);
    } else {
        json_response(false, 'Error creating category: ' . $conn->error);
    }
}

// Handle PUT request (Update category)
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Get PUT data
    parse_str(file_get_contents("php://input"), $put_data);
    
    // Check if category ID is provided
    if (empty($put_data['category_id'])) {
        json_response(false, 'Category ID is required');
    }
    
    $category_id = intval($put_data['category_id']);
    
    // Verify category exists
    $stmt = $conn->prepare("SELECT id FROM categories WHERE id = ?");
    $stmt->bind_param("i", $category_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        json_response(false, 'Category not found');
    }
    
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
    
    if (!empty($updates)) {
        // Add category_id to params
        $params[] = $category_id;
        $types .= "i";
        
        // Create update query
        $query = "UPDATE categories SET " . implode(", ", $updates) . " WHERE id = ?";
        
        // Prepare statement
        $stmt = $conn->prepare($query);
        
        // Bind parameters dynamically
        $bind_params = array($types);
        foreach ($params as $key => $value) {
            $bind_params[] = &$params[$key];
        }
        call_user_func_array(array($stmt, 'bind_param'), $bind_params);
        
        // Execute update
        if ($stmt->execute()) {
            json_response(true, 'Category updated successfully');
        } else {
            json_response(false, 'Error updating category: ' . $conn->error);
        }
    } else {
        json_response(false, 'No updates provided');
    }
}