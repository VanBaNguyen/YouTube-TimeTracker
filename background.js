let timer = null;
let startTime = null;
let today = getTodayStr();
let history = {};

// Utility
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Load history from storage on startup
browser.storage.local.get(['history']).then((result) => {
  history = result.history || {};
  today = getTodayStr();
  if (!(today in history)) {
    history[today] = 0;
    browser.storage.local.set({ history });
  }
});

// Helper: check if a tab is YouTube
function isYouTubeTab(tab) {
  return tab && tab.url && tab.url.startsWith("https://www.youtube.com");
}

// Start timer
function startTimer() {
  if (!timer) {
    startTime = Date.now();
    timer = setInterval(() => {}, 1000);
  }
}

// Stop timer and accumulate time
function stopTimer() {
  if (timer) {
    checkDayRollover();
    history[today] += Date.now() - startTime;
    browser.storage.local.set({ history });
    clearInterval(timer);
    timer = null;
  }
}

// Rollover to a new day if needed
function checkDayRollover() {
  const nowDay = getTodayStr();
  if (today !== nowDay) {
    today = nowDay;
    if (!(today in history)) history[today] = 0;
    browser.storage.local.set({ history });
    startTime = Date.now();
  }
}

// Main check
async function checkState() {
  let tabs = await browser.tabs.query({ active: true, currentWindow: true });
  let activeTab = tabs.length ? tabs[0] : null;
  if (isYouTubeTab(activeTab)) {
    checkDayRollover();
    startTimer();
  } else {
    stopTimer();
  }
}

// Listeners
browser.tabs.onActivated.addListener(checkState);
browser.tabs.onUpdated.addListener(checkState);
browser.windows.onFocusChanged.addListener(checkState);
checkState();

// Messaging: send live timer, history, clear history
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "getLiveTimer") {
    checkDayRollover();
    let running = !!timer;
    let live = 0;
    if (running && startTime) {
      live = Date.now() - startTime;
    }
    sendResponse({ running, live, today, history });
  } else if (msg && msg.reset) {
    history[today] = 0;
    startTime = timer ? Date.now() : null;
    browser.storage.local.set({ history });
    sendResponse({ success: true });
  } else if (msg && msg.clearHistory) {
    history = {};
    history[getTodayStr()] = 0;
    today = getTodayStr();
    startTime = timer ? Date.now() : null;
    browser.storage.local.set({ history });
    sendResponse({ success: true });
  }
  return true;
});
