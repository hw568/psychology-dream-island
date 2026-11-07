import * as THREE from 'three';

const cache = new Map();
const material = (c, extra = {}) => {
  const key = `${c}-${JSON.stringify(extra)}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.72,
      metalness: 0.08,
      ...extra
    }));
  }
  return cache.get(key);
};

export function createAnimeCharacter(index = 0, owner = false, person = null) {
  const g = new THREE.Group();
  g.userData.characterStyle = 'anime-scholar-refined';

  const residentId = person?.id || `resident-${String((index % 14) + 1).padStart(2, '0')}`;

  const mesh = (p, geo, c, x = 0, y = 0, z = 0, extra = {}) => {
    const m = new THREE.Mesh(geo, material(c, extra));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  };
  const ball = (p, r, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.SphereGeometry(r, 14, 12), c, x, y, z, extra);
  const box = (p, w, h, d, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.BoxGeometry(w, h, d), c, x, y, z, extra);
  const cyl = (p, r1, r2, h, c, x = 0, y = 0, z = 0, n = 12, extra = {}) => mesh(p, new THREE.CylinderGeometry(r1, r2, h, n), c, x, y, z, extra);
  const cone = (p, r, h, c, x = 0, y = 0, z = 0, n = 10, extra = {}) => mesh(p, new THREE.ConeGeometry(r, h, n), c, x, y, z, extra);
  const torus = (p, r, t, c, x = 0, y = 0, z = 0, extra = {}) => mesh(p, new THREE.TorusGeometry(r, t, 8, 20), c, x, y, z, extra);

  const legs = [], arms = [];
  let puppyData = null;
  let bookMesh = null;
  let headGroup = null;

  // ==============================================================
  // 1. OWNER: 張春興教授 (Prof. Chun-Hsing Chang) + 陪伴小白狗 (Puppy)
  // ==============================================================
  if (owner) {
    const skin = '#ffe4cb';
    const suit = '#4a3525';       // Academic brown tweed jacket
    const suitTrim = '#382618';   // Lapel darker trim
    const turtle = '#1c1b20';     // Black turtleneck sweater
    const pants = '#2e2c33';      // Dark grey trousers
    const shoes = '#181210';      // Oxford leather shoes
    const hairColor = '#2b292e';  // Dark hair with subtle silver nuance
    const gold = '#ffd700';

    // ---- Legs & Shoes ----
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.115, 0.32, 0);
      g.add(leg);
      // Trousers
      cyl(leg, 0.075, 0.082, 0.30, pants, 0, -0.12);
      // Trouser cuffs
      torus(leg, 0.082, 0.012, pants, 0, -0.25, 0);
      // Oxford shoes
      box(leg, 0.14, 0.09, 0.25, shoes, 0, -0.27, 0.04);
      // Shoe sole
      box(leg, 0.15, 0.02, 0.26, '#0f0b0a', 0, -0.315, 0.04);
      legs.push(leg);

      // Arms & Sleeves
      const arm = new THREE.Group();
      arm.position.set(side * 0.25, 0.82, 0);
      g.add(arm);
      // Jacket shoulder pad
      ball(arm, 0.095, suit, 0, 0, 0);
      // Upper & lower sleeve
      cyl(arm, 0.082, 0.072, 0.30, suit, 0, -0.13);
      // Cuff
      torus(arm, 0.075, 0.012, suitTrim, 0, -0.26, 0);
      // Hand
      ball(arm, 0.075, skin, 0, -0.30, 0);
      arms.push(arm);
    }

    // ---- Torso (Jacket & Turtleneck) ----
    const torso = new THREE.Group();
    torso.position.set(0, 0.65, 0);
    g.add(torso);
    // Main jacket body
    box(torso, 0.46, 0.48, 0.32, suit, 0, 0, 0);
    // Dark turtleneck chest V-insert
    box(torso, 0.22, 0.38, 0.06, turtle, 0, 0.06, 0.145);
    // Turtleneck rolled collar
    torus(torso, 0.11, 0.04, turtle, 0, 0.26, 0);
    // Tweed jacket lapels (left & right)
    for (const side of [-1, 1]) {
      const lapel = box(torso, 0.11, 0.34, 0.04, suitTrim, side * 0.15, 0.06, 0.16);
      lapel.rotation.z = -side * 0.18;
    }
    // Jacket brass buttons
    for (let by = -0.10; by <= 0.05; by += 0.08) {
      ball(torso, 0.018, gold, 0.02, by, 0.17);
    }
    // Breast pocket with golden fountain pen
    box(torso, 0.08, 0.018, 0.02, suitTrim, -0.15, 0.12, 0.17);
    cyl(torso, 0.006, 0.006, 0.055, gold, -0.14, 0.14, 0.175);

    // ---- Hardcover Book: 《現代心理學》 in hand ----
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0.24, 0.58, 0.14);
    bookGroup.rotation.set(0.3, -0.2, 0.4);
    g.add(bookGroup);
    // Red cloth cover
    box(bookGroup, 0.24, 0.32, 0.07, '#8b1e1b', 0, 0, 0);
    // Golden spine embossing
    box(bookGroup, 0.02, 0.31, 0.075, gold, -0.115, 0, 0);
    // Book pages
    box(bookGroup, 0.21, 0.29, 0.055, '#fefae0', 0.01, 0, 0);
    bookMesh = bookGroup;

    // ---- Head Group (Head, Hair, Glasses, Smile) ----
    headGroup = new THREE.Group();
    headGroup.position.set(0, 1.06, 0);
    g.add(headGroup);
    // Head shape
    ball(headGroup, 0.23, skin, 0, 0, 0);

    // Styled Academic Hair with volume
    const hairMain = ball(headGroup, 0.245, hairColor, 0, 0.05, -0.04);
    hairMain.scale.set(1.02, 0.95, 1.05);
    // Sideburns
    box(headGroup, 0.04, 0.14, 0.08, hairColor, -0.22, -0.02, 0.02);
    box(headGroup, 0.04, 0.14, 0.08, hairColor, 0.22, -0.02, 0.02);
    // Front parted fringe
    for (let hx = -0.16; hx <= 0.16; hx += 0.08) {
      const strand = box(headGroup, 0.07, 0.10, 0.06, hairColor, hx, 0.18, 0.15);
      strand.rotation.z = (hx < 0 ? -0.15 : 0.2);
    }

    // Refined Gold-rimmed Wire Spectacles
    for (const side of [-1, 1]) {
      // Frame ring
      torus(headGroup, 0.068, 0.009, gold, side * 0.105, 0.01, 0.21);
      // Lens (semi-transparent reflective glass)
      mesh(headGroup, new THREE.CircleGeometry(0.06, 14), '#e8f4f8', side * 0.105, 0.01, 0.21, {
        transparent: true,
        opacity: 0.45,
        roughness: 0.1
      });
      // Temple arms going back to ears
      cyl(headGroup, 0.005, 0.005, 0.20, gold, side * 0.17, 0.02, 0.10).rotation.x = Math.PI / 2;
      // Eyes behind glasses
      ball(headGroup, 0.024, '#241c18', side * 0.105, 0.01, 0.19);
    }
    // Bridge between lenses
    cyl(headGroup, 0.006, 0.006, 0.06, gold, 0, 0.02, 0.215).rotation.z = Math.PI / 2;

    // Friendly scholarly smile
    torus(headGroup, 0.04, 0.008, '#a85d50', 0, -0.09, 0.205).rotation.x = 0.5;

    // ==============================================================
    // ---- Companion Fluffy White Puppy (小白狗) ----
    // ==============================================================
    const pup = new THREE.Group();
    pup.position.set(-0.55, 0, 0.18);
    pup.userData.isPuppy = true;
    g.add(pup);

    const furWhite = '#ffffff';
    const pupEyes = '#111111';
    const pupNose = '#1a1a1a';
    const collarRed = '#d32f2f';

    // Puppy Body (layered fluffy balls)
    const pupBody = ball(pup, 0.17, furWhite, 0, 0.20, 0);
    pupBody.scale.set(0.9, 0.95, 1.25);

    // Puppy Head (big fluffy marshmallow)
    const pupHead = ball(pup, 0.16, furWhite, 0, 0.34, 0.12);
    pupHead.scale.set(1.05, 1.0, 1.0);

    // Pointy fluffy puppy ears
    for (const side of [-1, 1]) {
      const ear = cone(pupHead, 0.06, 0.11, furWhite, side * 0.11, 0.13, -0.02);
      ear.rotation.z = side * -0.3;
      cone(ear, 0.035, 0.07, '#ffcdd2', 0, 0.01, 0.02); // Pink ear inside
    }

    // Black shiny puppy eyes & snout
    for (const side of [-1, 1]) {
      ball(pupHead, 0.022, pupEyes, side * 0.065, 0.02, 0.145);
      ball(pupHead, 0.008, '#ffffff', side * 0.068, 0.026, 0.155); // Eye highlight
    }
    // Little black snout & nose
    ball(pupHead, 0.038, furWhite, 0, -0.02, 0.15);
    ball(pupHead, 0.018, pupNose, 0, 0.005, 0.18);

    // Cute red collar with gold tag
    torus(pup, 0.12, 0.016, collarRed, 0, 0.26, 0.06);
    ball(pup, 0.02, gold, 0, 0.23, 0.16);

    // 4 Fluffy little paws
    const pupLegs = [];
    for (const [px, pz] of [[-0.08, 0.12], [0.08, 0.12], [-0.09, -0.12], [0.09, -0.12]]) {
      const leg = new THREE.Group();
      leg.position.set(px, 0.10, pz);
      pup.add(leg);
      cyl(leg, 0.045, 0.04, 0.13, furWhite, 0, -0.02);
      ball(leg, 0.048, furWhite, 0, -0.08, 0.02);
      pupLegs.push(leg);
    }

    // Fluffy tail curled up
    const pupTail = new THREE.Group();
    pupTail.position.set(0, 0.26, -0.15);
    pup.add(pupTail);
    ball(pupTail, 0.08, furWhite, 0, 0.06, -0.04);
    ball(pupTail, 0.065, furWhite, 0, 0.12, -0.01);

    puppyData = { g: pup, head: pupHead, legs: pupLegs, tail: pupTail };

    return { g, legs, arms, headGroup, bookMesh, puppy: puppyData };
  }

  // ==============================================================
  // 2. 14 RESIDENTS: 心理學特化島民 (Psychological Animal Archetypes)
  // ==============================================================
  const skin = '#ffe4cb';
  const residentType = ((index % 14) + 1);

  // Common body base for residents
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.10, 0.28, 0);
    g.add(leg);
    cyl(leg, 0.06, 0.065, 0.26, '#37474f', 0, -0.08);
    box(leg, 0.11, 0.08, 0.20, '#212121', 0, -0.22, 0.03);
    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.21, 0.75, 0);
    g.add(arm);
    cyl(arm, 0.068, 0.058, 0.26, '#455a64', 0, -0.10);
    ball(arm, 0.068, skin, 0, -0.25, 0);
    arms.push(arm);
  }

  // Resident Torso
  const torso = box(g, 0.40, 0.42, 0.26, '#546e7a', 0, 0.62, 0);
  // Resident Head
  const head = ball(g, 0.21, skin, 0, 1.02, 0);

  // Specific Archetype Enhancements
  switch (residentType) {
    case 1: { // 視感梟 (Vision Owl - Sensation)
      torso.material = material('#1565c0');
      // Feather crest
      cone(g, 0.14, 0.28, '#0d47a1', -0.10, 1.28, 0).rotation.z = -0.25;
      cone(g, 0.14, 0.28, '#0d47a1', 0.10, 1.28, 0).rotation.z = 0.25;
      // Big golden owl eyes with optical concentric rings
      for (const side of [-1, 1]) {
        torus(g, 0.08, 0.015, '#ffd700', side * 0.105, 1.04, 0.18);
        ball(g, 0.07, '#ffca28', side * 0.105, 1.04, 0.17);
        ball(g, 0.035, '#000000', side * 0.105, 1.04, 0.22);
        ball(g, 0.012, '#ffffff', side * 0.115, 1.055, 0.24);
      }
      // Curved beak
      cone(g, 0.045, 0.10, '#f57c00', 0, 0.98, 0.22).rotation.x = 1.3;
      // Wing capes
      for (const side of [-1, 1]) {
        const wing = box(g, 0.05, 0.38, 0.20, '#1976d2', side * 0.24, 0.68, -0.04);
        wing.rotation.z = side * 0.15;
      }
      break;
    }

    case 2: { // 完形兔 (Gestalt Rabbit - Perception)
      torso.material = material('#7b1fa2');
      // Long upright rabbit ears with pink inside
      for (const side of [-1, 1]) {
        const ear = cyl(g, 0.045, 0.065, 0.42, '#ffffff', side * 0.12, 1.36, -0.02);
        ear.rotation.z = side * 0.12;
        cyl(ear, 0.025, 0.04, 0.32, '#f48fb1', 0, 0, 0.03);
      }
      // Rubin's Vase crystal in hands
      const vase = new THREE.Group();
      vase.position.set(0, 0.60, 0.22);
      g.add(vase);
      cyl(vase, 0.08, 0.04, 0.12, '#00e5ff', 0, 0.08, 0, 8, { transparent: true, opacity: 0.8 });
      cyl(vase, 0.04, 0.08, 0.12, '#00e5ff', 0, -0.04, 0, 8, { transparent: true, opacity: 0.8 });
      ball(vase, 0.03, '#ffd700', 0, 0.02, 0);
      // Fluffy round tail
      ball(g, 0.08, '#ffffff', 0, 0.34, -0.16);
      break;
    }

    case 3: { // 鳴鐘犬 (Pavlov Bell Dog - Conditioning)
      torso.material = material('#e65100');
      // Floppy dog ears
      for (const side of [-1, 1]) {
        const ear = cyl(g, 0.06, 0.08, 0.28, '#8d6e63', side * 0.22, 1.05, 0);
        ear.rotation.z = side * 0.45;
      }
      // Golden Bell on collar
      torus(g, 0.18, 0.02, '#3e2723', 0, 0.84, 0);
      cone(g, 0.08, 0.12, '#ffd700', 0, 0.77, 0.18);
      ball(g, 0.025, '#ffd700', 0, 0.71, 0.18);
      // Tuning Fork on back
      const fork = cyl(g, 0.015, 0.015, 0.42, '#eceff1', 0, 0.80, -0.16);
      box(fork, 0.16, 0.015, 0.02, '#eceff1', 0, 0.16, 0);
      cyl(fork, 0.012, 0.012, 0.18, '#eceff1', -0.08, 0.24, 0);
      cyl(fork, 0.012, 0.012, 0.18, '#eceff1', 0.08, 0.24, 0);
      break;
    }

    case 4: { // 記憶狐 (Memory Fox - Memory Palace)
      torso.material = material('#c2185b');
      // Fox pointy ears
      for (const side of [-1, 1]) {
        const ear = cone(g, 0.09, 0.22, '#e65100', side * 0.16, 1.25, 0);
        ear.rotation.z = side * 0.2;
        cone(ear, 0.05, 0.14, '#ffffff', 0, 0, 0.03);
      }
      // Big fluffy fox tail with white tip
      const tail = cyl(g, 0.06, 0.14, 0.46, '#e65100', 0, 0.46, -0.22);
      tail.rotation.x = -0.7;
      ball(tail, 0.10, '#ffffff', 0, 0.22, 0);
      // Glowing hourglass in hand
      const hg = new THREE.Group();
      hg.position.set(0.18, 0.62, 0.18);
      g.add(hg);
      cone(hg, 0.06, 0.10, '#ffe082', 0, 0.05, 0);
      cone(hg, 0.06, 0.10, '#ffe082', 0, -0.05, 0).rotation.x = Math.PI;
      ball(hg, 0.02, '#00e5ff', 0, 0, 0, { emissive: '#00e5ff', emissiveIntensity: 0.6 });
      break;
    }

    case 5: { // 快思鷹 (Fast Thinking Eagle - Dual-Process)
      torso.material = material('#d84315');
      // Aviator helmet & goggles
      box(g, 0.44, 0.18, 0.44, '#3e2723', 0, 1.15, 0);
      for (const side of [-1, 1]) {
        torus(g, 0.075, 0.018, '#ffd700', side * 0.11, 1.12, 0.21);
        ball(g, 0.06, '#ffeb3b', side * 0.11, 1.12, 0.20, { emissive: '#ffeb3b', emissiveIntensity: 0.3 });
      }
      // Lightning crest on chest
      box(g, 0.05, 0.18, 0.02, '#ffea00', 0, 0.64, 0.14);
      break;
    }

    case 6: { // 慢想龜 (Slow Thinking Turtle - Rationality)
      torso.material = material('#2e7d32');
      // Hexagonal Carapace on back
      const shell = ball(g, 0.30, '#1b5e20', 0, 0.60, -0.15);
      shell.scale.set(0.85, 1.25, 0.65);
      // Scholar Cap (Mortarboard)
      box(g, 0.46, 0.04, 0.46, '#1a237e', 0, 1.24, 0);
      ball(g, 0.04, '#ffd700', 0, 1.27, 0);
      cyl(g, 0.008, 0.008, 0.16, '#ffd700', 0.14, 1.20, 0.14);
      // Round reading spectacles
      for (const side of [-1, 1]) {
        torus(g, 0.068, 0.012, '#4e342e', side * 0.105, 1.02, 0.21);
      }
      break;
    }

    case 7: { // 金字塔雕 (Pyramid Falcon - Maslow)
      torso.material = material('#f57f17');
      // 5-Tier Maslow Crown
      const crown = new THREE.Group();
      crown.position.set(0, 1.25, 0);
      g.add(crown);
      const mColors = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#8e24aa'];
      for (let k = 0; k < 5; k++) {
        const w = 0.34 - k * 0.06;
        box(crown, w, 0.04, w, mColors[k], 0, k * 0.042, 0);
      }
      ball(crown, 0.04, '#ffd700', 0, 0.24, 0, { emissive: '#ffd700', emissiveIntensity: 0.8 });
      // Wings
      for (const side of [-1, 1]) {
        const wing = box(g, 0.05, 0.38, 0.22, '#fbc02d', side * 0.26, 0.68, -0.05);
        wing.rotation.z = side * 0.2;
      }
      break;
    }

    case 8: { // 覺察熊 (Arousal / Mindful Bear - Emotion)
      torso.material = material('#00897b');
      // Round bear ears
      for (const side of [-1, 1]) {
        ball(g, 0.09, '#4e342e', side * 0.19, 1.20, 0);
        ball(g, 0.05, '#ffccbc', side * 0.19, 1.20, 0.04);
      }
      // Glowing Heart Gem on chest
      mesh(g, new THREE.OctahedronGeometry(0.11, 0), '#e91e63', 0, 0.65, 0.15, {
        emissive: '#e91e63',
        emissiveIntensity: 0.6
      });
      break;
    }

    case 9: { // 羅盤鹿 (OCEAN Compass Deer - Traits)
      torso.material = material('#3949ab');
      // Branching 5-pointed Antlers glowing in OCEAN colors
      for (const side of [-1, 1]) {
        const horn = cyl(g, 0.02, 0.03, 0.36, '#8d6e63', side * 0.14, 1.30, 0);
        horn.rotation.z = side * 0.45;
        // 5 glowing branch tips
        for (let b = 0; b < 3; b++) {
          const tip = cyl(horn, 0.015, 0.015, 0.14, ['#00e5ff', '#76ff03', '#ffd600', '#ff4081', '#7c4dff'][b + (side > 0 ? 2 : 0)], side * 0.06, 0.10 + b * 0.08, 0);
          tip.rotation.z = -side * 0.5;
        }
      }
      break;
    }

    case 10: { // 信效鳥 (Psychometric Bluebird - Measurement)
      torso.material = material('#0288d1');
      // Bluebird tail feathers & crest
      cone(g, 0.09, 0.24, '#01579b', 0, 1.26, -0.06).rotation.x = -0.3;
      // Normal distribution bell-curve badge on chest
      box(g, 0.18, 0.10, 0.02, '#ffffff', 0, 0.64, 0.14);
      torus(g, 0.06, 0.012, '#0288d1', 0, 0.64, 0.15);
      break;
    }

    case 11: { // 從眾羊 (Conformity Sheep - Social Influence)
      torso.material = material('#5e35b1');
      // Fluffy wool puffs on head
      for (let w = -2; w <= 2; w++) {
        ball(g, 0.09, '#ffffff', w * 0.07, 1.20, 0);
      }
      // Curly horns
      for (const side of [-1, 1]) {
        const horn = torus(g, 0.08, 0.025, '#d7ccc8', side * 0.22, 1.08, 0);
        horn.rotation.y = side * 0.4;
      }
      // Asch test stick in hand
      cyl(g, 0.015, 0.015, 0.38, '#ff5722', 0.22, 0.65, 0.18);
      break;
    }

    case 12: { // 同理獺 (Empathy Otter - Prosocial)
      torso.material = material('#00acc1');
      // Cute round otter ears
      ball(g, 0.05, '#4e342e', -0.19, 1.10, 0);
      ball(g, 0.05, '#4e342e', 0.19, 1.10, 0);
      // Luminous cyan empathy heart stone held in paws
      mesh(g, new THREE.DodecahedronGeometry(0.09, 0), '#00e5ff', 0, 0.64, 0.18, {
        emissive: '#00bcd4',
        emissiveIntensity: 0.7
      });
      break;
    }

    case 13: { // 反思貓 (Critical Thinking Cat)
      torso.material = material('#546e7a');
      // Pointed cat ears
      for (const side of [-1, 1]) {
        const ear = cone(g, 0.09, 0.22, '#37474f', side * 0.18, 1.24, 0);
        ear.rotation.z = side * 0.2;
        cone(ear, 0.05, 0.14, '#ffcdd2', 0, 0, 0.02);
      }
      // Detective brass monocle with chain
      torus(g, 0.075, 0.012, '#ffd700', 0.105, 1.02, 0.22);
      cyl(g, 0.005, 0.005, 0.18, '#ffd700', 0.18, 0.94, 0.20);
      // Curled cat tail
      torus(g, 0.14, 0.03, '#37474f', 0, 0.40, -0.16).rotation.y = Math.PI / 2;
      break;
    }

    case 14: { // 探究蜂 (Cognitive Inquiry Bee)
      // Honey & black bumblebee striped torso
      for (let k = 0; k < 4; k++) {
        cyl(g, 0.20, 0.20, 0.10, k % 2 ? '#ffeb3b' : '#212121', 0, 0.46 + k * 0.10, 0);
      }
      // Spring antennae with bright yellow pom-poms
      for (const side of [-1, 1]) {
        const ant = cyl(g, 0.01, 0.01, 0.24, '#212121', side * 0.12, 1.28, 0.08);
        ant.rotation.z = side * 0.35;
        ant.rotation.x = -0.2;
        ball(ant, 0.045, '#ffd600', 0, 0.12, 0);
      }
      // Translucent wings
      for (const side of [-1, 1]) {
        const wing = mesh(g, new THREE.CircleGeometry(0.18, 14), '#e0f7fa', side * 0.15, 0.74, -0.16, {
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide
        });
        wing.rotation.y = side * 0.35;
      }
      break;
    }
  }

  return { g, legs, arms, headGroup: head, puppy: puppyData };
}

/**
 * Animate character walking, running, or idling
 */
export function animateCharacter(char, time, speed = 1, isMoving = false, isRunning = false) {
  if (!char || !char.legs || char.legs.length < 2) return;

  const legSpeed = isRunning ? 14 : 9;
  const legAmp = isRunning ? 0.65 : 0.42;
  const armAmp = isRunning ? 0.60 : 0.35;

  if (isMoving) {
    const swing = Math.sin(time * legSpeed * speed) * legAmp;
    char.legs[0].rotation.x = swing;
    char.legs[1].rotation.x = -swing;
    if (char.arms && char.arms.length >= 2) {
      char.arms[0].rotation.x = -swing * 0.75;
      char.arms[1].rotation.x = swing * 0.75;
    }
    // Subtle vertical bouncing while walking
    char.g.position.y += Math.abs(Math.sin(time * legSpeed * speed)) * 0.035;
  } else {
    // Idle gentle breathing
    char.legs[0].rotation.x = 0;
    char.legs[1].rotation.x = 0;
    if (char.arms && char.arms.length >= 2) {
      const breath = Math.sin(time * 2.5) * 0.04;
      char.arms[0].rotation.z = 0.05 + breath;
      char.arms[1].rotation.z = -0.05 - breath;
      char.arms[0].rotation.x = 0;
      char.arms[1].rotation.x = 0;
    }
  }
}

/**
 * Animate companion puppy
 */
export function animatePuppy(puppy, time, isMoving = false, isRunning = false) {
  if (!puppy || !puppy.legs) return;

  const pupSpeed = isRunning ? 18 : 12;
  if (isMoving) {
    const swing = Math.sin(time * pupSpeed) * 0.55;
    // Diagonal leg gait for 4 legs
    puppy.legs[0].rotation.x = swing;
    puppy.legs[1].rotation.x = -swing;
    puppy.legs[2].rotation.x = -swing;
    puppy.legs[3].rotation.x = swing;
    // Tail wagging excitedly
    if (puppy.tail) {
      puppy.tail.rotation.y = Math.sin(time * 24) * 0.65;
      puppy.tail.rotation.x = 0.2 + Math.abs(Math.sin(time * 12)) * 0.15;
    }
    puppy.g.position.y = Math.abs(Math.sin(time * pupSpeed)) * 0.04;
  } else {
    // Idle sit or gentle wag
    puppy.legs.forEach(l => l.rotation.x = 0);
    puppy.g.position.y = 0;
    if (puppy.tail) {
      puppy.tail.rotation.y = Math.sin(time * 6) * 0.35;
      puppy.tail.rotation.x = 0;
    }
    if (puppy.head) {
      puppy.head.rotation.z = Math.sin(time * 2) * 0.08; // Curious head tilt
    }
  }
}
