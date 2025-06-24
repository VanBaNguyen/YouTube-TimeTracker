function format(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSec % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

async function updateTimer() {
  // Get the stored time
  const result = await browser.storage.local.get(['youtubeTime', 'date']);
  let baseTime = result.youtubeTime || 0;
  let date = result.date || "";

  // Ask background if timer is running and if so, get live time
  browser.runtime.sendMessage("getLiveTimer").then(response => {
    let running = response.running;
    let live = response.live || 0;
    let total = baseTime + (running ? live : 0);
    document.getElementById('timer').textContent = format(total);
    document.getElementById('date').textContent = date;
  });
}

document.getElementById('reset').addEventListener('click', async () => {
  await browser.runtime.sendMessage({ reset: true });
  updateTimer();
});

interval = setInterval(updateTimer, 1000);
updateTimer();
