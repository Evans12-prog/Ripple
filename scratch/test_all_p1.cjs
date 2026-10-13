const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_all_p1',
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
            const { createCharacter } = await import('/src/player/createPlayer.js');
            const scene = window.__scene;
            
            // Remove previous Mark & background students
            if (window.__mark) scene.remove(window.__mark.root);
            const oldBg = scene.getObjectByName('BackgroundStudents');
            if (oldBg) scene.remove(oldBg);

            // 1. Mark
            const mark = createCharacter({ isMark: true });
            mark.root.position.set(0, 0, 16);
            mark.root.rotation.y = Math.PI;
            scene.add(mark.root);
            window.__mark = mark;

            // 2. Background students group
            const bgGroup = new THREE.Group();
            bgGroup.name = 'BackgroundStudents';
            scene.add(bgGroup);

            // Kwame (chatting)
            const s1 = createCharacter({ isMark: false, hoodieColor: 0x0284c7, pantsColor: 0x334155 });
            s1.root.position.set(-8.5, 0, -3.2);
            s1.root.rotation.y = 0.8;
            bgGroup.add(s1.root);

            // Kofi (chatting)
            const s2 = createCharacter({ isMark: false, hoodieColor: 0x64748b, pantsColor: 0x1e293b, hasBackpack: false });
            s2.root.position.set(-7.7, 0, -2.2);
            s2.root.rotation.y = -2.3;
            bgGroup.add(s2.root);

            // Yaw (seated on bench)
            const s3 = createCharacter({ isMark: false, hoodieColor: 0x059669, pantsColor: 0x475569 });
            s3.root.position.set(-16.0, 0, 5.0);
            s3.root.rotation.y = 0;
            // Seated pose
            s3.hips.position.y = 0.55;
            s3.leftLeg.hipJoint.rotation.x = -1.45;
            s3.rightLeg.hipJoint.rotation.x = -1.45;
            s3.leftLeg.calfJoint.rotation.x = 1.45;
            s3.rightLeg.calfJoint.rotation.x = 1.45;
            s3.torso.rotation.x = 0.2;
            s3.head.rotation.x = 0.3;
            bgGroup.add(s3.root);

            // Akoto (patrolling)
            const s4 = createCharacter({ isMark: false, hoodieColor: 0xd97706, pantsColor: 0x1e293b });
            s4.root.position.set(-4.0, 0, 8.0);
            s4.root.rotation.y = Math.PI / 2;
            bgGroup.add(s4.root);

            // Kweku (walking promenade)
            const s5 = createCharacter({ isMark: false, hoodieColor: 0x7c3aed, pantsColor: 0x334155 });
            s5.root.position.set(2.2, 0, 10.0);
            s5.root.rotation.y = Math.PI;
            bgGroup.add(s5.root);

            // Nana (stairs)
            const s6 = createCharacter({ isMark: false, hoodieColor: 0x0d9488, pantsColor: 0x1e293b });
            s6.root.position.set(4.5, 0.4, -29.0);
            s6.root.rotation.y = 2.8;
            bgGroup.add(s6.root);

            // Camera setup
            window.__camera.position.set(0, 3.2, 21.0);
            window.__camera.lookAt(0, 1.4, 16);

            return {
              markVisible: mark.root.visible,
              bgCount: bgGroup.children.length
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
      fs.writeFileSync('scratch/snap_all_p1.png', Buffer.from(msg.result.data, 'base64'));
      console.log('Saved scratch/snap_all_p1.png');
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
