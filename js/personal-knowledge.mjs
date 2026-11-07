// =========================================================================
// 個人心智島 · 學習知識寶庫 (Personal Mind Sanctuary & Knowledge Repository)
// 支援個人隨堂筆記即時儲存、核心心理學概念卡、精通度統計、Markdown/JSON 知識手冊匯出
// =========================================================================

import { PHILOSOPHERS_DATA, loadCollectedQuotes } from './philosopher-boats.mjs';

const STORAGE_KEY = 'psychology_island_personal_knowledge_v1';

export const CORE_PSYCHOLOGY_CONCEPTS = [
  {
    id: 'weber-fechner',
    courseId: 'island-01',
    courseName: '01 感知覺醒島',
    title: '韋伯-費希納定律 (Weber-Fechner Law)',
    tag: '知覺門檻',
    summary: '刺激的最小可覺差（JND）與原刺激強度的比值為常數（ΔI / I = k）。心理量與物理刺激強度的對數成正比。',
    application: '教學中微小改變難以引起注意，需依據原有基準提供足夠反差與結構化提示。'
  },
  {
    id: 'necker-cube',
    courseId: 'island-01',
    courseName: '01 感知覺醒島',
    title: '奈克方塊與雙穩態知覺 (Necker Cube)',
    tag: '知覺恆常性',
    summary: '大腦面對缺乏深度線索的二維圖形時，會主動交替構建兩種合理的三維三維心智表徵，展現主動建構特質。',
    application: '提醒學習者同一教學情境有多元視角，避免陷入單一先入為主的思維定勢。'
  },
  {
    id: 'ebbinghaus-curve',
    courseId: 'island-02',
    courseName: '02 記憶之宮島',
    title: '艾賓浩斯遺忘曲線與間隔效應 (Spacing Effect)',
    tag: '記憶鞏固',
    summary: '遺忘在學習剛結束時最為急劇，隨時間推進逐漸平緩。透過分散間隔複習能大幅重塑遺忘曲線並穩固長期記憶。',
    application: '將密集式死記轉變為間隔重複（Spaced Repetition），在黃金時間點安排自我測試。'
  },
  {
    id: 'skinner-operant',
    courseId: 'island-02',
    courseName: '02 記憶之宮島',
    title: '斯金納操作制約與強化排程 (Operant Conditioning)',
    tag: '行為塑造',
    summary: '有機體的自發行為透過後續「增強物（Reinforcer）」或「懲罰」改變發生頻率。變動比率增強最能維持長期行為動機。',
    application: '在學習平台中設計及時正向回饋與進度徽章，激發持續主動探索的內在樂趣。'
  },
  {
    id: 'kahneman-systems',
    courseId: 'island-03',
    courseName: '03 理性思維島',
    title: '康納曼雙系統思維（快思慢想 System 1 & 2）',
    tag: '認知決策',
    summary: '系統一：自動、直覺、快速但易受偏誤操弄；系統二：深思熟慮、耗費心力但具邏輯監控能力。',
    application: '複雜決策時學會「暫停直覺」，主動喚醒系統二進行批判檢驗與自我提問。'
  },
  {
    id: 'heuristics-biases',
    courseId: 'island-03',
    courseName: '03 理性思維島',
    title: '啟發式捷思與確認偏誤 (Heuristics & Biases)',
    tag: '思維除錯',
    summary: '人腦傾向依賴代表性捷思與可得性捷思簡化問題，且極易主動尋找支持自身假設的證據（Confirmation Bias）。',
    application: '建立「反證思考習慣」，在教學與研究中刻意尋找反例以提升客觀性。'
  },
  {
    id: 'maslow-pyramid',
    courseId: 'island-04',
    courseName: '04 動機與情緒島',
    title: '馬斯洛需求層次與自我實現 (Self-Actualization)',
    tag: '內在動力',
    summary: '人類動機從匱乏性需求（生理、安全、愛、自尊）層層遞進，最終追求個人潛能充分發揮的成長性自我實現。',
    application: '營造安全且具包容感的學習心理環境，才能有效激發探索未知與創造力的最高動機。'
  },
  {
    id: 'yerkes-dodson',
    courseId: 'island-04',
    courseName: '04 動機與情緒島',
    title: '耶克斯-多德森定律（倒 U 壓力曲線）',
    tag: '情緒激起',
    summary: '最佳學習與表現往往發生在中等程度的心理激起水平；過低則動力不足，過高則引發焦慮干擾認知工作記憶。',
    application: '根據任務難度調整挑戰水平，維持適度專注心流（Flow）而非高壓焦慮。'
  },
  {
    id: 'ocean-bigfive',
    courseId: 'island-05',
    courseName: '05 人格演繹島',
    title: '大五人格特質模型 (OCEAN Model)',
    tag: '特質心理學',
    summary: '人格結構可歸納為五大維度：開放性(O)、盡責性(C)、外向性(E)、親和性(A)、神經質(N)。',
    application: '理解個人性格光譜非優劣之分，因材施教並在團隊協作中發揮互補價值。'
  },
  {
    id: 'jung-persona-shadow',
    courseId: 'island-05',
    courseName: '05 人格演繹島',
    title: '榮格人格面具與陰影 (Persona & Shadow)',
    tag: '深層心理學',
    summary: '人格面具是因應社會期待建立的對外角色；陰影則是被壓抑的潛意識特質。個體化歷程需整合陰影達成完整自性。',
    application: '接納自我內在的不完美，在學術與生活角色中維持誠實一致的自我認同。'
  },
  {
    id: 'asch-conformity',
    courseId: 'island-06',
    courseName: '06 社會共振島',
    title: '阿許從眾實驗與群體壓力 (Asch Conformity)',
    tag: '社會影響',
    summary: '即便客觀事實明確，在群體一致壓迫下，仍有約 75% 的受試者至少出現一次妥協盲從的從眾行為。',
    application: '只要環境中存在至少一個「少數異見者」，盲從率就會暴跌 80%，印證獨立發聲的重要性。'
  },
  {
    id: 'bystander-effect',
    courseId: 'island-06',
    courseName: '06 社會共振島',
    title: '旁觀者效應與責任分散 (Bystander Effect)',
    tag: '利他行為',
    summary: '在緊急事件中，在場旁觀者人數越多，單一個人施予援手的機率越低，因責任被無形稀釋。',
    application: '需要協作或尋求協助時，具體指定明確對象（如「穿藍衣服的同學請幫忙」），消除模糊責任。'
  }
];

export function loadKnowledgeNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultNotes();
    return JSON.parse(raw);
  } catch {
    return getDefaultNotes();
  }
}

export function saveKnowledgeNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (err) {
    console.error('儲存知識庫筆記失敗:', err);
    return false;
  }
}

function getDefaultNotes() {
  return {
    updatedAt: new Date().toISOString(),
    notes: {
      center: '中央衛城是整個心理學知識結構的後設認知中樞，統整各領域的核心定律。',
      'island-01': '',
      'island-02': '',
      'island-03': '',
      'island-04': '',
      'island-05': '',
      'island-06': '',
      general: '跟隨張春興教授漫遊群島，探索感知、記憶、理性、動機、人格與社會的多維心靈世界。'
    }
  };
}

export function exportNotesToMarkdown(data, state, notesData) {
  const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  const userName = state.name || '心靈群島探險家';
  const readCount = data.courses.filter(c => state.courses?.[c.id]?.read).length;

  let md = `# 🌟 我的普通心理學探索筆記與知識手冊\n\n`;
  md += `> **學習者**：${userName}  \n`;
  md += `> **記錄日期**：${dateStr}  \n`;
  md += `> **學習進度**：${readCount} / ${data.courses.length} 課程島已讀  \n`;
  md += `> **群島導師**：張春興 教授（Chun-Hsing Chang）  \n`;
  md += `> **致敬聲明**：島嶼建模參考黃泓諺老師所提供的教學夢幻島技能包與課程群島架構  \n\n`;

  md += `---\n\n## 🗺️ 個人綜合心智成長手記\n\n`;
  md += `${notesData.notes.general || '（尚無記錄綜合手記）'}\n\n`;

  md += `---\n\n## 📚 各島嶼隨堂深度筆記\n\n`;

  for (const c of data.courses) {
    const s = state.courses?.[c.id] || { read: false, score: 0 };
    const courseNote = notesData.notes[c.id];

    md += `### ${String(c.order).padStart(2, '0')}. ${c.name} (${c.group})\n\n`;
    md += `- **學習狀態**：${s.read ? '✓ 已讀' : '○ 尚未閱讀'} ｜ 測驗最高分：${s.score || 0} 分\n`;
    md += `- **核心學習目標**：${c.goal}\n\n`;

    if (courseNote && courseNote.trim()) {
      md += `#### 📝 我的隨堂筆記與生活觀察：\n\n${courseNote}\n\n`;
    } else {
      md += `*（此課尚無自訂筆記，可隨時至個人心智島編輯補充）*\n\n`;
    }

    // 附上該課程的經典知識卡
    const relatedCards = CORE_PSYCHOLOGY_CONCEPTS.filter(k => k.courseId === c.id);
    if (relatedCards.length) {
      md += `#### 💡 核心理論摘記：\n\n`;
      for (const card of relatedCards) {
        md += `> **${card.title}**【${card.tag}】  \n> ${card.summary}  \n> *實踐啟發：${card.application}*  \n\n`;
      }
    }
    md += `---\n\n`;
  }

  // 附上收集的海上哲學家名言錄
  const collectedQuoteIds = loadCollectedQuotes();
  if (collectedQuoteIds.length) {
    md += `## ⛵ 海上哲學家智慧名言錄 (已收集 ${collectedQuoteIds.length} / ${PHILOSOPHERS_DATA.length} 位思想大師)\n\n`;
    for (const qId of collectedQuoteIds) {
      const p = PHILOSOPHERS_DATA.find(x => x.id === qId);
      if (p) {
        md += `### 💡 ${p.name} (${p.era})\n`;
        md += `> **「${p.quote}」**  \n`;
        md += `> *心靈小語：${p.insight}*  \n`;
        md += `> *心理學啟發：${p.psychologyConnection}*  \n\n`;
      }
    }
    md += `---\n\n`;
  }

  md += `## 🏛️ 心靈總結與後設認知\n\n`;
  md += `${notesData.notes.center || '（尚無記錄）'}\n\n`;
  md += `*(由「心靈奧秘：普通心理學探索群島」個人心智島自動匯出生成)*\n`;

  return md;
}

export function setupPersonalKnowledge(options = {}) {
  const { data, getState, onTeleport, toast } = options;

  let dialog = document.getElementById('personal-knowledge-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'personal-knowledge-dialog';
    dialog.className = 'personal-dialog';
    document.body.appendChild(dialog);
  }

  let activeTab = 'notes';
  let activeCourseId = 'island-01';
  let notesData = loadKnowledgeNotes();
  let saveTimer = null;

  function render() {
    const state = getState();
    const readCount = data.courses.filter(c => state.courses?.[c.id]?.read).length;
    const avgScore = Math.round(data.courses.reduce((acc, c) => acc + (state.courses?.[c.id]?.score || 0), 0) / data.courses.length);
    const totalWords = Object.values(notesData.notes).reduce((acc, t) => acc + (t ? t.length : 0), 0);
    const collectedQuoteIds = loadCollectedQuotes();

    dialog.innerHTML = `
      <button class="dialog-close icon-button" aria-label="關閉個人知識庫">✕</button>
      <div class="personal-header">
        <span class="personal-badge">🌟 PERSONAL MIND SANCTUARY</span>
        <h2>個人心智島 · 我的學習知識寶庫</h2>
        <p class="personal-sub">在此整理你的自訂學習筆記、回顧經典心理學概念卡與海上哲學家名言，並一鍵匯出完整知識手冊。</p>
      </div>

      <div class="personal-stats-grid">
        <div class="stat-card">
          <span class="stat-num">${readCount} / ${data.courses.length}</span>
          <span class="stat-label">已探索島嶼</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${avgScore} 分</span>
          <span class="stat-label">測驗平均成就</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${totalWords} 字</span>
          <span class="stat-label">累積筆記字數</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${collectedQuoteIds.length} / ${PHILOSOPHERS_DATA.length} 位</span>
          <span class="stat-label">哲學家智慧名言</span>
        </div>
      </div>

      <div class="tabs personal-tabs" role="tablist">
        <button class="${activeTab === 'notes' ? 'active' : ''}" data-ptab="notes">📝 我的學習筆記</button>
        <button class="${activeTab === 'cards' ? 'active' : ''}" data-ptab="cards">💡 核心知識卡庫</button>
        <button class="${activeTab === 'quotes' ? 'active' : ''}" data-ptab="quotes">⛵ 哲學名言錄 (${collectedQuoteIds.length}/${PHILOSOPHERS_DATA.length})</button>
        <button class="${activeTab === 'mastery' ? 'active' : ''}" data-ptab="mastery">📊 精通度總覽</button>
        <button class="${activeTab === 'export' ? 'active' : ''}" data-ptab="export">💾 知識庫匯出備份</button>
      </div>

      <div class="personal-tab-body">
        ${renderTabContent(state)}
      </div>
    `;

    bindEvents();
  }

  function renderTabContent(state) {
    if (activeTab === 'notes') {
      const courseOptions = [
        { id: 'general', name: '🗺️ 個人綜合心智成長手記' },
        ...data.courses.map(c => ({ id: c.id, name: `${String(c.order).padStart(2, '0')} ${c.name}` })),
        { id: 'center', name: '🏛️ 中央雅典衛城 · 後設認知筆記' }
      ];

      const currentText = notesData.notes[activeCourseId] || '';

      const promptsForCourse = {
        'island-01': '引導思考：你在日常生活中有遇過哪些「先入為主」的視錯覺或知覺恆常性經驗？',
        'island-02': '引導思考：如何運用艾賓浩斯遺忘曲線與間隔效應，優化你近期的學習或工作排程？',
        'island-03': '引導思考：在做重要決策時，你曾觀察到自己的系統一（直覺）與系統二（深思）如何角力？',
        'island-04': '引導思考：對照馬斯洛需求金字塔，你目前最渴望滿足的動機位在哪個層次？',
        'island-05': '引導思考：大五人格特質（OCEAN）中，你認為自己在哪個維度特別鮮明？這對人際互動有何影響？',
        'island-06': '引導思考：在群體會議或社交場合中，你曾察覺過從眾壓力或責任分散現象嗎？你如何自處？',
        center: '引導思考：回顧整個心理學群島，哪些理論徹底顛覆了你對心智運作的原有認知？',
        general: '引導思考：記錄你的總體心理學學習心得、個人領悟與未來應用方向。'
      };

      return `
        <div class="notes-workspace">
          <div class="notes-selector-row">
            <label for="note-course-select"><b>選擇筆記主題：</b></label>
            <select id="note-course-select" class="personal-select">
              ${courseOptions.map(opt => `<option value="${opt.id}" ${opt.id === activeCourseId ? 'selected' : ''}>${opt.name}</option>`).join('')}
            </select>
            <span class="note-save-status" id="note-save-status">✓ 已自動儲存至本機</span>
          </div>

          <div class="note-guide-box">
            <span class="guide-spark">💡</span>
            <p>${promptsForCourse[activeCourseId] || '寫下你的心得、生活觀察或疑難問題，文字將自動保存在瀏覽器。'}</p>
          </div>

          <div class="note-editor-wrapper">
            <textarea id="personal-note-editor" class="personal-textarea" placeholder="在此輸入筆記與心得... (支援 Markdown 標題、清單與重點)">${escapeHtml(currentText)}</textarea>
            <div class="note-editor-footer">
              <span id="note-char-count">字數：${currentText.length} 字</span>
              <div class="note-actions">
                <button type="button" class="btn-sm" id="btn-copy-note">📋 複製筆記</button>
                <button type="button" class="btn-sm" id="btn-clear-note">清空本篇</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (activeTab === 'cards') {
      return `
        <div class="cards-workspace">
          <div class="cards-filter-bar">
            <span>📚 探索 12 條心理學不可不知的經典理論與實踐啟示：</span>
          </div>
          <div class="knowledge-cards-grid">
            ${CORE_PSYCHOLOGY_CONCEPTS.map(card => `
              <div class="concept-card">
                <div class="card-top">
                  <span class="card-course">${card.courseName}</span>
                  <span class="card-tag">${card.tag}</span>
                </div>
                <h4>${card.title}</h4>
                <p class="card-summary">${card.summary}</p>
                <div class="card-app">
                  <b>實踐啟發：</b>${card.application}
                </div>
                <button type="button" class="btn-sm quote-btn" data-quote-id="${card.id}">📌 引用至我的筆記</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (activeTab === 'quotes') {
      const collected = loadCollectedQuotes();
      return `
        <div class="quotes-workspace">
          <div class="quotes-intro-banner">
            <span class="spark-icon">⛵</span>
            <div>
              <h4>海上哲學家智慧名言錄（已收集 ${collected.length} / ${PHILOSOPHERS_DATA.length} 位）</h4>
              <p>在群島周圍海面上，7 位思想先驅正乘著智慧之舟徐徐巡弋。點選海面上的小船即可認識他們，並將傳世名言收錄於此。</p>
            </div>
          </div>
          <div class="quotes-grid">
            ${PHILOSOPHERS_DATA.map(phil => {
              const isCol = collected.includes(phil.id);
              return `
                <div class="quote-card ${isCol ? 'quote-collected' : 'quote-locked'}">
                  <div class="quote-card-header">
                    <div>
                      <span class="quote-card-name">${phil.name}</span>
                      <small class="quote-card-era">${phil.era}</small>
                    </div>
                    <span class="quote-status-pill ${isCol ? 'pill-collected' : 'pill-locked'}">
                      ${isCol ? '✓ 已收集' : '○ 海上巡航中'}
                    </span>
                  </div>
                  <div class="quote-card-body">
                    <p class="quote-saying">「${phil.quote}」</p>
                    <div class="quote-insight-box">
                      <b>心靈小語：</b>${phil.insight}
                    </div>
                    <div class="quote-psych-box">
                      <b>心理學對話：</b>${phil.psychologyConnection}
                    </div>
                  </div>
                  <div class="quote-card-footer">
                    <button type="button" class="btn-sm quote-to-note-btn" data-quote-phil="${phil.id}">
                      📌 引用此名言至隨堂筆記
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (activeTab === 'mastery') {
      return `
        <div class="mastery-workspace">
          <h3>心理學六大維度學習精通度</h3>
          <div class="mastery-list">
            ${data.courses.map(c => {
              const s = state.courses?.[c.id] || { read: false, score: 0 };
              const hasNote = !!(notesData.notes[c.id] && notesData.notes[c.id].trim());
              return `
                <div class="mastery-row">
                  <div class="mastery-info">
                    <span class="mastery-name">${String(c.order).padStart(2, '0')}. ${c.name}</span>
                    <span class="mastery-badges">
                      <span class="badge ${s.read ? 'badge-good' : 'badge-idle'}">${s.read ? '✓ 教材已讀' : '○ 尚未閱讀'}</span>
                      <span class="badge ${s.score >= 75 ? 'badge-good' : 'badge-idle'}">測驗：${s.score || 0} 分</span>
                      <span class="badge ${hasNote ? 'badge-good' : 'badge-idle'}">${hasNote ? '📝 已記錄筆記' : '○ 尚未寫筆記'}</span>
                    </span>
                  </div>
                  <div class="mastery-bar-outer">
                    <div class="mastery-bar-inner" style="width: ${s.read ? Math.max(30, s.score) : 10}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (activeTab === 'export') {
      return `
        <div class="export-workspace">
          <div class="export-banner">
            <h3>💾 備份、匯出或攜帶你的心理學學習資產</h3>
            <p>你的筆記與概念只存於本機瀏覽器，透過匯出功能，你可將知識手冊無縫匯入 Notion、Obsidian 或其他筆記軟體。</p>
          </div>

          <div class="export-grid">
            <div class="export-box">
              <h4>📄 匯出 Markdown 知識手冊</h4>
              <p class="small">產生完整的《我的普通心理學探索筆記與知識手冊.md》，包含章節、心得、核心概念卡與測驗成就。</p>
              <button type="button" class="primary" id="btn-export-markdown">下載 Markdown 筆記手冊 (.md)</button>
            </div>

            <div class="export-box">
              <h4>📦 匯出 JSON 結構備份</h4>
              <p class="small">將所有自訂筆記匯出為 JSON 檔案，方便在其他裝置隨時還原。</p>
              <button type="button" id="btn-export-json">匯出 JSON 備份檔</button>
            </div>

            <div class="export-box">
              <h4>📥 匯入 JSON 筆記備份</h4>
              <p class="small">從電腦選取先前匯出的 JSON 檔案還原筆記。</p>
              <button type="button" id="btn-import-json">選取檔案匯入</button>
              <input type="file" id="input-knowledge-json" accept=".json,application/json" hidden>
            </div>

            <div class="export-box">
              <h4>🏝️ 飛往個人心智島</h4>
              <p class="small">直接將 3D 操作人物傳送至美麗的個人心智島研習亭。</p>
              <button type="button" id="btn-teleport-personal">傳送至個人島 ↗</button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function bindEvents() {
    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());

    dialog.querySelectorAll('[data-ptab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.ptab;
        render();
      });
    });

    if (activeTab === 'notes') {
      const select = dialog.querySelector('#note-course-select');
      const textarea = dialog.querySelector('#personal-note-editor');
      const countLabel = dialog.querySelector('#note-char-count');
      const statusLabel = dialog.querySelector('#note-save-status');

      select?.addEventListener('change', () => {
        activeCourseId = select.value;
        render();
      });

      textarea?.addEventListener('input', () => {
        const text = textarea.value;
        notesData.notes[activeCourseId] = text;
        notesData.updatedAt = new Date().toISOString();
        countLabel.textContent = `字數：${text.length} 字`;
        statusLabel.textContent = '● 正在儲存...';

        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          saveKnowledgeNotes(notesData);
          statusLabel.textContent = '✓ 已自動儲存至本機';
        }, 350);
      });

      dialog.querySelector('#btn-copy-note')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(notesData.notes[activeCourseId] || '');
          toast?.('筆記已成功複製至剪貼簿！');
        } catch {
          toast?.('複製失敗，請手動選取文字複製。');
        }
      });

      dialog.querySelector('#btn-clear-note')?.addEventListener('click', () => {
        if (confirm('確定要清空本篇主題的筆記嗎？')) {
          notesData.notes[activeCourseId] = '';
          saveKnowledgeNotes(notesData);
          render();
        }
      });
    }

    if (activeTab === 'cards') {
      dialog.querySelectorAll('.quote-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cardId = btn.dataset.quoteId;
          const card = CORE_PSYCHOLOGY_CONCEPTS.find(c => c.id === cardId);
          if (!card) return;

          activeTab = 'notes';
          activeCourseId = card.courseId;
          const quoteText = `\n\n> 💡 **引用【${card.title}】**\n> ${card.summary}\n> *應用思考：*\n`;
          notesData.notes[activeCourseId] = (notesData.notes[activeCourseId] || '') + quoteText;
          saveKnowledgeNotes(notesData);
          toast?.(`已將【${card.title}】引用至該課筆記！`);
          render();
        });
      });
    }

    if (activeTab === 'quotes') {
      dialog.querySelectorAll('.quote-to-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const philId = btn.dataset.quotePhil;
          const phil = PHILOSOPHERS_DATA.find(p => p.id === philId);
          if (!phil) return;

          activeTab = 'notes';
          activeCourseId = phil.relatedCourseId || 'general';
          const quoteText = `\n\n> ⛵ **【${phil.name}】（${phil.era}）名言摘錄**\n> 「${phil.quote}」\n> *哲人小語：* ${phil.insight}\n> *心理學反思：*\n`;
          notesData.notes[activeCourseId] = (notesData.notes[activeCourseId] || '') + quoteText;
          saveKnowledgeNotes(notesData);
          toast?.(`已將【${phil.name}】名言引用至筆記！`);
          render();
        });
      });
    }

    if (activeTab === 'export') {
      dialog.querySelector('#btn-export-markdown')?.addEventListener('click', () => {
        const state = getState();
        const md = exportNotesToMarkdown(data, state, notesData);
        downloadFile('我的普通心理學探索筆記與知識手冊.md', md, 'text/markdown;charset=utf-8');
        toast?.('已下載 Markdown 筆記手冊！');
      });

      dialog.querySelector('#btn-export-json')?.addEventListener('click', () => {
        const json = JSON.stringify(notesData, null, 2);
        downloadFile('心理學探索筆記備份.json', json, 'application/json');
        toast?.('已下載 JSON 筆記備份！');
      });

      const fileInput = dialog.querySelector('#input-knowledge-json');
      dialog.querySelector('#btn-import-json')?.addEventListener('click', () => fileInput?.click());

      fileInput?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.notes === 'object') {
            notesData.notes = { ...notesData.notes, ...parsed.notes };
            saveKnowledgeNotes(notesData);
            toast?.('筆記備份匯入成功！已合併現有內容。');
            render();
          } else {
            throw new Error('格式不正確');
          }
        } catch {
          toast?.('匯入失敗：請選取由本站匯出的有效 JSON 備份檔。');
        } finally {
          e.target.value = '';
        }
      });

      dialog.querySelector('#btn-teleport-personal')?.addEventListener('click', () => {
        dialog.close();
        onTeleport?.('island-personal');
      });
    }
  }

  function open(courseId = null) {
    notesData = loadKnowledgeNotes();
    if (courseId) {
      activeTab = 'notes';
      activeCourseId = courseId;
    }
    render();
    dialog.showModal();
  }

  return {
    open,
    close: () => dialog.close(),
    getNotes: () => notesData
  };
}

function downloadFile(name, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}
