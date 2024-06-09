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

  let mainElement = document.querySelector('main') || document.body;
  if (mainElement) {
    mainContent = mainElement.innerText || mainElement.textContent || 'No main content';
  }

  return { title, description, mainContent };
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
      mainContent: item.content.mainContent
    };
  });

  displayHtmlContents(formattedContents);
}

function displayHtmlContents(contents) {
  const preElement = document.getElementById('html-content');
  preElement.textContent = JSON.stringify(contents, null, 2);
}
