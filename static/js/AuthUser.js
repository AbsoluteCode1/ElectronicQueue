document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("authForm");
    const registerBtn = document.querySelector(".register-btn");

    // вход
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // <--- вот это критично

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const res = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("user_id", data.id);
            window.location.href = "/profile";
        } else {
            alert(data.error);
        }
    });

    // регистрация
    registerBtn.addEventListener("click", async () => {
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const res = await fetch("/api/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("user_id", data.id);
            window.location.href = "/profile";
        } else {
            alert(data.error);
        }
    });
});
