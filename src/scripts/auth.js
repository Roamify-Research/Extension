const API_BASE_URL = "https://roamify.fakepickle.tech";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    // Tab Switching
    if (loginTab && signupTab) {
        loginTab.addEventListener("click", () => {
            loginTab.classList.add("active");
            signupTab.classList.remove("active");
            loginForm.classList.add("active");
            signupForm.classList.remove("active");
        });

        signupTab.addEventListener("click", () => {
            signupTab.classList.add("active");
            loginTab.classList.remove("active");
            signupForm.classList.add("active");
            loginForm.classList.remove("active");
        });
    }

    // Password Toggle Functionality
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);

            if (input) {
                if (input.type === "password") {
                    input.type = "text";
                } else {
                    input.type = "password";
                }
            }
        });
    });

    // Helper to show errors
    function showError(message) {
        alert(message); // Simple alert for now, can be improved
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;

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
            const name = document.getElementById("signupName").value;
            const email = document.getElementById("signupEmail").value;
            const username = document.getElementById("signupUsername").value;
            const password = document.getElementById("signupPassword").value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Account created! Please login.");
                    // Switch to login tab
                    loginTab.click();
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
