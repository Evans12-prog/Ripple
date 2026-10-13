const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_hierarchy',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
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
              function dump(node, depth = 0) {
                const info = {
                  indent: '  '.repeat(depth),
                  name: node.name,
                  type: node.type,
                  scale: { x: +node.scale.x.toFixed(4), y: +node.scale.y.toFixed(4), z: +node.scale.z.toFixed(4) },
                  pos: { x: +node.position.x.toFixed(4), y: +node.position.y.toFixed(4), z: +node.position.z.toFixed(4) },
                  rot: { x: +node.rotation.x.toFixed(4), y: +node.rotation.y.toFixed(4), z: +node.rotation.z.toFixed(4) }
                };
                let res = [info];
                for (const c of node.children) {
                  res = res.concat(dump(c, depth + 1));
                }
                return res;
              }
              return dump(mark.model);
            })()`,
            returnByValue: true
          }
        }));
      }, 3000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('HIERARCHY:');
        msg.result.result.value.forEach(item => {
          console.log(`${item.indent}${item.name} (${item.type}) pos:[${item.pos.x},${item.pos.y},${item.pos.z}] scale:[${item.scale.x},${item.scale.y},${item.scale.z}] rot:[${item.rot.x},${item.rot.y},${item.rot.z}]`);
        });
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
