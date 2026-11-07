import * as THREE from 'three';
import { createAnimeCharacter, animateCharacter, animatePuppy } from './anime-character.mjs';

export function createCharacterController(scene, network, locations, camera, controls, options = {}) {
  const {
    onSelectCourse,
    onOpenResident,
    onOpenHost,
    onProximityChange
  } = options;

  // 1. Create Player (Prof. Chun-Hsing Chang)
  const player = createAnimeCharacter(0, true);
  player.g.name = 'controllable-player';
  player.g.userData.isPlayer = true;
  scene.add(player.g);

  // Initial Position at Center Island
  const centerNode = network.nodes.find(n => n.id === 'center') || network.nodes[0];
  const startX = centerNode ? centerNode.x : 0;
  const startZ = centerNode ? centerNode.z + 1.8 : 1.8;
  const startY = (centerNode ? (centerNode.height ?? 0.49) : 0.49);

  player.g.position.set(startX, startY, startZ);

  // Companion puppy attached to scene for independent following
  let puppyObj = null;
  if (player.puppy) {
    puppyObj = player.puppy;
    player.g.remove(puppyObj.g);
    scene.add(puppyObj.g);
    puppyObj.g.position.set(startX - 0.6, startY, startZ - 0.4);
  }

  // 2. Controller States
  const state = {
    x: startX,
    y: startY,
    z: startZ,
    angle: 0,
    speed: 0,
    walkSpeed: 4.8,
    runSpeed: 8.5,
    rotSpeed: 3.8,
    isGrounded: true,
    jumpVelocity: 0,
    gravity: -19.6,
    isMoving: false,
    isRunning: false,
    cameraFollow: false, // Third-person camera follow mode
    activeTarget: null,  // Click-to-move target {x, z}
    currentIsland: 'center',
    nearbyResident: null,
    nearbyLandmark: null
  };

  // Keyboard Inputs
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    interact: false
  };

  function onKeyDown(e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        state.activeTarget = null;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        state.activeTarget = null;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        state.activeTarget = null;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        state.activeTarget = null;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = true;
        break;
      case 'Space':
        if (state.isGrounded) {
          state.jumpVelocity = 6.2;
          state.isGrounded = false;
        }
        e.preventDefault();
        break;
      case 'KeyE':
      case 'Enter':
        triggerInteraction();
        break;
      case 'KeyC':
        toggleCameraFollow();
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.sprint = false;
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Trigger Interaction when nearby
  function triggerInteraction() {
    if (state.nearbyResident) {
      onOpenResident?.(state.nearbyResident.id);
    } else if (state.nearbyLandmark) {
      onSelectCourse?.(state.nearbyLandmark);
    }
  }

  // Toggle Camera Follow
  function toggleCameraFollow(forced) {
    state.cameraFollow = forced !== undefined ? forced : !state.cameraFollow;
    if (state.cameraFollow) {
      controls.enabled = false;
    } else {
      controls.enabled = true;
    }
    return state.cameraFollow;
  }

  // Move directly towards coordinate (click-to-move)
  function moveTo(targetX, targetZ) {
    state.activeTarget = { x: targetX, z: targetZ };
  }

  // Ground detection / clamping to islands or bridges
  function getGroundHeight(x, z) {
    // 1. Check all island circles
    for (const node of network.nodes) {
      const d = Math.hypot(x - node.x, z - node.z);
      if (d <= node.radius * 1.05) {
        return { y: node.height ?? node.elevation + 0.49, island: node.id };
      }
    }
    // 2. Check bridges
    for (const path of network.paths) {
      if (path.kind === 'bridge' && path.points) {
        for (let i = 0; i < path.points.length - 1; i++) {
          const p1 = path.points[i];
          const p2 = path.points[i + 1];
          const dist = distToSegment(x, z, p1.x, p1.z, p2.x, p2.z);
          if (dist < 1.4) {
            const t = Math.max(0, Math.min(1, projectionFactor(x, z, p1.x, p1.z, p2.x, p2.z)));
            const bridgeY = p1.y + (p2.y - p1.y) * t + 0.35;
            return { y: bridgeY, island: path.fromIsland || 'bridge' };
          }
        }
      }
    }
    return null; // Over water
  }

  function distToSegment(px, pz, x1, z1, x2, z2) {
    const l2 = (x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1);
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), pz - (z1 + t * (z2 - z1)));
  }

  function projectionFactor(px, pz, x1, z1, x2, z2) {
    const l2 = (x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1);
    if (l2 === 0) return 0;
    return ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
  }

  // Puppy follow animation physics
  const puppyState = {
    x: startX - 0.6,
    y: startY,
    z: startZ - 0.4,
    angle: 0
  };

  // Main Update Loop
  let timeElapsed = 0;
  function update(dt) {
    timeElapsed += dt;

    let moveX = 0;
    let moveZ = 0;

    // A. Keyboard Input
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    // B. Click-to-Move Target
    if (state.activeTarget) {
      const dx = state.activeTarget.x - state.x;
      const dz = state.activeTarget.z - state.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.3) {
        moveX = dx / dist;
        moveZ = dz / dist;
      } else {
        state.activeTarget = null;
      }
    }

    // Normalizing movement vector
    const moveLen = Math.hypot(moveX, moveZ);
    state.isMoving = moveLen > 0.05;
    state.isRunning = keys.sprint && state.isMoving;

    const currentSpeed = (state.isRunning ? state.runSpeed : state.walkSpeed) * dt;

    if (state.isMoving) {
      const targetAngle = Math.atan2(moveX, moveZ);
      // Smooth angle interpolation
      let angleDiff = targetAngle - state.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      state.angle += angleDiff * Math.min(1, dt * 14);

      // Next candidate position
      const nextX = state.x + Math.sin(state.angle) * currentSpeed;
      const nextZ = state.z + Math.cos(state.angle) * currentSpeed;

      // Validate ground candidate
      const ground = getGroundHeight(nextX, nextZ);
      if (ground) {
        state.x = nextX;
        state.z = nextZ;
        state.currentIsland = ground.island;
        if (state.isGrounded) {
          state.y = ground.y;
        }
      }
    }

    // Jump / Gravity Physics
    if (!state.isGrounded) {
      state.jumpVelocity += state.gravity * dt;
      state.y += state.jumpVelocity * dt;

      const ground = getGroundHeight(state.x, state.z);
      const groundY = ground ? ground.y : 0.49;
      if (state.y <= groundY) {
        state.y = groundY;
        state.jumpVelocity = 0;
        state.isGrounded = true;
      }
    }

    // Update Player Mesh Position & Rotation
    player.g.position.set(state.x, state.y, state.z);
    player.g.rotation.y = state.angle;

    // Animate Professor Chang (walking/idling)
    animateCharacter(player, timeElapsed, 1.0, state.isMoving, state.isRunning);

    // ==========================================
    // C. Puppy Companion Following Physics
    // ==========================================
    if (puppyObj) {
      // Puppy target is slightly behind player's left side
      const pupTargetX = state.x - Math.sin(state.angle) * 0.55 - Math.cos(state.angle) * 0.45;
      const pupTargetZ = state.z - Math.cos(state.angle) * 0.55 + Math.sin(state.angle) * 0.45;

      const pupDx = pupTargetX - puppyState.x;
      const pupDz = pupTargetZ - puppyState.z;
      const pupDist = Math.hypot(pupDx, pupDz);

      const pupMoving = pupDist > 0.25;
      if (pupMoving) {
        const pupAngle = Math.atan2(pupDx, pupDz);
        puppyState.angle = pupAngle;
        const pupSpeed = (state.isRunning ? 9.5 : 5.5) * dt;
        puppyState.x += (pupDx / pupDist) * Math.min(pupDist, pupSpeed);
        puppyState.z += (pupDz / pupDist) * Math.min(pupDist, pupSpeed);
      }

      const pupGround = getGroundHeight(puppyState.x, puppyState.z);
      puppyState.y = pupGround ? pupGround.y : state.y;

      puppyObj.g.position.set(puppyState.x, puppyState.y, puppyState.z);
      puppyObj.g.rotation.y = puppyState.angle;

      animatePuppy(puppyObj, timeElapsed, pupMoving, state.isRunning);
    }

    // ==========================================
    // D. Proximity Detection (Residents & Landmarks)
    // ==========================================
    let foundResident = null;
    let foundLandmark = null;

    // Check residents in scene
    scene.traverse(obj => {
      if (obj.userData?.resident && !foundResident) {
        const worldPos = new THREE.Vector3();
        obj.getWorldPosition(worldPos);
        const dist = Math.hypot(worldPos.x - state.x, worldPos.z - state.z);
        if (dist < 2.4) {
          foundResident = { id: obj.userData.resident, name: obj.userData.residentName || '島民' };
        }
      }
    });

    // Check island centers
    for (const [id, g] of locations) {
      const dist = Math.hypot(g.position.x - state.x, g.position.z - state.z);
      if (dist < 2.8) {
        foundLandmark = id;
        break;
      }
    }

    if (foundResident !== state.nearbyResident || foundLandmark !== state.nearbyLandmark) {
      state.nearbyResident = foundResident;
      state.nearbyLandmark = foundLandmark;
      onProximityChange?.({
        resident: state.nearbyResident,
        landmark: state.nearbyLandmark,
        island: state.currentIsland
      });
    }

    // ==========================================
    // E. Camera Follow Mode (Third-person view)
    // ==========================================
    if (state.cameraFollow) {
      const camDist = 18;
      const camHeight = 14;
      const targetCamX = state.x - Math.sin(state.angle) * camDist;
      const targetCamZ = state.z - Math.cos(state.angle) * camDist;
      const targetCamY = state.y + camHeight;

      camera.position.x += (targetCamX - camera.position.x) * dt * 4;
      camera.position.y += (targetCamY - camera.position.y) * dt * 4;
      camera.position.z += (targetCamZ - camera.position.z) * dt * 4;

      const lookTarget = new THREE.Vector3(state.x, state.y + 1.2, state.z);
      camera.lookAt(lookTarget);
    }
  }

  function teleportTo(islandId) {
    const loc = locations.get(islandId);
    if (!loc) return;
    state.x = loc.position.x;
    state.z = loc.position.z + 1.5;
    state.y = loc.position.y + 0.49;
    state.activeTarget = null;
    player.g.position.set(state.x, state.y, state.z);
    if (puppyObj) {
      puppyState.x = state.x - 0.5;
      puppyState.z = state.z - 0.5;
      puppyState.y = state.y;
      puppyObj.g.position.set(puppyState.x, puppyState.y, puppyState.z);
    }
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return {
    player,
    puppy: puppyObj,
    state,
    update,
    moveTo,
    teleportTo,
    toggleCameraFollow,
    triggerInteraction,
    dispose
  };
}
