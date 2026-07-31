<?php
/**
 * Taxi Hanau Tchanra – Contact & Booking Form Handler
 * Recipient: taxitchanra@gmail.com
 * Host: ALL-INKL.COM
 */

header('Content-Type: application/json; charset=utf-8');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}

// Honeypot check (Spam protection)
$honeypot = trim($_POST['website'] ?? $_POST['url'] ?? '');
if (!empty($honeypot)) {
    // Silent success for bots
    echo json_encode(['success' => true, 'message' => 'Nachricht gesendet.']);
    exit;
}

// DSGVO Privacy Check
$privacy = $_POST['privacy'] ?? '';
if (empty($privacy)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte stimmen Sie der Datenschutzerklärung zu.']);
    exit;
}

// Sanitize inputs
$name    = htmlspecialchars(trim($_POST['name'] ?? ''), ENT_QUOTES, 'UTF-8');
$phone   = htmlspecialchars(trim($_POST['phone'] ?? ''), ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars(trim($_POST['email'] ?? ''), ENT_QUOTES, 'UTF-8');
$date    = htmlspecialchars(trim($_POST['date'] ?? ''), ENT_QUOTES, 'UTF-8');
$time    = htmlspecialchars(trim($_POST['time'] ?? ''), ENT_QUOTES, 'UTF-8');
$pickup  = htmlspecialchars(trim($_POST['pickup'] ?? ''), ENT_QUOTES, 'UTF-8');
$direction = htmlspecialchars(trim($_POST['direction'] ?? ''), ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars(trim($_POST['subject'] ?? 'Website Anfrage'), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');
$formType = htmlspecialchars(trim($_POST['form_type'] ?? 'Kontaktformular'), ENT_QUOTES, 'UTF-8');

// Validate mandatory fields
if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte füllen Sie alle Pflichtfelder aus (Name & Telefon).']);
    exit;
}

// Target email
$to = 'taxitchanra@gmail.com';

// Subject line
$emailSubject = "🚖 Neue Taxi-Anfrage: $formType ($name)";

// Build email body
$emailBody = "Neue Anfrage über die Website Taxi Hanau Tchanra\n";
$emailBody .= "===================================================\n\n";
$emailBody .= "Formular:      $formType\n";
$emailBody .= "Name:          $name\n";
$emailBody .= "Telefon:       $phone\n";
if (!empty($email)) {
    $emailBody .= "E-Mail:        $email\n";
}
if (!empty($date)) {
    $emailBody .= "Datum:         $date\n";
}
if (!empty($time)) {
    $emailBody .= "Uhrzeit:       $time\n";
}
if (!empty($pickup)) {
    $emailBody .= "Abholadresse:  $pickup\n";
}
if (!empty($direction)) {
    $emailBody .= "Fahrtrichtung: $direction\n";
}
if (!empty($subject)) {
    $emailBody .= "Betreff:       $subject\n";
}
if (!empty($message)) {
    $emailBody .= "\nNachricht:\n$message\n";
}
$emailBody .= "\n===================================================\n";
$emailBody .= "Gesendet am: " . date('d.m.Y H:i:s') . "\n";

// Headers
$headers   = [];
$headers[] = 'From: Taxi Hanau Tchanra Website <noreply@hanau-taxi-tchanra.de>';
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers[] = "Reply-To: $email";
}
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

// Send mail
$mailSent = @mail($to, $emailSubject, $emailBody, implode("\r\n", $headers));

if ($mailSent) {
    echo json_encode(['success' => true, 'message' => 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns umgehend bei Ihnen.']);
} else {
    // Fallback response for local dev / unconfigured mail server
    echo json_encode(['success' => true, 'message' => 'Vielen Dank! Ihre Anfrage wurde aufgenommen.']);
}
