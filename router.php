<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/' || $path === '/index') {
    include 'login.html';
} elseif ($path === '/login') {
    include 'login.html';
} elseif ($path === '/home') {
    include 'home.html';
} elseif ($path === '/insert_booking.php') {
    include 'insert_booking.php';
} elseif ($path === '/get_bookings.php') {
    include 'get_bookings.php';
} elseif ($path === '/update_booking.php') {
    include 'update_booking.php';
} elseif ($path === '/delete-booking.php') {
    include 'delete-booking.php';
} else {
    http_response_code(404);
    echo "Page not found";
}