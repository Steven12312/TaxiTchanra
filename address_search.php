<?php
/* ============================================================
   TAXI HANAU TCHANRA – DSGVO-konformer Adress-Such-Proxy
   Überträgt KEINE Nutzer-IP-Adressen an Drittanbieter.
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=1800');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';

if (mb_strlen($q, 'UTF-8') < 2) {
    echo json_encode([]);
    exit;
}

// Hanau Region Coordinates (Priorität für Hanau, Umland & Aschaffenburg/Rhein-Main)
$lat = 50.1332;
$lon = 8.9167;
$url = "https://photon.komoot.io/api/?q=" . urlencode($q) . "&lang=de&limit=8&lat=" . $lat . "&lon=" . $lon;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'TaxiTchanra/1.0 (https://hanau-taxi-tchanra.de)');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$response || $httpCode !== 200) {
    echo json_encode([]);
    exit;
}

$data = json_decode($response, true);
if (!$data || !isset($data['features'])) {
    echo json_encode([]);
    exit;
}

$results = [];
$seen = [];

foreach ($data['features'] as $feat) {
    $props = $feat['properties'] ?? [];
    $name = $props['name'] ?? '';
    $street = isset($props['street']) ? $props['street'] . (isset($props['housenumber']) ? ' ' . $props['housenumber'] : '') : '';
    $city = $props['city'] ?? $props['town'] ?? $props['village'] ?? $props['county'] ?? '';
    $postcode = $props['postcode'] ?? '';

    $formattedParts = array_filter([$street ?: $name, $postcode, $city]);
    $line = implode(', ', $formattedParts);
    if (empty($line)) {
        $line = $name ?: $city;
    }

    if (isset($seen[$line])) {
        continue;
    }
    $seen[$line] = true;

    $icon = '📍';
    if (isset($props['osm_key'])) {
        if ($props['osm_key'] === 'aeroway') $icon = '✈️';
        elseif ($props['osm_key'] === 'railway') $icon = '🚆';
        elseif ($props['osm_key'] === 'place' && in_array($props['osm_value'] ?? '', ['city', 'town', 'village'])) $icon = '🏙️';
    }

    $results[] = [
        'formatted' => $line,
        'icon' => $icon
    ];
}

echo json_encode(array_values($results), JSON_UNESCAPED_UNICODE);
