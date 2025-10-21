<?php
// Get Omeka admin user info
$dbConfig = parse_ini_file('letters/db.ini');

$mysqli = new mysqli(
    $dbConfig['host'],
    $dbConfig['username'],
    $dbConfig['password'],
    $dbConfig['name']
);

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

echo "Omeka Admin Users:\n";
echo "==================\n\n";

$result = $mysqli->query("SELECT id, username, email, role, active FROM {$dbConfig['prefix']}users");

while ($row = $result->fetch_assoc()) {
    echo "Username: " . $row['username'] . "\n";
    echo "Email: " . $row['email'] . "\n";
    echo "Role: " . $row['role'] . "\n";
    echo "Active: " . ($row['active'] ? 'Yes' : 'No') . "\n";
    echo "---\n";
}

echo "\nAdmin URL: https://huginn.net/shoebox/letters/admin\n";
echo "\nNote: Passwords are hashed in the database. You'll need to reset via:\n";
echo "1. 'Forgot password' link on login page\n";
echo "2. Or update directly in database if you have access\n";

$mysqli->close();
?>
