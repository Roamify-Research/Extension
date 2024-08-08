window.onload = () => {
  const mainContainer = document.getElementById("mainContainer");
  const loginContainer = document.getElementById("loginContainer");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const signupLink = document.getElementById("signupLink");
  const loginLink = document.getElementById("loginLink");
  const body = document.body;

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

  // Handle login form submission
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    redirectToNewPage();
  });

  // Handle sign-up form submission
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    redirectToNewPage();
  });

  function redirectToNewPage() {
    window.location.href = "itinerary.html";
  }
};
