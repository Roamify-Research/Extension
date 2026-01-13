window.onload = () => {
  const mainContainer = document.getElementById("mainContainer");
  const loginContainer = document.getElementById("loginContainer");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");
  const body = document.body;

  // Check for existing token
  chrome.storage.local.get(["authToken"], (result) => {
    if (result.authToken) {
      // If token exists, skip splash/login and go straight to app
      window.location.href = "itinerary.html";
    }
  });

  setTimeout(() => {
    body.style.backgroundColor = "#251F48";
    mainContainer.style.display = "flex";
    mainContainer.classList.add("slide-in");

    document.addEventListener(
      "click",
      () => {
        mainContainer.classList.add("move-up");
        loginContainer.classList.add("slide-up");
      },
      { once: true }
    );
  }, 3000);

  // Switch to sign-up form
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  });

  // Switch to login form
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  });

  // Submit handlers are now in rules/auth.js
};
