<?php
include 'db.php';
$stmt = $pdo->query("SELECT * FROM bookings ORDER BY id DESC");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>