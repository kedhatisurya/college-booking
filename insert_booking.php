<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["message" => "No data received"]);
    exit;
}

$resource = $data['resource'] ?? '';
$date     = $data['date']     ?? '';
$time     = $data['time']     ?? '';
$status   = $data['status']   ?? 'Pending';
$user     = $data['user']     ?? '';

if (!$resource || !$date || !$time || !$user) {
    echo json_encode(["message" => "Missing fields"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO bookings (resource, date, time, status, user_email) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $resource, $date, $time, $status, $user);

if ($stmt->execute()) {
    echo json_encode(["message" => "Booking stored successfully"]);
} else {
    echo json_encode(["message" => "Error storing booking"]);
}
?>