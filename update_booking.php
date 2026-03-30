<?php
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id']) || !isset($data['status'])) {
    echo json_encode(["message" => "Missing fields"]);
    exit;
}

$id     = (int) $data['id'];
$status = $data['status'];

$stmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Updated"]);
} else {
    echo json_encode(["message" => "Error updating"]);
}
?>