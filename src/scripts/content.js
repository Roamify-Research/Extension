chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getItinerary") {
    const searchQuery =
      "Visit the Eiffel Tower, then the Louvre, and finally the Notre Dame Cathedral.";
    console.log(searchQuery);
    fetch("http://localhost:5000/itinerary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: searchQuery }),
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ itinerary: data.itinerary });
      })
      .catch((error) => {
        sendResponse({ itinerary: `Error: ${error.message}` });
      });

    return true; // Keeps the message channel open for sendResponse
  }
});
