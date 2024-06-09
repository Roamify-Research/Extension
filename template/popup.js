document.getElementById('get-html').addEventListener('click', () => {
  chrome.tabs.query({}, (tabs) => {
    let htmlContents = [];
    let tabCount = tabs.length;
    
    tabs.forEach((tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getValuableContent
        },
        (results) => {
          if (results && results[0]) {
            htmlContents.push({ url: tab.url, content: results[0].result });
            if (htmlContents.length === tabCount) {
              handleHtmlContents(htmlContents);
            }
          } else {
            console.error(`Failed to get valuable content for tab ${tab.url}`);
          }
        }
      );
    });
  });
});

function getValuableContent() {
  let title = document.title;
  let description = document.querySelector('meta[name="description"]')?.content || 'No description';
  let mainContent = '';

  let mainElement = document.querySelector('main') || document.body;
  if (mainElement) {
    mainContent = mainElement.innerText || mainElement.textContent || 'No main content';
  }

  return { title, description, mainContent };
}

function handleHtmlContents(contents) {
  let itineraryItems = contents.map(item => {
    if (item.url.includes('flight') || item.url.includes('railway') || item.url.includes('train')) {
      return extractBookingInfo(item.url, item.content);
    } else {
      return extractGeneralInfo(item.url, item.content);
    }
  });
  displayItinerary(itineraryItems);
}

function extractGeneralInfo(url, content) {
  return { url, title: content.title, description: content.description, mainContent: content.mainContent };
}

function extractBookingInfo(url, content) {
  const bookingInfo = { url, title: content.title, description: content.description, mainContent: content.mainContent, bookingDetails: [] };

  // Example patterns for extracting booking details
  const flightPatterns = [
    /(?:Flight|Airline|Carrier):\s*(.*)/gi,
    /(?:Departure|Arriving):\s*(.*)/gi,
    /(?:Flight Number|Flight No):\s*(.*)/gi,
    /(?:Departure Time|Arrival Time|Time):\s*(.*)/gi
  ];

  const trainPatterns = [
    /(?:Train|Railway|Service):\s*(.*)/gi,
    /(?:Departure|Arriving):\s*(.*)/gi,
    /(?:Train Number|Train No):\s*(.*)/gi,
    /(?:Departure Time|Arrival Time|Time):\s*(.*)/gi
  ];

  let mainContent = content.mainContent;

  const patterns = url.includes('flight') ? flightPatterns : trainPatterns;
  
  patterns.forEach(pattern => {
    let matches = mainContent.matchAll(pattern);
    for (let match of matches) {
      bookingInfo.bookingDetails.push(match[0].trim());
    }
  });

  return bookingInfo;
}

function displayItinerary(itineraryItems) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  itineraryItems.forEach((item, index) => {
    preElement.textContent += `Tab ${index + 1} URL: ${item.url}\nTitle: ${item.title}\nDescription: ${item.description}\n`;
    if (item.bookingDetails && item.bookingDetails.length) {
      preElement.textContent += `Booking Details:\n${item.bookingDetails.join('\n')}\n`;
    } else {
      preElement.textContent += `Main Content:\n${item.mainContent}\n`;
    }
    preElement.textContent += `\n----------------\n\n`;
  });
}
