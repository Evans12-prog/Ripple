const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_inspect_skin',
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
          expression: `(() => {
            const mark = window.__mark;
            const mesh = mark.model.getObjectByName('H_DDS_HighRes');
            const hips = mark.model.getObjectByName('Hips');
            
            // What happens if we stop the animation mixer?
            // When does Mark blow up? Is he blown up before animation mixer runs or after?
            return {
              meshBindMatrix: Array.from(mesh.bindMatrix.elements),
              meshBindMatrixInverse: Array.from(mesh.bindMatrixInverse.elements),
              hipsParent: hips.parent ? hips.parent.name : null,
              meshParent: mesh.parent ? mesh.parent.name : null,
              boneCount: mesh.skeleton.bones.length,
              hipsWorldMatrix: Array.from(hips.matrixWorld.elements)
            };
          })()`,
          returnByValue: true
        }
      }));
    }, 3000);
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id === 2) {
      console.log('SKIN DIAGNOSTIC:', JSON.stringify(msg.result.result.value, null, 2));
      chrome.kill();
      process.exit(0);
    }
  };
}, 1500);
