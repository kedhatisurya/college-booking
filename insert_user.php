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

// Check if user already exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["message" => "Email already registered"]);
    exit;
}

// Hash password before storing
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $email, $hashedPassword, $role);

if ($stmt->execute()) {
    echo json_encode(["message" => "User stored"]);
} else {
    echo json_encode(["message" => "Error storing user"]);
}
?>