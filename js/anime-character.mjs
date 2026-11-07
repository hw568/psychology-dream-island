import * as THREE from 'three';

const cache = new Map();
const material = (c, extra = {}) => {
  const key = `${c}-${JSON.stringify(extra)}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.77, ...extra }));
  }
  return cache.get(key);
};

export function createAnimeCharacter(index = 0, owner = false, person = null) {
  const g = new THREE.Group();
  g.userData.characterStyle = 'anime-chibi';

  const residentId = person?.id || `resident-${String((index % 14) + 1).padStart(2, '0')}`;
  const residentName = person?.name || '';

  const mesh = (p, geo, c, x = 0, y = 0, z = 0, extra = {}) => {
    const m = new THREE.Mesh(geo, material(c, extra));
    m.position.set(x, y, z);
    m.castShadow = true;
    p.add(m);
    return m;
  };
  const ball = (p, r, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.SphereGeometry(r, 12, 10), c, x, y, z, extra);
  const box = (p, w, h, d, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.BoxGeometry(w, h, d), c, x, y, z, extra);
  const cyl = (p, r1, r2, h, c, x = 0, y = 0, z = 0, n = 8, extra = {}) => mesh(p, new THREE.CylinderGeometry(r1, r2, h, n), c, x, y, z, extra);
  const cone = (p, r, h, c, x = 0, y = 0, z = 0, n = 8, extra = {}) => mesh(p, new THREE.ConeGeometry(r, h, n), c, x, y, z, extra);
  const torus = (p, r, t, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.TorusGeometry(r, t, 6, 16), c, x, y, z, extra);

  const legs = [], arms = [];

  // ==========================================
  // 1. OWNER: 張春興教授 (Prof. Chun-Hsing Chang)
  // ==========================================
  if (owner) {
    const skin = '#ffe4cb';
    const suit = '#4e382a';      // Academic brown tweed jacket
    const turtle = '#1c1b20';    // Black turtleneck sweater
    const pants = '#2e2c33';     // Dark grey trousers
    const shoes = '#1a1412';     // Oxford leather shoes
    const hairColor = '#2b292e'; // Dark hair with silver highlights

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.105, 0.30, 0);
      g.add(leg);
      cyl(leg, 0.068, 0.072, 0.26, pants, 0, -0.10);
      box(leg, 0.13, 0.10, 0.24, shoes, 0, -0.25, 0.04);
      legs.push(leg);

      const arm = new THREE.Group();
      arm.position.set(side * 0.23, 0.77, 0);
      g.add(arm);
      cyl(arm, 0.078, 0.068, 0.28, suit, 0, -0.11);
      ball(arm, 0.077, skin, 0, -0.27, 0);
      arms.push(arm);
    }

    // Torso (Suit Jacket + Turtleneck)
    cyl(g, 0.19, 0.22, 0.44, suit, 0, 0.62, 0, 10);
    box(g, 0.36, 0.19, 0.26, pants, 0, 0.37);

    // Turtleneck inner collar
    cyl(g, 0.12, 0.13, 0.15, turtle, 0, 0.82, 0.02);

    // Jacket lapels & buttons
    for (const side of [-1, 1]) {
      const lapel = box(g, 0.08, 0.28, 0.04, '#3d2b20', side * 0.09, 0.70, 0.18);
      lapel.rotation.z = -side * 0.25;
    }
    box(g, 0.02, 0.02, 0.02, '#c5a059', 0, 0.58, 0.21); // Gold button

    // Head
    const head = ball(g, 0.335, skin, 0, 1.075, 0);
    head.name = 'anime-face';
    ball(g, 0.072, skin, -0.33, 1.06, 0);
    ball(g, 0.072, skin, 0.33, 1.06, 0);

    // Scholar hair with neat side parting & silver streaks
    const cap = mesh(g, new THREE.SphereGeometry(0.355, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hairColor, 0, 1.095, 0);
    cap.name = 'anime-hair';
    const silverBangs = ball(g, 0.12, '#9e9e9e', -0.12, 1.30, 0.20);
    silverBangs.scale.set(0.9, 0.8, 0.4);
    for (const side of [-1, 1]) {
      const bang = ball(g, 0.15, hairColor, side * 0.18, 1.28, 0.20);
      bang.scale.set(0.85, 1.15, 0.45);
      const sideHair = ball(g, 0.14, hairColor, side * 0.33, 1.12, -0.05);
      sideHair.scale.set(0.7, 1.2, 0.8);
    }

    // Eyes with wise warm gaze
    for (const side of [-1, 1]) {
      const x = side * 0.125;
      const outline = ball(g, 0.087, '#312528', x, 1.09, 0.297);
      outline.scale.set(0.80, 1.22, 0.28);
      const eye = ball(g, 0.069, '#4a3b32', x, 1.085, 0.316);
      eye.scale.set(0.76, 1.18, 0.28);
      const pupil = ball(g, 0.037, '#1b1412', x, 1.085, 0.333);
      pupil.scale.set(0.70, 1.30, 0.25);
      ball(g, 0.024, '#ffffff', x - 0.018, 1.122, 0.346);
      ball(g, 0.011, '#fffdf4', x + 0.020, 1.066, 0.347);
    }

    // Benevolent gentle smile
    const smile = torus(g, 0.055, 0.009, '#8c595c', 0, 0.97, 0.317);
    smile.rotation.z = Math.PI;

    // Scholar Wireframe Glasses (Spectacles)
    const glassesMatColor = '#c5a059'; // Golden brass rims
    for (const side of [-1, 1]) {
      const rim = torus(g, 0.085, 0.012, glassesMatColor, side * 0.13, 1.085, 0.355);
      // Lens glass shine
      const lens = cyl(g, 0.078, 0.078, 0.01, '#e3f2fd', side * 0.13, 1.085, 0.355, 12, { transparent: true, opacity: 0.45 });
      lens.rotation.x = Math.PI / 2;
    }
    // Glasses nose bridge & temples
    box(g, 0.08, 0.012, 0.015, glassesMatColor, 0, 1.09, 0.36);
    box(g, 0.012, 0.012, 0.16, glassesMatColor, -0.22, 1.09, 0.28);
    box(g, 0.012, 0.012, 0.16, glassesMatColor, 0.22, 1.09, 0.28);

    // Psychology Textbook under arm: 《現代心理學》
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-0.31, 0.65, 0.08);
    bookGroup.rotation.set(0.2, 0.15, -0.3);
    g.add(bookGroup);
    box(bookGroup, 0.11, 0.36, 0.28, '#8b263e'); // Crimson hardcover
    box(bookGroup, 0.09, 0.34, 0.26, '#fff8e7', 0.01, 0, 0); // Pages
    box(bookGroup, 0.015, 0.30, 0.04, '#ffd700', 0.06, 0, 0); // Gold title spine

    // ------------------------------------------
    // Companion White Puppy (張教授身邊的小白狗)
    // ------------------------------------------
    const dog = new THREE.Group();
    dog.position.set(0.38, 0.04, 0.05);
    g.add(dog);

    // Fluffy body & head
    const dogBody = ball(dog, 0.13, '#ffffff', 0, 0.13, 0);
    dogBody.scale.set(1.1, 0.95, 1.25);
    const dogHead = ball(dog, 0.115, '#ffffff', 0, 0.26, 0.08);

    // Floppy ears
    for (const side of [-1, 1]) {
      const ear = ball(dog, 0.065, '#f5f5f5', side * 0.095, 0.28, 0.04);
      ear.scale.set(0.6, 1.3, 0.8);
      ear.rotation.z = side * 0.4;
    }

    // Cute dog face (two shiny black eyes, cute black nose)
    ball(dog, 0.022, '#1a1a1a', -0.04, 0.27, 0.185);
    ball(dog, 0.022, '#1a1a1a', 0.04, 0.27, 0.185);
    ball(dog, 0.025, '#1a1a1a', 0, 0.23, 0.195);
    ball(dog, 0.016, '#ff80ab', 0, 0.205, 0.185); // Tiny tongue

    // Perky curled tail
    const tail = torus(dog, 0.06, 0.025, '#ffffff', 0, 0.22, -0.14);
    tail.rotation.x = Math.PI / 3;

    // Four cute paws
    for (const x of [-0.07, 0.07]) {
      for (const z of [-0.08, 0.08]) {
        ball(dog, 0.038, '#ffffff', x, 0.038, z);
      }
    }

    return { g, legs, arms };
  }

  // ==========================================
  // 2. THE 14 PSYCHOLOGICAL RESIDENTS / ANIMALS
  // ==========================================
  const skin = ['#ffe0c1', '#fcd5b5', '#f7cca0', '#fad2af'][index % 4];
  const hair = ['#4b3c4c', '#795548', '#34495e', '#b47741', '#5d4037', '#37474f'][index % 6];
  const iris = ['#4a6fa5', '#388e3c', '#8e24aa', '#e67e22', '#0097a7', '#5c6bc0'][index % 6];

  // Base Legs & Arms
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.105, 0.30, 0);
    g.add(leg);
    cyl(leg, 0.065, 0.07, 0.24, '#ffffff', 0, -0.10);
    box(leg, 0.13, 0.10, 0.23, '#454558', 0, -0.25, 0.04);
    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.225, 0.77, 0);
    g.add(arm);
    cyl(arm, 0.075, 0.065, 0.26, '#6b4d84', 0, -0.11);
    ball(arm, 0.077, skin, 0, -0.27, 0);
    arms.push(arm);
  }

  // Base Torso
  cyl(g, 0.18, 0.22, 0.42, '#5e4375', 0, 0.62, 0, 10);
  box(g, 0.36, 0.19, 0.26, '#39334a', 0, 0.37);

  // Base Head & Face
  const head = ball(g, 0.335, skin, 0, 1.075, 0);
  head.name = 'anime-face';
  ball(g, 0.072, skin, -0.33, 1.06, 0);
  ball(g, 0.072, skin, 0.33, 1.06, 0);

  const cap = mesh(g, new THREE.SphereGeometry(0.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, 0, 1.095, 0);
  cap.name = 'anime-hair';
  for (const side of [-1, 1]) {
    const bang = ball(g, 0.15, hair, side * 0.18, 1.28, 0.20);
    bang.scale.set(0.85, 1.15, 0.45);
  }

  // Expressive Anime Eyes
  for (const side of [-1, 1]) {
    const x = side * 0.125;
    const outline = ball(g, 0.087, '#332742', x, 1.09, 0.297);
    outline.scale.set(0.80, 1.22, 0.28);
    const eye = ball(g, 0.069, iris, x, 1.085, 0.316);
    eye.scale.set(0.76, 1.18, 0.28);
    const pupil = ball(g, 0.037, '#1f162b', x, 1.085, 0.333);
    pupil.scale.set(0.70, 1.30, 0.25);
    ball(g, 0.024, '#ffffff', x - 0.018, 1.122, 0.346);
    ball(g, 0.011, '#fffdf4', x + 0.020, 1.066, 0.347);
    const cheek = ball(g, 0.049, '#ffb4a2', side * 0.235, 1.00, 0.257);
    cheek.scale.set(1, 0.45, 0.20);
  }
  const smile = torus(g, 0.055, 0.009, '#9b5b63', 0, 0.97, 0.317);
  smile.rotation.z = Math.PI;

  // -------------------------------------------------------------
  // CUSTOMIZE ACCORDING TO SPECIFIC PSYCHOLOGICAL CREATURE/OBJECT
  // -------------------------------------------------------------
  const resIdx = parseInt(residentId.replace('resident-', ''), 10) || ((index % 14) + 1);

  switch (resIdx) {
    case 1: // 視感梟 (Sensation Owl)
      // Large golden nocturnal eye rings
      for (const side of [-1, 1]) {
        torus(g, 0.11, 0.018, '#f1c40f', side * 0.125, 1.085, 0.33);
      }
      // Feathered ear-tufts (owl horns)
      for (const side of [-1, 1]) {
        const tuft = cone(g, 0.09, 0.32, '#8d6e63', side * 0.22, 1.50, 0.05);
        tuft.rotation.z = side * 0.35;
        tuft.rotation.x = -0.15;
      }
      // Curved owl beak
      const beak = cone(g, 0.045, 0.12, '#e67e22', 0, 1.00, 0.35);
      beak.rotation.x = Math.PI / 1.8;
      // Wing feathers
      for (const side of [-1, 1]) {
        const wing = box(g, 0.06, 0.35, 0.18, '#6d4c41', side * 0.28, 0.72, -0.05);
        wing.rotation.z = side * 0.2;
      }
      break;

    case 2: // 完形兔 (Gestalt Rabbit / Duck-Rabbit Illusion)
      // Tall bunny ears
      for (const side of [-1, 1]) {
        const ear = cyl(g, 0.065, 0.08, 0.48, '#ffffff', side * 0.15, 1.62, 0.02);
        ear.rotation.z = side * 0.18;
        // Pink inner ear
        cyl(ear, 0.035, 0.045, 0.42, '#ff80ab', 0, 0, 0.035);
      }
      // Pink nose
      ball(g, 0.03, '#ff4081', 0, 1.02, 0.34);
      // Fluffy round tail
      ball(g, 0.09, '#ffffff', 0, 0.42, -0.18);
      // Holding Gestalt Impossible Octahedron
      mesh(g, new THREE.OctahedronGeometry(0.12, 0), '#80deea', -0.28, 0.65, 0.18, { wireframe: true });
      break;

    case 3: // 鳴鐘犬 (Pavlov's Bell Dog)
      // Floppy dog ears
      for (const side of [-1, 1]) {
        const ear = ball(g, 0.13, '#c68b59', side * 0.28, 1.15, 0.05);
        ear.scale.set(0.65, 1.45, 0.85);
        ear.rotation.z = side * 0.3;
      }
      // Cute dog snout
      ball(g, 0.065, '#e0a97a', 0, 1.01, 0.32);
      ball(g, 0.035, '#212121', 0, 1.03, 0.37);
      // Bell collar
      torus(g, 0.19, 0.035, '#d32f2f', 0, 0.82, 0); // Red collar
      ball(g, 0.065, '#f1c40f', 0, 0.77, 0.21);      // Golden chime bell
      torus(g, 0.03, 0.012, '#f39c12', 0, 0.72, 0.21);
      // Wagging tail
      const dogTail = cyl(g, 0.04, 0.02, 0.28, '#c68b59', 0, 0.45, -0.22);
      dogTail.rotation.x = -Math.PI / 3;
      break;

    case 4: // 記憶狐 (Ebbinghaus Memory Fox)
      // Pointed orange fox ears with black tips
      for (const side of [-1, 1]) {
        const ear = cone(g, 0.11, 0.28, '#e67e22', side * 0.20, 1.48, 0.05);
        ear.rotation.z = side * 0.25;
        cone(ear, 0.05, 0.12, '#212121', 0, 0.08, 0);
      }
      // Giant bushy fox tail with snowy tip
      const foxTail = ball(g, 0.18, '#e67e22', 0.15, 0.45, -0.26);
      foxTail.scale.set(0.85, 1.8, 0.95);
      foxTail.rotation.x = 0.5;
      ball(foxTail, 0.11, '#ffffff', 0, 0.16, 0); // White tip
      // Miniature hourglass
      const hg = new THREE.Group();
      hg.position.set(-0.25, 0.65, 0.15);
      g.add(hg);
      cone(hg, 0.05, 0.08, '#ffe082', 0, 0.04, 0);
      const hgBottom = cone(hg, 0.05, 0.08, '#ffe082', 0, -0.04, 0);
      hgBottom.rotation.x = Math.PI;
      break;

    case 5: // 快思鷹 (Kahneman's Fast Thinking Eagle)
      // Aviator goggles on forehead
      for (const side of [-1, 1]) {
        torus(g, 0.08, 0.02, '#37474f', side * 0.13, 1.25, 0.28);
        ball(g, 0.065, '#ffe082', side * 0.13, 1.25, 0.28, { emissive: '#ffd54f', emissiveIntensity: 0.3 });
      }
      box(g, 0.08, 0.02, 0.02, '#263238', 0, 1.25, 0.32);
      // Raptor feather crest
      for (let k = -1; k <= 1; k++) {
        const feather = box(g, 0.06, 0.26, 0.04, '#c0392b', k * 0.08, 1.48, -0.02);
        feather.rotation.z = k * 0.25;
      }
      // Lightning bolt intuition emblem on chest
      box(g, 0.04, 0.14, 0.02, '#f1c40f', 0, 0.68, 0.21);
      break;

    case 6: // 慢想龜 (Slow Thinking Tortoise)
      // Carapace shell on back
      const shell = ball(g, 0.28, '#2e7d32', 0, 0.62, -0.16);
      shell.scale.set(0.9, 1.2, 0.6);
      // Round wireframe reading spectacles
      for (const side of [-1, 1]) {
        torus(g, 0.075, 0.012, '#3e2723', side * 0.125, 1.085, 0.34);
      }
      box(g, 0.06, 0.01, 0.01, '#3e2723', 0, 1.085, 0.345);
      // Sage scholar cap
      box(g, 0.45, 0.03, 0.45, '#1a237e', 0, 1.44, 0);
      ball(g, 0.04, '#ffd700', 0, 1.47, 0);
      break;

    case 7: // 金字塔雕 (Maslow Pyramid Falcon)
      // Stepped miniature 5-tier golden pyramid headdress
      const pyr = new THREE.Group();
      pyr.position.set(0, 1.45, 0.05);
      g.add(pyr);
      for (let k = 0; k < 5; k++) {
        const w = 0.28 - k * 0.05;
        box(pyr, w, 0.04, w, ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#9b59b6'][k], 0, k * 0.042, 0);
      }
      ball(pyr, 0.045, '#ffd700', 0, 0.24, 0, { emissive: '#ffd700', emissiveIntensity: 0.5 });
      // Wings
      for (const side of [-1, 1]) {
        const wing = box(g, 0.06, 0.38, 0.22, '#d4ac0d', side * 0.28, 0.72, -0.06);
        wing.rotation.z = side * 0.25;
      }
      break;

    case 8: // 覺察熊 (Arousal / Mindful Bear)
      // Round bear ears
      for (const side of [-1, 1]) {
        const ear = ball(g, 0.10, '#5d4037', side * 0.25, 1.38, 0.02);
        ball(ear, 0.055, '#d7ccc8', 0, 0, 0.04);
      }
      // Cozy teal knitted scarf
      torus(g, 0.21, 0.05, '#00897b', 0, 0.83, 0.02);
      box(g, 0.08, 0.24, 0.03, '#00897b', -0.09, 0.72, 0.21);
      // Glowing ruby heart emblem on chest (Somatic physiological pulse)
      mesh(g, new THREE.OctahedronGeometry(0.065, 0), '#e91e63', 0.08, 0.68, 0.21, { emissive: '#ad1457', emissiveIntensity: 0.6 });
      break;

    case 9: // 羅盤鹿 (OCEAN Compass Deer)
      // Branching deer antlers
      for (const side of [-1, 1]) {
        const mainHorn = cyl(g, 0.025, 0.02, 0.38, '#8d6e63', side * 0.20, 1.55, -0.02);
        mainHorn.rotation.z = side * 0.45;
        const branch = cyl(mainHorn, 0.018, 0.015, 0.18, '#8d6e63', side * 0.05, 0.08, 0.04);
        branch.rotation.z = side * 0.6;
      }
      // 5-Pointed star compass (OCEAN)
      mesh(g, new THREE.OctahedronGeometry(0.08, 0), '#9b59b6', -0.28, 0.65, 0.18, { emissive: '#8e44ad', emissiveIntensity: 0.4 });
      break;

    case 10: // 信效鳥 (Bandura Self-Efficacy Bluebird)
      // Cerulean azure feather cap & crest
      for (let k = 0; k < 3; k++) {
        const plume = cone(g, 0.06, 0.28, '#1976d2', 0, 1.48 + k * 0.04, -k * 0.06);
        plume.rotation.x = -0.35 - k * 0.15;
      }
      // Blue wings
      for (const side of [-1, 1]) {
        const wing = box(g, 0.06, 0.36, 0.22, '#42a5f5', side * 0.28, 0.72, -0.05);
        wing.rotation.z = side * 0.3;
      }
      // Golden medal star of mastery
      ball(g, 0.05, '#f1c40f', 0, 0.70, 0.21, { emissive: '#f39c12', emissiveIntensity: 0.4 });
      break;

    case 11: // 從眾羊 (Asch Conformity Sheep)
      // Fluffy wool puffs around head
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ball(g, 0.09, '#f5f5f5', Math.cos(a) * 0.30, 1.25 + Math.sin(a) * 0.12, Math.sin(a) * 0.12);
      }
      // Curved ram horns
      for (const side of [-1, 1]) {
        const horn = torus(g, 0.09, 0.035, '#bcaaa4', side * 0.28, 1.28, 0.05);
        horn.rotation.y = side * Math.PI / 3;
      }
      // Formal school uniform collar & matching striped necktie
      box(g, 0.06, 0.22, 0.03, '#1565c0', 0, 0.66, 0.21);
      break;

    case 12: // 同理獺 (Empathy Otter)
      // Small rounded river otter ears
      for (const side of [-1, 1]) {
        ball(g, 0.07, '#5d4037', side * 0.26, 1.25, 0.04);
      }
      // Button nose & whisker pads
      ball(g, 0.04, '#1b1b1b', 0, 1.02, 0.34);
      // Holding smooth turquoise heart stone in paws
      mesh(g, new THREE.DodecahedronGeometry(0.08, 0), '#00bcd4', 0, 0.64, 0.22, { emissive: '#0097a7', emissiveIntensity: 0.5 });
      // Rudder tail
      const otterTail = cyl(g, 0.06, 0.03, 0.34, '#5d4037', 0, 0.42, -0.20);
      otterTail.rotation.x = -Math.PI / 3.5;
      break;

    case 13: // 反思貓 (Schrödinger / Critical Thinking Cat)
      // Pointed feline ears with pink inside
      for (const side of [-1, 1]) {
        const ear = cone(g, 0.10, 0.24, '#424242', side * 0.20, 1.46, 0.04);
        ear.rotation.z = side * 0.2;
        cone(ear, 0.05, 0.14, '#ffcdd2', 0, 0.02, 0.03);
      }
      // Detective brass monocle over right eye
      torus(g, 0.08, 0.012, '#f39c12', 0.125, 1.085, 0.35);
      cyl(g, 0.006, 0.006, 0.22, '#f39c12', 0.20, 0.98, 0.33); // Hanging chain
      // Curved cat tail
      const catTail = torus(g, 0.15, 0.03, '#424242', 0, 0.48, -0.18);
      catTail.rotation.y = Math.PI / 2;
      break;

    case 14: // 探究蜂 (Cognitive Inquiry Bee)
      // Striped honey & black bumblebee sweater
      for (let k = 0; k < 4; k++) {
        cyl(g, 0.185 + k * 0.008, 0.195 + k * 0.008, 0.08, k % 2 ? '#f1c40f' : '#212121', 0, 0.50 + k * 0.07, 0, 10);
      }
      // Coiled spring antennae with bright pom-poms
      for (const side of [-1, 1]) {
        const ant = cyl(g, 0.012, 0.012, 0.24, '#212121', side * 0.12, 1.46, 0.12);
        ant.rotation.z = side * 0.35;
        ant.rotation.x = -0.2;
        ball(ant, 0.045, '#f1c40f', 0, 0.12, 0); // Yellow pom-pom
      }
      // Translucent fairy bee wings on back
      for (const side of [-1, 1]) {
        const wing = mesh(g, new THREE.CircleGeometry(0.16, 12), '#e0f7fa', side * 0.14, 0.76, -0.16, { transparent: true, opacity: 0.75 });
        wing.rotation.y = side * 0.35;
      }
      break;
  }

  return { g, legs, arms };
}
