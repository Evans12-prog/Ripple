const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_compare',
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
            
            const [markGltf, blackGltf] = await Promise.all([
              new Promise(res => loader.load('/assets/characters/mark.glb', res)),
              new Promise(res => loader.load('/assets/characters/Black_M_2_Casual.glb', res))
            ]);

            const getBones = (scene) => {
              const b = {};
              scene.traverse(c => {
                if (c.isBone) b[c.name] = {
                  pos: c.position.toArray().map(v => +v.toFixed(3)),
                  rot: [c.rotation.x, c.rotation.y, c.rotation.z].map(v => +v.toFixed(3)),
                  quat: c.quaternion.toArray().map(v => +v.toFixed(3)),
                  scale: c.scale.toArray().map(v => +v.toFixed(3))
                };
              });
              return b;
            };

            return {
              markBones: getBones(markGltf.scene),
              blackBones: getBones(blackGltf.scene)
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
      console.log('BONES COMPARISON:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
