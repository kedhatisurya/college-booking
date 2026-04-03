<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) { echo json_encode(["message" => "No data"]); exit; }

$id = $data['id'] ?? null;
if (!$id) { echo json_encode(["message" => "Missing id"]); exit; }

if (!empty($data['clear_conflict'])) {
    $stmt = $pdo->prepare("UPDATE bookings SET is_conflict=0 WHERE id=?");
    $stmt->execute([$id]);
    echo json_encode(["message" => "Conflict cleared"]);
    exit;
}

$status = $data['status'] ?? '';
if (!$status) { echo json_encode(["message" => "Missing status"]); exit; }

// Update the target booking
$stmt = $pdo->prepare("UPDATE bookings SET status=? WHERE id=?");
$stmt->execute([$status, $id]);

// Get the slot details of this booking
$booking = $pdo->prepare("SELECT resource, date, time FROM bookings WHERE id=?");
$booking->execute([$id]);
$b = $booking->fetch(PDO::FETCH_ASSOC);

if ($b) {
    // Count remaining PENDING bookings for this slot
    $pending = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE resource=? AND date=? AND time=? AND status='Pending'");
    $pending->execute([$b['resource'], $b['date'], $b['time']]);
    $pendingCount = $pending->fetchColumn();

    if ($pendingCount <= 1) {
        // 0 or 1 pending left = no conflict anymore, clear yellow for entire slot
        $clear = $pdo->prepare("UPDATE bookings SET is_conflict=0 WHERE resource=? AND date=? AND time=?");
        $clear->execute([$b['resource'], $b['date'], $b['time']]);
    }
}

echo json_encode(["message" => "Status updated"]);
?>