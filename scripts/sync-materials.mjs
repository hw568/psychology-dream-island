import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, sep } from 'node:path';
import { loadMarkdownMaterials } from '../js/materials.mjs';
import { PHILOSOPHERS_DATA } from '../js/philosopher-boats.mjs';
import { CORE_PSYCHOLOGY_CONCEPTS } from '../js/personal-knowledge.mjs';
import { ISLAND_STORIES } from '../js/island-stories.mjs';

export const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

export async function syncMaterials(root = siteRoot) {
  const d = await loadMarkdownMaterials(p => {
    const target = resolve(root, p);
    if (!target.startsWith(resolve(root) + sep)) throw Error('教材來源不可超出site資料夾。');
    return readFile(target, 'utf8');
  });

  await writeFile(resolve(root, 'data/content.json'), JSON.stringify(d, null, 2) + '\n');

  // Build high-fidelity content.html with real photos and master stories
  const { site, center, speaker, editorialNote, courses, residents } = d;

  const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>完整文字教材手冊｜${esc(site.title)}</title>
  <meta name="description" content="${esc(site.title)}完整文字教材、學習重點、對照表、隨堂測驗詳解、哲學家名言錄與個人知識庫手冊。">
  <style>
    :root {
      --primary: #5c3d75;
      --primary-light: #f3ebf8;
      --accent: #d4a373;
      --text: #2c2538;
      --muted: #665c75;
      --bg: #fcf9f5;
      --surface: #ffffff;
      --border: #e8dfd8;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
      font-size: 17px;
      line-height: 1.8;
      color: var(--text);
      background: var(--bg);
      margin: 0;
      padding: 24px 20px 80px;
    }
    main {
      max-width: 920px;
      margin: 0 auto;
      background: var(--surface);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(44, 37, 56, 0.06);
      border: 1px solid var(--border);
    }
    @media (max-width: 650px) {
      body { padding: 12px 10px 60px; }
      main { padding: 22px 18px; }
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-light);
      color: var(--primary);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14.5px;
      transition: all 0.2s;
    }
    .back-btn:hover { background: var(--primary); color: #fff; }
    h1 {
      font-size: 32px;
      color: var(--primary);
      margin: 0 0 12px;
      line-height: 1.3;
    }
    .tagline {
      font-size: 16px;
      color: var(--muted);
      margin: 0 0 24px;
    }
    .toc-box {
      background: #f7f4fa;
      border: 1px solid #e5daf0;
      border-left: 5px solid var(--primary);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 40px;
    }
    .toc-box h3 { margin: 0 0 14px; font-size: 17px; color: var(--primary); }
    .toc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .toc-grid a {
      color: var(--text);
      text-decoration: none;
      font-size: 14.5px;
      display: block;
      padding: 8px 12px;
      border-radius: 8px;
      background: #fff;
      border: 1px solid #ebdff5;
      transition: all 0.2s;
    }
    .toc-grid a:hover {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary);
    }
    .island-card {
      margin-bottom: 48px;
      padding-top: 24px;
      border-top: 2px dashed var(--border);
    }
    .island-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--primary);
      background: var(--primary-light);
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .island-header h3 {
      font-size: 26px;
      color: var(--primary);
      margin: 0 0 8px;
    }
    .goal-box {
      background: #fdfaf5;
      border: 1px solid #ebd9c2;
      border-left: 4px solid var(--accent);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .topic-block {
      background: #faf8f6;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 18px;
      border: 1px solid var(--border);
    }
    .topic-block h4 {
      font-size: 18px;
      color: var(--primary);
      margin: 0 0 10px;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14.5px;
    }
    .comparison-table th, .comparison-table td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    .comparison-table th {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
    }
    .comparison-table tr:nth-child(even) { background: #faf8f5; }
    .prompt-box {
      background: #2b2538;
      color: #f7f4ea;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .quiz-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 14px;
    }
    .quiz-q { font-weight: 700; margin-bottom: 10px; }
    .quiz-opts { margin: 0 0 10px 20px; padding: 0; }
    .quiz-ans {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13.5px;
    }
    .resident-pill {
      display: inline-block;
      background: #ede7f6;
      color: #512da8;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      margin: 4px;
    }

    /* 哲學家真實肖像與名言卡 */
    .quote-box {
      display: flex;
      gap: 18px;
      align-items: flex-start;
      background: linear-gradient(135deg, #fffdfa 0%, #fef8ee 100%);
      border: 1px solid #ebd9c2;
      border-left: 5px solid var(--accent);
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    }
    @media (max-width: 600px) {
      .quote-box { flex-direction: column; align-items: center; text-align: center; }
    }
    .quote-avatar-wrap {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .quote-avatar-img {
      width: 76px;
      height: 76px;
      object-fit: cover;
      border-radius: 50%;
      border: 3px solid #d4a373;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      background: #f4ece4;
    }
    .quote-avatar-badge {
      font-size: 10px;
      font-weight: 700;
      color: #78350f;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
    }
    .quote-content { flex: 1; min-width: 0; }
    .quote-title { font-weight: 800; color: #5d4037; font-size: 17px; margin-bottom: 4px; }
    .quote-bio { font-size: 12.5px; color: var(--muted); margin-bottom: 8px; line-height: 1.4; }
    .quote-body { font-style: italic; color: #2b2014; margin: 6px 0 10px; font-weight: 600; font-size: 15.5px; }
    .quote-meta { font-size: 13px; color: var(--muted); line-height: 1.6; }

    /* 學術大師與經典歷史故事樣式 */
    .master-card-html {
      display: flex;
      gap: 22px;
      background: linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%);
      border: 1.5px solid #e8dfd5;
      border-radius: 18px;
      padding: 22px;
      margin: 18px 0 24px;
      box-shadow: 0 4px 16px rgba(44, 37, 56, 0.05);
    }
    @media (max-width: 600px) {
      .master-card-html { flex-direction: column; align-items: center; text-align: center; }
    }
    .master-portrait-wrap {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .master-portrait-img-html {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 50%;
      border: 3.5px solid #d4a373;
      box-shadow: 0 4px 14px rgba(107, 77, 132, 0.2);
      background: #fbf6f0;
    }
    .master-badge-html {
      font-size: 11px;
      font-weight: 700;
      color: #854d0e;
      background: #fef9c3;
      border: 1px solid #fde047;
      padding: 3px 10px;
      border-radius: 14px;
      white-space: nowrap;
    }
    .master-info-html { flex: 1; min-width: 0; }
    .master-name-html { font-size: 20px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
    .master-role-html { font-size: 13.5px; font-weight: 700; color: var(--primary); margin: 0 0 10px; }
    .master-quote-html {
      background: #fdfaf5;
      border-left: 3.5px solid #d4a373;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13.5px;
      font-style: italic;
      color: #4a3b32;
      margin-bottom: 10px;
      line-height: 1.5;
    }
    .master-bio-html { font-size: 13.5px; line-height: 1.65; color: var(--text); margin: 0; }

    /* 照片畫廊樣式 */
    .photo-grid-html {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 18px;
      margin: 18px 0 24px;
    }
    .photo-card-html {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
    }
    .photo-wrap-html {
      width: 100%;
      height: 190px;
      background: #1e1b29;
      position: relative;
      overflow: hidden;
    }
    .photo-img-html {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-meta-html {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .photo-title-html { font-size: 15px; font-weight: 800; color: var(--text); margin: 0; }
    .photo-caption-html { font-size: 12.5px; color: #8d4d24; font-weight: 600; margin: 0; line-height: 1.45; }
    .photo-details-html { font-size: 13px; color: #3b3549; line-height: 1.6; margin: 4px 0 0; }

    /* 傳奇故事樣式 */
    .classic-story-html {
      background: linear-gradient(135deg, #fdfbf7 0%, #f7f1e9 100%);
      border: 1px solid #ebd9c2;
      border-left: 5px solid #8d4d24;
      border-radius: 16px;
      padding: 20px 22px;
      margin: 20px 0 24px;
    }
    .classic-story-tag { font-size: 11px; font-weight: 800; color: #8d4d24; letter-spacing: 1px; display: block; margin-bottom: 4px; }
    .classic-story-title { font-size: 17.5px; font-weight: 800; color: #3e2723; margin: 0 0 10px; }
    .classic-story-body { font-size: 14.5px; line-height: 1.75; color: #2c2538; margin: 0; }

    footer {
      margin-top: 50px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 13.5px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <main>
    <div class="top-nav">
      <a class="back-btn" href="./">← 返回 3D 心理學群島主頁</a>
      <span>📖 完整文字教材與全域學習手冊</span>
    </div>

    <h1>${esc(site.title)}</h1>
    <p class="tagline">${esc(site.tagline)} ｜ 導師：${esc(speaker.name)}（${esc(speaker.alias)}）</p>

    <div class="toc-box">
      <h3>📑 全域教材章節目錄（點擊跳轉）</h3>
      <ul class="toc-grid">
        <li><a href="#sec-center">🏛️ 中央衛城：備課室導覽</a></li>
        <li><a href="#sec-personal">🌟 個人心智島：知識寶庫</a></li>
        <li><a href="#sec-philosophers">⛵ 7 艘海上哲學家之舟</a></li>
        ${courses.map(c => `<li><a href="#${c.id}">${String(c.order).padStart(2,'0')}. ${esc(c.name)}</a></li>`).join('')}
      </ul>
    </div>

    <!-- 1. 中央衛城 -->
    <section id="sec-center" class="island-card">
      <span class="island-badge">CENTRAL ACROPOLIS</span>
      <h2>中央衛城 · 張春興教授備課室與理性之源</h2>
      <p><b>導師介紹：</b>${esc(speaker.education)} ${esc(speaker.teaching)}</p>
      
      ${(()=>{
        const centerStory = ISLAND_STORIES['center'];
        if (!centerStory) return '';
        const cs = centerStory.scholar;
        return `
          <div class="master-card-html">
            <div class="master-portrait-wrap">
              <img src="${esc(cs.portrait)}" alt="${esc(cs.name)}" class="master-portrait-img-html">
              <span class="master-badge-html">${esc(cs.badge)}</span>
            </div>
            <div class="master-info-html">
              <h4 class="master-name-html">${esc(cs.name)}</h4>
              <p class="master-role-html">${esc(cs.role)} ｜ ${esc(cs.era)}</p>
              <div class="master-quote-html">“${esc(cs.quote)}”</div>
              <p class="master-bio-html">${esc(cs.bio)}</p>
            </div>
          </div>
          <div class="photo-grid-html">
            ${centerStory.photos.map(p => `
              <div class="photo-card-html">
                <div class="photo-wrap-html">
                  <img src="${esc(p.image)}" alt="${esc(p.title)}" class="photo-img-html" loading="lazy">
                </div>
                <div class="photo-meta-html">
                  <h5 class="photo-title-html">${esc(p.title)}</h5>
                  <p class="photo-caption-html">${esc(p.caption)}</p>
                  <p class="photo-details-html">${esc(p.details)}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      })()}

      ${(center.blocks || []).map(b => `
        <div class="topic-block">
          <h4>${esc(b.title)}</h4>
          <p>${esc(b.text)}</p>
        </div>
      `).join('')}
      <p class="goal-box">💡 <b>編撰原則</b>：${esc(editorialNote)}</p>
    </section>

    <!-- 2. 個人心智島 -->
    <section id="sec-personal" class="island-card">
      <span class="island-badge">PERSONAL MIND SANCTUARY</span>
      <h2>🌟 個人心智島 · 知識寶庫概念地圖</h2>
      <p>個人心智島是學習者沉澱思緒、撰寫各課筆記、收錄概念卡片與名言錄的專屬空間。以下為六大主題領域的核心心理學概念卡：</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px;">
        ${CORE_PSYCHOLOGY_CONCEPTS.map(card => `
          <div style="background: #fbf9fd; border: 1px solid #ebdff5; border-radius: 12px; padding: 14px;">
            <b style="color: var(--primary); font-size: 15px;">${esc(card.title)}</b>
            <p style="font-size: 13.5px; margin: 6px 0 0; color: var(--muted);">${esc(card.summary)}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 3. 海上哲學家之舟 -->
    <section id="sec-philosophers" class="island-card">
      <span class="island-badge">PHILOSOPHER WISDOM SHIPS</span>
      <h2>⛵ 海上 7 位哲學家之舟（真實歷史肖像、傳世名言與心理學智慧）</h2>
      <p>巡航於島嶼海域的思想先驅們，為現代心理學提供了橫跨千年的哲學思辨維度：</p>
      ${PHILOSOPHERS_DATA.map(p => `
        <div class="quote-box">
          <div class="quote-avatar-wrap">
            <img src="${esc(p.avatar)}" alt="${esc(p.name)}真實歷史肖像" class="quote-avatar-img">
            <span class="quote-avatar-badge">歷史真實肖像</span>
          </div>
          <div class="quote-content">
            <div class="quote-title">⛵ ${esc(p.name)}（${esc(p.era)}）</div>
            ${p.lifeStory ? `<div class="quote-bio">${esc(p.lifeStory)}</div>` : ''}
            <div class="quote-body">“${esc(p.quote)}”</div>
            <div class="quote-meta">
              <b>心靈小語：</b>${esc(p.insight)}<br>
              <b>心理學連動：</b>${esc(p.psychologyConnection)}
            </div>
          </div>
        </div>
      `).join('')}
    </section>

    <!-- 4. 六大課程島嶼教材 -->
    ${courses.map(c => {
      const story = ISLAND_STORIES[c.id];
      return `
      <section id="${c.id}" class="island-card">
        <span class="island-badge">ISLAND ${String(c.order).padStart(2,'0')} · ${esc(c.group)}</span>
        <div class="island-header">
          <h3>${String(c.order).padStart(2,'0')}. ${esc(c.name)}</h3>
          <p style="color: var(--muted); margin: 0;">${esc(c.intro)}</p>
        </div>

        <div class="goal-box">
          <strong>🎯 ${esc(c.goalLabel || '學習目標')}：</strong>${esc(c.goal)}
        </div>

        ${story ? `
          <h4>🏛️ 本島科學先驅與學術大師</h4>
          <div class="master-card-html">
            <div class="master-portrait-wrap">
              <img src="${esc(story.scholar.portrait)}" alt="${esc(story.scholar.name)}真實肖像" class="master-portrait-img-html">
              <span class="master-badge-html">${esc(story.scholar.badge || '歷史真實肖像')}</span>
            </div>
            <div class="master-info-html">
              <h5 class="master-name-html">${esc(story.scholar.name)}</h5>
              <p class="master-role-html">${esc(story.scholar.role)} ｜ ${esc(story.scholar.era)}</p>
              <div class="master-quote-html">“${esc(story.scholar.quote)}”</div>
              <p class="master-bio-html">${esc(story.scholar.bio)}</p>
            </div>
          </div>

          <h4>📸 歷史現場珍貴照片與經典實驗圖景</h4>
          <div class="photo-grid-html">
            ${story.photos.map(p => `
              <div class="photo-card-html">
                <div class="photo-wrap-html">
                  <img src="${esc(p.image)}" alt="${esc(p.title)}" class="photo-img-html" loading="lazy">
                </div>
                <div class="photo-meta-html">
                  <h5 class="photo-title-html">${esc(p.title)}</h5>
                  <p class="photo-caption-html">${esc(p.caption)}</p>
                  <p class="photo-details-html">${esc(p.details)}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="classic-story-html">
            <span class="classic-story-tag">📜 經典歷史故事深度解密</span>
            <h5 class="classic-story-title">${esc(story.classicStory.title)}</h5>
            <p class="classic-story-body">${esc(story.classicStory.content)}</p>
          </div>
        ` : ''}

        <h4>📘 核心學習重點</h4>
        ${c.blocks.map((b, bi) => `
          <div class="topic-block">
            <h4>${String(bi+1).padStart(2,'0')} / ${esc(b.title)}</h4>
            <p>${esc(b.text)}</p>
          </div>
        `).join('')}

        ${c.comparison ? `
          <h4>📊 核心概念比較表</h4>
          <table class="comparison-table">
            <thead>
              <tr>${c.comparison.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${c.comparison.rows.map(r => `
                <tr>${r.map(td => `<td>${esc(td)}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${c.prompts && c.prompts.length ? `
          <h4>💡 延伸思考與 AI 提問提示詞</h4>
          ${c.prompts.map((p, pi) => `
            <div class="prompt-box">// 提示詞 ${pi+1}：${esc(c.promptTitles?.[pi] || '思考練習')}\n${esc(p)}</div>
          `).join('')}
        ` : ''}

        ${c.links && c.links.length ? `
          <h4>🔗 權威延伸學術資源</h4>
          <ul>
            ${c.links.map(l => `
              <li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a> ${l.note ? `<small style="color: var(--muted);">(${esc(l.note)})</small>` : ''}</li>
            `).join('')}
          </ul>
        ` : ''}

        <h4>👥 概念島民</h4>
        <div style="margin-bottom: 20px;">
          ${residents.filter(r => r.island === c.id).map(r => `
            <span class="resident-pill"><strong>${esc(r.name)}</strong>：${esc(r.concept)}</span>
          `).join('')}
        </div>

        <h4>📝 自編隨堂測驗與完整解析</h4>
        ${c.quiz.map((q, qi) => {
          const correctOpt = q.options.find(o => o.id === q.answer);
          return `
            <div class="quiz-card">
              <div class="quiz-q">${qi+1}. ${esc(q.question)}</div>
              <ul class="quiz-opts">
                ${q.options.map(o => `<li>(${esc(o.id)}) ${esc(o.text)}</li>`).join('')}
              </ul>
              <div class="quiz-ans">
                ✓ 正確答案：(${esc(q.answer)}) ${esc(correctOpt?.text)}<br>
                <b>解析：</b>${esc(q.explanation)}
              </div>
            </div>
          `;
        }).join('')}
      </section>
      `;
    }).join('')}

    <footer>
      <p>© ${esc(site.author)} · 本教材內容與 3D 島嶼互動系統參考黃泓諺老師所提供的教學夢幻島技能包與課程群島架構。</p>
      <p><a class="back-btn" href="./">回到 3D 心理學群島主頁</a></p>
    </footer>
  </main>
</body>
</html>`;

  await writeFile(resolve(root, 'content.html'), html);
  return d;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncMaterials(siteRoot).then(d => {
    console.log(`已成功同步 ${d.courses.length} 座課程島與中央衛城至 content.html 與 content.json。`);
  }).catch(e => {
    console.error('同步失敗：' + e.message);
    process.exitCode = 1;
  });
}
