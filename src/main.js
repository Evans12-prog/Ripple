import * as THREE from 'three';
import './style.css';
import { loadMark } from './player/loadMark.js';
import { createCampus } from './world/createCampus.js';
import { PlayerControls } from './player/playerControls.js';
import { FollowCamera } from './camera/followCamera.js';
import { createUI } from './ui/controlsHelp.js';
import { GameState } from './game/gameState.js';
import { createPhaseTwoUI } from './ui/phaseTwoUI.js';

// Update loading screen progress
function setGameLoading(text, percent) {
  const statusElem = document.getElementById('loading-status');
  const barElem = document.getElementById('loading-bar');
  if (statusElem && text) statusElem.textContent = text;
  if (barElem && percent !== undefined) barElem.style.width = `${percent}%`;
}

// Fade out and remove loading screen
function dismissLoadingScreen() {
  console.log('dismissLoadingScreen started');
  const screen = document.getElementById('loading-screen');
  if (screen) {
    screen.style.opacity = '0';
    screen.style.pointerEvents = 'none';
    setTimeout(() => {
      screen.remove();
      console.log('loading-screen element removed from DOM');
    }, 450);
  }
}

// Initialize Three.js application
async function initGame() {
  window.THREE = THREE;
  const container = document.querySelector('#app');
  if (!container) return;
  container.innerHTML = '';

  setGameLoading('Building 3D Canvas & Engine...', 15);

  // 1. Scene & Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6e5f5);

  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.classList.add('webgl-canvas');
  container.appendChild(renderer.domElement);

  // 2. Camera Setup
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(0, 3, 22);

  // 3. Create Campus World (Instant synchronous creation with progressive background NPCs)
  setGameLoading('Creating KNUST Campus Courtyard...', 35);
  console.time('createCampus');
  const campus = await createCampus(scene);
  console.timeEnd('createCampus');

  // 4. Load Main Character: Mark
  setGameLoading('Loading Character Mark...', 55);
  console.time('loadMark');
  const mark = await loadMark((pct) => {
    setGameLoading(`Loading Character: ${pct}%`, 55 + pct * 0.35);
  });
  console.timeEnd('loadMark');

  // Start Mark on walkway facing the Academic building
  mark.root.position.set(0, 0, 16);
  mark.root.rotation.y = Math.PI; // Face towards negative Z (the building)
  scene.add(mark.root);

  window.__scene = scene;
  window.__mark = mark;
  window.__camera = camera;

  // 5. Third-Person Follow Camera
  const followCamera = new FollowCamera(camera, renderer.domElement, {
    target: mark.root.position,
    distance: 4.2,
    heightOffset: 1.45,
    yaw: 0,
    pitch: 0.18,
  });
  followCamera.setCollisionObjects(campus.cameraCollisionMeshes);

  // 6. Player Movement Controls & Collision (tuned for natural human locomotion)
  const playerControls = new PlayerControls(mark, followCamera, {
    walkSpeed: 3.4,
    runSpeed: 6.8,
    jumpForce: 7.2,
    gravity: 20.0,
    turnSpeed: 14.0,
    bounds: {
      minX: -23.0,
      maxX: 23.0,
      minZ: -32.5,
      maxZ: 41.0,
    },
  });
  playerControls.setObstacles(campus.obstacleBoxes, campus.obstacleCylinders);

  // 7. UI, Time & Objective System
  setGameLoading('Initializing Student Simulation...', 95);
  const ui = createUI(followCamera);
  const gameState = new GameState();
  window.__gameState = gameState;

  const phaseTwoUI = createPhaseTwoUI(
    gameState,
    (choice) => {
      // 1. Apply consequences and record decision history exactly once
      const historyEntry = gameState.makeChoice(choice);
      if (!historyEntry) {
        phaseTwoUI.setOpen(false);
        playerControls.setPaused(false);
        return;
      }

      // 2. Close decision panel and unpause gameplay
      phaseTwoUI.setOpen(false);
      playerControls.setPaused(false);

      // 3. Plan safe waypoint route to destination
      const p = mark.root.position;

      if (choice === 'attend') {
        const waypoints = [];
        // Align onto central promenade centerline if off to the side
        if (Math.abs(p.x) > 1.2) {
          waypoints.push({ x: 0, z: p.z });
        }
        // Great Hall entrance doors
        waypoints.push({ x: 0, z: -26.0 });

        playerControls.startAutoNavigation(waypoints, {
          activityName: 'Heading to the lecture hall...',
          destinationName: 'Great Hall',
          stopDistance: 0.8,
          onArrival: () => {
            // Lecture arrival event: open classroom transition sequence
            followCamera.exitLock();
            playerControls.setPaused(true);
            phaseTwoUI.openClassroomModal(() => {
              // Classroom concluded: apply rewards exactly once
              const completion = gameState.completeLectureArrival();
              playerControls.setPaused(false);
              if (completion) {
                phaseTwoUI.showToast({
                  title: 'Lecture Complete: CSC 201',
                  message: 'Mark attended Dr. Mensah’s lecture. +20 Academics, −20 Energy. Next: Visit Campus Café!',
                  icon: '🎓',
                  duration: 4500,
                  type: 'success',
                });
              }
            });
          },
        });
      } else if (choice === 'skip') {
        const cafeTarget = campus.cafeLocation || { x: -14.0, z: 8.0 };
        const waypoints = [];

        // If player is north or south of crossway, route via center junction (0, 0, 8.0)
        if (Math.abs(p.z - 8.0) > 1.6) {
          if (Math.abs(p.x) > 1.2) {
            waypoints.push({ x: 0, z: p.z });
          }
          waypoints.push({ x: 0, z: 8.0 });
          waypoints.push({ x: cafeTarget.x, z: cafeTarget.z });
        } else {
          waypoints.push({ x: cafeTarget.x, z: cafeTarget.z });
        }

        playerControls.startAutoNavigation(waypoints, {
          activityName: 'Heading to the campus café...',
          destinationName: 'Campus Café Terrace',
          stopDistance: 0.8,
          onArrival: () => {
            gameState.completeCafeSkipArrival();
            phaseTwoUI.showToast({
              title: 'Arrived at Campus Café',
              message: 'Mark relaxed on the patio with chilled Sobolo drink. Energy conserved. Shift board available!',
              icon: '☕',
              duration: 4500,
              type: 'success',
            });
          },
        });
      }
    },
    () => {
      playerControls.stopAutoNavigation(false);
      gameState.reset();
      mark.root.position.set(0, 0, 16);
      playerControls.resetPosition(mark.root.position);
      followCamera.yaw = 0;
      followCamera.pitch = 0.18;
      followCamera.currentDistance = followCamera.idealDistance;
      playerControls.setPaused(false);
    },
    {
      lectureLocation: campus.lectureLocation,
      cafeLocation: campus.cafeLocation,
      akosuaLocation: campus.akosuaLocation,
      groupLocation: campus.groupLocation,
      libraryLocation: campus.libraryLocation,
      examLocation: campus.examLocation,
    },
    (destName, targetPos) => {
      // Auto-navigate to selected destination from Campus Map
      phaseTwoUI.closeAllModals();
      playerControls.setPaused(false);
      const p = mark.root.position;
      const waypoints = [];

      // Route via central promenade if navigating across campus
      if (Math.abs(p.x) > 1.5 || Math.abs(targetPos.x) > 1.5) {
        if (Math.abs(p.x) > 1.5) {
          waypoints.push({ x: 0, z: p.z });
        }
        waypoints.push({ x: 0, z: targetPos.z });
        waypoints.push({ x: targetPos.x, z: targetPos.z });
      } else {
        waypoints.push({ x: targetPos.x, z: targetPos.z });
      }

      playerControls.startAutoNavigation(waypoints, {
        activityName: `Walking to ${destName}...`,
        destinationName: destName,
        stopDistance: 1.0,
        onArrival: () => {
          phaseTwoUI.showToast({
            title: `Arrived at ${destName}`,
            message: 'Press [E] to interact.',
            icon: '📍',
            duration: 3500,
            type: 'info',
          });
        },
      });
    }
  );

  // Connect player controls auto-nav status events to the HUD banner
  playerControls.onAutoNavStatusChange = (status) => {
    phaseTwoUI.setAutoNavStatus(status);
  };

  phaseTwoUI.setOnClose(() => {
    playerControls.setPaused(false);
  });

  let proximity = {
    nearLecture: false,
    nearCafe: false,
    nearAkosua: false,
    nearGroup: false,
    nearLibrary: false,
    nearExam: false,
  };

  // Interaction keyboard listener
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    // Toggle Campus Map (M)
    if (event.code === 'KeyM') {
      event.preventDefault();
      if (phaseTwoUI.isMapOpen()) {
        phaseTwoUI.closeMapModal();
        playerControls.setPaused(false);
      } else {
        followCamera.exitLock();
        playerControls.setPaused(true);
        phaseTwoUI.openMapModal();
      }
      return;
    }

    // Interact (E)
    if (event.code === 'KeyE') {
      if (!phaseTwoUI.isOpen()) {
        if (proximity.nearAkosua) {
          event.preventDefault();
          followCamera.exitLock();
          playerControls.setPaused(true);
          phaseTwoUI.openPartnerModal();
        } else if (proximity.nearGroup) {
          event.preventDefault();
          followCamera.exitLock();
          playerControls.setPaused(true);
          phaseTwoUI.openGroupModal();
        } else if (proximity.nearLibrary) {
          event.preventDefault();
          followCamera.exitLock();
          playerControls.setPaused(true);
          phaseTwoUI.openLibraryModal();
        } else if (proximity.nearCafe) {
          event.preventDefault();
          followCamera.exitLock();
          playerControls.setPaused(true);
          phaseTwoUI.openCafeModal();
        } else if (proximity.nearLecture) {
          event.preventDefault();
          const snap = gameState.getSnapshot();
          if (snap.minutesOfDay >= 17 * 60 || snap.lectureCompleted) {
            // Afternoon/Evening Great Hall: Midterm Exam
            followCamera.exitLock();
            playerControls.setPaused(true);
            phaseTwoUI.openExamModal();
          } else if (snap.lectureDecision === null) {
            followCamera.exitLock();
            playerControls.setPaused(true);
            phaseTwoUI.setOpen(true);
          } else if (snap.lectureDecision === 'attend' && !snap.lectureCompleted) {
            followCamera.exitLock();
            playerControls.setPaused(true);
            phaseTwoUI.openClassroomModal(() => {
              const comp = gameState.completeLectureArrival();
              playerControls.setPaused(false);
              if (comp) {
                phaseTwoUI.showToast({
                  title: 'Lecture Complete: CSC 201',
                  message: 'Mark attended Dr. Mensah’s lecture. +20 Academics, −20 Energy.',
                  icon: '🎓',
                  duration: 4500,
                  type: 'success',
                });
              }
            });
          } else {
            followCamera.exitLock();
            playerControls.setPaused(true);
            phaseTwoUI.openExamModal();
          }
        }
      }
    } else if (event.code === 'Escape') {
      if (phaseTwoUI.isOpen()) {
        event.preventDefault();
        phaseTwoUI.closeAllModals();
        playerControls.setPaused(false);
      }
    }
  });

  // Click on canvas to lock mouse
  renderer.domElement.addEventListener('click', () => {
    if (!phaseTwoUI.isOpen()) {
      followCamera.requestLock();
    }
  });

  // 8. Responsive Resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', onWindowResize, false);

  // 9. Main Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update player movement & animation
    playerControls.update(delta);

    // Update follow camera
    followCamera.update(mark.root.position, delta);

    // Update campus (students, environmental effects, waypoint beacon)
    campus.update(delta);

    // Update UI telemetry
    ui.update(playerControls);
    proximity = phaseTwoUI.update(mark.root.position);

    // Advance clock only while decisions or dialogues are not active
    if (!phaseTwoUI.isOpen()) {
      gameState.update(delta);
    }

    // Render frame
    renderer.render(scene, camera);
  }

  // Start rendering loop immediately
  animate();

  // Reveal scene cleanly
  setGameLoading('Welcome to RIPPLE!', 100);
  setTimeout(dismissLoadingScreen, 300);
}

// Start game when DOM is loaded with fatal error guard
function start() {
  initGame().catch((err) => {
    console.error('Fatal initialization error:', err);
    setGameLoading(`Error: ${err.message || 'Failed to start'}`, 0);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
