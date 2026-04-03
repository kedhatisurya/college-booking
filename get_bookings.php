<?php
include 'db.php';
$stmt = $pdo->query("SELECT * FROM bookings ORDER BY 
    CASE WHEN status='Pending' THEN 0 ELSE 1 END, 
    id DESC");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>