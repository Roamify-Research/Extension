chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchLinks") {
    let fetchPromises = message.links.map(link => fetch(link).then(response => response.text()));
    
    Promise.all(fetchPromises)
      .then(pagesHtml => {
        sendResponse({ status: "success", data: pagesHtml });
      })
      .catch(error => {
        console.error('Error fetching links:', error);
        sendResponse({ status: "error", error: error });
      });
      
    return true;
  }
});
