const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_verify_game',
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

              const markBox = new THREE.Box3().setFromObject(mark.root);

              const bgStudents = scene.getObjectByName('BackgroundStudents');
              const studentsData = [];
              if (bgStudents) {
                bgStudents.children.forEach(c => {
                  const b = new THREE.Box3().setFromObject(c);
                  studentsData.push({
                    name: c.name,
                    pos: { x: +c.position.x.toFixed(2), y: +c.position.y.toFixed(2), z: +c.position.z.toFixed(2) },
                    visible: c.visible,
                    height: +(b.max.y - b.min.y).toFixed(2),
                    boxMin: { x: +b.min.x.toFixed(2), y: +b.min.y.toFixed(2), z: +b.min.z.toFixed(2) },
                    boxMax: { x: +b.max.x.toFixed(2), y: +b.max.y.toFixed(2), z: +b.max.z.toFixed(2) }
                  });
                });
              }

              return {
                mark: {
                  visible: mark.root.visible,
                  pos: { x: +mark.root.position.x.toFixed(2), y: +mark.root.position.y.toFixed(2), z: +mark.root.position.z.toFixed(2) },
                  height: +(markBox.max.y - markBox.min.y).toFixed(2),
                  boxMin: { x: +markBox.min.x.toFixed(2), y: +markBox.min.y.toFixed(2), z: +markBox.min.z.toFixed(2) },
                  boxMax: { x: +markBox.max.x.toFixed(2), y: +markBox.max.y.toFixed(2), z: +markBox.max.z.toFixed(2) }
                },
                studentsCount: studentsData.length,
                studentsData,
                timeText: document.getElementById('hud-time')?.textContent,
                moneyText: document.getElementById('hud-money')?.textContent,
                objectiveTitle: document.getElementById('obj-title')?.textContent,
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
        console.log('GAMEPLAY VERIFICATION:', JSON.stringify(msg.result.result.value, null, 2));
        // Take screenshot
        ws.send(JSON.stringify({
          id: 3,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      } else if (msg.id === 3) {
        fs.writeFileSync('scratch/final_gameplay_verified.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/final_gameplay_verified.png');
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
