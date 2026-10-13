import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { createCharacter } from '../player/createPlayer.js';

// Cache for loaded GLTF templates so we only fetch/parse each model once
const templateCache = new Map();
let loaderInstance = null;

function getLoader() {
  if (!loaderInstance) {
    loaderInstance = new GLTFLoader();
    loaderInstance.setMeshoptDecoder(MeshoptDecoder);
  }
  return loaderInstance;
}

function loadTemplate(modelPath) {
  if (templateCache.has(modelPath)) {
    return templateCache.get(modelPath);
  }

  const promise = (async () => {
    try {
      const loader = getLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(modelPath, resolve, undefined, reject);
      });

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.max(0.45, child.material.roughness);
            child.material.envMapIntensity = 0.85;
          }
        }
      });

      return gltf.scene;
    } catch (err) {
      console.warn(`Failed to load student model at ${modelPath}:`, err);
      return null;
    }
  })();

  templateCache.set(modelPath, promise);
  return promise;
}

/**
 * Creates an animated realistic Ghanaian university student using Google Research / UCF VALID Avatars
 * (Black_M_1_Casual.glb, Black_M_3_Casual.glb) with straight-walking locomotion,
 * conversational gestures, and sitting poses.
 */
export async function createRealisticStudent(options = {}) {
  const modelPath = options.modelPath || '/assets/characters/Black_M_1_Casual.glb';
  const name = options.name || 'RealisticStudent';
  const hasBackpack = options.hasBackpack ?? true;
  const backpackColor = options.backpackColor || 0x1e293b;

  const root = new THREE.Group();
  root.name = name;

  const template = await loadTemplate(modelPath);

  if (!template) {
    const fallback = createCharacter({ isMark: false });
    return {
      root: fallback.root,
      model: fallback.root,
      bones: fallback,
      updateAnimation: fallback.updateAnimation,
      updateChatGesture: () => {},
      setSeatedPose: () => {},
    };
  }

  const model = SkeletonUtils.clone(template);
  model.name = `${name}_MeshHierarchy`;

  const bones = {};
  const restQuats = {};
  const restPositions = {};

  model.traverse((child) => {
    if (child.isBone) {
      bones[child.name] = child;
      restQuats[child.name] = child.quaternion.clone();
      restPositions[child.name] = child.position.clone();
    }
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (options.tint && child.material) {
        child.material = child.material.clone();
        child.material.color.multiply(new THREE.Color(options.tint));
      }
    }
  });

  // Attach backpack to Spine2 (26cm x 38cm x 14cm in local centimeter units)
  if (hasBackpack && bones.Spine2) {
    const packGeom = new THREE.BoxGeometry(26, 38, 14);
    const packMat = new THREE.MeshStandardMaterial({
      color: backpackColor,
      roughness: 0.85,
      metalness: 0.1,
    });
    const packMesh = new THREE.Mesh(packGeom, packMat);
    packMesh.position.set(0, 10, -12);
    packMesh.castShadow = true;
    bones.Spine2.add(packMesh);
  }

  root.add(model);

  // Initial rest pose: arms down naturally at sides
  if (bones.LeftArm && restQuats.LeftArm) {
    bones.LeftArm.quaternion.copy(restQuats.LeftArm);
    bones.LeftArm.rotateX(1.22);
    bones.LeftArm.rotateZ(-0.06);
  }
  if (bones.RightArm && restQuats.RightArm) {
    bones.RightArm.quaternion.copy(restQuats.RightArm);
    bones.RightArm.rotateX(1.22);
    bones.RightArm.rotateZ(0.06);
  }
  if (bones.LeftForeArm && restQuats.LeftForeArm) {
    bones.LeftForeArm.quaternion.copy(restQuats.LeftForeArm);
    bones.LeftForeArm.rotateX(0.15);
  }
  if (bones.RightForeArm && restQuats.RightForeArm) {
    bones.RightForeArm.quaternion.copy(restQuats.RightForeArm);
    bones.RightForeArm.rotateX(0.15);
  }

  let animTime = Math.random() * 10;
  let isSeated = false;

  function updateAnimation(delta, speedRatio = 0) {
    if (isSeated) return;

    if (speedRatio < 0.05) {
      // Idle breathing
      animTime += delta * 2.0;
      const breath = Math.sin(animTime);

      if (bones.Spine && restQuats.Spine) {
        bones.Spine.quaternion.copy(restQuats.Spine);
        bones.Spine.rotateX(breath * 0.02);
      }
      if (bones.Hips && restPositions.Hips) {
        bones.Hips.position.y = restPositions.Hips.y + breath * 0.004;
      }
      if (bones.LeftArm && restQuats.LeftArm) {
        bones.LeftArm.quaternion.copy(restQuats.LeftArm);
        bones.LeftArm.rotateX(1.22 + breath * 0.01);
        bones.LeftArm.rotateZ(-0.06);
      }
      if (bones.RightArm && restQuats.RightArm) {
        bones.RightArm.quaternion.copy(restQuats.RightArm);
        bones.RightArm.rotateX(1.22 + breath * 0.01);
        bones.RightArm.rotateZ(0.06);
      }
    } else {
      // Straight walking
      animTime += delta * 7.2;
      const legSwing = Math.sin(animTime) * 0.52;
      const armSwing = Math.sin(animTime) * 0.45;

      if (bones.LeftUpLeg && restQuats.LeftUpLeg) {
        bones.LeftUpLeg.quaternion.copy(restQuats.LeftUpLeg);
        bones.LeftUpLeg.rotateZ(legSwing);
      }
      if (bones.RightUpLeg && restQuats.RightUpLeg) {
        bones.RightUpLeg.quaternion.copy(restQuats.RightUpLeg);
        bones.RightUpLeg.rotateZ(-legSwing);
      }

      const leftKnee = Math.sin(animTime) < 0 ? Math.abs(Math.sin(animTime)) * 0.7 : 0.04;
      const rightKnee = Math.sin(animTime) > 0 ? Math.abs(Math.sin(animTime)) * 0.7 : 0.04;

      if (bones.LeftLeg && restQuats.LeftLeg) {
        bones.LeftLeg.quaternion.copy(restQuats.LeftLeg);
        bones.LeftLeg.rotateZ(leftKnee);
      }
      if (bones.RightLeg && restQuats.RightLeg) {
        bones.RightLeg.quaternion.copy(restQuats.RightLeg);
        bones.RightLeg.rotateZ(rightKnee);
      }

      if (bones.LeftArm && restQuats.LeftArm) {
        bones.LeftArm.quaternion.copy(restQuats.LeftArm);
        bones.LeftArm.rotateX(1.22);
        bones.LeftArm.rotateZ(-armSwing);
      }
      if (bones.RightArm && restQuats.RightArm) {
        bones.RightArm.quaternion.copy(restQuats.RightArm);
        bones.RightArm.rotateX(1.22);
        bones.RightArm.rotateZ(armSwing);
      }

      if (bones.Hips && restPositions.Hips) {
        const bounce = Math.abs(Math.sin(animTime)) * 0.02;
        bones.Hips.position.y = restPositions.Hips.y - bounce;
      }
    }
  }

  function updateChatGesture(delta, isSpeaker = false) {
    if (isSeated) return;
    animTime += delta * 2.2;
    updateAnimation(delta, 0.0);

    if (bones.Head && restQuats.Head) {
      bones.Head.quaternion.copy(restQuats.Head);
      bones.Head.rotateX(-0.06 + Math.sin(animTime * 1.5) * (isSpeaker ? 0.08 : 0.03));
      bones.Head.rotateY(Math.cos(animTime * 0.9) * (isSpeaker ? 0.12 : 0.05));
    }

    if (isSpeaker && bones.LeftArm && restQuats.LeftArm) {
      bones.LeftArm.quaternion.copy(restQuats.LeftArm);
      bones.LeftArm.rotateX(0.7 + Math.sin(animTime * 1.8) * 0.15);
      bones.LeftArm.rotateZ(-0.25);
    }
  }

  function setSeatedPose() {
    isSeated = true;
    if (bones.Hips && restPositions.Hips) {
      bones.Hips.position.y = restPositions.Hips.y - 0.42;
      bones.Hips.position.z = restPositions.Hips.z - 0.06;
    }
    if (bones.LeftUpLeg && restQuats.LeftUpLeg) {
      bones.LeftUpLeg.quaternion.copy(restQuats.LeftUpLeg);
      bones.LeftUpLeg.rotateZ(1.45);
    }
    if (bones.RightUpLeg && restQuats.RightUpLeg) {
      bones.RightUpLeg.quaternion.copy(restQuats.RightUpLeg);
      bones.RightUpLeg.rotateZ(1.45);
    }
    if (bones.LeftLeg && restQuats.LeftLeg) {
      bones.LeftLeg.quaternion.copy(restQuats.LeftLeg);
      bones.LeftLeg.rotateZ(-1.45);
    }
    if (bones.RightLeg && restQuats.RightLeg) {
      bones.RightLeg.quaternion.copy(restQuats.RightLeg);
      bones.RightLeg.rotateZ(-1.45);
    }
    if (bones.Spine && restQuats.Spine) {
      bones.Spine.quaternion.copy(restQuats.Spine);
      bones.Spine.rotateX(0.18);
    }
    if (bones.Head && restQuats.Head) {
      bones.Head.quaternion.copy(restQuats.Head);
      bones.Head.rotateX(0.28);
    }
    if (bones.LeftArm && restQuats.LeftArm) {
      bones.LeftArm.quaternion.copy(restQuats.LeftArm);
      bones.LeftArm.rotateX(0.65);
    }
    if (bones.RightArm && restQuats.RightArm) {
      bones.RightArm.quaternion.copy(restQuats.RightArm);
      bones.RightArm.rotateX(0.65);
    }
  }

  return {
    root,
    model,
    bones,
    updateAnimation,
    updateChatGesture,
    setSeatedPose,
  };
}
