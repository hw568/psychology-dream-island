import {paletteFor} from './appearance.mjs';
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createAnimeCharacter} from './anime-character.mjs';

// 原創剖面教室：保留兩面牆與開放視角，可繞行觀看全部家具。
export function createInterior(renderer,host,{appearance,onMaterial,onExit,onInvalidate}){
 const palette=paletteFor(appearance),scene=new THREE.Scene();scene.background=new THREE.Color(palette.mist);
 const camera=new THREE.PerspectiveCamera(46,1,.1,100);camera.position.set(14,12,17);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.5,0);controls.minDistance=11;controls.maxDistance=30;controls.minPolarAngle=.25;controls.maxPolarAngle=1.42;controls.enablePan=false;controls.enabled=false;controls.update();
 controls.addEventListener('change',()=>onInvalidate?.());
 scene.add(new THREE.HemisphereLight('#fff5dd','#bfa8c8',2.4));const sun=new THREE.DirectionalLight('#fff0ce',2.3);sun.position.set(4,12,6);sun.castShadow=true;scene.add(sun);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.75}));return mats.get(c);};
 const add=(g,geo,c,x,y,z)=>{const m=new THREE.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const box=(g,w,h,d,c,x=0,y=0,z=0)=>add(g,new THREE.BoxGeometry(w,h,d),c,x,y,z),cyl=(g,r,h,c,x=0,y=0,z=0)=>add(g,new THREE.CylinderGeometry(r,r,h,20),c,x,y,z);
 box(scene,14,.3,12,'#f3dfbe',0,-.15,0);for(let x=-6.5;x<7;x+=1)box(scene,.025,.008,11.8,'#d9bd98',x,.006,0);
 const walls=[];walls.push(box(scene,14,4.4,.18,palette.pink,0,2.2,-6));walls.push(box(scene,.18,4.4,12,palette.roof,-7,2.2,0));for(const m of walls){m.material=m.material.clone();m.material.transparent=true;}
 box(scene,13.7,.18,.12,'#c1a492',0,.1,-5.85);box(scene,.12,.18,11.8,'#c1a492',-6.85,.1,0);
 const carpet=cyl(scene,3.2,.035,palette.pink,0,.03,0);carpet.scale.z=.85;
 const tables=[],chairs=[],lamps=[],pictures=[];
 function table(x,z,w=3.4,d=1.6){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(g,w,.18,d,'#f0c8a8',0,1.5,0);for(const a of [-1,1])for(const b of [-1,1])box(g,.13,1.4,.13,'#bca18f',a*(w/2-.2),.7,b*(d/2-.2));tables.push(g);return g;}
 function chair(x,z,angle){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);box(g,.85,.15,.85,'#a5cfc4',0,.85,0);box(g,.85,.85,.14,'#b5d4ca',0,1.27,-.38);for(const a of [-1,1])for(const b of [-1,1])box(g,.09,.8,.09,'#bca18f',a*.31,.4,b*.31);chairs.push(g);}
 function lamp(g,x,z){const l=new THREE.Group();l.position.set(x,1.62,z);g.add(l);cyl(l,.25,.06,'#a791bb',0,0,0);cyl(l,.045,.65,'#b39b77',0,.32,0);const shade=add(l,new THREE.ConeGeometry(.38,.45,24),'#ffe3a6',0,.78,0);shade.material=new THREE.MeshStandardMaterial({color:'#ffe3a6',emissive:'#ffd685',emissiveIntensity:.45});const glow=new THREE.PointLight('#ffe1a2',3,5);glow.position.set(0,.6,0);l.add(glow);lamps.push(l);}
 const desk=table(0,-.6);lamp(desk,-1.05,0);const book=box(desk,.75,.09,.52,'#8b263e',.4,1.65,0);book.rotation.y=.25;box(desk,.70,.03,.48,'#fff8ed',.4,1.71,0);box(desk,.03,.09,.50,'#ffd700',.04,1.66,0);
 table(1.2,1.5,1.3,1);chair(-.6,.8,Math.PI);chair(.9,-2.2,0);chair(2.5,1.5,Math.PI/2);
 // 牆上原創幾何壁畫，不含外部圖像。
 for(const [x,c]of [[-3.3,'#efb1ab'],[.2,'#b7d6c5'],[3.7,'#d1bddf']]){const g=new THREE.Group();g.position.set(x,2.8,-5.86);scene.add(g);box(g,2.3,1.65,.1,'#bca080');box(g,2.05,1.4,.12,'#fff7df',0,0,.04);const sun=cyl(g,.34,.06,'#ecc471',-.45,.25,.15);sun.rotation.x=Math.PI/2;const mountain=add(g,new THREE.ConeGeometry(.65,.9,3),c,.32,-.17,.16);mountain.scale.z=.1;pictures.push(g);}
 // 靠牆矮書櫃。
 box(scene,3.6,1.5,.6,'#c9b2a0',3.5,.75,-5.4);box(scene,3.3,.06,.68,'#e7d2b5',3.5,.77,-5.35);for(let i=0;i<12;i++)box(scene,.13,.45,.36,['#baa4d3','#afcdbc','#e9bb9e'][i%3],2.05+i*.25,1.1,-5.25);
 const door=new THREE.Group();door.position.set(4.5,0,5.8);scene.add(door);const doorMeshes=[];
 box(door,2.25,3.55,.28,'#b99d8a',0,1.775,0);box(door,1.85,3.2,.31,'#a8cbbf',0,1.6,0);box(door,1.2,.85,.34,'#e9e3f4',0,2.25,0);box(door,.95,.55,.36,'#d9d0e9',0,.85,0);cyl(door,.09,.12,'#d3a75f',.65,1.4,.22).rotation.x=Math.PI/2;cyl(door,.09,.12,'#d3a75f',.65,1.4,-.22).rotation.x=Math.PI/2;
 door.traverse(m=>{if(m.isMesh){m.userData.exitRoom=true;doorMeshes.push(m);}});
 const doorButton=document.createElement('button');doorButton.id='interior-door';doorButton.className='interior-door';doorButton.textContent='門口 · 回到建築外觀';doorButton.hidden=true;host.append(doorButton);doorButton.addEventListener('click',onExit);
 const actor=createAnimeCharacter(0,true);actor.g.scale.setScalar(1.3);scene.add(actor.g);const pickables=[];actor.g.traverse(m=>{if(m.isMesh)pickables.push(m);});let time=0,active=false,paused=false,hover=false;
 const button=document.createElement('button');button.id='interior-host';button.className='person-label island-host interior-host';button.innerHTML='<span>張春興教授 · 開啟廣場教材</span>';button.setAttribute('aria-label','點室內張春興教授開啟中央廣場教材');button.hidden=true;host.append(button);button.addEventListener('click',onMaterial);for(const ev of ['pointerenter','focus'])button.addEventListener(ev,()=>hover=true);for(const ev of ['pointerleave','blur'])button.addEventListener(ev,()=>hover=false);
 const exit=document.createElement('button');exit.id='exit-interior';exit.className='interior-exit';exit.textContent='← 返回中央島';exit.hidden=true;host.append(exit);exit.addEventListener('click',onExit);
 const hint=document.createElement('p');hint.className='interior-note';hint.textContent='中央島 · 備課室｜拖曳旋轉，點張春興教授開啟教材；轉身點門回建築外觀';hint.hidden=true;host.append(hint);
 function place(){actor.g.position.set(Math.sin(time*.24)*4.7,.04,Math.cos(time*.24)*3.7);actor.g.rotation.y=time*.24+Math.PI/2;actor.legs[0].rotation.x=paused||hover?0:Math.sin(time*5)*.4;actor.legs[1].rotation.x=-actor.legs[0].rotation.x;}
 place();const ray=new THREE.Raycaster();
 function keepDoorClear(w,h){
  const box=new THREE.Box3().setFromObject(door),points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);points.push({x:(p.x+1)*w/2,y:(1-p.y)*h/2});}
  const minX=Math.min(...points.map(p=>p.x))-6,maxX=Math.max(...points.map(p=>p.x))+6,minY=Math.min(...points.map(p=>p.y))-6,maxY=Math.max(...points.map(p=>p.y))+6;
  const reserved=[{x:minX,y:minY,w:maxX-minX,h:maxY-minY}];if(!doorButton.hidden)reserved.push({x:parseFloat(doorButton.style.left)-doorButton.offsetWidth/2-4,y:parseFloat(doorButton.style.top)-doorButton.offsetHeight-4,w:doorButton.offsetWidth+8,h:doorButton.offsetHeight+8});
  const rawX=parseFloat(button.style.left),rawY=parseFloat(button.style.top),bw=button.offsetWidth,bh=button.offsetHeight;
  const fits=(x,y)=>x-bw/2>=4&&x+bw/2<=w-4&&y-bh>=60&&y<=h-60&&!reserved.some(r=>x-bw/2<r.x+r.w&&x+bw/2>r.x&&y-bh<r.y+r.h&&y>r.y);
  if(fits(rawX,rawY))return;const choices=[];for(const dx of [0,-80,80,-160,160,-240,240])for(const dy of [0,-60,60,-120,120,-180,180,-240,240]){const x=rawX+dx,y=rawY+dy;if(fits(x,y))choices.push({x,y,cost:Math.hypot(dx,dy)});}choices.sort((a,b)=>a.cost-b.cost);if(choices[0]){button.style.left=choices[0].x+'px';button.style.top=choices[0].y+'px';}
 }
 return {get active(){return active;},enter(){active=true;controls.enabled=true;button.hidden=exit.hidden=hint.hidden=false;},leave(){active=false;controls.enabled=false;button.hidden=exit.hidden=hint.hidden=doorButton.hidden=true;},render(dt,reduced){paused=reduced;if(!reduced&&!hover)time+=dt;place();camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();controls.update();const back=camera.position.z<0,left=camera.position.x<0;walls[0].material.opacity=back?.16:1;walls[1].material.opacity=left?.16:1;renderer.render(scene,camera);const p=actor.g.position.clone().add(new THREE.Vector3(0,2.8,0)).project(camera);const w=host.clientWidth,h=host.clientHeight;button.style.left=Math.max(100,Math.min(w-100,(p.x+1)*w/2))+'px';button.style.top=Math.max(88,Math.min(h-65,(-p.y+1)*h/2))+'px';const dp=door.position.clone().add(new THREE.Vector3(0,3.9,0)).project(camera);const dx=(dp.x+1)*w/2,dy=(-dp.y+1)*h/2;doorButton.hidden=!(camera.position.z<3&&dx>90&&dx<w-90&&dy>65&&dy<h-65);doorButton.style.left=dx+'px';doorButton.style.top=dy+'px';keepDoorClear(w,h);},pick(e){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects([...doorMeshes,...pickables],false)[0];if(hit?.object.userData.exitRoom)onExit();else if(hit)onMaterial();},snapshot(){return {active,door:door.position.toArray(),doorScreen:(()=>{const p=door.position.clone().add(new THREE.Vector3(0,1.7,0)).project(camera);return {x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2};})(),tables:tables.length,chairs:chairs.length,lamps:lamps.length,murals:pictures.length,host:actor.g.position.toArray(),camera:camera.position.toArray()};}};
}
