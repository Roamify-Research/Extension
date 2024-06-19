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
    'PNQ': 'Pune'
  };

  let src = null, dst = null;
  let matches = url.match(/[A-Z]{3}/g);

  if (matches && matches.length >= 2) {
    let code1 = matches[0];
    let code2 = matches[1];

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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = getValuableContent(doc);
        htmlContents.push({ url: linkInfo.link, content: content });
        processedLinks++;
        if (processedLinks === linksToFetch.length) {
          handleHtmlContents(htmlContents, linksToFetch);
        }
      })
      .catch(error => {
        console.error('Error fetching the URL:', error);
        processedLinks++;
        if (processedLinks === linksToFetch.length) {
          handleHtmlContents(htmlContents, linksToFetch);
        }
      });
  });
}

function getValuableContent(doc) {
  const extractText = (selectors) => {
    for (let selector of selectors) {
      let element = doc.querySelector(selector);
      if (element) {
        return element.innerText || element.textContent || '';
      }
    }
    return 'No information available';
  };

  let title = doc.title || 'No title';
  let description = extractText(['meta[name="description"]', 'meta[property="og:description"]']);
  let mainContent = '';
  let timings = '';
  let address = '';
  let rating = '';
  let reviewCount = '';
  let attractionDetails = [];
  let popularCities = [];
  let tours = [];

  let mainElement = doc.querySelector('main') || doc.body;
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
    let elements = doc.querySelectorAll(selector);
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
  let cityElements = doc.querySelectorAll('.popular-cities > div');
  cityElements.forEach((element) => {
    let cityName = extractText(citySelectors, element);
    let cityLocation = extractText(['.location', '.city-location', '.country'], element);
    if (cityName !== 'No information available') {
      popularCities.push({ cityName, cityLocation });
    }
  });

  let tourSelectors = ['.tour', '.tour-item', '.experience'];
  let tourElements = doc.querySelectorAll('.ways-to-tour > div');
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

function handleHtmlContents(contents, linksToFetch) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  contents.forEach((item, index) => {
    let destination = linksToFetch[index].dst;

    let displayContent = `URL: ${item.url}\n\nTitle: ${item.content.title}\n\nDescription: ${splitText(item.content.description)}\n\nAddress: ${item.content.address}\n\nTimings: ${splitText(item.content.timings)}\n\nRating: ${item.content.rating}\n\nReview Count: ${item.content.reviewCount}\n\nMain Content:\n${splitText(item.content.mainContent)}\n\n`;

    let attractions = item.content.attractionDetails.map(attraction => {
      return `\nAttraction Name: ${attraction.attractionName}\n\nDescription: ${splitText(attraction.attractionDesc)}\n\nTimings: ${splitText(attraction.attractionTimings)}\n\nRating: ${attraction.attractionRating}\n\nReview Count: ${attraction.attractionReviewCount}\n`;
    }).join('\n\n');

        let cities = item.content.popularCities.map(city => {
      return `\nCity Name: ${city.cityName}\n\nLocation: ${city.cityLocation}\n`;
    }).join('\n\n');

    let tours = item.content.tours.map(tour => {
      return `\nTour Name: ${tour.tourName}\n\nDescription: ${splitText(tour.tourDesc)}\n\nRating: ${tour.tourRating}\n\nReview Count: ${tour.tourReviewCount}\n\nPrice: ${tour.tourPrice}\n`;
    }).join('\n\n');

    displayContent += `Attractions:\n${attractions}\n\nPopular Cities:\n${cities}\n\nTours:\n${tours}\n\n`;

    preElement.textContent += filterHeaderFooter(displayContent);
  });
}

function filterHeaderFooter(text) {
  const headerRegex = /<header\b[^>]*>(.*?)<\/header>/gi;
  const footerRegex = /<footer\b[^>]*>(.*?)<\/footer>/gi;
  const unwantedContentRegex = /Thank You!|You will be redirected to your dashboard shortly.|We will also call you back in 24 hrs.|ul\.blog_breadcrumbs|\.socialshare_box|\.free-quotes-ui|mkt-mob-exit-intent|\.hiddentt_blog_hotel_1|SHARES/;

  // Remove header and footer content
  text = text.replace(headerRegex, '');
  text = text.replace(footerRegex, '');

  const mainContentMarker = '33 Spectacular Places To Visit In Mumbai';

  // Find the index of the main content marker
  const mainContentIndex = text.indexOf(mainContentMarker);

  // If the marker is found, return the text starting from the main content marker
  if (mainContentIndex !== -1) {
    return text.substring(mainContentIndex);
  }


   const unwantedContentRegewx = /"@context": "https:\/\/schema\.org"|"@type": "FAQPage"|{"@type": "Question".*?"}/g;

  // Remove unwanted content based on regex patterns
  text = text.replace(unwantedContentRegewx, '');

  // Remove unwanted content based on regex patterns
  text = text.replace(unwantedContentRegex, '');

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

