document.getElementById('get-html').addEventListener('click', () => {
    // Query all open tabs
    chrome.tabs.query({}, (tabs) => {
      let htmlContents = [];
      let tabCount = tabs.length;
      
      tabs.forEach((tab) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: getHtmlContent
          },
          (results) => {
            if (results && results[0]) {
              htmlContents.push({ url: tab.url, content: results[0].result });
              if (htmlContents.length === tabCount) {
                displayHtmlContents(htmlContents);
              }
            }
          }
        );
      });
    });
  });
  
  function getHtmlContent() {
    return document.documentElement.outerHTML;
  }
  
  function displayHtmlContents(contents) {
    const preElement = document.getElementById('html-content');
    preElement.textContent = '';
    
    contents.forEach((item, index) => {
      preElement.textContent += `Tab ${index + 1} URL: ${item.url}\nHTML Content:\n${item.content}\n\n----------------\n\n`;
    });
  }
  