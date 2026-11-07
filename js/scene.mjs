import {createInterior} from './interior.mjs';
import {fitOverview,placeOverviewLabels,projectIslandBounds} from './overview-labels.mjs';
import {createSeascape} from './seascape.mjs';
import {layoutFor,bridgeStylesFor,connectionsFor} from './world.mjs';
import {createBridges} from './bridges.mjs';
import {createDecorations} from './decorations.mjs';
import {paletteFor} from './appearance.mjs';
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from '../vendor/CSS2DRenderer.js';
import {buildNetwork,pointAt} from './navigation.mjs';
import {createResidents} from './residents.mjs';
import {createCharacterController} from './character-controller.mjs';

export function createScene(host,data,{onSelect,onFailure,onHost,onResident,onFocus}){
 const ISLAND_LAYOUT=layoutFor(data.courses.length),palette=paletteFor(data.appearance);
 const mapExtent=Math.max(...ISLAND_LAYOUT.map(n=>Math.hypot(n.x,n.z)+n.radius)),mapWidth=Math.max(83,mapExtent*2.8);
 host.dataset.dense=String(data.courses.length>8);

 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.autoUpdate=false;
 renderer.shadowMap.needsUpdate=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0xd7d0e7);

 // Labels and character prompts overlay the canvas; their wheel input must reach OrbitControls too.
 host.addEventListener('wheel',e=>{
   if(e.target===renderer.domElement)return;
   renderer.domElement.dispatchEvent(new WheelEvent('wheel',{deltaX:e.deltaX,deltaY:e.deltaY,deltaZ:e.deltaZ,deltaMode:e.deltaMode,clientX:e.clientX,clientY:e.clientY,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey,metaKey:e.metaKey,cancelable:true,bubbles:false}));
   e.preventDefault();
 },{passive:false});

 host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','拖曳旋轉課程群島，或使用鍵盤WASD/點擊地面操作人物探索');

 const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');
 leaders.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';
 leaders.setAttribute('aria-hidden','true');
 host.appendChild(leaders);

 const labelRenderer=new CSS2DRenderer();
 labelRenderer.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';
 host.appendChild(labelRenderer.domElement);

 const camera=new THREE.OrthographicCamera(-40,40,30,-30,.1,Math.max(250,mapExtent*5));
 const cameraOffset=new THREE.Vector3(40,57,66).multiplyScalar(Math.max(1,mapExtent/35));
 camera.position.copy(cameraOffset).add(new THREE.Vector3(0,3,0));
 camera.lookAt(0,3,0);

 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enablePan=false;
 controls.enableDamping=true;
 controls.dampingFactor=.08;
 controls.minZoom=.2;
 controls.maxZoom=Math.max(12,mapWidth/8);
 controls.minPolarAngle=.2;
 controls.maxPolarAngle=Math.PI/2.6;
 controls.target.set(0,3,0);
 controls.update();

 const ambient=new THREE.HemisphereLight(0xfff2da,0xb8a8c5,1.9);
 scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xfff7ef,2.5);
 sun.position.set(-30,55,22);
 sun.castShadow=true;
 sun.shadow.mapSize.set(1536,1536);
 Object.assign(sun.shadow.camera,{left:-mapExtent*1.25,right:mapExtent*1.25,top:mapExtent*1.25,bottom:-mapExtent*1.25,near:1,far:Math.max(140,mapExtent*5)});
 sun.shadow.bias=-.001;
 scene.add(sun);

 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.82,flatShading:true,...extra});
 const cream=mat('#fff0df'),rock=mat(palette.rock),grass=mat(palette.grass),wood=mat('#c9af9c'),white=mat('#fffaf1'),dark=mat('#84718d'),teal=mat(palette.roof),orange=mat('#efb77e'),purple=mat('#bba5d6'),gold=mat('#ffd700',{metalness:.3,roughness:.4});
 const warm=new THREE.MeshStandardMaterial({color:0xffe4a1,emissive:0xffd27c,emissiveIntensity:.15});
 const lamps=[];

 const water=new THREE.MeshBasicMaterial({color:'#d7d0e7'});
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(500,mapExtent*10),Math.max(500,mapExtent*10)),water);
 ocean.rotation.x=-Math.PI/2;
 ocean.position.y=-1.25;
 scene.add(ocean);

 const shadowOcean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(150,mapExtent*4),Math.max(150,mapExtent*4)),new THREE.ShadowMaterial({color:0x514260,opacity:.16}));
 shadowOcean.rotation.x=-Math.PI/2;
 shadowOcean.position.y=-1.24;
 shadowOcean.receiveShadow=true;
 scene.add(shadowOcean);

 const mesh=(parent,geo,material,x=0,y=0,z=0)=>{let m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,r1,r2,h,m,x=0,y=0,z=0,n=10)=>mesh(p,new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.IcosahedronGeometry(r,1),m,x,y,z);
 const cone=(p,r,h,m,x=0,y=0,z=0,n=8)=>mesh(p,new THREE.ConeGeometry(r,h,n),m,x,y,z);
 const torus=(p,r,t,m,x,y,z)=>mesh(p,new THREE.TorusGeometry(r,t,6,20),m,x,y,z);

 const lamp=(p,x,z)=>{cyl(p,.06,.08,2,dark,x,1.3,z);cyl(p,.2,.11,.16,wood,x,2.3,z);ball(p,.18,warm,x,2.55,z);lamps.push(p);};

 function tree(p,x,z,type=0,scale=1){
   const g=new THREE.Group();g.position.set(x,.25,z);g.scale.setScalar(scale);p.add(g);
   cyl(g,.1,.16,1.15,wood,0,.55);
   if(type===1){cone(g,.8,1.5,mat('#388e3c'),0,1.5);cone(g,.63,1.3,mat('#66bb6a'),0,2.2);}
   else if(type===2){ball(g,.75,mat('#ec407a'),0,1.6,0);ball(g,.58,mat('#f48fb1'),.4,1.9,.1);}
   else{ball(g,.75,mat('#43a047'),0,1.6,0);ball(g,.58,mat('#81c784'),.4,1.9,.1);}
 }

 function island(x,z,r,accent,elevation=0,customGeom=null){
   const g=new THREE.Group();g.position.set(x,elevation,z);
   g.userData.radius=r;g.userData.elevation=elevation;g.userData.walkRadius=Math.max(3.35,r*.75);
   scene.add(g);
   const depth=elevation+1.45;
   cyl(g,r*.98,r*1.08,depth,rock,0,.2-depth/2,0,8);
   for(let band=1;band<(elevation>2?3:2);band++){
     const t=band/3,rad=r*(.98+.1*t);
     cyl(g,rad+.01,rad+.02,.10,cream,0,.2-depth*t,0,8);
   }
   cyl(g,r,r,.25,accent,0,.14,0,8);
   g.userData.land=cyl(g,r*.98,r*.99,.2,grass,0,.35,0,8);
   cyl(g,r*1.17,r*1.15,.045,mat('#e1d4e9'),0,-1.20-elevation,0,8);
   return g;
 }

 function book(p,x,y,z,color=orange){box(p,1.05,.18,.8,color,x,y,z);box(p,.9,.12,.78,white,x,y+.13,z);box(p,1.05,.06,.8,color,x,y+.22,z);}
 function bench(p,x,z){box(p,1.3,.15,.45,wood,x,.75,z);box(p,1.3,.5,.12,wood,x,1,z-.2);for(const dx of [-.45,.45])box(p,.1,.65,.3,dark,x+dx,.35,z);}

 const locations=new Map(),labels=[],buildingLabels=[],pickables=[],animated=[];

 // =========================================================================
 // 1. CENTRAL ISLAND: 心理學元認知與心靈總所 (Metacognition Institute)
 // =========================================================================
 const mainLayout=ISLAND_LAYOUT[0];
 const center=island(mainLayout.x,mainLayout.z,mainLayout.radius,orange,mainLayout.elevation);
 locations.set('center',center);
 const centerLandmarkStart=center.children.length;

 // Academic Portico Arcade (8 Classical Columns surrounding the hall)
 cyl(center,3.2,3.4,.3,cream,0,.55,0,16);
 for(let c=0;c<8;c++){
   const angle=c*Math.PI*2/8;
   const px=Math.sin(angle)*2.4, pz=Math.cos(angle)*2.4;
   cyl(center,.14,.14,2.8,white,px,2.0,pz);
   cyl(center,.22,.18,.25,cream,px,.7,pz);
   cyl(center,.18,.22,.25,cream,px,3.4,pz);
 }
 // Central Grand Library Archway Dome
 cyl(center,1.8,2.2,2.2,cream,0,2.1,0,16);
 cyl(center,1.4,1.4,2.4,orange,0,3.8,0,16);
 const centralDome=cone(center,2.2,1.6,teal,0,5.8,0,16);
 // Fountain of Metacognition with glowing water
 cyl(center,1.1,1.1,.25,teal,0,6.7);
 const halo=torus(center,1.4,.08,gold,0,7.8,0);
 animated.push({obj:halo,kind:'halo'});

 // 3D Psychology Symbol: Greek Letter Psi (Ψ) Monument
 const psiGroup=new THREE.Group();
 psiGroup.position.set(0,8.3,0);
 center.add(psiGroup);
 cyl(psiGroup,.14,.14,2.2,gold,0,0,0);
 const psiArmL=torus(psiGroup,.72,.09,gold,-.45,.25,0);psiArmL.rotation.z=Math.PI/4;
 const psiArmR=torus(psiGroup,.72,.09,gold,.45,.25,0);psiArmR.rotation.z=-Math.PI/4;
 box(psiGroup,.32,.12,.14,gold,-.95,.8,0);
 box(psiGroup,.32,.12,.14,gold,.95,.8,0);
 box(psiGroup,.32,.12,.14,gold,0,1.15,0);
 ball(psiGroup,.24,warm,0,1.35,0);
 animated.push({obj:psiGroup,kind:'halo'});

 // Monumental Textbook of Psychology: 《現代心理學》
 book(center,-2.0,.7,1.8,mat('#8b1e1b'));
 bench(center,-2.2,-1.5);
 bench(center,2.2,-1.5);
 lamp(center,-3.8,1.8);
 lamp(center,3.8,1.8);

 center.children.slice(centerLandmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building='center';}));

 // =========================================================================
 // 2. SIX COURSE ISLANDS WITH STRONG PSYCHOLOGICAL DIFFERENTIATION
 // =========================================================================
 const accents=[mat('#00b4d8'),mat('#ffb703'),mat('#3a86ff'),mat('#e63946'),mat('#8338ec'),mat('#fb5607')];

 for(let i=0;i<data.courses.length;i++){
   const layout=ISLAND_LAYOUT[i+1];
   const g=island(layout.x,layout.z,layout.radius,accents[i%accents.length],layout.elevation);
   g.rotation.y=[.12,-.22,.28,-.1,.2,-.3,.08][i%7];
   locations.set(data.courses[i].id,g);
   const landmarkStart=g.children.length;

   // -------------------------------------------------------------
   // Island 01: 感知覺醒島 (Sensation & Gestalt Perception)
   // Necker Cube optical crystal, Penrose stairwell & Rubin vase gate
   // -------------------------------------------------------------
   if(i===0){
     cyl(g,2.5,2.7,.25,cream,0,.55,0,12);
     // Rubin's Vase Archway (Twin Silhouette Columns)
     box(g,.6,4.0,.6,mat('#5c6bc0'),-1.4,2.55,0);
     box(g,.6,4.0,.6,mat('#5c6bc0'),1.4,2.55,0);
     box(g,3.4,.45,.7,mat('#26c6da'),0,4.6,0);
     // Penrose Impossible Stairs Ring
     for(let s=0;s<6;s++){
       const sa=s*Math.PI*2/6;
       box(g,.6,.25+s*.15,.6,cream,Math.sin(sa)*1.8,.6+s*.1,Math.cos(sa)*1.8);
     }
     // Optical Necker Cube wireframe crystal hovering in the center
     const necker=mesh(g,new THREE.BoxGeometry(1.4,1.4,1.4),mat('#00e5ff',{wireframe:true}),0,2.6,0);
     animated.push({obj:necker,kind:'halo'});
     ball(g,.38,warm,0,2.6,0);
     // RGB Retinal Cone Sensors
     for(let c=0;c<3;c++){
       const color=['#e53935','#43a047','#1e88e5'][c];
       const a=c*Math.PI*2/3;
       cyl(g,.15,.08,1.6,mat(color),Math.sin(a)*1.8,1.2,Math.cos(a)*1.8);
       ball(g,.16,mat(color),Math.sin(a)*1.8,2.1,Math.cos(a)*1.8);
     }
     book(g,-1.9,.7,1.5,mat('#00bcd4'));
     bench(g,2.0,1.8);
   }

   // -------------------------------------------------------------
   // Island 02: 記憶之宮島 (Memory Palace & Conditioning)
   // Roman Colonnade Labyrinth, Ebbinghaus Hourglass & Pavlov Bell
   // -------------------------------------------------------------
   else if(i===1){
     // Colonnade Palace of Loci
     box(g,3.0,1.8,2.6,cream,0,1.35,0);
     for(const sx of [-1,1]){
       for(const sz of [-1,1]){
         cyl(g,.18,.18,2.6,mat('#ffb300'),sx*1.0,3.3,sz*.85);
       }
     }
     const belfryRoof=cone(g,2.2,1.5,mat('#ff8f00'),0,5.1,0,4);
     belfryRoof.rotation.y=Math.PI/4;
     // Pavlov Resonating Bell
     const bell=cone(g,.55,.65,gold,0,3.3,0);
     ball(g,.14,dark,0,2.8,0);
     animated.push({obj:bell,kind:'bell'});

     // Giant Ebbinghaus Crystal Hourglass
     const hg=new THREE.Group();hg.position.set(-2.0,1.4,1.3);g.add(hg);
     cone(hg,.5,.65,mat('#80deea',{transparent:true,opacity:.7}),0,.32,0);
     const hgB=cone(hg,.5,.65,mat('#80deea',{transparent:true,opacity:.7}),0,-.32,0);hgB.rotation.x=Math.PI;
     ball(hg,.16,warm,0,0,0);
     box(hg,1.1,.1,1.1,wood,0,.68,0);box(hg,1.1,.1,1.1,wood,0,-.68,0);
     animated.push({obj:hg,kind:'halo'});

     // Skinner Operant Conditioning Box Indicator
     const skinner=box(g,.8,.7,.8,mat('#455a64'),1.8,1.1,-1.2);
     cyl(skinner,.04,.04,.4,gold,0,.4,0);
     ball(skinner,.08,mat('#76ff03'),0,.65,0);
     book(g,1.9,.7,1.4,mat('#ff9800'));
   }

   // -------------------------------------------------------------
   // Island 03: 理性思維島 (Cognition, Dual-Process & Decision Tree)
   // Kahneman Fast/Slow Split Canyon & Decision Tree
   // -------------------------------------------------------------
   else if(i===2){
     box(g,3.6,.4,2.8,cream,0,.6,0);
     // System 1 Intuition Crag (Red jagged rocks)
     box(g,1.2,1.6,1.4,mat('#d32f2f'),-1.4,1.4,0);
     cone(g,.7,1.8,mat('#f57c00'),-1.4,2.5,0);
     // System 2 Logic Temple (Blue disciplined cubes)
     box(g,1.2,1.6,1.4,mat('#1976d2'),1.4,1.4,0);
     cyl(g,.6,.6,1.8,mat('#0288d1'),1.4,2.5,0,8);

     // Central Branching Decision Tree Structure
     const treeGroup=new THREE.Group();treeGroup.position.set(0,1.2,-.8);g.add(treeGroup);
     cyl(treeGroup,.22,.3,2.4,wood,0,1.2,0);
     for(let b=0;b<4;b++){
       const ba=b*Math.PI*2/4;
       const branch=cyl(treeGroup,.1,.14,1.4,wood,Math.sin(ba)*.6,2.2,Math.cos(ba)*.6);
       branch.rotation.z=Math.sin(ba)*.5;
       branch.rotation.x=Math.cos(ba)*.5;
       ball(treeGroup,.28,gold,Math.sin(ba)*1.2,2.8,Math.cos(ba)*1.2);
     }

     // Kahneman Dual-Process Balance Scale
     cyl(g,.18,.22,3.8,wood,0,2.4,.8);
     const beam=box(g,3.8,.16,.16,mat('#f57c00'),0,4.2,.8);
     animated.push({obj:beam,kind:'gear'});
     cyl(g,.02,.02,1.2,dark,-1.5,3.6,.8);
     ball(g,.45,mat('#ff5252'),-1.5,3.3,.8); // Intuition Feather
     cyl(g,.02,.02,1.2,dark,1.5,3.6,.8);
     box(g,.65,.65,.65,mat('#448aff'),1.5,3.3,.8); // Logic Crystal
     book(g,-.8,1.0,2.1,mat('#f57c00'));
     book(g,.8,1.0,2.1,mat('#1976d2'));
   }

   // -------------------------------------------------------------
   // Island 04: 動機與情緒島 (Motivation, Emotion & Maslow)
   // 5-Tier Maslow Pyramid Terrace & Heart Pulsing Aura
   // -------------------------------------------------------------
   else if(i===3){
     // 5-Tier Maslow Hierarchy Stepped Pyramid
     const pLvls=[
       {w:3.6,h:.5,c:mat('#d32f2f')}, // Physiological (Red)
       {w:2.9,h:.5,c:mat('#f57c00')}, // Safety (Orange)
       {w:2.2,h:.5,c:mat('#fbc02d')}, // Love & Belonging (Yellow)
       {w:1.5,h:.5,c:mat('#388e3c')}, // Esteem (Green)
       {w:.9,h:.5,c:mat('#7b1fa2')}   // Self-Actualization (Purple)
     ];
     let yb=.6;
     for(const lvl of pLvls){
       box(g,lvl.w,lvl.h,lvl.w,lvl.c,0,yb+lvl.h/2,0);
       yb+=lvl.h;
     }
     // Apex Star of Self-Actualization
     const star=mesh(g,new THREE.OctahedronGeometry(.55,0),gold,0,yb+.4,0);
     animated.push({obj:star,kind:'halo'});
     // Pulsing Emotional Wave Ring
     const heartRing=torus(g,2.4,.08,warm,0,2.0,0);
     animated.push({obj:heartRing,kind:'halo'});
     // Thermal Motivational Spring
     cyl(g,.8,.8,.2,mat('#00bcd4'),-2.0,.6,1.4);
     torus(g,.9,.12,rock,-2.0,.6,1.4);
     book(g,-1.9,.7,1.5,mat('#e91e63'));
     bench(g,2.0,1.6);
   }

   // -------------------------------------------------------------
   // Island 05: 人格演繹島 (Personality & Big Five OCEAN)
   // Pentagonal Star Bastion, 5 Personality Spires & Jungian Mask
   // -------------------------------------------------------------
   else if(i===4){
     cyl(g,2.6,2.8,.3,cream,0,.55,0,10);
     // 5 Colored Spires corresponding to O-C-E-A-N
     const oceanColors=[mat('#00bcd4'),mat('#5c6bc0'),mat('#fbc02d'),mat('#4caf50'),mat('#ab47bc')];
     for(let k=0;k<5;k++){
       const a=k*Math.PI*2/5;
       const px=Math.sin(a)*1.85, pz=Math.cos(a)*1.85;
       cyl(g,.24,.12,3.5,oceanColors[k],px,2.2,pz);
       cone(g,.24,.55,warm,px,4.1,pz);
     }
     // Central Jungian Persona & Shadow Obelisk
     const jung=mesh(g,new THREE.BoxGeometry(.7,2.8,.7),dark,0,2.0,0);
     box(jung,.72,.8,.72,cream,0,.6,0); // Light Mask
     box(jung,.72,.8,.72,mat('#212121'),0,-.6,0); // Shadow
     // Kaleidoscopic Personality Prism
     const kaleido=mesh(g,new THREE.IcosahedronGeometry(.85,0),gold,0,4.2,0);
     animated.push({obj:kaleido,kind:'halo'});
     book(g,-1.6,.7,1.8,mat('#ab47bc'));
     book(g,1.6,.7,1.8,mat('#00bcd4'));
   }

   // -------------------------------------------------------------
   // Island 06: 社會共振島 (Social Psychology & Influence)
   // Asch Conformity Lines Colonnade & Empathy Network Nodes
   // -------------------------------------------------------------
   else if(i===5){
     // Asch Experiment Line Segment Monument (3 varied lines vs standard line)
     const colMat=[mat('#ff7043'),mat('#26a69a'),gold,mat('#26a69a')];
     const heights=[2.6,1.6,2.6,3.6];
     for(let k=0;k<4;k++){
       const x=-1.6+k*1.05;
       cyl(g,.20,.20,heights[k],colMat[k],x,.45+heights[k]/2,1.3);
       ball(g,.16,white,x,.45+heights[k]+.16,1.3);
     }
     // Concentric Circle Agora of Social Facilitation
     for(let k=0;k<6;k++){
       const a=k*Math.PI/3;
       cyl(g,.16,.16,2.8,cream,Math.sin(a)*1.8,1.9,Math.cos(a)*1.8-.6);
     }
     // Empathy Arch of Prosocial Connection
     torus(g,1.4,.14,mat('#ec407a'),0,2.8,-.6);
     book(g,-1.8,.7,1.5,mat('#ff7043'));
     bench(g,2.0,1.8);
   }

   g.children.slice(landmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building=data.courses[i].id;}));
   tree(g,-2.3,-1,i%3,.9);
   tree(g,2.3,-1,(i+1)%3,.75);
   lamp(g,-2.6,1.3);
   lamp(g,2.6,1.3);
 }

 const nodes=[...locations].map(([id,g])=>({
   id,
   x:g.position.x,
   z:g.position.z,
   radius:g.userData.radius,
   height:g.position.y+.49,
   elevation:g.position.y,
   walkRadius:g.userData.walkRadius
 }));

 const connections=connectionsFor(data.courses.length);
 const styles=bridgeStylesFor(connections.length);
 const network=buildNetwork(nodes,connections.map((edge,i)=>[...edge,styles[i]]));
 const walkSurfaces=[];

 const pathMat=mat('#f4dec1');
 for(const n of nodes){
   const ring=mesh(scene,new THREE.RingGeometry(n.walkRadius-.3,n.walkRadius+.3,72),pathMat,n.x,n.height,n.z);
   ring.rotation.x=-Math.PI/2;
   walkSurfaces.push(ring);
 }
 const bridgeView=createBridges(scene,network);
 walkSurfaces.push(...bridgeView.surfaces);

 const residents=createResidents(scene,network,data.residents,{onResident,onHost});
 pickables.push(...residents.pickables);

 // Background islands
 for(const [x,z,r,h] of [[-29,3,2.5,.5],[-13,-28,2.1,1.8],[31,-6,3.1,.35],[0,31,2.7,.9]]){
   const factor=Math.max(1,mapExtent/27);
   let g=island(x*factor,z*factor,r,cream,h);
   tree(g,-.7,0,2,.7);tree(g,.7,-.4,0,.8);
 }

 const halloween=createDecorations(scene,camera,locations,data.appearance);
 const environment=createSeascape(scene,locations);

 const waveMat=mat('#ece1ed');
 for(let i=0;i<45;i++){
   let x=Math.sin(i*5.13)*37,z=Math.cos(i*2.71)*32;
   if([...locations.values()].some(g=>Math.hypot(x-g.position.x,z-g.position.z)<6))continue;
   box(scene,1.1+(i%3)*.4,.015,.055,waveMat,x,-1.2,z);
 }

 function courseNameFor(id){return data.courses.find(c=>c.id===id)?.name||data.center.name;}

 for(const [id,g]of locations){
   g.userData.islandId=id;
   g.traverse(o=>{if(o.isMesh){o.userData.island=id;pickables.push(o);}});
   const button=document.createElement('button');
   button.title=id==='center'?data.center.name:courseNameFor(id);
   button.setAttribute('aria-label',button.title);
   button.className='island-label'+(id==='center'?' center':'');
   button.dataset.island=id;
   const course=data.courses.find(c=>c.id===id);
   const plate=document.createElement('span');
   plate.className='island-name-plate';
   const number=document.createElement('b');
   number.textContent=id==='center'?'✦':String(course.order).padStart(2,'0');
   plate.append(number,document.createTextNode(id==='center'?data.center.name:course.name));
   button.append(plate);
   button.addEventListener('click',e=>{e.stopPropagation();focusIsland(id);});
   const object=new CSS2DObject(button);
   object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);
   g.add(object);
   labels.push({id,object,button});
 }

 for(const [id,g]of locations){
   const button=document.createElement('button');
   button.className='building-label';
   button.dataset.building=id;
   button.innerHTML=id==='center'?'<span>進入書房 ✦</span>':'<span>教材 ✦</span>';
   button.setAttribute('aria-label',id==='center'?'點選中央島建築進入3D書房':'點選島建築閱讀該課教材');
   button.addEventListener('click',e=>{e.stopPropagation();enterBuilding(id);});
   const object=new CSS2DObject(button);
   object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);
   g.add(object);
   buildingLabels.push({id,object,button});
 }

 // =========================================================================
 // 3. CHARACTER CONTROLLER (張春興教授 + 小白狗可操控系統)
 // =========================================================================
 const promptOverlay = document.createElement('div');
 promptOverlay.className = 'player-prompt-hud';
 promptOverlay.style.cssText = 'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(28,27,32,0.85);backdrop-filter:blur(8px);color:#fff;padding:8px 18px;border-radius:24px;font-size:13px;pointer-events:none;z-index:90;display:flex;align-items:center;gap:12px;box-shadow:0 6px 18px rgba(0,0,0,0.22);border:1px solid rgba(255,255,255,0.18);transition:opacity 0.2s;';
 promptOverlay.innerHTML = '<span class="prompt-icon">🎮</span><span class="prompt-text"><b>[WASD / 箭頭方向鍵]</b> 操控張春興教授 ｜ <b>[C]</b> 切換跟隨視角 ｜ <b>[空白鍵]</b> 跳躍 ｜ 點擊地面亦可移動</span>';
 host.appendChild(promptOverlay);

 const controller = createCharacterController(scene, network, locations, camera, controls, {
   hostElement: host,
   onSelectCourse: onSelect,
   onOpenResident: onResident,
   onOpenHost: onHost,
   onProximityChange: (prox) => {
     if (prox.resident) {
       promptOverlay.innerHTML = `<span class="prompt-icon">💬</span><span class="prompt-text">按 <b>[E]</b> 或 <b>[Enter]</b> 與 <b>${prox.resident.name}</b> 交談</span>`;
     } else if (prox.landmark) {
       const isCenter = prox.landmark === 'center';
       const name = isCenter ? data.center.name : courseNameFor(prox.landmark);
       promptOverlay.innerHTML = `<span class="prompt-icon">📖</span><span class="prompt-text">按 <b>[E]</b> 或 <b>[Enter]</b> 探索 <b>${name}</b> 教材</span>`;
     } else {
       promptOverlay.innerHTML = '<span class="prompt-icon">🎮</span><span class="prompt-text"><b>[WASD]</b> 操控探索 ｜ <b>[Shift]</b> 衝刺 ｜ <b>[空白鍵]</b> 跳躍 ｜ <b>[C]</b> 切換跟隨視角 ｜ 點擊地面移動</span>';
     }
   }
 });

 let reduced=false,frame=null,flight=null,selected=null,light='day',theme='morning',elapsed=0,last=0,rendering=false,shadowElapsed=0,labelThrottle=0,lastSelectedForLabel=null;
 let layoutKey='',overviewNeedsSpace='fit';

 function layoutLabels(){
   labels.forEach(l=>l.button.style.visibility=selected?'hidden':'visible');
   buildingLabels.forEach(l=>l.button.style.visibility=l.id===selected?'visible':'hidden');
   if(selected){
     if(layoutKey!==selected){
       leaders.replaceChildren();
       layoutKey=selected;
     }
     placeOverviewLabels(camera,locations,buildingLabels.filter(l=>l.id===selected),host.clientWidth,host.clientHeight);
   }
 }

 const personLines=document.createElementNS('http://www.w3.org/2000/svg','g');
 function layoutPeople(){
   if(!selected){
     residents.labels.forEach(l=>l.button.style.visibility='hidden');
     personLines.replaceChildren();
     return;
   }
   const selectedIsland=locations.get(selected);
   const w=host.clientWidth,h=host.clientHeight,hostRect=host.getBoundingClientRect(),occupied=[];
   const rectFor=e=>{const r=e.getBoundingClientRect();return{x:r.left-hostRect.left,y:r.top-hostRect.top,w:r.width,h:r.height};};
   for(const l of [...labels,...buildingLabels])if(l.button.style.visibility!=='hidden')occupied.push(rectFor(l.button));
   for(const el of host.parentElement.querySelectorAll('.map-guide,.overview,.map-heading')){const r=rectFor(el);if(r.y<h&&r.y+r.h>0)occupied.push(r);}
   const entries=[...residents.labels].sort((a,b)=>Number(b.actor.hover)-Number(a.actor.hover));
   if(!personLines.isConnected)leaders.appendChild(personLines);
   personLines.replaceChildren();

   for(const l of entries){
     const position=l.actor.g.position;
     const isHost=l.button.dataset.hostIsland;
     const near= Math.hypot(position.x-selectedIsland.position.x,position.z-selectedIsland.position.z)<selectedIsland.userData.radius+.7;
     if((isHost&&isHost!==selected)||!near){l.button.style.visibility='hidden';continue;}
     const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera),rawX=(p.x+1)*w/2,rawY=(-p.y+1)*h/2;
     const bw=l.button.offsetWidth,bh=l.button.offsetHeight;
     if(p.z>1||rawX<-30||rawX>w+30||rawY<-30||rawY>h+30){l.button.style.visibility='hidden';continue;}
     l.button.style.visibility='visible';
     const fits=(x,y)=>x>=bw/2+3&&x<=w-bw/2-3&&y>=bh/2+6&&y<=h-bh/2-8&&!occupied.some(r=>x-bw/2<r.x+r.w+2&&x+bw/2>r.x-2&&y-bh/2<r.y+r.h+2&&y+bh/2>r.y-2);
     let choices=[];
     for(const dy of [0,-24,24,-48,48,-72,72]){
       for(const dx of [0,-25,25,-50,50,-75,75]){
         let x=rawX+dx,y=rawY+dy;
         if(fits(x,y))choices.push({x,y,cost:Math.hypot(dx,dy)});
       }
     }
     if(!choices.length){
       for(let y=bh/2+8;y<h-bh/2-10;y+=12)for(let x=bw/2+6;x<w-bw/2-5;x+=12)if(fits(x,y))choices.push({x,y,cost:Math.hypot(x-rawX,y-rawY)});
     }
     choices.sort((a,b)=>a.cost-b.cost);
     const best=choices[0]||{x:Math.max(bw/2+3,Math.min(w-bw/2-3,rawX)),y:Math.max(bh/2+8,Math.min(h-bh/2-8,rawY))};
     l.button.style.left=`${best.x-rawX}px`;
     l.button.style.top=`${best.y-rawY}px`;
     occupied.push({x:best.x-bw/2,y:best.y-bh/2,w:bw,h:bh});
   }
 }

 function render(now=0){
   frame=null;
   rendering=true;
   const dt=Math.min((now-last)/1000,.05)||0;
   last=now;

   if(interior.active){
     renderer.shadowMap.autoUpdate=true;
     interior.render(dt,reduced);
     renderer.shadowMap.autoUpdate=false;
     rendering=false;
     if(!reduced)frame=requestAnimationFrame(render);
     return;
   }

   if(!reduced&&!flight){
     elapsed+=dt;
     shadowElapsed+=dt;
     if(shadowElapsed>.8){
       renderer.shadowMap.needsUpdate=true;
       shadowElapsed=0;
     }

     // Update Player Controller
     controller.update(dt);

     residents.update(dt);
     controller.setResidentsCache(residents.snapshot());
     halloween.update(dt);
     environment.update(dt);

     animated.forEach(({obj,kind,base})=>{
       if(kind==='boat')obj.position.y=base+Math.sin(elapsed*.8+obj.position.x)*.07;
       if(kind==='halo')obj.rotation.y=elapsed*.25;
       if(kind==='gear')obj.rotation.z=Math.sin(elapsed*1.2)*.14;
       if(kind==='bell')obj.rotation.z=Math.sin(elapsed*3)*.15;
     });
   }

   if(flight&&!reduced){
     const t=Math.min((performance.now()-flight.start)/650,1),s=t*t*t*(10+t*(-15+6*t));
     controls.target.lerpVectors(flight.targetFrom,flight.targetTo,s);
     const orbit=new THREE.Spherical(THREE.MathUtils.lerp(flight.orbitFrom.radius,flight.orbitTo.radius,s),THREE.MathUtils.lerp(flight.orbitFrom.phi,flight.orbitTo.phi,s),THREE.MathUtils.lerp(flight.orbitFrom.theta,flight.orbitTo.theta,s));
     camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));
     camera.zoom=Math.exp(THREE.MathUtils.lerp(Math.log(flight.zoomFrom),Math.log(flight.zoomTo),s));
     camera.updateProjectionMatrix();
     if(t===1){
       camera.position.copy(flight.to);
       controls.target.copy(flight.targetTo);
       camera.zoom=flight.zoomTo;
       flight=null;
       controls.enableDamping=!reduced;
     }
   }

   if(!controller.state.cameraFollow) {
     controls.update();
   }

   if(!selected&&!flight&&overviewNeedsSpace&&!controller.state.cameraFollow){
     fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);
     if(overviewNeedsSpace==='fit')fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight,true);
     else{
       camera.zoom*=.90;
       camera.updateProjectionMatrix();
       fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);
     }
     overviewNeedsSpace=false;
   }

   halloween.faceCamera();
   renderer.render(scene,camera);
   labelRenderer.render(scene,camera);
   labelThrottle += dt;
   if (labelThrottle > 0.08 || flight || selected !== lastSelectedForLabel) {
     labelThrottle = 0;
     lastSelectedForLabel = selected;
     layoutLabels();
     layoutPeople();
   }

   rendering=false;
   if(!reduced||flight||controller.state.isMoving||controller.state.cameraFollow)frame=requestAnimationFrame(render);
 }

 function invalidate(){
   if(frame===null&&!rendering)frame=requestAnimationFrame(render);
 }

 function resize(){
   const w=host.clientWidth,h=host.clientHeight;
   const worldWidth=mapWidth*(w<500?76/83:w<800?79/83:1);
   camera.left=-worldWidth/2;
   camera.right=worldWidth/2;
   camera.top=worldWidth/(w/h)/2;
   camera.bottom=-camera.top;
   if(!selected){
     camera.zoom=1;
     overviewNeedsSpace='fit';
   }
   layoutKey='';
   camera.updateProjectionMatrix();
   renderer.setSize(w,h);
   labelRenderer.setSize(w,h);
   invalidate();
 }

 const resizeObserver=new ResizeObserver(resize);
 resizeObserver.observe(host);

 function fly(target,zoom,position=null,kind=null){
   if(reduced){
     controls.target.copy(target);
     if(position)camera.position.copy(position);
     camera.zoom=zoom;
     camera.updateProjectionMatrix();
     flight=null;
   }else{
     controls.enableDamping=false;
     const destination=position?position.clone():controls.target.clone().add(cameraOffset.clone().multiplyScalar(camera.zoom/zoom));
     const offsetFrom=camera.position.clone().sub(controls.target),orbitFrom=new THREE.Spherical().setFromVector3(offsetFrom);
     const offsetTo=destination.clone().sub(target),orbitTo=new THREE.Spherical().setFromVector3(offsetTo);
     let dTheta=orbitTo.theta-orbitFrom.theta;
     while(dTheta>Math.PI)dTheta-=Math.PI*2;
     while(dTheta<-Math.PI)dTheta+=Math.PI*2;
     orbitTo.theta=orbitFrom.theta+dTheta;
     flight={kind,start:performance.now(),from:camera.position.clone(),to:destination.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),orbitFrom,orbitTo,zoomFrom:camera.zoom,zoomTo:zoom};
   }
   invalidate();
 }

 function bestOverview(){
   const target=new THREE.Vector3(0,3,0),preview=camera.clone();
   preview.position.copy(target).add(cameraOffset.clone());
   preview.zoom=1;
   preview.lookAt(target);
   preview.updateProjectionMatrix();
   preview.updateMatrixWorld(true);
   fitOverview(preview,{target},locations,host.clientWidth,host.clientHeight,true);
   return {target,position:preview.position.clone(),zoom:preview.zoom};
 }

 function overview(){
   if(interior.active)leaveInterior();
   const pose=bestOverview();
   selected=null;
   overviewNeedsSpace=false;
   labels.forEach(l=>l.button.classList.remove('selected'));
   onFocus?.(null);
   fly(pose.target,pose.zoom,pose.position,'overview');
 }

 const interior=createInterior(renderer,host,{
   appearance:data.appearance,
   onMaterial:()=>onSelect('center'),
   onExit:leaveInterior,
   onInvalidate:invalidate
 });

 function leaveInterior(){
   interior.leave();
   controls.enabled=!controller.state.cameraFollow;
   labelRenderer.domElement.hidden=false;
   leaders.style.display='';
   promptOverlay.style.display='';
   onFocus?.('center');
   invalidate();
 }

 function enterBuilding(id){
   if(id!=='center'){onSelect(id);return;}
   interior.enter();
   controls.enabled=false;
   flight=null;
   labelRenderer.domElement.hidden=true;
   leaders.style.display='none';
   promptOverlay.style.display='none';
   onFocus?.('interior');
   invalidate();
 }

 const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
 let down=null;

 renderer.domElement.addEventListener('pointerdown',e=>{
   down={x:e.clientX,y:e.clientY};
 });

 renderer.domElement.addEventListener('pointerup',e=>{
   if(!down)return;
   const dist = Math.hypot(e.clientX-down.x,e.clientY-down.y);
   if(dist>6){
     if(!selected){overviewNeedsSpace=true;invalidate();}
     return;
   }
   if(interior.active){interior.pick(e);return;}

   const rect=renderer.domElement.getBoundingClientRect();
   pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   raycaster.setFromCamera(pointer,camera);

   const hit=raycaster.intersectObjects(pickables,false)[0];
   if(hit?.object.userData.resident){
     onResident?.(hit.object.userData.resident);
   }else if(hit?.object.userData.host){
     onHost?.();
   }else if(hit){
     const id=hit.object.userData.island;
     // Click to move player directly to the point on the island ground
     if(hit.point){
       controller.moveTo(hit.point.x, hit.point.z);
       invalidate();
     }
     if(selected===id&&hit.object.userData.building===id)enterBuilding(id);
     else focusIsland(id);
   }
 });

 renderer.domElement.addEventListener('webglcontextlost',e=>{
   e.preventDefault();
   if(frame)cancelAnimationFrame(frame);
   onFailure?.();
 });

 function focusIsland(id){
   if(interior.active)leaveInterior();
   const g=locations.get(id);
   if(!g)return;
   selected=id;
   labels.forEach(l=>l.button.classList.toggle('selected',l.id===id));
   onFocus?.(id);
   const phone=host.clientWidth<500,target=g.position.clone();
   target.y+=id==='center'?1.5:1;
   const zoom=(camera.right-camera.left)*(id==='center'?(phone?.72:.36):(phone?.82:.46))/(g.userData.radius*2);
   fly(target,Math.min(controls.maxZoom,zoom));
   requestAnimationFrame(()=>{
     if(selected===id&&!document.querySelector('#panel:not([hidden]),dialog[open]'))
       buildingLabels.find(l=>l.id===id)?.button.focus({preventScroll:true});
   });
 }

 resize();
 invalidate();

 return {
   overview,
   select(id){
     if(interior.active&&id==='center')return;
     focusIsland(id);
     controller.teleportTo(id);
   },
   setTheme(t){
     theme=t;layoutKey='';
     const color=t==='night'?palette.night:t==='mist'?palette.mist:palette.water;
     water.color.set(color);
     renderer.setClearColor(color);
     waveMat.color.set(t==='night'?'#68577f':'#ece1ed');
     invalidate();
   },
   setLighting(v){
     renderer.shadowMap.needsUpdate=true;
     light=v;
     const night=v==='night';
     ambient.intensity=night?1.65:v==='dusk'?1.8:1.9;
     sun.intensity=night?.7:v==='dusk'?1.6:2.5;
     sun.color.set(night?'#dec8f1':v==='dusk'?'#ffd39b':'#fff0dd');
     sun.position.set(night?-25:-30,night?35:55,v==='dusk'?-20:22);
     warm.emissiveIntensity=night?2.8:v==='dusk'?1.1:.15;
     halloween.setLighting(v);
     environment.setLighting(v);
     invalidate();
   },
   setReduced(v){
     renderer.shadowMap.needsUpdate=true;
     reduced=v;
     controls.enableDamping=!v;
     if(v){
       residents.pause();
       if(flight){
         camera.position.copy(flight.to);
         controls.target.copy(flight.targetTo);
         camera.zoom=flight.zoomTo;
         camera.updateProjectionMatrix();
       }
       flight=null;
       if(frame){cancelAnimationFrame(frame);frame=null;}
       animated.forEach(a=>{if(a.kind==='boat')a.obj.position.y=a.base;});
     }
     invalidate();
   },
   inspectWalkways,
   controller,
   toggleFollowMode: () => {
     const isFollow = controller.toggleCameraFollow();
     invalidate();
     return isFollow;
   },
   getDiagnostics(){
     return {
       transition:flight?.kind||null,
       target:controls.target.toArray(),
       interior:interior.snapshot(),
       environment:environment.snapshot(),
       islandLayout:nodes.map(n=>({...n})),
       residents:residents.snapshot(),
       hosts:residents.hostSnapshot(),
       selected,
       player: {
         x: controller.state.x,
         y: controller.state.y,
         z: controller.state.z,
         followCam: controller.state.cameraFollow
       },
       theme,
       light,
       zoom:camera.zoom
     };
   }
 };

 function inspectWalkways(){
   scene.updateMatrixWorld(true);
   const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),bridges=[];
   for(const p of network.paths.filter(p=>p.kind==='bridge')){
     const ends=[];
     for(const [key,point]of [[p.from,p.points[0]],[p.to,p.points.at(-1)]]){
       const g=locations.get(network.vertices[key].island),dx=p.points.at(-1).x-p.points[0].x,dz=p.points.at(-1).z-p.points[0].z,len=p.length;
       let hits=0;
       for(const width of [-(p.width||1.2)*.45,0,(p.width||1.2)*.45]){
         ray.set(new THREE.Vector3(point.x+dz/Math.hypot(dx,dz)*width,30,point.z-dx/Math.hypot(dx,dz)*width),down);
         if(ray.intersectObject(g.userData.land,false).length)hits++;
       }
       ends.push({island:network.vertices[key].island,landHits:hits,samples:3});
     }
     bridges.push({from:p.from,to:p.to,ends});
   }
   let supported=0,samples=0;const gaps=[];
   const surfaces=[...walkSurfaces,...[...locations.values()].map(g=>g.userData.land)];
   for(const p of network.paths){
     for(let d=0;d<=p.length;d+=.35){
       const pt=pointAt(p,d).point;
       ray.set(new THREE.Vector3(pt.x,30,pt.z),down);
       samples++;
       const hit=ray.intersectObjects(surfaces,false)[0];
       if(hit&&Math.abs(hit.point.y-pt.y)<.32)supported++;
       else gaps.push({path:p.style?.id||p.island,point:pt,surfaceY:hit?.point.y});
     }
   }
   return {bridges,supported,samples,gaps};
 }
}
