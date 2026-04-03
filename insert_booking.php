<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) { echo json_encode(["message" => "No data received"]); exit; }

$resource = $data['resource'] ?? '';
$date     = $data['date']     ?? '';
$time     = $data['time']     ?? '';
$status   = 'Pending';
$user     = $data['user']     ?? '';

if (!$resource || !$date || !$time || !$user) {
    echo json_encode(["message" => "Missing fields"]); exit;
}

// 1. Prevent same user booking same slot twice
$dupUser = $pdo->prepare("SELECT id FROM bookings WHERE resource=? AND date=? AND time=? AND user_email=? AND status != 'Rejected'");
$dupUser->execute([$resource, $date, $time, $user]);
if ($dupUser->fetch()) {
    echo json_encode(["message" => "You already have a booking for this slot!"]); exit;
}

// 2. Block if slot already approved
$approved = $pdo->prepare("SELECT id FROM bookings WHERE resource=? AND date=? AND time=? AND status='Approved'");
$approved->execute([$resource, $date, $time]);
if ($approved->fetch()) {
    echo json_encode(["message" => "This slot is already approved. Please choose a different slot."]); exit;
}

// 3. Check if another PENDING booking exists for same slot → mark both as conflict
$conflict = $pdo->prepare("SELECT id FROM bookings WHERE resource=? AND date=? AND time=? AND status='Pending'");
$conflict->execute([$resource, $date, $time]);
$existing = $conflict->fetch();

if ($existing) {
    // Mark existing booking as conflict
    $pdo->prepare("UPDATE bookings SET is_conflict=1 WHERE id=?")->execute([$existing['id']]);
    // Insert new booking also as conflict
    $stmt = $pdo->prepare("INSERT INTO bookings (resource, date, time, status, user_email, is_conflict) VALUES (?,?,?,?,?,1)");
    if ($stmt->execute([$resource, $date, $time, $status, $user])) {
        echo json_encode(["message" => "Booking request submitted successfully!"]);
    } else {
        echo json_encode(["message" => "Error storing booking"]);
    }
} else {
    // No conflict — clean booking
    $stmt = $pdo->prepare("INSERT INTO bookings (resource, date, time, status, user_email, is_conflict) VALUES (?,?,?,?,?,0)");
    if ($stmt->execute([$resource, $date, $time, $status, $user])) {
        echo json_encode(["message" => "Booking request submitted successfully!"]);
    } else {
        echo json_encode(["message" => "Error storing booking"]);
    }
}
?>