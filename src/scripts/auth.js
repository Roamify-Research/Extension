const API_BASE_URL = "https://roamify.fakepickle.tech";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginContainer = document.getElementById("loginContainer");
    const mainContainer = document.getElementById("mainContainer");

    // Helper to show errors
    function showError(message) {
        alert(message); // Simple alert for now, can be improved
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = loginForm.querySelectorAll("input");
            const username = inputs[0].value;
            const password = inputs[1].value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Save token
                    const name = data.name || data.username;
                    chrome.storage.local.set({ authToken: data.token, username: data.username, name: name }, () => {
                        console.log("Login successful");
                        // Proceed to app
                        window.location.href = "itinerary.html";
                    });
                } else {
                    showError(data.error || "Login failed");
                }
            } catch (err) {
                console.error("Login error:", err);
                showError("Failed to connect to server");
            }
        });
    }

    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = signupForm.querySelectorAll("input");
            const name = inputs[0].value;
            const username = inputs[1].value;
            const email = inputs[2].value;
            const password = inputs[3].value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Account created! Please login.");
                    // Switch to login view (logic exists in splash.js, but we can trigger click)
                    document.getElementById("loginLink").click();
                } else {
                    showError(data.error || "Signup failed");
                }
            } catch (err) {
                console.error("Signup error:", err);
                showError("Failed to connect to server");
            }
        });
    }
});
