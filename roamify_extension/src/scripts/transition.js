document.getElementById('button').addEventListener('click', function() {
  // Add the transition class
  this.classList.add('fade-out');

  // Wait for the transition to complete
  setTimeout(() => {
    // Navigate to the next HTML file
    window.location.href = 'popup.html'; // Change this to your next page
  }, 300); // Match the timeout duration with the CSS transition duration
});
