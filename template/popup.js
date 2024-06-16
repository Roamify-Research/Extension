document.getElementById('get-html').addEventListener('click', () => {
  // Query all open tabs
  chrome.tabs.query({}, (tabs) => {
    let flightInfo = [];
    let processedCount = 0;

    tabs.forEach((tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getHtmlContent
        },
        (results) => {
          processedCount++;
          if (results && results[0]) {
            // Extract source and destination from the URL
            let flightDetails = extractFlightDetails(tab.url);
            if (flightDetails) {
              flightInfo.push({ url: tab.url, ...flightDetails });
            }
          }
          if (processedCount === tabs.length) {
            displayFlightInfo(flightInfo);
          }
        }
      );
    });
  });
});

function getHtmlContent() {
  return document.documentElement.outerHTML;
}

function extractFlightDetails(url) {
  // Mapping of airport codes to city names
  const airportCodes = {
    'BOM': 'Mumbai',
    'BLR': 'Bangalore',
    'DEL': 'Delhi',
    'HYD': 'Hyderabad',
    'MAA': 'Chennai',
    'CCU': 'Kolkata',
    'GOI': 'Goa',
    'JAI': 'Jaipur',
    'AMD': 'Ahmedabad',
    'PNQ': 'Pune'
    // Add more mappings as needed
  };

  let src = null, dst = null;

  // Find all consecutive three-letter codes in the URL
  let matches = url.match(/[A-Z]{3}/g);

  if (matches && matches.length >= 2) {
    let code1 = matches[0];
    let code2 = matches[1];

    // Check if codes exist in airportCodes and assign src and dst accordingly
    if (airportCodes.hasOwnProperty(code1) && airportCodes.hasOwnProperty(code2)) {
      src = airportCodes[code1];
      dst = airportCodes[code2];
    }
  }

  if (src && dst) {
    return { src: src, dst: dst };
  }

  return null;
}

function displayFlightInfo(info) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  if (info.length === 0) {
    preElement.textContent = 'No flight booking websites found or no destinations detected.';
  } else {
    let linksToFetch = info.map(item => {
      return {
        url: item.url,
        dst: item.dst,
        link: `https://traveltriangle.com/blog/places-to-visit-in-${item.dst}/`
      };
    });

    // Send message to background.js to fetch HTML content
    chrome.runtime.sendMessage({ action: 'fetchLinks', links: linksToFetch }, response => {
      if (response.status === 'success') {
        console.log('HTML content fetched from links:');
        console.log(response.data);
        // Display fetched HTML content in popup.html
        displayHtmlContent(response.data, info);
      } else {
        console.error('Error fetching HTML content:', response.error);
        preElement.textContent = 'Error fetching HTML content. See console for details.';
      }
    });
  }
}

function displayHtmlContent(htmlData, info) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  htmlData.forEach((html, index) => {
    preElement.textContent += `Flight Booking Site ${index + 1} URL: ${info[index].url}\n`;
    preElement.textContent += `Source: ${info[index].src}\n`;
    preElement.textContent += `Destination: ${info[index].dst}\n`;
    preElement.textContent += `Link: https://traveltriangle.com/blog/places-to-visit-in-${info[index].dst}/\n`;
    preElement.textContent += `HTML Content:\n${html}\n\n`;
  });
}
