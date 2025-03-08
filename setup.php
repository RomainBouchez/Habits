<?php
// setup.php - Initial database and admin user setup

// Include database configuration
require_once 'backend/config.php';

// Verify database connection
if (!isset($conn) || $conn->connect_error) {
    die("Database connection failed. Please check your config.php file.");
}

// Check if setup is allowed
$allow_setup = false; // Change to false after initial setup to prevent further execution

if (!$allow_setup) {
    die("Setup has been disabled for security reasons. To re-enable it, edit this file.");
}

// Function to create tables
function create_tables($conn) {
    try {
        // Create users table
        $conn->query("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Create categories table
        $conn->query("
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Create habits table
        $conn->query("
            CREATE TABLE IF NOT EXISTS habits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category_id INT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                frequency VARCHAR(20) NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        ");
        
        // Create table for custom frequency
        $conn->query("
            CREATE TABLE IF NOT EXISTS habit_frequency (
                id INT AUTO_INCREMENT PRIMARY KEY,
                habit_id INT NOT NULL,
                monday BOOLEAN DEFAULT FALSE,
                tuesday BOOLEAN DEFAULT FALSE,
                wednesday BOOLEAN DEFAULT FALSE,
                thursday BOOLEAN DEFAULT FALSE,
                friday BOOLEAN DEFAULT FALSE,
                saturday BOOLEAN DEFAULT FALSE,
                sunday BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
            )
        ");
        
        // Create table for habit logs
        $conn->query("
            CREATE TABLE IF NOT EXISTS habit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                habit_id INT NOT NULL,
                completed_date DATE NOT NULL,
                completed BOOLEAN DEFAULT TRUE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
                UNIQUE KEY unique_habit_date (habit_id, completed_date)
            )
        ");
        
        return true;
    } catch (Exception $e) {
        echo "Error creating tables: " . $e->getMessage();
        return false;
    }
}

// Function to create default categories
function create_default_categories($conn) {
    try {
        // Check if categories already exist
        $result = $conn->query("SELECT COUNT(*) as count FROM categories");
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            // Insert default categories
            $categories = [
                ['Health', 'Health and fitness related habits'],
                ['Productivity', 'Work and productivity related habits'],
                ['Learning', 'Education and skill development habits'],
                ['Personal', 'Personal growth and lifestyle habits']
            ];
            
            foreach ($categories as $category) {
                $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
                $stmt->bind_param("ss", $category[0], $category[1]);
                $stmt->execute();
            }
        }
        
        return true;
    } catch (Exception $e) {
        echo "Error creating default categories: " . $e->getMessage();
        return false;
    }
}

// Function to create admin user
function create_admin_user($conn, $username, $password) {
    try {
        // Check if user already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert admin user
            $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
            $stmt->bind_param("ss", $username, $hashed_password);
            $stmt->execute();
            
            return true;
        } else {
            echo "Admin user already exists.<br>";
            return true;
        }
    } catch (Exception $e) {
        echo "Error creating admin user: " . $e->getMessage();
        return false;
    }
}

// Main setup process
$setup_complete = false;

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['admin_username']) && isset($_POST['admin_password'])) {
        $admin_username = trim($_POST['admin_username']);
        $admin_password = $_POST['admin_password'];
        
        if (strlen($admin_username) < 3 || strlen($admin_password) < 8) {
            $error_message = "Username must be at least 3 characters and password must be at least 8 characters.";
        } else {
            // Begin setup
            $setup_success = true;
            
            // Create tables
            if (create_tables($conn)) {
                echo "Tables created successfully.<br>";
            } else {
                $setup_success = false;
            }
            
            // Create default categories
            if ($setup_success && create_default_categories($conn)) {
                echo "Default categories created successfully.<br>";
            } else {
                $setup_success = false;
            }
            
            // Create admin user
            if ($setup_success && create_admin_user($conn, $admin_username, $admin_password)) {
                echo "Admin user created successfully.<br>";
                $setup_complete = true;
            } else {
                $setup_success = false;
            }
            
            if ($setup_success) {
                echo "<br><strong>Setup completed successfully!</strong><br>";
                echo "You can now <a href='index.html'>login</a> with your admin account.<br>";
                echo "<br><strong>Important:</strong> For security reasons, please set \$allow_setup to false in this file.";
            }
        }
    }
}

// If not submitted or setup not complete, show form
if (!$setup_complete) {
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Habit Tracker Setup</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body p-4">
                        <h2 class="card-title text-center mb-4">Habit Tracker Setup</h2>
                        
                        <?php if (isset($error_message)): ?>
                            <div class="alert alert-danger"><?php echo $error_message; ?></div>
                        <?php endif; ?>
                        
                        <p>This script will set up your Habit Tracker database and create an admin user.</p>
                        
                        <form method="post" action="">
                            <div class="mb-3">
                                <label for="admin_username" class="form-label">Admin Username</label>
                                <input type="text" class="form-control" id="admin_username" name="admin_username" required>
                                <div class="form-text">Choose a username for the admin account.</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="admin_password" class="form-label">Admin Password</label>
                                <input type="password" class="form-control" id="admin_password" name="admin_password" required>
                                <div class="form-text">Use a strong password with at least 8 characters.</div>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Run Setup</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
<?php
}
?>