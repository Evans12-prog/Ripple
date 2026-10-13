/**
 * RIPPLE Minimal In-Game HUD:
 * - Title badge in top-left with status telemetry (Stance, FPS)
 * - Pointer lock banner & camera prompt
 * - Minimal control keybinds reference card
 * - Center subtle reticle
 */
export function createUI(followCamera) {
  // Container
  const uiContainer = document.createElement('div');
  uiContainer.id = 'ripple-ui';
  uiContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    user-select: none;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f8fafc;
    z-index: 100;
  `;

  // 1. Top-Left: RIPPLE Title Badge & Telemetry
  const topBadge = document.createElement('div');
  topBadge.style.cssText = `
    position: absolute;
    top: 20px;
    left: 24px;
    background: rgba(15, 23, 42, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 12px 18px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  topBadge.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px; font-weight: 900; letter-spacing: 2px; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">RIPPLE</span>
      <span style="font-size: 10px; font-weight: 700; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; padding: 2px 6px; letter-spacing: 0.5px;">PHASE 2.1</span>
    </div>
    <div style="font-size: 11px; color: #94a3b8; font-weight: 500;">KNUST Campus • University Life Adventure</div>
    <div style="display: flex; gap: 12px; margin-top: 6px; font-size: 11px; font-family: monospace; color: #cbd5e1;">
      <span id="ui-fps">FPS: --</span>
      <span>•</span>
      <span id="ui-stance" style="color: #38bdf8;">IDLE</span>
    </div>
    <div id="ui-character-status" style="font-size: 10px; font-weight: 600; color: #38bdf8; margin-top: 4px; display: none;"></div>
  `;
  uiContainer.appendChild(topBadge);

  // 2. Center Reticle (Subtle focal dot)
  const reticle = document.createElement('div');
  reticle.id = 'ui-reticle';
  reticle.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.4);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.5;
    transition: opacity 0.2s ease;
  `;
  uiContainer.appendChild(reticle);

  // 3. Bottom-Center: Pointer Lock Prompt
  const lockPrompt = document.createElement('div');
  lockPrompt.id = 'ui-lock-prompt';
  lockPrompt.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 30px;
    padding: 10px 22px;
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease, transform 0.3s ease;
    cursor: pointer;
    pointer-events: auto;
  `;
  lockPrompt.innerHTML = `
    <span style="font-size: 16px;">🖱️</span>
    <span>Click screen to control camera</span>
    <span style="color: #64748b; font-size: 11px;">(ESC to free mouse)</span>
  `;
  lockPrompt.addEventListener('click', () => {
    followCamera.requestLock();
  });
  uiContainer.appendChild(lockPrompt);

  // 4. Bottom-Left: Keyboard Controls Guide (Displayed for first 2 minutes, toggleable with 'H')
  const controlsCard = document.createElement('div');
  controlsCard.id = 'controls-guide-card';
  controlsCard.style.cssText = `
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #cbd5e1;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    transition: opacity 0.5s ease, transform 0.5s ease;
    z-index: 90;
  `;

  let controlsVisible = true;
  let remainingSeconds = 120; // 2 minutes auto-display

  controlsCard.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
      <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #38bdf8; letter-spacing: 1px;">🎮 Controls Guide</span>
      <span id="controls-timer-badge" style="font-size: 10px; color: #94a3b8; background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px;">2:00</span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <span>Move Mark:</span>
      <span style="font-family: monospace; font-weight: bold; background: rgba(255, 255, 255, 0.12); padding: 2px 6px; border-radius: 4px;">W A S D</span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <span>Sprint / Run:</span>
      <span style="font-family: monospace; font-weight: bold; background: rgba(255, 255, 255, 0.12); padding: 2px 6px; border-radius: 4px;">Shift</span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <span>Interact / Talk:</span>
      <span style="font-family: monospace; font-weight: bold; background: rgba(14, 165, 233, 0.25); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">E</span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <span>Campus Map:</span>
      <span style="font-family: monospace; font-weight: bold; background: rgba(16, 185, 129, 0.25); color: #34d399; padding: 2px 6px; border-radius: 4px;">M</span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <span>Toggle Controls:</span>
      <span style="font-family: monospace; font-weight: bold; background: rgba(255, 255, 255, 0.12); padding: 2px 6px; border-radius: 4px;">H</span>
    </div>
  `;
  uiContainer.appendChild(controlsCard);

  // Minimized floating button when controls card is auto-hidden
  const miniControlsBtn = document.createElement('button');
  miniControlsBtn.id = 'mini-controls-btn';
  miniControlsBtn.type = 'button';
  miniControlsBtn.innerHTML = '⌨️ Controls (H)';
  miniControlsBtn.style.cssText = `
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    display: none;
    z-index: 90;
    transition: all 0.2s ease;
  `;
  miniControlsBtn.addEventListener('mouseenter', () => {
    miniControlsBtn.style.color = '#38bdf8';
    miniControlsBtn.style.borderColor = '#38bdf8';
  });
  miniControlsBtn.addEventListener('mouseleave', () => {
    miniControlsBtn.style.color = '#94a3b8';
    miniControlsBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });
  uiContainer.appendChild(miniControlsBtn);

  function setControlsVisible(show) {
    controlsVisible = show;
    if (show) {
      controlsCard.style.display = 'flex';
      setTimeout(() => {
        controlsCard.style.opacity = '1';
        controlsCard.style.transform = 'translateY(0)';
      }, 10);
      miniControlsBtn.style.display = 'none';
    } else {
      controlsCard.style.opacity = '0';
      controlsCard.style.transform = 'translateY(8px)';
      setTimeout(() => {
        controlsCard.style.display = 'none';
        miniControlsBtn.style.display = 'block';
      }, 500);
    }
  }

  miniControlsBtn.addEventListener('click', () => setControlsVisible(true));

  // Toggle controls with key 'H'
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
      setControlsVisible(!controlsVisible);
    }
  });

  // Countdown timer for 2 minutes (120 seconds) display
  const timerBadge = controlsCard.querySelector('#controls-timer-badge');
  const controlsTimer = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = String(remainingSeconds % 60).padStart(2, '0');
      if (timerBadge) timerBadge.textContent = `${mins}:${secs}`;
    } else {
      clearInterval(controlsTimer);
      if (timerBadge) timerBadge.textContent = 'Auto-hidden';
      setControlsVisible(false); // Smoothly auto-hide after 2 minutes
    }
  }, 1000);

  document.body.appendChild(uiContainer);

  // Hook into camera lock state changes
  followCamera.onLockStateChange = (isLocked) => {
    if (isLocked) {
      lockPrompt.style.opacity = '0.35';
      lockPrompt.innerHTML = `
        <span style="font-size: 14px;">🎮</span>
        <span style="font-size: 12px; color: #94a3b8;">Camera active • Press <kbd style="background: rgba(255,255,255,0.15); padding: 1px 4px; border-radius: 3px; font-family: monospace;">ESC</kbd> to unlock cursor</span>
      `;
      reticle.style.opacity = '0.7';
    } else {
      lockPrompt.style.opacity = '1.0';
      lockPrompt.innerHTML = `
        <span style="font-size: 16px;">🖱️</span>
        <span>Click screen to control camera</span>
        <span style="color: #64748b; font-size: 11px;">(ESC to free mouse)</span>
      `;
      reticle.style.opacity = '0.3';
    }
  };

  // FPS and Status updater
  let frameCount = 0;
  let lastTime = performance.now();
  const fpsElem = document.getElementById('ui-fps');
  const stanceElem = document.getElementById('ui-stance');

  function update(playerControls) {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      if (fpsElem) fpsElem.textContent = `FPS: ${fps}`;
      frameCount = 0;
      lastTime = now;
    }

    if (stanceElem && playerControls) {
      if (!playerControls.isGrounded) {
        stanceElem.textContent = 'JUMPING';
        stanceElem.style.color = '#f59e0b';
      } else if (playerControls.currentSpeedRatio > 1.2) {
        stanceElem.textContent = 'SPRINTING';
        stanceElem.style.color = '#ec4899';
      } else if (playerControls.currentSpeedRatio > 0.1) {
        stanceElem.textContent = 'WALKING';
        stanceElem.style.color = '#38bdf8';
      } else {
        stanceElem.textContent = 'IDLE';
        stanceElem.style.color = '#10b981';
      }
    }
  }

  return {
    update,
  };
}
