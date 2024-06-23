document.addEventListener('DOMContentLoaded', () => {
  const decreaseBtn = document.getElementById('decrease-btn');
  const increaseBtn = document.getElementById('increase-btn');
  const dayCountSpan = document.getElementById('day-count');

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

  const planBtns = document.getElementsByClassName('plan-btn');

  // Loop through all elements with the class name 'plan-btn'
  for (let i = 0; i < planBtns.length; i++) {
    planBtns[i].addEventListener('click', () => {
      chrome.tabs.query({}, (tabs) => {
        let htmlContents = [];
        let processedTabs = 0;
        let tabCount = tabs.length;

        tabs.forEach((tab) => {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: getValuableContent
            },
            (results) => {
              processedTabs++;
              if (results && results[0]) {
                htmlContents.push({ url: tab.url, content: results[0].result });
              } else {
                console.error(`Failed to get valuable content for tab ${tab.url}`);
              }

              if (processedTabs === tabCount) {
                handleHtmlContents(htmlContents);
              }
            }
          );
        });
      });
    });
  }
});

function getValuableContent() {
  const extractText = (selectors) => {
    for (let selector of selectors) {
      let element = document.querySelector(selector);
      if (element) {
        return element.innerText || element.textContent || '';
      }
    }
    return 'No information available';
  };

  let title = document.title || 'No title';

  let description = extractText(['meta[name="description"]', 'meta[property="og:description"]']);

  let mainContent = '';
  let timings = '';
  let address = '';
  let rating = '';
  let reviewCount = '';
  let attractionDetails = [];
  let popularCities = [];
  let tours = [];

  let mainElement = document.querySelector('main') || document.body;
  if (mainElement) {
    mainContent = mainElement.innerText || mainElement.textContent || 'No main content';
  }

  timings = extractText(['.opening-hours', '.operating-hours', '.hours', '.time-info', '.hours-info']);
  address = extractText(['.address', '.location', '.place-address', '.contact-info .address', '.address-info']);
  rating = extractText(['.rating', '.review-rating', '.star-rating', '.user-rating', '.score']);
  reviewCount = extractText(['.review-count', '.review-number', '.number-of-reviews', '.reviews-count', '.total-reviews']);

  let attractionSelectors = ['.attraction', '.attraction-item', '.poi-item', '.tourist-attraction', '.place-of-interest'];
  let attractionElements = [];
  for (let selector of attractionSelectors) {
    let elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      attractionElements = elements;
      break;
    }
  }

  attractionElements.forEach((element) => {
    let attractionName = extractText(['.attraction-name', '.poi-title', '.name', '.title', 'h2', 'h3', 'h4'], element);
    let attractionDesc = extractText(['.attraction-description', '.poi-description', '.description', '.desc', 'p'], element);
    let attractionTimings = extractText(['.attraction-timings', '.poi-timings', '.timings', '.time', '.hours'], element);
    let attractionRating = extractText(['.attraction-rating', '.poi-rating', '.rating', '.score', '.star-rating'], element);
    let attractionReviewCount = extractText(['.attraction-review-count', '.poi-review-count', '.reviews', '.review-count', '.number-of-reviews'], element);

    if (attractionName !== 'No information available') {
      attractionDetails.push({
        attractionName,
        attractionDesc,
        attractionTimings,
        attractionRating,
        attractionReviewCount
      });
    }
  });

  let citySelectors = ['.city-name', '.city', '.location-name'];
  let cityElements = document.querySelectorAll('.popular-cities > div');
  cityElements.forEach((element) => {
    let cityName = extractText(citySelectors, element);
    let cityLocation = extractText(['.location', '.city-location', '.country'], element);
    if (cityName !== 'No information available') {
      popularCities.push({ cityName, cityLocation });
    }
  });

  let tourSelectors = ['.tour', '.tour-item', '.experience'];
  let tourElements = document.querySelectorAll('.ways-to-tour > div');
  tourElements.forEach((element) => {
    let tourName = extractText(['.tour-name', '.experience-title', '.title', 'h2', 'h3', 'h4'], element);
    let tourDesc = extractText(['.tour-description', '.experience-description', '.description', '.desc', 'p'], element);
    let tourRating = extractText(['.tour-rating', '.experience-rating', '.rating', '.score', '.star-rating'], element);
    let tourReviewCount = extractText(['.tour-review-count', '.experience-review-count', '.reviews', '.review-count', '.number-of-reviews'], element);
    let tourPrice = extractText(['.tour-price', '.experience-price', '.price', '.cost'], element);

    if (tourName !== 'No information available') {
      tours.push({
        tourName,
        tourDesc,
        tourRating,
        tourReviewCount,
        tourPrice
      });
    }
  });

  return { title, description, mainContent, timings, address, rating, reviewCount, attractionDetails, popularCities, tours };
}

function handleHtmlContents(contents) {
  let filteredContents = contents.filter(item => {
    return !item.url.includes('flight') && !item.url.includes('railway') && !item.url.includes('train');
  });

  let formattedContents = filteredContents.map(item => {
    return {
      url: item.url,
      title: item.content.title,
      description: item.content.description,
      mainContent: item.content.mainContent,
      timings: item.content.timings,
      address: item.content.address,
      rating: item.content.rating,
      reviewCount: item.content.reviewCount,
      attractions: item.content.attractionDetails,
      cities: item.content.popularCities,
      tours: item.content.tours
    };
  });

  displayHtmlContents(formattedContents);
}

function displayHtmlContents(contents) {
  const preElement = document.getElementById('main-content');
  let displayContent = contents.map(item => {
    let attractions = item.attractions.map(attraction => {
        return `\nAttraction Name: ${attraction.attractionName}\n\nDescription: ${splitText(attraction.attractionDesc)}\n\nTimings: ${splitText(attraction.attractionTimings)}\n\nRating: ${attraction.attractionRating}\n\nReview Count: ${attraction.attractionReviewCount}\n`;
    }).join('\n\n');

    let cities = item.cities.map(city => {
      return `\nCity Name: ${city.cityName}\n\nLocation: ${city.cityLocation}\n`;
    }).join('\n\n');

    let tours = item.tours.map(tour => {
      return `\nTour Name: ${tour.tourName}\n\nDescription: ${splitText(tour.tourDesc)}\n\nRating: ${tour.tourRating}\n\nReview Count: ${tour.tourReviewCount}\n\nPrice: ${tour.tourPrice}\n`;
    }).join('\n\n');

    return `Tourist Attraction Name: ${item.title}\n\nDescription: ${splitText(item.description)}\n\nAddress: ${item.address}\n\nTimings: ${splitText(item.timings)}\n\nRating: ${item.rating}\n\nReview Count: ${item.reviewCount}\n\nMain Content:\n${splitText(item.mainContent)}\n\nAttractions:\n${attractions}\n\nPopular Cities:\n${cities}\n\nTours:\n${tours}\n\n`;
  }).join('\n\n');

  displayContent = filterHeaderFooter(displayContent);

  preElement.textContent = displayContent;
}

function filterHeaderFooter(text) {
  const headerRegex = /<header\b[^>]*>(.*?)<\/header>/gi;
  const footerRegex = /<footer\b[^>]*>(.*?)<\/footer>/gi;

  text = text.replace(headerRegex, '');
  text = text.replace(footerRegex, '');

  return text;
}

function splitText(text) {
  const maxLength = 70;
  if (text.length <= maxLength) return text;
  
  let splitText = '';
  let words = text.split(' ');
  let lineLength = 0;

  words.forEach(word => {
    if (lineLength + word.length <= maxLength) {
      splitText += word + ' ';
      lineLength += word.length + 1;
    } else {
      splitText += '\n' + word + ' ';
      lineLength = word.length + 1;
    }
  });

  return splitText.trim();
}
