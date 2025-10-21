<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($_GET['title'] ?? 'Location'); ?></title>

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>

    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        #map {
            height: 100%;
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <!-- Leaflet JavaScript -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""></script>

    <script>
        <?php
        // Get location from URL parameters
        $title = isset($_GET['title']) ? urldecode($_GET['title']) : 'Location';
        $latlong = isset($_GET['latlong']) ? urldecode($_GET['latlong']) : '66.22821,13.688965';
        list($lat, $lng) = explode(',', $latlong);
        $lat = floatval(trim($lat));
        $lng = floatval(trim($lng));
        ?>

        // Initialize map focused on specific location
        var map = L.map('map').setView([<?php echo $lat; ?>, <?php echo $lng; ?>], 10);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Add marker for this location
        var marker = L.marker([<?php echo $lat; ?>, <?php echo $lng; ?>]).addTo(map);
        marker.bindPopup('<strong><?php echo htmlspecialchars($title); ?></strong>').openPopup();

        // Load all locations from CSV for context (with reduced opacity)
        fetch('locations.csv')
            .then(response => response.text())
            .then(data => {
                const lines = data.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        const parts = line.split(',');
                        if (parts.length >= 4) {
                            const name = parts[0].trim();
                            const description = parts[1].trim();
                            const lat = parseFloat(parts[2]);
                            const lng = parseFloat(parts[3]);

                            // Don't duplicate the main marker
                            if (name !== '<?php echo addslashes($title); ?>' && !isNaN(lat) && !isNaN(lng)) {
                                var m = L.marker([lat, lng], {
                                    opacity: 0.5
                                }).addTo(map);
                                m.bindPopup('<strong>' + name + '</strong><br>' + description);
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error loading locations:', error));
    </script>
</body>
</html>
