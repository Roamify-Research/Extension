chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchTravelData") {
    console.log("Background script: Fetching URL:", message.url);
    
    fetch(message.url)
      .then(response => {
        console.log("Background script: Got response, status:", response.status);
        return response.text();
      })
      .then(html => {
        console.log("Background script: Got HTML, length:", html.length);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.error("Background script: Error fetching:", err);
        sendResponse({ success: false, error: err.toString() });
      });
    
    return true; // keeps the message channel open for async response
  }
});
