const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_other',
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
            
            const inspect = async (url) => {
              try {
                const gltf = await new Promise((res, rej) => loader.load(url, res, undefined, rej));
                const box = new THREE.Box3().setFromObject(gltf.scene);
                return {
                  url,
                  anims: gltf.animations.map(a => a.name),
                  box: { min: box.min, max: box.max },
                  height: +(box.max.y - box.min.y).toFixed(3)
                };
              } catch (e) {
                return { url, error: e.message };
              }
            };

            return {
              soldier: await inspect('/assets/characters/Soldier.glb'),
              boy: await inspect('/assets/characters/boy.glb'),
              paulo: await inspect('/assets/characters/paulo_character.glb')
            };
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
      console.log('OTHER MODELS DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
