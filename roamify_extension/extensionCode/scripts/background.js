chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("splash.html") });
});
