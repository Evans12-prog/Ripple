const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_check_console',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9225/json/list');
    const pages = await listRes.json();
    const ripplePage = pages.find((p) => p.url.includes('5173'));

    const ws = new WebSocket(ripplePage.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const screen = document.getElementById('loading-screen');
              const status = document.getElementById('loading-status')?.textContent;
              const bar = document.getElementById('loading-bar')?.style.width;
              return {
                screenExists: !!screen,
                screenOpacity: screen ? getComputedStyle(screen).opacity : null,
                screenDisplay: screen ? getComputedStyle(screen).display : null,
                status,
                bar,
                markLoaded: !!window.__mark,
                sceneLoaded: !!window.__scene
              };
            })()`,
            returnByValue: true
          }
        }));
      }, 3000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded') {
        console.log('BROWSER LOG:', msg.params.message.text);
      }
      if (msg.id === 3) {
        console.log('DOM STATE:', JSON.stringify(msg.result.result.value, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
