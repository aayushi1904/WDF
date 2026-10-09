<?php
declare(strict_types=1);

session_set_cookie_params([
    'httponly' => true,
    'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
]);
session_start();

if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    http_response_code(405);
    exit('Method not allowed.');
}

if (!isset($_SESSION['registration_csrf_token'])) {
    $_SESSION['registration_csrf_token'] = bin2hex(random_bytes(32));
}

$fieldNames = ['name', 'email', 'mobile', 'pincode', 'gender', 'address', 'message'];
$values = array_fill_keys($fieldNames, '');
$errors = [];
$feedback = $_SESSION['registration_feedback'] ?? null;
unset($_SESSION['registration_feedback']);

if (is_array($feedback)) {
    $values = array_merge($values, $feedback['values'] ?? []);
    $errors = $feedback['errors'] ?? [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $submittedToken = $_POST['csrf_token'] ?? '';

    if (
        !is_string($submittedToken)
        || !hash_equals($_SESSION['registration_csrf_token'], $submittedToken)
    ) {
        $errors = [];
        $feedback = [
            'type' => 'error',
            'message' => 'This form has expired or was already submitted. Please review your details and try again.',
            'values' => $values,
            'errors' => [],
        ];
    } else {
        foreach ($fieldNames as $fieldName) {
            $postedValue = $_POST[$fieldName] ?? '';
            $values[$fieldName] = is_string($postedValue) ? trim($postedValue) : '';
        }

        $errors = validateRegistration($values);
        if ($errors === []) {
            $record = $values;
            $record['submitted_at'] = date(DATE_ATOM);

            if (saveSubmission($record)) {
                $feedback = [
                    'type' => 'success',
                    'message' => 'Registration submitted successfully!',
                    'values' => array_fill_keys($fieldNames, ''),
                    'errors' => [],
                ];
            } else {
                $feedback = [
                    'type' => 'error',
                    'message' => 'Your submission could not be saved. Please try again later or contact the portal administrator.',
                    'values' => $values,
                    'errors' => [],
                ];
            }
        } else {
            $feedback = [
                'type' => 'validation',
                'message' => 'Please correct the highlighted fields and submit the form again.',
                'values' => $values,
                'errors' => $errors,
            ];
        }
    }

    $_SESSION['registration_feedback'] = $feedback;
    $_SESSION['registration_csrf_token'] = bin2hex(random_bytes(32));
    header('Location: registration.php', true, 303);
    exit;
}

$csrfToken = $_SESSION['registration_csrf_token'];

function validateRegistration(array $values): array
{
    $errors = [];
    $name = $values['name'];
    $email = $values['email'];
    $mobile = $values['mobile'];
    $pincode = $values['pincode'];
    $gender = $values['gender'];
    $address = $values['address'];
    $message = $values['message'];

    if ($name === '') {
        $errors['name'] = 'Name is required.';
    } elseif (preg_match("/\\A[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]{1,99}\\z/u", $name) !== 1) {
        $errors['name'] = 'Enter a name of 2–100 characters using letters, spaces, apostrophes, periods, or hyphens.';
    }

    if ($email === '') {
        $errors['email'] = 'Email is required.';
    } elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $errors['email'] = 'Enter a valid email address.';
    }

    if ($mobile === '') {
        $errors['mobile'] = 'Mobile number is required.';
    } elseif (preg_match('/\\A[0-9]{10}\\z/', $mobile) !== 1) {
        $errors['mobile'] = 'Enter a valid 10-digit mobile number.';
    }

    if ($pincode === '') {
        $errors['pincode'] = 'Pincode is required.';
    } elseif (preg_match('/\\A[0-9]{6}\\z/', $pincode) !== 1) {
        $errors['pincode'] = 'Enter a valid 6-digit pincode.';
    }

    if (!in_array($gender, ['Female', 'Male', 'Other'], true)) {
        $errors['gender'] = 'Select one of the available gender options.';
    }

    if (!isValidText($address, 500)) {
        $errors['address'] = 'Address is required and must be no more than 500 characters.';
    }

    if (!isValidText($message, 2000)) {
        $errors['message'] = 'Message is required and must be no more than 2,000 characters.';
    }

    return $errors;
}

function isValidText(string $value, int $maximumLength): bool
{
    return $value !== ''
        && strlen($value) <= $maximumLength
        && preg_match('//u', $value) === 1
        && preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value) !== 1;
}

function saveSubmission(array $record): bool
{
    $dataDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dataDirectory) && !@mkdir($dataDirectory, 0750, true) && !is_dir($dataDirectory)) {
        error_log('Registration storage directory could not be created.');
        return false;
    }

    $storagePath = $dataDirectory . DIRECTORY_SEPARATOR . 'submissions.json';
    $lock = @fopen($storagePath . '.lock', 'c');
    if ($lock === false) {
        error_log('Registration storage lock could not be opened.');
        return false;
    }

    if (!flock($lock, LOCK_EX)) {
        error_log('Registration storage lock could not be acquired.');
        fclose($lock);
        return false;
    }

    $contents = is_file($storagePath) ? @file_get_contents($storagePath) : '[]';
    if ($contents === false) {
        error_log('Registration storage file could not be read.');
        flock($lock, LOCK_UN);
        fclose($lock);
        return false;
    }

    $trimmedContents = trim($contents);
    if ($trimmedContents === '') {
        $submissions = [];
    } else {
        try {
            $submissions = json_decode($trimmedContents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            error_log('Registration storage contains invalid JSON.');
            flock($lock, LOCK_UN);
            fclose($lock);
            return false;
        }

        if (!is_array($submissions) || $trimmedContents[0] !== '[') {
            error_log('Registration storage must contain a JSON array.');
            flock($lock, LOCK_UN);
            fclose($lock);
            return false;
        }
    }

    $submissions[] = $record;
    try {
        $encodedSubmissions = json_encode(
            $submissions,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );
    } catch (JsonException $exception) {
        error_log('Registration submission could not be encoded as JSON.');
        flock($lock, LOCK_UN);
        fclose($lock);
        return false;
    }

    $temporaryPath = @tempnam($dataDirectory, '.submissions-');
    if ($temporaryPath === false) {
        error_log('Temporary registration storage file could not be created.');
        flock($lock, LOCK_UN);
        fclose($lock);
        return false;
    }

    $temporaryFile = @fopen($temporaryPath, 'wb');
    $payload = $encodedSubmissions . PHP_EOL;
    $writeSucceeded = $temporaryFile !== false;

    if ($writeSucceeded) {
        $written = 0;
        $payloadLength = strlen($payload);
        while ($written < $payloadLength) {
            $bytesWritten = fwrite($temporaryFile, substr($payload, $written));
            if ($bytesWritten === false || $bytesWritten === 0) {
                $writeSucceeded = false;
                break;
            }
            $written += $bytesWritten;
        }
        $writeSucceeded = $writeSucceeded && fflush($temporaryFile);
        fclose($temporaryFile);
    }

    if ($writeSucceeded) {
        $writeSucceeded = @rename($temporaryPath, $storagePath);
    }
    if (!$writeSucceeded) {
        @unlink($temporaryPath);
        error_log('Registration submission could not be written to storage.');
    }

    flock($lock, LOCK_UN);
    fclose($lock);

    return $writeSucceeded;
}

function escapeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function fieldError(string $fieldName, array $errors): string
{
    if (!isset($errors[$fieldName])) {
        return '';
    }

    return '<small class="practical7-field-error" id="' . escapeHtml($fieldName)
        . 'Error" role="alert">' . escapeHtml($errors[$fieldName]) . '</small>';
}

function fieldAttributes(string $fieldName, array $errors): string
{
    if (!isset($errors[$fieldName])) {
        return '';
    }

    return ' aria-invalid="true" aria-describedby="' . escapeHtml($fieldName) . 'Error"';
}

function oldValue(string $fieldName, array $values): string
{
    return escapeHtml($values[$fieldName] ?? '');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Form - StudentHub Portal</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="practical7.css">
</head>
<body>
    <header>
        <div class="logo">
            <img src="images/college-logo.png" alt="StudentHub Logo">
            <div class="logo-text">
                <h2>StudentHub Portal</h2>
                <p>Charotar University of Science And Technology</p>
            </div>
        </div>
        <button class="hamburger" onclick="toggleMenu()" aria-label="Open navigation menu"
                aria-expanded="false" aria-controls="navMenu">☰</button>
        <nav aria-label="Main navigation">
            <ul id="navMenu">
                <li><a href="index.html">Home</a></li>
                <li><a href="About.html">About</a></li>
                <li><a href="login.html">Login</a></li>
                <li><a href="Signup.html">Sign Up</a></li>
                <li><a href="registration.php" class="active" aria-current="page">Registration Form</a></li>
                <li><a href="practical6.html">Data Explorer</a></li>
            </ul>
        </nav>
        <button id="themeBtn" class="theme-btn" onclick="toggleTheme()">Dark Mode</button>
    </header>

    <main class="practical7-main">
        <section class="practical7-intro">
            <span class="practical7-badge">PRACTICAL 7</span>
            <h1>Registration / Contact Form</h1>
            <p>Share your contact details with the StudentHub team.</p>
        </section>

        <section class="practical7-card" aria-labelledby="registrationHeading">
            <h2 id="registrationHeading">Your details</h2>
            <p class="practical7-required-note"><span aria-hidden="true">*</span> Required fields</p>

            <?php if (is_array($feedback) && isset($feedback['message'])): ?>
                <div class="practical7-feedback practical7-feedback-<?= escapeHtml($feedback['type']) ?>"
                     role="<?= $feedback['type'] === 'success' ? 'status' : 'alert' ?>" aria-live="polite">
                    <?= escapeHtml($feedback['message']) ?>
                </div>
            <?php endif; ?>

            <?php if ($errors !== []): ?>
                <div class="practical7-error-summary" role="alert" tabindex="-1">
                    <strong>Please check the following fields:</strong>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?= escapeHtml($error) ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form action="registration.php" method="POST" novalidate>
                <input type="hidden" name="csrf_token" value="<?= escapeHtml($csrfToken) ?>">

                <div class="practical7-grid">
                    <div class="practical7-field">
                        <label for="name">Name <span>*</span></label>
                        <input type="text" id="name" name="name" value="<?= oldValue('name', $values) ?>"
                               placeholder="Enter your full name" autocomplete="name" maxlength="100"
                               required<?= fieldAttributes('name', $errors) ?>>
                        <?= fieldError('name', $errors) ?>
                    </div>

                    <div class="practical7-field">
                        <label for="email">Email <span>*</span></label>
                        <input type="email" id="email" name="email" value="<?= oldValue('email', $values) ?>"
                               placeholder="you@example.com" autocomplete="email" maxlength="254"
                               required<?= fieldAttributes('email', $errors) ?>>
                        <?= fieldError('email', $errors) ?>
                    </div>

                    <div class="practical7-field">
                        <label for="mobile">Mobile number <span>*</span></label>
                        <input type="tel" id="mobile" name="mobile" value="<?= oldValue('mobile', $values) ?>"
                               placeholder="10-digit mobile number" autocomplete="tel" inputmode="numeric"
                               maxlength="10" required<?= fieldAttributes('mobile', $errors) ?>>
                        <?= fieldError('mobile', $errors) ?>
                    </div>

                    <div class="practical7-field">
                        <label for="pincode">Pincode <span>*</span></label>
                        <input type="text" id="pincode" name="pincode" value="<?= oldValue('pincode', $values) ?>"
                               placeholder="6-digit pincode" inputmode="numeric" autocomplete="postal-code"
                               maxlength="6" required<?= fieldAttributes('pincode', $errors) ?>>
                        <?= fieldError('pincode', $errors) ?>
                    </div>
                </div>

                <fieldset class="practical7-field practical7-gender">
                    <legend>Gender <span>*</span></legend>
                    <div class="practical7-radio-options">
                        <?php foreach (['Female', 'Male', 'Other'] as $genderOption): ?>
                            <label for="gender-<?= strtolower($genderOption) ?>">
                                <input type="radio" id="gender-<?= strtolower($genderOption) ?>"
                                    name="gender" value="<?= escapeHtml($genderOption) ?>"
                                    <?= $values['gender'] === $genderOption ? 'checked' : '' ?>
                                    <?= isset($errors['gender']) ? 'aria-invalid="true" aria-describedby="genderError"' : '' ?>
                                    required>
                                <span><?= escapeHtml($genderOption) ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                    <?= fieldError('gender', $errors) ?>
                </fieldset>

                <div class="practical7-field">
                    <label for="address">Address <span>*</span></label>
                    <textarea id="address" name="address" rows="3" maxlength="500"
                              placeholder="Enter your postal address" autocomplete="street-address"
                              required<?= fieldAttributes('address', $errors) ?>><?= oldValue('address', $values) ?></textarea>
                    <?= fieldError('address', $errors) ?>
                </div>

                <div class="practical7-field">
                    <label for="message">Message <span>*</span></label>
                    <textarea id="message" name="message" rows="5" maxlength="2000"
                              placeholder="How can StudentHub help you?" required<?= fieldAttributes('message', $errors) ?>><?= oldValue('message', $values) ?></textarea>
                    <?= fieldError('message', $errors) ?>
                </div>

                <button class="practical7-submit" type="submit">Submit registration</button>
            </form>
        </section>
    </main>

    <footer>
        <p>© 2026 StudentHub Portal | Developed by Aayushi Gohil</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
