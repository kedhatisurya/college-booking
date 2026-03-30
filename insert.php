<?php
include 'db.php';

$name = "Surya";
$email = "surya@gmail.com";

$sql = "INSERT INTO students (name, email) VALUES ('$name', '$email')";

if ($conn->query($sql) === TRUE) {
    echo "Data inserted successfully!";
} else {
    echo "Error: " . $conn->error;
}
?>