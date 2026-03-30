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

// Prevent duplicate: same user, same slot
$dupUser = $pdo->prepare("SELECT id FROM bookings WHERE resource = ? AND date = ? AND time = ? AND user_email = ? AND status != 'Rejected'");
$dupUser->execute([$resource, $date, $time, $user]);
if ($dupUser->fetch()) {
    echo json_encode(["message" => "You already have a booking request for this slot!"]);
    exit;
}

// Prevent booking an already approved slot
$approved = $pdo->prepare("SELECT id FROM bookings WHERE resource = ? AND date = ? AND time = ? AND status = 'Approved'");
$approved->execute([$resource, $date, $time]);
if ($approved->fetch()) {
    echo json_encode(["message" => "This slot is already approved for another user. Please choose a different slot."]);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO bookings (resource, date, time, status, user_email) VALUES (?, ?, ?, ?, ?)");
if ($stmt->execute([$resource, $date, $time, $status, $user])) {
    echo json_encode(["message" => "Booking request submitted successfully!"]);
} else {
    echo json_encode(["message" => "Error storing booking"]);
}
?>