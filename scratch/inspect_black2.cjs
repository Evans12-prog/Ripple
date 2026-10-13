const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_black2',
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
            
            const gltf = await new Promise(resolve => loader.load('/assets/characters/Black_M_2_Casual.glb', resolve));
            const meshes = [];
            gltf.scene.traverse(c => {
              if (c.isMesh) {
                c.geometry.computeBoundingBox();
                meshes.push({
                  name: c.name,
                  type: c.type,
                  scale: c.scale,
                  pos: c.position,
                  geomBox: {
                    min: c.geometry.boundingBox.min,
                    max: c.geometry.boundingBox.max
                  }
                });
              }
            });

            const hips = gltf.scene.getObjectByName('Hips');
            const box = new THREE.Box3().setFromObject(gltf.scene);

            return {
              meshes,
              animationsCount: gltf.animations.length,
              animNames: gltf.animations.map(a => a.name),
              hipsPos: hips ? hips.position : null,
              hipsScale: hips ? hips.scale : null,
              overallBox: { min: box.min, max: box.max }
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
      console.log('BLACK_M_2 DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
