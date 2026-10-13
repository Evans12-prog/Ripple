import * as THREE from 'three';

/**
 * Creates an articulated 3D character for Mark (or background students).
 * Fully modeled in 3D with realistic human proportions, layered clothing,
 * dark backpack, detailed head with short natural hair, and procedural
 * animation state machine (Idle, Walk, Run, Jump).
 */
export function createCharacter(options = {}) {
  const isMark = options.isMark ?? true;

  // Color palette tailored for realistic Ghanaian student look
  const skinColor = options.skinColor ?? 0x422818; // Rich dark-brown skin tone
  const hairColor = options.hairColor ?? 0x111111; // Short natural black hair
  const hoodieColor = options.hoodieColor ?? (isMark ? 0x1d4ed8 : 0x059669); // Mark: Royal Blue hoodie
  const pantsColor = options.pantsColor ?? (isMark ? 0x1e293b : 0x334155); // Dark slate trousers
  const shoeColor = options.shoeColor ?? (isMark ? 0x0f172a : 0x475569); // Dark sneakers with white sole
  const soleColor = 0xf8fafc; // White sneaker midsole
  const backpackColor = options.backpackColor ?? 0x0f172a; // Dark backpack
  const hasBackpack = options.hasBackpack ?? true;

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.72,
    metalness: 0.05,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.95,
    metalness: 0.0,
  });

  const hoodieMat = new THREE.MeshStandardMaterial({
    color: hoodieColor,
    roughness: 0.85,
    metalness: 0.05,
  });

  const hoodTrimMat = new THREE.MeshStandardMaterial({
    color: hoodieColor,
    roughness: 0.8,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.6,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.8,
    metalness: 0.05,
  });

  const shoeUpperMat = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.65,
  });

  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: soleColor,
    roughness: 0.5,
  });

  const backpackMat = new THREE.MeshStandardMaterial({
    color: backpackColor,
    roughness: 0.75,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeIrisMat = new THREE.MeshStandardMaterial({ color: 0x1a0f05, roughness: 0.1 });

  // Root container
  const root = new THREE.Group();
  root.name = isMark ? 'Mark' : 'Student';

  // Shadow helper utility
  const enableShadows = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  };

  // --- Hips & Pelvis ---
  const hips = new THREE.Group();
  hips.position.y = 0.98; // Hip center at ~0.98m from ground
  root.add(hips);

  const pelvisGeom = new THREE.BoxGeometry(0.32, 0.18, 0.22);
  const pelvisMesh = new THREE.Mesh(pelvisGeom, pantsMat);
  enableShadows(pelvisMesh);
  hips.add(pelvisMesh);

  // --- Torso / Upper Body ---
  const torso = new THREE.Group();
  torso.position.y = 0.09;
  hips.add(torso);

  // Hoodie Body (tapered waist to chest)
  const torsoGeom = new THREE.CylinderGeometry(0.20, 0.17, 0.44, 12);
  torsoGeom.scale(1.0, 1.0, 0.75); // Flatter depth
  const torsoMesh = new THREE.Mesh(torsoGeom, hoodieMat);
  torsoMesh.position.y = 0.22;
  enableShadows(torsoMesh);
  torso.add(torsoMesh);

  // Hoodie Kangaroo Front Pocket
  const pocketGeom = new THREE.BoxGeometry(0.22, 0.14, 0.06);
  const pocketMesh = new THREE.Mesh(pocketGeom, hoodTrimMat);
  pocketMesh.position.set(0, 0.14, 0.14);
  enableShadows(pocketMesh);
  torso.add(pocketMesh);

  // Hoodie Drawstrings
  for (let s = -1; s <= 1; s += 2) {
    const stringGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.12, 6);
    const stringMesh = new THREE.Mesh(stringGeom, cordMat);
    stringMesh.position.set(s * 0.04, 0.30, 0.155);
    torso.add(stringMesh);
  }

  // --- Backpack ---
  if (hasBackpack) {
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(0, 0.24, -0.19);

    const packMainGeom = new THREE.BoxGeometry(0.26, 0.36, 0.14);
    const packMainMesh = new THREE.Mesh(packMainGeom, backpackMat);
    enableShadows(packMainMesh);
    backpackGroup.add(packMainMesh);

    // Front pouch on backpack
    const packFrontGeom = new THREE.BoxGeometry(0.22, 0.20, 0.06);
    const packFrontMesh = new THREE.Mesh(packFrontGeom, backpackMat);
    packFrontMesh.position.set(0, -0.06, -0.09);
    enableShadows(packFrontMesh);
    backpackGroup.add(packFrontMesh);

    // Backpack Shoulder Straps
    for (let s = -1; s <= 1; s += 2) {
      const strapGeom = new THREE.BoxGeometry(0.04, 0.38, 0.02);
      const strapMesh = new THREE.Mesh(strapGeom, backpackMat);
      strapMesh.position.set(s * 0.11, 0.22, 0.04);
      strapMesh.rotation.x = 0.15;
      enableShadows(strapMesh);
      torso.add(strapMesh);
    }

    torso.add(backpackGroup);
  }

  // --- Neck & Head ---
  const neckGeom = new THREE.CylinderGeometry(0.065, 0.075, 0.10, 10);
  const neckMesh = new THREE.Mesh(neckGeom, skinMat);
  neckMesh.position.set(0, 0.47, 0);
  enableShadows(neckMesh);
  torso.add(neckMesh);

  // Folded Hood Collar around neck
  const hoodCollarGeom = new THREE.TorusGeometry(0.12, 0.045, 8, 16);
  hoodCollarGeom.scale(1.0, 0.7, 1.2);
  const hoodCollarMesh = new THREE.Mesh(hoodCollarGeom, hoodieMat);
  hoodCollarMesh.position.set(0, 0.44, -0.03);
  hoodCollarMesh.rotation.x = Math.PI / 2 + 0.2;
  enableShadows(hoodCollarMesh);
  torso.add(hoodCollarMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.58, 0);
  torso.add(headGroup);

  // Head base
  const headGeom = new THREE.SphereGeometry(0.125, 16, 14);
  headGeom.scale(0.9, 1.05, 0.95);
  const headMesh = new THREE.Mesh(headGeom, skinMat);
  enableShadows(headMesh);
  headGroup.add(headMesh);

  // Jaw / Chin contour
  const jawGeom = new THREE.BoxGeometry(0.11, 0.09, 0.10);
  const jawMesh = new THREE.Mesh(jawGeom, skinMat);
  jawMesh.position.set(0, -0.06, 0.05);
  enableShadows(jawMesh);
  headGroup.add(jawMesh);

  // Nose
  const noseGeom = new THREE.ConeGeometry(0.022, 0.05, 8);
  const noseMesh = new THREE.Mesh(noseGeom, skinMat);
  noseMesh.position.set(0, 0.0, 0.135);
  noseMesh.rotation.x = Math.PI / 2;
  enableShadows(noseMesh);
  headGroup.add(noseMesh);

  // Eyes
  for (let s = -1; s <= 1; s += 2) {
    const eyeWhiteGeom = new THREE.SphereGeometry(0.016, 8, 8);
    const eyeWhiteMesh = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    eyeWhiteMesh.position.set(s * 0.045, 0.02, 0.115);
    headGroup.add(eyeWhiteMesh);

    const eyeIrisGeom = new THREE.SphereGeometry(0.009, 8, 8);
    const eyeIrisMesh = new THREE.Mesh(eyeIrisGeom, eyeIrisMat);
    eyeIrisMesh.position.set(s * 0.045, 0.02, 0.127);
    headGroup.add(eyeIrisMesh);

    // Eyebrows
    const browGeom = new THREE.BoxGeometry(0.04, 0.01, 0.015);
    const browMesh = new THREE.Mesh(browGeom, hairMat);
    browMesh.position.set(s * 0.045, 0.048, 0.12);
    headGroup.add(browMesh);

    // Ears
    const earGeom = new THREE.SphereGeometry(0.025, 8, 8);
    earGeom.scale(0.3, 1.0, 0.6);
    const earMesh = new THREE.Mesh(earGeom, skinMat);
    earMesh.position.set(s * 0.12, 0.0, -0.01);
    headGroup.add(earMesh);
  }

  // Natural short black hair cap (fade hairstyle)
  const hairGeom = new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
  hairGeom.scale(0.92, 1.05, 0.98);
  const hairMesh = new THREE.Mesh(hairGeom, hairMat);
  hairMesh.position.y = 0.01;
  enableShadows(hairMesh);
  headGroup.add(hairMesh);

  // --- Arms (Left & Right) ---
  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  torso.add(leftArm.shoulder);
  torso.add(rightArm.shoulder);

  function createArm(side) {
    // side: -1 for Left, 1 for Right
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.24, 0.38, 0);

    // Shoulder cap / hoodie sleeve
    const sleeveCapGeom = new THREE.SphereGeometry(0.075, 10, 8);
    const sleeveCapMesh = new THREE.Mesh(sleeveCapGeom, hoodieMat);
    enableShadows(sleeveCapMesh);
    shoulder.add(sleeveCapMesh);

    // Upper Arm
    const upperArm = new THREE.Group();
    upperArm.position.set(0, -0.04, 0);
    shoulder.add(upperArm);

    const upperArmGeom = new THREE.CylinderGeometry(0.055, 0.05, 0.26, 10);
    upperArmGeom.translate(0, -0.13, 0);
    const upperArmMesh = new THREE.Mesh(upperArmGeom, hoodieMat);
    enableShadows(upperArmMesh);
    upperArm.add(upperArmMesh);

    // Forearm & Elbow
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.26, 0);
    upperArm.add(forearm);

    const forearmGeom = new THREE.CylinderGeometry(0.048, 0.042, 0.25, 10);
    forearmGeom.translate(0, -0.125, 0);
    const forearmMesh = new THREE.Mesh(forearmGeom, hoodieMat);
    enableShadows(forearmMesh);
    forearm.add(forearmMesh);

    // Wrist / Hand (skin)
    const handGeom = new THREE.SphereGeometry(0.04, 8, 8);
    handGeom.scale(0.8, 1.2, 0.8);
    handGeom.translate(0, -0.27, 0.01);
    const handMesh = new THREE.Mesh(handGeom, skinMat);
    enableShadows(handMesh);
    forearm.add(handMesh);

    return { shoulder, upperArm, forearm };
  }

  // --- Legs (Left & Right) ---
  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);
  hips.add(leftLeg.hipJoint);
  hips.add(rightLeg.hipJoint);

  function createLeg(side) {
    // side: -1 for Left, 1 for Right
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.11, -0.06, 0);

    // Thigh
    const thighGeom = new THREE.CylinderGeometry(0.082, 0.068, 0.44, 10);
    thighGeom.translate(0, -0.22, 0);
    const thighMesh = new THREE.Mesh(thighGeom, pantsMat);
    enableShadows(thighMesh);
    hipJoint.add(thighMesh);

    // Knee / Calf
    const calfJoint = new THREE.Group();
    calfJoint.position.set(0, -0.44, 0);
    hipJoint.add(calfJoint);

    const calfGeom = new THREE.CylinderGeometry(0.065, 0.052, 0.42, 10);
    calfGeom.translate(0, -0.21, 0);
    const calfMesh = new THREE.Mesh(calfGeom, pantsMat);
    enableShadows(calfMesh);
    calfJoint.add(calfMesh);

    // Sneaker Foot
    const foot = new THREE.Group();
    foot.position.set(0, -0.42, 0);
    calfJoint.add(foot);

    // Sneaker Upper
    const shoeGeom = new THREE.BoxGeometry(0.11, 0.08, 0.22);
    shoeGeom.translate(0, 0.04, 0.04);
    const shoeMesh = new THREE.Mesh(shoeGeom, shoeUpperMat);
    enableShadows(shoeMesh);
    foot.add(shoeMesh);

    // White Sneaker Midsole
    const soleGeom = new THREE.BoxGeometry(0.115, 0.035, 0.23);
    soleGeom.translate(0, 0.012, 0.04);
    const soleMesh = new THREE.Mesh(soleGeom, shoeSoleMat);
    enableShadows(soleMesh);
    foot.add(soleMesh);

    return { hipJoint, calfJoint, foot };
  }

  // --- Animation Rig State Machine ---
  let animTime = 0;
  let currentSpeed = 0; // 0 = idle, 1 = walk, 2 = run
  let isJumping = false;
  let jumpProgress = 0; // 0 -> 1

  function updateAnimation(delta, speedRatio, inAir = false) {
    animTime += delta;

    // Smoothly blend movement speed
    currentSpeed = THREE.MathUtils.lerp(currentSpeed, speedRatio, Math.min(1, delta * 8));
    isJumping = inAir;

    if (isJumping) {
      // In-air pose: knees tucked slightly, arms spread for balance
      const jumpLean = 0.15;
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, jumpLean, 0.15);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.1, 0.15);

      leftLeg.hipJoint.rotation.x = THREE.MathUtils.lerp(leftLeg.hipJoint.rotation.x, -0.65, 0.15);
      rightLeg.hipJoint.rotation.x = THREE.MathUtils.lerp(rightLeg.hipJoint.rotation.x, -0.45, 0.15);
      leftLeg.calfJoint.rotation.x = THREE.MathUtils.lerp(leftLeg.calfJoint.rotation.x, 0.9, 0.15);
      rightLeg.calfJoint.rotation.x = THREE.MathUtils.lerp(rightLeg.calfJoint.rotation.x, 0.7, 0.15);

      leftArm.upperArm.rotation.x = THREE.MathUtils.lerp(leftArm.upperArm.rotation.x, -0.4, 0.15);
      rightArm.upperArm.rotation.x = THREE.MathUtils.lerp(rightArm.upperArm.rotation.x, -0.4, 0.15);
      leftArm.upperArm.rotation.z = THREE.MathUtils.lerp(leftArm.upperArm.rotation.z, -0.35, 0.15);
      rightArm.upperArm.rotation.z = THREE.MathUtils.lerp(rightArm.upperArm.rotation.z, 0.35, 0.15);
      return;
    }

    // Blend weights:
    // walkWeight: 0 at idle, 1 at walk, fades out or shifts at sprint
    // runWeight: 0 at walk, 1 at sprint
    const isRunning = currentSpeed > 1.2;
    const gaitSpeed = isRunning ? 12.0 : 7.5;
    const strideScale = Math.min(currentSpeed, 1.0);
    const runFactor = Math.max(0, Math.min(1, (currentSpeed - 1.0) / 1.0));

    // Base gait cycle angle
    const cycle = animTime * gaitSpeed;

    if (currentSpeed < 0.05) {
      // === IDLE ANIMATION ===
      // Gentle breathing, subtle shifting of weight
      const breath = Math.sin(animTime * 2.2);
      const sway = Math.cos(animTime * 1.1) * 0.03;

      hips.position.y = 0.98 + breath * 0.012;
      hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, sway, 0.1);
      hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -sway * 0.5, 0.1);

      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, breath * 0.02, 0.1);
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, -sway * 0.6, 0.1);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -breath * 0.015, 0.1);

      // Relaxed arms hanging by sides
      leftArm.upperArm.rotation.x = THREE.MathUtils.lerp(leftArm.upperArm.rotation.x, 0.05 + breath * 0.02, 0.1);
      rightArm.upperArm.rotation.x = THREE.MathUtils.lerp(rightArm.upperArm.rotation.x, 0.05 - breath * 0.02, 0.1);
      leftArm.upperArm.rotation.z = THREE.MathUtils.lerp(leftArm.upperArm.rotation.z, -0.08, 0.1);
      rightArm.upperArm.rotation.z = THREE.MathUtils.lerp(rightArm.upperArm.rotation.z, 0.08, 0.1);

      leftArm.forearm.rotation.x = THREE.MathUtils.lerp(leftArm.forearm.rotation.x, 0.12, 0.1);
      rightArm.forearm.rotation.x = THREE.MathUtils.lerp(rightArm.forearm.rotation.x, 0.12, 0.1);

      // Legs in neutral resting stance
      leftLeg.hipJoint.rotation.x = THREE.MathUtils.lerp(leftLeg.hipJoint.rotation.x, 0.0, 0.1);
      rightLeg.hipJoint.rotation.x = THREE.MathUtils.lerp(rightLeg.hipJoint.rotation.x, 0.0, 0.1);
      leftLeg.calfJoint.rotation.x = THREE.MathUtils.lerp(leftLeg.calfJoint.rotation.x, 0.0, 0.1);
      rightLeg.calfJoint.rotation.x = THREE.MathUtils.lerp(rightLeg.calfJoint.rotation.x, 0.0, 0.1);
    } else {
      // === WALK & RUN ANIMATIONS ===
      const legAmp = 0.65 * strideScale + 0.35 * runFactor; // Deeper swing when running
      const armAmp = 0.55 * strideScale + 0.40 * runFactor;

      const legSin = Math.sin(cycle);
      const legCos = Math.cos(cycle);

      // Vertical bounce of hips during gait
      const verticalBounce = Math.abs(Math.sin(cycle)) * (0.04 * strideScale + 0.04 * runFactor);
      hips.position.y = 0.98 - verticalBounce;

      // Forward lean increases with running
      const forwardLean = 0.06 * strideScale + 0.16 * runFactor;
      torso.rotation.x = forwardLean;
      headGroup.rotation.x = -forwardLean * 0.7; // Keep gaze forward

      // Slight pelvic / torso counter-twist
      hips.rotation.y = legSin * (0.08 * strideScale);
      torso.rotation.y = -legSin * (0.06 * strideScale);

      // Legs swing (Left vs Right out of phase by Math.PI)
      leftLeg.hipJoint.rotation.x = legSin * legAmp;
      rightLeg.hipJoint.rotation.x = -legSin * legAmp;

      // Knee flexion during swing phase
      // Knee bends backwards (positive X rotation in this setup)
      const leftKneeBend = legSin < 0 ? Math.abs(legSin) * (0.9 * strideScale + 0.4 * runFactor) : 0.08;
      const rightKneeBend = legSin > 0 ? Math.abs(legSin) * (0.9 * strideScale + 0.4 * runFactor) : 0.08;
      leftLeg.calfJoint.rotation.x = leftKneeBend;
      rightLeg.calfJoint.rotation.x = rightKneeBend;

      // Arms swing counter to legs (right arm swings forward when left leg swings forward)
      leftArm.upperArm.rotation.x = -legSin * armAmp;
      rightArm.upperArm.rotation.x = legSin * armAmp;

      // Arm elbow flexion (forearms bent more during run)
      const elbowBase = 0.25 + 0.5 * runFactor;
      leftArm.forearm.rotation.x = elbowBase + Math.max(0, -legSin * 0.4);
      rightArm.forearm.rotation.x = elbowBase + Math.max(0, legSin * 0.4);

      leftArm.upperArm.rotation.z = -0.12 - 0.08 * runFactor;
      rightArm.upperArm.rotation.z = 0.12 + 0.08 * runFactor;
    }
  }

  return {
    root,
    hips,
    torso,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    updateAnimation,
  };
}
