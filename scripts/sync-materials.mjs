import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {loadMarkdownMaterials} from '../js/materials.mjs';
import {writeMaterialSources} from './write-materials.mjs';
export const siteRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function syncMaterials(root=siteRoot,{check=false}={}){
 const d=await loadMarkdownMaterials(p=>{const target=resolve(root,p);if(!target.startsWith(resolve(root)+sep))throw Error('教材來源不可超出site資料夾。');return readFile(target,'utf8');});
 if(check){const cache=JSON.parse(await readFile(resolve(root,'data/content.json'),'utf8'));if(!isDeepStrictEqual(d,cache))throw Error('Markdown與JSON快取不同步，請先執行sync-materials.mjs。');return d;}
 await writeFile(resolve(root,'data/content.json'),JSON.stringify(d,null,2)+'\n');
 const blocks=bs=>bs.map(b=>`<h3>${esc(b.title)}</h3><p>${esc(b.text)}</p>`).join('');let body=`<a href="./">返回群島首頁</a><h1>${esc(d.site.title)}</h1><p>${esc(d.editorialNote)}</p>`;
 const speaker=d.speaker;if(speaker)body+=`<h2>講師介紹：${esc(speaker.name)}${speaker.alias?'／'+esc(speaker.alias):''}</h2>`+['education','teaching','administration'].map(k=>`<p>${esc(speaker[k])}</p>`).join('')+'<ul>'+(speaker.current||[]).map(s=>`<li>${esc(s)}</li>`).join('')+'</ul>';
 body+=blocks(d.center.blocks);
 for(const c of d.courses){body+=`<section><h2>${c.order}. ${esc(c.name)}</h2><p>${esc(c.intro)}</p><p>${esc(c.goalLabel)}：${esc(c.goal)}</p>`+blocks(c.blocks);if(c.comparison){const t=c.comparison;body+='<table><thead><tr>'+t.headers.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(v=>`<td>${esc(v)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';}
 body+=c.prompts.map((p,i)=>`<h3>${esc(c.promptTitles[i])}</h3><pre>${esc(p)}</pre>`).join('')+c.links.map(l=>`<p><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a> ${esc(l.note)}</p>`).join('');body+='<h3>自編練習題</h3>'+c.quiz.map(q=>`<details><summary>${esc(q.question)}</summary><ol>${q.options.map(o=>`<li>${esc(o.text)}</li>`).join('')}</ol><p>正確答案：${esc(q.options.find(o=>o.id===q.answer).text)}<br>${esc(q.explanation)}</p></details>`).join('')+'</section>';}
 await writeFile(resolve(root,'content.html'),'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>完整文字教材｜'+esc(d.site.title)+'</title><style>body{font:18px/1.8 system-ui;max-width:850px;margin:auto;padding:24px;background:#fffaf1;color:#382e42}pre,p{white-space:pre-wrap;overflow-wrap:anywhere}table{border-collapse:collapse}td,th{border:1px solid;padding:8px}a{color:#5f357e}</style><body><main>'+body+'</main></body></html>');
 const index=resolve(root,'index.html');let html=await readFile(index,'utf8');html=html.replace(/<title>.*?<\/title>/,'<title>'+esc(d.site.title)+'</title>').replace(/(<a class="brand"[^>]*aria-label=")[^"]*/,(_,lead)=>lead+esc(d.site.title)+'首頁').replace(/(<a class="brand"[\s\S]*?<span>)[^<]*/,(_,lead)=>lead+esc(d.site.title)).replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(d.site.title)+'：教材探索、測驗與學習紀念證書。">').replace(/(<span id="read-count">).*?(<\/span>)/,(_,a,b)=>a+`0 / ${d.courses.length} 已讀`+b).replace('七座島嶼，一段教學旅程',`${d.courses.length} 座課程島＋中央島`).replace(/(<select id="group">)[\s\S]*?(<\/select>)/,(_,a,b)=>a+'<option value="">全部海域</option>'+[...new Set(d.courses.map(c=>c.group))].map(g=>`<option>${esc(g)}</option>`).join('')+b).replace(/(<span class="edition">)[\s\S]*?(<\/span>)/,(_,a,b)=>a+esc(d.appearance?.label||'教材探索')+' · 01—'+String(d.courses.length).padStart(2,'0')+b);
 await writeFile(index,html);return d;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{if(process.argv.includes('--init'))await writeMaterialSources(siteRoot);const d=await syncMaterials(siteRoot,{check:process.argv.includes('--check')});console.log(`已驗證${process.argv.includes('--check')?'':'並同步'} ${d.courses.length} 座課程島與中央島。`);}catch(e){console.error('教材同步失敗：'+e.message);process.exitCode=1;}}
