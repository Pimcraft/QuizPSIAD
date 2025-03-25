<?php
// save_result.php
header('Content-Type: application/json; charset=utf-8');

$points = isset($_POST['points']) ? intval($_POST['points']) : 0;
$timeSeconds = isset($_POST['timeSeconds']) ? intval($_POST['timeSeconds']) : 900;

$file = 'wyniki.json';
if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

$jsonData = file_get_contents($file);
$wyniki = json_decode($jsonData, true);
if (!is_array($wyniki)) {
    $wyniki = [];
}

$wyniki[] = [
    'points' => $points,
    'time' => $timeSeconds,
    'timestamp' => time()
];

file_put_contents($file, json_encode($wyniki, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Obliczamy statystyki
$total = count($wyniki);
$sumPoints = 0;
$sumTime = 0;
$bestPoints = 0;
$bestTime = 9999999;

foreach ($wyniki as $w) {
    $sumPoints += $w['points'];
    $sumTime += $w['time'];
    if ($w['points'] > $bestPoints) {
        $bestPoints = $w['points'];
        $bestTime = $w['time'];
    } else if ($w['points'] == $bestPoints && $w['time'] < $bestTime) {
        $bestTime = $w['time'];
    }
}

$averagePoints = $sumPoints / $total;
$averageTime = $sumTime / $total;
$totalQuestions = 40;

$response = [
    'averagePoints' => $averagePoints,
    'averageTime' => $averageTime,
    'bestPoints' => $bestPoints,
    'bestTime' => $bestTime,
    'totalQuestions' => $totalQuestions
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);