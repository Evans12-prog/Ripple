const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_sky',
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
            const scene = window.__scene;
            const bigObjects = [];
            scene.traverse(c => {
              if (c.isMesh) {
                const box = new THREE.Box3().setFromObject(c);
                if (box.max.y > 10 || box.min.y < -10 || (box.max.z - box.min.z) > 40) {
                  bigObjects.push({
                    name: c.name,
                    parent: c.parent ? c.parent.name : null,
                    min: box.min,
                    max: box.max,
                    sizeY: +(box.max.y - box.min.y).toFixed(1),
                    material: c.material ? c.material.name || c.material.type : null
                  });
                }
              }
            });
            return bigObjects;
          })()`,
          returnByValue: true
        }
      }));
    }, 2000);
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id === 2) {
      console.log('BIG OBJECTS:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
