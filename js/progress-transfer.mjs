const format='teaching-dream-island-progress';
const signature=data=>JSON.stringify([data.site.slug,data.courses.map(c=>[c.id,c.quiz.map(q=>[q.id,q.question,q.options,q.answer])])]);
export function exportProgress(data,state){const courses=data.courses;return {format,version:1,curriculum:signature(data),exportedAt:new Date().toISOString(),name:state.name||'',courses:Object.fromEntries(courses.map(c=>[c.id,{read:state.courses[c.id]?.read===true,score:Number(state.courses[c.id]?.score)||0}]))};}
export function importProgress(input,data,state){const courses=data.courses;
 if(!input||input.format!==format||input.version!==1||input.curriculum!==signature(data))throw Error('這不是本站目前課程的進度備份檔。');
 if(!input.courses||typeof input.courses!=='object'||Array.isArray(input.courses)||Object.keys(input.courses).length!==courses.length)throw Error('備份課程資料不完整。');
 if(typeof input.name!=='string'||input.name.length>30)throw Error('備份姓名格式不正確。');
 const next={...state,courses:{...state.courses}};
 for(const c of courses){const v=input.courses[c.id];if(!v||typeof v.read!=='boolean'||!Number.isInteger(v.score)||v.score<0||v.score>100||v.score%(100/c.quiz.length)!==0)throw Error('備份中的已讀紀錄或測驗分數不正確。');const old=state.courses[c.id];next.courses[c.id]={read:old?.read===true||v.read,score:Math.max(Number(old?.score)||0,v.score)};}
 if(!next.name&&input.name)next.name=input.name;
 return next;
}
