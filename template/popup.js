document.getElementById('get-html').addEventListener('click', () => {
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
    'PNQ': 'Pune',
    'MYQ': 'Mysore',
    'CCJ' : 'Kozhikode',
    'TIR' : 'Tirupati',
    'DED': 'Dehradun',
    'AGR': 'Agra',
  };

  let matches = url.match(/[A-Z]{3}/g);
  if (matches && matches.length >= 2) {
    let [srcCode, dstCode] = matches;
    let src = airportCodes[srcCode];
    let dst = airportCodes[dstCode];
    if (src && dst) {
      return { src, dst };
    }
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
        dst: item.dst,
        link: `https://traveltriangle.com/blog/places-to-visit-in-${item.dst.toLowerCase()}/`
      };
    });

    fetchTravelTriangleData(linksToFetch);
  }
}

function fetchTravelTriangleData(linksToFetch) {
  let htmlContents = [];
  let processedLinks = 0;

  linksToFetch.forEach(linkInfo => {
    fetch(linkInfo.link)
      .then(response => response.text())
      .then(html => {
        htmlContents.push({ url: linkInfo.link, html });
        processedLinks++;
        if (processedLinks === linksToFetch.length) {
          handleHtmlContents(htmlContents);
        }
      })
      .catch(error => {
        console.error('Error fetching the URL:', error);
        processedLinks++;
        if (processedLinks === linksToFetch.length) {
          handleHtmlContents(htmlContents);
        }
      });
  });
}

function handleHtmlContents(contents) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  let isFirstParagraph = true; // Flag to track if it's the first paragraph

  contents.forEach(item => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(item.html, 'text/html');

    // Remove script tags and elements with inline event handlers
    doc.querySelectorAll('script, [onclick], [onmouseover], [onmouseout], [onkeydown], [onkeyup], [onkeypress], [onload], [onunload], [onresize], [onscroll], [onblur], [onfocus], [onerror]').forEach(el => el.remove());

    // Remove style elements
    doc.querySelectorAll('style').forEach(el => el.remove());

    let title = doc.querySelector('title')?.innerText.trim() || 'No title';
    let description = doc.querySelector('meta[name="description"]')?.getAttribute('content').trim() || 'No description';
    let mainContent = extractMainContent(doc).trim();
    let attractions = extractAttractions(doc).trim();

    // Construct displayContent without extra empty lines
    let displayContent = `URL: ${item.url}\nTitle: ${title}\nDescription: ${description}\nMain Content: ${mainContent}\nAttractions: ${attractions}`;

    // Clean up the display content
    displayContent = displayContent.replace(/\n{2,}/g, '\n\n'); // Replace multiple empty lines with a single one
    displayContent = displayContent.replace(/^\s+|\s+$/g, ''); // Remove leading and trailing whitespace
    displayContent = displayContent.replace(/\n\s+\n/g, '\n\n'); // Remove empty lines with spaces

    // If it's not the first paragraph, add one empty line before displaying the content
    if (!isFirstParagraph) {
      preElement.textContent += '\n';
    } else {
      isFirstParagraph = false;
    }

    // Append displayContent to preElement.textContent
    preElement.textContent += displayContent;
  });
}


function extractMainContent(doc) {
  // Extracting the main content by selecting specific elements
  let mainElement = doc.querySelector('main') || doc.body;
  return mainElement ? mainElement.innerText.trim() : 'No main content';
}

function extractAttractions(doc) {
  let attractionsList = '';
  let attractionsSection = doc.querySelector('h2 ~ ul'); // Selecting the ul directly after an h2 which often lists attractions

  if (attractionsSection) {
    let attractions = attractionsSection.querySelectorAll('li');
    if (attractions.length > 0) {
      attractions.forEach(attraction => {
        attractionsList += `
          Attraction: ${attraction.innerText.trim()}
        `;
      });
    }
  } else {
    attractionsList = 'No attractions found';
  }

  return attractionsList;
}