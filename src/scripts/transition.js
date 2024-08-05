document.getElementById('button').addEventListener('click', function() {
  // Add the transition class to slide out the current page
  document.body.classList.add('slide-out');

  // Wait for the transition to complete
  setTimeout(() => {
    // Navigate to the next HTML file
    window.location.href = 'itinerary.html'; // Change this to your next page
  }, 500); // Match the timeout duration with the CSS transition duration
});
