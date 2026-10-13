const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_axes',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9227/json/list');
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
              model.traverse(c => { if (c.isBone) bones[c.name] = c; });

              // Let's test rotating LeftArm along local axes
              // To lower arm by 70 degrees (1.2 rad):
              // Let's test rotating along Z:
              // bones.LeftArm.rotateZ(1.2) or rotateX or rotateY
              const leftHandRest = new THREE.Vector3();
              bones.LeftHand.getWorldPosition(leftHandRest);

              // Test Z rotation
              bones.LeftArm.rotateZ(1.2);
              model.updateMatrixWorld(true);
              const leftHandZ = new THREE.Vector3();
              bones.LeftHand.getWorldPosition(leftHandZ);
              bones.LeftArm.rotateZ(-1.2); // reset

              // Test Y rotation
              bones.LeftArm.rotateY(1.2);
              model.updateMatrixWorld(true);
              const leftHandY = new THREE.Vector3();
              bones.LeftHand.getWorldPosition(leftHandY);
              bones.LeftArm.rotateY(-1.2); // reset

              // Test X rotation
              bones.LeftArm.rotateX(1.2);
              model.updateMatrixWorld(true);
              const leftHandX = new THREE.Vector3();
              bones.LeftHand.getWorldPosition(leftHandX);
              bones.LeftArm.rotateX(-1.2); // reset

              // Test LeftUpLeg swing forward (Z should move forward or backward):
              const leftFootRest = new THREE.Vector3();
              bones.LeftFoot.getWorldPosition(leftFootRest);

              bones.LeftUpLeg.rotateZ(0.6);
              model.updateMatrixWorld(true);
              const leftFootZ = new THREE.Vector3();
              bones.LeftFoot.getWorldPosition(leftFootZ);
              bones.LeftUpLeg.rotateZ(-0.6);

              bones.LeftUpLeg.rotateX(0.6);
              model.updateMatrixWorld(true);
              const leftFootX = new THREE.Vector3();
              bones.LeftFoot.getWorldPosition(leftFootX);
              bones.LeftUpLeg.rotateX(-0.6);

              bones.LeftUpLeg.rotateY(0.6);
              model.updateMatrixWorld(true);
              const leftFootY = new THREE.Vector3();
              bones.LeftFoot.getWorldPosition(leftFootY);
              bones.LeftUpLeg.rotateY(-0.6);

              return {
                arm: {
                  rest: leftHandRest,
                  rotZ: leftHandZ,
                  rotY: leftHandY,
                  rotX: leftHandX
                },
                leg: {
                  rest: leftFootRest,
                  rotZ: leftFootZ,
                  rotX: leftFootX,
                  rotY: leftFootY
                }
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
        console.log('AXIS TEST RESULTS:', JSON.stringify(msg.result.result.value, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
