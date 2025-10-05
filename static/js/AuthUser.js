document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("authForm");
    const registerBtn = document.querySelector(".register-btn");
    const messageBox = document.getElementById("message");

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = type; // либо "success", либо "error"
        messageBox.style.display = "block";
    }

    // вход
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("user_id", data.id);
            window.location.href = "/allstend"; // только при успехе
        } else {
            showMessage(data.error, "error"); // выводим ошибку
        }
    });

    // регистрация
    registerBtn.addEventListener("click", async () => {
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            showMessage("Регистрация успешна! Теперь войдите.", "success");
        } else {
            showMessage(data.error, "error");
        }
    });
});
