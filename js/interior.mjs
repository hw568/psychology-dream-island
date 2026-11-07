import {paletteFor} from './appearance.mjs';
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {createAnimeCharacter, animatePuppy} from './anime-character.mjs';

/**
 * 張春興教授心理學完整備課室 (Prof. Chang's Psychology Preparation & Research Studio)
 */
export function createInterior(renderer,host,{appearance,onMaterial,onExit,onInvalidate}){
 const palette=paletteFor(appearance);
 const scene=new THREE.Scene();
 scene.background=new THREE.Color('#1c1724');

 const camera=new THREE.PerspectiveCamera(45,1,.1,100);
 camera.position.set(13,11,15);

 const controls=new OrbitControls(camera,renderer.domElement);
 controls.target.set(0,1.8,0);
 controls.minDistance=8;
 controls.maxDistance=26;
 controls.minPolarAngle=.25;
 controls.maxPolarAngle=1.38;
 controls.enablePan=false;
 controls.enabled=false;
 controls.update();
 controls.addEventListener('change',()=>onInvalidate?.());

 // Warm scholarly ambient and directional study lighting
 scene.add(new THREE.HemisphereLight('#fff8e7','#8d7a9c',2.6));
 const sun=new THREE.DirectionalLight('#fff0ce',2.5);
 sun.position.set(6,14,8);
 sun.castShadow=true;
 scene.add(sun);

 const mats=new Map();
 const mat=(c,extra={})=>{
   const key=`${c}-${JSON.stringify(extra)}`;
   if(!mats.has(key)) mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.72,flatShading:true,...extra}));
   return mats.get(key);
 };

 const add=(g,geo,c,x=0,y=0,z=0,extra={})=>{
   const m=new THREE.Mesh(geo,mat(c,extra));
   m.position.set(x,y,z);
   m.castShadow=true;
   m.receiveShadow=true;
   g.add(m);
   return m;
 };
 const box=(g,w,h,d,c,x=0,y=0,z=0,extra={})=>add(g,new THREE.BoxGeometry(w,h,d),c,x,y,z,extra);
 const cyl=(g,r1,r2,h,c,x=0,y=0,z=0,n=14,extra={})=>add(g,new THREE.CylinderGeometry(r1,r2,h,n),c,x,y,z,extra);
 const ball=(g,r,c,x=0,y=0,z=0,extra={})=>add(g,new THREE.SphereGeometry(r,12,10),c,x,y,z,extra);
 const cone=(g,r,h,c,x=0,y=0,z=0,n=10,extra={})=>add(g,new THREE.ConeGeometry(r,h,n),c,x,y,z,extra);
 const torus=(g,r,t,c,x=0,y=0,z=0,extra={})=>add(g,new THREE.TorusGeometry(r,t,8,18),c,x,y,z,extra);

 // -------------------------------------------------------------
 // 1. Architectural Shell: Hardwood Floor & Walnut Wainscot Walls
 // -------------------------------------------------------------
 const roomW=15, roomH=5.2, roomD=13;
 // Floor: Rich Herringbone Parquet
 box(scene,roomW,.32,roomD,'#6a402d',0,-.16,0);
 for(let px=-roomW/2+.5; px<roomW/2; px+=.9){
   box(scene,.03,.01,roomD-0.4,'#4e2e20',px,.01,0);
 }
 // Baseboards
 box(scene,roomW,.22,.15,'#3e2723',0,.11,-roomD/2+.08);
 box(scene,.15,.22,roomD,'#3e2723',-roomW/2+.08,.11,0);

 // Walls: Upper Warm Plaster, Lower Classic Dado Paneling
 const walls=[];
 const backWall=new THREE.Group();
 backWall.position.set(0,roomH/2,-roomD/2);
 scene.add(backWall);
 box(backWall,roomW,roomH,.2,'#f2eae1',0,0,0); // Upper plaster
 box(backWall,roomW,1.6,.26,'#4e342e',0,-roomH/2+.8,.02); // Lower wood wainscot
 torus(backWall,roomW/2,.03,'#3e2723',0,-roomH/2+1.6,.05); // Dado rail
 walls.push(backWall);

 const leftWall=new THREE.Group();
 leftWall.position.set(-roomW/2,roomH/2,0);
 scene.add(leftWall);
 box(leftWall,.2,roomH,roomD,'#eae2d6',0,0,0);
 box(leftWall,.26,1.6,roomD,'#4e342e',.02,-roomH/2+.8,0);
 walls.push(leftWall);

 // Sunlit Bay Window on Left Wall
 const winFrame=box(leftWall,.34,3.2,4.8,'#ffffff',.12,0.6,0);
 box(winFrame,.4,3.0,4.6,'#e0f7fa',0,0,0,{transparent:true,opacity:.55});
 // Mullions
 cyl(winFrame,.03,.03,3.0,'#ffffff',.2,0,0);
 cyl(winFrame,.03,.03,4.6,'#ffffff',.2,0,0).rotation.x=Math.PI/2;
 // Warm Golden Sunbeam into room
 const sunbeam=new THREE.Group();
 sunbeam.position.set(-roomW/2+3.2,1.8,0);
 scene.add(sunbeam);
 const beamMesh=box(sunbeam,6.2,3.4,4.2,'#fffde7',0,0,0,{transparent:true,opacity:.12});
 beamMesh.rotation.z=-0.45;

 // Vintage Oriental Mind Study Carpet
 const carpet=cyl(scene,3.6,3.6,.04,'#8b1e1b',0,.02,0,24);
 carpet.scale.z=.78;
 torus(scene,3.5,.08,'#ffd700',0,.03,0);
 torus(scene,3.2,.04,'#0288d1',0,.035,0);

 // -------------------------------------------------------------
 // 2. Floor-to-Ceiling Academic Bookshelves (宏偉實木心理學藏書壁架)
 // -------------------------------------------------------------
 function createBookshelf(x,z,width=4.6,height=4.2){
   const g=new THREE.Group();
   g.position.set(x,height/2,z);
   scene.add(g);
   // Outer frame
   box(g,width,height,.65,'#3e2723',0,0,0);
   box(g,width-.24,height-.2,.66,'#2b1b17',0,0,.02);
   // 4 Shelves
   for(let s=0; s<5; s++){
     const sy=-height/2+.2+s*(height/4.3);
     box(g,width-.2,.08,.62,'#4e342e',0,sy,.02);
     // Populate books
     const bookCols=['#8b1e1b','#1a237e','#1b5e20','#4a148c','#e65100','#37474f','#ffd700'];
     let bx=-width/2+.3;
     while(bx<width/2-.4){
       const bW=.09+Math.sin(bx*12)*.03;
       const bH=.48+Math.cos(bx*8)*.12;
       const col=bookCols[Math.floor(Math.abs(Math.sin(bx*31))*bookCols.length)%bookCols.length];
       const b=box(g,bW,bH,.44,col,bx,sy+bH/2+.04,.02);
       // Gold spine embossing
       box(b,.015,bH-.08,.445,'#ffd700',bW/2-.005,0,0);
       bx+=bW+.035;
     }
   }
   // Crown moulding top
   box(g,width+.2,.16,.75,'#4e342e',0,height/2+.06,0);
   return g;
 }
 createBookshelf(2.8,-roomD/2+.35,5.2,4.4);
 createBookshelf(-3.8,-roomD/2+.35,3.8,4.4);

 // -------------------------------------------------------------
 // 3. Psychology Academic Blackboard (心理學核心講授大黑板)
 // -------------------------------------------------------------
 const blackboard=new THREE.Group();
 blackboard.position.set(-0.2,2.9,-roomD/2+.2);
 scene.add(blackboard);
 // Ornate wood frame
 box(blackboard,3.8,2.2,.12,'#5d4037',0,0,0);
 // Dark slate surface
 box(blackboard,3.58,1.98,.14,'#1e2d24',0,0,.01);
 // Chalk diagram: Ebbinghaus Forgetting Curve & Brain System
 const chalkLine1=cyl(blackboard,.01,.01,2.8,'#ffffff',0,.4,.08);chalkLine1.rotation.z=Math.PI/2;
 const chalkCurve=torus(blackboard,1.1,.015,'#ffee58',-.4,-.1,.08);chalkCurve.rotation.z=-0.7;
 // Chalk text formulas: S = k log I  &  Ebbinghaus R = e^(-t/S)
 box(blackboard,.55,.03,.02,'#ffffff',.8,.5,.08);
 box(blackboard,.72,.03,.02,'#80d8ff',.8,.2,.08);
 box(blackboard,.60,.03,.02,'#ffd54f',.8,-.1,.08);

 // -------------------------------------------------------------
 // 4. Executive Walnut Desk & Banker's Lamp (張春興教授備課桌椅與研究器材)
 // -------------------------------------------------------------
 const desk=new THREE.Group();
 desk.position.set(0,0,-0.6);
 scene.add(desk);

 // Desk Top & Pedestals
 box(desk,4.4,.18,2.2,'#4e342e',0,1.5,0);
 // Desk top bevel trim
 box(desk,4.52,.04,2.32,'#3e2723',0,1.58,0);
 // Left & Right Drawer Pedestals
 for(const side of [-1,1]){
   box(desk,1.0,1.4,1.9,'#3e2723',side*1.55,.7,0);
   // Brass Drawer Handles
   for(let dy=0.3; dy<=1.1; dy+=0.38){
     box(desk,.22,.03,.04,'#ffd700',side*1.55,dy,.98);
   }
 }

 // Professor's Classic Green Banker's Lamp (經典綠罩黃銅銀行家檯燈)
 const lampGroup=new THREE.Group();
 lampGroup.position.set(-1.45,1.6,0.3);
 desk.add(lampGroup);
 // Brass base & curved neck
 cyl(lampGroup,.20,.22,.06,'#b8860b',0,.03,0);
 cyl(lampGroup,.03,.03,.48,'#ffd700',0,.27,0);
 const shadePivot=cyl(lampGroup,.025,.025,.28,'#b8860b',0,.48,0);shadePivot.rotation.z=Math.PI/2;
 // Emerald green glass shade
 const shade=box(lampGroup,.48,.18,.26,'#1b5e20',0,.52,0,{roughness:.2});
 box(shade,.44,.02,.22,'#ffffff',0,-.08,0);
 // Warm point light casting glow on desk
 const deskLight=new THREE.PointLight('#ffecb3',2.8,4.5);
 deskLight.position.set(0,.35,0);
 lampGroup.add(deskLight);

 // Anatomical Human Brain Model on Desk Stand (人腦立體解剖微縮模型)
 const brainModel=new THREE.Group();
 brainModel.position.set(1.4,1.6,-0.3);
 desk.add(brainModel);
 cyl(brainModel,.12,.14,.08,'#263238',0,.04,0); // Pedestal base
 cyl(brainModel,.018,.018,.22,'#cfd8dc',0,.16,0); // Chrome stand
 // Left & Right Hemispheres with distinct lobe colors
 const brainL=ball(brainModel,.15,'#ec407a',-.08,.32,0);brainL.scale.set(1,1.1,1.3);
 const brainR=ball(brainModel,.15,'#42a5f5',.08,.32,0);brainR.scale.set(1,1.1,1.3);
 ball(brainModel,.07,'#ffa726',0,.24,-.12); // Cerebellum

 // Opened Handwritten Manuscript / Lecture Notes (攤開的備課手稿講義)
 const manuscript=new THREE.Group();
 manuscript.position.set(0.1,1.6,0.2);
 manuscript.rotation.y=-0.15;
 desk.add(manuscript);
 box(manuscript,1.05,.04,.75,'#fefae0',0,0,0);
 // Lined text notes
 for(let ly=-0.26; ly<=0.26; ly+=0.08){
   box(manuscript,.82,.005,.02,'#5c6bc0',0,.025,ly);
 }
 // Inkwell & Quill pen
 cyl(manuscript,.06,.06,.08,'#212121',.58,.04,-.1);
 const quill=cyl(manuscript,.008,.008,.35,'#eceff1',.56,.18,-.1);quill.rotation.z=0.35;
 // Tea cup & saucer
 cyl(manuscript,.12,.12,.02,'#ffffff',-.65,.02,-.15);
 cyl(manuscript,.07,.05,.09,'#ffffff',-.65,.07,-.15);

 // Professor's Leather Armchair (皮革扶手辦公椅)
 const chair=new THREE.Group();
 chair.position.set(0,0,-1.65);
 scene.add(chair);
 box(chair,1.2,.18,1.1,'#2c1810',0,.9,0); // Seat cushion
 box(chair,1.1,1.3,.18,'#3e2723',0,1.55,-.46); // Backrest
 // Armrests
 for(const side of [-1,1]){
   box(chair,.14,.4,.9,'#4e342e',side*.55,1.25,0);
 }
 // Swivel base
 cyl(chair,.08,.08,.6,'#212121',0,.4,0);
 for(let k=0; k<5; k++){
   const leg=box(chair,.5,.06,.08,'#212121',Math.sin(k*Math.PI*2/5)*.3,.12,Math.cos(k*Math.PI*2/5)*.3);
   leg.rotation.y=k*Math.PI*2/5;
 }

 // -------------------------------------------------------------
 // 5. Discussion Lounge Area: Sofa, Coffee Table & Floor Lamp
 // -------------------------------------------------------------
 const sofa=new THREE.Group();
 sofa.position.set(4.4,0,2.2);
 sofa.rotation.y=-Math.PI/2.4;
 scene.add(sofa);
 box(sofa,2.4,.35,1.1,'#2e4a3e',0,.65,0); // Deep green leather seat
 box(sofa,2.4,.9,.24,'#1e362c',0,1.15,-.45); // Backrest
 for(const side of [-1,1]){
   box(sofa,.28,.55,1.0,'#1e362c',side*1.2,.85,0); // Pillows
 }

 // Coffee Table with Psychology Journal & Potted Plant
 const coffeeTab=new THREE.Group();
 coffeeTab.position.set(3.0,0,1.6);
 scene.add(coffeeTab);
 box(coffeeTab,1.6,.10,1.0,'#5d4037',0,.55,0);
 for(const sx of [-1,1]) for(const sz of [-1,1]) cyl(coffeeTab,.04,.04,.5,'#3e2723',sx*.6,.25,sz*.35);
 // Plant pot
 cyl(coffeeTab,.14,.10,.18,'#ffffff',-.3,.68,0);
 ball(coffeeTab,.15,'#43a047',-.3,.82,0);
 // Psychology Journal
 box(coffeeTab,.35,.03,.48,'#8e24aa',.3,.61,0);

 // -------------------------------------------------------------
 // 6. Classical Stately Exit Door with Arch
 // -------------------------------------------------------------
 const door=new THREE.Group();
 door.position.set(roomW/2-.4,0,roomD/2-1.2);
 door.rotation.y=-Math.PI/2;
 scene.add(door);
 const doorMeshes=[];

 box(door,2.6,4.0,.34,'#3e2723',0,2.0,0); // Door frame arch
 box(door,2.2,3.6,.26,'#4e342e',0,1.8,0); // Main door panel
 // Glass transom above door
 box(door,1.8,.6,.28,'#e0f7fa',0,3.3,0,{transparent:true,opacity:.6});
 // Brass door knobs
 cyl(door,.08,.08,.16,'#ffd700',.8,1.6,.18).rotation.x=Math.PI/2;
 cyl(door,.08,.08,.16,'#ffd700',.8,1.6,-.18).rotation.x=Math.PI/2;
 door.traverse(m=>{if(m.isMesh){m.userData.exitRoom=true;doorMeshes.push(m);}});

 const doorButton=document.createElement('button');
 doorButton.id='interior-door';
 doorButton.className='interior-door';
 doorButton.textContent='✦ 返回中央島戶外 ✦';
 doorButton.hidden=true;
 host.append(doorButton);
 doorButton.addEventListener('click',onExit);

 // -------------------------------------------------------------
 // 7. Professor Chang & Companion Puppy in the Preparation Room
 // -------------------------------------------------------------
 const actor=createAnimeCharacter(0,true);
 actor.g.scale.setScalar(1.35);
 actor.g.position.set(-0.3,.04,0.7);
 actor.g.rotation.y=0.2;
 scene.add(actor.g);

 const pickables=[];
 actor.g.traverse(m=>{if(m.isMesh)pickables.push(m);});

 let time=0,active=false,paused=false,hover=false;

 const button=document.createElement('button');
 button.id='interior-host';
 button.className='person-label island-host interior-host';
 button.innerHTML='<span>張春興教授 · 查看備課大綱與教材 ✦</span>';
 button.setAttribute('aria-label','點選開啟張春興教授普通心理學備課總綱');
 button.hidden=true;
 host.append(button);
 button.addEventListener('click',onMaterial);
 for(const ev of ['pointerenter','focus']) button.addEventListener(ev,()=>hover=true);
 for(const ev of ['pointerleave','blur']) button.addEventListener(ev,()=>hover=false);

 const exit=document.createElement('button');
 exit.id='exit-interior';
 exit.className='interior-exit';
 exit.textContent='⌖ 返回中央島探索';
 exit.hidden=true;
 host.append(exit);
 exit.addEventListener('click',onExit);

 const hint=document.createElement('p');
 hint.className='interior-note';
 hint.textContent='張春興教授心理學備課室 ✦ 拖曳旋轉環視書房 ｜ 點選教授閱讀總綱 ｜ 點擊大門返回戶外';
 hint.hidden=true;
 host.append(hint);

 function keepDoorClear(w,h){
   const box3=new THREE.Box3().setFromObject(door),points=[];
   for(const x of [box3.min.x,box3.max.x])
     for(const y of [box3.min.y,box3.max.y])
       for(const z of [box3.min.z,box3.max.z]){
         const p=new THREE.Vector3(x,y,z).project(camera);
         points.push({x:(p.x+1)*w/2,y:(1-p.y)*h/2});
       }
   const minX=Math.min(...points.map(p=>p.x))-6,maxX=Math.max(...points.map(p=>p.x))+6;
   const minY=Math.min(...points.map(p=>p.y))-6,maxY=Math.max(...points.map(p=>p.y))+6;
   const reserved=[{x:minX,y:minY,w:maxX-minX,h:maxY-minY}];
   if(!doorButton.hidden){
     reserved.push({
       x:parseFloat(doorButton.style.left)-doorButton.offsetWidth/2-4,
       y:parseFloat(doorButton.style.top)-doorButton.offsetHeight-4,
       w:doorButton.offsetWidth+8,
       h:doorButton.offsetHeight+8
     });
   }
   const rawX=parseFloat(button.style.left),rawY=parseFloat(button.style.top),bw=button.offsetWidth,bh=button.offsetHeight;
   const fits=(x,y)=>x-bw/2>=4&&x+bw/2<=w-4&&y-bh>=60&&y<=h-60&&!reserved.some(r=>x-bw/2<r.x+r.w&&x+bw/2>r.x&&y-bh<r.y+r.h&&y>r.y);
   if(fits(rawX,rawY))return;
   const choices=[];
   for(const dx of [0,-80,80,-160,160,-240,240]){
     for(const dy of [0,-60,60,-120,120,-180,180,-240,240]){
       const x=rawX+dx,y=rawY+dy;
       if(fits(x,y))choices.push({x,y,cost:Math.hypot(dx,dy)});
     }
   }
   choices.sort((a,b)=>a.cost-b.cost);
   if(choices[0]){
     button.style.left=choices[0].x+'px';
     button.style.top=choices[0].y+'px';
   }
 }

 const ray=new THREE.Raycaster();

 return {
   get active(){return active;},
   enter(){
     active=true;
     controls.enabled=true;
     button.hidden=exit.hidden=hint.hidden=false;
   },
   leave(){
     active=false;
     controls.enabled=false;
     button.hidden=exit.hidden=hint.hidden=doorButton.hidden=true;
   },
   render(dt,reduced){
     paused=reduced;
     if(!reduced&&!hover) time+=dt;

     // Gentle breathing animation for Prof. Chang in study
     const breath=Math.sin(time*2.5)*.025;
     actor.g.position.y=.04+breath;
     if(actor.arms&&actor.arms.length>=2){
       actor.arms[0].rotation.x=breath*2;
     }

     // Animate Puppy on carpet
     if(actor.puppy){
       animatePuppy(actor.puppy,time,false,false);
     }

     camera.aspect=host.clientWidth/host.clientHeight;
     camera.updateProjectionMatrix();
     controls.update();

     renderer.render(scene,camera);

     const p=actor.g.position.clone().add(new THREE.Vector3(0,3.2,0)).project(camera);
     const w=host.clientWidth,h=host.clientHeight;
     button.style.left=Math.max(100,Math.min(w-100,(p.x+1)*w/2))+'px';
     button.style.top=Math.max(88,Math.min(h-65,(-p.y+1)*h/2))+'px';

     const dp=door.position.clone().add(new THREE.Vector3(0,3.8,0)).project(camera);
     const dx=(dp.x+1)*w/2,dy=(-dp.y+1)*h/2;
     doorButton.hidden=!(dx>90&&dx<w-90&&dy>65&&dy<h-65);
     doorButton.style.left=dx+'px';
     doorButton.style.top=dy+'px';
     keepDoorClear(w,h);
   },
   pick(e){
     const r=renderer.domElement.getBoundingClientRect();
     ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
     const hit=ray.intersectObjects([...doorMeshes,...pickables],false)[0];
     if(hit?.object.userData.exitRoom)onExit();
     else if(hit)onMaterial();
   },
   snapshot(){
     return {
       active,
       door:door.position.toArray(),
       tables:1,
       chairs:1,
       bookshelves:2,
       host:actor.g.position.toArray(),
       camera:camera.position.toArray()
     };
   }
 };
}
