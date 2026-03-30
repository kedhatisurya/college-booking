<?php
include 'db.php';

$result = $conn->query("SELECT id, email, role FROM users");
$users  = [];

while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);
?>