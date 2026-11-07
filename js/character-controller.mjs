import * as THREE from 'three';
import { createAnimeCharacter, animateCharacter, animatePuppy } from './anime-character.mjs';

export function createCharacterController(scene, network, locations, camera, controls, options = {}) {
  const {
    onSelectCourse,
    onOpenResident,
    onOpenHost,
    onProximityChange,
    hostElement = document.body
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
    walkSpeed: 5.2,
    runSpeed: 9.0,
    rotSpeed: 4.2,
    isGrounded: true,
    jumpVelocity: 0,
    gravity: -20,
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
    jump: false
  };

  // Touch Direction Vector (-1 to 1)
  const touchDir = { x: 0, z: 0, active: false };

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
        jump();
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

  function jump() {
    if (state.isGrounded) {
      state.jumpVelocity = 6.4;
      state.isGrounded = false;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // =========================================================
  // 3. Touch Virtual Controls (觸控虛擬方向盤 & 互動鈕)
  // =========================================================
  const touchUI = document.createElement('div');
  touchUI.className = 'touch-controls-hud';
  touchUI.innerHTML = `
    <div class="touch-dpad" id="touch-dpad" aria-label="觸控方向鍵">
      <button class="dpad-btn up" data-dir="up" aria-label="向前走">▲</button>
      <button class="dpad-btn left" data-dir="left" aria-label="向左轉">◀</button>
      <button class="dpad-btn down" data-dir="down" aria-label="向後退">▼</button>
      <button class="dpad-btn right" data-dir="right" aria-label="向右轉">▶</button>
      <div class="dpad-center" id="dpad-center">●</div>
    </div>
    <div class="touch-actions">
      <button class="touch-action-btn jump-btn" id="touch-jump" aria-label="跳躍">跳躍</button>
      <button class="touch-action-btn interact-btn" id="touch-interact" aria-label="互動">交談</button>
    </div>
  `;
  hostElement.appendChild(touchUI);

  // Bind D-pad touch events
  const dpad = touchUI.querySelector('#touch-dpad');
  function handleDpad(e) {
    const btn = e.target.closest('.dpad-btn');
    if (!btn) return;
    const dir = btn.dataset.dir;
    if (dir === 'up') keys.forward = true;
    if (dir === 'down') keys.backward = true;
    if (dir === 'left') keys.left = true;
    if (dir === 'right') keys.right = true;
    state.activeTarget = null;
  }
  function clearDpad() {
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
  }

  dpad.addEventListener('pointerdown', e => { e.preventDefault(); handleDpad(e); });
  dpad.addEventListener('pointerup', clearDpad);
  dpad.addEventListener('pointerleave', clearDpad);

  touchUI.querySelector('#touch-jump').addEventListener('pointerdown', e => {
    e.preventDefault();
    jump();
  });
  touchUI.querySelector('#touch-interact').addEventListener('pointerdown', e => {
    e.preventDefault();
    triggerInteraction();
  });

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
    controls.enabled = !state.cameraFollow;
    return state.cameraFollow;
  }

  // Move directly towards coordinate (click-to-move / touch-to-move)
  function moveTo(targetX, targetZ) {
    state.activeTarget = { x: targetX, z: targetZ };
  }

  // Ground detection / clamping to islands or bridges
  function getGroundHeight(x, z) {
    for (const node of network.nodes) {
      const d = Math.hypot(x - node.x, z - node.z);
      if (d <= node.radius * 1.05) {
        return { y: node.height ?? node.elevation + 0.49, island: node.id };
      }
    }
    for (const path of network.paths) {
      if (path.kind === 'bridge' && path.points) {
        for (let i = 0; i < path.points.length - 1; i++) {
          const p1 = path.points[i];
          const p2 = path.points[i + 1];
          const dist = distToSegment(x, z, p1.x, p1.z, p2.x, p2.z);
          if (dist < 1.45) {
            const t = Math.max(0, Math.min(1, projectionFactor(x, z, p1.x, p1.z, p2.x, p2.z)));
            const bridgeY = p1.y + (p2.y - p1.y) * t + 0.35;
            return { y: bridgeY, island: path.fromIsland || 'bridge' };
          }
        }
      }
    }
    return null;
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

  // Pre-cached residents list to eliminate scene.traverse CPU lag!
  let cachedResidents = [];
  function setResidentsCache(list) {
    cachedResidents = list;
  }

  const puppyState = {
    x: startX - 0.6,
    y: startY,
    z: startZ - 0.4,
    angle: 0
  };

  let timeElapsed = 0;
  let proximityCheckTimer = 0;

  function update(dt) {
    timeElapsed += dt;

    let moveX = 0;
    let moveZ = 0;

    // A. Keyboard / D-pad Input
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    // B. Click-to-Move Target
    if (state.activeTarget) {
      const dx = state.activeTarget.x - state.x;
      const dz = state.activeTarget.z - state.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25) {
        moveX = dx / dist;
        moveZ = dz / dist;
      } else {
        state.activeTarget = null;
      }
    }

    const moveLen = Math.hypot(moveX, moveZ);
    state.isMoving = moveLen > 0.05;
    state.isRunning = keys.sprint && state.isMoving;

    const currentSpeed = (state.isRunning ? state.runSpeed : state.walkSpeed) * dt;

    if (state.isMoving) {
      const targetAngle = Math.atan2(moveX, moveZ);
      let angleDiff = targetAngle - state.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      state.angle += angleDiff * Math.min(1, dt * 16);

      const nextX = state.x + Math.sin(state.angle) * currentSpeed;
      const nextZ = state.z + Math.cos(state.angle) * currentSpeed;

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

    // Jump Physics
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

    player.g.position.set(state.x, state.y, state.z);
    player.g.rotation.y = state.angle;

    // Animate Professor Chang
    animateCharacter(player, timeElapsed, 1.0, state.isMoving, state.isRunning);

    // Animate Puppy Companion
    if (puppyObj) {
      const pupTargetX = state.x - Math.sin(state.angle) * 0.55 - Math.cos(state.angle) * 0.45;
      const pupTargetZ = state.z - Math.cos(state.angle) * 0.55 + Math.sin(state.angle) * 0.45;

      const pupDx = pupTargetX - puppyState.x;
      const pupDz = pupTargetZ - puppyState.z;
      const pupDist = Math.hypot(pupDx, pupDz);

      const pupMoving = pupDist > 0.22;
      if (pupMoving) {
        puppyState.angle = Math.atan2(pupDx, pupDz);
        const pupSpeed = (state.isRunning ? 10.0 : 6.0) * dt;
        puppyState.x += (pupDx / pupDist) * Math.min(pupDist, pupSpeed);
        puppyState.z += (pupDz / pupDist) * Math.min(pupDist, pupSpeed);
      }

      const pupGround = getGroundHeight(puppyState.x, puppyState.z);
      puppyState.y = pupGround ? pupGround.y : state.y;

      puppyObj.g.position.set(puppyState.x, puppyState.y, puppyState.z);
      puppyObj.g.rotation.y = puppyState.angle;

      animatePuppy(puppyObj, timeElapsed, pupMoving, state.isRunning);
    }

    // =========================================================
    // Optimized Proximity Check (Runs every 0.1s, NO scene.traverse!)
    // =========================================================
    proximityCheckTimer += dt;
    if (proximityCheckTimer > 0.1) {
      proximityCheckTimer = 0;
      let foundResident = null;
      let foundLandmark = null;

      for (const res of cachedResidents) {
        const d = Math.hypot(res.x - state.x, res.z - state.z);
        if (d < 2.5) {
          foundResident = { id: res.id, name: res.name };
          break;
        }
      }

      for (const [id, g] of locations) {
        const d = Math.hypot(g.position.x - state.x, g.position.z - state.z);
        if (d < 2.8) {
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
    }

    // Third-person camera follow mode
    if (state.cameraFollow) {
      const camDist = 18;
      const camHeight = 14;
      const targetCamX = state.x - Math.sin(state.angle) * camDist;
      const targetCamZ = state.z - Math.cos(state.angle) * camDist;
      const targetCamY = state.y + camHeight;

      camera.position.x += (targetCamX - camera.position.x) * dt * 5;
      camera.position.y += (targetCamY - camera.position.y) * dt * 5;
      camera.position.z += (targetCamZ - camera.position.z) * dt * 5;

      camera.lookAt(state.x, state.y + 1.2, state.z);
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
    touchUI.remove();
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
    setResidentsCache,
    dispose
  };
}
