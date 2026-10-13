const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_snap_rest',
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
            const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
            const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
            
            const loader = new GLTFLoader();
            loader.setMeshoptDecoder(MeshoptDecoder);
            
            const gltf = await new Promise(res => loader.load('/assets/characters/Black_M_2_Casual.glb', res));
            const model = gltf.scene;

            // Clear previous Mark and add Black_M_2
            const scene = window.__scene;
            const mark = window.__mark;
            if (mark) scene.remove(mark.root);

            const testRoot = new THREE.Group();
            testRoot.position.set(0, 0, 16);
            testRoot.rotation.y = Math.PI;
            testRoot.add(model);
            scene.add(testRoot);

            window.__camera.position.set(0, 1.5, 19);
            window.__camera.lookAt(0, 1.2, 16);

            return { added: true };
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
      fs.writeFileSync('scratch/snap_black2_rest.png', Buffer.from(msg.result.data, 'base64'));
      console.log('Saved scratch/snap_black2_rest.png');
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
