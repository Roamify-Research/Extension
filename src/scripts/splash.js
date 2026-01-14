window.onload = () => {
  const splashContainer = document.querySelector(".splash-container");
  const mainContainer = document.getElementById("mainContainer");
  const authContainer = document.getElementById("authContainer");
  const body = document.body;

  // Check for saved dark mode preference
  chrome.storage.local.get(["darkMode"], (result) => {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });

  // Check for existing token
  chrome.storage.local.get(["authToken"], (result) => {
    if (result.authToken) {
      // If token exists, skip splash/login and go straight to app
      window.location.href = "itinerary.html";
      return;
    }
  });

  // Hide splash immediately and show ROAMIFY text
  splashContainer.style.display = "none";
  body.style.backgroundColor = "#f1f5f9";
  mainContainer.style.display = "flex";
  mainContainer.classList.add("slide-in");

  // Wait for user click to show auth form
  document.addEventListener(
    "click",
    () => {
      mainContainer.classList.add("move-up");
      authContainer.classList.add("slide-up");
    },
    { once: true }
  );

  // Form switching is now handled by tabs in auth.js
};
