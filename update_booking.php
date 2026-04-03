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
} else {
    $status = $data['status'] ?? '';
    $stmt = $pdo->prepare("UPDATE bookings SET status=? WHERE id=?");
    $stmt->execute([$status, $id]);
    echo json_encode(["message" => "Status updated"]);
}
?>