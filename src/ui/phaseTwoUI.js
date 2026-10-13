import { EXPENSES, SHIFTS } from '../game/gameState.js';

const INTERACTION_DISTANCE = 3.6;

export function createPhaseTwoUI(gameState, onChoice, onFreshGame, locations, onNavigateTo) {
  const lectureLocation = locations?.lectureLocation || { x: 0, z: -27 };
  const cafeLocation = locations?.cafeLocation || { x: -14, z: 0 };
  const akosuaLocation = locations?.akosuaLocation || { x: -10, z: 18 };
  const groupLocation = locations?.groupLocation || { x: 14, z: 8 };
  const libraryLocation = locations?.libraryLocation || { x: 14, z: -10 };
  const examLocation = locations?.examLocation || { x: 0, z: -27 };

  const root = document.createElement('section');
  root.id = 'phase-two-ui';
  root.innerHTML = `
    <!-- Top-Right: Student Status HUD & Clock -->
    <aside class="game-status" aria-label="Student Status and Game Clock">
      <div class="hud-header">
        <span class="clock-icon">🕒</span>
        <div class="game-clock" id="game-clock">Monday · 7:00 AM</div>
      </div>
      <div class="status-divider"></div>
      <div class="stats-grid">
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">💰 Money</span>
            <strong id="stat-money">GH₵ 250.00</strong>
          </div>
        </div>
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">⚡ Energy</span>
            <strong id="stat-energy">100 / 100</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill energy-bar" id="bar-energy" style="width: 100%;"></div>
          </div>
        </div>
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">🎓 Academics</span>
            <strong id="stat-academics">40 / 100</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill academics-bar" id="bar-academics" style="width: 40%;"></div>
          </div>
        </div>
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">🤝 Peer Trust</span>
            <strong id="stat-trust">50 / 100</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill trust-bar" id="bar-trust" style="width: 50%;"></div>
          </div>
        </div>
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">💼 Employer Trust</span>
            <strong id="stat-employer-trust">50 / 100</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill employer-trust-bar" id="bar-employer-trust" style="width: 50%;"></div>
          </div>
        </div>
        <div class="game-stat">
          <div class="stat-meta">
            <span class="stat-name">❤️ Partner Trust</span>
            <strong id="stat-partner-trust">50 / 100</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill partner-trust-bar" id="bar-partner-trust" style="width: 50%;"></div>
          </div>
        </div>
      </div>
      <div class="hud-buttons-row">
        <button class="fresh-game-button" id="fresh-game" type="button" title="Reset all progress and choices">
          ↺ Reset
        </button>
        <button class="map-toggle-button" id="map-toggle-btn" type="button" title="Open Campus Map (M)">
          🗺️ Map (M)
        </button>
      </div>
    </aside>

    <!-- Top-Left: Active Objective Panel -->
    <div class="objective-card" id="objective-card" aria-label="Active Objective">
      <div class="objective-eyebrow">
        <span>📋 OBJECTIVE</span>
        <span class="objective-tag" id="objective-status-tag">IN PROGRESS</span>
      </div>
      <div class="objective-title" id="objective-title-text">Attend your morning lecture.</div>
      <div class="objective-desc" id="objective-desc-text">Head to the Great Hall entrance at the north end of the campus courtyard.</div>
    </div>

    <!-- Top-Center: Auto-Navigation HUD Banner -->
    <aside class="autonav-banner" id="autonav-banner" aria-live="polite" hidden>
      <div class="autonav-pulse-ring"></div>
      <span class="autonav-icon" id="autonav-icon">🚶</span>
      <div class="autonav-body">
        <strong class="autonav-activity" id="autonav-activity">Heading to destination...</strong>
        <span class="autonav-target" id="autonav-target">Auto-Navigation Active</span>
      </div>
      <div class="autonav-badge-wrap">
        <kbd class="autonav-badge">WASD</kbd>
        <span class="autonav-hint">take control</span>
      </div>
    </aside>

    <!-- Top-Center Floating Toast Notifications -->
    <aside class="toast-notification" id="toast-notification" role="status" hidden>
      <div class="toast-content">
        <span class="toast-icon" id="toast-icon">✨</span>
        <div class="toast-texts">
          <h4 class="toast-title" id="toast-title">Notification</h4>
          <p class="toast-message" id="toast-message">Message text</p>
        </div>
      </div>
    </aside>

    <!-- Bottom-Center: Proximity Interaction Prompt -->
    <div class="lecture-prompt" id="lecture-prompt" role="status" hidden>
      <span class="prompt-icon" id="prompt-icon">🏛️</span>
      <span id="prompt-label">Great Hall Entrance</span>
      <kbd>E</kbd>
      <span class="prompt-hint">to interact</span>
    </div>

    <!-- Center: Decision Panel Modal Backdrop (Attend vs Skip) -->
    <div class="decision-backdrop" id="decision-backdrop" hidden>
      <section class="decision-panel" role="dialog" aria-modal="true" aria-labelledby="lecture-title">
        <div class="decision-header">
          <p class="decision-eyebrow">RIPPLE UNIVERSITY • ACADEMIC SIMULATION</p>
          <button class="modal-close-btn" id="modal-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>
        <h2 id="lecture-title">Morning Lecture: Computing (CSC 201)</h2>
        <p class="decision-copy">
          It is Monday morning. The first lecture of the week is commencing in the Great Hall.
          How will Mark choose to balance his academics, stamina, and finances?
        </p>

        <!-- Dynamic choices container -->
        <div id="decision-content"></div>

        <!-- Choice History Log -->
        <div class="choice-history">
          <div class="history-header">
            <h3>Decision History Log</h3>
            <span class="history-count" id="history-count">0 recorded</span>
          </div>
          <ol id="choice-history-list" class="history-list"></ol>
        </div>

        <div class="decision-footer">
          <button class="dismiss-button" id="dismiss-panel" type="button">
            Decide Later / Walk Away (ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Classroom Lecture Transition Modal -->
    <div class="decision-backdrop" id="lecture-modal-backdrop" hidden>
      <section class="decision-panel lecture-classroom-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">GREAT HALL • ROOM 101 • CLASS IN SESSION</p>
        </div>
        <h2>Morning Lecture: Computing (CSC 201)</h2>
        <p class="decision-copy">
          Dr. Kwame Mensah takes the podium. Across 90 minutes of active instruction,
          Mark studies computer architecture, data structures, and memory allocation while engaging in peer discussions.
        </p>
        <div class="lecture-classroom-card">
          <div class="classroom-chalkboard">
            <div class="chalkboard-title">CSC 201 — ALGORITHMS & MEMORY LAYOUT</div>
            <div class="chalkboard-notes">
              <div>▸ Big-O Complexity: Array lookups O(1) vs. Binary Search O(log n)</div>
              <div>▸ Memory Alignment & Stack vs. Heap Allocation</div>
              <div>▸ Attendance recorded for Mark (Student ID: CS-2026-084)</div>
            </div>
          </div>
          <div class="classroom-summary-rewards">
            <span class="badge positive">+20 Academics</span>
            <span class="badge negative">−20 Energy</span>
            <span class="badge positive">+5 Peer Trust</span>
            <span class="badge neutral">1h 30m Class Duration</span>
          </div>
        </div>
        <div class="decision-footer">
          <button class="primary-action-btn" id="lecture-finish-btn" type="button">
            Pack Up & Exit to Courtyard
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Campus Café Modal (Shifts & Financial Expenses) -->
    <div class="decision-backdrop" id="cafe-modal-backdrop" hidden>
      <section class="decision-panel cafe-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">CAMPUS CAFÉ • STUDENT WORK & FINANCES</p>
          <button class="modal-close-btn" id="cafe-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>
        <h2>Campus Café & Student Counter</h2>
        <p class="decision-copy">
          Managed by Auntie Serwaa. Pick up flexible part-time barista shifts to earn Ghanaian Cedis (GH₵),
          or purchase daily food, data, and academic supplies.
        </p>

        <div class="cafe-tab-bar">
          <button class="cafe-tab active" id="tab-shifts" type="button">💼 Available Shifts</button>
          <button class="cafe-tab" id="tab-store" type="button">🛍️ Campus Store & Expenses</button>
        </div>

        <div class="cafe-tab-content" id="cafe-shifts-view"></div>
        <div class="cafe-tab-content" id="cafe-store-view" hidden></div>

        <div class="decision-footer">
          <button class="dismiss-button" id="cafe-dismiss-btn" type="button">
            Leave Counter (ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Campus 2D Live Map Modal -->
    <div class="decision-backdrop" id="campus-map-backdrop" hidden>
      <section class="decision-panel campus-map-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">KNUST CAMPUS COURTYARD • LIVE SATELLITE MAP</p>
          <button class="modal-close-btn" id="map-close-btn" type="button" aria-label="Close map">✕</button>
        </div>
        <h2>Campus Navigation & Key Locations</h2>
        <p class="decision-copy">
          View Mark's live real-time position relative to campus landmarks. Click any location card or pin to trigger intelligent auto-navigation.
        </p>

        <div class="map-visual-wrap">
          <canvas id="campus-map-canvas" width="460" height="200" class="campus-map-canvas"></canvas>
          <div class="map-live-coords" id="map-live-coords">Mark Position: X: 0.0, Z: 16.0</div>
        </div>

        <div class="map-destinations-grid">
          <div class="map-dest-card" data-dest="lecture">
            <div class="map-dest-icon">🏛️</div>
            <div class="map-dest-info">
              <strong>Great Hall</strong>
              <span>Morning Lectures & Midterm Exams</span>
            </div>
            <button class="map-dest-nav-btn" data-dest="lecture" type="button">🚶 Walk Here</button>
          </div>
          <div class="map-dest-card" data-dest="library">
            <div class="map-dest-icon">📖</div>
            <div class="map-dest-info">
              <strong>Balme Library Pavilion</strong>
              <span>CSC 201 Revision & Quiet Study</span>
            </div>
            <button class="map-dest-nav-btn" data-dest="library" type="button">🚶 Walk Here</button>
          </div>
          <div class="map-dest-card" data-dest="group">
            <div class="map-dest-icon">👥</div>
            <div class="map-dest-info">
              <strong>East Study Pergola</strong>
              <span>CSC 201 Term Project (Esi & Kofi)</span>
            </div>
            <button class="map-dest-nav-btn" data-dest="group" type="button">🚶 Walk Here</button>
          </div>
          <div class="map-dest-card" data-dest="cafe">
            <div class="map-dest-icon">☕</div>
            <div class="map-dest-info">
              <strong>Campus Café</strong>
              <span>Auntie Serwaa, Barista Shifts & Meals</span>
            </div>
            <button class="map-dest-nav-btn" data-dest="cafe" type="button">🚶 Walk Here</button>
          </div>
          <div class="map-dest-card" data-dest="akosua">
            <div class="map-dest-icon">❤️</div>
            <div class="map-dest-info">
              <strong>Quad Garden Bench</strong>
              <span>Akosua Mensah (Partner)</span>
            </div>
            <button class="map-dest-nav-btn" data-dest="akosua" type="button">🚶 Walk Here</button>
          </div>
        </div>

        <div class="decision-footer">
          <button class="dismiss-button" id="map-dismiss-btn" type="button">
            Close Map (M / ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Akosua Mensah Partner Modal -->
    <div class="decision-backdrop" id="partner-modal-backdrop" hidden>
      <section class="decision-panel partner-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">QUAD GARDEN BENCH • ROMANTIC RELATIONSHIP</p>
          <button class="modal-close-btn" id="partner-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>

        <div class="partner-profile-header">
          <div class="partner-avatar">👩🏾‍🎓</div>
          <div class="partner-bio">
            <div class="partner-name">Akosua Mensah</div>
            <div class="partner-meta">Economics (Level 200) • Partner</div>
          </div>
          <div class="partner-trust-badge">
            <span class="badge-label">Partner Trust</span>
            <strong id="partner-panel-trust">50 / 100</strong>
          </div>
        </div>

        <div class="partner-speech-bubble" id="partner-speech-text">
          "Mark! It’s so good to see you. How is your morning going?"
        </div>

        <div class="partner-actions-container" id="partner-actions-view"></div>

        <div class="decision-footer">
          <button class="dismiss-button" id="partner-dismiss-btn" type="button">
            Say Goodbye & Walk Away (ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Group Project Modal (CSC 201 Term Project) -->
    <div class="decision-backdrop" id="group-modal-backdrop" hidden>
      <section class="decision-panel group-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">EAST STUDY PERGOLA • CSC 201 TERM PROJECT</p>
          <button class="modal-close-btn" id="group-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>
        <h2>CSC 201: Campus Query Engine Project</h2>
        <div class="group-deadline-notice" id="group-deadline-notice">
          ⏰ Deadline: Monday · 5:00 PM (17:00)
        </div>

        <div class="group-progress-overview">
          <div class="group-progress-label">
            <span>Overall Team Completion</span>
            <strong id="group-total-pct">40%</strong>
          </div>
          <div class="stat-bar-track group-main-track">
            <div class="stat-bar-fill" id="group-total-bar" style="width: 40%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
          </div>
          <div class="projected-grade-wrap">
            Projected Grade: <span class="badge neutral" id="group-projected-grade">Grade C</span>
          </div>
        </div>

        <!-- Team members breakdown -->
        <div class="teammates-grid">
          <div class="teammate-card">
            <div class="teammate-top">
              <span class="teammate-icon">👩🏾‍💻</span>
              <div>
                <strong>Esi (Team Lead)</strong>
                <span class="teammate-role">Architecture & UI</span>
              </div>
              <span class="teammate-status-tag done">40% Done</span>
            </div>
            <p class="teammate-desc">Completed SQL database schemas and wireframes ahead of schedule.</p>
          </div>

          <div class="teammate-card" id="card-kofi">
            <div class="teammate-top">
              <span class="teammate-icon">👨🏾‍💻</span>
              <div>
                <strong>Kofi (Teammate)</strong>
                <span class="teammate-role">Testing & Backend</span>
              </div>
              <span class="teammate-status-tag" id="kofi-status-tag">0% Struggling</span>
            </div>
            <p class="teammate-desc" id="kofi-status-desc">Falling behind due to balancing family business errands.</p>
          </div>

          <div class="teammate-card">
            <div class="teammate-top">
              <span class="teammate-icon">🧑🏾‍💻</span>
              <div>
                <strong>Mark (You)</strong>
                <span class="teammate-role">Query Engine Logic</span>
              </div>
              <span class="teammate-status-tag" id="mark-status-tag">0% Started</span>
            </div>
            <p class="teammate-desc">Responsible for query indexing algorithms and Express endpoints.</p>
          </div>
        </div>

        <!-- Strategic actions container -->
        <div class="group-actions-wrap" id="group-actions-view"></div>

        <div class="decision-footer">
          <button class="dismiss-button" id="group-dismiss-btn" type="button">
            Step Away from Pergola (ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Balme Library Study Modal -->
    <div class="decision-backdrop" id="library-modal-backdrop" hidden>
      <section class="decision-panel library-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">BALME LIBRARY STUDY PAVILION • CSC 201 REVISION</p>
          <button class="modal-close-btn" id="library-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>
        <h2>Midterm Revision & Reference Desk</h2>
        <p class="decision-copy">
          Study lecture slides, algorithm complexity proofs, and past exam questions to build your revision mastery before Dr. Mensah’s exam.
        </p>

        <div class="library-revision-overview">
          <div class="group-progress-label">
            <span>Exam Revision Mastery</span>
            <strong id="library-revision-pct">20%</strong>
          </div>
          <div class="stat-bar-track group-main-track">
            <div class="stat-bar-fill" id="library-revision-bar" style="width: 20%; background: linear-gradient(90deg, #38bdf8, #818cf8);"></div>
          </div>
          <div class="exam-countdown-notice">
            🏛️ CSC 201 Midterm Exam: Monday · 6:00 PM at Great Hall
          </div>
        </div>

        <div class="library-options-grid">
          <div class="library-option-card">
            <div class="lib-opt-top">
              <span class="lib-opt-icon">⚡</span>
              <div>
                <strong>Quick Review Session</strong>
                <span class="lib-opt-duration">1 Hour Duration</span>
              </div>
            </div>
            <p class="lib-opt-desc">Review lecture slides, binary search trees, and time complexity formulas.</p>
            <div class="card-consequences">
              <span class="badge positive">+25% Revision</span>
              <span class="badge positive">+2 Academics</span>
              <span class="badge negative">−15 Energy</span>
            </div>
            <button class="library-action-btn" id="btn-quick-study" type="button">📖 Study 1 Hour</button>
          </div>

          <div class="library-option-card">
            <div class="lib-opt-top">
              <span class="lib-opt-icon">🧠</span>
              <div>
                <strong>Deep Algorithm Revision</strong>
                <span class="lib-opt-duration">2 Hours Duration</span>
              </div>
            </div>
            <p class="lib-opt-desc">Solve difficult past paper coding questions, memory bounds, and stack proofs.</p>
            <div class="card-consequences">
              <span class="badge positive">+45% Revision</span>
              <span class="badge positive">+6 Academics</span>
              <span class="badge negative">−25 Energy</span>
            </div>
            <button class="library-action-btn deep-btn" id="btn-deep-study" type="button">📚 Deep Study (2h)</button>
          </div>
        </div>

        <div class="decision-footer">
          <button class="dismiss-button" id="library-dismiss-btn" type="button">
            Exit Library Pavilion (ESC)
          </button>
        </div>
      </section>
    </div>

    <!-- Center: Midterm Exam Modal -->
    <div class="decision-backdrop" id="exam-modal-backdrop" hidden>
      <section class="decision-panel exam-panel" role="dialog" aria-modal="true">
        <div class="decision-header">
          <p class="decision-eyebrow">GREAT HALL • EXAMINATION SEAT #42</p>
          <button class="modal-close-btn" id="exam-close-btn" type="button" aria-label="Close dialog">✕</button>
        </div>
        <h2>CSC 201: Computing Midterm Examination</h2>

        <div id="exam-content-view"></div>

        <div class="decision-footer">
          <button class="dismiss-button" id="exam-dismiss-btn" type="button">
            Leave Exam Hall (ESC)
          </button>
        </div>
      </section>
    </div>
  `;
  document.body.appendChild(root);

  // Element handles
  const clockElement = root.querySelector('#game-clock');
  const moneyElement = root.querySelector('#stat-money');
  const energyElement = root.querySelector('#stat-energy');
  const academicsElement = root.querySelector('#stat-academics');
  const trustElement = root.querySelector('#stat-trust');
  const employerTrustElement = root.querySelector('#stat-employer-trust');
  const partnerTrustElement = root.querySelector('#stat-partner-trust');
  const barEnergy = root.querySelector('#bar-energy');
  const barAcademics = root.querySelector('#bar-academics');
  const barTrust = root.querySelector('#bar-trust');
  const barEmployerTrust = root.querySelector('#bar-employer-trust');
  const barPartnerTrust = root.querySelector('#bar-partner-trust');

  const objTag = root.querySelector('#objective-status-tag');
  const objTitle = root.querySelector('#objective-title-text');
  const objDesc = root.querySelector('#objective-desc-text');

  const autonavBanner = root.querySelector('#autonav-banner');
  const autonavActivity = root.querySelector('#autonav-activity');
  const autonavTarget = root.querySelector('#autonav-target');
  const autonavIcon = root.querySelector('#autonav-icon');

  const toastNotification = root.querySelector('#toast-notification');
  const toastIcon = root.querySelector('#toast-icon');
  const toastTitle = root.querySelector('#toast-title');
  const toastMessage = root.querySelector('#toast-message');
  let toastTimer = null;

  const prompt = root.querySelector('#lecture-prompt');
  const promptIcon = root.querySelector('#prompt-icon');
  const promptLabel = root.querySelector('#prompt-label');

  // Decision Modal handles
  const backdrop = root.querySelector('#decision-backdrop');
  const decisionContent = root.querySelector('#decision-content');
  const historyList = root.querySelector('#choice-history-list');
  const historyCount = root.querySelector('#history-count');
  const closeBtn = root.querySelector('#modal-close-btn');
  const dismissBtn = root.querySelector('#dismiss-panel');

  // Classroom Modal handles
  const lectureClassroomModal = root.querySelector('#lecture-modal-backdrop');
  const lectureFinishBtn = root.querySelector('#lecture-finish-btn');
  let onClassroomDoneCallback = null;

  // Cafe Modal handles
  const cafeModal = root.querySelector('#cafe-modal-backdrop');
  const cafeCloseBtn = root.querySelector('#cafe-close-btn');
  const cafeDismissBtn = root.querySelector('#cafe-dismiss-btn');
  const tabShifts = root.querySelector('#tab-shifts');
  const tabStore = root.querySelector('#tab-store');
  const cafeShiftsView = root.querySelector('#cafe-shifts-view');
  const cafeStoreView = root.querySelector('#cafe-store-view');

  // Map Modal handles
  const mapModal = root.querySelector('#campus-map-backdrop');
  const mapCanvas = root.querySelector('#campus-map-canvas');
  const mapCoords = root.querySelector('#map-live-coords');
  const mapCloseBtn = root.querySelector('#map-close-btn');
  const mapDismissBtn = root.querySelector('#map-dismiss-btn');
  const mapToggleBtn = root.querySelector('#map-toggle-btn');

  // Partner Modal handles
  const partnerModal = root.querySelector('#partner-modal-backdrop');
  const partnerCloseBtn = root.querySelector('#partner-close-btn');
  const partnerDismissBtn = root.querySelector('#partner-dismiss-btn');
  const partnerPanelTrust = root.querySelector('#partner-panel-trust');
  const partnerSpeechText = root.querySelector('#partner-speech-text');
  const partnerActionsView = root.querySelector('#partner-actions-view');

  // Group Project Modal handles
  const groupModal = root.querySelector('#group-modal-backdrop');
  const groupCloseBtn = root.querySelector('#group-close-btn');
  const groupDismissBtn = root.querySelector('#group-dismiss-btn');
  const groupTotalPct = root.querySelector('#group-total-pct');
  const groupTotalBar = root.querySelector('#group-total-bar');
  const groupProjectedGrade = root.querySelector('#group-projected-grade');
  const kofiStatusTag = root.querySelector('#kofi-status-tag');
  const kofiStatusDesc = root.querySelector('#kofi-status-desc');
  const markStatusTag = root.querySelector('#mark-status-tag');
  const groupActionsView = root.querySelector('#group-actions-view');

  // Balme Library Modal handles
  const libraryModal = root.querySelector('#library-modal-backdrop');
  const libraryCloseBtn = root.querySelector('#library-close-btn');
  const libraryDismissBtn = root.querySelector('#library-dismiss-btn');
  const libraryRevisionPct = root.querySelector('#library-revision-pct');
  const libraryRevisionBar = root.querySelector('#library-revision-bar');
  const btnQuickStudy = root.querySelector('#btn-quick-study');
  const btnDeepStudy = root.querySelector('#btn-deep-study');

  // Exam Modal handles
  const examModal = root.querySelector('#exam-modal-backdrop');
  const examCloseBtn = root.querySelector('#exam-close-btn');
  const examDismissBtn = root.querySelector('#exam-dismiss-btn');
  const examContentView = root.querySelector('#exam-content-view');

  let lastRenderKey = '';
  let onPanelCloseCallback = null;
  let currentMarkPos = { x: 0, z: 16 };

  function showToast({ title, message, icon = '✨', duration = 3800, type = 'info' }) {
    if (toastTimer) clearTimeout(toastTimer);
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastIcon.textContent = icon;
    toastNotification.className = `toast-notification toast-${type}`;
    toastNotification.hidden = false;
    toastNotification.style.opacity = '1';

    toastTimer = setTimeout(() => {
      toastNotification.style.opacity = '0';
      setTimeout(() => {
        toastNotification.hidden = true;
      }, 400);
    }, duration);
  }

  function setAutoNavStatus(status) {
    if (!status) return;
    if (status.active) {
      autonavActivity.textContent = status.activity || 'Auto-Navigation Active';
      autonavTarget.textContent = status.destination ? `En route to ${status.destination}` : 'Following safe campus route';
      if (status.activity && status.activity.toLowerCase().includes('café')) {
        autonavIcon.textContent = '☕';
      } else if (status.activity && status.activity.toLowerCase().includes('akosua')) {
        autonavIcon.textContent = '❤️';
      } else if (status.activity && status.activity.toLowerCase().includes('library')) {
        autonavIcon.textContent = '📖';
      } else if (status.activity && status.activity.toLowerCase().includes('group')) {
        autonavIcon.textContent = '👥';
      } else {
        autonavIcon.textContent = '🚶';
      }
      autonavBanner.hidden = false;
      autonavBanner.style.opacity = '1';
    } else {
      autonavBanner.style.opacity = '0';
      autonavBanner.hidden = true;

      if (status.interrupted) {
        showToast({
          title: 'Manual Control Resumed',
          message: 'Automatic movement cancelled. You have full manual control of Mark.',
          icon: '✋',
          duration: 2500,
          type: 'warning',
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2D CAMPUS MAP RENDERING
  // -------------------------------------------------------------
  function drawCampusMap(playerPos) {
    if (!mapCanvas) return;
    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return;

    const w = mapCanvas.width;
    const h = mapCanvas.height;

    // Coordinate mapping: X [-22, 22] -> [30, w - 30], Z [-32, 38] -> [30, h - 30]
    function toMap(x, z) {
      const mx = ((x - (-22)) / (22 - (-22))) * (w - 60) + 30;
      const my = ((z - (-32)) / (38 - (-32))) * (h - 60) + 30;
      return { x: mx, y: my };
    }

    // Clear background: lush campus lawns
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Lawn grass area
    ctx.fillStyle = '#13281d';
    ctx.beginPath();
    ctx.roundRect(15, 15, w - 30, h - 30, 10);
    ctx.fill();

    // Central promenade paved pathway
    const topPath = toMap(0, -30);
    const botPath = toMap(0, 36);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(topPath.x, topPath.y);
    ctx.lineTo(botPath.x, botPath.y);
    ctx.stroke();

    // Central centerline paver
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topPath.x, topPath.y);
    ctx.lineTo(botPath.x, botPath.y);
    ctx.stroke();

    // Crossway pathways
    const cross1L = toMap(-18, 0);
    const cross1R = toMap(18, 0);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cross1L.x, cross1L.y);
    ctx.lineTo(cross1R.x, cross1R.y);
    ctx.stroke();

    const cross2L = toMap(-18, 8);
    const cross2R = toMap(18, 8);
    ctx.beginPath();
    ctx.moveTo(cross2L.x, cross2L.y);
    ctx.lineTo(cross2R.x, cross2R.y);
    ctx.stroke();

    // South garden curved path
    const southL = toMap(-12, 18);
    const southC = toMap(0, 18);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(southC.x, southC.y);
    ctx.lineTo(southL.x, southL.y);
    ctx.stroke();

    // Library path
    const libC = toMap(0, -10);
    const libR = toMap(14, -10);
    ctx.beginPath();
    ctx.moveTo(libC.x, libC.y);
    ctx.lineTo(libR.x, libR.y);
    ctx.stroke();

    // Landmark pins
    const pins = [
      { name: 'Great Hall', coords: lectureLocation, color: '#0ea5e9', icon: '🏛️' },
      { name: 'Library', coords: libraryLocation, color: '#38bdf8', icon: '📖' },
      { name: 'Group Pergola', coords: groupLocation, color: '#10b981', icon: '👥' },
      { name: 'Campus Café', coords: cafeLocation, color: '#f59e0b', icon: '☕' },
      { name: 'Akosua Bench', coords: akosuaLocation, color: '#f43f5e', icon: '❤️' },
    ];

    pins.forEach((pin) => {
      const p = toMap(pin.coords.x, pin.coords.z);
      // Pin background circle
      ctx.fillStyle = pin.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fill();

      // Pin border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pin.name, p.x, p.y + 19);
    });

    // Mark's live player position
    const mp = toMap(playerPos.x, playerPos.z);

    // Radar pulse ring
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Mark marker
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mark label
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU (MARK)', mp.x, mp.y - 10);
  }

  // -------------------------------------------------------------
  // MAIN HUD & DECISION RENDERING
  // -------------------------------------------------------------
  function render() {
    const snapshot = gameState.getSnapshot();
    const lastChoice = snapshot.history[snapshot.history.length - 1];

    const currentKey = [
      snapshot.dayIndex,
      snapshot.minutesOfDay,
      snapshot.money,
      snapshot.energy,
      snapshot.academicProgress,
      snapshot.relationshipTrust,
      snapshot.employerTrust,
      snapshot.partnerTrust,
      snapshot.lectureDecision,
      snapshot.lectureCompleted,
      snapshot.groupProject?.totalProgress,
      snapshot.groupProject?.kofiStatus,
      snapshot.groupProject?.submitted,
      snapshot.examSystem?.revisionProgress,
      snapshot.examSystem?.examTaken,
      snapshot.objective?.id,
      snapshot.objective?.completed,
      snapshot.completedShifts?.length,
      snapshot.history.length,
      lastChoice?.timestamp,
    ].join('|');

    if (currentKey === lastRenderKey) return;
    lastRenderKey = currentKey;

    // Clock
    clockElement.textContent = `${snapshot.day} · ${snapshot.time}`;

    // Stats
    moneyElement.textContent = `GH₵ ${snapshot.money.toFixed(2)}`;
    energyElement.textContent = `${snapshot.energy} / 100`;
    academicsElement.textContent = `${snapshot.academicProgress} / 100`;
    trustElement.textContent = `${snapshot.relationshipTrust} / 100`;
    employerTrustElement.textContent = `${snapshot.employerTrust} / 100`;
    partnerTrustElement.textContent = `${snapshot.partnerTrust} / 100`;

    // Progress meters
    barEnergy.style.width = `${snapshot.energy}%`;
    barAcademics.style.width = `${snapshot.academicProgress}%`;
    barTrust.style.width = `${snapshot.relationshipTrust}%`;
    barEmployerTrust.style.width = `${snapshot.employerTrust}%`;
    barPartnerTrust.style.width = `${snapshot.partnerTrust}%`;

    // Objective status
    if (snapshot.objective) {
      objTitle.textContent = snapshot.objective.title || 'Morning Objective';
      if (snapshot.objective.completed) {
        objTag.textContent = 'COMPLETED';
        objTag.className = 'objective-tag completed-tag';
        objDesc.textContent = snapshot.objective.description || 'Action recorded for Mark.';
      } else {
        objTag.textContent = 'IN PROGRESS';
        objTag.className = 'objective-tag in-progress-tag';
        objDesc.textContent = snapshot.objective.description || 'Head to the destination in the campus courtyard.';
      }
    }

    // Modal Content for Morning Lecture Decision modal
    if (snapshot.lectureDecision !== null) {
      decisionContent.innerHTML = `
        <div class="decision-completed-card">
          <div class="completed-badge">
            ${snapshot.lectureDecision === 'attend' ? '✓ ATTENDED' : '⚠ SKIPPED'}
          </div>
          <h4>Decision already recorded for this morning lecture</h4>
          <p>
            Mark selected: <strong>${snapshot.lectureDecision === 'attend' ? 'Attend the lecture' : 'Skip the lecture'}</strong>.
            This choice has taken effect and cannot be re-applied for this lecture session.
          </p>
        </div>
      `;
    } else {
      decisionContent.innerHTML = `
        <div class="decision-actions">
          <button class="decision-card attend-card" id="btn-attend" type="button">
            <div class="card-top">
              <span class="card-icon">📚</span>
              <span class="card-title">Attend the lecture</span>
            </div>
            <p class="card-desc">Fulfill attendance requirements and gain essential computer science knowledge.</p>
            <div class="card-consequences">
              <span class="badge positive">+20 Academics</span>
              <span class="badge negative">−20 Energy</span>
              <span class="badge positive">+5 Peer Trust</span>
              <span class="badge neutral">+1h 30m Time</span>
            </div>
          </button>

          <button class="decision-card skip-card" id="btn-skip" type="button">
            <div class="card-top">
              <span class="card-icon">☕</span>
              <span class="card-title">Skip the lecture</span>
            </div>
            <p class="card-desc">Save immediate stamina and relax in the courtyard. Misses academic progress.</p>
            <div class="card-consequences">
              <span class="badge neutral">+0 Academics</span>
              <span class="badge positive">+5 Energy</span>
              <span class="badge negative">−5 Peer Trust</span>
              <span class="badge neutral">+30m Time</span>
            </div>
          </button>
        </div>
      `;

      // Bind choice click handlers
      const btnAttend = decisionContent.querySelector('#btn-attend');
      const btnSkip = decisionContent.querySelector('#btn-skip');
      if (btnAttend) {
        btnAttend.addEventListener('click', () => {
          onChoice('attend');
        });
      }
      if (btnSkip) {
        btnSkip.addEventListener('click', () => {
          onChoice('skip');
        });
      }
    }

    // History Log
    historyCount.textContent = `${snapshot.history.length} recorded`;
    if (snapshot.history.length === 0) {
      historyList.innerHTML = '<li class="history-empty">No decisions recorded yet.</li>';
    } else {
      historyList.innerHTML = snapshot.history
        .slice()
        .reverse()
        .map((entry) => {
          const isAttend = entry.option === 'attend' || entry.option === 'attended_classroom';
          const isJob = entry.option === 'worked_shift';
          const isExpense = entry.option === 'purchased_expense';
          const isPartner = entry.option?.includes('promise');
          let entryClass = isAttend ? 'entry-attend' : isJob ? 'entry-job' : isExpense ? 'entry-expense' : isPartner ? 'entry-partner' : 'entry-skip';

          const ch = entry.statusChanges || {};
          return `
            <li class="history-entry ${entryClass}">
              <div class="entry-header">
                <span class="entry-label">${entry.label}</span>
                <span class="entry-time">${entry.day} · ${entry.time}</span>
              </div>
              <div class="entry-tags">
                ${ch.academicProgress ? `<span class="entry-tag">+${ch.academicProgress} Academics</span>` : ''}
                ${ch.energy ? `<span class="entry-tag">${ch.energy > 0 ? '+' : ''}${ch.energy} Energy</span>` : ''}
                ${ch.relationshipTrust ? `<span class="entry-tag">${ch.relationshipTrust > 0 ? '+' : ''}${ch.relationshipTrust} Peer Trust</span>` : ''}
                ${ch.partnerTrust ? `<span class="entry-tag">${ch.partnerTrust > 0 ? '+' : ''}${ch.partnerTrust} Partner Trust</span>` : ''}
                ${ch.employerTrust ? `<span class="entry-tag">+${ch.employerTrust} Employer Trust</span>` : ''}
                ${ch.money ? `<span class="entry-tag">${ch.money > 0 ? '+' : ''}GH₵ ${ch.money.toFixed(2)}</span>` : ''}
                ${ch.minutes ? `<span class="entry-tag">+${ch.minutes}m</span>` : ''}
              </div>
            </li>
          `;
        })
        .join('');
    }
  }

  // -------------------------------------------------------------
  // AKOSUA PARTNER MODAL RENDERING
  // -------------------------------------------------------------
  function renderPartnerModal() {
    const snap = gameState.getSnapshot();
    const pStatus = gameState.getPartnerStatus();

    partnerPanelTrust.textContent = `${snap.partnerTrust} / 100`;

    const mins = snap.minutesOfDay;
    const promise = pStatus.promise;

    let dialogue = '';
    let actionsHtml = '';

    if (!promise || promise.state === 'none') {
      dialogue = `"Mark! I'm so glad I bumped into you. Are we still getting waakye together at the Quad Garden bench around 12:00 PM noon? I know your schedule gets hectic with café shifts and that CSC 201 project."`;
      actionsHtml = `
        <div class="partner-choices-grid">
          <button class="partner-action-card promise-card" data-action="make_promise" type="button">
            <strong>🤝 Promise to meet at 12:00 PM</strong>
            <p>Commit to lunch at the Quad Garden bench (+5 Partner Trust).</p>
          </button>
          <button class="partner-action-card honest-card" data-action="reschedule_honestly" type="button">
            <strong>💬 Explain schedule conflicts honestly</strong>
            <p>Be upfront about your tight deadlines without making a false promise (+3 Partner Trust).</p>
          </button>
          <button class="partner-action-card chat-card" data-action="casual_chat" type="button">
            <strong>❤️ Quick warm check-in (+15m)</strong>
            <p>Share a sweet moment between classes (+5 Partner Trust).</p>
          </button>
        </div>
      `;
    } else if (promise.state === 'promised') {
      if (mins < 11 * 60 + 30) {
        dialogue = `"Hey Mark! I'm getting things ready for our noon meetup. Get your morning lectures or library revisions done first, okay? See you at 12:00 PM!"`;
        actionsHtml = `
          <div class="partner-choices-grid">
            <button class="partner-action-card chat-card" data-action="casual_chat" type="button">
              <strong>❤️ Quick encouraging check-in (+15m)</strong>
              <p>Reassure Akosua you'll see her soon (+5 Partner Trust).</p>
            </button>
            <button class="partner-action-card honest-card" data-action="reschedule_honestly" type="button">
              <strong>💬 Reschedule honestly in advance</strong>
              <p>Give early notice if upcoming deadlines won't permit lunch (+3 Partner Trust).</p>
            </button>
          </div>
        `;
      } else if (mins <= 13 * 60) {
        dialogue = `"Mark, you made it right on time! I saved us a cool spot under the bougainvillea flowers. Let's eat and take our minds off upcoming exams for a little while."`;
        actionsHtml = `
          <div class="partner-choices-grid">
            <button class="partner-action-card keep-card" data-action="keep_promise" type="button">
              <strong>🍱 Share waakye lunch (+45m)</strong>
              <p>Fulfill your promise! +15 Partner Trust, +10 Energy restored.</p>
            </button>
          </div>
        `;
      } else {
        dialogue = `"Mark... I waited at the bench until past 12:45 PM. You didn't show up or send word. I know university is demanding, but communication matters to me."`;
        actionsHtml = `
          <div class="partner-choices-grid">
            <button class="partner-action-card apologize-card" data-action="break_promise" type="button">
              <strong>💔 Acknowledge mistake & apologize</strong>
              <p>Face the consequence of breaking your word (-20 Partner Trust).</p>
            </button>
          </div>
        `;
      }
    } else if (promise.state === 'kept') {
      dialogue = `"Thank you for taking time to be with me today, Mark. It really lifted my spirits. Good luck with your CSC 201 project and revision!"`;
      actionsHtml = `
        <div class="partner-choices-grid">
          <button class="partner-action-card chat-card" data-action="casual_chat" type="button">
            <strong>❤️ Warm chat (+15m)</strong>
            <p>Exchange a cheerful smile (+5 Partner Trust).</p>
          </button>
        </div>
      `;
    } else if (promise.state === 'rescheduled') {
      dialogue = `"I appreciate you being upfront with me earlier, Mark. Don't stress too much about exams. We'll catch up once your project deadline passes."`;
      actionsHtml = `
        <div class="partner-choices-grid">
          <button class="partner-action-card chat-card" data-action="casual_chat" type="button">
            <strong>❤️ Thank Akosua for her understanding (+15m)</strong>
            <p>Show gratitude for her support (+5 Partner Trust).</p>
          </button>
        </div>
      `;
    } else {
      dialogue = `"I was really hurt earlier, Mark. Let's just focus on doing our work today."`;
      actionsHtml = `
        <div class="partner-choices-grid">
          <button class="partner-action-card chat-card" data-action="casual_chat" type="button">
            <strong>💬 Polite conversation (+15m)</strong>
            <p>Begin rebuilding damaged trust (+5 Partner Trust).</p>
          </button>
        </div>
      `;
    }

    partnerSpeechText.textContent = dialogue;
    partnerActionsView.innerHTML = actionsHtml;

    partnerActionsView.querySelectorAll('.partner-action-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        try {
          const res = gameState.interactWithPartner(action);
          render();
          renderPartnerModal();
          showToast({
            title: 'Akosua Mensah',
            message: res.message,
            icon: '❤️',
            duration: 4500,
            type: res.trustChange >= 0 ? 'success' : 'warning',
          });
        } catch (err) {
          showToast({ title: 'Notice', message: err.message, icon: '⚠️', type: 'warning' });
        }
      });
    });
  }

  // -------------------------------------------------------------
  // GROUP PROJECT MODAL RENDERING (CSC 201)
  // -------------------------------------------------------------
  function renderGroupModal() {
    const proj = gameState.getGroupProjectStatus();
    const snap = gameState.getSnapshot();

    groupTotalPct.textContent = `${proj.totalProgress}%`;
    groupTotalBar.style.width = `${proj.totalProgress}%`;

    // Projected grade
    let grade = 'Grade D/F';
    if (proj.totalProgress >= 90) grade = 'Grade A (Distinction)';
    else if (proj.totalProgress >= 75) grade = 'Grade B+ (Commendable)';
    else if (proj.totalProgress >= 60) grade = 'Grade B (Solid Pass)';
    else if (proj.totalProgress >= 45) grade = 'Grade C (Borderline)';
    groupProjectedGrade.textContent = grade;

    // Kofi status tag
    if (proj.kofiStatus === 'assisted') {
      kofiStatusTag.textContent = '30% (Mark Covered)';
      kofiStatusTag.className = 'teammate-status-tag done';
      kofiStatusDesc.textContent = 'Mark wrote the test suites and error handling for Kofi.';
    } else if (proj.kofiStatus === 'reminded') {
      kofiStatusTag.textContent = `${proj.kofiProgress}% (Caught Up)`;
      kofiStatusTag.className = 'teammate-status-tag caught-up';
      kofiStatusDesc.textContent = 'Kofi finished the API integration after your gentle reminder.';
    } else if (proj.kofiStatus === 'confronted') {
      kofiStatusTag.textContent = `${proj.kofiProgress}% (Basic Draft)`;
      kofiStatusTag.className = 'teammate-status-tag strained';
      kofiStatusDesc.textContent = 'Kofi scrambled basic notes after confrontation. Team relations strained.';
    } else {
      kofiStatusTag.textContent = '0% Struggling';
      kofiStatusTag.className = 'teammate-status-tag struggling';
      kofiStatusDesc.textContent = 'Falling behind due to balancing family business errands.';
    }

    // Mark status
    markStatusTag.textContent = `${proj.markProgress}% Contribution`;
    if (proj.markProgress > 0) markStatusTag.className = 'teammate-status-tag done';

    // Actions
    if (proj.submitted) {
      groupActionsView.innerHTML = `
        <div class="decision-completed-card">
          <div class="completed-badge">✓ SUBMITTED</div>
          <h4>Final Grade Awarded: ${proj.groupGrade}</h4>
          <p>The CSC 201 Term Project has been officially submitted and graded. Academic progress has been updated!</p>
        </div>
      `;
      return;
    }

    groupActionsView.innerHTML = `
      <div class="group-decision-cards">
        <button class="group-opt-card" data-action="work_my_section" type="button" ${proj.markProgress >= 30 ? 'disabled' : ''}>
          <div class="opt-top">
            <strong>💻 Code Database Query Engine (90m)</strong>
            <span class="badge ${proj.markProgress >= 30 ? 'neutral' : 'positive'}">${proj.markProgress >= 30 ? '✓ Completed' : '+30% Mark'}</span>
          </div>
          <p>Implement the SQL schemas and search indexing endpoints.</p>
          <div class="card-consequences">
            <span class="badge positive">+8 Academics</span>
            <span class="badge negative">−20 Energy</span>
          </div>
        </button>

        <button class="group-opt-card" data-action="remind_kofi" type="button" ${proj.kofiProgress >= 20 ? 'disabled' : ''}>
          <div class="opt-top">
            <strong>🤝 Remind Kofi Patiently (30m)</strong>
            <span class="badge ${proj.kofiProgress >= 20 ? 'neutral' : 'positive'}">${proj.kofiProgress >= 20 ? '✓ Completed' : '+20% Kofi'}</span>
          </div>
          <p>Sit with Kofi and encourage him through difficult unit tests.</p>
          <div class="card-consequences">
            <span class="badge positive">+5 Peer Trust</span>
            <span class="badge negative">−5 Energy</span>
          </div>
        </button>

        <button class="group-opt-card" data-action="assist_kofi" type="button" ${proj.kofiProgress >= 30 ? 'disabled' : ''}>
          <div class="opt-top">
            <strong>🛠️ Take Over & Finish Kofi’s Code (2h)</strong>
            <span class="badge positive">+30% Kofi Max</span>
          </div>
          <p>Sacrifice your own energy to write Kofi’s entire test suite.</p>
          <div class="card-consequences">
            <span class="badge positive">+12 Academics</span>
            <span class="badge negative">−30 Energy</span>
          </div>
        </button>

        <button class="group-opt-card" data-action="confront_kofi" type="button" ${proj.kofiStatus !== 'falling_behind' ? 'disabled' : ''}>
          <div class="opt-top">
            <strong>⚡ Confront Kofi Sternly (20m)</strong>
            <span class="badge neutral">+15% Kofi</span>
          </div>
          <p>Pressure Kofi in front of the group. Demands immediate basic work.</p>
          <div class="card-consequences">
            <span class="badge negative">−10 Peer Trust</span>
            <span class="badge neutral">0 Energy</span>
          </div>
        </button>

        <button class="group-opt-card submit-project-btn" data-action="submit_project" type="button" ${!proj.canSubmit ? 'disabled' : ''}>
          <div class="opt-top">
            <strong>📤 Submit CSC 201 Term Project</strong>
            <span class="badge ${proj.canSubmit ? 'positive' : 'neutral'}">${proj.canSubmit ? 'Ready to Submit' : 'Need ≥ 50%'}</span>
          </div>
          <p>Submit final repository to Dr. Mensah. Locks in project grade.</p>
        </button>
      </div>
    `;

    groupActionsView.querySelectorAll('.group-opt-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        try {
          const res = gameState.interactGroupProject(action);
          render();
          renderGroupModal();
          showToast({
            title: 'CSC 201 Project',
            message: res.message,
            icon: '👥',
            duration: 4500,
            type: 'success',
          });
        } catch (err) {
          showToast({ title: 'Project Notice', message: err.message, icon: '⚠️', type: 'warning' });
        }
      });
    });
  }

  // -------------------------------------------------------------
  // BALME LIBRARY MODAL RENDERING
  // -------------------------------------------------------------
  function renderLibraryModal() {
    const examStatus = gameState.getExamStatus();
    libraryRevisionPct.textContent = `${examStatus.revisionProgress}%`;
    libraryRevisionBar.style.width = `${examStatus.revisionProgress}%`;
  }

  btnQuickStudy.addEventListener('click', () => {
    try {
      const res = gameState.studyInLibrary('quick_review');
      render();
      renderLibraryModal();
      showToast({
        title: 'Balme Library Revision',
        message: res.message,
        icon: '📖',
        duration: 4500,
        type: 'success',
      });
    } catch (err) {
      showToast({ title: 'Study Notice', message: err.message, icon: '⚠️', type: 'warning' });
    }
  });

  btnDeepStudy.addEventListener('click', () => {
    try {
      const res = gameState.studyInLibrary('deep_study');
      render();
      renderLibraryModal();
      showToast({
        title: 'Balme Library Revision',
        message: res.message,
        icon: '🧠',
        duration: 4500,
        type: 'success',
      });
    } catch (err) {
      showToast({ title: 'Study Notice', message: err.message, icon: '⚠️', type: 'warning' });
    }
  });

  // -------------------------------------------------------------
  // MIDTERM EXAM MODAL RENDERING (GREAT HALL)
  // -------------------------------------------------------------
  function renderExamModal() {
    const ex = gameState.getExamStatus();
    const snap = gameState.getSnapshot();

    if (ex.examTaken) {
      examContentView.innerHTML = `
        <div class="exam-result-card">
          <div class="exam-grade-badge">${ex.examGrade}</div>
          <h3>Midterm Score: ${ex.examScore} / 100</h3>
          <p class="exam-feedback">"${ex.examFeedback}"</p>
          <div class="exam-meta-details">
            <span class="badge positive">Score Verified by Dr. Kwame Mensah</span>
            <span class="badge neutral">CSC 201 Academic Credit Recorded</span>
          </div>
        </div>
      `;
      return;
    }

    // Exam readiness calculation
    const revPts = Math.round((ex.revisionProgress / 100) * 40);
    const projPts = snap.groupProject.submitted ? Math.round((snap.groupProject.totalProgress / 100) * 30) : 12;
    const acadPts = Math.round((snap.academicProgress / 100) * 20);
    const stamPts = snap.energy >= 50 ? 10 : Math.round((snap.energy / 50) * 10);
    const estScore = revPts + projPts + acadPts + stamPts;

    examContentView.innerHTML = `
      <div class="exam-readiness-breakdown">
        <h4>Exam Readiness Evaluation</h4>
        <div class="readiness-grid">
          <div class="readiness-item">
            <span>📖 Revision Preparation</span>
            <strong>${revPts} / 40 pts</strong>
          </div>
          <div class="readiness-item">
            <span>👥 Coursework & Project</span>
            <strong>${projPts} / 30 pts</strong>
          </div>
          <div class="readiness-item">
            <span>🎓 Academic Baseline</span>
            <strong>${acadPts} / 20 pts</strong>
          </div>
          <div class="readiness-item">
            <span>⚡ Stamina & Mental Clarity</span>
            <strong>${stamPts} / 10 pts</strong>
          </div>
        </div>
        <div class="estimated-score-banner">
          Estimated Paper Score: <strong>~${estScore} / 100</strong>
        </div>
        <p class="decision-copy" style="margin-top: 12px;">
          Sitting for the exam takes <strong>90 minutes</strong> of intense focus and consumes <strong>25 energy</strong>.
          You can only sit for this exam once.
        </p>
        <button class="primary-action-btn exam-sit-btn" id="btn-sit-exam" type="button" ${snap.energy < 25 ? 'disabled' : ''}>
          ✍️ Sit for the Midterm Exam (90m, −25 Energy)
        </button>
      </div>
    `;

    const sitBtn = examContentView.querySelector('#btn-sit-exam');
    if (sitBtn) {
      sitBtn.addEventListener('click', () => {
        try {
          const res = gameState.takeMidtermExam();
          render();
          renderExamModal();
          showToast({
            title: `Midterm Exam Complete: ${res.grade}`,
            message: `Score: ${res.score}/100. ${res.feedback}`,
            icon: '🎓',
            duration: 6000,
            type: 'success',
          });
        } catch (err) {
          showToast({ title: 'Exam Notice', message: err.message, icon: '⚠️', type: 'warning' });
        }
      });
    }
  }

  // -------------------------------------------------------------
  // CAFÉ SHIFTS & FINANCES MODAL RENDERING
  // -------------------------------------------------------------
  function renderCafeModal() {
    const snapshot = gameState.getSnapshot();
    const shifts = gameState.getAvailableShifts();
    const expenses = gameState.getAvailableExpenses();

    cafeShiftsView.innerHTML = `
      <div class="cafe-shifts-list">
        ${shifts
          .map((shift) => {
            const isCompleted = shift.alreadyCompleted;
            const notEnoughEnergy = !shift.hasEnoughEnergy && !isCompleted;
            let actionBtnHtml = '';
            if (isCompleted) {
              actionBtnHtml = `<button class="shift-btn completed-btn" disabled type="button">✓ Shift Completed Today</button>`;
            } else if (notEnoughEnergy) {
              actionBtnHtml = `<button class="shift-btn energy-warn-btn" disabled type="button">⚠️ Need ${shift.energyCost} Energy (Have ${snapshot.energy})</button>`;
            } else {
              actionBtnHtml = `<button class="shift-btn work-btn" data-shift="${shift.id}" type="button">💼 Work Shift (+GH₵ ${shift.wage.toFixed(2)})</button>`;
            }

            return `
              <div class="shift-card ${isCompleted ? 'shift-card-done' : ''}">
                <div class="shift-top">
                  <div class="shift-title-wrap">
                    <span class="shift-icon">${shift.icon}</span>
                    <strong class="shift-name">${shift.title}</strong>
                  </div>
                  <span class="shift-wage-badge">GH₵ ${shift.wage.toFixed(2)}</span>
                </div>
                <p class="shift-desc">${shift.description}</p>
                <div class="shift-meta-grid">
                  <span class="shift-tag">⏰ ${shift.startTimeStr} – ${shift.endTimeStr} (3h)</span>
                  <span class="shift-tag energy-cost">⚡ −${shift.energyCost} Energy</span>
                  <span class="shift-tag trust-gain">💼 +${shift.employerTrustGain} Employer Trust</span>
                </div>
                ${actionBtnHtml}
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    cafeShiftsView.querySelectorAll('.work-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shiftId = btn.getAttribute('data-shift');
        try {
          const res = gameState.workShift(shiftId);
          render();
          renderCafeModal();
          showToast({
            title: `Completed ${res.shift.title}`,
            message: `Earned GH₵ ${res.earnedWage.toFixed(2)}! Employer Trust +${res.employerTrustGain}. Stamina reduced.`,
            icon: '💼',
            duration: 4500,
            type: 'success',
          });
        } catch (err) {
          showToast({
            title: 'Cannot Work Shift',
            message: err.message,
            icon: '⚠️',
            type: 'warning',
          });
        }
      });
    });

    cafeStoreView.innerHTML = `
      <div class="cafe-store-grid">
        ${expenses
          .map((item) => {
            const canAfford = snapshot.money >= item.cost;
            return `
              <div class="expense-card ${!canAfford ? 'expense-unaffordable' : ''}">
                <div class="expense-top">
                  <span class="expense-icon">${item.icon}</span>
                  <div class="expense-meta">
                    <strong class="expense-title">${item.name}</strong>
                    <span class="expense-price">GH₵ ${item.cost.toFixed(2)}</span>
                  </div>
                </div>
                <p class="expense-desc">${item.description}</p>
                <div class="expense-effects">
                  ${item.energyGain ? `<span class="badge positive">+${item.energyGain} Energy</span>` : ''}
                  ${item.academicGain ? `<span class="badge positive">+${item.academicGain} Academics</span>` : ''}
                  ${item.trustGain ? `<span class="badge positive">+${item.trustGain} Peer Trust</span>` : ''}
                </div>
                <button
                  class="expense-btn ${canAfford ? 'buy-btn' : 'broke-btn'}"
                  data-expense="${item.id}"
                  ${!canAfford ? 'disabled' : ''}
                  type="button"
                >
                  ${canAfford ? `Purchase (GH₵ ${item.cost.toFixed(2)})` : `Insufficient Funds`}
                </button>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    cafeStoreView.querySelectorAll('.buy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const expId = btn.getAttribute('data-expense');
        const item = EXPENSES.find((e) => e.id === expId);
        if (!item) return;

        if (!window.confirm(`Confirm purchase of ${item.name} for GH₵ ${item.cost.toFixed(2)}?`)) {
          return;
        }

        const res = gameState.purchaseExpense(expId);
        if (res.success) {
          render();
          renderCafeModal();
          showToast({
            title: `Purchased ${item.name}`,
            message: `Paid GH₵ ${item.cost.toFixed(2)}. ${item.energyGain ? `+${item.energyGain} Energy ` : ''}${item.academicGain ? `+${item.academicGain} Academics` : ''}`,
            icon: item.icon,
            duration: 4500,
            type: 'success',
          });
        } else {
          showToast({
            title: 'Purchase Failed',
            message: `Insufficient funds! Need GH₵ ${res.required.toFixed(2)}, but you have GH₵ ${res.available.toFixed(2)}.`,
            icon: '❌',
            duration: 4000,
            type: 'warning',
          });
        }
      });
    });
  }

  // Tab switching
  tabShifts.addEventListener('click', () => {
    tabShifts.classList.add('active');
    tabStore.classList.remove('active');
    cafeShiftsView.hidden = false;
    cafeStoreView.hidden = true;
  });

  tabStore.addEventListener('click', () => {
    tabStore.classList.add('active');
    tabShifts.classList.remove('active');
    cafeShiftsView.hidden = true;
    cafeStoreView.hidden = false;
  });

  // Modal opening and closing controls
  function setOpen(value) {
    backdrop.hidden = !value;
    if (value) {
      render();
      const firstBtn = root.querySelector('#btn-attend') || root.querySelector('#dismiss-panel');
      if (firstBtn) firstBtn.focus();
    } else if (onPanelCloseCallback) {
      onPanelCloseCallback();
    }
  }

  function openClassroomModal(onDone) {
    onClassroomDoneCallback = onDone;
    lectureClassroomModal.hidden = false;
  }

  lectureFinishBtn.addEventListener('click', () => {
    lectureClassroomModal.hidden = true;
    if (onClassroomDoneCallback) {
      onClassroomDoneCallback();
      onClassroomDoneCallback = null;
    }
    render();
  });

  function openCafeModal() {
    cafeModal.hidden = false;
    renderCafeModal();
  }

  function closeCafeModal() {
    cafeModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function openMapModal() {
    mapModal.hidden = false;
    drawCampusMap(currentMarkPos);
  }

  function closeMapModal() {
    mapModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function toggleMapModal() {
    if (mapModal.hidden) {
      openMapModal();
    } else {
      closeMapModal();
    }
  }

  function openPartnerModal() {
    partnerModal.hidden = false;
    renderPartnerModal();
  }

  function closePartnerModal() {
    partnerModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function openGroupModal() {
    groupModal.hidden = false;
    renderGroupModal();
  }

  function closeGroupModal() {
    groupModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function openLibraryModal() {
    libraryModal.hidden = false;
    renderLibraryModal();
  }

  function closeLibraryModal() {
    libraryModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function openExamModal() {
    examModal.hidden = false;
    renderExamModal();
  }

  function closeExamModal() {
    examModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  function closeAllModals() {
    backdrop.hidden = true;
    lectureClassroomModal.hidden = true;
    cafeModal.hidden = true;
    mapModal.hidden = true;
    partnerModal.hidden = true;
    groupModal.hidden = true;
    libraryModal.hidden = true;
    examModal.hidden = true;
    if (onPanelCloseCallback) onPanelCloseCallback();
  }

  // Wire Map Nav Buttons
  mapModal.querySelectorAll('.map-dest-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dest = btn.getAttribute('data-dest');
      closeMapModal();
      if (!onNavigateTo) return;

      if (dest === 'lecture') onNavigateTo('Great Hall', lectureLocation);
      else if (dest === 'library') onNavigateTo('Balme Library', libraryLocation);
      else if (dest === 'group') onNavigateTo('East Study Pergola', groupLocation);
      else if (dest === 'cafe') onNavigateTo('Campus Café', cafeLocation);
      else if (dest === 'akosua') onNavigateTo('Quad Garden Bench', akosuaLocation);
    });
  });

  // Event handlers
  mapToggleBtn.addEventListener('click', toggleMapModal);
  mapCloseBtn.addEventListener('click', closeMapModal);
  mapDismissBtn.addEventListener('click', closeMapModal);

  partnerCloseBtn.addEventListener('click', closePartnerModal);
  partnerDismissBtn.addEventListener('click', closePartnerModal);

  groupCloseBtn.addEventListener('click', closeGroupModal);
  groupDismissBtn.addEventListener('click', closeGroupModal);

  libraryCloseBtn.addEventListener('click', closeLibraryModal);
  libraryDismissBtn.addEventListener('click', closeLibraryModal);

  examCloseBtn.addEventListener('click', closeExamModal);
  examDismissBtn.addEventListener('click', closeExamModal);

  cafeCloseBtn.addEventListener('click', closeCafeModal);
  cafeDismissBtn.addEventListener('click', closeCafeModal);
  closeBtn.addEventListener('click', () => setOpen(false));
  dismissBtn.addEventListener('click', () => setOpen(false));

  root.querySelector('#fresh-game').addEventListener('click', () => {
    if (window.confirm('Start a fresh game? This will reset all student stats, time, relationships, and progress.')) {
      onFreshGame();
      render();
    }
  });

  // Backdrop click dismiss
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) setOpen(false); });
  cafeModal.addEventListener('click', (e) => { if (e.target === cafeModal) closeCafeModal(); });
  mapModal.addEventListener('click', (e) => { if (e.target === mapModal) closeMapModal(); });
  partnerModal.addEventListener('click', (e) => { if (e.target === partnerModal) closePartnerModal(); });
  groupModal.addEventListener('click', (e) => { if (e.target === groupModal) closeGroupModal(); });
  libraryModal.addEventListener('click', (e) => { if (e.target === libraryModal) closeLibraryModal(); });
  examModal.addEventListener('click', (e) => { if (e.target === examModal) closeExamModal(); });

  render();

  return {
    update(playerPosition) {
      currentMarkPos = playerPosition;
      render();

      if (!mapModal.hidden) {
        drawCampusMap(playerPosition);
        mapCoords.textContent = `Mark Position: X: ${playerPosition.x.toFixed(1)}, Z: ${playerPosition.z.toFixed(1)}`;
      }

      const dxL = playerPosition.x - lectureLocation.x;
      const dzL = playerPosition.z - lectureLocation.z;
      const nearLecture = Math.hypot(dxL, dzL) <= INTERACTION_DISTANCE;

      const dxC = playerPosition.x - cafeLocation.x;
      const dzC = playerPosition.z - cafeLocation.z;
      const nearCafe = Math.hypot(dxC, dzC) <= INTERACTION_DISTANCE;

      const dxA = playerPosition.x - akosuaLocation.x;
      const dzA = playerPosition.z - akosuaLocation.z;
      const nearAkosua = Math.hypot(dxA, dzA) <= INTERACTION_DISTANCE;

      const dxG = playerPosition.x - groupLocation.x;
      const dzG = playerPosition.z - groupLocation.z;
      const nearGroup = Math.hypot(dxG, dzG) <= INTERACTION_DISTANCE;

      const dxLib = playerPosition.x - libraryLocation.x;
      const dzLib = playerPosition.z - libraryLocation.z;
      const nearLibrary = Math.hypot(dxLib, dzLib) <= INTERACTION_DISTANCE;

      const anyModalOpen =
        !backdrop.hidden ||
        !lectureClassroomModal.hidden ||
        !cafeModal.hidden ||
        !mapModal.hidden ||
        !partnerModal.hidden ||
        !groupModal.hidden ||
        !libraryModal.hidden ||
        !examModal.hidden;

      if (nearAkosua) {
        promptIcon.textContent = '❤️';
        promptLabel.textContent = 'Quad Garden Bench • Talk to Akosua';
        prompt.hidden = anyModalOpen;
      } else if (nearGroup) {
        promptIcon.textContent = '👥';
        promptLabel.textContent = 'East Study Pergola • CSC 201 Group Table';
        prompt.hidden = anyModalOpen;
      } else if (nearLibrary) {
        promptIcon.textContent = '📖';
        promptLabel.textContent = 'Balme Library • Revision Study Desk';
        prompt.hidden = anyModalOpen;
      } else if (nearCafe) {
        promptIcon.textContent = '☕';
        promptLabel.textContent = 'Campus Café • Work & Refreshments';
        prompt.hidden = anyModalOpen;
      } else if (nearLecture) {
        promptIcon.textContent = '🏛️';
        const snap = gameState.getSnapshot();
        if (snap.minutesOfDay >= 17 * 60 || snap.lectureCompleted) {
          promptLabel.textContent = 'Great Hall • CSC 201 Midterm Examination';
        } else if (snap.lectureDecision === 'attend') {
          promptLabel.textContent = 'Great Hall • Enter CSC 201 Lecture';
        } else {
          promptLabel.textContent = 'Great Hall • Morning Lecture';
        }
        prompt.hidden = anyModalOpen;
      } else {
        prompt.hidden = true;
      }

      return {
        nearLecture,
        nearCafe,
        nearAkosua,
        nearGroup,
        nearLibrary,
        nearExam: nearLecture,
      };
    },
    isOpen: () =>
      !backdrop.hidden ||
      !lectureClassroomModal.hidden ||
      !cafeModal.hidden ||
      !mapModal.hidden ||
      !partnerModal.hidden ||
      !groupModal.hidden ||
      !libraryModal.hidden ||
      !examModal.hidden,
    isDecisionOpen: () => !backdrop.hidden,
    isCafeOpen: () => !cafeModal.hidden,
    isClassroomOpen: () => !lectureClassroomModal.hidden,
    isMapOpen: () => !mapModal.hidden,
    isPartnerOpen: () => !partnerModal.hidden,
    isGroupOpen: () => !groupModal.hidden,
    isLibraryOpen: () => !libraryModal.hidden,
    isExamOpen: () => !examModal.hidden,
    setOpen,
    openClassroomModal,
    openCafeModal,
    closeCafeModal,
    openMapModal,
    closeMapModal,
    toggleMapModal,
    openPartnerModal,
    closePartnerModal,
    openGroupModal,
    closeGroupModal,
    openLibraryModal,
    closeLibraryModal,
    openExamModal,
    closeExamModal,
    closeAllModals,
    setOnClose(callback) {
      onPanelCloseCallback = callback;
    },
    showToast,
    setAutoNavStatus,
    dispose() {
      root.remove();
    },
  };
}
