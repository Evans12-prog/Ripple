const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_arms_down',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9230/json/list');
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

              // Both arms down at sides naturally:
              bones.LeftArm.quaternion.copy(restQuats.LeftArm);
              bones.LeftArm.rotateX(1.22);
              bones.LeftArm.rotateZ(-0.06);

              bones.RightArm.quaternion.copy(restQuats.RightArm);
              bones.RightArm.rotateX(1.22);
              bones.RightArm.rotateZ(0.06);

              // Forearms relaxed
              bones.LeftForeArm.quaternion.copy(restQuats.LeftForeArm);
              bones.LeftForeArm.rotateX(0.15);

              bones.RightForeArm.quaternion.copy(restQuats.RightForeArm);
              bones.RightForeArm.rotateX(0.15);

              // Backpack
              const packGeom = new THREE.BoxGeometry(26, 38, 14);
              const packMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
              const packMesh = new THREE.Mesh(packGeom, packMat);
              packMesh.position.set(0, 10, -12);
              packMesh.castShadow = true;
              if (bones.Spine2) bones.Spine2.add(packMesh);

              // Add to scene
              const scene = window.__scene;
              if (window.__mark) scene.remove(window.__mark.root);

              const root = new THREE.Group();
              root.position.set(0, 0, 16);
              root.rotation.y = Math.PI;
              root.add(model);
              scene.add(root);

              window.__camera.position.set(0, 2.3, 20.0);
              window.__camera.lookAt(0, 1.2, 16);

              return { ready: true };
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
        }, 800);
      } else if (msg.id === 3) {
        fs.writeFileSync('scratch/snap_arms_perfect.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved scratch/snap_arms_perfect.png');
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
