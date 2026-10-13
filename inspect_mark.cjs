const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_mark2',
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
              if (!mark || !scene || !camera) {
                return { error: "Objects not ready on window" };
              }
              const markMeshes = [];
              mark.root.traverse(child => {
                if (child.isMesh) {
                  markMeshes.push({
                    name: child.name,
                    visible: child.visible,
                    materialVisible: child.material ? child.material.visible : false,
                    materialOpacity: child.material ? child.material.opacity : false,
                    color: child.material?.color ? '#' + child.material.color.getHexString() : null,
                    parent: child.parent ? child.parent.name : null
                  });
                }
              });

              const studentsGroup = scene.getObjectByName('BackgroundStudents');
              const studentCount = studentsGroup ? studentsGroup.children.length : 0;

              return {
                cameraPos: camera.position,
                markRootPos: mark.root.position,
                markRootVisible: mark.root.visible,
                markMeshesCount: markMeshes.length,
                markMeshes: markMeshes,
                backgroundStudentsCount: studentCount
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
        console.log('MARK INSPECTION:', JSON.stringify(msg.result.result.value, null, 2));
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
