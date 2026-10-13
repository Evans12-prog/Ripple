const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_filter',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
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
            expression: `(() => {
              const mark = window.__mark;
              // Let's filter mark's animation mixer actions to only quaternion tracks
              const mixer = mark.mixer;
              
              // Inspect all tracks of Idle
              const gltfClips = mark.gltfAnimations || [];
              const rotOnlyClips = gltfClips.map(clip => {
                const rotTracks = clip.tracks.filter(t => t.name.endsWith('.quaternion'));
                return new THREE.AnimationClip(clip.name, clip.duration, rotTracks);
              });

              // Stop existing mixer
              mixer.stopAllAction();
              const idleAction = mixer.clipAction(rotOnlyClips[0]);
              idleAction.play();
              mixer.update(0.1);
              mark.root.updateMatrixWorld(true);

              const box = new THREE.Box3().setFromObject(mark.root);
              const hips = mark.model.getObjectByName('Hips');
              const head = mark.model.getObjectByName('Head');
              const hipsWorldPos = new THREE.Vector3();
              const headWorldPos = new THREE.Vector3();
              if (hips) hips.getWorldPosition(hipsWorldPos);
              if (head) head.getWorldPosition(headWorldPos);

              return {
                tracksKept: rotOnlyClips[0].tracks.length,
                boxMin: box.min,
                boxMax: box.max,
                boxSize: box.getSize(new THREE.Vector3()),
                hipsWorldPos: hipsWorldPos,
                headWorldPos: headWorldPos
              };
            })()`,
            returnByValue: true
          }
        }));
      }, 5000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('ROTATION ONLY FILTER RESULT:', JSON.stringify(msg.result.result.value, null, 2));
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
