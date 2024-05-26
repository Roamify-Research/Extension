document.getElementById('get-html').addEventListener('click', () => {
  chrome.tabs.query({}, (tabs) => {
    let htmlContents = [];
    let tabCount = tabs.length;
    
    tabs.forEach((tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getValuableContent
        },
        (results) => {
          if (results && results[0]) {
            htmlContents.push({ url: tab.url, content: results[0].result });
            if (htmlContents.length === tabCount) {
              handleHtmlContents(htmlContents);
            }
          } else {
            console.error(`Failed to get valuable content for tab ${tab.url}`);
          }
        }
      );
    });
  });
});

function getValuableContent() {
  let title = document.title;
  let description = document.querySelector('meta[name="description"]')?.content || 'No description';
  let mainContent = '';
  
  // Attempt to extract the main content
  let mainElement = document.querySelector('main') || document.body;
  if (mainElement) {
    mainContent = mainElement.innerText || mainElement.textContent || 'No main content';
  }

  return { title, description, mainContent };
}

function handleHtmlContents(contents) {
  let allLinks = [];
  contents.forEach(item => {
    let links = extractLinks(item.content.mainContent);
    allLinks.push(...links.map(link => ({ parentUrl: item.url, url: link })));
  });

  fetchHtmlFromLinks(allLinks, contents);
}

function extractLinks(mainContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = mainContent;
  const links = Array.from(tempDiv.querySelectorAll('a')).map(a => a.href);
  return links;
}

function fetchHtmlFromLinks(links, originalContents) {
  let fetchPromises = links.map(link =>
    fetch(link.url).then(response => response.text().then(data => ({ parentUrl: link.parentUrl, url: link.url, content: data })))
  );
  
  Promise.all(fetchPromises).then(pagesHtml => {
    displayHtmlContents(originalContents, pagesHtml);
  }).catch(error => {
    console.error('Error fetching links:', error);
  });
}

function displayHtmlContents(originalContents, fetchedContents) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  originalContents.forEach((item, index) => {
    preElement.textContent += `Original Tab ${index + 1} URL: ${item.url}\nTitle: ${item.content.title}\nDescription: ${item.content.description}\nMain Content:\n${item.content.mainContent}\n\n----------------\n\n`;
  });

  fetchedContents.forEach((item, index) => {
    preElement.textContent += `Fetched Link ${index + 1} Parent URL: ${item.parentUrl}\nLink URL: ${item.url}\nContent:\n${item.content}\n\n----------------\n\n`;
  });
}
