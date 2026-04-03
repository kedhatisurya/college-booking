<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve static files (css, js, images) directly
$staticFile = __DIR__ . $path;
if ($path !== '/' && file_exists($staticFile) && !is_dir($staticFile)) {
    $ext = pathinfo($staticFile, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'ico'  => 'image/x-icon',
        'svg'  => 'image/svg+xml',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
    ];
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile($staticFile);
    exit;
}

// Route pages
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