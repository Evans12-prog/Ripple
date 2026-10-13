const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_p1',
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
          expression: `(async () => {
            const { createCharacter } = await import('/src/player/createPlayer.js');
            const scene = window.__scene;
            
            // Remove previous Mark
            if (window.__mark) scene.remove(window.__mark.root);
            
            // Remove any background students for a clean test
            const bg = scene.getObjectByName('BackgroundStudents');
            if (bg) scene.remove(bg);

            const char = createCharacter({ isMark: true });
            char.root.position.set(0, 0, 16);
            char.root.rotation.y = Math.PI;
            scene.add(char.root);

            window.__mark = char;

            // Camera follow
            window.__camera.position.set(0, 2.8, 20.2);
            window.__camera.lookAt(0, 1.4, 16);

            return { success: true };
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    }, 2000);
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id === 2) {
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 1000);
    } else if (msg.id === 3) {
      fs.writeFileSync('scratch/snap_p1_char.png', Buffer.from(msg.result.data, 'base64'));
      console.log('Saved scratch/snap_p1_char.png');
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
