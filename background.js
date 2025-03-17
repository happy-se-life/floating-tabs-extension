// Event when the icon is clicked
chrome.action.onClicked.addListener((tab) => {
  // Dynamically inject content_script.js into the current tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content_script.js']
  }, () => {
    // After injection is complete, get the tab list and send a message
    chrome.tabs.query({}, function(tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "showMenu", tabs: tabs });
    });
  });
});
  
  // Handle tab switch requests from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "activateTab") {
      chrome.tabs.update(message.tabId, { active: true });
    }
    return true; // Return true for asynchronous response
  });