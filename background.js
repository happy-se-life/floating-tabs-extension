// アイコンがクリックされた際は、content_script.js は既に静的に注入されている前提で処理を行う
chrome.action.onClicked.addListener((tab) => {
  // content_script.js を動的に注入せず、直接タブリストの取得とメッセージ送信を実施する
  chrome.tabs.query({}, function(tabs) {
    chrome.tabs.sendMessage(tab.id, { action: "showMenu", tabs: tabs });
  });
});

// content_script.js からのタブ切り替え要求の処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "activateTab") {
    chrome.tabs.update(message.tabId, { active: true });
  }
  return true; // 非同期レスポンスを返すために true を返す
});