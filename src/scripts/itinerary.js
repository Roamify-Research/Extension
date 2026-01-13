const backend = (data) => {
  const API_URL = "https://roamify.fakepickle.tech/process";

  const processItinerary = async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return response.json();
  };

  return { processItinerary };
};

let days = 0;
let history_value = 0;
let amusement_value = 0;
let natural_value = 0;

document.addEventListener("DOMContentLoaded", function () {
  // --- AUTH & LOGOUT LOGIC ---
  chrome.storage.local.get(["authToken", "username", "name"], (result) => {
    if (!result.authToken) {
      window.location.href = "panel.html";
      return;
    }

    const greetingText = document.querySelector(".greeting-text");
    if (greetingText) {
      const displayName = result.name || result.username || "Traveler";
      const display = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      greetingText.textContent = `Welcome back, ${display}`;
    }
  });

  // Logout Handler (Delegated since structure might vary)
  // We attach to the container '.options' or directly to document
  document.addEventListener("click", (e) => {
    // Traverse up to find if a link was clicked
    let target = e.target;
    if (target.tagName === 'IMG') target = target.parentElement;

    if (target.tagName === 'A' && target.textContent.includes('Logout')) {
      e.preventDefault();
      chrome.storage.local.remove(["authToken", "username", "name"], () => {
        window.location.href = "panel.html";
      });
    }
  });
  // --- END AUTH LOGIC ---

  const accountButton = document.getElementById("accountButton");
  const accountDropdown = document.getElementById("accountDropdown");
  const destinationInput = document.getElementById("destinationInput");
  const suggestionsContainer = document.getElementById("suggestionsContainer");
  const predefinedOptionsContainer = document.querySelector(
    ".predefined-options-container"
  );
  const dayContainer = document.querySelector(".day-container");
  const additionalDataContainer = document.querySelector(".details-container");
  const generateButton = document.querySelector(".generate-itinerary-button");

  // Sample predefined options
  const predefinedOptions = ["Vietnam", "Delhi", "New York", "Tokyo", "Sydney"];

  // Sample range values for days
  const minDays = 1;
  const maxDays = 50;

  let destinations = [
    "Paris",
    "London",
    "New York",
    "Tokyo",
    "Sydney",
    "Rome",
    "Berlin",
    "Amsterdam",
    "Barcelona",
    "Lisbon",
  ];

  // Toggle account dropdown
  accountButton.addEventListener("click", function () {
    accountDropdown.classList.toggle("active");
  });

  // Hide account dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !accountDropdown.contains(event.target) &&
      !accountButton.contains(event.target)
    ) {
      accountDropdown.classList.remove("active");
    }
  });

  async function loadAirportCodes() {
    const response = await fetch("scripts/airport_dict.json"); // Adjust the path to your JSON file
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

  // Auto-detect destination from active tab URL
  async function autoDetectDestination() {
    try {
      const tab = await getActiveTab();
      if (tab && tab.url) {
        console.log("Auto-detecting from URL:", tab.url);
        const details = await extractFlightDetails(tab.url);
        if (details && details.dst) {
          console.log("Detected destination:", details.dst);
          destinationInput.value = details.dst;
          // Trigger input event to update any related UI (like suggestions closure)
          destinationInput.dispatchEvent(new Event('input'));
        }
      }
    } catch (err) {
      console.error("Auto-detection failed:", err);
    }
  }

  // Run auto-detection
  autoDetectDestination();

  // Handle auto-complete
  destinationInput.addEventListener("input", function () {
    const inputValue = this.value.toLowerCase();
    suggestionsContainer.innerHTML = "";
    if (inputValue) {
      const filteredDestinations = destinations.filter((destination) =>
        destination.toLowerCase().includes(inputValue)
      );
      filteredDestinations.forEach((destination) => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = destination;
        div.addEventListener("click", function () {
          destinationInput.value = this.textContent;
          suggestionsContainer.innerHTML = "";
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.style.display =
        filteredDestinations.length > 0 ? "block" : "none";
    } else {
      suggestionsContainer.style.display = "none";
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !destinationInput.contains(event.target) &&
      !suggestionsContainer.contains(event.target)
    ) {
      suggestionsContainer.style.display = "none";
    }
  });

  // Create predefined options dynamically
  predefinedOptions.forEach((option) => {
    const div = document.createElement("div");
    div.className = "predefined-option";
    div.textContent = option;
    div.dataset.value = option;
    div.addEventListener("click", function () {
      destinationInput.value = this.dataset.value;
    });
    predefinedOptionsContainer.appendChild(div);
  });

  // Create a slider for selecting the number of days
  const day_slider = document.createElement("input");
  day_slider.type = "range";
  day_slider.min = minDays;
  day_slider.max = maxDays;
  day_slider.value = minDays;
  day_slider.step = 1;
  day_slider.className = "day-slider";

  // Create a label to display the selected number of days
  const dayLabel = document.createElement("span");
  dayLabel.className = "day-label";
  dayLabel.textContent = `${minDays} Days`;

  // Append the slider and label to the day container
  dayContainer.appendChild(day_slider);
  dayContainer.appendChild(dayLabel);

  // Update label when slider value changes
  day_slider.addEventListener("input", function () {
    dayLabel.textContent = `${this.value} Days`;
  });
  //additionalDataContainer
  const sliders = {};
  const createSlider = (min, max, initialValue, label, id) => {
    const wrapper = document.createElement("div");
    wrapper.className = "slider-wrapper";

    const topLabelContainer = document.createElement("div");
    topLabelContainer.className = "top-label-container";

    const topLabel = document.createElement("span");
    topLabel.className = "top-label";
    topLabel.textContent = label;

    const valueLabel = document.createElement("span");
    valueLabel.className = "value-label";
    valueLabel.textContent = initialValue;

    topLabelContainer.appendChild(topLabel);
    topLabelContainer.appendChild(valueLabel);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.value = initialValue;
    slider.step = 1;
    slider.className = "additional-slider";
    slider.id = id; // Assign unique ID

    slider.addEventListener("input", function () {
      valueLabel.textContent = this.value;
    });

    wrapper.appendChild(topLabelContainer);
    wrapper.appendChild(slider);

    sliders[id] = slider; // Store slider in the global object

    return wrapper;
  };

  //historical
  const sliderElements = [
    createSlider(0, 5, 3, "Historical", "history"),
    createSlider(0, 5, 3, "Amusement", "amusement"),
    createSlider(0, 5, 3, "Natural", "natural"),
  ];
  sliderElements.forEach((slider) =>
    additionalDataContainer.appendChild(slider)
  );

  // Handle button click to store values and redirect
  generateButton.addEventListener("click", async function () {
    history_value = sliders["history"].value;
    amusement_value = sliders["amusement"].value;
    natural_value = sliders["natural"].value;
    const destination = destinationInput.value;
    days = day_slider.value;

    console.log("Generate button clicked:");
    console.log("  Destination:", destination);
    console.log("  Days:", days);
    console.log("  History:", history_value);
    console.log("  Amusement:", amusement_value);
    console.log("  Natural:", natural_value);

    // Unified logic: Always collect URLs from all tabs, and send both destination + urls
    chrome.tabs.query({}, async (tabs) => {
      const urls = tabs
        .map(tab => tab.url)
        .filter(url => url && url.startsWith("http")); // Only collect web URLs

      const data = {
        destination: destination,
        urls: urls,
        day: days,
        historical: history_value,
        amusement: amusement_value,
        natural: natural_value
      };

      console.log("Submitting unified data:", data);
      sendToBackend(data);
    });
  });
});

async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        resolve(null);
      }
    });
  });
}

async function getActiveTabUrl() {
  const tab = await getActiveTab();
  return tab ? tab.url : null;
}

async function sendToBackend(data) {
  // Create loading overlay
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  const loadingGif = document.createElement("img");
  loadingGif.src = "assets/loading.gif";
  loadingGif.className = "loading-gif";
  loadingOverlay.appendChild(loadingGif);
  document.body.appendChild(loadingOverlay);
  document.body.style.pointerEvents = "none";

  console.log("Sending data to backend for full processing:", data);

  const { processItinerary } = backend(data);
  processItinerary()
    .then((response) => {
      document.body.removeChild(loadingOverlay);
      document.body.style.pointerEvents = "auto";
      displayCards(response);
    })
    .catch((error) => {
      document.body.removeChild(loadingOverlay);
      document.body.style.pointerEvents = "auto";
      console.error("Error processing the itinerary:", error);
      const preElement = document.getElementById("main-content");
      preElement.textContent = "Error processing the itinerary. Please check if backend is running.";
    });
}

function extractMainContent(doc) {
  let mainElement = doc.querySelector("main") || doc.body;
  return mainElement ? mainElement.innerText.trim() : "No main content";
}

function extractAttractions(doc) {
  let attractionsList = "";
  let attractionsSection = doc.querySelector("h2 ~ ul");

  if (attractionsSection) {
    let attractions = attractionsSection.querySelectorAll("li");
    if (attractions.length > 0) {
      attractions.forEach((attraction) => {
        attractionsList += `
            Attraction: ${attraction.innerText.trim()}
          `;
      });
    }
  } else {
    attractionsList = "No attractions found";
  }

  return attractionsList;
}

let storedResponse = null;

function displayCards(response) {
  storedResponse = response; // Store the response data
  document.getElementById("main-content").style.display = "block";
  const preElement = document.getElementById("main-content");
  preElement.textContent = "";

  const cardsContainer = document.createElement("div");
  cardsContainer.className = "cards-container";

  for (const [day, activities] of Object.entries(response)) {
    const card = document.createElement("div");
    card.className = "card";

    // Create and append card header
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";
    cardHeader.textContent = day;
    card.appendChild(cardHeader);

    // Create and append card body
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    activities.forEach((activity, index) => {
      if (activity.trim() !== "") {
        // Check if activity is not an empty string
        const activityElement = document.createElement("div");
        activityElement.className = "card-activity";

        // Add activity description
        const description = document.createElement("p");
        description.className = "card-item";
        description.textContent = activity;
        activityElement.appendChild(description);

        // Optionally add a divider between activities, unless it's a "Leisure day"
        if (day !== "Leisure day" && index < activities.length - 1) {
          // Check if the next activity is not an empty string before adding a divider
          if (activities[index + 1].trim() !== "") {
            const divider = document.createElement("hr");
            divider.className = "activity-divider";
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
  document.getElementById("downloadButton").style.display = "block";
}

function formatResponseAsText(response) {
  let formattedText = "";
  for (const [day, activities] of Object.entries(response)) {
    formattedText += `${day}\n`;
    activities.forEach((activity) => {
      formattedText += `  - ${activity}\n`;
    });
    formattedText += "\n";
  }
  return formattedText;
}

// Function to handle data download
function downloadData(response) {
  const formattedText = formatResponseAsText(response);
  const dataStr =
    "data:text/plain;charset=utf-8," + encodeURIComponent(formattedText);
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "itinerary.txt");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Event listener for the download button
document.getElementById("downloadButton").addEventListener("click", () => {
  if (storedResponse) {
    downloadData(storedResponse); // Use the stored response data
  } else {
    alert("No data available to download.");
  }
});
