const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_quat',
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
            
            // 1. Load animations from mark.glb
            const animGltf = await new Promise(resolve => loader.load('/assets/characters/mark.glb', resolve));
            
            // Sanitize clips: ONLY KEEP .quaternion tracks
            const sanitizedClips = animGltf.animations.map(clip => {
              const cleanTracks = clip.tracks.filter(t => t.name.endsWith('.quaternion'));
              return new THREE.AnimationClip(clip.name, clip.duration, cleanTracks);
            });

            // 2. Load Black_M_2_Casual.glb (Mark's full body mesh)
            const markGltf = await new Promise(resolve => loader.load('/assets/characters/Black_M_2_Casual.glb', resolve));
            const model = markGltf.scene;

            // 3. Setup AnimationMixer
            const mixer = new THREE.AnimationMixer(model);
            const walkClip = sanitizedClips.find(c => c.name === 'Walk');
            const idleClip = sanitizedClips.find(c => c.name === 'Idle');
            
            if (idleClip) {
              const act = mixer.clipAction(idleClip);
              act.play();
            }

            // 4. Update mixer
            mixer.update(0.5);

            // 5. Place in world at (0, 0, 16)
            const root = new THREE.Group();
            root.position.set(0, 0, 16);
            root.rotation.y = Math.PI;
            root.add(model);
            root.updateMatrixWorld(true);

            // 6. Check bounding box and hips
            const box = new THREE.Box3().setFromObject(root);
            const hips = model.getObjectByName('Hips');
            const head = model.getObjectByName('Head');
            const hipsWorld = new THREE.Vector3();
            const headWorld = new THREE.Vector3();
            if (hips) hips.getWorldPosition(hipsWorld);
            if (head) head.getWorldPosition(headWorld);

            return {
              box: { min: box.min, max: box.max },
              height: +(box.max.y - box.min.y).toFixed(3),
              width: +(box.max.x - box.min.x).toFixed(3),
              depth: +(box.max.z - box.min.z).toFixed(3),
              hipsWorld: { x: +hipsWorld.x.toFixed(3), y: +hipsWorld.y.toFixed(3), z: +hipsWorld.z.toFixed(3) },
              headWorld: { x: +headWorld.x.toFixed(3), y: +headWorld.y.toFixed(3), z: +headWorld.z.toFixed(3) },
              hipsScale: hips ? { x: hips.scale.x, y: hips.scale.y, z: hips.scale.z } : null
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
      console.log('QUATERNIONS ONLY RESULT:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
