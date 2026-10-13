import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Shared animation clip cache for realistic human characters in RIPPLE.
 * Stores mocap clips (Idle, Walk, Run) extracted from mark.glb
 * so all campus students share authentic, natural human locomotion.
 */
let cachedClips = null;
let clipsPromise = null;

export function setSharedAnimationClips(clipsArray) {
  if (!cachedClips && Array.isArray(clipsArray) && clipsArray.length > 0) {
    cachedClips = {};
    clipsArray.forEach((clip) => {
      cachedClips[clip.name] = clip;
    });
  }
}

export function getSharedAnimationClips() {
  return cachedClips;
}

export async function loadSharedAnimationClips() {
  if (cachedClips) {
    return cachedClips;
  }
  if (clipsPromise) {
    return clipsPromise;
  }

  clipsPromise = new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      '/assets/characters/mark.glb',
      (gltf) => {
        const clips = {};
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip) => {
            clips[clip.name] = clip;
          });
        }
        cachedClips = clips;
        resolve(clips);
      },
      undefined,
      (err) => {
        console.warn('Failed to load shared animation clips:', err);
        resolve({});
      }
    );
  });

  return clipsPromise;
}
