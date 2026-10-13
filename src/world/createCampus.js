import * as THREE from 'three';
import { createRealisticStudent } from './createRealisticStudent.js';

/**
 * Creates the 3D Ghanaian university campus environment inspired by KNUST:
 * - Grand contemporary academic building with tropical sun louvers and glass curtain walls.
 * - Wide paved promenade with interlocking pavers and curb stones.
 * - Landscaped tropical lawns, Royal palm trees, broadleaf shade trees, and flower beds.
 * - Campus benches, street lamps with blue university banners, signage.
 * - Animated background student characters (realistic Ghanaian university students).
 * - Bright warm afternoon lighting, soft shadows, and atmospheric depth.
 */
export async function createCampus(scene) {
  const obstacleBoxes = [];
  const obstacleCylinders = [];
  const cameraCollisionMeshes = [];
  const animatedStudents = [];

  // -------------------------------------------------------------
  // 1. PROCEDURAL TEXTURES (High quality, zero network latency)
  // -------------------------------------------------------------

  // Paved walkway paver texture
  function createPaverTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm grey/sand stone
    ctx.fillStyle = '#d5cdc0';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(200 + Math.random() * 35);
      ctx.fillStyle = `rgba(${shade}, ${shade - 6}, ${shade - 14}, 0.15)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Interlocking tile grid lines
    ctx.strokeStyle = '#9e9282';
    ctx.lineWidth = 4;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 40);
    return texture;
  }

  // Tropical Lawn Grass texture
  function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Lush warm equatorial green
    ctx.fillStyle = '#4c873b';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const g = Math.floor(100 + Math.random() * 70);
      const r = Math.floor(45 + Math.random() * 45);
      ctx.fillStyle = `rgba(${r}, ${g}, 30, 0.25)`;
      ctx.fillRect(x, y, 2, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    return texture;
  }

  // University Banner Texture (Blue with KNUST / Ripple crest & motto)
  function createBannerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Royal Blue field
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 256, 512);

    // Gold inner border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, 224, 480);

    // University Crest (Emblem circle with laurel)
    ctx.beginPath();
    ctx.arc(128, 120, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Crest emblem text
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R', 128, 128);

    // University name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('RIPPLE', 128, 230);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('UNIVERSITY', 128, 255);

    // Decorative divider line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, 275, 176, 4);

    // Motto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 15px sans-serif';
    ctx.fillText('Nyansapo', 128, 315);
    ctx.font = '13px sans-serif';
    ctx.fillText('Wisdom & Innovation', 128, 340);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('KNUST 2026', 128, 440);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Building Facade Signage Texture
  function createBuildingSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Warm Architectural bronze / dark stone backing
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 128);

    // Gold border trim
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 116);

    // Signage text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COLLEGE OF SCIENCE & APPLIED TECHNOLOGY', 512, 60);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 22px sans-serif';
    ctx.fillText('FACULTY OF COMPUTING & MATHEMATICAL SCIENCES', 512, 100);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Wayfinding Signpost Texture
  function createSignpostTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 512, 8);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('↑  MAIN LECTURE HALLS', 30, 60);
    ctx.fillText('←  ADMINISTRATION & LIBRARY', 30, 130);
    ctx.fillText('→  STUDENT CENTRE & CAFETERIA', 30, 200);

    return new THREE.CanvasTexture(canvas);
  }

  // Campus Café Chalkboard Menu Texture
  function createCafeMenuTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark slate chalkboard
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Rustic wooden frame border
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 498);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☕ CAMPUS CAFÉ', 256, 62);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PATIO REFRESHMENTS', 256, 96);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 116);
    ctx.lineTo(472, 116);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• Chilled Sobolo', 50, 168);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GH₵ 8.00', 360, 168);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• Golden Meat Pie', 50, 222);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GH₵ 12.00', 360, 222);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• Fresh Mango Juice', 50, 276);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GH₵ 10.00', 360, 276);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('• Black Roast Coffee', 50, 330);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GH₵ 14.00', 360, 330);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Student Discount with ID', 256, 420);
    ctx.fillStyle = '#34d399';
    ctx.fillText('Open Daily: 7:00 AM – 9:00 PM', 256, 460);

    return new THREE.CanvasTexture(canvas);
  }

  const paverTexture = createPaverTexture();
  const grassTexture = createGrassTexture();
  const bannerTexture = createBannerTexture();
  const buildingSignTexture = createBuildingSignTexture();
  const signpostTexture = createSignpostTexture();
  const cafeMenuTexture = createCafeMenuTexture();

  // -------------------------------------------------------------
  // 2. MATERIALS
  // -------------------------------------------------------------
  const paverMat = new THREE.MeshStandardMaterial({
    map: paverTexture,
    roughness: 0.85,
    metalness: 0.05,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.9,
    metalness: 0.0,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b2,
    roughness: 0.8,
  });

  const concreteWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0, // Warm sandstone concrete
    roughness: 0.78,
  });

  const terracottaAccentMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412, // Rich terracotta orange-brown
    roughness: 0.7,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
  });

  const glassWindowMat = new THREE.MeshPhysicalMaterial({
    color: 0x60a5fa,
    metalness: 0.1,
    roughness: 0.12,
    transmission: 0.6,
    transparent: true,
    opacity: 0.88,
    reflectivity: 0.9,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Warm teak wood slats
    roughness: 0.65,
  });

  const metalBenchMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.7,
  });

  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x6d5642,
    roughness: 0.9,
  });

  const palmLeafMat = new THREE.MeshStandardMaterial({
    color: 0x226b28,
    roughness: 0.65,
    side: THREE.DoubleSide,
  });

  const treeFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a2f,
    roughness: 0.8,
  });

  const treeBarkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.85,
  });

  const flowerMagentaMat = new THREE.MeshStandardMaterial({
    color: 0xc026d3, // Bougainvillea magenta
    roughness: 0.6,
  });

  const flowerYellowMat = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Croton golden
    roughness: 0.6,
  });

  const bushGreenMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
  });

  // -------------------------------------------------------------
  // 3. GROUND, WALKWAYS & LAWNS
  // -------------------------------------------------------------
  const groundGroup = new THREE.Group();
  groundGroup.name = 'GroundGroup';
  scene.add(groundGroup);

  // Large outer base ground (perimeter lawn)
  const baseGroundGeom = new THREE.PlaneGeometry(120, 140);
  const baseGround = new THREE.Mesh(baseGroundGeom, grassMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.position.set(0, -0.02, 5);
  baseGround.receiveShadow = true;
  groundGroup.add(baseGround);

  // Central Walkway Promenade (10m wide, extends toward academic building)
  const walkwayGeom = new THREE.BoxGeometry(10.0, 0.12, 70.0);
  const walkwayMesh = new THREE.Mesh(walkwayGeom, paverMat);
  walkwayMesh.position.set(0, 0.05, 5.0);
  walkwayMesh.receiveShadow = true;
  groundGroup.add(walkwayMesh);

  // Crossway path (8m wide, connecting east-west gardens)
  const crossPathGeom = new THREE.BoxGeometry(44.0, 0.12, 6.0);
  const crossPathMesh = new THREE.Mesh(crossPathGeom, paverMat);
  crossPathMesh.position.set(0, 0.051, 8.0);
  crossPathMesh.receiveShadow = true;
  groundGroup.add(crossPathMesh);

  // Raised Curbs bordering the main walkway
  for (let side = -1; side <= 1; side += 2) {
    const curbGeom = new THREE.BoxGeometry(0.3, 0.18, 70.0);
    const curbMesh = new THREE.Mesh(curbGeom, curbMat);
    curbMesh.position.set(side * 5.15, 0.08, 5.0);
    curbMesh.castShadow = true;
    curbMesh.receiveShadow = true;
    groundGroup.add(curbMesh);
  }

  // Raised Curbs bordering crossway
  for (let side = -1; side <= 1; side += 2) {
    const curbGeom = new THREE.BoxGeometry(44.0, 0.18, 0.3);
    const curbMesh = new THREE.Mesh(curbGeom, curbMat);
    curbMesh.position.set(0, 0.08, 8.0 + side * 3.15);
    curbMesh.castShadow = true;
    curbMesh.receiveShadow = true;
    groundGroup.add(curbMesh);
  }

  // Landscaped Lawn Quadrants with Raised Planter Curbs
  const lawnQuads = [
    { x: -14.0, z: -10.0, w: 16.0, d: 26.0 },
    { x: 14.0, z: -10.0, w: 16.0, d: 26.0 },
    { x: -14.0, z: 24.0, w: 16.0, d: 24.0 },
    { x: 14.0, z: 24.0, w: 16.0, d: 24.0 },
  ];

  lawnQuads.forEach((quad) => {
    const lGeom = new THREE.BoxGeometry(quad.w, 0.14, quad.d);
    const lMesh = new THREE.Mesh(lGeom, grassMat);
    lMesh.position.set(quad.x, 0.06, quad.z);
    lMesh.receiveShadow = true;
    groundGroup.add(lMesh);
  });

  // -------------------------------------------------------------
  // 4. MAIN ACADEMIC BUILDING (KNUST Contemporary Architecture)
  // -------------------------------------------------------------
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'AcademicBuilding';
  scene.add(buildingGroup);

  const buildingZ = -44.0;
  const buildingWidth = 56.0;
  const buildingHeight = 16.0;
  const buildingDepth = 22.0;

  // Main Building Core Structure
  const mainBlockGeom = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
  const mainBlock = new THREE.Mesh(mainBlockGeom, concreteWallMat);
  mainBlock.position.set(0, buildingHeight / 2, buildingZ);
  mainBlock.castShadow = true;
  mainBlock.receiveShadow = true;
  buildingGroup.add(mainBlock);
  cameraCollisionMeshes.push(mainBlock);

  // Add box collision for main building
  obstacleBoxes.push({
    minX: -buildingWidth / 2 - 1,
    maxX: buildingWidth / 2 + 1,
    minZ: buildingZ - buildingDepth / 2 - 2,
    maxZ: buildingZ + buildingDepth / 2 + 0.5,
  });

  // Terracotta Architectural Accent Pilasters
  for (let x = -26; x <= 26; x += 6.5) {
    if (Math.abs(x) < 8) continue; // Skip entrance central bay
    const pilasterGeom = new THREE.BoxGeometry(0.8, buildingHeight + 0.5, 0.8);
    const pilaster = new THREE.Mesh(pilasterGeom, terracottaAccentMat);
    pilaster.position.set(x, buildingHeight / 2, buildingZ + buildingDepth / 2 + 0.4);
    pilaster.castShadow = true;
    pilaster.receiveShadow = true;
    buildingGroup.add(pilaster);
  }

  // Glass Curtain Wall Facades (Front wings)
  for (let side = -1; side <= 1; side += 2) {
    const glassFacadeGeom = new THREE.BoxGeometry(18.0, 11.0, 0.2);
    const glassFacade = new THREE.Mesh(glassFacadeGeom, glassWindowMat);
    glassFacade.position.set(side * 17.5, 8.5, buildingZ + buildingDepth / 2 + 0.12);
    buildingGroup.add(glassFacade);

    // Modern Sun Louvers / Brise-Soleil (Tropical shading fins)
    for (let h = 4.0; h <= 13.0; h += 1.8) {
      const louverGeom = new THREE.BoxGeometry(18.2, 0.15, 0.8);
      const louver = new THREE.Mesh(louverGeom, concreteWallMat);
      louver.position.set(side * 17.5, h, buildingZ + buildingDepth / 2 + 0.5);
      louver.castShadow = true;
      buildingGroup.add(louver);
    }
  }

  // --- Grand Welcoming Entrance Canopy & Portico ---
  // Large Cantilevered Concrete Roof Canopy
  const canopyWidth = 16.0;
  const canopyDepth = 10.0;
  const canopyHeight = 0.6;
  const canopyY = 7.0;
  const canopyZ = buildingZ + buildingDepth / 2 + canopyDepth / 2; // ~ -28.0

  const canopyGeom = new THREE.BoxGeometry(canopyWidth, canopyHeight, canopyDepth);
  const canopyMesh = new THREE.Mesh(canopyGeom, concreteWallMat);
  canopyMesh.position.set(0, canopyY, canopyZ);
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  buildingGroup.add(canopyMesh);
  cameraCollisionMeshes.push(canopyMesh);

  // Cantilever Facia Accent (Terracotta trim on canopy rim)
  const canopyTrimGeom = new THREE.BoxGeometry(canopyWidth + 0.2, 0.3, canopyDepth + 0.2);
  const canopyTrim = new THREE.Mesh(canopyTrimGeom, terracottaAccentMat);
  canopyTrim.position.set(0, canopyY + 0.3, canopyZ);
  buildingGroup.add(canopyTrim);

  const lectureLocation = new THREE.Vector3(0, 0, -27);
  const lectureMarker = new THREE.Group();
  lectureMarker.name = 'LectureDestination';
  lectureMarker.position.copy(lectureLocation);
  lectureMarker.position.y = 0.12;

  // Outer glowing pulse ring
  const markerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );
  markerRing.rotation.x = -Math.PI / 2;
  lectureMarker.add(markerRing);

  // Inner glowing disc
  const beaconDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  beaconDisc.rotation.x = -Math.PI / 2;
  beaconDisc.position.y = 0.02;
  lectureMarker.add(beaconDisc);

  // Floating 3D waypoint diamond above the marker
  const diamondMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.7,
    })
  );
  diamondMesh.position.y = 1.6;
  lectureMarker.add(diamondMesh);

  const markerLight = new THREE.PointLight(0x38bdf8, 2.5, 6);
  markerLight.position.y = 0.8;
  lectureMarker.add(markerLight);
  scene.add(lectureMarker);

  // Massive Concrete Entrance Support Pillars
  const pillarPositions = [
    { x: -6.8, z: buildingZ + buildingDepth / 2 + canopyDepth - 0.8 },
    { x: 6.8, z: buildingZ + buildingDepth / 2 + canopyDepth - 0.8 },
    { x: -6.8, z: buildingZ + buildingDepth / 2 + 1.2 },
    { x: 6.8, z: buildingZ + buildingDepth / 2 + 1.2 },
  ];

  pillarPositions.forEach((pos) => {
    const pillarGeom = new THREE.BoxGeometry(0.9, canopyY, 0.9);
    const pillarMesh = new THREE.Mesh(pillarGeom, concreteWallMat);
    pillarMesh.position.set(pos.x, canopyY / 2, pos.z);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    buildingGroup.add(pillarMesh);
    cameraCollisionMeshes.push(pillarMesh);

    obstacleBoxes.push({
      minX: pos.x - 0.6,
      maxX: pos.x + 0.6,
      minZ: pos.z - 0.6,
      maxZ: pos.z + 0.6,
    });
  });

  // Entrance Steps & Podium (3 wide tiers)
  for (let step = 0; step < 3; step++) {
    const stepW = 14.0 - step * 0.6;
    const stepD = 6.0 - step * 1.4;
    const stepH = 0.20;
    const sGeom = new THREE.BoxGeometry(stepW, stepH, stepD);
    const sMesh = new THREE.Mesh(sGeom, paverMat);
    sMesh.position.set(0, step * stepH + stepH / 2, buildingZ + buildingDepth / 2 + 3.0 - step * 0.7);
    sMesh.receiveShadow = true;
    buildingGroup.add(sMesh);
  }

  // Entrance Lobby Glass & Sliding Doors
  const lobbyGlassGeom = new THREE.BoxGeometry(11.0, 5.2, 0.1);
  const lobbyGlass = new THREE.Mesh(lobbyGlassGeom, glassWindowMat);
  lobbyGlass.position.set(0, 3.2, buildingZ + buildingDepth / 2 + 0.1);
  buildingGroup.add(lobbyGlass);

  // Interior Lobby Ambient Glow
  const lobbyLight = new THREE.PointLight(0xffedd5, 1.6, 16);
  lobbyLight.position.set(0, 3.5, buildingZ + buildingDepth / 2 - 2.5);
  buildingGroup.add(lobbyLight);

  // Building Signage Architrave (mounted above entrance canopy)
  const signBoardGeom = new THREE.BoxGeometry(14.0, 1.8, 0.25);
  const signBoardMat = new THREE.MeshStandardMaterial({
    map: buildingSignTexture,
    roughness: 0.5,
  });
  const signBoardMesh = new THREE.Mesh(signBoardGeom, signBoardMat);
  signBoardMesh.position.set(0, canopyY + 1.2, buildingZ + buildingDepth / 2 + canopyDepth);
  signBoardMesh.castShadow = true;
  buildingGroup.add(signBoardMesh);

  // -------------------------------------------------------------
  // 5. TROPICAL TREES & HEDGES
  // -------------------------------------------------------------
  const floraGroup = new THREE.Group();
  floraGroup.name = 'FloraGroup';
  scene.add(floraGroup);

  // Helper: Create Royal Palm Tree (KNUST Campus hallmark)
  function createRoyalPalm(x, z, scale = 1.0) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    const trunkHeight = 8.5 * scale;
    const trunkGeom = new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, trunkHeight, 10);
    trunkGeom.translate(0, trunkHeight / 2, 0);
    const trunk = new THREE.Mesh(trunkGeom, palmTrunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    palm.add(trunk);

    // Crown shaft (vibrant green upper neck)
    const neckHeight = 1.4 * scale;
    const neckGeom = new THREE.CylinderGeometry(0.20 * scale, 0.22 * scale, neckHeight, 10);
    neckGeom.translate(0, trunkHeight + neckHeight / 2, 0);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x3d7e35, roughness: 0.7 });
    const neck = new THREE.Mesh(neckGeom, neckMat);
    neck.castShadow = true;
    palm.add(neck);

    // Palm Fronds / Leaves radiating outward
    const numFronds = 12;
    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2 + (Math.random() * 0.2);
      const frondGroup = new THREE.Group();
      frondGroup.position.set(0, trunkHeight + neckHeight, 0);
      frondGroup.rotation.y = angle;

      const frondLength = (3.6 + Math.random() * 0.8) * scale;
      const frondCurve = 0.55 + (i % 2) * 0.25;

      const leafGeom = new THREE.PlaneGeometry(0.55 * scale, frondLength);
      leafGeom.translate(0, frondLength / 2, 0);
      const leafMesh = new THREE.Mesh(leafGeom, palmLeafMat);
      leafMesh.rotation.x = frondCurve;
      leafMesh.castShadow = true;
      frondGroup.add(leafMesh);

      palm.add(frondGroup);
    }

    obstacleCylinders.push({ x, z, radius: 0.45 * scale });
    return palm;
  }

  // Helper: Create Broadleaf Tropical Shade Tree (Neem / Mahogany)
  function createShadeTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    const trunkHeight = 4.2 * scale;
    const trunkGeom = new THREE.CylinderGeometry(0.35 * scale, 0.55 * scale, trunkHeight, 10);
    trunkGeom.translate(0, trunkHeight / 2, 0);
    const trunk = new THREE.Mesh(trunkGeom, treeBarkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Dense tropical foliage cloud clusters
    const foliageClusters = [
      { y: trunkHeight + 1.2 * scale, r: 2.8 * scale, xOff: 0, zOff: 0 },
      { y: trunkHeight + 2.2 * scale, r: 2.3 * scale, xOff: 0.8 * scale, zOff: 0.5 * scale },
      { y: trunkHeight + 2.0 * scale, r: 2.4 * scale, xOff: -0.9 * scale, zOff: -0.6 * scale },
      { y: trunkHeight + 3.2 * scale, r: 2.0 * scale, xOff: 0.2 * scale, zOff: 0.2 * scale },
    ];

    foliageClusters.forEach((cl) => {
      const fGeom = new THREE.DodecahedronGeometry(cl.r, 1);
      const fMesh = new THREE.Mesh(fGeom, treeFoliageMat);
      fMesh.position.set(cl.xOff, cl.y, cl.zOff);
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      tree.add(fMesh);
    });

    obstacleCylinders.push({ x, z, radius: 0.65 * scale });
    return tree;
  }

  // Plant Royal Palms along both sides of the main promenade
  const palmZCoords = [-24, -14, -4, 6, 16, 26, 36];
  palmZCoords.forEach((z) => {
    floraGroup.add(createRoyalPalm(-6.2, z, 1.05));
    floraGroup.add(createRoyalPalm(6.2, z, 1.05));
  });

  // Plant Tropical Broadleaf Shade Trees in garden lawns
  const shadeTreeCoords = [
    { x: -16, z: -16, s: 1.15 },
    { x: -18, z: 2, s: 1.2 },
    { x: -15, z: 28, s: 1.1 },
    { x: 16, z: -16, s: 1.15 },
    { x: 18, z: 2, s: 1.2 },
    { x: 15, z: 28, s: 1.1 },
  ];
  shadeTreeCoords.forEach((tc) => {
    floraGroup.add(createShadeTree(tc.x, tc.z, tc.s));
  });

  // Landscaped Tropical Flower Beds & Bushes (Bougainvillea & Croton)
  function createFlowerBed(x, z, length, width) {
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);

    // Raised concrete border rim
    const rimGeom = new THREE.BoxGeometry(width + 0.3, 0.22, length + 0.3);
    const rim = new THREE.Mesh(rimGeom, curbMat);
    rim.position.y = 0.11;
    rim.receiveShadow = true;
    bed.add(rim);

    // Soil
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.95 });
    const soilGeom = new THREE.BoxGeometry(width, 0.2, length);
    const soil = new THREE.Mesh(soilGeom, soilMat);
    soil.position.y = 0.12;
    bed.add(soil);

    // Flower shrubs along bed
    const count = Math.max(3, Math.floor(length / 1.5));
    for (let i = 0; i < count; i++) {
      const bZ = -length / 2 + (i + 0.5) * (length / count);
      const bX = (Math.random() - 0.5) * (width * 0.4);

      // Bush base
      const bushGeom = new THREE.SphereGeometry(0.45 + Math.random() * 0.15, 8, 8);
      const bushMesh = new THREE.Mesh(bushGeom, bushGreenMat);
      bushMesh.position.set(bX, 0.42, bZ);
      bushMesh.castShadow = true;
      bed.add(bushMesh);

      // Colorful flowers (magenta or gold)
      const flowerColorMat = (i % 2 === 0) ? flowerMagentaMat : flowerYellowMat;
      for (let f = 0; f < 5; f++) {
        const flowerGeom = new THREE.SphereGeometry(0.12, 6, 6);
        const flowerMesh = new THREE.Mesh(flowerGeom, flowerColorMat);
        flowerMesh.position.set(
          bX + (Math.random() - 0.5) * 0.6,
          0.55 + Math.random() * 0.25,
          bZ + (Math.random() - 0.5) * 0.6
        );
        flowerMesh.castShadow = true;
        bed.add(flowerMesh);
      }
    }

    obstacleBoxes.push({
      minX: x - width / 2 - 0.2,
      maxX: x + width / 2 + 0.2,
      minZ: z - length / 2 - 0.2,
      maxZ: z + length / 2 + 0.2,
    });

    return bed;
  }

  // Flower beds flanking entrance promenade & crossways
  floraGroup.add(createFlowerBed(-7.8, -12, 12, 1.6));
  floraGroup.add(createFlowerBed(7.8, -12, 12, 1.6));
  floraGroup.add(createFlowerBed(-7.8, 20, 12, 1.6));
  floraGroup.add(createFlowerBed(7.8, 20, 12, 1.6));

  // -------------------------------------------------------------
  // 6. CAMPUS FURNITURE (Benches, Banners, Lamps, Signpost)
  // -------------------------------------------------------------
  const propsGroup = new THREE.Group();
  propsGroup.name = 'CampusProps';
  scene.add(propsGroup);

  // Modern Campus Bench (Wood slats + dark steel frame)
  function createCampusBench(x, z, rotY) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;

    // Wood seat slats
    for (let i = 0; i < 4; i++) {
      const slatGeom = new THREE.BoxGeometry(2.2, 0.05, 0.12);
      const slat = new THREE.Mesh(slatGeom, woodMat);
      slat.position.set(0, 0.48, -0.18 + i * 0.14);
      slat.castShadow = true;
      slat.receiveShadow = true;
      bench.add(slat);
    }

    // Wood backrest slats
    for (let i = 0; i < 3; i++) {
      const slatGeom = new THREE.BoxGeometry(2.2, 0.11, 0.04);
      const slat = new THREE.Mesh(slatGeom, woodMat);
      slat.position.set(0, 0.65 + i * 0.13, -0.25);
      slat.castShadow = true;
      bench.add(slat);
    }

    // Metal legs / armrests
    for (let s = -1; s <= 1; s += 2) {
      const legGeom = new THREE.BoxGeometry(0.08, 0.5, 0.55);
      const leg = new THREE.Mesh(legGeom, metalBenchMat);
      leg.position.set(s * 0.95, 0.25, 0.02);
      leg.castShadow = true;
      bench.add(leg);

      const armGeom = new THREE.BoxGeometry(0.08, 0.4, 0.08);
      const arm = new THREE.Mesh(armGeom, metalBenchMat);
      arm.position.set(s * 0.95, 0.65, -0.22);
      arm.castShadow = true;
      bench.add(arm);
    }

    obstacleBoxes.push({
      minX: x - 1.2,
      maxX: x + 1.2,
      minZ: z - 0.6,
      maxZ: z + 0.6,
    });

    return bench;
  }

  // Campus Light Post with Dual Blue University Banners
  function createLampPostWithBanners(x, z) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);

    // Post
    const postHeight = 6.2;
    const postGeom = new THREE.CylinderGeometry(0.10, 0.14, postHeight, 10);
    postGeom.translate(0, postHeight / 2, 0);
    const postMesh = new THREE.Mesh(postGeom, darkTrimMat);
    postMesh.castShadow = true;
    lamp.add(postMesh);

    // Crossbar arms for lantern & banners
    const armGeom = new THREE.BoxGeometry(1.6, 0.08, 0.08);
    const armMesh = new THREE.Mesh(armGeom, darkTrimMat);
    armMesh.position.set(0, postHeight - 0.4, 0);
    armMesh.castShadow = true;
    lamp.add(armMesh);

    // Modern Lantern fixture
    const lanternGeom = new THREE.BoxGeometry(0.35, 0.2, 0.35);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffedd5,
      emissiveIntensity: 0.4,
    });
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(0, postHeight, 0);
    lamp.add(lantern);

    // Blue University Banner hanging from side arm
    const bannerGeom = new THREE.PlaneGeometry(1.0, 2.2);
    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTexture,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const bannerMesh = new THREE.Mesh(bannerGeom, bannerMat);
    bannerMesh.position.set(0.65, postHeight - 1.6, 0);
    bannerMesh.castShadow = true;
    lamp.add(bannerMesh);

    // Banner mounting rod
    const rodGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    rodGeom.rotateZ(Math.PI / 2);
    const rod1 = new THREE.Mesh(rodGeom, darkTrimMat);
    rod1.position.set(0.65, postHeight - 0.5, 0);
    lamp.add(rod1);
    const rod2 = new THREE.Mesh(rodGeom, darkTrimMat);
    rod2.position.set(0.65, postHeight - 2.7, 0);
    lamp.add(rod2);

    obstacleCylinders.push({ x, z, radius: 0.3 });
    return lamp;
  }

  // Wayfinding Signpost
  function createWayfindingPost(x, z) {
    const post = new THREE.Group();
    post.position.set(x, 0, z);

    const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    poleGeom.translate(0, 1.6, 0);
    const pole = new THREE.Mesh(poleGeom, darkTrimMat);
    pole.castShadow = true;
    post.add(pole);

    const signGeom = new THREE.BoxGeometry(1.8, 0.9, 0.08);
    const signMat = new THREE.MeshStandardMaterial({
      map: signpostTexture,
      roughness: 0.5,
    });
    const signBoard = new THREE.Mesh(signGeom, signMat);
    signBoard.position.set(0, 2.4, 0);
    signBoard.castShadow = true;
    post.add(signBoard);

    obstacleCylinders.push({ x, z, radius: 0.35 });
    return post;
  }

  // Place Benches along walkways
  propsGroup.add(createCampusBench(-7.2, 0.0, Math.PI / 2));
  propsGroup.add(createCampusBench(7.2, 0.0, -Math.PI / 2));
  propsGroup.add(createCampusBench(-7.2, 16.0, Math.PI / 2));
  propsGroup.add(createCampusBench(7.2, 16.0, -Math.PI / 2));
  propsGroup.add(createCampusBench(-16.0, 5.0, 0));
  propsGroup.add(createCampusBench(16.0, 5.0, Math.PI));

  // Place Lamp Posts with University Banners
  propsGroup.add(createLampPostWithBanners(-5.8, -20.0));
  propsGroup.add(createLampPostWithBanners(5.8, -20.0));
  propsGroup.add(createLampPostWithBanners(-5.8, -2.0));
  propsGroup.add(createLampPostWithBanners(5.8, -2.0));
  propsGroup.add(createLampPostWithBanners(-5.8, 18.0));
  propsGroup.add(createLampPostWithBanners(5.8, 18.0));
  propsGroup.add(createLampPostWithBanners(-5.8, 32.0));
  propsGroup.add(createLampPostWithBanners(5.8, 32.0));

  // Place Directional Wayfinding Signposts
  propsGroup.add(createWayfindingPost(-4.8, 9.5));

  // -------------------------------------------------------------
  // 6.5 CAMPUS CAFÉ PATIO TERRACE (Phase 2.1.1 Skip Destination)
  // -------------------------------------------------------------
  const cafeLocation = new THREE.Vector3(-14.0, 0, 8.0);
  let cafeDiamondMesh = null;
  let cafeMarkerLight = null;

  const akosuaLocation = new THREE.Vector3(-10.0, 0, 18.0);
  let akosuaDiamondMesh = null;
  let akosuaMarkerLight = null;

  const groupLocation = new THREE.Vector3(14.0, 0, 8.0);
  let groupDiamondMesh = null;
  let groupMarkerLight = null;

  const libraryLocation = new THREE.Vector3(14.0, 0, -10.0);
  let libraryDiamondMesh = null;
  let libraryMarkerLight = null;

  const examLocation = new THREE.Vector3(0, 0, -27.0);

  const cafeGroup = new THREE.Group();
  cafeGroup.name = 'CampusCafe_Terrace';
  scene.add(cafeGroup);

  // Paved Patio Terrace Base (extending crossway towards student centre)
  const cafePatioGeom = new THREE.BoxGeometry(8.0, 0.12, 7.0);
  const cafePatioMesh = new THREE.Mesh(cafePatioGeom, paverMat);
  cafePatioMesh.position.set(-14.0, 0.052, 8.5);
  cafePatioMesh.receiveShadow = true;
  cafeGroup.add(cafePatioMesh);

  // Large Patio Parasol Umbrella
  const umbrellaGroup = new THREE.Group();
  umbrellaGroup.position.set(-15.0, 0, 10.0);

  // Umbrella Mast Pole
  const uPoleGeom = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12);
  uPoleGeom.translate(0, 1.6, 0);
  const uPole = new THREE.Mesh(uPoleGeom, darkTrimMat);
  uPole.castShadow = true;
  umbrellaGroup.add(uPole);

  // Umbrella Fabric Canopy (Warm Ivory with Forest Green Band)
  const canopyConeGeom = new THREE.ConeGeometry(2.1, 0.8, 8);
  canopyConeGeom.translate(0, 2.8, 0);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7, // Warm ivory canvas
    roughness: 0.8,
  });
  const umbrellaCanopyMesh = new THREE.Mesh(canopyConeGeom, canopyMat);
  umbrellaCanopyMesh.castShadow = true;
  umbrellaGroup.add(umbrellaCanopyMesh);

  const canopyRimGeom = new THREE.CylinderGeometry(2.12, 2.12, 0.15, 8);
  canopyRimGeom.translate(0, 2.4, 0);
  const canopyRimMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
  const canopyRim = new THREE.Mesh(canopyRimGeom, canopyRimMat);
  canopyRim.castShadow = true;
  umbrellaGroup.add(canopyRim);

  cafeGroup.add(umbrellaGroup);
  obstacleCylinders.push({ x: -15.0, z: 10.0, radius: 0.35 });

  // Teak Café Dining Tables & Metal Chairs
  function createCafeTableSet(tx, tz) {
    const tableSet = new THREE.Group();
    tableSet.position.set(tx, 0, tz);

    // Table Top
    const topGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.05, 24);
    topGeom.translate(0, 0.76, 0);
    const tableTop = new THREE.Mesh(topGeom, woodMat);
    tableTop.castShadow = true;
    tableSet.add(tableTop);

    // Table Center Leg
    const legGeom = new THREE.CylinderGeometry(0.05, 0.07, 0.76, 12);
    legGeom.translate(0, 0.38, 0);
    const tableLeg = new THREE.Mesh(legGeom, metalBenchMat);
    tableLeg.castShadow = true;
    tableSet.add(tableLeg);

    // Table Base disc
    const baseGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16);
    baseGeom.translate(0, 0.015, 0);
    const tableBase = new THREE.Mesh(baseGeom, metalBenchMat);
    tableSet.add(tableBase);

    // Refreshment props on table: Ghanaian Sobolo beverage glass + plate
    const glassGeom = new THREE.CylinderGeometry(0.045, 0.035, 0.12, 12);
    glassGeom.translate(0, 0.84, 0);
    const soboloMat = new THREE.MeshStandardMaterial({
      color: 0x9f1239, // Deep ruby red hibiscus sobolo
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const glass = new THREE.Mesh(glassGeom, soboloMat);
    glass.position.set(0.12, 0, 0.08);
    tableSet.add(glass);

    // Straw
    const strawGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.16, 6);
    strawGeom.translate(0, 0.88, 0);
    strawGeom.rotateZ(0.2);
    const strawMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const straw = new THREE.Mesh(strawGeom, strawMat);
    straw.position.set(0.12, 0, 0.08);
    tableSet.add(straw);

    // Meat pie on small ceramic plate
    const plateGeom = new THREE.CylinderGeometry(0.12, 0.09, 0.02, 16);
    plateGeom.translate(0, 0.79, 0);
    const plate = new THREE.Mesh(plateGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    plate.position.set(-0.14, 0, -0.05);
    tableSet.add(plate);

    const pieGeom = new THREE.BoxGeometry(0.1, 0.04, 0.07);
    pieGeom.translate(0, 0.81, 0);
    const pie = new THREE.Mesh(pieGeom, new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
    pie.position.set(-0.14, 0, -0.05);
    tableSet.add(pie);

    // Two Bistro Chairs
    [-0.75, 0.75].forEach((offset, idx) => {
      const chair = new THREE.Group();
      chair.position.set(offset, 0, 0);
      chair.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;

      const seatGeom = new THREE.BoxGeometry(0.4, 0.03, 0.4);
      seatGeom.translate(0, 0.45, 0);
      const seat = new THREE.Mesh(seatGeom, woodMat);
      chair.add(seat);

      const backGeom = new THREE.BoxGeometry(0.4, 0.4, 0.03);
      backGeom.translate(0, 0.65, -0.18);
      const back = new THREE.Mesh(backGeom, woodMat);
      chair.add(back);

      const cLegGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
      cLegGeom.translate(0, 0.225, 0);
      const chairLegs = new THREE.Mesh(cLegGeom, metalBenchMat);
      chair.add(chairLegs);

      tableSet.add(chair);
    });

    obstacleCylinders.push({ x: tx, z: tz, radius: 0.75 });
    return tableSet;
  }

  cafeGroup.add(createCafeTableSet(-15.0, 10.0));
  cafeGroup.add(createCafeTableSet(-12.2, 10.2));

  // Sidewalk Chalkboard Menu Sign
  const menuSign = new THREE.Group();
  menuSign.position.set(-11.0, 0, 6.2);
  menuSign.rotation.y = 0.25;

  const boardGeom = new THREE.BoxGeometry(1.2, 1.4, 0.08);
  boardGeom.translate(0, 0.9, 0);
  const boardMat = new THREE.MeshStandardMaterial({ map: cafeMenuTexture, roughness: 0.5 });
  const boardMesh = new THREE.Mesh(boardGeom, boardMat);
  boardMesh.castShadow = true;
  menuSign.add(boardMesh);

  // Chalkboard wooden A-frame legs
  const leg1Geom = new THREE.BoxGeometry(0.06, 1.6, 0.06);
  leg1Geom.translate(-0.55, 0.8, 0);
  const leg1 = new THREE.Mesh(leg1Geom, woodMat);
  menuSign.add(leg1);

  const leg2Geom = new THREE.BoxGeometry(0.06, 1.6, 0.06);
  leg2Geom.translate(0.55, 0.8, 0);
  const leg2 = new THREE.Mesh(leg2Geom, woodMat);
  menuSign.add(leg2);

  cafeGroup.add(menuSign);
  obstacleBoxes.push({
    minX: -11.6,
    maxX: -10.4,
    minZ: 5.7,
    maxZ: 6.7,
  });

  // Glowing Waypoint Beacon for Campus Café
  const cafeMarker = new THREE.Group();
  cafeMarker.name = 'CafeDestination';
  cafeMarker.position.copy(cafeLocation);
  cafeMarker.position.y = 0.12;

  // Amber outer glowing ring
  const cafeMarkerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );
  cafeMarkerRing.rotation.x = -Math.PI / 2;
  cafeMarker.add(cafeMarkerRing);

  // Amber inner glowing disc
  const cafeBeaconDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  cafeBeaconDisc.rotation.x = -Math.PI / 2;
  cafeBeaconDisc.position.y = 0.02;
  cafeMarker.add(cafeBeaconDisc);

  // Floating 3D waypoint diamond above the cafe marker
  cafeDiamondMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.7,
    })
  );
  cafeDiamondMesh.position.y = 1.6;
  cafeMarker.add(cafeDiamondMesh);

  cafeMarkerLight = new THREE.PointLight(0xf59e0b, 2.5, 6);
  cafeMarkerLight.position.y = 0.8;
  cafeMarker.add(cafeMarkerLight);
  scene.add(cafeMarker);

  // -------------------------------------------------------------
  // 6.6 AKOSUA'S QUAD GARDEN BENCH (Romantic Partner Meetup)
  // -------------------------------------------------------------
  const akosuaGroup = new THREE.Group();
  akosuaGroup.name = 'Akosua_GardenMeetup';
  scene.add(akosuaGroup);

  // Stone paved patio pad under the bench
  const akosuaPadGeom = new THREE.BoxGeometry(4.0, 0.12, 3.5);
  const akosuaPadMesh = new THREE.Mesh(akosuaPadGeom, paverMat);
  akosuaPadMesh.position.set(-10.0, 0.052, 18.0);
  akosuaPadMesh.receiveShadow = true;
  akosuaGroup.add(akosuaPadMesh);

  // Teak Bench for Akosua
  akosuaGroup.add(createCampusBench(-10.0, 18.0, 0));

  // Planter boxes with flowering bougainvillea behind the bench
  const bougGeom = new THREE.BoxGeometry(3.6, 0.6, 0.6);
  const bougPlanter = new THREE.Mesh(bougGeom, terracottaAccentMat);
  bougPlanter.position.set(-10.0, 0.3, 19.4);
  bougPlanter.castShadow = true;
  akosuaGroup.add(bougPlanter);

  // Flower hedge clusters
  for (let fx = -1.5; fx <= 1.5; fx += 0.75) {
    const fBushGeom = new THREE.SphereGeometry(0.38, 8, 8);
    const fBush = new THREE.Mesh(fBushGeom, flowerMagentaMat);
    fBush.position.set(-10.0 + fx, 0.75, 19.4);
    fBush.castShadow = true;
    akosuaGroup.add(fBush);
  }

  // Waypoint Beacon for Akosua (Rose-Gold / Pink)
  const akosuaMarker = new THREE.Group();
  akosuaMarker.name = 'AkosuaDestination';
  akosuaMarker.position.copy(akosuaLocation);
  akosuaMarker.position.y = 0.12;

  const akosuaMarkerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );
  akosuaMarkerRing.rotation.x = -Math.PI / 2;
  akosuaMarker.add(akosuaMarkerRing);

  const akosuaBeaconDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  akosuaBeaconDisc.rotation.x = -Math.PI / 2;
  akosuaBeaconDisc.position.y = 0.02;
  akosuaMarker.add(akosuaBeaconDisc);

  akosuaDiamondMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.7,
    })
  );
  akosuaDiamondMesh.position.y = 1.6;
  akosuaMarker.add(akosuaDiamondMesh);

  akosuaMarkerLight = new THREE.PointLight(0xf43f5e, 2.5, 6);
  akosuaMarkerLight.position.y = 0.8;
  akosuaMarker.add(akosuaMarkerLight);
  scene.add(akosuaMarker);

  // -------------------------------------------------------------
  // 6.7 GROUP PROJECT STUDY PERGOLA (Esi & Kofi Meeting Area)
  // -------------------------------------------------------------
  const groupStudyGroup = new THREE.Group();
  groupStudyGroup.name = 'GroupProject_StudyPergola';
  scene.add(groupStudyGroup);

  // Paved Study Terrace Base (East side of crossway at x=14.0, z=8.0)
  const groupPatioGeom = new THREE.BoxGeometry(8.0, 0.12, 7.0);
  const groupPatioMesh = new THREE.Mesh(groupPatioGeom, paverMat);
  groupPatioMesh.position.set(14.0, 0.052, 8.0);
  groupPatioMesh.receiveShadow = true;
  groupStudyGroup.add(groupPatioMesh);

  // Wooden Pergola Roof Structure
  const pergolaPillars = [
    { x: 10.8, z: 5.2 },
    { x: 17.2, z: 5.2 },
    { x: 10.8, z: 10.8 },
    { x: 17.2, z: 10.8 },
  ];
  pergolaPillars.forEach((p) => {
    const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    postGeom.translate(0, 1.6, 0);
    const post = new THREE.Mesh(postGeom, darkTrimMat);
    post.position.set(p.x, 0, p.z);
    post.castShadow = true;
    groupStudyGroup.add(post);
    obstacleCylinders.push({ x: p.x, z: p.z, radius: 0.3 });
  });

  // Cross beams on Pergola
  for (let bz = 5.2; bz <= 10.8; bz += 1.4) {
    const beamGeom = new THREE.BoxGeometry(6.8, 0.14, 0.14);
    const beam = new THREE.Mesh(beamGeom, woodMat);
    beam.position.set(14.0, 3.2, bz);
    beam.castShadow = true;
    groupStudyGroup.add(beam);
  }

  // Large Conference Study Table (14.0, 0, 8.0)
  const groupTableGeom = new THREE.BoxGeometry(2.4, 0.08, 1.4);
  groupTableGeom.translate(0, 0.76, 0);
  const groupTable = new THREE.Mesh(groupTableGeom, woodMat);
  groupTable.position.set(14.0, 0, 8.0);
  groupTable.castShadow = true;
  groupStudyGroup.add(groupTable);

  const tLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.76, 0.1), metalBenchMat);
  tLeg1.position.set(13.0, 0.38, 7.5);
  groupStudyGroup.add(tLeg1);
  const tLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.76, 0.1), metalBenchMat);
  tLeg2.position.set(15.0, 0.38, 7.5);
  groupStudyGroup.add(tLeg2);
  const tLeg3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.76, 0.1), metalBenchMat);
  tLeg3.position.set(13.0, 0.38, 8.5);
  groupStudyGroup.add(tLeg3);
  const tLeg4 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.76, 0.1), metalBenchMat);
  tLeg4.position.set(15.0, 0.38, 8.5);
  groupStudyGroup.add(tLeg4);

  obstacleBoxes.push({
    minX: 12.6,
    maxX: 15.4,
    minZ: 7.1,
    maxZ: 8.9,
  });

  // Laptop Props on Study Table (Open aluminum notebooks with glowing screen)
  function createLaptopProp(lx, lz, rotY) {
    const laptop = new THREE.Group();
    laptop.position.set(lx, 0.80, lz);
    laptop.rotation.y = rotY;

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.26), metalBenchMat);
    laptop.add(base);

    // Screen display (open at 110 degrees)
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.24, 0.012),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.2,
      })
    );
    screen.position.set(0, 0.12, -0.12);
    screen.rotation.x = -0.3;
    laptop.add(screen);
    return laptop;
  }

  groupStudyGroup.add(createLaptopProp(13.5, 7.8, 0.3));
  groupStudyGroup.add(createLaptopProp(14.5, 8.2, -2.8));

  // Study notebooks and textbooks on the table
  const projDocs = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.04, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
  );
  projDocs.position.set(14.0, 0.82, 8.0);
  projDocs.rotation.y = 0.4;
  groupStudyGroup.add(projDocs);

  // Waypoint Beacon for Group Project (Cyan / Turquoise)
  const groupMarker = new THREE.Group();
  groupMarker.name = 'GroupProjectDestination';
  groupMarker.position.copy(groupLocation);
  groupMarker.position.y = 0.12;

  const groupMarkerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );
  groupMarkerRing.rotation.x = -Math.PI / 2;
  groupMarker.add(groupMarkerRing);

  const groupBeaconDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  groupBeaconDisc.rotation.x = -Math.PI / 2;
  groupBeaconDisc.position.y = 0.02;
  groupMarker.add(groupBeaconDisc);

  groupDiamondMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.7,
    })
  );
  groupDiamondMesh.position.y = 1.6;
  groupMarker.add(groupDiamondMesh);

  groupMarkerLight = new THREE.PointLight(0x06b6d4, 2.5, 6);
  groupMarkerLight.position.y = 0.8;
  groupMarker.add(groupMarkerLight);
  scene.add(groupMarker);

  // -------------------------------------------------------------
  // 6.8 BALME LIBRARY & REVISION PAVILION (Quiet Study Zone)
  // -------------------------------------------------------------
  const libraryGroup = new THREE.Group();
  libraryGroup.name = 'BalmeLibrary_StudyPavilion';
  scene.add(libraryGroup);

  // Elevated sandstone floor podium
  const libPodiumGeom = new THREE.BoxGeometry(8.5, 0.20, 8.5);
  const libPodiumMesh = new THREE.Mesh(libPodiumGeom, paverMat);
  libPodiumMesh.position.set(14.0, 0.10, -10.0);
  libPodiumMesh.receiveShadow = true;
  libraryGroup.add(libPodiumMesh);

  // 4 Classical Sandstone Library Columns
  const libColPillars = [
    { x: 10.6, z: -13.4 },
    { x: 17.4, z: -13.4 },
    { x: 10.6, z: -6.6 },
    { x: 17.4, z: -6.6 },
  ];
  libColPillars.forEach((c) => {
    const colGeom = new THREE.CylinderGeometry(0.24, 0.28, 3.8, 16);
    colGeom.translate(0, 1.9, 0);
    const col = new THREE.Mesh(colGeom, concreteWallMat);
    col.position.set(c.x, 0.2, c.z);
    col.castShadow = true;
    libraryGroup.add(col);
    obstacleCylinders.push({ x: c.x, z: c.z, radius: 0.45 });
  });

  // Pavilion Canopy Roof
  const libRoofGeom = new THREE.BoxGeometry(9.0, 0.35, 9.0);
  const libRoof = new THREE.Mesh(libRoofGeom, terracottaAccentMat);
  libRoof.position.set(14.0, 4.0, -10.0);
  libRoof.castShadow = true;
  libraryGroup.add(libRoof);

  // Library Study Desks & Bookcases
  const libDeskGeom = new THREE.BoxGeometry(2.2, 0.75, 1.1);
  libDeskGeom.translate(0, 0.375, 0);
  const libDesk = new THREE.Mesh(libDeskGeom, woodMat);
  libDesk.position.set(14.0, 0.2, -10.0);
  libDesk.castShadow = true;
  libraryGroup.add(libDesk);

  // Wooden Bookcase against back edge
  const libShelfGeom = new THREE.BoxGeometry(3.6, 2.2, 0.5);
  libShelfGeom.translate(0, 1.1, 0);
  const libShelf = new THREE.Mesh(libShelfGeom, woodMat);
  libShelf.position.set(14.0, 0.2, -13.6);
  libShelf.castShadow = true;
  libraryGroup.add(libShelf);

  obstacleBoxes.push({
    minX: 12.0,
    maxX: 16.0,
    minZ: -14.0,
    maxZ: -13.1,
  });

  // Brass Study Desk Lamp (with warm amber bulb light)
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }));
  lampBase.position.set(14.0, 0.97, -10.0);
  libraryGroup.add(lampBase);

  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.4 }));
  lampShade.position.set(14.0, 1.25, -10.0);
  libraryGroup.add(lampShade);

  const deskLight = new THREE.PointLight(0xfef08a, 1.8, 4.5);
  deskLight.position.set(14.0, 1.15, -10.0);
  libraryGroup.add(deskLight);

  // Waypoint Beacon for Library (Sapphire Blue)
  const libraryMarker = new THREE.Group();
  libraryMarker.name = 'LibraryDestination';
  libraryMarker.position.copy(libraryLocation);
  libraryMarker.position.y = 0.22;

  const libraryMarkerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    })
  );
  libraryMarkerRing.rotation.x = -Math.PI / 2;
  libraryMarker.add(libraryMarkerRing);

  const libraryBeaconDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  libraryBeaconDisc.rotation.x = -Math.PI / 2;
  libraryBeaconDisc.position.y = 0.02;
  libraryMarker.add(libraryBeaconDisc);

  libraryDiamondMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.7,
    })
  );
  libraryDiamondMesh.position.y = 1.6;
  libraryMarker.add(libraryDiamondMesh);

  libraryMarkerLight = new THREE.PointLight(0x2563eb, 2.5, 6);
  libraryMarkerLight.position.y = 0.8;
  libraryMarker.add(libraryMarkerLight);
  scene.add(libraryMarker);

  // -------------------------------------------------------------
  // 7. BACKGROUND STUDENTS (Realistic Ghanaian University Students)
  // -------------------------------------------------------------
  const studentsGroup = new THREE.Group();
  studentsGroup.name = 'BackgroundStudents';
  scene.add(studentsGroup);

  // Load realistic background students progressively in background so campus renders immediately
  Promise.all([
    createRealisticStudent({
      name: 'Student1_Kwame',
      modelPath: '/assets/characters/Black_M_1_Casual.glb',
      hasBackpack: true,
      backpackColor: 0x334155,
      bottleColor: 0x38bdf8,
    }),
    createRealisticStudent({
      name: 'Student2_Kofi',
      modelPath: '/assets/characters/Black_M_3_Casual.glb',
      hasBackpack: false,
    }),
    createRealisticStudent({
      name: 'Student3_Yaw',
      modelPath: '/assets/characters/Black_M_2_Casual.glb',
      hasBackpack: true,
      backpackColor: 0x1e293b,
      bottleColor: 0xf59e0b,
    }),
    createRealisticStudent({
      name: 'Student4_Akoto',
      modelPath: '/assets/characters/Black_M_1_Casual.glb',
      hasBackpack: true,
      backpackColor: 0x0f172a,
      bottleColor: 0xef4444,
    }),
    createRealisticStudent({
      name: 'Student5_Kweku',
      modelPath: '/assets/characters/Black_M_3_Casual.glb',
      hasBackpack: true,
      backpackColor: 0x1e3a8a,
      bottleColor: 0x10b981,
    }),
    createRealisticStudent({
      name: 'Student6_Nana',
      modelPath: '/assets/characters/Black_M_1_Casual.glb',
      hasBackpack: true,
      backpackColor: 0x475569,
      bottleColor: 0x06b6d4,
    }),
  ]).then(([student1, student2, student3, student4, student5, student6]) => {
    if (!student1 || !student2 || !student3 || !student4 || !student5 || !student6) return;

    // Position & animate Student 1 & 2 (Chatting pair)
    student1.root.position.set(-8.5, 0.0, -3.2);
    student1.root.rotation.y = 0.8;
    studentsGroup.add(student1.root);

    student2.root.position.set(-7.7, 0.0, -2.2);
    student2.root.rotation.y = -2.3;
    studentsGroup.add(student2.root);

    animatedStudents.push({
      character: student1,
      type: 'chat',
      update: (delta) => {
        student1.updateChatGesture(delta, true);
      },
    });

    animatedStudents.push({
      character: student2,
      type: 'chat',
      update: (delta) => {
        student2.updateChatGesture(delta, false);
      },
    });

    // Student 3: Sitting on bench studying notebook
    student3.root.position.set(-16.0, 0.0, 5.0);
    student3.root.rotation.y = 0;
    student3.setSeatedPose();

    const bookGeom = new THREE.BoxGeometry(0.24, 0.02, 0.32);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const bookMesh = new THREE.Mesh(bookGeom, bookMat);
    bookMesh.position.set(-16.0, 0.52, 5.25);
    bookMesh.rotation.x = 0.25;
    bookMesh.castShadow = true;
    studentsGroup.add(bookMesh);
    studentsGroup.add(student3.root);

    animatedStudents.push({
      character: student3,
      type: 'study',
      update: (delta) => {
        student3.updateAnimation(delta, 0.0);
      },
    });

    // Student 4: Walking along east-west crossway path
    studentsGroup.add(student4.root);
    const patrolPath = {
      xStart: -16.0,
      xEnd: 16.0,
      currentX: -16.0,
      z: 8.0,
      dir: 1,
      speed: 1.4,
    };
    student4.root.position.set(patrolPath.currentX, 0, patrolPath.z);

    animatedStudents.push({
      character: student4,
      type: 'patrol',
      update: (delta) => {
        patrolPath.currentX += patrolPath.dir * patrolPath.speed * delta;
        if (patrolPath.currentX >= patrolPath.xEnd) {
          patrolPath.currentX = patrolPath.xEnd;
          patrolPath.dir = -1;
        } else if (patrolPath.currentX <= patrolPath.xStart) {
          patrolPath.currentX = patrolPath.xStart;
          patrolPath.dir = 1;
        }

        student4.root.position.x = patrolPath.currentX;
        student4.root.rotation.y = patrolPath.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        student4.updateAnimation(delta, 1.0);
      },
    });

    // Student 5: Walking down main promenade towards academic building
    studentsGroup.add(student5.root);
    const walkwayPatrol = {
      zStart: 34.0,
      zEnd: -22.0,
      currentZ: 25.0,
      x: 2.2,
      dir: -1,
      speed: 1.5,
    };
    student5.root.position.set(walkwayPatrol.x, 0, walkwayPatrol.currentZ);

    animatedStudents.push({
      character: student5,
      type: 'walkwayPatrol',
      update: (delta) => {
        walkwayPatrol.currentZ += walkwayPatrol.dir * walkwayPatrol.speed * delta;
        if (walkwayPatrol.currentZ <= walkwayPatrol.zEnd) {
          walkwayPatrol.currentZ = walkwayPatrol.zEnd;
          walkwayPatrol.dir = 1;
        } else if (walkwayPatrol.currentZ >= walkwayPatrol.zStart) {
          walkwayPatrol.currentZ = walkwayPatrol.zStart;
          walkwayPatrol.dir = -1;
        }

        student5.root.position.z = walkwayPatrol.currentZ;
        student5.root.rotation.y = walkwayPatrol.dir < 0 ? Math.PI : 0;
        student5.updateAnimation(delta, 1.0);
      },
    });

    // Student 6: Waiting on entrance stairs
    student6.root.position.set(4.5, 0.4, -29.0);
    student6.root.rotation.y = 2.8;
    studentsGroup.add(student6.root);

    animatedStudents.push({
      character: student6,
      type: 'idle',
      update: (delta) => {
        student6.updateAnimation(delta, 0.0);
      },
    });
  }).catch((err) => {
    console.warn('Background students progressive load notice:', err);
  });

  // -------------------------------------------------------------
  // 8. LIGHTING & ATMOSPHERE (Ghanaian Afternoon Sun)
  // -------------------------------------------------------------
  // Sky & Ground Bounce ambient light
  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4b5563, 1.25);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Warm Afternoon Sunlight
  const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  dirLight.position.set(28, 42, 35);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 5;
  dirLight.shadow.camera.far = 120;
  const shadowRange = 45;
  dirLight.shadow.camera.left = -shadowRange;
  dirLight.shadow.camera.right = shadowRange;
  dirLight.shadow.camera.top = shadowRange;
  dirLight.shadow.camera.bottom = -shadowRange;
  dirLight.shadow.bias = -0.0004;
  scene.add(dirLight);

  // Subtle atmospheric depth fog
  scene.fog = new THREE.FogExp2(0xd6e5f5, 0.008);

  // Procedural Warm Sky Dome
  const skyGeom = new THREE.SphereGeometry(180, 24, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x8ec5fc,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeom, skyMat);
  scene.add(skyMesh);

  // Update function to animate students and waypoint beacon each frame
  let markerTime = 0;
  function update(delta) {
    markerTime += delta;
    if (diamondMesh) {
      diamondMesh.rotation.y += delta * 1.6;
      diamondMesh.position.y = 1.6 + Math.sin(markerTime * 2.8) * 0.14;
    }
    if (markerLight) {
      markerLight.intensity = 2.2 + Math.sin(markerTime * 3.2) * 0.6;
    }
    if (cafeDiamondMesh) {
      cafeDiamondMesh.rotation.y += delta * 1.6;
      cafeDiamondMesh.position.y = 1.6 + Math.sin(markerTime * 2.8 + 1.2) * 0.14;
    }
    if (cafeMarkerLight) {
      cafeMarkerLight.intensity = 2.2 + Math.sin(markerTime * 3.2 + 1.2) * 0.6;
    }
    if (akosuaDiamondMesh) {
      akosuaDiamondMesh.rotation.y += delta * 1.6;
      akosuaDiamondMesh.position.y = 1.6 + Math.sin(markerTime * 2.8 + 2.0) * 0.14;
    }
    if (akosuaMarkerLight) {
      akosuaMarkerLight.intensity = 2.2 + Math.sin(markerTime * 3.2 + 2.0) * 0.6;
    }
    if (groupDiamondMesh) {
      groupDiamondMesh.rotation.y += delta * 1.6;
      groupDiamondMesh.position.y = 1.6 + Math.sin(markerTime * 2.8 + 3.0) * 0.14;
    }
    if (groupMarkerLight) {
      groupMarkerLight.intensity = 2.2 + Math.sin(markerTime * 3.2 + 3.0) * 0.6;
    }
    if (libraryDiamondMesh) {
      libraryDiamondMesh.rotation.y += delta * 1.6;
      libraryDiamondMesh.position.y = 1.6 + Math.sin(markerTime * 2.8 + 4.0) * 0.14;
    }
    if (libraryMarkerLight) {
      libraryMarkerLight.intensity = 2.2 + Math.sin(markerTime * 3.2 + 4.0) * 0.6;
    }
    for (let i = 0; i < animatedStudents.length; i++) {
      animatedStudents[i].update(delta);
    }
  }

  return {
    lectureLocation,
    cafeLocation,
    akosuaLocation,
    groupLocation,
    libraryLocation,
    examLocation,
    obstacleBoxes,
    obstacleCylinders,
    cameraCollisionMeshes,
    update,
  };
}
