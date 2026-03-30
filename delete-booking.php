<?php
include 'db.php';
$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['id'])) { echo json_encode(["message" => "Missing ID"]); exit; }
$stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
if ($stmt->execute([(int)$data['id']])) {
    echo json_encode(["message" => "Deleted"]);
} else {
    echo json_encode(["message" => "Error deleting"]);
}
?>