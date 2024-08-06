let dayCount = 0;

const backend = (data) => {
  const API_URL = 'http://localhost:5000/process';

  const processItinerary = async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return response.json();
  };

  return { processItinerary };
};

document.addEventListener('DOMContentLoaded', () => {
  const decreaseBtn = document.getElementById('decrease-btn');
  const increaseBtn = document.getElementById('increase-btn');
  const dayCountSpan = document.getElementById('day-count');
  const searchInput = document.querySelector('.search-input');
  const planBtn = document.querySelector('.plan-btn');


  decreaseBtn.addEventListener('click', () => {
    if (dayCount > 0) {
      dayCount--;
      dayCountSpan.textContent = dayCount;
    }
  });

  increaseBtn.addEventListener('click', () => {
    dayCount++;
    dayCountSpan.textContent = dayCount;
  });

  planBtn.addEventListener('click', async () => {
    const destination = searchInput.value.trim();
    if (destination) {
      const link = `https://traveltriangle.com/blog/places-to-visit-in-${destination.toLowerCase()}/`;
      fetchTravelTriangleData([{ dst: destination, link }]);
    } else {
      const activeTabUrl = await getActiveTabUrl();
      if (activeTabUrl) {
        const flightDetails = await extractFlightDetails(activeTabUrl);
        if (flightDetails && flightDetails.dst) {
          const link = `https://traveltriangle.com/blog/places-to-visit-in-${flightDetails.dst.toLowerCase()}/`;
          fetchTravelTriangleData([{ dst: flightDetails.dst, link }]);
        } else {
          processOpenTabs();
        }
      } else {
        processOpenTabs();
      }
    }
  });
});

async function getActiveTabUrl() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs[0].url);
      } else {
        resolve(null);
      }
    });
  });
}

function processOpenTabs() {
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
            extractFlightDetails(tab.url).then(flightDetails => {
              if (flightDetails) {
                flightInfo.push({ url: tab.url, ...flightDetails });
              }
              if (processedCount === tabs.length) {
                displayFlightInfo(flightInfo);
              }
            });
          } else {
            if (processedCount === tabs.length) {
              displayFlightInfo(flightInfo);
            }
          }
        }
      );
    });
  });
}

function getHtmlContent() {
  return document.documentElement.outerHTML;
}

async function loadAirportCodes() {
  const response = await fetch('scripts/airport_dict.json'); // Adjust the path to your JSON file
  const airportCodes = await response.json();
  return airportCodes;
}

async function extractFlightDetails(url) {
  const airportCodes = await loadAirportCodes();

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
  const preElement = document.getElementById('main-content');
  preElement.textContent = '';

  if (info.length === 0) {
    preElement.textContent = 'No flight booking websites found or no destinations detected.';
  } else {
    let linksToFetch = info.map(item => {
      return {
        dst: item.dst,
        link: `https://traveltriangle.com/blog/places-to-visit-in-${item.dst.toLowerCase()}/`,
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
  const preElement = document.getElementById('main-content');
  preElement.textContent = '';

  const message = document.createElement('div');
  message.className = 'loading-message';
  message.textContent = 'Crafting Your Perfect Itinerary...';

  const loadingBar = document.createElement('div');
  loadingBar.className = 'loading-bar';

  preElement.appendChild(loadingBar);
  preElement.appendChild(message);

  let content = '';
  let isFirstParagraph = true;

  contents.forEach(item => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(item.html, 'text/html');

    doc.querySelectorAll('script, [onclick], [onmouseover], [onmouseout], [onkeydown], [onkeyup], [onkeypress], [onload], [onunload], [onresize], [onscroll], [onblur], [onfocus], [onerror]').forEach(el => el.remove());
    doc.querySelectorAll('style').forEach(el => el.remove());

    let title = doc.querySelector('title')?.innerText.trim() || 'No title';
    let description = doc.querySelector('meta[name="description"]')?.getAttribute('content').trim() || 'No description';
    let mainContent = extractMainContent(doc).trim();
    let attractions = extractAttractions(doc).trim();

    let displayContent = `URL: ${item.url}\nTitle: ${title}\nDescription: ${description}\nMain Content: ${mainContent}\nAttractions: ${attractions}`;

    displayContent = displayContent.replace(/\n{2,}/g, '\n\n');
    displayContent = displayContent.replace(/^\s+|\s+$/g, '');
    displayContent = displayContent.replace(/\n\s+\n/g, '\n\n');

    if (!isFirstParagraph) {
      content += '\n';
    } else {
      isFirstParagraph = false;
    }

    content += displayContent;
  });

  const data = {
    text: content,
    day: dayCount
  };
  const { processItinerary } = backend(data);

  processItinerary()
    .then(response => {
      preElement.removeChild(loadingBar);
      displayCards(response);
    })
    .catch(error => {
      console.error('Error processing the itinerary:', error);
      preElement.textContent = 'Error processing the itinerary';
    });
}

function extractMainContent(doc) {
  let mainElement = doc.querySelector('main') || doc.body;
  return mainElement ? mainElement.innerText.trim() : 'No main content';
}

function extractAttractions(doc) {
  let attractionsList = '';
  let attractionsSection = doc.querySelector('h2 ~ ul');

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

function displayCards(response) {
  const preElement = document.getElementById('main-content');
  preElement.textContent = '';

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards-container';

  for (const [key, value] of Object.entries(response)) {

    let body = '';
    for (const [subkey] of Object.entries(value)) {
      body += value[subkey] + '\n';
    }

    const card = document.createElement('div');
    card.className = 'card';

    const cardHeader = document.createElement('h2');
    cardHeader.textContent = key;
    card.appendChild(cardHeader);

    const cardBody = document.createElement('p');
    cardBody.textContent = body;
    card.appendChild(cardBody);

    cardsContainer.appendChild(card);
  }

  preElement.appendChild(cardsContainer);
}
