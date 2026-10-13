import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createCharacter } from './createPlayer.js';

/**
 * Loads Mark's 3D character model using Black_M_2_Casual.glb (Google Research / UCF VALID Avatar)
 * with authentic Ghanaian young adult features, dark casual university attire, university backpack,
 * and anatomical straight-walking locomotion controller.
 */
export async function loadMark(onProgress = null) {
  const root = new THREE.Group();
  root.name = 'Mark_PlayerRoot';

  const setStatus = (msg, isError = false) => {
    const statusElem = document.getElementById('ui-character-status');
    if (statusElem) {
      statusElem.textContent = msg;
      statusElem.style.color = isError ? '#ef4444' : '#38bdf8';
      statusElem.style.display = 'block';
    }
  };

  setStatus('Loading Mark 3D Model...');

  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        '/assets/characters/Black_M_2_Casual.glb',
        resolve,
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            setStatus(`Loading Character: ${pct}%`);
            if (onProgress) onProgress(pct);
          }
        },
        reject
      );
    });

    const model = gltf.scene;
    model.name = 'Mark_MeshHierarchy';

    // Discover bones, cache rest poses, enable shadows on meshes
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
        if (child.material) {
          child.material.roughness = Math.max(0.45, child.material.roughness);
          child.material.envMapIntensity = 0.85;
          child.material.needsUpdate = true;
        }
      }
    });

    // Attach university backpack to Spine2 (26cm x 38cm x 14cm in local centimeter units)
    if (bones.Spine2) {
      const packGeom = new THREE.BoxGeometry(26, 38, 14);
      const packMat = new THREE.MeshStandardMaterial({
        color: 0x111827, // Charcoal black cordura fabric
        roughness: 0.85,
        metalness: 0.1,
      });
      const packMesh = new THREE.Mesh(packGeom, packMat);
      packMesh.position.set(0, 10, -12);
      packMesh.castShadow = true;
      bones.Spine2.add(packMesh);

      // Silver zipper trim accent
      const zipGeom = new THREE.BoxGeometry(20, 1.5, 1);
      const zipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
      const zipMesh = new THREE.Mesh(zipGeom, zipMat);
      zipMesh.position.set(0, 8, -19.5);
      bones.Spine2.add(zipMesh);
    }

    root.add(model);

    // Initial pose: bring arms down naturally at sides
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

    let animTime = 0;
    let currentSpeed = 0;

    /**
     * Anatomical straight-walking and standing locomotion controller.
     * Arms and legs swing in a straight plane with natural knee flexion,
     * diaphragmatic idle breathing, and vertical hip cadence.
     */
    function updateAnimation(delta, speedRatio = 0, inAir = false) {
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, speedRatio, Math.min(1.0, delta * 9.0));

      if (inAir) {
        // Airborne jump pose
        if (bones.LeftUpLeg && restQuats.LeftUpLeg) {
          bones.LeftUpLeg.quaternion.copy(restQuats.LeftUpLeg);
          bones.LeftUpLeg.rotateZ(0.45);
        }
        if (bones.RightUpLeg && restQuats.RightUpLeg) {
          bones.RightUpLeg.quaternion.copy(restQuats.RightUpLeg);
          bones.RightUpLeg.rotateZ(0.35);
        }
        if (bones.LeftLeg && restQuats.LeftLeg) {
          bones.LeftLeg.quaternion.copy(restQuats.LeftLeg);
          bones.LeftLeg.rotateZ(0.65);
        }
        if (bones.RightLeg && restQuats.RightLeg) {
          bones.RightLeg.quaternion.copy(restQuats.RightLeg);
          bones.RightLeg.rotateZ(0.55);
        }
        return;
      }

      if (currentSpeed < 0.05) {
        // IDLE: natural standing posture with gentle breathing
        animTime += delta * 2.2;
        const breath = Math.sin(animTime);

        if (bones.Spine && restQuats.Spine) {
          bones.Spine.quaternion.copy(restQuats.Spine);
          bones.Spine.rotateX(breath * 0.02);
        }
        if (bones.Hips && restPositions.Hips) {
          bones.Hips.position.y = restPositions.Hips.y + breath * 0.005;
        }

        // Arms hanging relaxed at sides
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
        if (bones.LeftForeArm && restQuats.LeftForeArm) {
          bones.LeftForeArm.quaternion.copy(restQuats.LeftForeArm);
          bones.LeftForeArm.rotateX(0.15);
        }
        if (bones.RightForeArm && restQuats.RightForeArm) {
          bones.RightForeArm.quaternion.copy(restQuats.RightForeArm);
          bones.RightForeArm.rotateX(0.15);
        }

        // Neutral standing legs
        if (bones.LeftUpLeg && restQuats.LeftUpLeg) {
          bones.LeftUpLeg.quaternion.copy(restQuats.LeftUpLeg);
        }
        if (bones.RightUpLeg && restQuats.RightUpLeg) {
          bones.RightUpLeg.quaternion.copy(restQuats.RightUpLeg);
        }
        if (bones.LeftLeg && restQuats.LeftLeg) {
          bones.LeftLeg.quaternion.copy(restQuats.LeftLeg);
        }
        if (bones.RightLeg && restQuats.RightLeg) {
          bones.RightLeg.quaternion.copy(restQuats.RightLeg);
        }
      } else {
        // WALKING & RUNNING: straight gait cycle
        const isRunning = currentSpeed > 1.2;
        const cadence = isRunning ? 11.5 : 7.2;
        animTime += delta * cadence;

        const stride = Math.min(currentSpeed, 1.0);
        const legSwing = Math.sin(animTime) * (0.55 * stride);
        const armSwing = Math.sin(animTime) * (0.48 * stride);

        // Legs swing straight forward and backward
        if (bones.LeftUpLeg && restQuats.LeftUpLeg) {
          bones.LeftUpLeg.quaternion.copy(restQuats.LeftUpLeg);
          bones.LeftUpLeg.rotateZ(legSwing);
        }
        if (bones.RightUpLeg && restQuats.RightUpLeg) {
          bones.RightUpLeg.quaternion.copy(restQuats.RightUpLeg);
          bones.RightUpLeg.rotateZ(-legSwing);
        }

        // Knee flexion during swing phase
        const leftKnee = Math.sin(animTime) < 0 ? Math.abs(Math.sin(animTime)) * 0.75 * stride : 0.04;
        const rightKnee = Math.sin(animTime) > 0 ? Math.abs(Math.sin(animTime)) * 0.75 * stride : 0.04;

        if (bones.LeftLeg && restQuats.LeftLeg) {
          bones.LeftLeg.quaternion.copy(restQuats.LeftLeg);
          bones.LeftLeg.rotateZ(leftKnee);
        }
        if (bones.RightLeg && restQuats.RightLeg) {
          bones.RightLeg.quaternion.copy(restQuats.RightLeg);
          bones.RightLeg.rotateZ(rightKnee);
        }

        // Arms swing counter to legs straight at sides
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
        if (bones.LeftForeArm && restQuats.LeftForeArm) {
          bones.LeftForeArm.quaternion.copy(restQuats.LeftForeArm);
          bones.LeftForeArm.rotateX(0.20 + Math.max(0, -armSwing * 0.25));
        }
        if (bones.RightForeArm && restQuats.RightForeArm) {
          bones.RightForeArm.quaternion.copy(restQuats.RightForeArm);
          bones.RightForeArm.rotateX(0.20 + Math.max(0, armSwing * 0.25));
        }

        // Spine lean and hip vertical bounce
        if (bones.Spine && restQuats.Spine) {
          bones.Spine.quaternion.copy(restQuats.Spine);
          bones.Spine.rotateX(0.06 * stride);
        }
        if (bones.Hips && restPositions.Hips) {
          const bounce = Math.abs(Math.sin(animTime)) * 0.025 * stride;
          bones.Hips.position.y = restPositions.Hips.y - bounce;
        }
      }
    }

    setStatus('Realistic Ghanaian Student Active');
    setTimeout(() => {
      const statusElem = document.getElementById('ui-character-status');
      if (statusElem) statusElem.style.display = 'none';
    }, 2500);

    return {
      root,
      model,
      bones,
      isRealistic: true,
      modelInfo: {
        filename: 'Black_M_2_Casual.glb',
        source: 'Google Research & UCF Validated Avatar Library (VALID)',
        character: 'Mark (Ghanaian University Student)',
      },
      updateAnimation,
    };
  } catch (err) {
    console.error('Failed to load realistic Mark model, falling back:', err);
    setStatus('Loading Fallback Character', true);

    const fallback = createCharacter({ isMark: true });
    return {
      root: fallback.root,
      model: fallback.root,
      bones: fallback,
      isRealistic: false,
      updateAnimation: fallback.updateAnimation,
    };
  }
}
