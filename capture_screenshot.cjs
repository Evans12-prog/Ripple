const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_snap2',
  '--window-size=1280,800',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const ripplePage = pages.find((p) => p.url.includes('5173'));
    if (!ripplePage) throw new Error('Ripple page not found');

    const ws = new WebSocket(ripplePage.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      // Wait for Mark and campus to load (10s) and capture the gameplay screenshot
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 10000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2 && msg.result && msg.result.data) {
        fs.writeFileSync('screenshot_gameplay.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Successfully saved screenshot_gameplay.png, size:', msg.result.data.length);
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
