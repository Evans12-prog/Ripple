const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_bench_box',
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
              const head = mark.model.getObjectByName('Head');
              const mesh = mark.model.getObjectByName('H_DDS_HighRes');
              
              const hipsWorldPos = new THREE.Vector3();
              const headWorldPos = new THREE.Vector3();
              if (hips) hips.getWorldPosition(hipsWorldPos);
              if (head) head.getWorldPosition(headWorldPos);

              return {
                modelScale: mark.model.scale,
                modelPosition: mark.model.position,
                rootScale: mark.root.scale,
                rootPosition: mark.root.position,
                hipsScale: hips ? hips.scale : null,
                hipsPosition: hips ? hips.position : null,
                hipsWorldPos: hipsWorldPos,
                headWorldPos: headWorldPos,
                skeletonBonesCount: mesh && mesh.skeleton ? mesh.skeleton.bones.length : 0,
                // Let's check mesh vertices or bounding box
                meshGeometryBox: mesh && mesh.geometry ? {
                  min: mesh.geometry.boundingBox?.min,
                  max: mesh.geometry.boundingBox?.max
                } : null
              };
            })()`,
            returnByValue: true
          }
        }));
      }, 5000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('BOX DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
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
