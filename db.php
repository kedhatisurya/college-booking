<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$host     = getenv('DB_HOST')     ?: 'gondola.proxy.rlwy.net';
$port     = getenv('DB_PORT')     ?: '52125';
$user     = getenv('DB_USER')     ?: 'root';
$password = getenv('DB_PASSWORD') ?: 'DnqjuDIxZeSABtfOtoPIzkpmruqpnyNP';
$database = getenv('DB_NAME')     ?: 'college_booking';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$database;charset=utf8",
        $user,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $e->getMessage()]));
}
?>