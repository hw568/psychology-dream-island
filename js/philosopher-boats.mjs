import { CSS2DObject } from '../vendor/CSS2DRenderer.js';
// =========================================================================
// 海上哲學家智慧之舟 (Philosopher Wisdom Ships System)
// 航行於群島海域的特製哲學家帆船，點擊可近距離認識思想先驅、收集傳世名言與心靈小語
// =========================================================================

import * as THREE from 'three';

export const PHILOSOPHERS_DATA = [
  {
    id: 'hypatia',
    name: '希帕蒂亞 (Hypatia of Alexandria)',
    era: '西元 4 世紀 · 古代亞歷山卓',
    title: '亞歷山卓學派首位偉大女性哲學家、天文學家與數學家',
    avatar: 'assets/psi.svg',
    hullColor: '#2b3a67',
    sailColor: '#f7f4ea',
    accentColor: '#9b5de5',
    flagColor: '#f15bb5',
    quote: '保留你思考的權利，因為就算思考錯誤，也比完全不思考要好。',
    insight: '「獨立思辨是心靈最崇高的自由。當大腦勇敢質疑未經檢驗的常規，我們才真正站在自我意識的起點。」',
    psychologyConnection: '連結「感知覺醒島」與「理性思維島」：認知心理學中的元認知（Metacognition）與批判性思維。',
    relatedCourseId: 'island-01',
    relatedCourseName: '感知覺醒島',
    route: { radiusX: 50, radiusZ: 58, speed: 0.022, phase: 0.2, height: -1.2 }
  },
  {
    id: 'socrates',
    name: '蘇格拉底 (Socrates)',
    era: '西元前 5 世紀 · 古希臘雅典',
    title: '西方哲學之父 · 靈魂產婆術的開創者',
    avatar: 'assets/psi.svg',
    hullColor: '#5c4033',
    sailColor: '#fdfbf7',
    accentColor: '#d4a373',
    flagColor: '#e76f51',
    quote: '未經審視的人生是不值得活的。我唯一知道的事，就是我一無所知。',
    insight: '「真正的智慧始於承認自己的盲點。唯有不斷自我反思、探問內心深處的假設，靈魂才能擺脫偏見的牢籠。」',
    psychologyConnection: '連結「中央衛城」與「理性思維島」：認知行為治療（CBT）的蘇格拉底提問法與自我覺察。',
    relatedCourseId: 'island-03',
    relatedCourseName: '理性思維島',
    route: { radiusX: 58, radiusZ: 48, speed: 0.020, phase: 1.8, height: -1.2 }
  },
  {
    id: 'simone',
    name: '西蒙·波娃 (Simone de Beauvoir)',
    era: '20 世紀 · 法國巴黎',
    title: '現代存在主義哲學宗師 · 女性自我覺醒先驅',
    avatar: 'assets/psi.svg',
    hullColor: '#6a040f',
    sailColor: '#fff0f3',
    accentColor: '#9d0208',
    flagColor: '#ffba08',
    quote: '人不是生而為女人，而是成為女人。唯有自由地選擇自己，靈魂才能抵達真實。',
    insight: '「我們的自我不是宿命決定的固定標本，而是在一次次有意識的抉擇中創造出來的。擁抱你的自由，無懼世界的目光。」',
    psychologyConnection: '連結「人格演繹島」與「動機與情緒島」：發展心理學中的自我認同探索、性別基模與自我實現。',
    relatedCourseId: 'island-05',
    relatedCourseName: '人格演繹島',
    route: { radiusX: 52, radiusZ: 62, speed: 0.019, phase: 3.4, height: -1.2 }
  },
  {
    id: 'hannah',
    name: '漢娜·鄂蘭 (Hannah Arendt)',
    era: '20 世紀 · 現代思想家',
    title: '極權主義與平庸之惡的深刻省思者',
    avatar: 'assets/psi.svg',
    hullColor: '#1d3557',
    sailColor: '#f1faee',
    accentColor: '#457b9d',
    flagColor: '#e63946',
    quote: '平庸之惡源於停止思考；思考本身就是一種危險的事業，但完全不思考更是無比危險。',
    insight: '「當一個人停止獨立思考、盲目服從群體常態時，心靈便陷入最沉重的昏睡。思考是保護我們不被集體盲從吞噬的唯一防線。」',
    psychologyConnection: '連結「社會共振島」：社會心理學中的阿許從眾實驗、米爾格倫服從權威與責任分散效應。',
    relatedCourseId: 'island-06',
    relatedCourseName: '社會共振島',
    route: { radiusX: 60, radiusZ: 52, speed: 0.018, phase: 4.6, height: -1.2 }
  },
  {
    id: 'mary-calkins',
    name: '瑪麗·卡爾金斯 (Mary Whiton Calkins)',
    era: '19 世紀末 · 美國心理學界先驅',
    title: '美國心理學會（APA）首位女性主席 · 自我心理學奠基者',
    avatar: 'assets/psi.svg',
    hullColor: '#403d39',
    sailColor: '#fffcf2',
    accentColor: '#ccc5b9',
    flagColor: '#eb5e28',
    quote: '自我不是孤立的幽靈，而是在與他人的關係中不斷被經驗與理解的心靈存在。',
    insight: '「心理學的核心不是冷冰冰的數據，而是鮮活的自我經驗。每一刻的自尊與心智成長，都源於你如何看待自己與世界的連結。」',
    psychologyConnection: '連結「記憶之宮島」與「人格演繹島」：配對聯想記憶研究與自尊心理學。',
    relatedCourseId: 'island-02',
    relatedCourseName: '記憶之宮島',
    route: { radiusX: 48, radiusZ: 56, speed: 0.023, phase: 5.7, height: -1.2 }
  },
  {
    id: 'aristotle',
    name: '亞里斯多德 (Aristotle)',
    era: '西元前 4 世紀 · 古希臘逍遙學派',
    title: '百科全書式先哲 · 歷史上第一部心靈論著《靈魂論》作者',
    avatar: 'assets/psi.svg',
    hullColor: '#3d314a',
    sailColor: '#f8f9fa',
    accentColor: '#684756',
    flagColor: '#ffd166',
    quote: '認識自己是所有智慧的源頭。重複的行為塑造了我們，因此卓越不是一種行為，而是一種習慣。',
    insight: '「心智宛如一塊白板，世界在上面刻下記憶。找到理智與情感的黃金中庸之道，便是心靈最豐盛的幸福。」',
    psychologyConnection: '連結「記憶之宮島」與「動機與情緒島」：行為習慣養成、經驗主義與正向心理學（Eudaimonia）。',
    relatedCourseId: 'island-04',
    relatedCourseName: '動機與情緒島',
    route: { radiusX: 56, radiusZ: 56, speed: 0.020, phase: 2.7, height: -1.2 }
  },
  {
    id: 'descartes',
    name: '勒內·笛卡兒 (René Descartes)',
    era: '17 世紀 · 法國理性主義先驅',
    title: '近代哲學奠基者 · 心物二元論與座標幾何之父',
    avatar: 'assets/psi.svg',
    hullColor: '#1a2238',
    sailColor: '#ede8f5',
    accentColor: '#9daaf2',
    flagColor: '#ff6a3d',
    quote: '我思，故我在（Cogito, ergo sum）。懷疑一切，方能抵達不可動搖的真實。',
    insight: '「哪怕感知有時會被錯覺欺騙，正在質疑與思考的我，卻是絕對真實的存在。大膽運用你的理性之光照亮黑暗。」',
    psychologyConnection: '連結「感知覺醒島」：神經反射弧模型、身心關係與知覺懷疑論。',
    relatedCourseId: 'island-01',
    relatedCourseName: '感知覺醒島',
    route: { radiusX: 52, radiusZ: 48, speed: 0.024, phase: 0.9, height: -1.2 }
  }
];

const QUOTES_STORAGE_KEY = 'psychology_island_collected_philosopher_quotes_v1';

export function loadCollectedQuotes() {
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCollectedQuote(philosopherId) {
  try {
    const list = loadCollectedQuotes();
    if (!list.includes(philosopherId)) {
      list.push(philosopherId);
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

export function createPhilosopherBoats(scene, options = {}) {
  const { onOpenQuote, toast, onSelectCourse } = options;
  const boats = [];
  const pickables = [];

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.12,
    ...extra
  });

  const waveMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Build a distinctive 3D sailing boat with a philosopher figure for each thinker
  PHILOSOPHERS_DATA.forEach((phil, index) => {
    const boatGroup = new THREE.Group();
    boatGroup.name = `philosopher-boat-${phil.id}`;
    boatGroup.userData.isPhilosopherBoat = true;
    boatGroup.userData.philosopherId = phil.id;
    scene.add(boatGroup);

    // 1. Boat Hull (Streamlined wooden hull)
    const hullMat = mat(phil.hullColor);
    const trimMat = mat(phil.accentColor, { metalness: 0.3 });
    const deckMat = mat('#e8d7b8');
    const goldMat = mat('#ffd700', { metalness: 0.4, roughness: 0.3 });

    // Main hull
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.7, 0.7, 8), hullMat);
    hull.scale.set(0.9, 1.0, 2.4);
    hull.position.y = 0.25;
    hull.castShadow = true;
    hull.receiveShadow = true;
    boatGroup.add(hull);

    // Deck planking
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 2.6), deckMat);
    deck.position.set(0, 0.58, 0);
    deck.castShadow = true;
    boatGroup.add(deck);

    // Golden prow figurehead
    const prow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6), goldMat);
    prow.rotation.x = Math.PI / 2.6;
    prow.position.set(0, 0.65, 1.45);
    boatGroup.add(prow);

    // Cabin / Scholar Shelter
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.9), mat('#f4ebd9'));
    cabin.position.set(0, 0.88, -0.45);
    cabin.castShadow = true;
    boatGroup.add(cabin);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.45, 4), mat(phil.accentColor));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 1.38, -0.45);
    boatGroup.add(roof);

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8), mat('#8d6e63'));
    mast.position.set(0, 2.2, 0.25);
    mast.castShadow = true;
    boatGroup.add(mast);

    // Billowing Main Sail (Curved with wind)
    const sailGeo = new THREE.CylinderGeometry(1.1, 1.4, 2.4, 12, 1, true, -Math.PI / 2.6, Math.PI / 1.3);
    const sail = new THREE.Mesh(sailGeo, mat(phil.sailColor, { side: THREE.DoubleSide, roughness: 0.85 }));
    sail.rotation.y = Math.PI;
    sail.position.set(0, 2.4, 0.25);
    sail.castShadow = true;
    boatGroup.add(sail);

    // Masthead Flag
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.32, 0.03), mat(phil.flagColor));
    flag.position.set(0.32, 4.0, 0.25);
    boatGroup.add(flag);

    // Lantern of Wisdom (Emits soft celestial glow at night)
    const lantern = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), mat('#ffe57f', {
      emissive: '#ffb300',
      emissiveIntensity: 1.2
    }));
    lantern.position.set(0, 1.2, 1.35);
    boatGroup.add(lantern);

    // Floating Sparkling Halo above the boat so player can spot it from far away
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 24), goldMat);
    halo.position.set(0, 4.5, 0);
    halo.rotation.x = Math.PI / 2;
    boatGroup.add(halo);

    // 2. 3D Philosopher Character Model standing on the prow deck
    const scholarGroup = new THREE.Group();
    scholarGroup.position.set(0, 0.65, 0.55);
    boatGroup.add(scholarGroup);

    const skinMat = mat('#ffe0bd');
    const robeMat = mat(phil.hullColor);
    const hairMat = mat(index % 2 === 0 ? '#3e2723' : '#e0e0e0');

    // Body / Robe
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.75, 10), robeMat);
    body.position.y = 0.38;
    body.castShadow = true;
    scholarGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), skinMat);
    head.position.y = 0.88;
    head.castShadow = true;
    scholarGroup.add(head);

    // Hair / Headdress
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), hairMat);
    hair.position.set(0, 0.91, -0.02);
    scholarGroup.add(hair);

    // Hand holding parchment / book
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), robeMat);
    armR.position.set(0.18, 0.45, 0.12);
    armR.rotation.x = Math.PI / 4;
    scholarGroup.add(armR);

    const book = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), mat('#fff8e1'));
    book.position.set(0.20, 0.48, 0.24);
    scholarGroup.add(book);

    // 3. Water wake ripple behind boat
    const wake = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.9, 16, 1, Math.PI * 0.15, Math.PI * 0.7), waveMat);
    wake.rotation.x = -Math.PI / 2;
    wake.position.set(0, 0.05, -1.5);
    boatGroup.add(wake);

    // Visible Name Tag floating above the boat
    const tagButton = document.createElement('button');
    tagButton.className = 'philosopher-boat-tag';
    tagButton.setAttribute('aria-label', `點擊與哲學家 ${phil.name} 對話`);
    tagButton.innerHTML = `<span class="boat-icon">⛵</span><span class="boat-name">${phil.name.split(' ')[0]}</span>`;
    tagButton.addEventListener('click', e => {
      e.stopPropagation();
      openPhilosopherDialog(phil.id);
    });
    const labelObj = new CSS2DObject(tagButton);
    labelObj.position.set(0, 5.2, 0);
    boatGroup.add(labelObj);


    // Make all meshes inside boat pickable and point to this philosopher
    boatGroup.traverse(child => {
      if (child.isMesh) {
        child.userData.isPhilosopher = true;
        child.userData.philosopherId = phil.id;
        pickables.push(child);
      }
    });

    boats.push({
      group: boatGroup,
      halo,
      wake,
      data: phil,
      route: phil.route
    });
  });

  // Dialog System for Philosopher Quotes
  let dialog = document.getElementById('philosopher-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'philosopher-dialog';
    dialog.className = 'philosopher-dialog';
    document.body.appendChild(dialog);
  }

  function openPhilosopherDialog(philosopherId) {
    const phil = PHILOSOPHERS_DATA.find(p => p.id === philosopherId);
    if (!phil) return;

    const collected = loadCollectedQuotes();
    const isCollected = collected.includes(phil.id);

    dialog.innerHTML = `
      <button class="dialog-close icon-button" aria-label="關閉對話框">✕</button>
      <div class="phil-header">
        <span class="phil-badge">⛵ 海上智慧偶遇 · 思想之舟</span>
        <h2>${phil.name}</h2>
        <span class="phil-era">${phil.era} ｜ ${phil.title}</span>
      </div>

      <div class="phil-quote-box">
        <div class="phil-quote-mark">“</div>
        <p class="phil-quote-text">${phil.quote}</p>
        <div class="phil-insight">
          <b>心靈小語：</b>${phil.insight}
        </div>
      </div>

      <div class="phil-psychology-link">
        <span class="link-tag">🧠 心理學思考</span>
        <p>${phil.psychologyConnection}</p>
      </div>

      <div class="phil-actions">
        <button type="button" class="primary" id="btn-collect-quote" ${isCollected ? 'disabled' : ''}>
          ${isCollected ? '✓ 已收集至名言錄' : '📜 收集至我的名言錄'}
        </button>
        <button type="button" id="btn-quote-to-notes">📝 引用至我的隨堂筆記</button>
        ${phil.relatedCourseId ? `<button type="button" class="phil-course-jump" id="btn-goto-course">⚓ 航向關聯島嶼：${phil.relatedCourseName || '前往課程'} ↗</button>` : ''}
      </div>
    `;

    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('#btn-goto-course')?.addEventListener('click', () => {
      dialog.close();
      onSelectCourse?.(phil.relatedCourseId);
    });

    dialog.querySelector('#btn-collect-quote')?.addEventListener('click', e => {
      saveCollectedQuote(phil.id);
      e.target.disabled = true;
      e.target.textContent = '✓ 已收集至名言錄';
      toast?.(`✨ 恭喜！已成功收集【${phil.name.split(' ')[0]}】的傳世智慧名言！`);
    });

    dialog.querySelector('#btn-quote-to-notes')?.addEventListener('click', () => {
      dialog.close();
      onOpenQuote?.(phil);
    });

    dialog.showModal();
  }

  let timeElapsed = 0;
  function update(dt) {
    timeElapsed += dt;

    for (const b of boats) {
      const { radiusX, radiusZ, speed, phase, height } = b.route;
      const angle = timeElapsed * speed + phase;

      const posX = Math.cos(angle) * radiusX;
      const posZ = Math.sin(angle) * radiusZ;
      const posY = height + Math.sin(timeElapsed * 1.8 + phase) * 0.08;

      // Gentle natural sea roll
      const roll = Math.sin(timeElapsed * 1.4 + phase) * 0.05;
      const pitch = Math.cos(timeElapsed * 1.6 + phase) * 0.04;

      // Heading direction (tangent of ellipse)
      const tangentX = -Math.sin(angle) * radiusX;
      const tangentZ = Math.cos(angle) * radiusZ;
      const heading = Math.atan2(tangentX, tangentZ);

      b.group.position.set(posX, posY, posZ);
      b.group.rotation.set(pitch, heading, roll);

      // Rotate wisdom halo
      b.halo.rotation.z = timeElapsed * 0.8;

      // Animate wake scale
      const wakeScale = 0.9 + Math.sin(timeElapsed * 3 + phase) * 0.12;
      b.wake.scale.set(wakeScale, wakeScale, 1);
    }
  }

  return {
    boats,
    pickables,
    update,
    openDialog: openPhilosopherDialog
  };
}
