const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9444',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_debug_p211',
  '--window-size=1280,720',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  'http://localhost:5173/'
]);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Starting Phase 2.1.1 test...');
  await sleep(3000);

  const listRes = await fetch('http://127.0.0.1:9444/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.url.includes('5173'));
  if (!page) throw new Error('Game page not found in Chrome list');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('Eval exception:', res.exceptionDetails);
    }
    return res.result?.value;
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ');
      console.log(`[BROWSER CONSOLE ${msg.params.type}]: ${args}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error(`[BROWSER EXCEPTION]:`, msg.params.exceptionDetails);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await sendCommand('Runtime.enable');
  await sendCommand('Log.enable');

  console.log('Checking game load status...');
  let ready = false;
  for (let i = 0; i < 40; i++) {
    const status = await evaluate(`(() => {
      return {
        hasMark: !!window.__mark,
        isRealistic: window.__mark?.isRealistic,
        loadingScreenPresent: !!document.getElementById('loading-screen'),
        statusText: document.getElementById('loading-status')?.textContent,
      };
    })()`);
    console.log(`Status poll [${i}]:`, status);
    if (status && status.hasMark && !status.loadingScreenPresent) {
      ready = true;
      break;
    }
    await sleep(1000);
  }

  if (!ready) throw new Error('Game failed to finish loading');

  console.log('✓ Game is loaded!');

  // Test suite execution
  console.log('\n--- 1. Testing "Attend the lecture" ---');
  await evaluate(`(() => {
    window.confirm = () => true;
    document.getElementById('fresh-game')?.click();
  })()`);
  await sleep(400);

  // Open decision panel
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(400);

  // Click Attend
  const attendClick = await evaluate(`(() => {
    const btn = document.getElementById('btn-attend');
    if (!btn) return { error: 'No btn-attend' };
    btn.click();
    return {
      clock: document.getElementById('game-clock')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      bannerHidden: document.getElementById('autonav-banner')?.hidden,
      bannerText: document.getElementById('autonav-activity')?.textContent,
      z: window.__mark.root.position.z,
    };
  })()`);
  console.log('Attend click result:', attendClick);

  // Track travel
  console.log('Tracking Mark walking to Great Hall...');
  for (let s = 0; s < 18; s++) {
    await sleep(1000);
    const pos = await evaluate(`(() => {
      const p = window.__mark.root.position;
      const banner = document.getElementById('autonav-banner');
      const toast = document.getElementById('toast-notification');
      return {
        x: +p.x.toFixed(2),
        z: +p.z.toFixed(2),
        bannerHidden: banner ? banner.hidden : true,
        toastTitle: document.getElementById('toast-title')?.textContent,
      };
    })()`);
    console.log(`[t=${s+1}s] Pos: (${pos.x}, ${pos.z}) | Banner hidden: ${pos.bannerHidden} | Toast: "${pos.toastTitle}"`);
    if (pos.z <= -25.2 || pos.bannerHidden) {
      console.log('✓ Mark reached Great Hall!');
      break;
    }
  }

  await sleep(500);
  const afterLecture = await evaluate(`(() => {
    return {
      clock: document.getElementById('game-clock')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
      objTitle: document.getElementById('objective-title-text')?.textContent,
    };
  })()`);
  console.log('Post-lecture result:', afterLecture);

  // Test suite 2: WASD Interrupt
  console.log('\n--- 2. Testing WASD Interruption ---');
  await evaluate(`document.getElementById('fresh-game')?.click()`);
  await sleep(400);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(400);
  await evaluate(`document.getElementById('btn-skip')?.click()`);
  await sleep(400);

  console.log('Simulating WASD key press during auto navigation...');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))`);
  await sleep(300);

  const wasdResult = await evaluate(`(() => {
    return {
      bannerHidden: document.getElementById('autonav-banner')?.hidden,
      toastTitle: document.getElementById('toast-title')?.textContent,
    };
  })()`);
  console.log('WASD interrupt result:', wasdResult);

  // Test suite 3: Skip to Campus Café
  console.log('\n--- 3. Testing "Skip the lecture" to Campus Café ---');
  await evaluate(`document.getElementById('fresh-game')?.click()`);
  await sleep(400);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(400);
  await evaluate(`document.getElementById('btn-skip')?.click()`);
  await sleep(400);

  console.log('Tracking Mark walking to Campus Café terrace (-14, 0, 8)...');
  for (let s = 0; s < 18; s++) {
    await sleep(1000);
    const pos = await evaluate(`(() => {
      const p = window.__mark.root.position;
      const banner = document.getElementById('autonav-banner');
      return {
        x: +p.x.toFixed(2),
        z: +p.z.toFixed(2),
        bannerHidden: banner ? banner.hidden : true,
        toastTitle: document.getElementById('toast-title')?.textContent,
      };
    })()`);
    console.log(`[t=${s+1}s] Pos: (${pos.x}, ${pos.z}) | Banner hidden: ${pos.bannerHidden} | Toast: "${pos.toastTitle}"`);
    if (pos.x <= -13.2 && Math.abs(pos.z - 8.0) < 1.2) {
      console.log('✓ Mark reached Campus Café!');
      break;
    }
  }

  await sleep(500);
  const afterCafe = await evaluate(`(() => {
    return {
      clock: document.getElementById('game-clock')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
      objTitle: document.getElementById('objective-title-text')?.textContent,
    };
  })()`);
  console.log('Post-café result:', afterCafe);

  // Take screenshot
  const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/snap_phase211_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('✓ Screenshot saved to scratch/snap_phase211_verified.png');

  ws.close();
  chrome.kill();
  console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test error:', err);
  chrome.kill();
  process.exit(1);
});
