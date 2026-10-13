const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_black2_anim',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9226/json/list');
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
              model.traverse(c => {
                if (c.isBone) bones[c.name] = c;
              });

              // Check rest rotations
              return {
                leftArm: {
                  rot: [bones.LeftArm.rotation.x, bones.LeftArm.rotation.y, bones.LeftArm.rotation.z],
                  quat: bones.LeftArm.quaternion.toArray()
                },
                rightArm: {
                  rot: [bones.RightArm.rotation.x, bones.RightArm.rotation.y, bones.RightArm.rotation.z],
                  quat: bones.RightArm.quaternion.toArray()
                },
                leftUpLeg: {
                  rot: [bones.LeftUpLeg.rotation.x, bones.LeftUpLeg.rotation.y, bones.LeftUpLeg.rotation.z],
                  quat: bones.LeftUpLeg.quaternion.toArray()
                },
                rightUpLeg: {
                  rot: [bones.RightUpLeg.rotation.x, bones.RightUpLeg.rotation.y, bones.RightUpLeg.rotation.z],
                  quat: bones.RightUpLeg.quaternion.toArray()
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
        console.log('ARM & LEG REST ORIENTATION:', JSON.stringify(msg.result.result.value, null, 2));
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
