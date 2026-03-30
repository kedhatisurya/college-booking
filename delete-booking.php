<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(["message" => "Missing ID"]);
    exit;
}

$id   = (int) $data['id'];
$stmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Deleted"]);
} else {
    echo json_encode(["message" => "Error deleting"]);
}
?>