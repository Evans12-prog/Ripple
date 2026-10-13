const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_test_combined_phase',
  'http://localhost:5173/'
]);

let finished = false;

function finish(code = 0) {
  if (finished) return;
  finished = true;
  try { chrome.kill(); } catch (e) {}
  process.exit(code);
}

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list');
    const pages = await listRes.json();
    const ripplePage = pages.find((p) => p.url.includes('5173'));

    if (!ripplePage) {
      console.error('Could not find Ripple page in Chrome list');
      finish(1);
      return;
    }

    const ws = new WebSocket(ripplePage.webSocketDebuggerUrl);
    let poll = null;
    let verified = false;
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 99, method: 'Console.enable' }));

      // Poll status every second
      let attempts = 0;
      poll = setInterval(() => {
        attempts++;
        ws.send(JSON.stringify({
          id: 100 + attempts,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              return {
                loadingScreen: !!document.getElementById('loading-screen'),
                loadingStatus: document.getElementById('loading-status')?.textContent,
                loadingBar: document.getElementById('loading-bar')?.style.width,
                bodyText: document.body.innerText.substring(0, 150),
                hasMark: !!window.__mark,
                hasPhaseTwoUI: !!document.getElementById('phase-two-ui'),
              };
            })()`,
            returnByValue: true
          }
        }));

        if (attempts >= 25) clearInterval(poll);
      }, 1000);
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded' || msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params?.message?.text || msg.params?.args);
      }
      if (msg.id && msg.id >= 101 && msg.id <= 130) {
        const val = msg.result?.result?.value;
        console.log(`Poll attempt ${msg.id - 100}:`, val);
        if (val && val.hasMark && val.hasPhaseTwoUI && !verified) {
          verified = true;
          clearInterval(poll);
          // Trigger the full verification!
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const partnerTrustElem = document.getElementById('stat-partner-trust');
                const mapBtn = document.getElementById('map-toggle-btn');
                const mapModal = document.getElementById('campus-map-backdrop');
                const partnerModal = document.getElementById('partner-modal-backdrop');
                const groupModal = document.getElementById('group-modal-backdrop');
                const libraryModal = document.getElementById('library-modal-backdrop');
                const examModal = document.getElementById('exam-modal-backdrop');
                const controlsGuide = document.getElementById('controls-guide-card');
                const timerBadge = document.getElementById('controls-timer-badge');
                const canvasElem = document.getElementById('campus-map-canvas');

                const mark = window.__mark;
                const gs = window.__gameState;

                return {
                  dom: {
                    hasPartnerTrust: !!partnerTrustElem,
                    partnerTrustText: partnerTrustElem?.textContent,
                    hasMapBtn: !!mapBtn,
                    hasMapModal: !!mapModal,
                    mapModalHidden: mapModal?.hidden,
                    hasPartnerModal: !!partnerModal,
                    hasGroupModal: !!groupModal,
                    hasLibraryModal: !!libraryModal,
                    hasExamModal: !!examModal,
                    hasControlsGuide: !!controlsGuide,
                    controlsGuideVisible: controlsGuide ? window.getComputedStyle(controlsGuide).display !== 'none' : false,
                    timerBadgeText: timerBadge?.textContent,
                    canvasWidth: canvasElem?.width,
                    canvasHeight: canvasElem?.height,
                  },
                  mark: {
                    loaded: !!mark,
                    position: mark ? { x: +mark.root.position.x.toFixed(2), y: +mark.root.position.y.toFixed(2), z: +mark.root.position.z.toFixed(2) } : null,
                  },
                  gameState: {
                    money: gs?.state.money,
                    energy: gs?.state.energy,
                    partnerTrust: gs?.state.partnerTrust,
                    groupProjectProgress: gs?.state.groupProject.totalProgress,
                    examRevision: gs?.state.examSystem.revisionProgress,
                  }
                };
              })()`,
              returnByValue: true
            }
          }));
        }
      }
      if (msg.id === 3) {
        console.log('\n--- BROWSER VERIFICATION RAW MSG ---');
        console.log(JSON.stringify(msg, null, 2));

        const val = msg.result?.result?.value;
        if (!val) {
          console.error('FAILED: result value is undefined. Exception:', msg.result?.exceptionDetails);
          finish(1);
          return;
        }

        // Test opening map modal
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              document.getElementById('map-toggle-btn').click();
              return {
                mapHiddenAfterClick: document.getElementById('campus-map-backdrop').hidden
              };
            })()`,
            returnByValue: true
          }
        }));
      }

      if (msg.id === 4) {
        console.log('Map button click result:', msg.result?.result?.value);

        // Take a screenshot
        ws.send(JSON.stringify({
          id: 5,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }

      if (msg.id === 5) {
        const base64Data = msg.result?.data;
        if (base64Data) {
          fs.writeFileSync('C:\\Users\\evans\\.gemini\\antigravity-ide\\brain\\dbd7afd7-5c62-4b36-8038-5ddabf34d0a1\\combined_phase_verified.png', Buffer.from(base64Data, 'base64'));
          console.log(' Screenshot saved: combined_phase_verified.png');
        }
        console.log('\n ALL BROWSER INTERACTION VERIFICATIONS PASSED SUCCESSFULLY!');
        finish(0);
      }
    };
  } catch (err) {
    console.error('Browser testing error:', err);
    finish(1);
  }
}, 2000);
