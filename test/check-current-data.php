<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Check Current Database Data</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .good { color: green; }
        .bad { color: red; }
        pre { background: #f4f4f4; padding: 10px; }
    </style>
</head>
<body>
<h1>Current Database Contents</h1>

<?php
$dbConfig = parse_ini_file('../../letters/db.ini');

try {
    $mysqli = new mysqli(
        $dbConfig['host'],
        $dbConfig['username'],
        $dbConfig['password'],
        $dbConfig['name']
    );

    if ($mysqli->connect_error) {
        die("Connection failed: " . $mysqli->connect_error);
    }

    // Check item 200 description
    echo "<h2>Item 200 Description (raw from database):</h2>";
    $result = $mysqli->query("SELECT text FROM {$dbConfig['prefix']}element_texts WHERE record_id = 200 AND element_id = 41 LIMIT 1");
    $row = $result->fetch_assoc();

    echo "<pre>";
    echo htmlspecialchars(substr($row['text'], 0, 500));
    echo "</pre>";

    echo "<h2>Hex Analysis:</h2>";
    echo "<p>First 200 hex chars: " . substr(bin2hex($row['text']), 0, 200) . "</p>";

    // Check for specific character patterns
    $text = $row['text'];
    echo "<h2>Character Check:</h2>";

    if (strpos($text, 'Å') !== false || strpos(bin2hex($text), 'C385') !== false) {
        echo "<p class='good'>✓ Found Å (capital A with ring)</p>";
    }

    if (strpos($text, 'å') !== false || strpos(bin2hex($text), 'C3A5') !== false) {
        echo "<p class='good'>✓ Found å (lowercase a with ring)</p>";
    }

    if (strpos($text, 'ø') !== false || strpos(bin2hex($text), 'C3B8') !== false) {
        echo "<p class='good'>✓ Found ø (lowercase o with stroke)</p>";
    }

    if (strpos($text, 'Ø') !== false || strpos(bin2hex($text), 'C398') !== false) {
        echo "<p class='good'>✓ Found Ø (capital O with stroke)</p>";
    }

    // Check for corrupted smart quotes
    if (strpos($text, 'â€') !== false) {
        echo "<p class='bad'>✗ Still has corrupted smart quotes (â€œ, â€™)</p>";
    }

    // Check for double-encoded
    if (strpos($text, 'Ã') !== false) {
        echo "<p class='bad'>✗ Still has double-encoded characters (Ã)</p>";
    }

    $mysqli->close();

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>

</body>
</html>
