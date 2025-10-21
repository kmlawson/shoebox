#!/usr/bin/env php
<?php
/**
 * Extract letters from Omeka SQL dump and convert to JSON flat files
 */

// Database connection
$dbConfig = parse_ini_file('../letters/db.ini');

$mysqli = new mysqli(
    $dbConfig['host'],
    $dbConfig['username'],
    $dbConfig['password'],
    $dbConfig['name']
);

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$mysqli->set_charset('utf8');

echo "Extracting letters from database...\n\n";

// Get all items
$query = "
    SELECT
        i.id,
        i.added,
        i.modified,
        i.public
    FROM {$dbConfig['prefix']}items i
    WHERE i.item_type_id = 1
    ORDER BY i.id
";

$result = $mysqli->query($query);
$count = 0;

while ($item = $result->fetch_assoc()) {
    $itemId = $item['id'];

    // Get all element texts for this item
    $elementsQuery = "
        SELECT
            e.name as element_name,
            et.text
        FROM {$dbConfig['prefix']}element_texts et
        JOIN {$dbConfig['prefix']}elements e ON et.element_id = e.id
        WHERE et.record_id = $itemId
        ORDER BY e.name
    ";

    $elementsResult = $mysqli->query($elementsQuery);

    $letter = [
        'id' => (int)$itemId,
        'added' => $item['added'],
        'modified' => $item['modified'],
        'public' => (bool)$item['public'],
        'metadata' => []
    ];

    // Group by element name (some elements have multiple values)
    while ($element = $elementsResult->fetch_assoc()) {
        $elementName = $element['element_name'];
        $text = $element['text'];

        if (!isset($letter['metadata'][$elementName])) {
            $letter['metadata'][$elementName] = [];
        }

        $letter['metadata'][$elementName][] = $text;
    }

    // Get tags
    $tagsQuery = "
        SELECT t.name
        FROM {$dbConfig['prefix']}taggings tg
        JOIN {$dbConfig['prefix']}tags t ON tg.tag_id = t.id
        WHERE tg.relation_id = $itemId AND tg.type = 'Item'
        ORDER BY t.name
    ";

    $tagsResult = $mysqli->query($tagsQuery);
    $tags = [];
    while ($tag = $tagsResult->fetch_assoc()) {
        $tags[] = $tag['name'];
    }
    $letter['tags'] = $tags;

    // Get files
    $filesQuery = "
        SELECT
            original_filename,
            filename,
            mime_type
        FROM {$dbConfig['prefix']}files
        WHERE item_id = $itemId
        ORDER BY id
    ";

    $filesResult = $mysqli->query($filesQuery);
    $files = [];
    while ($file = $filesResult->fetch_assoc()) {
        $files[] = [
            'original' => $file['original_filename'],
            'filename' => $file['filename'],
            'mime_type' => $file['mime_type']
        ];
    }
    $letter['files'] = $files;

    // Write to JSON file
    $filename = sprintf('letters/%04d.json', $itemId);
    $json = json_encode($letter, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents($filename, $json);

    $count++;
    if ($count % 10 == 0) {
        echo "Processed $count letters...\n";
    }
}

echo "\n✓ Extracted $count letters to JSON files in explore/letters/\n";
echo "✓ Each letter saved as XXXX.json (e.g., 0001.json, 0002.json)\n";

$mysqli->close();
?>
