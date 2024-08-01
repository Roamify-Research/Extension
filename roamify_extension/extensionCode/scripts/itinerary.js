document.addEventListener('DOMContentLoaded', function () {
    const accountButton = document.getElementById('accountButton');
    const accountDropdown = document.getElementById('accountDropdown');
    const destinationInput = document.getElementById('destinationInput');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    const predefinedOptionsContainer = document.querySelector('.predefined-options-container');
    const dayContainer = document.querySelector('.day-container');
    const generateButton = document.querySelector('.generate-itinerary-button');

    // Sample destinations for auto-complete
    const destinations = [
        'Paris', 'London', 'New York', 'Tokyo', 'Sydney', 'Rome', 
        'Berlin', 'Amsterdam', 'Barcelona', 'Lisbon', 'Vietnam'
    ];

    // Sample predefined options
    const predefinedOptions = [
        'Vietnam', 'London', 'New York', 'Tokyo', 'Sydney'
    ];

    // Sample range values for days
    const minDays = 1;
    const maxDays = 30;

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
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = minDays;
    slider.max = maxDays;
    slider.value = minDays;
    slider.step = 1;
    slider.className = 'day-slider';

    // Create a label to display the selected number of days
    const dayLabel = document.createElement('span');
    dayLabel.className = 'day-label';
    dayLabel.textContent = `${minDays} Days`;

    // Append the slider and label to the day container
    dayContainer.appendChild(slider);
    dayContainer.appendChild(dayLabel);

    // Update label when slider value changes
    slider.addEventListener('input', function () {
        dayLabel.textContent = `${this.value} Days`;
    });

    // Handle button click to store values and redirect
    generateButton.addEventListener('click', function () {
        const destination = destinationInput.value;
        const days = slider.value;
        
        // Store the values in local storage
        localStorage.setItem('selectedDestination', destination);
        localStorage.setItem('selectedDays', days);
        
        // Redirect to the new page
        window.location.href = 'destination.html';
    });
});
