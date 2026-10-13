const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_anat',
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

            // Cache rest poses of all bones
            const bones = {};
            const restQuats = {};
            const restPositions = {};

            model.traverse(c => {
              if (c.isBone) {
                bones[c.name] = c;
                restQuats[c.name] = c.quaternion.clone();
                restPositions[c.name] = c.position.clone();
              }
              if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });

            // Subtle backpack accessory attached to Spine2
            // Since Spine2 is under Hips (scale 0.01), child objects must have appropriate scale!
            // In Spine2 local space: 1 unit = 100 meters, so 0.01 = 1 meter!
            // Wait, let's verify backpack size:
            const pack = new THREE.Mesh(
              new THREE.BoxGeometry(28, 40, 16), // 28cm x 40cm x 16cm in armature centimeter units
              new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
            );
            // Position on back:
            pack.position.set(0, 10, -12);
            if (bones.Spine2) bones.Spine2.add(pack);

            // Animate idle pose test
            const animTime = 1.5;
            const breath = Math.sin(animTime * 2.2);

            // Natural resting arms: In rest pose, arms are in T-pose (spread horizontally).
            // Let's bring arms down naturally to the sides!
            // In VALID rig:
            // Let's test rotating LeftArm and RightArm down towards body!
            const qTemp = new THREE.Quaternion();
            const axisZ = new THREE.Vector3(0, 0, 1);
            const axisX = new THREE.Vector3(1, 0, 0);
            const axisY = new THREE.Vector3(0, 1, 0);

            // Replace in scene
            const scene = window.__scene;
            const oldMark = window.__mark;
            if (oldMark) scene.remove(oldMark.root);

            const root = new THREE.Group();
            root.position.set(0, 0, 16);
            root.rotation.y = Math.PI;
            root.add(model);
            scene.add(root);

            window.__camera.position.set(0, 2.0, 20.5);
            window.__camera.lookAt(0, 1.2, 16);

            return {
              hipsRestPos: restPositions.Hips,
              totalBones: Object.keys(bones).length
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
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 1000);
    } else if (msg.id === 3) {
      fs.writeFileSync('scratch/snap_anat_idle.png', Buffer.from(msg.result.data, 'base64'));
      console.log('Saved scratch/snap_anat_idle.png');
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
