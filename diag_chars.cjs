const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_diag_chars',
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
              const scene = window.__scene;
              const camera = window.__camera;
              
              // Get world bounding box of Mark
              const markBox = new THREE.Box3().setFromObject(mark.root);
              const mesh = mark.model.getObjectByName('H_DDS_HighRes');
              const meshBox = mesh ? new THREE.Box3().setFromObject(mesh) : null;
              
              // Check students in scene
              const bgGroup = scene.getObjectByName('BackgroundStudents');
              const studentBoxes = [];
              if (bgGroup) {
                bgGroup.children.forEach(c => {
                  const b = new THREE.Box3().setFromObject(c);
                  studentBoxes.push({
                    name: c.name,
                    pos: c.position,
                    visible: c.visible,
                    min: b.min,
                    max: b.max,
                    isEmpty: b.isEmpty()
                  });
                });
              }

              return {
                markRootPos: mark.root.position,
                markBoundingBox: { min: markBox.min, max: markBox.max },
                markMeshBox: meshBox ? { min: meshBox.min, max: meshBox.max } : null,
                meshMaterial: mesh ? {
                  type: mesh.material.type,
                  transparent: mesh.material.transparent,
                  opacity: mesh.material.opacity,
                  visible: mesh.material.visible,
                  hasMap: !!mesh.material.map,
                  side: mesh.material.side
                } : null,
                studentBoxes: studentBoxes
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
        console.log('CHARACTER DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
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
