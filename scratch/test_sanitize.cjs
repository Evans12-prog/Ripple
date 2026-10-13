const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_sanitize',
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
            const model = gltf.scene;

            // Sanitize animation clips: KEEP ONLY .quaternion tracks
            const sanitizedClips = gltf.animations.map(clip => {
              const cleanTracks = clip.tracks.filter(t => t.name.endsWith('.quaternion'));
              return new THREE.AnimationClip(clip.name, clip.duration, cleanTracks);
            });

            const mixer = new THREE.AnimationMixer(model);
            sanitizedClips.forEach(clip => {
              const act = mixer.clipAction(clip);
              act.play();
            });

            // Update mixer by 0.5s
            mixer.update(0.5);

            // Add model to a root at (0, 0, 16)
            const root = new THREE.Group();
            root.position.set(0, 0, 16);
            root.rotation.y = Math.PI;
            root.add(model);
            root.updateMatrixWorld(true);

            // Compute bounding box
            const box = new THREE.Box3().setFromObject(root);
            const hips = model.getObjectByName('Hips');
            const hipsWorld = new THREE.Vector3();
            if (hips) hips.getWorldPosition(hipsWorld);

            return {
              box: { min: box.min, max: box.max },
              size: {
                x: +(box.max.x - box.min.x).toFixed(3),
                y: +(box.max.y - box.min.y).toFixed(3),
                z: +(box.max.z - box.min.z).toFixed(3)
              },
              hipsWorld: { x: +hipsWorld.x.toFixed(3), y: +hipsWorld.y.toFixed(3), z: +hipsWorld.z.toFixed(3) }
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
      console.log('SANITIZED DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
