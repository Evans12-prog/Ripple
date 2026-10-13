const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_hips',
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
              const hips = mark.model.getObjectByName('Hips');
              const spine = mark.model.getObjectByName('Spine');
              
              // Find all tracks from the GLTF animations if available
              // Or check all bones and their local transforms
              const bonesInfo = [];
              mark.model.traverse(c => {
                if (c.isBone) {
                  bonesInfo.push({
                    name: c.name,
                    pos: { x: c.position.x, y: c.position.y, z: c.position.z },
                    scale: { x: c.scale.x, y: c.scale.y, z: c.scale.z }
                  });
                }
              });

              return {
                hipsRest: bonesInfo.find(b => b.name === 'Hips'),
                spineRest: bonesInfo.find(b => b.name === 'Spine'),
                leftUpLegRest: bonesInfo.find(b => b.name === 'LeftUpLeg'),
                totalBones: bonesInfo.length,
                markModelScale: { x: mark.model.scale.x, y: mark.model.scale.y, z: mark.model.scale.z }
              };
            })()`,
            returnByValue: true
          }
        }));
      }, 4000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('BONES DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
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
