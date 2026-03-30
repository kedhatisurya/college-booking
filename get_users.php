<?php
include 'db.php';
$stmt = $pdo->query("SELECT id, email, role FROM users");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>