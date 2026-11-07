import { createAnimeCharacter } from './anime-character.mjs';
import * as THREE from 'three';
import { advanceWalker, pointAt } from './navigation.mjs';
import { CSS2DObject } from '../vendor/CSS2DRenderer.js';

// =========================================================================
// 島內常民學者與漫步助教群 (Archipelago Ambient Scholars & Strollers)
// 漫步於各島的常民學者。無點擊時自然漫步沉思、不顯示人名干擾畫面；
// 點擊時觸發即時心靈反饋效果（風鈴音效、跳躍揮手、腳底光環與頭頂氣泡對話）。
// =========================================================================
export const ARCHIPELAGO_STROLLERS = [
  // 中央衛城 (Center Acropolis)
  {
    id: 'stroller-c1',
    name: '艾瑪 (Emma)',
    role: '認知實驗室助理',
    island: 'center',
    comment: '正在記錄馮特反應時鐘的微秒級數據，專注與實證是認知研究的基石！',
    radiusFactor: 0.50,
    speed: 0.46,
    dir: 1,
    phase: 0.3
  },
  {
    id: 'stroller-c2',
    name: '李昂 (Leon)',
    role: '教學研討助教',
    island: 'center',
    comment: '張春興教授常說：教育心理學的核心，是讓每個獨特的心靈找到自己的節奏。',
    radiusFactor: 0.68,
    speed: 0.42,
    dir: -1,
    phase: 1.7
  },
  {
    id: 'stroller-c3',
    name: '蘇菲 (Sophie)',
    role: '心智模型研究員',
    island: 'center',
    comment: '眺望環狀群島，心理學正如一座溝通理智、情感與經驗的宏偉橋樑！',
    radiusFactor: 0.82,
    speed: 0.44,
    dir: 1,
    phase: 3.1
  },

  // 個人心智島 (Personal Mind Island)
  {
    id: 'stroller-p1',
    name: '阿倫 (Alan)',
    role: '心智寶庫館長',
    island: 'island-personal',
    comment: '知識寶庫將你的名言收藏與學習筆記緊密結合，隨時點擊回顧星空筆記！',
    radiusFactor: 0.54,
    speed: 0.45,
    dir: 1,
    phase: 0.8
  },
  {
    id: 'stroller-p2',
    name: '小葵 (Aoi)',
    role: '哲思探險家',
    island: 'island-personal',
    comment: '海面上漂流著 7 艘哲學家智慧帆船，靠近並收集她們的名言能啟迪心智！',
    radiusFactor: 0.76,
    speed: 0.42,
    dir: -1,
    phase: 2.4
  },

  // 第一課：感知覺醒島
  {
    id: 'stroller-01a',
    name: '小霖 (Lin)',
    role: '視網膜感光研究員',
    island: 'island-01',
    comment: '視錐細胞辨識繽紛光譜，視桿細胞守護微光世界，感覺器官的精密讓人驚嘆！',
    radiusFactor: 0.58,
    speed: 0.45,
    dir: 1,
    phase: 0.5
  },
  {
    id: 'stroller-01b',
    name: '奧利維亞 (Olivia)',
    role: '艾姆斯空間設計師',
    island: 'island-01',
    comment: '大腦主動依據線索建構深度知覺，錯覺不是失誤，而是認知規律的精彩證明！',
    radiusFactor: 0.78,
    speed: 0.43,
    dir: -1,
    phase: 2.1
  },

  // 第二課：記憶之宮島
  {
    id: 'stroller-02a',
    name: '馬可 (Marco)',
    role: '記憶宮殿建造者',
    island: 'island-02',
    comment: '把抽象概念化作生動圖像安放在殿堂迴廊，位置記憶法讓回憶歷久彌新！',
    radiusFactor: 0.56,
    speed: 0.44,
    dir: 1,
    phase: 1.2
  },
  {
    id: 'stroller-02b',
    name: '克萊兒 (Claire)',
    role: '間隔複習指導員',
    island: 'island-02',
    comment: '艾賓豪斯曲線告訴我們：在黃金 24 小時內間隔複習，大腦神經元突觸會更加牢固！',
    radiusFactor: 0.76,
    speed: 0.42,
    dir: -1,
    phase: 3.5
  },

  // 第三課：理性思維島
  {
    id: 'stroller-03a',
    name: '大衛 (David)',
    role: '啟發式思考者',
    island: 'island-03',
    comment: '演算法保證精確但耗時，啟發式策略迅速直覺但可能產生偏誤，這正是心智的博弈！',
    radiusFactor: 0.58,
    speed: 0.47,
    dir: -1,
    phase: 0.9
  },
  {
    id: 'stroller-03b',
    name: '艾琳 (Elena)',
    role: '頓悟問題研究員',
    island: 'island-03',
    comment: '打破功能固著（Functional Fixedness），重新定義問題結構，靈感便在剎那頓悟！',
    radiusFactor: 0.80,
    speed: 0.43,
    dir: 1,
    phase: 2.8
  },

  // 第四課：動機與情緒島
  {
    id: 'stroller-04a',
    name: '盧卡 (Luca)',
    role: '需求金字塔探索者',
    island: 'island-04',
    comment: '當生理與安全得到保障，心靈便奔赴愛與歸屬感，最終抵達自我實現的頂峰！',
    radiusFactor: 0.58,
    speed: 0.45,
    dir: 1,
    phase: 1.4
  },
  {
    id: 'stroller-04b',
    name: '米雅 (Mia)',
    role: '臉部回饋研究員',
    island: 'island-04',
    comment: '微笑不僅是快樂的結果，牽動笑肌的臉部回饋，也能在生理上反向喚醒歡樂！',
    radiusFactor: 0.78,
    speed: 0.42,
    dir: -1,
    phase: 3.7
  },

  // 第五課：人格演繹島
  {
    id: 'stroller-05a',
    name: '山姆 (Sam)',
    role: 'OCEAN 大五特質分析師',
    island: 'island-05',
    comment: '開放、嚴謹、外向、宜人、神經質——大五特質構成每個人獨一無二的人格光譜！',
    radiusFactor: 0.56,
    speed: 0.46,
    dir: -1,
    phase: 0.7
  },
  {
    id: 'stroller-05b',
    name: '諾雅 (Noa)',
    role: '潛意識動力學分析師',
    island: 'island-05',
    comment: '意識只是浮出水面的冰山一角，水面下的潛意識悄然形塑著我們的選擇與生命故事！',
    radiusFactor: 0.78,
    speed: 0.44,
    dir: 1,
    phase: 2.6
  },

  // 第六課：社會共振島
  {
    id: 'stroller-06a',
    name: '泰勒 (Taylor)',
    role: '阿許範式觀察員',
    island: 'island-06',
    comment: '在從眾的壓力面前堅持獨立判斷需要勇氣，獨立思辨是公民社會最堅韌的基石！',
    radiusFactor: 0.58,
    speed: 0.45,
    dir: 1,
    phase: 1.1
  },
  {
    id: 'stroller-06b',
    name: '凱文 (Kevin)',
    role: '認知失調研究員',
    island: 'island-06',
    comment: '當言行與內心態度相左，心靈會透過調整認知來尋求內在平衡與和諧！',
    radiusFactor: 0.80,
    speed: 0.43,
    dir: -1,
    phase: 3.3
  }
];

// 輕巧心靈風鈴微音效（Web Audio API 即時合成）
let scholarAudioCtx = null;
function playScholarChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!scholarAudioCtx) scholarAudioCtx = new Ctx();
    if (scholarAudioCtx.state === 'suspended') scholarAudioCtx.resume();
    const now = scholarAudioCtx.currentTime;
    const osc = scholarAudioCtx.createOscillator();
    const gain = scholarAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(scholarAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) {
    // 忽略未互動前瀏覽器音訊限制
  }
}

export function createResidents(scene, network, people, { onResident, onHost, toast } = {}) {
  const residents = [], owners = [], strollers = [], labels = [], pickables = [];

  // ==============================================================
  // 即時 3D 心靈對話氣泡（點擊人物時專屬浮現，非靜態呆板常駐名牌）
  // ==============================================================
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'scholar-thought-bubble';
  bubbleDiv.style.display = 'none';
  const bubbleObject = new CSS2DObject(bubbleDiv);
  bubbleObject.position.set(0, 2.35, 0);
  let bubbleTimer = null;

  function showThoughtBubble(stroller, s) {
    if (bubbleTimer) clearTimeout(bubbleTimer);

    if (bubbleObject.parent) {
      bubbleObject.parent.remove(bubbleObject);
    }

    bubbleDiv.innerHTML = `
      <div class="bubble-header">
        <span class="bubble-icon">💡</span>
        <strong class="bubble-name">${s.name}</strong>
        <span class="bubble-role">${s.role}</span>
      </div>
      <div class="bubble-text">${s.comment}</div>
    `;
    bubbleDiv.classList.remove('fade-out');
    bubbleDiv.style.display = 'block';

    stroller.g.add(bubbleObject);

    // 4.5 秒後淡出並收合
    bubbleTimer = setTimeout(() => {
      bubbleDiv.classList.add('fade-out');
      setTimeout(() => {
        bubbleDiv.style.display = 'none';
        if (bubbleObject.parent) bubbleObject.parent.remove(bubbleObject);
      }, 350);
    }, 4500);
  }

  function sayStroller(id) {
    const st = strollers.find(item => item.strollerId === id);
    if (!st) return;
    const s = st.data;

    // 1. 播放心靈風鈴微音效
    playScholarChime();

    // 2. 觸發歡欣跳躍、熱情揮手與光環爆發
    st.reactionTimer = 2.4;
    st.jumpPhase = 0;
    st.burstScale = 1.0;
    st.burstOpacity = 0.9;

    // 3. 浮現即時 3D 頭頂心靈對話氣泡（隨人物跳動同步飄揚）
    showThoughtBubble(st, s);

    // 4. 同步底部通知欄回饋
    const msg = `💬【${s.name}】（${s.role}）：${s.comment}`;
    if (toast) {
      toast(msg);
    } else {
      const t = document.querySelector('#toast');
      if (t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3800);
      }
    }
  }

  function labelFor(actor, text, kind, id, title, click) {
    const button = document.createElement('button');
    button.className = 'person-label ' + kind;
    const span = document.createElement('span');
    span.textContent = text;
    button.appendChild(span);
    button.title = title;
    button.setAttribute('aria-label', title);

    if (kind === 'island-host') {
      button.dataset.hostIsland = id;
    } else {
      button.dataset.resident = id;
    }

    button.addEventListener('click', e => {
      e.stopPropagation();
      click();
    });

    for (const ev of ['pointerenter', 'focus']) {
      button.addEventListener(ev, () => { actor.hover = true; });
    }
    for (const ev of ['pointerleave', 'blur']) {
      button.addEventListener(ev, () => { actor.hover = false; });
    }

    const object = new CSS2DObject(button);
    object.position.y = kind === 'island-host' ? 2.15 : 1.85;
    actor.g.add(object);
    labels.push({ object, button, actor, kind, islandId: id });
  }

  // 1. Curriculum Residents (14 課業導覽島民，沿 network.paths 穿梭環島與長橋)
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const { g, legs, arms } = createAnimeCharacter(i, false, person);
    g.name = person.id;
    g.scale.setScalar(1.62);
    scene.add(g);

    const peers = people.filter(p => p.island === person.island);
    const localIndex = peers.findIndex(p => p.id === person.id);
    const choices = network.paths.map((p, index) => ({ p, index })).filter(v => v.p.kind === 'walk' && v.p.island === person.island);
    const path = choices[localIndex % choices.length].index;
    const entry = network.paths[path];
    const walker = { path, distance: entry.length * ((localIndex + 0.5) / peers.length), direction: i % 2 ? 1 : -1 };
    const actor = { g, legs, arms, walker, person, speed: 0.72 + (i % 5) * 0.065, phase: i, visited: new Set([path]), hover: false };
    residents.push(actor);

    const sample = pointAt(entry, walker.distance);
    g.position.set(sample.point.x, sample.point.y, sample.point.z);
    g.rotation.y = sample.angle + (walker.direction < 0 ? Math.PI : 0);

    g.traverse(m => {
      if (m.isMesh) {
        m.userData.resident = person.id;
        pickables.push(m);
      }
    });

    labelFor(actor, person.name, 'island-resident', person.id, `${person.name}：${person.concept}，點擊閱讀關鍵概念`, () => onResident?.(person.id));
  }

  // 2. Island Hosts (8 座島嶼上的島主張春興教授與白狗)
  for (const [i, node] of network.nodes.entries()) {
    const { g, legs } = createAnimeCharacter(i, true);
    g.name = 'owner-' + node.id;
    g.scale.setScalar(1.75);
    scene.add(g);

    const actor = { g, node, legs, angle: i * 0.8 + 0.4, hover: false };
    g.position.set(node.x + Math.sin(actor.angle) * (node.walkRadius - 0.1), node.height ?? 0.49, node.z + Math.cos(actor.angle) * (node.walkRadius - 0.1));
    owners.push(actor);

    g.traverse(m => {
      if (m.isMesh) {
        m.userData.host = true;
        pickables.push(m);
      }
    });

    labelFor(actor, '張春興教授', 'island-host', node.id, '島主張春興教授：點擊詢問教學與網站功能', () => onHost?.());
  }

  // 3. Archipelago Ambient Walkers (17 位常民漫步助教與學者)
  // 依使用者指示：無點擊時「不需要出現人名」，自然走動生活、保持畫面清爽好看；
  // 具備實體點擊與光環互動效果。
  for (let i = 0; i < ARCHIPELAGO_STROLLERS.length; i++) {
    const s = ARCHIPELAGO_STROLLERS[i];
    const node = network.nodes.find(n => n.id === s.island);
    if (!node) continue;

    const { g, legs, arms } = createAnimeCharacter(i + 20, false, null);
    g.name = s.id;
    g.scale.setScalar(1.58);
    scene.add(g);

    // 腳下微光足跡環（走動時輕柔呼吸脈動）
    const footRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.34, 20),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    footRing.rotation.x = -Math.PI / 2;
    footRing.position.y = 0.03;
    g.add(footRing);

    // 點擊觸發的金色靈感光環擴散網
    const burstRing = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.45, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    burstRing.rotation.x = -Math.PI / 2;
    burstRing.position.y = 0.05;
    g.add(burstRing);

    // 靈敏碰撞判定圓柱體（確保手機與滑鼠點擊輕鬆命中）
    const hitBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 2.2, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 1.1;
    hitBox.userData.stroller = s.id;
    hitBox.userData.island = s.island;
    g.add(hitBox);
    pickables.push(hitBox);

    const actor = {
      g,
      legs,
      arms,
      data: s,
      node,
      angle: s.phase,
      strollerId: s.id,
      footRing,
      burstRing,
      reactionTimer: 0,
      jumpPhase: 0,
      burstScale: 1.0,
      burstOpacity: 0,
      cycleTime: i * 1.5,
      hover: false
    };
    strollers.push(actor);

    const r = (node.walkRadius || node.radius * 0.82) * s.radiusFactor;
    g.position.set(
      node.x + Math.sin(actor.angle) * r,
      node.height ?? 0.49,
      node.z + Math.cos(actor.angle) * r
    );
    g.rotation.y = actor.angle + (s.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

    g.traverse(m => {
      if (m.isMesh) {
        m.userData.stroller = s.id;
        m.userData.island = s.island;
        pickables.push(m);
      }
    });

    // 注意：不建立常駐 labelFor，徹底滿足「若無效人物應該只需要走動，不用出現人名」的要求！
  }

  let time = 0;
  return {
    labels,
    pickables,
    strollers,
    sayStroller,
    update(dt) {
      time += dt;

      // 1. Curriculum Residents Walk
      for (const r of residents) {
        if (r.hover) continue;
        const sample = advanceWalker(r.walker, network, dt * r.speed);
        r.visited.add(r.walker.path);
        r.g.position.set(sample.point.x, sample.point.y + Math.abs(Math.sin(time * r.speed * 7 + r.phase)) * 0.025, sample.point.z);
        r.g.rotation.y = sample.angle + (r.walker.direction < 0 ? Math.PI : 0);
        const swing = Math.sin(time * r.speed * 7 + r.phase) * 0.42;
        r.legs[0].rotation.x = swing;
        r.legs[1].rotation.x = -swing;
        r.arms[0].rotation.x = -swing * 0.75;
        r.arms[1].rotation.x = swing * 0.75;
      }

      // 2. Island Hosts Stroll
      for (const o of owners) {
        if (o.hover) continue;
        o.angle += dt * 0.19;
        const radius = o.node.walkRadius - 0.1;
        o.g.position.set(o.node.x + Math.sin(o.angle) * radius, o.node.height ?? 0.49, o.node.z + Math.cos(o.angle) * radius);
        o.g.rotation.y = o.angle + Math.PI / 2;
        const swing = Math.sin(time * 5) * 0.4;
        o.legs[0].rotation.x = swing;
        o.legs[1].rotation.x = -swing;
      }

      // 3. Archipelago Ambient Walkers (生活動態、走動、駐足沉思與點擊反應)
      for (const st of strollers) {
        if (st.hover) continue;

        st.cycleTime = (st.cycleTime || 0) + dt;
        const cycle = (st.cycleTime + st.data.phase * 5) % 18;
        const isPondering = cycle > 14 && cycle < 17.5; // 每 18 秒駐足沉思 3.5 秒

        const walkR = (st.node.walkRadius || st.node.radius * 0.82) * st.data.radiusFactor;

        // 若觸發點擊反應
        if (st.reactionTimer > 0) {
          st.reactionTimer -= dt;
          st.jumpPhase = (st.jumpPhase || 0) + dt * 6.5;

          const jumpBonus = Math.max(0, Math.sin(Math.min(Math.PI, st.jumpPhase))) * 0.42;
          const x = st.node.x + Math.sin(st.angle) * walkR;
          const z = st.node.z + Math.cos(st.angle) * walkR;
          st.g.position.set(x, (st.node.height ?? 0.49) + jumpBonus, z);

          // 熱情揮手與打招呼體態
          if (st.arms && st.arms.length >= 2) {
            st.arms[0].rotation.z = 2.2 + Math.sin(time * 16) * 0.35;
            st.arms[0].rotation.x = 0;
            st.arms[1].rotation.z = -0.3;
          }
          if (st.legs && st.legs.length >= 2) {
            st.legs[0].rotation.x = 0;
            st.legs[1].rotation.x = 0;
          }

          // 金色光環擴散
          if (st.burstRing) {
            st.burstScale = Math.min(3.2, (st.burstScale || 1) + dt * 3.5);
            st.burstOpacity = Math.max(0, (st.burstOpacity || 0.8) - dt * 0.55);
            st.burstRing.scale.set(st.burstScale, st.burstScale, st.burstScale);
            st.burstRing.material.opacity = st.burstOpacity;
          }
        } else if (isPondering) {
          // 駐足沉思：停步、手托下巴沈思、輕柔微調角度
          const x = st.node.x + Math.sin(st.angle) * walkR;
          const z = st.node.z + Math.cos(st.angle) * walkR;
          st.g.position.set(x, st.node.height ?? 0.49, z);

          if (st.legs && st.legs.length >= 2) {
            st.legs[0].rotation.x = 0;
            st.legs[1].rotation.x = 0;
          }
          if (st.arms && st.arms.length >= 2) {
            st.arms[0].rotation.x = -1.1;
            st.arms[0].rotation.z = 0.4;
            st.arms[1].rotation.x = 0.2;
          }
          if (st.footRing) {
            st.footRing.material.opacity = 0.15;
          }
          if (st.burstRing) {
            st.burstRing.material.opacity = 0;
          }
        } else {
          // 正常自然漫步
          st.angle += dt * st.data.speed * st.data.dir * 0.18;
          const x = st.node.x + Math.sin(st.angle) * walkR;
          const z = st.node.z + Math.cos(st.angle) * walkR;
          const y = (st.node.height ?? 0.49) + Math.abs(Math.sin(time * 3.5 + st.data.phase)) * 0.035;

          st.g.position.set(x, y, z);
          st.g.rotation.y = st.angle + (st.data.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

          const legSwing = Math.sin(time * 5.2 + st.data.phase) * 0.38;
          if (st.legs && st.legs.length >= 2) {
            st.legs[0].rotation.x = legSwing;
            st.legs[1].rotation.x = -legSwing;
          }
          if (st.arms && st.arms.length >= 2) {
            st.arms[0].rotation.x = -legSwing * 0.7;
            st.arms[1].rotation.x = legSwing * 0.7;
            st.arms[0].rotation.z = 0;
            st.arms[1].rotation.z = 0;
          }
          if (st.footRing) {
            st.footRing.scale.setScalar(0.9 + Math.sin(time * 6 + st.data.phase) * 0.2);
            st.footRing.material.opacity = 0.22 + Math.sin(time * 6 + st.data.phase) * 0.12;
          }
          if (st.burstRing) {
            st.burstRing.material.opacity = 0;
          }
        }
      }
    },
    pause() {
      for (const r of residents) {
        r.legs.forEach(l => l.rotation.x = 0);
        r.arms.forEach(l => l.rotation.x = 0);
        r.g.position.y = pointAt(network.paths[r.walker.path], r.walker.distance).point.y;
      }
      owners.forEach(o => o.legs.forEach(l => l.rotation.x = 0));
      strollers.forEach(s => {
        s.legs.forEach(l => l.rotation.x = 0);
        s.arms.forEach(l => l.rotation.x = 0);
      });
    },
    snapshot() {
      return residents.map(r => ({
        id: r.g.name,
        name: r.person.name,
        concept: r.person.concept,
        style: r.g.userData.characterStyle,
        position: r.g.position.toArray(),
        x: r.g.position.x,
        z: r.g.position.z,
        path: r.walker.path,
        kind: network.paths[r.walker.path].kind,
        visited: r.visited.size
      }));
    },
    hostSnapshot() {
      return owners.map(o => ({
        island: o.node.id,
        position: o.g.position.toArray()
      }));
    },
    strollerSnapshot() {
      return strollers.map(s => ({
        id: s.strollerId,
        island: s.data.island,
        name: s.data.name,
        role: s.data.role,
        position: s.g.position.toArray()
      }));
    }
  };
}
