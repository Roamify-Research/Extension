chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchLinks") {
    let fetchPromises = message.links.map(linkInfo => fetch(linkInfo.link).then(response => response.text()));

    Promise.all(fetchPromises)
      .then(pagesHtml => {
        console.log('Fetched HTML content:');
        console.log(pagesHtml);
        sendResponse({ status: "success", data: pagesHtml });
      })
      .catch(error => {
        console.error('Error fetching links:', error);
        sendResponse({ status: "error", error: error });
      });

    return true; // Keep the messaging channel open for sendResponse
  }
});
