import {createInterior} from './interior.mjs';
import {fitOverview,projectIslandBounds} from './overview-labels.mjs';
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
import {createPhilosopherBoats} from './philosopher-boats.mjs';

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
 
  const _scratchVec3 = new THREE.Vector3();
  const _scratchSpherical = new THREE.Spherical();
  const _projVec = new THREE.Vector3();

  const cameraOffset=new THREE.Vector3(55,75,90).multiplyScalar(Math.max(1,mapExtent/45));
 camera.position.copy(cameraOffset).add(new THREE.Vector3(0,4,0));
 camera.lookAt(0,4,0);

 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enablePan=false;
 controls.enableDamping=true;
 controls.dampingFactor=.08;
 controls.minZoom=0.35;
 controls.maxZoom=4.8;
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
 
  // =========================================================================
  // THEMATIC PSYCHOLOGICAL ANIMAL COMPANIONS (3D Models)
  // =========================================================================
  function createDog(targetGroup, x, y, z) {
    const dog = new THREE.Group();
    dog.position.set(x, y, z);
    targetGroup.add(dog);
    const fur = mat('#d4a373');
    const snout = mat('#795548');
    const collar = mat('#e53935');
    box(dog, 0.6, 0.7, 1.05, fur, 0, 0.45, 0);
    cyl(dog, 0.09, 0.09, 0.5, fur, -0.22, 0.25, 0.38);
    cyl(dog, 0.09, 0.09, 0.5, fur, 0.22, 0.25, 0.38);
    cyl(dog, 0.09, 0.09, 0.5, fur, -0.22, 0.25, -0.38);
    cyl(dog, 0.09, 0.09, 0.5, fur, 0.22, 0.25, -0.38);
    ball(dog, 0.36, fur, 0, 1.05, 0.5);
    box(dog, 0.25, 0.2, 0.3, snout, 0, 0.98, 0.8);
    box(dog, 0.14, 0.28, 0.09, snout, -0.28, 1.15, 0.5).rotation.z = -0.3;
    box(dog, 0.14, 0.28, 0.09, snout, 0.28, 1.15, 0.5).rotation.z = 0.3;
    torus(dog, 0.26, 0.06, collar, 0, 0.86, 0.35).rotation.x = Math.PI / 2;
    ball(dog, 0.09, gold, 0, 0.8, 0.56);
    const tail = cyl(dog, 0.06, 0.09, 0.5, fur, 0, 0.85, -0.6);
    tail.rotation.x = -Math.PI / 3;
    animated.push({ obj: tail, kind: 'bell' });
    return dog;
  }

  function createPigeon(targetGroup, x, y, z) {
    const bird = new THREE.Group();
    bird.position.set(x, y, z);
    targetGroup.add(bird);
    const grey = mat('#90a4ae');
    const tealMat = mat('#26a69a');
    ball(bird, 0.25, grey, 0, 0.28, 0);
    ball(bird, 0.16, tealMat, 0, 0.42, 0.16);
    cone(bird, 0.06, 0.14, mat('#ffb74d'), 0, 0.42, 0.3).rotation.x = Math.PI / 2;
    box(bird, 0.09, 0.2, 0.35, grey, -0.18, 0.29, -0.05);
    box(bird, 0.09, 0.2, 0.35, grey, 0.18, 0.29, -0.05);
    box(bird, 0.2, 0.05, 0.3, grey, 0, 0.24, -0.32);
    return bird;
  }

  function createOwl(targetGroup, x, y, z) {
    const owl = new THREE.Group();
    owl.position.set(x, y, z);
    targetGroup.add(owl);
    const brown = mat('#5d4037');
    const chest = mat('#d7ccc8');
    cyl(owl, 0.26, 0.3, 0.6, brown, 0, 0.35, 0);
    ball(owl, 0.28, brown, 0, 0.72, 0);
    ball(owl, 0.2, chest, 0, 0.35, 0.16);
    ball(owl, 0.1, gold, -0.12, 0.75, 0.24);
    ball(owl, 0.1, gold, 0.12, 0.75, 0.24);
    ball(owl, 0.05, dark, -0.12, 0.75, 0.31);
    ball(owl, 0.05, dark, 0.12, 0.75, 0.31);
    cone(owl, 0.05, 0.12, gold, 0, 0.68, 0.3).rotation.x = Math.PI / 2;
    cone(owl, 0.07, 0.16, brown, -0.16, 0.96, 0.06);
    cone(owl, 0.07, 0.16, brown, 0.16, 0.96, 0.06);
    return owl;
  }

  function createDolphin(targetGroup, x, y, z) {
    const dGroup = new THREE.Group();
    dGroup.position.set(x, y, z);
    targetGroup.add(dGroup);
    const dMat = mat('#38bdf8', { metalness: 0.2, roughness: 0.4 });
    const belly = mat('#f0f9ff');
    const dBody = cyl(dGroup, 0.24, 0.35, 1.5, dMat, 0, 0, 0);
    dBody.rotation.x = Math.PI / 2.8;
    ball(dGroup, 0.3, belly, 0, 0.38, 0.45);
    cone(dGroup, 0.09, 0.4, dMat, 0, 0.46, 0.82).rotation.x = Math.PI / 2.4;
    cone(dGroup, 0.09, 0.32, dMat, 0, 0.35, -0.05).rotation.x = -Math.PI / 5;
    box(dGroup, 0.6, 0.06, 0.25, dMat, 0, -0.48, -0.7);
    animated.push({ obj: dGroup, kind: 'boat', base: y });
    return dGroup;
  }

  function createIbex(targetGroup, x, y, z) {
    const ibex = new THREE.Group();
    ibex.position.set(x, y, z);
    targetGroup.add(ibex);
    const coat = mat('#8d6e63');
    const hornMat = mat('#37474f');
    box(ibex, 0.48, 0.6, 0.9, coat, 0, 0.52, 0);
    cyl(ibex, 0.08, 0.08, 0.6, coat, -0.2, 0.3, 0.35);
    cyl(ibex, 0.08, 0.08, 0.6, coat, 0.2, 0.3, 0.35);
    cyl(ibex, 0.08, 0.08, 0.6, coat, -0.2, 0.3, -0.35);
    cyl(ibex, 0.08, 0.08, 0.6, coat, 0.2, 0.3, -0.35);
    ball(ibex, 0.26, coat, 0, 0.95, 0.5);
    torus(ibex, 0.32, 0.06, hornMat, -0.14, 1.25, 0.42).rotation.y = Math.PI / 3;
    torus(ibex, 0.32, 0.06, hornMat, 0.14, 1.25, 0.42).rotation.y = -Math.PI / 3;
    return ibex;
  }

  function createPeacock(targetGroup, x, y, z) {
    const bird = new THREE.Group();
    bird.position.set(x, y, z);
    targetGroup.add(bird);
    const cobalt = mat('#1a237e');
    ball(bird, 0.24, cobalt, 0, 0.44, 0);
    cyl(bird, 0.11, 0.13, 0.5, cobalt, 0, 0.72, 0.16);
    ball(bird, 0.15, cobalt, 0, 1.0, 0.24);
    cone(bird, 0.05, 0.15, gold, 0, 1.0, 0.38).rotation.x = Math.PI / 2;
    const oceanColors = ['#00bcd4', '#3f51b5', '#ffb300', '#43a047', '#8e24aa'];
    for (let k = 0; k < 5; k++) {
      const a = -0.65 + k * 0.325;
      const feather = cyl(bird, 0.09, 0.18, 1.45, mat(oceanColors[k]), Math.sin(a) * 0.5, 0.95, -0.38 + Math.cos(a) * 0.18);
      feather.rotation.z = -a;
      ball(bird, 0.14, gold, Math.sin(a) * 1.05, 1.6, -0.38);
    }
    return bird;
  }

  function createCat(targetGroup, x, y, z) {
    const cat = new THREE.Group();
    cat.position.set(x, y, z);
    targetGroup.add(cat);
    const ginger = mat('#ff9800');
    const whiteMat = mat('#ffffff');
    torus(cat, 0.35, 0.2, ginger, 0, 0.2, 0).rotation.x = Math.PI / 2;
    ball(cat, 0.24, ginger, 0.3, 0.28, 0.16);
    ball(cat, 0.09, whiteMat, 0.16, 0.14, 0.38);
    cone(cat, 0.07, 0.15, ginger, 0.24, 0.52, 0.22).rotation.z = -0.3;
    cone(cat, 0.07, 0.15, ginger, 0.38, 0.52, 0.12).rotation.z = 0.3;
    torus(cat, 0.45, 0.06, ginger, 0, 0.14, 0).rotation.x = Math.PI / 2;
    return cat;
  }

  const mainLayout=ISLAND_LAYOUT[0];
 const center=new THREE.Group();
 center.position.set(mainLayout.x,mainLayout.elevation,mainLayout.z);
 center.userData.radius=mainLayout.radius;
 center.userData.elevation=mainLayout.elevation;
 center.userData.walkRadius=mainLayout.radius*0.82;
 scene.add(center);
 locations.set('center',center);

 const depthC=mainLayout.elevation+1.5;
 const rc=mainLayout.radius;
 // Tier 1 (Base): Broad lawn ring (R=rc)
 // Vibrant shallow water turquoise lagoon and beach rim
 const lagoonMat = mat('#48cae4', { transparent: true, opacity: 0.45, depthWrite: false });
 const sandMat = mat('#faebd7');
 mesh(center, new THREE.RingGeometry(rc * 0.96, rc * 1.30, 32), lagoonMat, 0, -1.2, 0).rotation.x = -Math.PI / 2;
 cyl(center, rc * 1.01, rc * 1.05, 0.22, sandMat, 0, -0.05, 0, 16);

 cyl(center,rc*.96,rc*1.04,depthC,rock,0,.2-depthC/2,0,16);
 cyl(center,rc*.98,rc*.98,.25,orange,0,.14,0,16);
 center.userData.land=cyl(center,rc*.96,rc*.97,.22,grass,0,.35,0,16);
 // Tier 2 (Middle): Marble Arcade Colonnade Terrace (R=rc*0.68, elevated +0.8m)
 cyl(center,rc*.68,rc*.72,.85,cream,0,.8,0,16);
 cyl(center,rc*.66,rc*.66,.18,mat('#f5ebd9'),0,1.25,0,16);
 // Tier 3 (Upper): Golden Sanctuary Podium (R=rc*0.42, elevated +1.6m)
 cyl(center,rc*.42,rc*.46,.9,cream,0,1.7,0,16);
 cyl(center,rc*.40,rc*.40,.15,mat('#ffe5be'),0,2.15,0,16);

 const centerLandmarkStart=center.children.length;

 // 12 Classical Corinthian Columns with Arched Entablature
 const colR = rc * 0.54;
 for(let c=0; c<12; c++){
   const angle=c*Math.PI*2/12;
   const px=Math.sin(angle)*colR, pz=Math.cos(angle)*colR;
   cyl(center,.32,.32,4.2,white,px,3.4,pz);
   cyl(center,.46,.38,.45,cream,px,1.4,pz);
   cyl(center,.38,.46,.45,cream,px,5.4,pz);
 }
 // Grand Rotunda Library Dome
 cyl(center,4.2,4.8,3.8,cream,0,4.2,0,16);
 cyl(center,3.5,3.5,4.2,orange,0,7.2,0,16);
 cone(center,4.8,3.2,teal,0,10.8,0,16);

 // Fountain of Metacognition
 cyl(center,2.5,2.5,.45,teal,0,12.4);
 const halo=torus(center,3.2,.15,gold,0,14.0,0);
 animated.push({obj:halo,kind:'halo'});

 // 3D Psychology Symbol: Greek Letter Psi (Ψ) Monument
 const psiGroup=new THREE.Group();
 psiGroup.position.set(0,15.6,0);
 center.add(psiGroup);
 cyl(psiGroup,.26,.26,4.4,gold,0,0,0);
 const psiArmL=torus(psiGroup,1.4,.18,gold,-1.0,.55,0); psiArmL.rotation.z=Math.PI/4;
 const psiArmR=torus(psiGroup,1.4,.18,gold,1.0,.55,0); psiArmR.rotation.z=-Math.PI/4;
 box(psiGroup,.65,.22,.24,gold,-2.0,1.55,0);
 box(psiGroup,.65,.22,.24,gold,2.0,1.55,0);
 box(psiGroup,.65,.22,.24,gold,0,2.2,0);
 ball(psiGroup,.50,warm,0,2.6,0);
 animated.push({obj:psiGroup,kind:'halo'});

 // Statues, Benches and Trees in the vast Academic Promenade
 bench(center,-rc*.62,3.2,0.4);
 bench(center,rc*.62,3.2,-0.4);
 bench(center,0,-rc*.7,Math.PI);
  createOwl(center, rc*0.48, 5.8, rc*0.35);
 tree(center,-rc*.72,-rc*.35,1,1.5);
 tree(center,rc*.72,-rc*.35,0,1.5);
 tree(center,-rc*.68,rc*.45,2,1.4);
 tree(center,rc*.68,rc*.45,0,1.4);

 center.children.slice(centerLandmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building='center';}));

 // =========================================================================
 // 1.5 PERSONAL ISLAND: 個人心智島 · 我的知識寶庫 (Personal Knowledge Sanctuary)
 // =========================================================================
 const personalLayout = ISLAND_LAYOUT.find(n => n.id === 'island-personal') || { id: 'island-personal', x: -4.0, z: -68.0, radius: 16.5, elevation: 4.0 };
 const personal = new THREE.Group();
 personal.position.set(personalLayout.x, personalLayout.elevation, personalLayout.z);
 personal.userData.radius = personalLayout.radius;
 personal.userData.elevation = personalLayout.elevation;
 personal.userData.walkRadius = personalLayout.radius * 0.82;
 scene.add(personal);
 locations.set('island-personal', personal);

 const depthP = personalLayout.elevation + 1.5;
 const rp = personalLayout.radius;
 const personalLandmarkStart = personal.children.length;

 // Vibrant shallow water celestial lagoon
 mesh(personal, new THREE.RingGeometry(rp * 0.95, rp * 1.28, 32), mat('#b388ff', { transparent: true, opacity: 0.38, depthWrite: false }), 0, -1.2, 0).rotation.x = -Math.PI / 2;
 cyl(personal, rp * 1.01, rp * 1.04, 0.20, mat('#f3e5f5'), 0, -0.05, 0, 16);

 // Tier 1: Floating Amethyst & Celestial Stone Foundation
 cyl(personal, rp*.95, rp*1.05, depthP, mat('#2d203a'), 0, .2 - depthP / 2, 0, 16);
 cyl(personal, rp*.98, rp*.98, .22, gold, 0, .14, 0, 16);
 personal.userData.land = cyl(personal, rp*.95, rp*.96, .20, mat('#856b9c'), 0, .32, 0, 16);

 // Tier 2: Marble Study Terrace (R=rp*0.65)
 cyl(personal, rp*.65, rp*.70, .85, cream, 0, .80, 0, 16);
 cyl(personal, rp*.62, rp*.62, .18, mat('#f3e8f8'), 0, 1.25, 0, 16);

 // Tier 3: Mind Sanctum Pavilion (知識研習聖所)
 for (let c = 0; c < 6; c++) {
   const angle = c * Math.PI / 5 + Math.PI / 2;
   const px = Math.sin(angle) * rp * 0.36, pz = Math.cos(angle) * rp * 0.36;
   cyl(personal, .22, .22, 3.8, white, px, 3.1, pz);
   ball(personal, .28, gold, px, 5.2, pz);
 }
 torus(personal, rp*0.38, .22, gold, 0, 5.2, 0);
 cone(personal, rp*0.36, 2.2, mat('#4a2b66'), 0, 6.4, 0, 16);
 ball(personal, .55, warm, 0, 7.8, 0);

 // Executive Knowledge Desk with Open Glowing Tome
 box(personal, 3.2, 1.0, 1.6, mat('#4e342e'), 0, 1.45, -1.5);
 box(personal, 1.1, .10, .7, white, 0, 2.0, -1.5);
 box(personal, .50, .11, .65, mat('#fdf5e6'), -.26, 2.02, -1.5);
 box(personal, .50, .11, .65, mat('#fdf5e6'), .26, 2.02, -1.5);
 cyl(personal, .10, .15, .55, gold, -1.1, 2.25, -1.5);
 ball(personal, .22, mat('#2e7d32', { emissive: '#4caf50', emissiveIntensity: 0.8 }), -1.1, 2.55, -1.5);

 // 6 Knowledge Resonance Crystal Pedestals (representing the 6 domains)
 const crystalColors = ['#00b4d8', '#ffb703', '#3a86ff', '#e63946', '#8338ec', '#fb5607'];
 for (let k = 0; k < 6; k++) {
   const angle = -1.8 + k * (Math.PI * 2 / 7);
   const px = Math.cos(angle) * rp * 0.48, pz = Math.sin(angle) * rp * 0.48;
   cyl(personal, .42, .55, 1.6, cream, px, 1.6, pz);
   ball(personal, .42, mat(crystalColors[k], { roughness: .2, metalness: .3, emissive: crystalColors[k], emissiveIntensity: 0.5 }), px, 2.8, pz);
   const cryHalo = torus(personal, .65, .06, gold, px, 2.8, pz);
   animated.push({ obj: cryHalo, kind: 'halo' });
 }

 // Floating Mind Rings
 const mindRing = torus(personal, 3.2, .12, gold, 0, 9.0, 0);
 animated.push({ obj: mindRing, kind: 'halo' });

 // Companion NPC: 思思 (Mind Guide)
 const guideGroup = new THREE.Group();
 guideGroup.position.set(1.8, 1.3, -1.5);
 personal.add(guideGroup);
 cyl(guideGroup, .26, .38, 1.3, mat('#ba68c8'), 0, .65, 0);
 ball(guideGroup, .32, mat('#ffe0b2'), 0, 1.45, 0);
 cone(guideGroup, .34, .65, mat('#4a148c'), 0, 1.9, 0);
 box(guideGroup, .36, .48, .1, mat('#ffe082'), -.36, .95, .24);
 guideGroup.userData.resident = 'guide-sisi';

 // Scenic Benches and Cherry Blossom Trees overlooking the ocean
 bench(personal, -rp*.58, 3.2, 0.4);
 bench(personal, rp*.58, 3.2, -0.4);
  createCat(personal, 1.1, 2.05, -1.5);
 tree(personal, -rp*.72, -rp*.25, 2, 1.5);
 tree(personal, rp*.72, -rp*.25, 2, 1.5);

 personal.children.slice(personalLandmarkStart).forEach(o => o.traverse(m => {
   if (m.isMesh) m.userData.building = 'island-personal';
 }));

 // =========================================================================
 // 2. SIX ENLARGED COURSE ISLANDS WITH HIGH IDIOSYNCRATIC GEOMETRIES
 // =========================================================================
 const accents=[mat('#00b4d8'),mat('#ffb703'),mat('#3a86ff'),mat('#e63946'),mat('#8338ec'),mat('#fb5607')];
 const islandLagoonMat = mat('#38bdf8', { transparent: true, opacity: 0.42, depthWrite: false });

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

   // Tropical shallow lagoon and beach rim around every island
   mesh(g, new THREE.RingGeometry(r * 0.95, r * 1.28, 32), islandLagoonMat, 0, -1.2, 0).rotation.x = -Math.PI / 2;
   cyl(g, r * 1.01, r * 1.04, 0.20, mat('#fef3c7'), 0, -0.05, 0, 16);

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

     // 1. Grand Prismatic Crystal Observatory Dome (Centerpiece)
     cyl(g, 4.2, 4.8, 2.8, cream, 0, 1.8, 0, 8);
     cyl(g, 3.6, 3.6, 3.2, mat('#80deea', { transparent: true, opacity: 0.82 }), 0, 4.2, 0, 8);
     cone(g, 4.6, 2.8, mat('#0288d1'), 0, 6.8, 0, 8);
     const obsHalo = torus(g, 4.8, 0.16, gold, 0, 7.2, 0);
     animated.push({ obj: obsHalo, kind: 'halo' });

     // 2. Emergent Quartz Crystal Clusters along all 6 star points (Height 4-6m)
     for(let k=0; k<6; k++){
       const a=k*Math.PI/3;
       const cx=Math.sin(a)*r*0.78, cz=Math.cos(a)*r*0.78;
       const crystal=mesh(g,new THREE.OctahedronGeometry(2.2,0),mat('#26c6da',{transparent:true,opacity:.88}),cx,1.8,cz);
       crystal.scale.set(0.65,2.4,0.65);
       cyl(g, 0.6, 0.8, 1.2, rock, cx, 0.8, cz);
     }

     // 3. Optical Rubin's Vase Colonnade Archway
     box(g,1.2,6.5,1.2,mat('#303f9f'),-3.6,3.6,0);
     box(g,1.2,6.5,1.2,mat('#303f9f'),3.6,3.6,0);
     box(g,8.4,.8,1.4,mat('#00e5ff'),0,7.1,0);

     // 4. Hovering Necker Cube Optical Illusion with glowing core
     const necker=mesh(g,new THREE.BoxGeometry(2.8,2.8,2.8),mat('#00e5ff',{wireframe:true}),0,4.6,0);
     animated.push({obj:necker,kind:'halo'});
     ball(g,.75,warm,0,4.6,0);

     // 5. Penrose Impossible Stairs Ring
     for(let s=0; s<10; s++){
       const sa=s*Math.PI*2/10;
       box(g,1.2,.35+s*.18,1.2,cream,Math.sin(sa)*5.2,.6+s*.14,Math.cos(sa)*5.2);
     }

     // Decorative streetlamps, benches & flowering trees
     bench(g,-4.5,4.2,0.3);
     bench(g,4.5,4.2,-0.3);
     tree(g,5.5,-3.6,1,1.4);
     tree(g,-5.5,-3.5,0,1.4);
     tree(g,0,-5.8,2,1.3);
   }

   // -------------------------------------------------------------
   // Island 02: 記憶之宮島 (Roman Labyrinth Citadel - Memory)
   // Multi-tiered fortress with amphitheater steps & Pavlov belfry
   // -------------------------------------------------------------
   else if(i===1){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,12);
     cyl(g,r,r,.25,accents[1],0,.14,0,12);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,12);

     // 1. Grand Roman Memory Palace Terrace & Fortress Walls
     box(g,r*0.95,1.2,r*0.75,cream,0,1.0,-1.0);
     cyl(g,r*0.45,r*0.48,.25,mat('#dfd4be'),0,1.65,-1.0);

     // 2. Colossal Pavlov Bell Tower (8.8m Tall Citadel Belfry)
     const belfry=box(g,4.8,3.6,4.2,cream,0,3.2,-1.0);
     for(const sx of [-1,1]) for(const sz of [-1,1]) cyl(belfry,.32,.32,4.4,gold,sx*1.8,2.8,sz*1.6);
     const belfryRoof=cone(belfry,3.6,2.8,mat('#e65100'),0,6.2,0,4);
     belfryRoof.rotation.y=Math.PI/4;
     const bell=cone(belfry,1.1,1.2,gold,0,2.8,0);
     animated.push({obj:bell,kind:'bell'});

     // 3. Monumental Archive Colonnade (Scroll Chambers)
     for(let col=-2; col<=2; col++){
       cyl(g, .26, .26, 3.2, cream, col*2.2, 2.2, 3.2);
     }
     box(g, 11.2, .5, 1.2, mat('#d7ccc8'), 0, 3.9, 3.2);

     // 4. Giant Ebbinghaus Sand Hourglass
     const hg=new THREE.Group(); hg.position.set(-5.2,2.2,0.8); g.add(hg);
     cone(hg,1.0,1.3,mat('#80deea',{transparent:true,opacity:.80}),0,.65,0);
     const hgB=cone(hg,1.0,1.3,mat('#80deea',{transparent:true,opacity:.80}),0,-.65,0); hgB.rotation.x=Math.PI;
     ball(hg,.32,warm,0,0,0);
     box(hg,2.2,.18,2.2,wood,0,1.35,0); box(hg,2.2,.18,2.2,wood,0,-1.35,0);
     animated.push({obj:hg,kind:'halo'});

     // 5. Skinner Operant Conditioning Chamber with Golden Lever
     const skinner=box(g,2.2,1.6,2.2,mat('#263238'),5.2,1.4,0.8);
     cyl(skinner,.10,.10,.9,gold,0,.9,0);
     ball(skinner,.24,mat('#76ff03',{emissive:'#76ff03',emissiveIntensity:.6}),0,1.5,0);

     bench(g,-3.5,4.2,-0.5);
     bench(g,3.5,4.2,0.5);
     tree(g,-5.5,-4.2,0,1.4);
     tree(g,5.5,-4.0,2,1.3);
     createDog(g, 2.4, 1.65, -1.0);
     createPigeon(g, 5.2, 2.2, 0.8);
   }

   // -------------------------------------------------------------
   // Island 03: 理性思維島 (Twin-Plateau Rift Canyon - Cognition)
   // Split canyon: System 1 (Red Crag) vs System 2 (Blue Logic)
   // -------------------------------------------------------------
   else if(i===2){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,10);
     cyl(g,r,r,.25,accents[2],0,.14,0,10);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,10);

     // 1. Deep Rift Canyon: Left Red Intuition Plateau vs Right Blue Logic Citadel
     box(g,r*0.44,3.2,r*0.82,mat('#c62828'),-r*0.36,1.95,0); // Intuition Plateau
     box(g,r*0.44,3.2,r*0.82,mat('#1565c0'),r*0.36,1.95,0);  // Logic Citadel
     // Classical Logic Colonnade on the blue citadel
     for(let c=0; c<4; c++){
       cyl(g, .22, .22, 3.2, mat('#bbdefb'), r*0.36 + (c%2?1.2:-1.2), 4.8, (c>1?1.5:-1.5));
     }
     box(g, 3.4, .4, 3.8, mat('#e3f2fd'), r*0.36, 6.4, 0);

     // 2. Spanning Golden Heuristic Bridge
     box(g,r*0.95,.28,2.8,mat('#ffd54f'),0,3.6,0);
     cyl(g, .08, .08, 1.8, gold, -2.4, 4.4, 1.3);
     cyl(g, .08, .08, 1.8, gold, 2.4, 4.4, 1.3);
     cyl(g, .08, .08, 1.8, gold, -2.4, 4.4, -1.3);
     cyl(g, .08, .08, 1.8, gold, 2.4, 4.4, -1.3);

     // 3. Colossal Decision Tree of Mind
     const treeGroup=new THREE.Group(); treeGroup.position.set(0,1.8,-3.8); g.add(treeGroup);
     cyl(treeGroup,.45,.65,4.8,wood,0,2.4,0);
     for(let b=0; b<8; b++){
       const ba=b*Math.PI*2/8;
       const branch=cyl(treeGroup,.22,.28,3.2,wood,Math.sin(ba)*1.4,4.2,Math.cos(ba)*1.4);
       branch.rotation.z=Math.sin(ba)*.5;
       branch.rotation.x=Math.cos(ba)*.5;
       ball(treeGroup,.65,gold,Math.sin(ba)*2.8,5.4,Math.cos(ba)*2.8);
     }

     // 4. Monumental Kahneman Balance Scale (7.2m Wide)
     cyl(g,.32,.42,5.8,dark,0,3.6,3.6);
     const beam=box(g,7.2,.28,.28,mat('#ff9800'),0,6.4,3.6);
     animated.push({obj:beam,kind:'gear'});
     cyl(g,.04,.04,2.4,dark,-2.8,5.2,3.6); ball(g,.95,mat('#ff5252'),-2.8,4.2,3.6);
     cyl(g,.04,.04,2.4,dark,2.8,5.2,3.6); box(g,1.3,1.3,1.3,mat('#448aff'),2.8,4.2,3.6);

     // 5. Rational Chessboard Tiles
     box(g, 4.2, .1, 4.2, cream, 0, .45, 0);
     cyl(g, .45, .6, 1.4, dark, -1.2, 1.1, -1.2); // Chess King piece
     cyl(g, .38, .5, 1.2, white, 1.2, 1.0, 1.2);  // Chess Queen piece

     bench(g,-4.5,4.8,0.4);
     bench(g,4.5,4.8,-0.4);
     tree(g,5.6,-3.8,2,1.4);
     createOwl(g, r*0.36, 6.7, 0);
   }

   // -------------------------------------------------------------
   // Island 04: 動機與情緒島 (Spiral 5-Tier Pyramid Mountain - Emotion)
   // Maslow hierarchy spiral terraces ascending to self-actualization
   // -------------------------------------------------------------
   else if(i===3){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,10);
     cyl(g,r,r,.25,accents[3],0,.14,0,10);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,10);

     // 1. Grand 5-Stepped Terraces of Maslow's Hierarchy (Pyramid Citadel)
     const pLvls=[
       {w:r*1.15,h:.75,c:mat('#e53935')}, // Physiological (Red)
       {w:r*0.92,h:.75,c:mat('#fb8c00')}, // Safety (Orange)
       {w:r*0.70,h:.75,c:mat('#fdd835')}, // Love & Belonging (Yellow)
       {w:r*0.48,h:.75,c:mat('#43a047')}, // Esteem (Green)
       {w:r*0.28,h:.75,c:mat('#8e24aa')}  // Self-Actualization (Purple)
     ];
     let yb=.6;
     for(const lvl of pLvls){
       box(g,lvl.w,lvl.h,lvl.w,lvl.c,0,yb+lvl.h/2,0);
       yb+=lvl.h;
     }

     // 2. Radiant Apex Star of Self-Actualization (1.4m Octahedron)
     const star=mesh(g,new THREE.OctahedronGeometry(1.4,0),gold,0,yb+.85,0);
     animated.push({obj:star,kind:'halo'});
     // Pulsing Emotional Wave Rings
     const heartRing=torus(g,5.2,.16,warm,0,3.6,0);
     animated.push({obj:heartRing,kind:'halo'});

     // 3. Dual Steaming Turquoise Thermal Mineral Springs
     cyl(g,2.2,2.2,.28,mat('#00e5ff',{transparent:true,opacity:.85}),-4.6,.6,3.6);
     torus(g,2.4,.24,rock,-4.6,.6,3.6);

     cyl(g,1.8,1.8,.28,mat('#ff4081',{transparent:true,opacity:.80}),4.6,.6,3.6);
     torus(g,2.0,.22,rock,4.6,.6,3.6);

     // 4. Emotional Passion Beacon Pillar
     cyl(g, .45, .6, 6.2, mat('#d81b60'), 4.8, 3.6, -3.2);
     ball(g, .75, warm, 4.8, 6.8, -3.2);

     bench(g,-4.5,4.2,-0.5);
     bench(g,4.5,4.2,0.5);
     tree(g,-5.6,-3.6,2,1.4);
     tree(g,5.6,-2.8,1,1.3);
     createIbex(g, -3.2, 2.3, 0);
   }

   // -------------------------------------------------------------
   // Island 05: 人格演繹島 (Pentagram Star Bastion - Big Five OCEAN)
   // 5 Outstretched star capes pointing towards O-C-E-A-N
   // -------------------------------------------------------------
   else if(i===4){
     cyl(g,r*.95,r*1.15,depth,rock,0,.2-depth/2,0,5);
     cyl(g,r,r,.25,accents[4],0,.14,0,5);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,5);

     // 1. 5 Grand Spires of Personality (OCEAN on the 5 Bastion Capes, Height 6.8m)
     const oceanCols=[mat('#00bcd4'),mat('#3f51b5'),mat('#ffb300'),mat('#43a047'),mat('#8e24aa')];
     for(let k=0; k<5; k++){
       const a=k*Math.PI*2/5;
       const px=Math.sin(a)*r*0.76, pz=Math.cos(a)*r*0.76;
       cyl(g,.55,.32,5.8,oceanCols[k],px,3.2,pz);
       cone(g,.65,1.6,warm,px,6.8,pz);
       torus(g, .85, .12, gold, px, 4.8, pz);
       ball(g,.45,oceanCols[k],px,1.4,pz);
     }

     // 2. Colossal Jungian Persona & Shadow Obelisk (Dual Black & White Monolith)
     const jung=mesh(g,new THREE.BoxGeometry(1.8,5.2,1.8),dark,0,3.2,0);
     box(jung,1.88,1.6,1.88,cream,0,1.4,0);
     box(jung,1.88,1.6,1.88,mat('#121212'),0,-1.4,0);

     // 3. Rotating Kaleidoscopic Personality Prism
     const kaleido=mesh(g,new THREE.IcosahedronGeometry(1.8,0),gold,0,7.2,0);
     animated.push({obj:kaleido,kind:'halo'});

     // 4. Circular Topiary Garden Plaza
     torus(g, 4.2, .24, cream, 0, .45, 0);

     bench(g,-4.2,3.8,0.5);
     bench(g,4.2,3.8,-0.5);
     tree(g,5.2,-4.2,0,1.4);
     tree(g,-5.2,-4.2,2,1.4);
     createPeacock(g, 0, 0.45, 2.4);
   }

   // -------------------------------------------------------------
   // Island 06: 社會共振島 (Concentric Atoll & Agora - Social)
   // Concentric circular atoll embracing central amphitheater agora
   // -------------------------------------------------------------
   else if(i===5){
     cyl(g,r*.95,r*1.1,depth,rock,0,.2-depth/2,0,12);
     cyl(g,r,r,.25,accents[5],0,.14,0,12);
     g.userData.land=cyl(g,r*.96,r*.98,.22,grass,0,.35,0,12);

     // 1. Concentric Amphitheater Agora (4 Tiered Stone Steps)
     for(let step=1; step<=4; step++){
       const rad=r*(0.35+step*0.12);
       torus(g,rad,.32,cream,0,.5+step*0.28,-0.8);
     }

     // 2. Central Campfire of Community (Warm Glowing Fellowship Hearth)
     cyl(g, 1.4, 1.6, .35, rock, 0, .6, -0.8);
     const hearthFire = ball(g, .75, warm, 0, 1.2, -0.8);
     animated.push({ obj: hearthFire, kind: 'bell' });

     // 3. Asch Conformity Line Segment Columns (Monumental Social Influence Pillars)
     const colMat=[mat('#ff7043'),mat('#26a69a'),gold,mat('#26a69a')];
     const heights=[4.8,2.8,4.8,6.8];
     for(let k=0; k<4; k++){
       const x=-3.6+k*2.4;
       cyl(g,.38,.38,heights[k],colMat[k],x,.45+heights[k]/2,3.8);
       ball(g,.45,white,x,.45+heights[k]+.4,3.8);
     }

     // 4. Monumental Empathy Archway of Prosocial Connection
     torus(g,3.4,.32,mat('#ec407a'),0,4.8,-.8);
     ball(g, .6, gold, -2.4, 4.8, -.8);
     ball(g, .6, gold, 2.4, 4.8, -.8);

     // 5. Celebration Pillars with Festive Lanterns
     cyl(g, .15, .15, 3.6, wood, -5.2, 2.2, 0);
     ball(g, .35, warm, -5.2, 4.1, 0);
     cyl(g, .15, .15, 3.6, wood, 5.2, 2.2, 0);
     ball(g, .35, warm, 5.2, 4.1, 0);

     bench(g,-4.5,4.2,0.3);
     bench(g,4.5,4.2,-0.3);
     tree(g,5.6,-3.6,0,1.4);
     tree(g,-5.6,-3.6,1,1.4);
     createDolphin(g, 0, -1.1, 8.5);
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

 const residents=createResidents(scene,network,data.residents,{
   onResident,
   onHost,
   toast: msg => {
     const t = document.querySelector('#toast');
     if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3800); }
   }
 });
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
 const philosopherBoats=createPhilosopherBoats(scene,{
   onOpenQuote: phil => onPersonalKnowledge?.(phil?.relatedCourseId, phil),
    onSelectCourse: courseId => { focusIsland(courseId); onSelect?.(courseId); },
   toast: msg => {
     const t = document.querySelector('#toast');
     if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3200); }
   }
 });
 pickables.push(...philosopherBoats.pickables);

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
     const isStroller=l.button.dataset.strollerIsland;
     const near= Math.hypot(position.x-selectedIsland.position.x,position.z-selectedIsland.position.z)<selectedIsland.userData.radius+.8;
     if((isHost&&isHost!==selected)||(isStroller&&isStroller!==selected)||!near){l.button.style.visibility='hidden';continue;}
     const p=l.object.getWorldPosition(_projVec).project(camera),rawX=(p.x+1)*w/2,rawY=(-p.y+1)*h/2;
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
     

     residents.update(dt);
     philosopherBoats.update(dt);

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

   controls.update();

   if(!selected&&!flight&&overviewNeedsSpace){
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
   if(!reduced||flight)frame=requestAnimationFrame(render);
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
   controls.enabled=true;
   labelRenderer.domElement.hidden=false;
   leaders.style.display='';
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
   if(hit?.object.userData.isPhilosopher){
     philosopherBoats.openDialog(hit.object.userData.philosopherId);
   }else if(hit?.object.userData.stroller){
     residents.sayStroller(hit.object.userData.stroller);
   }else if(hit?.object.userData.resident){
     onResident?.(hit.object.userData.resident);
   }else if(hit?.object.userData.host){
     onHost?.();
   }else if(hit){
     const id=hit.object.userData.island;
      if(selected===id&&hit.object.userData.building===id)enterBuilding(id);
      else focusIsland(id);
    }else if(selected){
      overview();
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
   
   openPersonalKnowledge: () => onPersonalKnowledge?.(),
    openPhilosopher: (id) => philosopherBoats.openDialog(id),
   
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
