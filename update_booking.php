<?php
include 'db.php';
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['id']) || !isset($data['status'])) {
    echo json_encode(["message" => "Missing fields"]); exit;
}
$stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
if ($stmt->execute([$data['status'], (int)$data['id']])) {
    echo json_encode(["message" => "Updated"]);
} else {
    echo json_encode(["message" => "Error updating"]);
}
?>