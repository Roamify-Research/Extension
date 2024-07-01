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

  let dayCount = 0;

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

  planBtn.addEventListener('click', () => {
    const destination = searchInput.value.trim();
    if (destination) {
      const link = `https://traveltriangle.com/blog/places-to-visit-in-${destination.toLowerCase()}/`;
      fetchTravelTriangleData([{ dst: destination, link }]);
    } else {
      alert('Please enter a city name.');
    }
  });
});

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

  const data = { "text" : content};
  const { processItinerary } = backend(data);

  processItinerary()
  .then(response => {
    for (const [key, value] of Object.entries(response)) {
      preElement.textContent += `${key}: ${value}`;
      preElement.textContent += '\n\n';
    }
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
