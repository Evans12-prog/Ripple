const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_top',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const ripplePage = pages.find((p) => p.url.includes('5173'));
  const ws = new WebSocket(ripplePage.webSocketDebuggerUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const mark = window.__mark;
            return mark.model.children.map(c => ({
              name: c.name,
              type: c.type,
              pos: c.position,
              scale: c.scale,
              rot: c.rotation,
              children: c.children.map(ch => ({ name: ch.name, type: ch.type, pos: ch.position, scale: ch.scale }))
            }));
          })()`,
          returnByValue: true
        }
      }));
    }, 3000);
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id === 2) {
      console.log('TOP CHILDREN:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
