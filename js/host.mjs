const norm=s=>String(s).toLowerCase().replace(/[？?！!，,。\s]/g,'');
export function answerIslandQuestion(input,data){const q=norm(input),n=data.courses.length;const result=(text,ids=[])=>({text,sources:ids.map(id=>id==='center'?{id,name:data.center.name}:{id,name:data.courses.find(c=>c.id===id)?.name}).filter(x=>x.name)});const has=(...words)=>words.some(w=>q.includes(w));
 if(has('答案','正解','選哪個','第1題','第2題','第3題','第4題'))return result('我不直接提供測驗答案；可以一起看教材概念，作答後再讀解析。');
 // Explicit lesson names and author-supplied aliases outrank generic FAQ words.
 const exact=data.courses.find(c=>[c.name,...(c.aliases||[])].some(v=>v&&q.includes(norm(v))));
 if(exact&&!has('證書','考試','測驗','我的進度'))return result(exact.name+'：'+exact.blocks.map(b=>b.title+'：'+b.text).join('\n\n'),[exact.id]);
 if(has('證書','75','畢業'))return result(`全部 ${n} 課都標記已讀，且各課測驗最高分至少75%，即可在中央廣場輸入姓名，下載PNG或列印／存PDF。這是學習紀念，不代表官方認證，不需要學習單。`,['center']);
 if(has('進度','儲存','保存','重置','換裝置'))return result('進度與姓名只存在目前瀏覽器，不自動跨裝置同步；中央廣場可匯出JSON、在另一瀏覽器匯入，合併已讀並保留最高分，也可清除；若拒絕儲存會提示僅本次有效。',['center']);
 if(has('學習單'))return result('本站沒有學習單功能。全部課程已讀及各課測驗至少75%即可領取紀念證書。',['center']);
 if(has('測驗','總複習','抽題'))return result(`每課4題，自編練習題附解析、缺答提示，保留最高分。總複習每次各課抽1題，共${n}題，下一輪換題；證書依各課成績。`,['center']);
 if(has('室內','備課室','門口','進入中央'))return result('先點中央島聚焦外觀，再點主建築進入3D備課室；拖曳旋轉，點室內張春興教授開廣場教材，轉身點門回外觀。也可由清單直接閱讀。',['center']);
 if(has('全景','滾輪','縮放'))return result('回到全景會以單段平滑過場抵達最佳取景；之後仍可用滾輪自由放大縮小，停止後不會自動拉回。減少動態時直接抵達。',['center']);
 if(has('導覽列','側欄'))return result('右上導覽按鈕可收合或恢復左側功能清單，畫布會隨可用空間調整，學習進度仍保留。',['center']);
 if(has('控制列','收起設定','隱藏設定','展開設定'))return result('右上「控制列」可顯示或隱藏上方控制列；有底色、日夜、減少動態、音樂、音量與文字清單。焰兒說明收在右上「？」。',['center']);
 if(has('清單','搜尋','教材','課程','從哪','開始','閱讀'))return result('用課程清單或可搜尋展開的文字清單直達章節；也可先點島聚焦，再點主建築讀教材。課程依序為：'+data.courses.map(c=>c.name).join('、'),data.courses.map(c=>c.id));
 if(has('島民','張春興','教授','焰兒','島主','建築','橋','旋轉','縮放','動態'))return result('先點島面或島名放大，再點主建築開教材。14位具名島民介紹不同概念，每島也有張春興教授可提問。角色沿步道與橋行走；減少動態可暫停，回全景可選其他島。右上問號內的操作說明僅供導覽參考。',['center']);
 if(has('夜晚','白天','主題','南瓜','蝙蝠','光線'))return result('可切換三種底色與獨立的白天／黃昏／夜晚光線，偏好會記住。減少動態會暫停人物與本次主題的動態物件。',['center']);
 if(has('音樂','聲音'))return result('音樂需手動開啟，再按一次即可關閉，音量滑桿可調整並記住音量；不會自動播放。',['center']);
 if(has('作者','講師','聯絡'))return result('網站作者：'+data.site.author+'。中央廣場有提供的講師介紹。',['center']);
 const tokens=[...new Set(q.match(/[a-z0-9]+|[\u4e00-\u9fff]{2}/g)||[])].filter(t=>!['什麼','怎麼','如何','可以','請問'].includes(t));
 const candidates=data.courses.flatMap(c=>c.blocks.map(b=>({c,b,score:tokens.reduce((s,t)=>s+(norm(c.name+b.title+b.text).includes(t)?t.length:0),0)}))).filter(x=>x.score>=4).sort((a,b)=>b.score-a.score);
 if(candidates.length){const {c,b}=candidates[0];return result(b.title+'：'+b.text,[c.id]);}
 return result('目前本站教材找不到可靠答案，我不會亂猜。你可以試著說出教材的關鍵詞，或使用清單搜尋課程。');
}
