import * as THREE from 'three';

/**
 * Third-person follow camera with mouse orbit, collision clipping avoidance,
 * and smooth damping behind Mark.
 */
export class FollowCamera {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;

    // Configuration
    this.target = options.target || new THREE.Vector3(0, 1.4, 0);
    this.idealDistance = options.distance || 4.2;
    this.currentDistance = this.idealDistance;
    this.minDistance = 1.2;
    this.maxDistance = 7.0;

    this.heightOffset = options.heightOffset || 1.45; // Focus on Mark's upper chest / head
    this.minY = 0.35; // Minimum altitude above ground

    // Orbit angles (radians)
    this.yaw = options.yaw || 0;
    this.pitch = options.pitch || 0.22; // Slightly above looking down

    // Pitch limits
    this.minPitch = -0.25; // ~ -14 deg (looking up)
    this.maxPitch = 1.25;  // ~ 72 deg (looking down)

    // Sensitivity
    this.mouseSensitivity = 0.0022;
    this.smoothSpeed = 12.0;

    // Internal state
    this.isLocked = false;
    this.collisionObjects = [];
    this.raycaster = new THREE.Raycaster();
    this.tempLookAt = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();

    // Listeners
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onPointerLockError = this._onPointerLockError.bind(this);

    this._setupPointerLock();
  }

  setCollisionObjects(objects) {
    this.collisionObjects = objects || [];
  }

  _setupPointerLock() {
    document.addEventListener('pointerlockchange', this._onPointerLockChange, false);
    document.addEventListener('pointerlockerror', this._onPointerLockError, false);
    document.addEventListener('mousemove', this._onMouseMove, false);
  }

  requestLock() {
    if (!this.isLocked) {
      try {
        const lockRequest = this.domElement.requestPointerLock();
        if (lockRequest && typeof lockRequest.catch === 'function') {
          lockRequest.catch(this._onPointerLockError);
        }
      } catch (e) {
        console.warn('Pointer lock request failed:', e);
      }
    }
  }

  exitLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  _onPointerLockChange() {
    this.isLocked = (document.pointerLockElement === this.domElement);
    if (this.onLockStateChange) {
      this.onLockStateChange(this.isLocked);
    }
  }

  _onPointerLockError(err) {
    console.warn('Pointer lock error:', err);
  }

  _onMouseMove(event) {
    if (!this.isLocked) return;

    this.yaw -= event.movementX * this.mouseSensitivity;
    this.pitch -= event.movementY * this.mouseSensitivity;

    // Clamp pitch
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  /**
   * Update follow camera position each frame
   * @param {THREE.Vector3} playerPosition
   * @param {number} delta
   */
  update(playerPosition, delta) {
    // Focus point on player
    this.targetPos.set(
      playerPosition.x,
      playerPosition.y + this.heightOffset,
      playerPosition.z
    );

    // Compute ideal spherical camera offset based on yaw and pitch
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const dirX = sinYaw * cosPitch;
    const dirY = sinPitch;
    const dirZ = cosYaw * cosPitch;

    let targetDistance = this.idealDistance;

    // Raycast obstacle detection to prevent clipping through building / walls
    if (this.collisionObjects.length > 0) {
      const rayDirection = new THREE.Vector3(dirX, dirY, dirZ).normalize();
      this.raycaster.set(this.targetPos, rayDirection);
      this.raycaster.near = 0.2;
      this.raycaster.far = this.idealDistance;

      const hits = this.raycaster.intersectObjects(this.collisionObjects, true);
      if (hits.length > 0) {
        // Pull camera in front of the collision surface
        const hitDist = hits[0].distance - 0.4;
        targetDistance = Math.max(this.minDistance, hitDist);
      }
    }

    // Smoothly adjust distance
    this.currentDistance = THREE.MathUtils.lerp(
      this.currentDistance,
      targetDistance,
      Math.min(1, delta * 14)
    );

    // Desired camera position
    const desiredPos = new THREE.Vector3(
      this.targetPos.x + dirX * this.currentDistance,
      this.targetPos.y + dirY * this.currentDistance,
      this.targetPos.z + dirZ * this.currentDistance
    );

    // Prevent camera from going beneath ground
    if (desiredPos.y < this.minY) {
      desiredPos.y = this.minY;
    }

    // First frame initialization snap
    if (!this.initialized) {
      this.camera.position.copy(desiredPos);
      this.tempLookAt.copy(this.targetPos);
      this.camera.lookAt(this.tempLookAt);
      this.initialized = true;
      return;
    }

    // Smoothly damp camera position towards desired position
    const t = 1.0 - Math.exp(-this.smoothSpeed * delta);
    this.camera.position.lerp(desiredPos, t);

    // Smooth lookAt focus point
    this.tempLookAt.lerp(this.targetPos, t);
    this.camera.lookAt(this.tempLookAt);
  }

  dispose() {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('pointerlockerror', this._onPointerLockError);
    document.removeEventListener('mousemove', this._onMouseMove);
  }
}
