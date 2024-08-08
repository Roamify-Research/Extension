document.addEventListener('DOMContentLoaded', function() {
    const destination = localStorage.getItem('selectedDestination');
    const days = localStorage.getItem('selectedDays');
    
    if (destination && days) {
        document.getElementById('destinationDetail').textContent = `Destination: ${destination}`;
        document.getElementById('daysDetail').textContent = `Days: ${days}`;
    } else {
        document.getElementById('destinationDetail').textContent = 'No destination selected';
        document.getElementById('daysDetail').textContent = 'No days selected';
    }
});
