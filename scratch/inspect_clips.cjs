const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\evans\\AppData\\Local\\Temp\\chrome_bench_box',
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
              // Let's inspect animations if cached
              // In sharedAnimations or loadMark
              const clips = mark.mixer?._actions ? mark.mixer._actions.map(a => a.getClip()) : [];
              const tracksSummary = clips.map(c => ({
                name: c.name,
                duration: c.duration,
                tracksCount: c.tracks.length,
                trackTypes: Array.from(new Set(c.tracks.map(t => t.name.split('.').pop()))),
                samplePositionTracks: c.tracks.filter(t => t.name.endsWith('.position')).map(t => ({
                  name: t.name,
                  valuesSample: Array.from(t.values.slice(0, 6))
                })),
                sampleScaleTracks: c.tracks.filter(t => t.name.endsWith('.scale')).map(t => ({
                  name: t.name,
                  valuesSample: Array.from(t.values.slice(0, 6))
                }))
              }));

              // Let's also check Mark's original model scale and position before mixer
              return {
                tracksSummary
              };
            })()`,
            returnByValue: true
          }
        }));
      }, 4000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2) {
        console.log('CLIPS SUMMARY:', JSON.stringify(msg.result.result.value, null, 2));
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
