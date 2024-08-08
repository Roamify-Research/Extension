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

let days = 0;
let history_value = 0;
let amusement_value = 0;
let natural_value = 0;

document.addEventListener('DOMContentLoaded', function () {
  const accountButton = document.getElementById('accountButton');
  const accountDropdown = document.getElementById('accountDropdown');
  const destinationInput = document.getElementById('destinationInput');
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  const predefinedOptionsContainer = document.querySelector('.predefined-options-container');
  const dayContainer = document.querySelector('.day-container');
  const additionalDataContainer = document.querySelector('.details-container')
  const generateButton = document.querySelector('.generate-itinerary-button');

  // Sample predefined options
  const predefinedOptions = [
    'Vietnam', 'Delhi', 'New York', 'Tokyo', 'Sydney'
  ];

  // Sample range values for days
  const minDays = 1;
  const maxDays = 50;

  let destinations = [
    'Paris', 'London', 'New York', 'Tokyo', 'Sydney', 'Rome',
    'Berlin', 'Amsterdam', 'Barcelona', 'Lisbon'
  ];

  // Toggle account dropdown
  accountButton.addEventListener('click', function () {
    accountDropdown.classList.toggle('active');
  });

  // Hide account dropdown when clicking outside
  document.addEventListener('click', function (event) {
    if (!accountDropdown.contains(event.target) && !accountButton.contains(event.target)) {
      accountDropdown.classList.remove('active');
    }
  });

  async function loadAirportCodes() {
    const response = await fetch('scripts/airport_dict.json'); // Adjust the path to your JSON file
    const airportCodes = await response.json();
    return airportCodes;
  }

  async function populateDestinations() {
    const airportCodes = await loadAirportCodes();
    const airportDestinations = Object.values(airportCodes);
    destinations = [...new Set([...destinations, ...airportDestinations])]; // Merge and remove duplicates
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

  // Call populateDestinations to load the destinations from the airport codes
  populateDestinations();

  // Handle auto-complete
  destinationInput.addEventListener('input', function () {
    const inputValue = this.value.toLowerCase();
    suggestionsContainer.innerHTML = '';
    if (inputValue) {
      const filteredDestinations = destinations.filter(destination =>
        destination.toLowerCase().includes(inputValue)
      );
      filteredDestinations.forEach(destination => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = destination;
        div.addEventListener('click', function () {
          destinationInput.value = this.textContent;
          suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.style.display = filteredDestinations.length > 0 ? 'block' : 'none';
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', function (event) {
    if (!destinationInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Create predefined options dynamically
  predefinedOptions.forEach(option => {
    const div = document.createElement('div');
    div.className = 'predefined-option';
    div.textContent = option;
    div.dataset.value = option;
    div.addEventListener('click', function () {
      destinationInput.value = this.dataset.value;
    });
    predefinedOptionsContainer.appendChild(div);
  });


  // Create a slider for selecting the number of days
  const day_slider = document.createElement('input');
  day_slider.type = 'range';
  day_slider.min = minDays;
  day_slider.max = maxDays;
  day_slider.value = minDays;
  day_slider.step = 1;
  day_slider.className = 'day-slider';

  // Create a label to display the selected number of days
  const dayLabel = document.createElement('span');
  dayLabel.className = 'day-label';
  dayLabel.textContent = `${minDays} Days`;

  // Append the slider and label to the day container
  dayContainer.appendChild(day_slider);
  dayContainer.appendChild(dayLabel);

  // Update label when slider value changes
  day_slider.addEventListener('input', function () {
    dayLabel.textContent = `${this.value} Days`;
  });
  //additionalDataContainer
  const sliders = {};
  const createSlider = (min, max, initialValue, label, id) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';

    const topLabelContainer = document.createElement('div');
    topLabelContainer.className = 'top-label-container';

    const topLabel = document.createElement('span');
    topLabel.className = 'top-label';
    topLabel.textContent = label;

    const valueLabel = document.createElement('span');
    valueLabel.className = 'value-label';
    valueLabel.textContent = initialValue;

    topLabelContainer.appendChild(topLabel);
    topLabelContainer.appendChild(valueLabel);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = initialValue;
    slider.step = 1;
    slider.className = 'additional-slider';
    slider.id = id; // Assign unique ID

    slider.addEventListener('input', function () {
      valueLabel.textContent = this.value;
    });

    wrapper.appendChild(topLabelContainer);
    wrapper.appendChild(slider);

    sliders[id] = slider; // Store slider in the global object

    return wrapper;
  };

  //historical
  const sliderElements = [
    createSlider(0, 5, 3, 'Historical', 'history'),
    createSlider(0, 5, 3, 'Amusement', 'amusement'),
    createSlider(0, 5, 3, 'Natural', 'natural')
  ]
  sliderElements.forEach(slider => additionalDataContainer.appendChild(slider));

  // Handle button click to store values and redirect
  generateButton.addEventListener('click', async function () {
    history_value = sliders['history'].value;
    amusement_value = sliders['amusement'].value;
    natural_value = sliders['natural'].value;
    const destination = destinationInput.value;
    days = day_slider.value;


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

// Process open tabs
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
        console.log('Error fetching the URL:', error);
        processedLinks++;
        if (processedLinks === linksToFetch.length) {
          handleHtmlContents(htmlContents);
        }
      });
  });
}


function handleHtmlContents(contents) {
  // Create loading overlay elements
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';

  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';

  const loadingGif = document.createElement('img');
  console.log('Current Path:', window.location.pathname);
  loadingGif.src = 'assets/loading.gif';
  loadingGif.alt = 'Loading...';
  loadingGif.className = 'loading-gif';

  // Append loading elements to the overlay
  loadingOverlay.appendChild(loadingGif);

  // Append loading overlay to the body
  document.body.appendChild(loadingOverlay);
  document.body.style.pointerEvents = 'none';

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
    day: days,
    historical: history_value,
    amusement: amusement_value,
    natural: natural_value
  };
  console.log(days);
  const { processItinerary } = backend(data);
  processItinerary()
    .then(response => {
      document.body.removeChild(loadingOverlay);
      document.body.style.pointerEvents = 'auto'; // Make everything clickable again
      console.log(response);

      displayCards(response);
    })
    .catch(error => {
      document.body.removeChild(loadingOverlay);
      document.body.style.pointerEvents = 'auto'; // Make everything clickable again
      // displayCards({
      //     'Day 1: India Gate, Lotus Temple': [
      //       'Morning: Start your day at India Gate (9:00 am - 10:30 am), which is located in the heart of New Delhi. Take some time to admire the monument and the eternal flame that burns nearby.',
      //       "Afternoon: Head over to the Lotus Temple (11:00 am - 1:00 pm), a beautiful Bahá'í House of Worship. This temple is known for its stunning architecture and serene surroundings.",
      //       'Evening: Take some time to relax at your hotel or explore the local market near the temple.'
      //     ],
      //     'Day 2: Akshardham Temple, Hauz Khas': [
      //       'Morning: Visit the Akshardham Temple (9:00 am - 11:30 am), a magnificent Hindu temple that is dedicated to Lord Swaminarayan. Be sure to catch the evening light and sound show, which is absolutely breathtaking.',
      //       'Afternoon: Head over to Hauz Khas (2:00 pm - 4:30 pm), a historic village that is known for its beautiful Mughal-era architecture and tranquil surroundings. Take some time to explore the complex and visit the mosque and reservoir.'
      //     ],
      //     'Day 3: Chandni Chowk, Lodhi Gardens': [
      //       'Morning: Start your day at Chandni Chowk (9:00 am - 11:30 am), a bustling market that is known for its street food, local shops, and historic significance.',
      //       'Afternoon: Visit the Lodhi Gardens (2:00 pm - 4:30 pm), a beautiful Mughal-era garden that is known for its intricate architecture and peaceful surroundings. Take some time to relax and enjoy the serene atmosphere.'
      //     ],
      //     "Day 4: Humayun's Tomb, Jama Masjid": [
      //       "Morning: Visit Humayun's Tomb (9:00 am - 11:30 am), a beautiful Mughal-era mausoleum that is known for its stunning architecture.",
      //       'Afternoon: Head over to the Jama Masjid (2:00 pm - 4:30 pm), the largest mosque in India, which is known for its peaceful and tranquil surroundings. Take some time to admire the intricate architecture of this historic monument.'
      //     ],
      //     'Day 5: Leisure day': [
      //       'Take some time to relax at your hotel or explore the local market.',
      //       'If you have any last-minute sightseeing plans, now is a good time to fit them in.',
      //       '',
      //       'This itinerary should give you a good balance of history, culture, and relaxation. Enjoy your trip!'
      //     ]
      //   }
      // );
      console.error('Error processing the itinerary:', error);
      const preElement = document.getElementById('main-content');
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

let storedResponse = null;

function displayCards(response) {
  storedResponse = response; // Store the response data
  document.getElementById('main-content').style.display = 'block';
  const preElement = document.getElementById('main-content');
  preElement.textContent = '';

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards-container';

  for (const [day, activities] of Object.entries(response)) {
    const card = document.createElement('div');
    card.className = 'card';

    // Create and append card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = day;
    card.appendChild(cardHeader);

    // Create and append card body
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    activities.forEach((activity, index) => {
      if (activity.trim() !== '') { // Check if activity is not an empty string
        const activityElement = document.createElement('div');
        activityElement.className = 'card-activity';

        // Add activity description
        const description = document.createElement('p');
        description.className = 'card-item';
        description.textContent = activity;
        activityElement.appendChild(description);

        // Optionally add a divider between activities, unless it's a "Leisure day"
        if (day !== 'Leisure day' && index < activities.length - 1) {
          // Check if the next activity is not an empty string before adding a divider
          if (activities[index + 1].trim() !== '') {
            const divider = document.createElement('hr');
            divider.className = 'activity-divider';
            activityElement.appendChild(divider);
          }
        }

        cardBody.appendChild(activityElement);
      }
    });

    card.appendChild(cardBody);
    cardsContainer.appendChild(card);
  }

  preElement.appendChild(cardsContainer);

  // Show the download button after cards are displayed
  document.getElementById('downloadButton').style.display = 'block';
}



function formatResponseAsText(response) {
  let formattedText = '';
  for (const [day, activities] of Object.entries(response)) {
    formattedText += `${day}\n`;
    activities.forEach(activity => {
      formattedText += `  - ${activity}\n`;
    });
    formattedText += '\n';
  }
  return formattedText;
}

// Function to handle data download
function downloadData(response) {
  const formattedText = formatResponseAsText(response);
  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(formattedText);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "itinerary.txt");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Event listener for the download button
document.getElementById('downloadButton').addEventListener('click', () => {
  if (storedResponse) {
    downloadData(storedResponse); // Use the stored response data
  } else {
    alert('No data available to download.');
  }
});
