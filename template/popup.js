document.getElementById('get-html').addEventListener('click', () => {
  chrome.tabs.query({}, (tabs) => {
    let htmlContents = [];
    let tabCount = tabs.length;
    
    tabs.forEach((tab) => {
      // Skip chrome:// URLs
      if (tab.url.startsWith('chrome://')) {
        // console.warn(`Skipping tab with URL ${tab.url} - Cannot access chrome:// URLs`);
        tabCount--;
        if (htmlContents.length === tabCount) {
          handleHtmlContents(htmlContents);
        }
        return;
      }

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
  let mainContent = '';

  // Attempt to extract the main content
  let mainElement = document.querySelector('main') || document.body;
  if (mainElement) {
    mainContent = mainElement.innerHTML || 'No main content';
  }

  return { mainContent };
}

function handleHtmlContents(contents) {
  let allLinks = [];
  contents.forEach(item => {
    let links = extractLinks(item.content.mainContent);
    allLinks.push(...links);
  });

  displayLinks(allLinks);
}

function extractLinks(mainContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = mainContent;
  const links = Array.from(tempDiv.querySelectorAll('a')).map(a => a.href);

  // Exclude image file links
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
  return links.filter(link => {
    const lowerCaseLink = link.toLowerCase();
    return !imageExtensions.some(extension => lowerCaseLink.endsWith(extension));
  });
}


function displayLinks(links) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = '';

  links.forEach((link, index) => {
    preElement.textContent += `Link ${index + 1}: ${link}\n\n`;
  });
}
