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

export function createScene(host,data,{onSelect,onFailure,onHost,onResident,onFocus,onPersonalKnowledge}){
 const ISLAND_LAYOUT=layoutFor(data.courses.length),palette=paletteFor(data.appearance);
 const mapExtent=Math.max(...ISLAND_LAYOUT.map(n=>Math.hypot(n.x,n.z)+n.radius)),mapWidth=Math.max(120,mapExtent*2.6);
 host.dataset.dense=String(data.courses.length>8);

 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.autoUpdate=false;
 renderer.shadowMap.needsUpdate=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0xd7d0e7);

 host.addEventListener('wheel',e=>{
   if(e.target===renderer.domElement)return;
   renderer.domElement.dispatchEvent(new WheelEvent('wheel',{deltaX:e.deltaX,deltaY:e.deltaY,deltaZ:e.deltaZ,deltaMode:e.deltaMode,clientX:e.clientX,clientY:e.clientY,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey,metaKey:e.metaKey,cancelable:true,bubbles:false}));
   e.preventDefault();
 },{passive:false});

 host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','拖曳旋轉課程群島，或使用鍵盤方向鍵/觸控操作人物自由探索');

 const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');
 leaders.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';
 leaders.setAttribute('aria-hidden','true');
 host.appendChild(leaders);

 const labelRenderer=new CSS2DRenderer();
 labelRenderer.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';
 host.appendChild(labelRenderer.domElement);

 // Expanded camera view frustum with deep zoom range
 const camera=new THREE.OrthographicCamera(-mapWidth/2,mapWidth/2,mapWidth/2,-mapWidth/2,.1,Math.max(400,mapExtent*8));
 const cameraOffset=new THREE.Vector3(55,75,90).multiplyScalar(Math.max(1,mapExtent/45));
 camera.position.copy(cameraOffset).add(new THREE.Vector3(0,4,0));
 camera.lookAt(0,4,0);

 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enablePan=false;
 controls.enableDamping=true;
 controls.dampingFactor=.08;
 controls.minZoom=0.12;  // High-altitude panoramic map view
 controls.maxZoom=48.0;  // Close-up character inspection view
 controls.minPolarAngle=.18;
 controls.maxPolarAngle=Math.PI/2.4;
 controls.target.set(0,3.8,0);
 controls.update();

 const ambient=new THREE.HemisphereLight(0xfff5e4,0xb4a4c5,2.1);
 scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xfffbf2,2.6);
 sun.position.set(-45,85,35);
 sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{
   left:-mapExtent*1.3,
   right:mapExtent*1.3,
   top:mapExtent*1.3,
   bottom:-mapExtent*1.3,
   near:1,
   far:Math.max(250,mapExtent*6)
 });
 sun.shadow.bias=-.0008;
 scene.add(sun);

 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.80,flatShading:true,...extra});
 const cream=mat('#fff2e2'),rock=mat(palette.rock),grass=mat(palette.grass),wood=mat('#c9af9c'),white=mat('#fffaf1'),dark=mat('#7d6b88'),teal=mat(palette.roof),orange=mat('#efa86b'),purple=mat('#b59cd0'),gold=mat('#ffd700',{metalness:.28,roughness:.45});
 const warm=new THREE.MeshStandardMaterial({color:0xffe4a1,emissive:0xffd27c,emissiveIntensity:.18});

 const water=new THREE.MeshBasicMaterial({color:'#d7d0e7'});
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1200,mapExtent*14),Math.max(1200,mapExtent*14)),water);
 ocean.rotation.x=-Math.PI/2;
 ocean.position.y=-1.25;
 scene.add(ocean);

 const shadowOcean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(300,mapExtent*5),Math.max(300,mapExtent*5)),new THREE.ShadowMaterial({color:0x4d3b5c,opacity:.18}));
 shadowOcean.rotation.x=-Math.PI/2;
 shadowOcean.position.y=-1.24;
 shadowOcean.receiveShadow=true;
 scene.add(shadowOcean);

 const mesh=(parent,geo,material,x=0,y=0,z=0)=>{
   let m=new THREE.Mesh(geo,material);
   m.position.set(x,y,z);
   m.castShadow=true;
   m.receiveShadow=true;
   parent.add(m);
   return m;
 };
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,r1,r2,h,m,x=0,y=0,z=0,n=12)=>mesh(p,new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.IcosahedronGeometry(r,1),m,x,y,z);
 const cone=(p,r,h,m,x=0,y=0,z=0,n=10)=>mesh(p,new THREE.ConeGeometry(r,h,n),m,x,y,z);
 const torus=(p,r,t,m,x,y,z)=>mesh(p,new THREE.TorusGeometry(r,t,8,24),m,x,y,z);

 function tree(p,x,z,type=0,scale=1){
   const g=new THREE.Group();g.position.set(x,.25,z);g.scale.setScalar(scale);p.add(g);
   cyl(g,.15,.22,1.6,wood,0,.8);
   if(type===1){cone(g,1.1,2.0,mat('#2e7d32'),0,2.1);cone(g,.85,1.7,mat('#43a047'),0,3.0);}
   else if(type===2){ball(g,1.05,mat('#ec407a'),0,2.1,0);ball(g,.82,mat('#f48fb1'),.5,2.5,.1);}
   else{ball(g,1.05,mat('#388e3c'),0,2.1,0);ball(g,.85,mat('#66bb6a'),.5,2.5,.1);}
 }

 function bench(p,x,z,angle=0){
   const g=new THREE.Group();g.position.set(x,.75,z);g.rotation.y=angle;p.add(g);
   box(g,1.8,.18,.55,wood,0,0,0);
   box(g,1.8,.65,.14,wood,0,.35,-.25);
   for(const dx of [-.65,.65]) box(g,.14,.75,.4,dark,dx,-.35,0);
 }

 const locations=new Map(),labels=[],buildingLabels=[],pickables=[],animated=[];

 // =========================================================================
 // 1. CENTRAL ISLAND: 元認知與心靈總所 (Grand Triple-Tier Academic Acropolis)
 // =========================================================================
 const mainLayout=ISLAND_LAYOUT[0];
 const center=new THREE.Group();
 center.position.set(mainLayout.x,mainLayout.elevation,mainLayout.z);
 center.userData.radius=mainLayout.radius;
 center.userData.elevation=mainLayout.elevation;
 center.userData.walkRadius=mainLayout.radius*0.82;
 scene.add(center);
 locations.set('center',center);

 const depthC=mainLayout.elevation+1.5;
 // Tier 1 (Base): Broad lawn ring (R=14.5)
 cyl(center,14.2,15.2,depthC,rock,0,.2-depthC/2,0,16);
 cyl(center,14.5,14.5,.25,orange,0,.14,0,16);
 center.userData.land=cyl(center,14.2,14.3,.22,grass,0,.35,0,16);
 // Tier 2 (Middle): Marble Arcade Colonnade Terrace (R=10.2, elevated +0.8m)
 cyl(center,10.2,10.8,.85,cream,0,.8,0,16);
 cyl(center,10.0,10.0,.18,mat('#f5ebd9'),0,1.25,0,16);
 // Tier 3 (Upper): Golden Sanctuary Podium (R=6.2, elevated +1.6m)
 cyl(center,6.2,6.8,.9,cream,0,1.7,0,16);
 cyl(center,6.0,6.0,.15,mat('#ffe5be'),0,2.15,0,16);

 const centerLandmarkStart=center.children.length;

 // 12 Classical Corinthian Columns with Arched Entablature
 for(let c=0; c<12; c++){
   const angle=c*Math.PI*2/12;
   const px=Math.sin(angle)*8.2, pz=Math.cos(angle)*8.2;
   cyl(center,.26,.26,3.6,white,px,3.1,pz);
   cyl(center,.38,.30,.38,cream,px,1.4,pz);
   cyl(center,.30,.38,.38,cream,px,4.9,pz);
 }
 // Grand Rotunda Library Dome
 cyl(center,3.4,3.8,3.2,cream,0,3.8,0,16);
 cyl(center,2.8,2.8,3.6,orange,0,6.2,0,16);
 cone(center,3.8,2.6,teal,0,9.2,0,16);

 // Fountain of Metacognition
 cyl(center,2.0,2.0,.4,teal,0,10.6);
 const halo=torus(center,2.6,.12,gold,0,12.0,0);
 animated.push({obj:halo,kind:'halo'});

 // 3D Psychology Symbol: Greek Letter Psi (Ψ) Monument
 const psiGroup=new THREE.Group();
 psiGroup.position.set(0,13.2,0);
 center.add(psiGroup);
 cyl(psiGroup,.22,.22,3.6,gold,0,0,0);
 const psiArmL=torus(psiGroup,1.2,.15,gold,-.80,.45,0); psiArmL.rotation.z=Math.PI/4;
 const psiArmR=torus(psiGroup,1.2,.15,gold,.80,.45,0); psiArmR.rotation.z=-Math.PI/4;
 box(psiGroup,.55,.18,.20,gold,-1.65,1.3,0);
 box(psiGroup,.55,.18,.20,gold,1.65,1.3,0);
 box(psiGroup,.55,.18,.20,gold,0,1.85,0);
 ball(psiGroup,.42,warm,0,2.2,0);
 animated.push({obj:psiGroup,kind:'halo'});

 // Statues, Benches and Trees in the vast Academic Promenade
 bench(center,-7.2,3.2,0.4);
 bench(center,7.2,3.2,-0.4);
 bench(center,0,-8.5,Math.PI);
 tree(center,-10.8,-4.5,1,1.3);
 tree(center,10.8,-4.5,0,1.3);
 tree(center,-9.8,6.2,2,1.2);
 tree(center,9.8,6.2,0,1.2);

 center.children.slice(centerLandmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building='center';}));

 // =========================================================================
 // 1.5 PERSONAL ISLAND: 個人心智島 · 我的知識寶庫 (Personal Knowledge Sanctuary)
 // =========================================================================
 const personalLayout = ISLAND_LAYOUT.find(n => n.id === 'island-personal') || { id: 'island-personal', x: -4.0, z: -68.0, radius: 12.0, elevation: 3.2 };
 const personal = new THREE.Group();
 personal.position.set(personalLayout.x, personalLayout.elevation, personalLayout.z);
 personal.userData.radius = personalLayout.radius;
 personal.userData.elevation = personalLayout.elevation;
 personal.userData.walkRadius = personalLayout.radius * 0.82;
 scene.add(personal);
 locations.set('island-personal', personal);

 const depthP = personalLayout.elevation + 1.5;
 const personalLandmarkStart = personal.children.length;

 // Tier 1: Floating Amethyst & Celestial Stone Foundation
 cyl(personal, 11.6, 12.5, depthP, mat('#2d203a'), 0, .2 - depthP / 2, 0, 16);
 cyl(personal, 11.8, 11.8, .22, gold, 0, .14, 0, 16);
 personal.userData.land = cyl(personal, 11.6, 11.7, .20, mat('#856b9c'), 0, .32, 0, 16);

 // Tier 2: Marble Study Terrace (R=7.8)
 cyl(personal, 7.8, 8.4, .85, cream, 0, .80, 0, 16);
 cyl(personal, 7.6, 7.6, .18, mat('#f3e8f8'), 0, 1.25, 0, 16);

 // Tier 3: Mind Sanctum Pavilion (知識研習聖所)
 for (let c = 0; c < 6; c++) {
   const angle = c * Math.PI / 5 + Math.PI / 2;
   const px = Math.sin(angle) * 4.2, pz = Math.cos(angle) * 4.2;
   cyl(personal, .18, .18, 3.2, white, px, 2.8, pz);
   ball(personal, .24, gold, px, 4.5, pz);
 }
 torus(personal, 4.4, .18, gold, 0, 4.5, 0);
 cone(personal, 4.2, 1.8, mat('#4a2b66'), 0, 5.5, 0, 16);
 ball(personal, .45, warm, 0, 6.6, 0);

 // Executive Knowledge Desk with Open Glowing Tome
 box(personal, 2.6, .85, 1.4, mat('#4e342e'), 0, 1.35, -1.2);
 box(personal, .85, .08, .55, white, 0, 1.82, -1.2);
 box(personal, .40, .09, .52, mat('#fdf5e6'), -.2, 1.83, -1.2);
 box(personal, .40, .09, .52, mat('#fdf5e6'), .2, 1.83, -1.2);
 cyl(personal, .08, .12, .45, gold, -.9, 2.0, -1.2);
 ball(personal, .18, mat('#2e7d32', { emissive: '#4caf50', emissiveIntensity: 0.8 }), -.9, 2.25, -1.2);

 // 6 Knowledge Resonance Crystal Pedestals (representing the 6 domains)
 const crystalColors = ['#00b4d8', '#ffb703', '#3a86ff', '#e63946', '#8338ec', '#fb5607'];
 for (let k = 0; k < 6; k++) {
   const angle = -1.8 + k * (Math.PI * 2 / 7);
   const px = Math.cos(angle) * 5.6, pz = Math.sin(angle) * 5.6;
   cyl(personal, .35, .45, 1.4, cream, px, 1.5, pz);
   ball(personal, .35, mat(crystalColors[k], { roughness: .2, metalness: .3, emissive: crystalColors[k], emissiveIntensity: 0.5 }), px, 2.5, pz);
   const cryHalo = torus(personal, .55, .05, gold, px, 2.5, pz);
   animated.push({ obj: cryHalo, kind: 'halo' });
 }

 // Floating Mind Rings
 const mindRing = torus(personal, 2.6, .10, gold, 0, 7.6, 0);
 animated.push({ obj: mindRing, kind: 'halo' });

 // Companion NPC: 思思 (Mind Guide)
 const guideGroup = new THREE.Group();
 guideGroup.position.set(1.4, 1.3, -1.2);
 personal.add(guideGroup);
 cyl(guideGroup, .22, .32, 1.1, mat('#ba68c8'), 0, .55, 0);
 ball(guideGroup, .26, mat('#ffe0b2'), 0, 1.25, 0);
 cone(guideGroup, .28, .55, mat('#4a148c'), 0, 1.6, 0);
 box(guideGroup, .3, .4, .08, mat('#ffe082'), -.3, .8, .2);
 guideGroup.userData.resident = 'guide-sisi';

 // Scenic Benches and Cherry Blossom Trees overlooking the ocean
 bench(personal, -5.5, 3.2, 0.4);
 bench(personal, 5.5, 3.2, -0.4);
 tree(personal, -7.8, -2.8, 2, 1.3);
 tree(personal, 7.8, -2.8, 2, 1.3);

 personal.children.slice(personalLandmarkStart).forEach(o => o.traverse(m => {
   if (m.isMesh) m.userData.building = 'island-personal';
 }));

 // =========================================================================
 // 2. SIX ENLARGED COURSE ISLANDS WITH HIGH IDIOSYNCRATIC GEOMETRIES
 // =========================================================================
 const accents=[mat('#00b4d8'),mat('#ffb703'),mat('#3a86ff'),mat('#e63946'),mat('#8338ec'),mat('#fb5607')];

 for(let i=0; i<data.courses.length; i++){
   const layout=ISLAND_LAYOUT.find(n => n.id === data.courses[i].id) || ISLAND_LAYOUT[i+2];
   const r=layout.radius;
   const elev=layout.elevation;
   const g=new THREE.Group();
   g.position.set(layout.x,elev,layout.z);
   g.userData.radius=r;
   g.userData.elevation=elev;
   g.userData.walkRadius=r*0.84;
   scene.add(g);
   locations.set(data.courses[i].id,g);

   const depth=elev+1.45;
   const landmarkStart=g.children.length;

   // -------------------------------------------------------------
   // Island 01: 感知覺醒島 (Prismatic Star Bastion - Sensation)
   // 6-Faceted crystal star geometry with emergent quartz spires
   // -------------------------------------------------------------
   if(i===0){
     cyl(g,r*.95,r*1.12,depth,rock,0,.2-depth/2,0,6);
     cyl(g,r,r,.25,accents[0],0,.14,0,6);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,6);

     // Emergent Quartz Crystal Clusters along the perimeter cliffs
     for(let k=0; k<6; k++){
       const a=k*Math.PI/3;
       const cx=Math.sin(a)*r*0.82, cz=Math.cos(a)*r*0.82;
       const crystal=mesh(g,new THREE.OctahedronGeometry(1.6,0),mat('#80deea',{transparent:true,opacity:.85}),cx,.9,cz);
       crystal.scale.set(0.7,1.8,0.7);
     }
     // Optical Rubin's Vase Colonnade Archway
     box(g,.8,5.5,.8,mat('#3f51b5'),-2.2,3.1,0);
     box(g,.8,5.5,.8,mat('#3f51b5'),2.2,3.1,0);
     box(g,5.2,.6,1.0,mat('#00e5ff'),0,5.8,0);

     // Hovering Necker Cube Optical Illusion
     const necker=mesh(g,new THREE.BoxGeometry(2.2,2.2,2.2),mat('#00e5ff',{wireframe:true}),0,3.6,0);
     animated.push({obj:necker,kind:'halo'});
     ball(g,.5,warm,0,3.6,0);

     // Penrose Impossible Stairs Ring
     for(let s=0; s<8; s++){
       const sa=s*Math.PI*2/8;
       box(g,.9,.3+s*.16,.9,cream,Math.sin(sa)*3.2,.6+s*.12,Math.cos(sa)*3.2);
     }
     bench(g,-3.5,3.2,0.3);
     tree(g,4.2,-2.8,1,1.1);
     tree(g,-4.5,-2.5,0,1.1);
   }

   // -------------------------------------------------------------
   // Island 02: 記憶之宮島 (Roman Labyrinth Citadel - Memory)
   // Multi-tiered fortress with amphitheater steps & Pavlov belfry
   // -------------------------------------------------------------
   else if(i===1){
     // Multi-tiered stone terraces (Citadel walls)
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,12);
     cyl(g,r,r,.25,accents[1],0,.14,0,12);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,12);

     // Upper Citadel Terrace
     box(g,r*1.1,1.0,r*0.85,cream,0,1.0,-1.2);
     cyl(g,r*0.48,r*0.48,.18,mat('#e0d6c3'),0,1.55,-1.2);

     // Pavlov Bell Tower
     const belfry=box(g,3.8,2.8,3.4,cream,0,2.8,-1.2);
     for(const sx of [-1,1]) for(const sz of [-1,1]) cyl(belfry,.24,.24,3.5,gold,sx*1.4,2.2,sz*1.2);
     const belfryRoof=cone(belfry,2.8,2.0,mat('#ff8f00'),0,5.0,0,4);
     belfryRoof.rotation.y=Math.PI/4;
     const bell=cone(belfry,.75,.85,gold,0,2.2,0);
     animated.push({obj:bell,kind:'bell'});

     // Giant Ebbinghaus Sand Hourglass
     const hg=new THREE.Group(); hg.position.set(-3.8,1.8,2.2); g.add(hg);
     cone(hg,.7,.9,mat('#80deea',{transparent:true,opacity:.75}),0,.45,0);
     const hgB=cone(hg,.7,.9,mat('#80deea',{transparent:true,opacity:.75}),0,-.45,0); hgB.rotation.x=Math.PI;
     ball(hg,.22,warm,0,0,0);
     box(hg,1.5,.14,1.5,wood,0,.95,0); box(hg,1.5,.14,1.5,wood,0,-.95,0);
     animated.push({obj:hg,kind:'halo'});

     // Skinner Lever Conditioning Pavilion
     const skinner=box(g,1.4,1.1,1.4,mat('#37474f'),3.8,1.2,2.0);
     cyl(skinner,.06,.06,.6,gold,0,.6,0);
     ball(skinner,.14,mat('#76ff03'),0,1.0,0);

     bench(g,2.2,4.2,-0.5);
     tree(g,-4.5,-3.8,0,1.2);
   }

   // -------------------------------------------------------------
   // Island 03: 理性思維島 (Twin-Plateau Rift Canyon - Cognition)
   // Split canyon: System 1 (Red Crag) vs System 2 (Blue Logic)
   // -------------------------------------------------------------
   else if(i===2){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,10);
     cyl(g,r,r,.25,accents[2],0,.14,0,10);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,10);

     // Deep Rift Canyon across the center: Left Red Crag, Right Blue Logic
     box(g,r*0.42,2.4,r*0.75,mat('#c62828'),-r*0.35,1.55,0); // Left Plateau (Intuition)
     box(g,r*0.42,2.4,r*0.75,mat('#1565c0'),r*0.35,1.55,0);  // Right Plateau (Logic)

     // Spanning Decision Tree Bridge
     box(g,r*0.9,.22,2.2,wood,0,2.8,0);

     // Decision Tree rising from the canyon bed
     const treeGroup=new THREE.Group(); treeGroup.position.set(0,1.4,-3.2); g.add(treeGroup);
     cyl(treeGroup,.32,.45,3.6,wood,0,1.8,0);
     for(let b=0; b<6; b++){
       const ba=b*Math.PI*2/6;
       const branch=cyl(treeGroup,.15,.2,2.2,wood,Math.sin(ba)*1.0,3.2,Math.cos(ba)*1.0);
       branch.rotation.z=Math.sin(ba)*.5;
       branch.rotation.x=Math.cos(ba)*.5;
       ball(treeGroup,.45,gold,Math.sin(ba)*2.0,4.1,Math.cos(ba)*2.0);
     }

     // Kahneman Balance Scale
     cyl(g,.24,.3,4.6,wood,0,3.0,3.2);
     const beam=box(g,5.5,.22,.22,mat('#ff9800'),0,5.2,3.2);
     animated.push({obj:beam,kind:'gear'});
     cyl(g,.03,.03,1.8,dark,-2.2,4.4,3.2); ball(g,.65,mat('#ff5252'),-2.2,3.8,3.2);
     cyl(g,.03,.03,1.8,dark,2.2,4.4,3.2); box(g,.9,.9,.9,mat('#448aff'),2.2,3.8,3.2);

     bench(g,-3.8,4.2,0.4);
     bench(g,3.8,4.2,-0.4);
   }

   // -------------------------------------------------------------
   // Island 04: 動機與情緒島 (Spiral 5-Tier Pyramid Mountain - Emotion)
   // Maslow hierarchy spiral terraces ascending to self-actualization
   // -------------------------------------------------------------
   else if(i===3){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,10);
     cyl(g,r,r,.25,accents[3],0,.14,0,10);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,10);

     // 5 Stepped Terraces (Maslow Hierarchy)
     const pLvls=[
       {w:r*1.2,h:.65,c:mat('#d32f2f')}, // Physiological
       {w:r*0.95,h:.65,c:mat('#f57c00')}, // Safety
       {w:r*0.72,h:.65,c:mat('#fbc02d')}, // Love & Belonging
       {w:r*0.50,h:.65,c:mat('#388e3c')}, // Esteem
       {w:r*0.30,h:.65,c:mat('#7b1fa2')}  // Self-Actualization
     ];
     let yb=.6;
     for(const lvl of pLvls){
       box(g,lvl.w,lvl.h,lvl.w,lvl.c,0,yb+lvl.h/2,0);
       yb+=lvl.h;
     }
     // Apex Star of Self-Actualization
     const star=mesh(g,new THREE.OctahedronGeometry(.85,0),gold,0,yb+.55,0);
     animated.push({obj:star,kind:'halo'});
     // Pulsing Emotional Wave Ring
     const heartRing=torus(g,3.8,.12,warm,0,2.8,0);
     animated.push({obj:heartRing,kind:'halo'});

     // Thermal Springs
     cyl(g,1.4,1.4,.25,mat('#00e5ff'),-3.6,.6,2.8);
     torus(g,1.5,.18,rock,-3.6,.6,2.8);

     bench(g,3.8,3.2,-0.6);
     tree(g,4.5,-3.2,2,1.2);
   }

   // -------------------------------------------------------------
   // Island 05: 人格演繹島 (Pentagram Star Bastion - Big Five OCEAN)
   // 5 Outstretched star capes pointing towards O-C-E-A-N
   // -------------------------------------------------------------
   else if(i===4){
     // 5-Pointed Star Base Geometry
     cyl(g,r*.95,r*1.15,depth,rock,0,.2-depth/2,0,5);
     cyl(g,r,r,.25,accents[4],0,.14,0,5);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,5);

     // 5 Colored Spires corresponding to OCEAN on the 5 Star Points
     const oceanCols=[mat('#00bcd4'),mat('#5c6bc0'),mat('#fbc02d'),mat('#4caf50'),mat('#ab47bc')];
     for(let k=0; k<5; k++){
       const a=k*Math.PI*2/5;
       const px=Math.sin(a)*r*0.78, pz=Math.cos(a)*r*0.78;
       cyl(g,.35,.18,4.6,oceanCols[k],px,2.8,pz);
       cone(g,.38,.85,warm,px,5.4,pz);
       ball(g,.32,oceanCols[k],px,1.2,pz);
     }

     // Jungian Persona & Shadow Obelisk
     const jung=mesh(g,new THREE.BoxGeometry(1.1,3.8,1.1),dark,0,2.6,0);
     box(jung,1.14,1.1,1.14,cream,0,.9,0);
     box(jung,1.14,1.1,1.14,mat('#1a1a1a'),0,-.9,0);

     // Kaleidoscopic Personality Prism
     const kaleido=mesh(g,new THREE.IcosahedronGeometry(1.2,0),gold,0,5.6,0);
     animated.push({obj:kaleido,kind:'halo'});

     bench(g,-3.5,3.2,0.5);
     tree(g,3.8,-3.5,0,1.2);
   }

   // -------------------------------------------------------------
   // Island 06: 社會共振島 (Concentric Atoll & Agora - Social)
   // Concentric circular atoll embracing central amphitheater agora
   // -------------------------------------------------------------
   else if(i===5){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,12);
     cyl(g,r,r,.25,accents[5],0,.14,0,12);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,12);

     // Sunken Agora Amphitheater Rings
     for(let step=1; step<=3; step++){
       const rad=r*(0.4+step*0.14);
       torus(g,rad,.25,cream,0,.5+step*0.25,-0.8);
     }

     // Asch Conformity Line Segment Columns
     const colMat=[mat('#ff7043'),mat('#26a69a'),gold,mat('#26a69a')];
     const heights=[3.4,2.2,3.4,4.8];
     for(let k=0; k<4; k++){
       const x=-2.4+k*1.6;
       cyl(g,.28,.28,heights[k],colMat[k],x,.45+heights[k]/2,2.8);
       ball(g,.24,white,x,.45+heights[k]+.24,2.8);
     }

     // Empathy Arch of Prosocial Connection
     torus(g,2.2,.22,mat('#ec407a'),0,3.6,-.8);

     bench(g,-4.0,3.6,0.3);
     tree(g,4.5,-2.8,0,1.2);
   }

   g.children.slice(landmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building=data.courses[i].id;}));
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
   const ring=mesh(scene,new THREE.RingGeometry(n.walkRadius-.4,n.walkRadius+.4,72),pathMat,n.x,n.height,n.z);
   ring.rotation.x=-Math.PI/2;
   walkSurfaces.push(ring);
 }
 const bridgeView=createBridges(scene,network);
 walkSurfaces.push(...bridgeView.surfaces);

 const residents=createResidents(scene,network,data.residents,{onResident,onHost});
 pickables.push(...residents.pickables);

 // Background islands
 for(const [x,z,r,h] of [[-55,10,3.8,.5],[-25,-55,3.2,1.8],[55,-12,4.5,.35],[0,58,4.0,.9]]){
   const factor=Math.max(1,mapExtent/45);
   let g=new THREE.Group();
   g.position.set(x*factor,h,z*factor);
   cyl(g,r,r*1.1,h+1.5,rock,0,.2-(h+1.5)/2,0,8);
   cyl(g,r*.98,r*.98,.2,grass,0,.35,0,8);
   scene.add(g);
   tree(g,-1.0,0,2,.9);
   tree(g,1.0,-.6,0,1.0);
 }

 const halloween=createDecorations(scene,camera,locations,data.appearance);
 const environment=createSeascape(scene,locations);

 const waveMat=mat('#ece1ed');
 for(let i=0;i<65;i++){
   let x=Math.sin(i*5.13)*65,z=Math.cos(i*2.71)*58;
   if([...locations.values()].some(g=>Math.hypot(x-g.position.x,z-g.position.z)<12))continue;
   box(scene,1.8+(i%3)*.6,.018,.07,waveMat,x,-1.2,z);
 }

 function courseNameFor(id){
   if(id==='center')return data.center.name;
   if(id==='island-personal')return '個人心智島 · 知識寶庫';
   return data.courses.find(c=>c.id===id)?.name||id;
 }

 for(const [id,g]of locations){
   g.userData.islandId=id;
   g.traverse(o=>{if(o.isMesh){o.userData.island=id;pickables.push(o);}});
   const isPersonal=id==='island-personal', isCenter=id==='center';
   const button=document.createElement('button');
   button.title=courseNameFor(id);
   button.setAttribute('aria-label',button.title);
   button.className='island-label'+(isCenter?' center':isPersonal?' personal':'');
   button.dataset.island=id;
   const course=data.courses.find(c=>c.id===id);
   const plate=document.createElement('span');
   plate.className='island-name-plate';
   const number=document.createElement('b');
   number.textContent=isCenter?'Ψ':isPersonal?'🌟':String(course?.order||'').padStart(2,'0');
   plate.append(number,document.createTextNode(isCenter?data.center.name:isPersonal?'個人心智島':course?.name||''));
   button.append(plate);
   button.addEventListener('click',e=>{e.stopPropagation();focusIsland(id);});
   const object=new CSS2DObject(button);
   object.position.set(0,isCenter?14.2:isPersonal?12.5:[9.5,10.2,9.8,10.5,9.2,11.2,8.8][data.courses.findIndex(c=>c.id===id)%7],0);
   g.add(object);
   labels.push({id,object,button});
 }

 for(const [id,g]of locations){
   const isPersonal=id==='island-personal', isCenter=id==='center';
   const button=document.createElement('button');
   button.className='building-label';
   button.dataset.building=id;
   button.innerHTML=isCenter?'<span>進入備課室 ✦</span>':isPersonal?'<span>知識寶庫 ✦</span>':'<span>教材 ✦</span>';
   button.setAttribute('aria-label',isCenter?'點選中央島建築進入張春興教授備課室':isPersonal?'點選開啟個人學習知識寶庫與筆記':'點選島建築閱讀該課教材');
   button.addEventListener('click',e=>{e.stopPropagation();enterBuilding(id);});
   const object=new CSS2DObject(button);
   object.position.set(0,isCenter?14.2:isPersonal?12.5:[9.5,10.2,9.8,10.5,9.2,11.2,8.8][data.courses.findIndex(c=>c.id===id)%7],0);
   g.add(object);
   buildingLabels.push({id,object,button});
 }

 // =========================================================================
 // 3. CHARACTER CONTROLLER (張春興教授 + 小白狗可操控系統)
 // =========================================================================
 const promptOverlay = document.createElement('div');
 promptOverlay.className = 'player-prompt-hud';
 promptOverlay.innerHTML = '<span class="prompt-icon">🎮</span><span class="prompt-text"><b>[方向鍵/觸控]</b> 操控探索 ｜ <b>[Z/滾輪]</b> 鏡頭特寫 ｜ <b>[C]</b> 角色視角 ｜ <b>[空白鍵]</b> 跳躍</span>';
 host.appendChild(promptOverlay);

 const controller = createCharacterController(scene, network, locations, camera, controls, {
   hostElement: host,
   onSelectCourse: onSelect,
   onOpenResident: onResident,
   onOpenHost: onHost,
   onOpenPersonalKnowledge: onPersonalKnowledge,
   onProximityChange: (prox) => {
     if (prox.landmark === 'island-personal' || prox.resident?.id === 'guide-sisi') {
       promptOverlay.innerHTML = '<span class="prompt-icon">🌟</span><span class="prompt-text">按 <b>[E]</b> 或 <b>[Enter]</b> 打開 <b>個人學習知識寶庫</b> ｜ <b>[Z/滾輪]</b> 特寫</span>';
     } else if (prox.resident) {
       promptOverlay.innerHTML = `<span class="prompt-icon">💬</span><span class="prompt-text">按 <b>[E]</b> 或 <b>[Enter]</b> 與 <b>${prox.resident.name}</b> 交談 ｜ <b>[Z/滾輪]</b> 特寫</span>`;
     } else if (prox.landmark) {
       const isCenter = prox.landmark === 'center';
       const name = isCenter ? data.center.name : courseNameFor(prox.landmark);
       promptOverlay.innerHTML = `<span class="prompt-icon">📖</span><span class="prompt-text">按 <b>[E]</b> 或 <b>[Enter]</b> 探索 <b>${name}</b> ｜ <b>[Z/滾輪]</b> 特寫</span>`;
     } else {
       promptOverlay.innerHTML = '<span class="prompt-icon">🎮</span><span class="prompt-text"><b>[方向鍵/觸控]</b> 操控探索 ｜ <b>[Shift]</b> 衝刺 ｜ <b>[Z/滾輪]</b> 鏡頭特寫 ｜ <b>[C]</b> 角色視角</span>';
     }
   }
 });
 controller.setResidentsCache(residents.snapshot());

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
     const near= Math.hypot(position.x-selectedIsland.position.x,position.z-selectedIsland.position.z)<selectedIsland.userData.radius+.8;
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
     if(shadowElapsed>1.2){
       renderer.shadowMap.needsUpdate=true;
       shadowElapsed=0;
     }

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

   // Throttled Label & Layout calculations to guarantee smooth 60fps!
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
   const target=new THREE.Vector3(0,3.8,0),preview=camera.clone();
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
   if(id==='island-personal'){onPersonalKnowledge?.();return;}
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
   target.y+=id==='center'?2.2:1.4;
   const zoom=(camera.right-camera.left)*(id==='center'?(phone?.65:.34):(phone?.75:.42))/(g.userData.radius*2);
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
     ambient.intensity=night?1.65:v==='dusk'?1.8:2.1;
     sun.intensity=night?.7:v==='dusk'?1.6:2.6;
     sun.color.set(night?'#dec8f1':v==='dusk'?'#ffd39b':'#fffbf2');
     sun.position.set(night?-35:-45,night?50:85,v==='dusk'?-25:35);
     warm.emissiveIntensity=night?2.8:v==='dusk'?1.1:.18;
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
   cycleZoom: () => {
     const dist = controller.cycleZoom();
     invalidate();
     return dist;
   },
   openPersonalKnowledge: () => onPersonalKnowledge?.(),
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
       for(const width of [-(p.width||1.8)*.45,0,(p.width||1.8)*.45]){
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
     for(let d=0;d<=p.length;d+=.45){
       const pt=pointAt(p,d).point;
       ray.set(new THREE.Vector3(pt.x,30,pt.z),down);
       samples++;
       const hit=ray.intersectObjects(surfaces,false)[0];
       if(hit&&Math.abs(hit.point.y-pt.y)<.42)supported++;
       else gaps.push({path:p.style?.id||p.island,point:pt,surfaceY:hit?.point.y});
     }
   }
   return {bridges,supported,samples,gaps};
 }
}
