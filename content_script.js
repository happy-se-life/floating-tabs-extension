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

// Updated showContextMenu with dynamic theme colors
function showContextMenu(position, tabs) {
  // Remove existing menu if any
  removeContextMenu();

  // Determine theme colors based on prefers-color-scheme
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgColor     = darkMode ? "#333" : "#fff";
  const textColor   = darkMode ? "#fff" : "#000";
  const borderColor = darkMode ? "1px solid #444" : "1px solid #ccc";
  const boxShadow   = darkMode ? "0 2px 5px rgba(0,0,0,0.5)" : "0 2px 5px rgba(0,0,0,0.15)";
  const hoverColor  = darkMode ? "#555" : "#eee";

  // Create menu container
  const menu = document.createElement("div");
  menu.id = "my-tab-menu";
  menu.style.position = "absolute";
  menu.style.zIndex = 10000;
  menu.style.background = bgColor;
  menu.style.color = textColor;
  menu.style.border = borderColor;
  menu.style.boxShadow = boxShadow;
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
    item.style.color = textColor;
    
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
    
    // Add title text
    const title = document.createElement("span");
    title.textContent = tab.title;
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.fontSize = "11px";
    title.style.color = textColor;
    item.appendChild(title);
    
    // Send tab switch request on click
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event propagation for clicks outside menu
      chrome.runtime.sendMessage({ action: "activateTab", tabId: tab.id });
      removeContextMenu();
    });
    
    // Change background color on mouse events
    item.addEventListener("mouseover", () => { item.style.background = hoverColor; });
    item.addEventListener("mouseout", () => { item.style.background = bgColor; });
    
    menu.appendChild(item);
  });

  // Calculate the best menu location given the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  let menuX = position.x;
  let menuY = position.y;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  if (menuWidth <= viewportWidth && menuX + menuWidth > viewportWidth + scrollX) {
    menuX = menuX - menuWidth;
  }

  if (menuHeight <= viewportHeight && menuY + menuHeight > viewportHeight + scrollY) {
    menuY = menuY - menuHeight;
  }

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