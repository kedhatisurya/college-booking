<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["message" => "No data received"]);
    exit;
}

$email    = $data['email']    ?? '';
$password = $data['password'] ?? '';
$role     = $data['role']     ?? '';

if (!$email || !$password || !$role) {
    echo json_encode(["message" => "Missing fields"]);
    exit;
}

$check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$check->execute([$email]);
if ($check->fetch()) {
    echo json_encode(["message" => "Email already registered"]);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");

if ($stmt->execute([$email, $hashedPassword, $role])) {
    echo json_encode(["message" => "User stored"]);
} else {
    echo json_encode(["message" => "Error storing user"]);
}
?>