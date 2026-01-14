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

// Chatbot state (session-only, not persisted)
let chatHistory = [];
let generationParams = null;

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

  // Dark Mode Toggle
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Check for saved dark mode preference
  chrome.storage.local.get(["darkMode"], (result) => {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });

  // Toggle dark mode
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDarkMode = document.body.classList.contains("dark-mode");

      // Save preference
      chrome.storage.local.set({ darkMode: isDarkMode });
    });
  }

  // History Handler
  const historyLink = document.getElementById("historyLink");
  if (historyLink) {
    historyLink.addEventListener("click", (e) => {
      e.preventDefault();
      const accountDropdown = document.getElementById("accountDropdown");
      if (accountDropdown) accountDropdown.classList.remove("active");
      fetchHistory();
    });
  }

  // Logout Handler (Delegated since structure might vary)
  // We attach to the container '.options' or directly to document
  // Logout Handler
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.storage.local.remove(["authToken", "username", "name"], () => {
        window.location.href = "panel.html";
      });
    });
  }
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
  const generateButton = document.getElementById("generateBtn");

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

  // Append the slider to the day container
  dayContainer.appendChild(day_slider);

  // Update the days display in the header when slider value changes
  day_slider.addEventListener("input", function () {
    const daysText = this.value === "1" ? "Day" : "Days";

    // Update the days display in the header
    const daysDisplay = document.getElementById("daysDisplay");
    if (daysDisplay) {
      daysDisplay.textContent = `${this.value} ${daysText}`;
    }
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
    createSlider(1, 5, 3, "Historical", "history"),
    createSlider(1, 5, 3, "Amusement", "amusement"),
    createSlider(1, 5, 3, "Natural", "natural"),
    createSlider(1, 5, 3, "Cultural", "cultural"),
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
    const cultural_value = sliders["cultural"].value;


    console.log("Generate button clicked:");
    console.log("  Destination:", destination);
    console.log("  Days:", days);
    console.log("  History:", history_value);
    console.log("  Amusement:", amusement_value);
    console.log("  Natural:", natural_value);
    console.log("  Cultural:", cultural_value);

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
        natural: natural_value,
        cultural: cultural_value
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
  // Store generation parameters for modify functionality
  generationParams = data;
  // Clear chat history when generating new itinerary
  chatHistory = [];

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
      saveItinerary(data.destination, response);
    })
    .catch((error) => {
      document.body.removeChild(loadingOverlay);
      document.body.style.pointerEvents = "auto";
      console.error("Error processing the itinerary:", error);
      console.error("Error processing the itinerary:", error);
      showResultView();
      const preElement = document.getElementById("result-section");
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


function showInputView() {
  document.getElementById("input-section").style.display = "block";
  document.getElementById("result-section").style.display = "none";
  document.getElementById("backButtonContainer").style.display = "none";
  document.getElementById("downloadButton").style.display = "none";
  // Hide chatbot when going back to planner
  document.getElementById("chatbot-container").style.display = "none";
  const chatWindow = document.getElementById("chatbot-window");
  if (chatWindow) chatWindow.classList.remove("active");
}

function showResultView() {
  document.getElementById("input-section").style.display = "none";
  document.getElementById("result-section").style.display = "block";
  document.getElementById("backButtonContainer").style.display = "block";
}

function displayCards(response) {
  storedResponse = response; // Store the response data
  showResultView();
  // Show chatbot container when itinerary is displayed
  document.getElementById("chatbot-container").style.display = "flex";
  const preElement = document.getElementById("result-section");
  preElement.textContent = "";

  const cardsContainer = document.createElement("div");
  cardsContainer.className = "cards-container";

  for (const [day, activities] of Object.entries(response)) {
    const card = document.createElement("div");
    card.className = "card";

    // Header (Day X)
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    // Create header content wrapper
    const headerContent = document.createElement("div");
    headerContent.className = "header-content-wrapper";

    // Day title
    const dayTitle = document.createElement("h3");
    const dayMatch = day.match(/^(Day \d+)/i);
    dayTitle.textContent = dayMatch ? dayMatch[1].toUpperCase() : day.toUpperCase();
    headerContent.appendChild(dayTitle);

    // Sub-header (Attractions summary) - inside the header
    if (day.includes(":")) {
      const cardSub = document.createElement("div");
      cardSub.className = "card-sub-header";
      cardSub.textContent = day.split(":")[1].trim();
      headerContent.appendChild(cardSub);
    }

    cardHeader.appendChild(headerContent);
    card.appendChild(cardHeader);


    // Body
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    activities.forEach((activity, index) => {
      if (activity && activity.trim() !== "") {
        const activityElement = document.createElement("div");
        activityElement.className = "card-activity";

        // Determine time of day for styling
        const activityLower = activity.toLowerCase();
        if (activityLower.includes("morning")) {
          activityElement.classList.add("morning");
        } else if (activityLower.includes("afternoon")) {
          activityElement.classList.add("afternoon");
        } else if (activityLower.includes("evening") || activityLower.includes("night")) {
          activityElement.classList.add("evening");
        }

        // Parse activity text
        // Regex to capture "Title (Time): Description" or "Title: Description"
        const match = activity.match(/^(.*?)(?:\):\s*|:\s+)(.*)$/);

        let headerText = "";
        let descText = activity;

        if (match) {
          headerText = match[1].trim();
          descText = match[2].trim();
        }

        // Create header element if we have one
        if (headerText) {
          const titleEl = document.createElement("div");
          titleEl.className = "activity-time";
          titleEl.textContent = headerText;
          activityElement.appendChild(titleEl);
        }

        // Create description element
        const descEl = document.createElement("div");
        descEl.className = "activity-desc";
        descEl.textContent = descText;
        activityElement.appendChild(descEl);

        cardBody.appendChild(activityElement);
      }
    });


    card.appendChild(cardBody);
    cardsContainer.appendChild(card);
  }

  preElement.appendChild(cardsContainer);
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

// --- CHATBOT HELPER FUNCTIONS ---
function appendChatMessage(role, content) {
  const container = document.getElementById("chatbot-messages");
  if (!container) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}`;
  messageDiv.textContent = content;
  container.appendChild(messageDiv);

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// --- HISTORY FUNCTIONS ---
const API_BASE = "https://roamify.fakepickle.tech";

function saveItinerary(destination, content) {
  chrome.storage.local.get(["authToken"], (result) => {
    if (!result.authToken) return;
    fetch(`${API_BASE}/itinerary/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${result.authToken}` },
      body: JSON.stringify({ destination, content })
    }).then(r => r.json()).then(d => console.log("Saved:", d)).catch(e => console.error(e));
  });
}


document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backButton");
  if (backBtn) {
    backBtn.addEventListener("click", showInputView);
  }

  // --- CHATBOT TOGGLE LOGIC ---
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  const modifyItineraryBtn = document.getElementById("modify-itinerary-btn");

  if (chatbotToggle && chatbotWindow) {
    // Toggle chatbot window open/close
    chatbotToggle.addEventListener("click", () => {
      chatbotWindow.classList.toggle("active");
      // Focus input when opening
      if (chatbotWindow.classList.contains("active") && chatbotInput) {
        setTimeout(() => chatbotInput.focus(), 100);
      }
    });

    // Close button
    if (chatbotClose) {
      chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.remove("active");
      });
    }

    // Send message to Gemini API
    if (chatbotSend && chatbotInput) {
      const sendMessage = async () => {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Add user message to chat
        appendChatMessage("user", message);
        chatHistory.push({ role: "user", content: message });
        chatbotInput.value = "";
        chatbotSend.disabled = true;

        try {
          const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: message,
              itinerary: storedResponse || {},
              history: chatHistory
            })
          });

          const data = await response.json();

          if (data.response) {
            appendChatMessage("assistant", data.response);
            chatHistory.push({ role: "assistant", content: data.response });
          } else if (data.error) {
            appendChatMessage("assistant", `Error: ${data.error}`);
          }
        } catch (error) {
          console.error("Chat error:", error);
          appendChatMessage("assistant", "Sorry, I encountered an error. Please try again.");
        } finally {
          chatbotSend.disabled = false;
          chatbotInput.focus();
        }
      };

      chatbotSend.addEventListener("click", sendMessage);
      chatbotInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
      });
    }

    // Modify Itinerary button
    if (modifyItineraryBtn) {
      modifyItineraryBtn.addEventListener("click", async () => {
        if (chatHistory.length === 0) {
          alert("Please chat about your desired changes first!");
          return;
        }

        if (!storedResponse) {
          alert("No itinerary to modify.");
          return;
        }

        // Show loading
        const loadingOverlay = document.createElement("div");
        loadingOverlay.className = "loading-overlay";
        const loadingGif = document.createElement("img");
        loadingGif.src = "assets/loading.gif";
        loadingGif.className = "loading-gif";
        loadingOverlay.appendChild(loadingGif);
        document.body.appendChild(loadingOverlay);
        document.body.style.pointerEvents = "none";

        try {
          const response = await fetch(`${API_BASE}/modify-itinerary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              history: chatHistory,
              original_itinerary: storedResponse,
              preferences: generationParams || {}
            })
          });

          const data = await response.json();

          if (data.itinerary) {
            // Update the displayed itinerary
            displayCards(data.itinerary);

            // Clear chat history after modification
            chatHistory = [];
            const messagesContainer = document.getElementById("chatbot-messages");
            if (messagesContainer) {
              messagesContainer.innerHTML = '<div class="chat-message assistant">Your itinerary has been updated! Ask me more questions or request additional changes.</div>';
            }
          } else if (data.error) {
            alert(`Error modifying itinerary: ${data.error}`);
          }
        } catch (error) {
          console.error("Modify itinerary error:", error);
          alert("Failed to modify itinerary. Please try again.");
        } finally {
          document.body.removeChild(loadingOverlay);
          document.body.style.pointerEvents = "auto";
        }
      });
    }
  }
});

function fetchHistory() {
  chrome.storage.local.get(["authToken"], (result) => {
    if (!result.authToken) return;
    fetch(`${API_BASE}/itinerary/list`, {
      headers: { "Authorization": `Bearer ${result.authToken}` }
    }).then(r => r.json()).then(showHistoryList).catch(e => console.error(e));
  });
}

function showHistoryList(itineraries) {
  showResultView();
  const main = document.getElementById("result-section");
  main.innerHTML = "<h2>My Trips</h2><div class='cards-container' id='historyContainer'></div>";
  const container = document.getElementById("historyContainer");

  if (!itineraries || itineraries.length === 0) {
    main.innerHTML += "<p>No saved itineraries found.</p>";
    return;
  }

  itineraries.forEach(it => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";
    card.innerHTML = `<div class='card-header'>${it.destination}</div><div class='card-body'><p>${new Date(it.created_at).toLocaleDateString()}</p></div>`;
    card.addEventListener("click", () => loadItinerary(it.id));
    container.appendChild(card);
  });
}

function loadItinerary(id) {
  chrome.storage.local.get(["authToken"], (result) => {
    if (!result.authToken) return;
    fetch(`${API_BASE}/itinerary/${id}`, {
      headers: { "Authorization": `Bearer ${result.authToken}` }
    }).then(r => r.json()).then(data => {
      if (data.content) displayCards(data.content);
    }).catch(e => console.error(e));
  });
}
