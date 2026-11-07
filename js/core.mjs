export const STORAGE_KEY='dream-islands-v1:'+new URL('../',import.meta.url).pathname;
export function grade(questions,answers){const missing=questions.filter(q=>!answers[q.id]).map(q=>q.id);const correct=questions.filter(q=>answers[q.id]===q.answer).length;return {correct,total:questions.length,score:questions.length?Math.round(correct/questions.length*100):0,missing};}
export function reviewQuestions(courses,round=0){return courses.filter(c=>c.quiz.length).map(c=>({...c.quiz[round%c.quiz.length],courseId:c.id,courseName:c.name}));}
export function eligible(ids,state){return ids.length>0&&ids.every(id=>{const c=state.courses?.[id];return c?.read===true&&Number(c.score)>=75;});}
export function loadState(storage){try{const s=JSON.parse(storage.getItem(STORAGE_KEY));if(!s||typeof s!=='object'||!s.courses||typeof s.courses!=='object'||Array.isArray(s.courses))return {courses:{}};for(const c of Object.values(s.courses)){if(!c||typeof c!=='object'||(c.worksheet&&!Array.isArray(c.worksheet)))return {courses:{}};}return s;}catch{return {courses:{}};}}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
