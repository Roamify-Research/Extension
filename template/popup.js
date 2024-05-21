document.addEventListener('DOMContentLoaded', () => {
    const getItineraryButton = document.getElementById('get-itinerary');
    getItineraryButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, () => {
                chrome.tabs.sendMessage(activeTab.id, { action: "getItinerary" }, (response) => {
                    document.getElementById('itinerary').innerHTML = response.itinerary;
                });
            });
        });
    });
});
