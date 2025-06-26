function format(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSec % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

async function updateTimer() {
  browser.runtime.sendMessage("getLiveTimer").then(response => {
    let running = response.running;
    let live = response.live || 0;
    let today = response.today;
    let history = response.history || {};
    let total = (history[today] || 0) + (running ? live : 0);
    document.getElementById('timer').textContent = format(total);
    // Update history panel if visible
    if (document.getElementById('history-panel').style.display !== 'none') {
      showHistory(history, today);
    }
  });
}

function showHistory(history, today) {
  let list = document.getElementById('history-list');
  list.innerHTML = '';
  // Sort days descending (most recent first)
  Object.keys(history).sort((a, b) => b.localeCompare(a)).forEach(date => {
    let li = document.createElement('li');
    li.textContent = `${date}${date===today ? " (today)" : ""}: ${format(history[date] || 0)}`;
    list.appendChild(li);
  });
}

document.getElementById('reset').addEventListener('click', async () => {
  await browser.runtime.sendMessage({ reset: true });
  updateTimer();
});

document.getElementById('history-btn').addEventListener('click', async () => {
  let panel = document.getElementById('history-panel');
  if (panel.style.display === 'none') {
    let response = await browser.runtime.sendMessage("getLiveTimer");
    showHistory(response.history, response.today);
    panel.style.display = '';
  } else {
    panel.style.display = 'none';
  }
});

document.getElementById('clear-history-btn').addEventListener('click', () => {
  document.getElementById('clear-confirm').style.display = '';
});

document.getElementById('confirm-no').addEventListener('click', () => {
  document.getElementById('clear-confirm').style.display = 'none';
});

document.getElementById('confirm-yes').addEventListener('click', async () => {
  document.getElementById('clear-confirm').style.display = 'none';
  await browser.runtime.sendMessage({ clearHistory: true });
  // Update history panel if open
  let panel = document.getElementById('history-panel');
  if (panel.style.display !== 'none') {
    let response = await browser.runtime.sendMessage("getLiveTimer");
    showHistory(response.history, response.today);
  }
  updateTimer();
});

setInterval(updateTimer, 1000);
updateTimer();
