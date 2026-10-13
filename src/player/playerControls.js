import * as THREE from 'three';

/**
 * Handles keyboard input, physics (velocity, gravity, jumping),
 * camera-relative movement direction, character rotation smoothing,
 * boundary / obstacle collision resolution, and automatic navigation
 * after story decisions.
 */
export class PlayerControls {
  constructor(playerCharacter, followCamera, options = {}) {
    this.player = playerCharacter;
    this.root = playerCharacter.root;
    this.followCamera = followCamera;

    // Movement speeds (meters / second)
    this.walkSpeed = options.walkSpeed || 3.4;
    this.runSpeed = options.runSpeed || 6.8;
    this.jumpForce = options.jumpForce || 7.2;
    this.gravity = options.gravity || 20.0;
    this.turnSpeed = options.turnSpeed || 14.0;

    // State
    this.velocity = new THREE.Vector3();
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isRunning = false;
    this.currentSpeedRatio = 0; // 0 = idle, 1 = walk, 2 = run
    this.isPaused = false;

    // Player bounding collider
    this.playerRadius = 0.35;
    this.playerHeight = 1.8;

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      run: false,
      jump: false,
    };

    // Obstacle colliders (axis-aligned bounding boxes or cylinder circles)
    this.obstacleBoxes = [];
    this.obstacleCylinders = [];

    // Courtyard boundaries (Playable area)
    this.bounds = options.bounds || {
      minX: -24.0,
      maxX: 24.0,
      minZ: -32.5,
      maxZ: 42.0,
    };

    // Automatic Navigation state (Phase 2.1.1)
    this.isAutoNavigating = false;
    this.autoNavWaypoints = [];
    this.autoNavIndex = 0;
    this.autoNavOnArrival = null;
    this.autoNavActivity = '';
    this.autoNavStopDistance = 0.6;
    this.onAutoNavStatusChange = null;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown, false);
    window.addEventListener('keyup', this._onKeyUp, false);
  }

  setObstacles(boxes, cylinders) {
    this.obstacleBoxes = boxes || [];
    this.obstacleCylinders = cylinders || [];
  }

  /**
   * Starts automatic navigation toward a waypoint or list of waypoints.
   * Smoothly steers Mark at walking speed and fires options.onArrival upon reaching the final point.
   */
  startAutoNavigation(waypoints, options = {}) {
    const list = Array.isArray(waypoints) ? waypoints : [waypoints];
    this.autoNavWaypoints = list.map((pt) => ({
      x: pt.x,
      y: pt.y || 0,
      z: pt.z,
    }));
    this.autoNavIndex = 0;
    this.autoNavOnArrival = options.onArrival || null;
    this.autoNavActivity = options.activityName || 'Heading to destination...';
    this.autoNavStopDistance = options.stopDistance || 0.6;
    this.isAutoNavigating = true;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.autoNavStuckTimer = 0;
    this.lastAutoNavDist = null;

    if (this.onAutoNavStatusChange) {
      this.onAutoNavStatusChange({
        active: true,
        activity: this.autoNavActivity,
        destination: options.destinationName || '',
        interrupted: false,
      });
    }
  }

  /**
   * Stops automatic navigation immediately.
   * If interrupted by the player (e.g. WASD press), notifies status callback.
   */
  stopAutoNavigation(interruptedByUser = false) {
    if (!this.isAutoNavigating) return;
    this.isAutoNavigating = false;
    this.autoNavWaypoints = [];
    this.autoNavIndex = 0;
    this.autoNavOnArrival = null;

    if (this.onAutoNavStatusChange) {
      this.onAutoNavStatusChange({
        active: false,
        interrupted: interruptedByUser,
        activity: '',
      });
    }
  }

  _onKeyDown(e) {
    let isMoveKey = false;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        isMoveKey = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        isMoveKey = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        isMoveKey = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        isMoveKey = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = true;
        break;
      case 'Space':
        this.keys.jump = true;
        isMoveKey = true;
        break;
    }

    // Immediate interrupt of auto navigation if player gives manual input
    if (isMoveKey && this.isAutoNavigating) {
      this.stopAutoNavigation(true);
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.run = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
    }
  }

  /**
   * Resolves collision against all obstacle cylinders, boxes, and courtyard boundaries.
   */
  resolveCollisions(proposedX, proposedZ) {
    let finalX = proposedX;
    let finalZ = proposedZ;

    // Cylinder obstacles (Trees, Lamp posts, Pillars)
    for (const cyl of this.obstacleCylinders) {
      const dx = finalX - cyl.x;
      const dz = finalZ - cyl.z;
      const minDist = cyl.radius + this.playerRadius;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        finalX += (dx / dist) * overlap;
        finalZ += (dz / dist) * overlap;
      }
    }

    // Box obstacles (Building walls, benches, planters)
    for (const box of this.obstacleBoxes) {
      const minX = box.minX - this.playerRadius;
      const maxX = box.maxX + this.playerRadius;
      const minZ = box.minZ - this.playerRadius;
      const maxZ = box.maxZ + this.playerRadius;

      if (finalX > minX && finalX < maxX && finalZ > minZ && finalZ < maxZ) {
        const leftPen = finalX - minX;
        const rightPen = maxX - finalX;
        const frontPen = finalZ - minZ;
        const backPen = maxZ - finalZ;

        const minPen = Math.min(leftPen, rightPen, frontPen, backPen);

        if (minPen === leftPen) {
          finalX = minX;
        } else if (minPen === rightPen) {
          finalX = maxX;
        } else if (minPen === frontPen) {
          finalZ = minZ;
        } else {
          finalZ = maxZ;
        }
      }
    }

    // Clamp within Courtyard playable bounds
    finalX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, finalX));
    finalZ = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, finalZ));

    return { x: finalX, z: finalZ };
  }

  update(delta) {
    if (this.isPaused) {
      this.currentSpeedRatio = 0;
      this.player.updateAnimation(0, 0, !this.isGrounded);
      return;
    }

    const clampedDelta = Math.min(delta, 0.1); // Guard against giant delta on tab switch

    // -------------------------------------------------------------
    // AUTOMATIC NAVIGATION (Phase 2.1.1)
    // -------------------------------------------------------------
    if (this.isAutoNavigating) {
      if (this.autoNavIndex < this.autoNavWaypoints.length) {
        const target = this.autoNavWaypoints[this.autoNavIndex];
        const dx = target.x - this.root.position.x;
        const dz = target.z - this.root.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= this.autoNavStopDistance) {
          this.autoNavIndex++;
          if (this.autoNavIndex >= this.autoNavWaypoints.length) {
            // Reached destination!
            const callback = this.autoNavOnArrival;
            this.stopAutoNavigation(false);
            this.currentSpeedRatio = 0;
            this.player.updateAnimation(clampedDelta, 0, false);
            if (callback) callback();
            return;
          }
        } else {
          const dirX = dx / dist;
          const dirZ = dz / dist;

          // Smoothly rotate character to face travel direction
          const targetRotationY = Math.atan2(dirX, dirZ);
          let diff = targetRotationY - this.root.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.root.rotation.y += diff * Math.min(1.0, this.turnSpeed * clampedDelta);

          // Advance forward smoothly at walkSpeed
          const moveDist = Math.min(dist, this.walkSpeed * clampedDelta);
          const proposedX = this.root.position.x + dirX * moveDist;
          const proposedZ = this.root.position.z + dirZ * moveDist;

          let groundAltitude = 0;
          if (proposedZ < -28.0 && proposedZ >= -32.5 && proposedX > -10.0 && proposedX < 10.0) {
            groundAltitude = Math.min(0.6, ((-28.0 - proposedZ) / 4.5) * 0.6);
          }

          const resolved = this.resolveCollisions(proposedX, proposedZ);
          this.root.position.set(resolved.x, groundAltitude, resolved.z);

          // Safeguard: detect if blocked by an obstacle for > 3.0s and return manual control
          if (this.lastAutoNavDist !== null && Math.abs(this.lastAutoNavDist - dist) < 0.003) {
            this.autoNavStuckTimer += clampedDelta;
            if (this.autoNavStuckTimer > 3.0) {
              console.warn('Auto navigation blocked, returning manual control to player.');
              this.stopAutoNavigation(true);
              return;
            }
          } else {
            this.autoNavStuckTimer = 0;
            this.lastAutoNavDist = dist;
          }

          this.currentSpeedRatio = 1.0;
          this.player.updateAnimation(clampedDelta, 1.0, false);
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // MANUAL PLAYER WASD CONTROLS
    // -------------------------------------------------------------
    let inputX = 0;
    let inputZ = 0;

    if (this.keys.forward) inputZ += 1;
    if (this.keys.backward) inputZ -= 1;
    if (this.keys.left) inputX -= 1;
    if (this.keys.right) inputX += 1;

    const hasInput = inputX !== 0 || inputZ !== 0;
    this.isRunning = this.keys.run && hasInput;

    const camYaw = this.followCamera.yaw;
    const moveDir = new THREE.Vector3();

    if (hasInput) {
      const length = Math.hypot(inputX, inputZ);
      const nx = inputX / length;
      const nz = inputZ / length;

      const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
      const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));

      moveDir.addScaledVector(forward, nz);
      moveDir.addScaledVector(right, nx);
      moveDir.normalize();

      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetRotationY - this.root.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.root.rotation.y += diff * Math.min(1.0, this.turnSpeed * clampedDelta);
    }

    const currentMaxSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
    const targetSpeedRatio = hasInput ? (this.isRunning ? 2.0 : 1.0) : 0.0;
    this.currentSpeedRatio = targetSpeedRatio;

    const horizontalVel = moveDir.clone().multiplyScalar(hasInput ? currentMaxSpeed : 0);

    // Vertical movement & Jumping
    if (this.isGrounded) {
      if (this.keys.jump) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      } else {
        this.verticalVelocity = 0;
      }
    } else {
      this.verticalVelocity -= this.gravity * clampedDelta;
    }

    const proposedX = this.root.position.x + horizontalVel.x * clampedDelta;
    let proposedY = this.root.position.y + this.verticalVelocity * clampedDelta;
    const proposedZ = this.root.position.z + horizontalVel.z * clampedDelta;

    let groundAltitude = 0;
    if (proposedZ < -28.0 && proposedZ >= -32.5 && proposedX > -10.0 && proposedX < 10.0) {
      groundAltitude = Math.min(0.6, ((-28.0 - proposedZ) / 4.5) * 0.6);
    }

    if (proposedY <= groundAltitude) {
      proposedY = groundAltitude;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    const resolved = this.resolveCollisions(proposedX, proposedZ);
    this.root.position.set(resolved.x, proposedY, resolved.z);

    this.player.updateAnimation(clampedDelta, this.currentSpeedRatio, !this.isGrounded);
  }

  setPaused(paused) {
    this.isPaused = paused;
    if (paused) {
      Object.keys(this.keys).forEach((key) => {
        this.keys[key] = false;
      });
      this.currentSpeedRatio = 0;
      if (this.isAutoNavigating) {
        this.stopAutoNavigation(false);
      }
    }
  }

  resetPosition(position) {
    this.stopAutoNavigation(false);
    this.root.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.setPaused(false);
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
