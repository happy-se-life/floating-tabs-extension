// Variable to store the last mouse position
let lastMousePosition = { x: 0, y: 0 };
// Flag to track if the menu is visible
let isMenuVisible = false;

// Monitor mouse movement events on the page and record the latest coordinates
document.addEventListener("mousemove", (event) => {
  lastMousePosition = { x: event.pageX, y: event.pageY };
});

// Display information in console when extension is loaded
console.log("Tab List Context Menu: Content script loaded");

// Hide menu when tab is switched
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isMenuVisible) {
    removeContextMenu();
  }
});

// Function to ensure styles are properly applied
function ensureStyles() {
  // Check if already added
  if (document.getElementById('tab-context-menu-style')) return;
  
  // Insert inline styles
  const styleElement = document.createElement('style');
  styleElement.id = 'tab-context-menu-style';
  styleElement.textContent = `
    #my-tab-menu {
      font-family: sans-serif !important;
      font-size: 11px !important;
      color: #000 !important;
      background: #fff !important;
      border: 1px solid #ccc !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15) !important;
      padding: 5px 0 !important;
      z-index: 10000 !important;
      position: absolute !important;
    }
    #my-tab-menu div {
      font-size: 11px !important;
      color: #000 !important;
      padding: 5px 10px !important;
      cursor: pointer !important;
    }
    #my-tab-menu div:hover {
      background: #eee !important;
    }
    #my-tab-menu * {
      font-size: 11px !important;
    }
  `;
  document.head.appendChild(styleElement);
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  if (message.action === "showMenu") {
    // If menu is already visible, remove it and respond
    if (isMenuVisible) {
      removeContextMenu();
      sendResponse({status: "Menu hidden"});
    } else {
      // Ensure styles are applied
      ensureStyles();
      showContextMenu(lastMousePosition, message.tabs);
      sendResponse({status: "Menu shown"});
    }
  } else if (message.action === "hideMenu") {
    // When receiving a message that another tab has become active
    if (isMenuVisible) {
      removeContextMenu();
    }
    sendResponse({status: "Menu hidden"});
  }
  return true; // Return true for asynchronous response
});

// Generate and display context menu (list)
function showContextMenu(position, tabs) {
  // Remove existing menu if any
  removeContextMenu();

  // Create menu container
  const menu = document.createElement("div");
  menu.id = "my-tab-menu";
  menu.style.position = "absolute";
  menu.style.zIndex = 10000;
  menu.style.background = "#333"; // 背景を黒っぽく
  menu.style.color = "#fff"; // 文字色を明るく
  menu.style.border = "1px solid #444"; // 枠の色をダークに
  menu.style.boxShadow = "0 2px 5px rgba(0,0,0,0.5)"; // 影をダークに
  menu.style.padding = "5px 0";
  menu.style.fontFamily = "sans-serif";
  menu.style.fontSize = "11px";
  document.body.appendChild(menu);
  
  // Set menu as visible
  isMenuVisible = true;

  // Generate menu items from tab list
  tabs.forEach((tab) => {
    const item = document.createElement("div");
    item.style.padding = "5px 10px";
    item.style.cursor = "pointer";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.fontSize = "11px";
    item.style.color = "#fff"; // 文字色を明るく
    
    // Add favicon
    if (tab.favIconUrl) {
      const favicon = document.createElement("img");
      favicon.src = tab.favIconUrl;
      favicon.style.height = "16px";
      favicon.style.marginRight = "8px";
      favicon.style.flexShrink = "0";
      item.appendChild(favicon);
    } else {
      // Reserve space if no favicon
      const placeholder = document.createElement("div");
      placeholder.style.width = "16px";
      placeholder.style.height = "16px";
      placeholder.style.marginRight = "8px";
      placeholder.style.flexShrink = "0";
      item.appendChild(placeholder);
    }
    
    // Add title
    const title = document.createElement("span");
    title.textContent = tab.title;
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.fontSize = "11px";
    title.style.color = "#fff"; // 文字色を明るく
    item.appendChild(title);

    // Send tab switch request on click
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event propagation for clicks outside menu
      chrome.runtime.sendMessage({ action: "activateTab", tabId: tab.id });
      removeContextMenu();
    });

    // Change background color on mouseover/out
    item.addEventListener("mouseover", () => {
      item.style.background = "#555"; // ホバー時の背景を少し明るく
    });
    item.addEventListener("mouseout", () => {
      item.style.background = "#333"; // 元の背景色に戻す
    });

    menu.appendChild(item);
  });

  // 画面のサイズを取得
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // メニューのサイズを取得
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  
  // 位置の計算
  let menuX = position.x;
  let menuY = position.y;
  
  // スクロール位置を考慮
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  // 右端ではみ出す場合は左に表示
  if (menuX + menuWidth > viewportWidth + scrollX) {
    menuX = menuX - menuWidth;
  }
  
  // 下端ではみ出す場合は上に表示
  if (menuY + menuHeight > viewportHeight + scrollY) {
    menuY = menuY - menuHeight;
  }
  
  // 上端ではみ出す場合は下に表示
  if (menuY < scrollY) {
    menuY = position.y + menuHeight;
  }
  
  // 計算した位置を設定
  menu.style.left = menuX + "px";
  menu.style.top = menuY + "px";

  // Hide menu when clicking outside
  document.addEventListener("click", removeContextMenu);
}

// Remove menu function
function removeContextMenu() {
  const menu = document.getElementById("my-tab-menu");
  if (menu) {
    menu.remove();
  }
  // Turn off menu visibility flag
  isMenuVisible = false;
  document.removeEventListener("click", removeContextMenu);
}