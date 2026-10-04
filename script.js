function toggleMenu() {
    let menu = document.getElementById("navMenu");
    let hamburger = document.querySelector(".hamburger");

    if (menu && hamburger) {
        menu.classList.toggle("show");

        let isOpen = menu.classList.contains("show");

        hamburger.setAttribute("aria-expanded", isOpen);

        if (isOpen) {
            hamburger.setAttribute("aria-label", "Close navigation menu");
            hamburger.innerText = "✕";
        } else {
            hamburger.setAttribute("aria-label", "Open navigation menu");
            hamburger.innerText = "☰";
        }
    }
}
function closeNotification() {
    let notification =
        document.getElementById("notification");
    if (notification) {
        notification.style.display = "none";
    }
}
function openModal() {
    let modal =
        document.getElementById("modal");
    if (modal) {
        modal.style.display = "flex";
    }
}
function closeModal() {
    let modal =
        document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";
    }
}
let questions =
    document.querySelectorAll(".faq-question");
questions.forEach(function(question) {
    question.addEventListener("click", function() {
        let answer =
            this.nextElementSibling;
        if (answer) {
            answer.classList.toggle("show");
            let symbol =
                this.querySelector("span");
            if (symbol) {
                if (answer.classList.contains("show")) {
                    symbol.innerText = "−";
                } else {
                    symbol.innerText = "+";
                }
            }
        }
    });
});
let slides =
    document.querySelectorAll(".slide");
let currentSlide = 0;
function showSlide(index) {
    if (slides.length === 0) {
        return;
    }
    slides.forEach(function(slide) {
        slide.classList.remove("active");
    });
    slides[index].classList.add("active");
}
function changeSlide(direction) {
    if (slides.length === 0) {
        return;
    }
    currentSlide =
        currentSlide + direction;
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }
    if (currentSlide < 0) {

        currentSlide = slides.length - 1;
    }
    showSlide(currentSlide);
}
if (slides.length > 0) {

    setInterval(function() {

        changeSlide(1);

    }, 4000);

}
function toggleTheme() {
    document.body.classList.toggle("dark");
    let darkMode =
        document.body.classList.contains("dark");
    let themeButton =
        document.getElementById("themeBtn");
    if (darkMode) {
        localStorage.setItem("theme", "dark");
        if (themeButton) {
            themeButton.innerText = "Light Mode";
        }
    } else {
        localStorage.setItem("theme", "light");
        if (themeButton) {
            themeButton.innerText = "Dark Mode";
        }
    }
}
let savedTheme =
    localStorage.getItem("theme");
let themeButton =
    document.getElementById("themeBtn");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
    if (themeButton) {
        themeButton.innerText = "Light Mode";
    }
} else {

    if (themeButton) {
        themeButton.innerText = "Dark Mode";
    }
}
window.addEventListener("click", function(event) {
    let modal =
        document.getElementById("modal");
    if (modal && event.target === modal) {
        closeModal();
    }
});
let navLinks = document.querySelectorAll("#navMenu a");

navLinks.forEach(function(link) {
    link.addEventListener("click", function() {

        let menu = document.getElementById("navMenu");
        let hamburger = document.querySelector(".hamburger");

        if (menu && hamburger) {
            menu.classList.remove("show");

            hamburger.setAttribute("aria-expanded", "false");
            hamburger.setAttribute("aria-label", "Open navigation menu");
            hamburger.innerText = "☰";
        }

    });
});