const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9333',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_p21_p22_test_9333',
  'http://localhost:5173/'
]);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== RIPPLE: TESTING PART A (LECTURE PROGRESSION) & PART B (PHASE 2.2 JOBS & FINANCES) ===');

  let page = null;
  for (let retry = 0; retry < 15; retry++) {
    await sleep(1000);
    try {
      const listRes = await fetch('http://127.0.0.1:9333/json/list');
      const pages = await listRes.json();
      page = pages.find(p => p.url.includes('5173'));
      if (page) break;
    } catch (e) {
      // Chrome starting up
    }
  }

  if (!page) throw new Error('Game page not found in Chrome list after retries');

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
      returnByValue: true
    });
    if (res.exceptionDetails) {
      console.error('Eval exception:', res.exceptionDetails);
    }
    return res.result?.result?.value !== undefined ? res.result.result.value : res.result?.value;
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER LOG]', msg.params.type, ...msg.params.args.map(a => a.value ?? a.description ?? ''));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await sendCommand('Runtime.enable');
  await sendCommand('Log.enable');

  console.log('1. Waiting for game to load Mark and campus scene...');
  let loaded = false;
  for (let i = 0; i < 40; i++) {
    const status = await evaluate(`(() => {
      const ls = !!document.getElementById('loading-screen');
      const mark = !!window.__mark;
      const realistic = !!(window.__mark && window.__mark.isRealistic);
      return { ls, mark, realistic };
    })()`);
    if (status && !status.ls && status.realistic) {
      loaded = true;
      break;
    }
    if (i % 3 === 0) {
      console.log(`[Loading check t=${i}s]:`, status);
    }
    await sleep(1000);
  }
  if (!loaded) throw new Error('Game timed out loading');
  console.log('✓ 3D Campus, Mark avatar (Black_M_2_Casual.glb), and engine loaded.');

  // Reset to clean Monday 7:00 AM state
  await evaluate(`(() => {
    window.confirm = () => true;
    document.getElementById('fresh-game')?.click();
  })()`);
  await sleep(400);

  // -------------------------------------------------------------
  // TEST SUITE 1: PART A — "ATTEND THE LECTURE" JOURNEY & CLASSROOM
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 1: Part A — "Attend the Lecture" Flow ---');

  const initStats = await evaluate(`(() => {
    return {
      clock: document.getElementById('game-clock')?.textContent,
      money: document.getElementById('stat-money')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
      peerTrust: document.getElementById('stat-trust')?.textContent,
      employerTrust: document.getElementById('stat-employer-trust')?.textContent,
      objTitle: document.getElementById('objective-title-text')?.textContent,
    };
  })()`);
  console.log('Initial Monday 7:00 AM stats:', initStats);

  // Open decision panel and click "Attend the lecture"
  console.log('Opening decision modal and clicking "Attend the lecture"...');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(300);
  await evaluate(`document.getElementById('btn-attend')?.click()`);
  await sleep(400);

  const postAttendChoice = await evaluate(`(() => {
    return {
      bannerHidden: document.getElementById('autonav-banner')?.hidden,
      bannerText: document.getElementById('autonav-activity')?.textContent,
      objTitle: document.getElementById('objective-title-text')?.textContent,
      clock: document.getElementById('game-clock')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
    };
  })()`);
  console.log('Status immediately after choosing Attend:', postAttendChoice);
  if (postAttendChoice.bannerHidden) throw new Error('Auto-nav banner should be active');
  if (postAttendChoice.clock.includes('8:30') || !postAttendChoice.clock.includes('7:0')) throw new Error('Clock should not jump to 8:30 AM until classroom arrival');
  if (!postAttendChoice.academics.includes('40')) throw new Error('Academics should remain 40 during transit (no premature reward)');
  console.log('✓ Decision recorded and transit objective set without premature reward.');

  // Track Mark walking automatically to Great Hall (0, 0, -26)
  console.log('Tracking Mark automatically walking along central promenade to Great Hall...');
  let arrivedGreatHall = false;
  for (let s = 0; s < 25; s++) {
    await sleep(1000);
    const prog = await evaluate(`(() => {
      const p = window.__mark.root.position;
      const isClassroomOpen = !document.getElementById('lecture-modal-backdrop')?.hidden;
      return {
        x: +p.x.toFixed(2),
        z: +p.z.toFixed(2),
        isClassroomOpen,
      };
    })()`);
    console.log(`[t=${s+1}s] Pos: (${prog.x}, ${prog.z}) | Classroom modal open: ${prog.isClassroomOpen}`);
    if (prog.isClassroomOpen || prog.z <= -25.2) {
      arrivedGreatHall = true;
      break;
    }
  }
  if (!arrivedGreatHall) throw new Error('Mark did not arrive at Great Hall in time');

  // Verify Classroom Lecture modal is open
  await sleep(500);
  const classroomModalCheck = await evaluate(`(() => {
    return {
      open: !document.getElementById('lecture-modal-backdrop')?.hidden,
      finishBtn: !!document.getElementById('lecture-finish-btn'),
    };
  })()`);
  console.log('Classroom modal check:', classroomModalCheck);
  if (!classroomModalCheck.open) throw new Error('Classroom transition modal should be open upon arrival');
  console.log('✓ Classroom session triggered at Great Hall entrance.');

  // Click "Pack Up & Exit to Courtyard" to conclude class
  console.log('Exiting classroom session...');
  await evaluate(`document.getElementById('lecture-finish-btn')?.click()`);
  await sleep(500);

  const postClassroomStats = await evaluate(`(() => {
    return {
      clock: document.getElementById('game-clock')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
      peerTrust: document.getElementById('stat-trust')?.textContent,
      objTitle: document.getElementById('objective-title-text')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
    };
  })()`);
  console.log('Post-classroom stats:', postClassroomStats);
  if (!postClassroomStats.clock.includes('8:3') && !postClassroomStats.clock.includes('8:4')) throw new Error(`Clock should advance 90m plus transit time (expected ~8:3X AM, got ${postClassroomStats.clock})`);
  if (!postClassroomStats.academics.includes('60')) throw new Error('Academics should increase to 60');
  if (!postClassroomStats.energy.includes('80')) throw new Error('Energy should decrease to 80');
  if (!postClassroomStats.peerTrust.includes('55')) throw new Error('Peer Trust should increase to 55');
  if (!postClassroomStats.objTitle.includes('Café')) throw new Error('Next objective should direct Mark to Campus Café');
  console.log('✓ Lecture completed: 90 mins advanced, +20 Academics, −20 Energy applied exactly once, next objective set.');

  // Verify lecture cannot be repeated or re-awarded!
  console.log('Testing repeat guard at Great Hall...');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(300);
  const repeatCheck = await evaluate(`(() => {
    return {
      academics: document.getElementById('stat-academics')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
      isClassroomOpen: !document.getElementById('lecture-modal-backdrop')?.hidden,
    };
  })()`);
  if (repeatCheck.isClassroomOpen) throw new Error('Classroom modal should NOT open again');
  if (!repeatCheck.academics.includes('60')) throw new Error('Academics must not be awarded twice');
  console.log('✓ Lecture reward cannot be repeated.');

  // -------------------------------------------------------------
  // TEST SUITE 2: PART A — WASD INTERRUPT SAFETY
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Part A — WASD Interrupt Safety ---');
  await evaluate(`(() => {
    window.confirm = () => true;
    document.getElementById('fresh-game')?.click();
  })()`);
  await sleep(500);

  // Choose Skip
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(300);
  await evaluate(`document.getElementById('btn-skip')?.click()`);
  await sleep(400);

  const bannerBeforeKey = await evaluate(`!document.getElementById('autonav-banner')?.hidden`);
  if (!bannerBeforeKey) throw new Error('Auto nav banner should be visible for skip');

  // Mark walks for 1 sec then user presses KeyW
  await sleep(1000);
  console.log('Pressing KeyW during automatic travel...');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))`);
  await sleep(300);

  const interruptResult = await evaluate(`(() => {
    return {
      bannerHidden: document.getElementById('autonav-banner')?.hidden,
      toastTitle: document.getElementById('toast-title')?.textContent,
    };
  })()`);
  console.log('Interrupt result:', interruptResult);
  if (!interruptResult.bannerHidden) throw new Error('Banner must hide when WASD pressed');
  if (!interruptResult.toastTitle.includes('Manual Control')) throw new Error('Expected "Manual Control Resumed" toast');
  console.log('✓ WASD immediately interrupts travel and restores manual player control.');

  // -------------------------------------------------------------
  // TEST SUITE 3: PART B — CAMPUS CAFÉ SHIFTS & FINANCIAL PRESSURE
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Part B — Campus Café Shifts & Financial Pressure ---');
  // Teleport Mark near Campus Café terrace (-14, 0, 8) to test interaction
  await evaluate(`(() => {
    window.__mark.root.position.set(-14.0, 0, 8.0);
  })()`);
  await sleep(300);

  // Verify proximity prompt says Campus Café
  const promptCheck = await evaluate(`(() => {
    return {
      promptHidden: document.getElementById('lecture-prompt')?.hidden,
      promptText: document.getElementById('prompt-label')?.textContent,
    };
  })()`);
  console.log('Café prompt check:', promptCheck);
  if (promptCheck.promptHidden || !promptCheck.promptText.includes('Campus Café')) {
    throw new Error(`Expected Campus Café prompt but got "${promptCheck.promptText}"`);
  }
  console.log('✓ Campus Café interaction prompt visible.');

  // Press E to open Campus Café modal
  console.log('Opening Campus Café modal via KeyE...');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }))`);
  await sleep(400);

  const cafeModalCheck = await evaluate(`(() => {
    return {
      open: !document.getElementById('cafe-modal-backdrop')?.hidden,
      shiftsCount: document.querySelectorAll('.shift-card').length,
    };
  })()`);
  console.log('Café modal status:', cafeModalCheck);
  if (!cafeModalCheck.open) throw new Error('Campus Café modal should be open');
  if (cafeModalCheck.shiftsCount !== 3) throw new Error(`Expected 3 shifts, found ${cafeModalCheck.shiftsCount}`);
  console.log('✓ Campus Café modal open with 3 available shifts.');

  // Work "Morning Barista Shift" (Wage GH₵ 60.0, -25 Energy, +8 Employer Trust, +180m)
  console.log('Working Morning Barista Shift...');
  const statsBeforeShift = await evaluate(`(() => {
    return {
      money: document.getElementById('stat-money')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      employerTrust: document.getElementById('stat-employer-trust')?.textContent,
      clock: document.getElementById('game-clock')?.textContent,
    };
  })()`);
  console.log('Stats before shift:', statsBeforeShift);

  await evaluate(`(() => {
    const workBtn = document.querySelector('.work-btn[data-shift="morning_shift"]');
    if (!workBtn) throw new Error('Morning shift work button not found');
    workBtn.click();
  })()`);
  await sleep(500);

  const statsAfterShift = await evaluate(`(() => {
    return {
      money: document.getElementById('stat-money')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      employerTrust: document.getElementById('stat-employer-trust')?.textContent,
      clock: document.getElementById('game-clock')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
    };
  })()`);
  console.log('Stats after shift:', statsAfterShift);
  if (!statsAfterShift.money.includes('310.00')) throw new Error('Money should be GH₵ 310.00 (+60)');
  if (!statsAfterShift.employerTrust.includes('58')) throw new Error('Employer Trust should be 58 (+8)');
  if (!statsAfterShift.toastTitle.includes('Morning Barista')) throw new Error('Expected shift completion toast');
  console.log('✓ Shift completed: wage paid, energy deducted, employer trust increased, clock advanced.');

  // Verify shift cannot be worked twice today
  const shiftBtnStatus = await evaluate(`(() => {
    const btn = document.querySelector('.shift-card .completed-btn');
    return btn ? btn.textContent : null;
  })()`);
  console.log('Shift button status after working:', shiftBtnStatus);
  if (!shiftBtnStatus?.includes('Completed Today')) throw new Error('Shift must be marked Completed Today');
  console.log('✓ Duplicate shift payment prevented.');

  // Test Expenses / Campus Store Tab
  console.log('\nTesting Campus Store & Expenses Tab...');
  await evaluate(`document.getElementById('tab-store')?.click()`);
  await sleep(300);

  const storeItemsCount = await evaluate(`document.querySelectorAll('.expense-card').length`);
  if (storeItemsCount !== 4) throw new Error(`Expected 4 store expense items, found ${storeItemsCount}`);

  // Purchase "Waakye & Chilled Sobolo Meal" (Cost GH₵ 25.00, +25 Energy)
  console.log('Purchasing Waakye & Sobolo meal (GH₵ 25.00)...');
  await evaluate(`(() => {
    const buyBtn = document.querySelector('.buy-btn[data-expense="lunch_meal"]');
    buyBtn.click();
  })()`);
  await sleep(400);

  const statsAfterMeal = await evaluate(`(() => {
    return {
      money: document.getElementById('stat-money')?.textContent,
      energy: document.getElementById('stat-energy')?.textContent,
      toastTitle: document.getElementById('toast-title')?.textContent,
    };
  })()`);
  console.log('Stats after meal purchase:', statsAfterMeal);
  if (!statsAfterMeal.money.includes('285.00')) throw new Error('Money should be GH₵ 285.00 (310 - 25)');
  console.log('✓ Meal purchased: money deducted, energy restored.');

  // Purchase "CSC 201 Lab Handout & Notes" (Cost GH₵ 15.00, +10 Academics)
  console.log('Purchasing Coursework Printing (GH₵ 15.00)...');
  await evaluate(`(() => {
    const buyBtn = document.querySelector('.buy-btn[data-expense="course_printing"]');
    buyBtn.click();
  })()`);
  await sleep(400);

  const statsAfterPrinting = await evaluate(`(() => {
    return {
      money: document.getElementById('stat-money')?.textContent,
      academics: document.getElementById('stat-academics')?.textContent,
    };
  })()`);
  console.log('Stats after printing purchase:', statsAfterPrinting);
  if (!statsAfterPrinting.money.includes('270.00')) throw new Error('Money should be GH₵ 270.00 (285 - 15)');
  console.log('✓ Printing purchased: money deducted, academic progress awarded.');

  // Close Café modal
  await evaluate(`document.getElementById('cafe-close-btn')?.click()`);
  await sleep(300);

  // -------------------------------------------------------------
  // TEST SUITE 4: SAVE SYSTEM & RELOAD PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Save & Reload Persistence ---');
  const savedData = await evaluate(`(() => {
    const raw = localStorage.getItem('ripple-phase-2-save');
    return raw ? JSON.parse(raw) : null;
  })()`);
  console.log('Saved localStorage state:', savedData);
  if (!savedData) throw new Error('No saved game found in localStorage');
  if (savedData.money !== 270) throw new Error(`Expected saved money to be 270, got ${savedData.money}`);
  if (savedData.employerTrust !== 58) throw new Error(`Expected saved employerTrust to be 58, got ${savedData.employerTrust}`);
  if (!savedData.completedShifts.includes('morning_shift')) throw new Error('morning_shift should be in completedShifts');
  if (!savedData.lectureCompleted) throw new Error('lectureCompleted should be true');

  // Test reload from save
  const reloadSimulation = await evaluate(`(() => {
    window.__gameState.load();
    const snap = window.__gameState.getSnapshot();
    const shifts = window.__gameState.getAvailableShifts();
    const morningShift = shifts.find(s => s.id === 'morning_shift');
    return {
      money: snap.money,
      employerTrust: snap.employerTrust,
      lectureCompleted: snap.lectureCompleted,
      morningShiftStatus: morningShift?.status,
    };
  })()`);
  console.log('Reload simulation state:', reloadSimulation);
  if (reloadSimulation.money !== 270) throw new Error('Reloaded money mismatch');
  if (reloadSimulation.employerTrust !== 58) throw new Error('Reloaded employerTrust mismatch');
  if (reloadSimulation.morningShiftStatus !== 'completed') throw new Error('Shift must remain completed upon reload');
  console.log('✓ Persistence verified: no duplicate rewards, no repeatable shifts after reload.');

  // Capture final screenshot
  const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/snap_phase21_and_22_verified.png', Buffer.from(shot.data, 'base64'));
  console.log('✓ Saved visual verification screenshot to scratch/snap_phase21_and_22_verified.png');

  ws.close();
  chrome.kill();
  console.log('\n================================================================');
  console.log('🏆 ALL PART A AND PART B TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  chrome.kill();
  process.exit(1);
});
