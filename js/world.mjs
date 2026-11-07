export const ISLAND_LAYOUT=[
 {id:'center',x:1,z:-2,radius:6.8,elevation:3.3},
 {id:'island-01',x:-22.2,z:-10.7,radius:4.3,elevation:1.2},
 {id:'island-02',x:-26.55,z:9.6,radius:4.8,elevation:.25},
 {id:'island-03',x:-13.5,z:28.45,radius:5.4,elevation:2.7},
 {id:'island-04',x:11.15,z:29.9,radius:4.45,elevation:.6},
 {id:'island-05',x:28.55,z:11.05,radius:6.2,elevation:.1},
 {id:'island-06',x:21.3,z:-10.7,radius:4.7,elevation:4.4},
 {id:'island-07',x:-3.35,z:-20.85,radius:5.8,elevation:2.1}
];
export const BRIDGE_STYLES=[
 {id:'rope',name:'繩索吊橋',profile:'sag',arc:-.45,width:1.3,color:'#bfa08a'},
 {id:'stone',name:'月光石拱橋',profile:'arch',arc:.8,width:1.55,color:'#ded7c9'},
 {id:'candy',name:'糖果階梯橋',profile:'stairs',arc:0,width:1.45,color:'#eac5aa'},
 {id:'covered',name:'星燈廊橋',profile:'arch',arc:.12,width:1.45,color:'#cdb4a2'},
 {id:'logs',name:'圓木階梯橋',profile:'stairs',arc:0,width:1.4,color:'#b69a7f'},
 {id:'vine',name:'藤蔓花橋',profile:'arch',arc:.45,width:1.4,color:'#b7c7a3'},
 {id:'glass',name:'月光水晶橋',profile:'arch',arc:.7,width:1.4,color:'#d6c8ee'},
 {id:'grand-stairs',name:'廣場迎賓石階橋',profile:'stairs',arc:0,width:1.7,color:'#f4e3c4'},
 {id:'gear',name:'齒輪拱橋',profile:'arch',arc:.5,width:1.45,color:'#cdb396'},
 {id:'lantern-arc',name:'星環燈籠拱橋',profile:'arch',arc:.65,width:1.55,color:'#e7c8b1'}
];
export function bridgeRoute(from,to,style){if(!style)return[from,to];const length=Math.hypot(to.x-from.x,to.z-from.z),entry=Math.min(length*.35,style.landingStart??.65),exit=Math.min(length*.35,style.landingEnd??.65),ramp=Math.max(.1,length-entry-exit),count=Math.max(16,Math.ceil(length/.45),Math.ceil(Math.abs(to.y-from.y)/.12*length/ramp)),start=entry/length,end=1-exit/length;const ts=[start,end,1];for(let i=1;i<count;i++)ts.push(i/count);const times=[...new Set(ts.map(t=>Number(t.toFixed(10))))].sort((a,b)=>a-b),points=[{...from}];for(const t of times){const u=Math.max(0,Math.min(1,(t-start)/(end-start))),x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t,y=from.y+(to.y-from.y)*u+Math.sin(u*Math.PI)*(style.arc||0);if(style.profile==='stairs'){points.push({x,y:points.at(-1).y,z});if(Math.abs(y-points.at(-1).y)>1e-8)points.push({x,y,z});}else points.push({x,y,z});}points[points.length-1]={...to};return points;}

export function layoutFor(count){if(!Number.isInteger(count)||count<1)throw Error('Course count must be a positive integer.');if(count===7)return ISLAND_LAYOUT;const radius=count<3?19:Math.max(22,11.5/Math.sin(Math.PI/count));return [{id:'center',x:0,z:0,radius:6.8,elevation:3.3},...Array.from({length:count},(_,i)=>{const step=Math.PI*2/count,angle=-2.7+i*step+Math.sin(i*1.7)*step*.10,dist=radius*(.9+.2*(Math.sin(i*2.21)+1)/2);return {id:`island-${String(i+1).padStart(2,'0')}`,x:Math.cos(angle)*dist*1.04,z:Math.sin(angle)*dist*.9,radius:4.3+1.6*(i+1)/(count+1),elevation:.2+4.2*((i*.61803398875)%1)};})];}
export function bridgeStylesFor(count){return Array.from({length:count},(_,i)=>{const base=BRIDGE_STYLES[i%BRIDGE_STYLES.length],variant=Math.floor(i/BRIDGE_STYLES.length);return {...base,family:base.id,id:variant?`${base.id}-${variant+1}`:base.id,name:variant?`${base.name}・${variant+1}`:base.name,variant,width:base.width+variant*.035,arc:base.arc+(base.profile==='arch'?variant*.05:0)};});}

export function connectionsFor(count){const id=i=>`island-${String(i+1).padStart(2,'0')}`;const edges=count<3?[]:Array.from({length:count},(_,i)=>[id(i),id((i+1)%count)]);const spokes=count===7?[1,5,0]:count<3?Array.from({length:count},(_,i)=>i):[0,Math.floor(count/3),Math.floor(count*2/3)];for(const i of new Set(spokes))edges.push(['center',id(i)]);return edges;}
