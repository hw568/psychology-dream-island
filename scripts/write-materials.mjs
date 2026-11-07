import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const json=(title,value)=>`## ${title}\n\n\`\`\`json\n${JSON.stringify(value,null,2)}\n\`\`\`\n\n`;
const blocks=items=>'## 教材內容\n\n'+items.map(b=>`### ${b.title}\n\n${b.text}\n\n`).join('');
function folder(name){if(typeof name!=='string'||!name.trim()||/[<>:"/\\|?*\x00-\x1f]/.test(name)||/[. ]$/.test(name)||/^(\.|\.\.|con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))throw Error('島名不適合作為資料夾名稱：'+name+'；請先確認適合的名稱。');return name;}
export async function writeMaterialSources(root){
 const manifestPath=resolve(root,'islands/manifest.json');try{await access(manifestPath);throw Error('Markdown來源已存在，請直接編輯各島教材.md；不會覆寫。');}catch(e){if(e.code!=='ENOENT')throw e;}
 const data=JSON.parse(await readFile(resolve(root,'data/content.json'),'utf8')),names=[data.center.name,...data.courses.map(c=>c.name)].map(folder);if(new Set(names).size!==names.length)throw Error('中央島與課程島名稱重複，請先確認，避免覆寫。');
 const manifest={center:`islands/${names[0]}/教材.md`,courses:[]},central={...data,center:{...data.center}};delete central.courses;delete central.residents;delete central.center.blocks;
 const write=async(p,text)=>{const target=resolve(root,p);await mkdir(dirname(target),{recursive:true});await writeFile(target,text.trimEnd()+'\n');};
 await write(manifest.center,`# ${data.center.name}\n\n中央島的導覽、作者、講師與主題設定。\n\n`+json('資料設定',central)+blocks(data.center.blocks));
 for(const c of data.courses){const meta={...c};for(const key of ['blocks','prompts','promptTitles','links','quiz'])delete meta[key];const file=`islands/${c.name}/教材.md`;manifest.courses.push(file);await write(file,`# ${c.name}\n\n本檔為教材來源。在「教材內容」內增刪 ### 標題及內文；保留各個 ## 分區名稱。\n\n`+json('資料設定',meta)+blocks(c.blocks)+'## 教材提示詞\n\n'+c.prompts.map((p,i)=>`### ${c.promptTitles?.[i]||'教材提示詞'+(c.prompts.length>1?' '+(i+1):'')}\n\n\`\`\`text\n${p}\n\`\`\`\n\n`).join('')+json('延伸資源',c.links)+json('隨堂測驗',c.quiz)+json('島民概念',data.residents.filter(p=>p.island===c.id)));}
 await write(manifestPath,JSON.stringify(manifest,null,2));return manifest;
}
