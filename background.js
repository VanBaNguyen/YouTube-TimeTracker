console.log('YouTube Time Tracker background loaded!');

browser.tabs.onActivated.addListener(() => {
  console.log('Tab activated');
  checkState();
});

browser.tabs.onUpdated.addListener(() => {
  console.log('Tab updated');
  checkState();
});

browser.windows.onFocusChanged.addListener(() => {
  console.log('Window focus changed');
  checkState();
});

let timer = null;
let startTime = null;
let totalTime = 0;

// Restore total time on startup
browser.storage.local.get('youtubeTime').then((result) => {
  totalTime = result.youtubeTime || 0;
});

// Helper function to check if current active tab is YouTube
function isYouTubeTab(tab) {
  return tab && tab.url && tab.url.startsWith("https://www.youtube.com");
}

// Start the timer if not already running
function startTimer() {
  if (!timer) {
    startTime = Date.now();
    timer = setInterval(() => {}, 1000); // Dummy interval
  }
}

// Stop the timer and accumulate time
function stopTimer() {
  if (timer) {
    totalTime += Date.now() - startTime;
    browser.storage.local.set({ youtubeTime: totalTime });
    clearInterval(timer);
    timer = null;
  }
}

// Check tab/window state and control timer accordingly
async function checkState() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let activeTab = tabs.length ? tabs[0] : null;
  if (isYouTubeTab(activeTab)) {
    startTimer();
  } else {
    stopTimer();
  }
}

// Listen for relevant tab and window events
browser.tabs.onActivated.addListener(checkState);
browser.tabs.onUpdated.addListener(checkState);
browser.windows.onFocusChanged.addListener(checkState);

// Check state when background starts
checkState();

// Expose info for popup: is timer running, and how much "live" time is there?
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "getLiveTimer") {
    let running = !!timer;
    let live = 0;
    if (running && startTime) {
      live = Date.now() - startTime;
    }
    sendResponse({ running, live });
  } else if (msg && msg.reset) {
    // Reset everything!
    totalTime = 0;
    startTime = timer ? Date.now() : null;
    browser.storage.local.set({ youtubeTime: 0 });
    sendResponse({ success: true });
  }
  // Return true to indicate async response, if using async code
  return true;
});

