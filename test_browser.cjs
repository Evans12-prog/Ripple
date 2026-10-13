const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_debug2',
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
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      console.log('Listening for browser logs...');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 10) {
        console.log('DOM Evaluation result:', msg.result.result);
        chrome.kill();
        process.exit(0);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[LOG]', msg.params.type, msg.params.args.map((a) => a.value || a.description || ''));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception);
      }
    };

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: { expression: 'document.querySelector("#phase-two-ui") ? "UI_FOUND" : "UI_NOT_FOUND: " + document.body.innerHTML' }
      }));
    }, 12000);
  } catch (e) {
    console.error('Error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
