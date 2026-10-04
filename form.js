/* =========================================
   GET FORM ELEMENTS
========================================= */

const form = document.getElementById("registrationForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const mobileInput = document.getElementById("mobile");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const courseInput = document.getElementById("course");
const yearInput = document.getElementById("year");
const termsInput = document.getElementById("terms");

const successMessage = document.getElementById("successMessage");


/* =========================================
   REGULAR EXPRESSIONS
========================================= */

// Name: alphabets and spaces only
const nameRegex = /^[A-Za-z ]{2,50}$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Exactly 10 digits
const mobileRegex = /^[0-9]{10}$/;

// Password:
// minimum 8 characters
// one uppercase
// one lowercase
// one digit
// one special character
const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


/* =========================================
   ERROR MESSAGE FUNCTION
========================================= */

function showError(input, errorId, message) {

    const errorElement = document.getElementById(errorId);

    input.classList.add("input-error");
    input.classList.remove("input-success");

    errorElement.textContent = message;
}


/* =========================================
   CLEAR ERROR FUNCTION
========================================= */

function clearError(input, errorId) {

    const errorElement = document.getElementById(errorId);

    input.classList.remove("input-error");

    if (input.value.trim() !== "") {
        input.classList.add("input-success");
    }

    errorElement.textContent = "";
}


/* =========================================
   NAME VALIDATION
========================================= */

function validateName() {

    const name = nameInput.value.trim();

    if (name === "") {

        showError(
            nameInput,
            "nameError",
            "Name is required."
        );

        return false;
    }

    if (!nameRegex.test(name)) {

        showError(
            nameInput,
            "nameError",
            "Name should contain only letters and spaces."
        );

        return false;
    }

    clearError(nameInput, "nameError");

    return true;
}


/* =========================================
   EMAIL VALIDATION
========================================= */

function validateEmail() {

    const email = emailInput.value.trim();

    if (email === "") {

        showError(
            emailInput,
            "emailError",
            "Email is required."
        );

        return false;
    }

    if (!emailRegex.test(email)) {

        showError(
            emailInput,
            "emailError",
            "Please enter a valid email address."
        );

        return false;
    }

    clearError(emailInput, "emailError");

    return true;
}


/* =========================================
   MOBILE VALIDATION
========================================= */

function validateMobile() {

    const mobile = mobileInput.value.trim();

    if (mobile === "") {

        showError(
            mobileInput,
            "mobileError",
            "Mobile number is required."
        );

        return false;
    }

    if (!mobileRegex.test(mobile)) {

        showError(
            mobileInput,
            "mobileError",
            "Mobile number must contain exactly 10 digits."
        );

        return false;
    }

    clearError(mobileInput, "mobileError");

    return true;
}


/* =========================================
   PASSWORD VALIDATION
========================================= */

function validatePassword() {

    const password = passwordInput.value;

    if (password === "") {

        showError(
            passwordInput,
            "passwordError",
            "Password is required."
        );

        return false;
    }

    if (password.length < 8) {

        showError(
            passwordInput,
            "passwordError",
            "Password must be at least 8 characters."
        );

        return false;
    }

    if (!passwordRegex.test(password)) {

        showError(
            passwordInput,
            "passwordError",
            "Use uppercase, lowercase, number and special character."
        );

        return false;
    }

    clearError(passwordInput, "passwordError");

    return true;
}


/* =========================================
   CONFIRM PASSWORD
========================================= */

function validateConfirmPassword() {

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword === "") {

        showError(
            confirmPasswordInput,
            "confirmPasswordError",
            "Please confirm your password."
        );

        return false;
    }

    if (password !== confirmPassword) {

        showError(
            confirmPasswordInput,
            "confirmPasswordError",
            "Passwords do not match."
        );

        return false;
    }

    clearError(
        confirmPasswordInput,
        "confirmPasswordError"
    );

    return true;
}


/* =========================================
   COURSE VALIDATION
========================================= */

function validateCourse() {

    if (courseInput.value === "") {

        showError(
            courseInput,
            "courseError",
            "Please select your course."
        );

        return false;
    }

    clearError(courseInput, "courseError");

    return true;
}


/* =========================================
   YEAR VALIDATION
========================================= */

function validateYear() {

    if (yearInput.value === "") {

        showError(
            yearInput,
            "yearError",
            "Please select your year."
        );

        return false;
    }

    clearError(yearInput, "yearError");

    return true;
}


/* =========================================
   GENDER VALIDATION
========================================= */

function validateGender() {

    const selectedGender =
        document.querySelector('input[name="gender"]:checked');

    const errorElement =
        document.getElementById("genderError");

    if (!selectedGender) {

        errorElement.textContent =
            "Please select your gender.";

        return false;
    }

    errorElement.textContent = "";

    return true;
}


/* =========================================
   TERMS VALIDATION
========================================= */

function validateTerms() {

    const errorElement =
        document.getElementById("termsError");

    if (!termsInput.checked) {

        errorElement.textContent =
            "You must accept the Terms and Conditions.";

        return false;
    }

    errorElement.textContent = "";

    return true;
}


/* =========================================
   PASSWORD STRENGTH
========================================= */

function checkPasswordStrength() {

    const password = passwordInput.value;

    const strengthBar =
        document.getElementById("strengthBar");

    const strengthText =
        document.getElementById("strengthText");


    // Empty password
    if (password.length === 0) {

        strengthBar.style.width = "0%";

        strengthBar.className = "strength-bar";

        strengthText.textContent =
            "Password strength: Not entered";

        strengthText.style.color = "";

        return;
    }


    let score = 0;


    // Length
    if (password.length >= 8) {
        score++;
    }

    // Lowercase
    if (/[a-z]/.test(password)) {
        score++;
    }

    // Uppercase
    if (/[A-Z]/.test(password)) {
        score++;
    }

    // Number
    if (/[0-9]/.test(password)) {
        score++;
    }

    // Special character
    if (/[@$!%*?&]/.test(password)) {
        score++;
    }


    /* =================================
       WEAK
    ================================= */

    if (score <= 2) {

        strengthBar.style.width = "33%";

        strengthBar.className =
            "strength-bar strength-weak";

        strengthText.textContent =
            "Password strength: Weak";

        strengthText.style.color = "#dc2626";
    }


    /* =================================
       MEDIUM
    ================================= */

    else if (score <= 4) {

        strengthBar.style.width = "66%";

        strengthBar.className =
            "strength-bar strength-medium";

        strengthText.textContent =
            "Password strength: Medium";

        strengthText.style.color = "#f59e0b";
    }


    /* =================================
       STRONG
    ================================= */

    else {

        strengthBar.style.width = "100%";

        strengthBar.className =
            "strength-bar strength-strong";

        strengthText.textContent =
            "Password strength: Strong";

        strengthText.style.color = "#16a34a";
    }
}


/* =========================================
   REAL-TIME PASSWORD STRENGTH
========================================= */

passwordInput.addEventListener(
    "input",
    checkPasswordStrength
);


/* =========================================
   REAL-TIME VALIDATION
========================================= */

nameInput.addEventListener(
    "blur",
    validateName
);

emailInput.addEventListener(
    "blur",
    validateEmail
);

mobileInput.addEventListener(
    "blur",
    validateMobile
);

passwordInput.addEventListener(
    "blur",
    validatePassword
);

confirmPasswordInput.addEventListener(
    "blur",
    validateConfirmPassword
);

courseInput.addEventListener(
    "change",
    validateCourse
);

yearInput.addEventListener(
    "change",
    validateYear
);

termsInput.addEventListener(
    "change",
    validateTerms
);


/* =========================================
   FORM SUBMIT EVENT
========================================= */

form.addEventListener("submit", function(event) {

    // Prevent actual form submission
    event.preventDefault();


    // Hide previous success message
    successMessage.style.display = "none";


    // Validate all fields
    const validName = validateName();
    const validEmail = validateEmail();
    const validMobile = validateMobile();
    const validPassword = validatePassword();
    const validConfirmPassword =
        validateConfirmPassword();

    const validCourse = validateCourse();
    const validYear = validateYear();
    const validGender = validateGender();
    const validTerms = validateTerms();


    // Check whether everything is valid
    if (
        validName &&
        validEmail &&
        validMobile &&
        validPassword &&
        validConfirmPassword &&
        validCourse &&
        validYear &&
        validGender &&
        validTerms
    ) {

        successMessage.style.display = "block";

        successMessage.textContent =
            "Registration successful! All details are valid.";

        // Scroll to success message
        successMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        console.log(
            "Student registration successfully validated."
        );
    }

    else {

        // Find first invalid field
        const firstError =
            document.querySelector(".input-error");

        if (firstError) {

            firstError.focus();

            firstError.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }

});


/* =========================================
   RESET EVENT
========================================= */

form.addEventListener("reset", function() {

    // Wait until browser resets form
    setTimeout(function() {

        // Remove all input styles
        const inputs =
            form.querySelectorAll(
                "input, select"
            );

        inputs.forEach(function(input) {

            input.classList.remove(
                "input-error",
                "input-success"
            );
        });


        // Clear all errors
        const errors =
            form.querySelectorAll(".error");

        errors.forEach(function(error) {
            error.textContent = "";
        });


        // Reset password strength
        const strengthBar =
            document.getElementById("strengthBar");

        const strengthText =
            document.getElementById("strengthText");

        strengthBar.style.width = "0%";

        strengthBar.className =
            "strength-bar";

        strengthText.textContent =
            "Password strength: Not entered";

        strengthText.style.color = "";


        // Hide success message
        successMessage.style.display = "none";

    }, 0);

});