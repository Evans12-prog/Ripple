const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_fresh',
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
            
            const gltf = await new Promise(resolve => loader.load('/assets/characters/mark.glb', resolve));
            const hips = gltf.scene.getObjectByName('Hips');
            
            // Check animation tracks
            const animTracks = gltf.animations.map(a => ({
              name: a.name,
              tracks: a.tracks.map(t => ({
                name: t.name,
                type: t.ValueTypeName,
                values0_5: Array.from(t.values.slice(0, 5))
              })).filter(t => t.name.includes('Hips') || t.name.includes('position'))
            }));

            return {
              rawHipsPos: hips ? { x: hips.position.x, y: hips.position.y, z: hips.position.z } : null,
              rawHipsRot: hips ? { x: hips.rotation.x, y: hips.rotation.y, z: hips.rotation.z } : null,
              animTracks
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
      console.log('RAW GLTF DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
