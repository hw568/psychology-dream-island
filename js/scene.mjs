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
export function createScene(host,data,{onSelect,onFailure,onHost,onResident,onFocus}){
 const ISLAND_LAYOUT=layoutFor(data.courses.length),palette=paletteFor(data.appearance);const mapExtent=Math.max(...ISLAND_LAYOUT.map(n=>Math.hypot(n.x,n.z)+n.radius)),mapWidth=Math.max(83,mapExtent*2.8);
 host.dataset.dense=String(data.courses.length>8);
 const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xd7d0e7);
 // Labels and character prompts overlay the canvas; their wheel input must reach OrbitControls too.
 host.addEventListener('wheel',e=>{if(e.target===renderer.domElement)return;renderer.domElement.dispatchEvent(new WheelEvent('wheel',{deltaX:e.deltaX,deltaY:e.deltaY,deltaZ:e.deltaZ,deltaMode:e.deltaMode,clientX:e.clientX,clientY:e.clientY,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey,metaKey:e.metaKey,cancelable:true,bubbles:false}));e.preventDefault();},{passive:false});
 host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','拖曳旋轉課程群島，或使用課程清單選取');
 const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';leaders.setAttribute('aria-hidden','true');host.appendChild(leaders);const labelRenderer=new CSS2DRenderer();labelRenderer.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';host.appendChild(labelRenderer.domElement);
 const camera=new THREE.OrthographicCamera(-40,40,30,-30,.1,Math.max(250,mapExtent*5));const cameraOffset=new THREE.Vector3(40,57,66).multiplyScalar(Math.max(1,mapExtent/35));camera.position.copy(cameraOffset).add(new THREE.Vector3(0,3,0));camera.lookAt(0,3,0);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;controls.minZoom=.2;controls.maxZoom=Math.max(12,mapWidth/8);controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2.6;controls.target.set(0,3,0);controls.update();
 const ambient=new THREE.HemisphereLight(0xfff2da,0xb8a8c5,1.9);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff7ef,2.5);sun.position.set(-30,55,22);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-mapExtent*1.25,right:mapExtent*1.25,top:mapExtent*1.25,bottom:-mapExtent*1.25,near:1,far:Math.max(140,mapExtent*5)});sun.shadow.bias=-.001;scene.add(sun);
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.84,flatShading:true,...extra});
 const cream=mat('#fff0df'),rock=mat(palette.rock),grass=mat(palette.grass),wood=mat('#c9af9c'),rail=mat('#efd0a3'),green=mat('#b6c89f'),green2=mat('#e1c890'),pink=mat(palette.pink),white=mat('#fffaf1'),dark=mat('#84718d'),teal=mat(palette.roof),orange=mat('#efb77e'),purple=mat('#bba5d6');
 const warm=new THREE.MeshStandardMaterial({color:0xffe4a1,emissive:0xffd27c,emissiveIntensity:.1});const lamps=[];
 const water=new THREE.MeshBasicMaterial({color:'#d7d0e7'});const ocean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(500,mapExtent*10),Math.max(500,mapExtent*10)),water);ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.25;scene.add(ocean);const shadowOcean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(150,mapExtent*4),Math.max(150,mapExtent*4)),new THREE.ShadowMaterial({color:0x514260,opacity:.16}));shadowOcean.rotation.x=-Math.PI/2;shadowOcean.position.y=-1.24;shadowOcean.receiveShadow=true;scene.add(shadowOcean);
 const mesh=(parent,geo,material,x=0,y=0,z=0)=>{let m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,r1,r2,h,m,x=0,y=0,z=0,n=8)=>mesh(p,new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.IcosahedronGeometry(r,1),m,x,y,z);
 const cone=(p,r,h,m,x=0,y=0,z=0)=>mesh(p,new THREE.ConeGeometry(r,h,7),m,x,y,z);
 const torus=(p,r,t,m,x,y,z)=>mesh(p,new THREE.TorusGeometry(r,t,6,20),m,x,y,z);
 const lamp=(p,x,z)=>{cyl(p,.06,.08,2,dark,x,1.3,z);cyl(p,.2,.11,.16,wood,x,2.3,z);ball(p,.18,warm,x,2.55,z);lamps.push(p);};
 function tree(p,x,z,type=0,scale=1){const g=new THREE.Group();g.position.set(x,.25,z);g.scale.setScalar(scale);p.add(g);cyl(g,.1,.16,1.15,wood,0,.55);if(type===1){cone(g,.8,1.5,green,0,1.5);cone(g,.63,1.3,green2,0,2.2);}else{ball(g,.75,type===2?pink:green,0,1.6,0);ball(g,.58,type===2?pink:green2,.4,1.9,.1);}}
 function island(x,z,r,accent,elevation=0){const g=new THREE.Group();g.position.set(x,elevation,z);g.userData.radius=r;g.userData.elevation=elevation;g.userData.walkRadius=Math.max(3.35,r*.75);scene.add(g);const depth=elevation+1.45;cyl(g,r*.98,r*1.08,depth,rock,0,.2-depth/2,0,7);for(let band=1;band<(elevation>2?3:2);band++){const t=band/3,rad=r*(.98+.1*t);cyl(g,rad+.01,rad+.02,.10,cream,0,.2-depth*t,0,7);}cyl(g,r,r,.25,accent,0,.14,0,7);g.userData.land=cyl(g,r*.98,r*.99,.2,grass,0,.35,0,7);cyl(g,r*1.17,r*1.15,.045,mat('#e1d4e9'),0,-1.20-elevation,0,7);return g;}

 function book(p,x,y,z,color=orange){box(p,1.05,.18,.8,color,x,y,z);box(p,.9,.12,.78,white,x,y+.13,z);box(p,1.05,.06,.8,color,x,y+.22,z);}
 function bench(p,x,z){box(p,1.3,.15,.45,wood,x,.75,z);box(p,1.3,.5,.12,wood,x,1,z-.2);for(const dx of [-.45,.45])box(p,.1,.65,.3,dark,x+dx,.35,z);}
 function house(p,color=teal){box(p,2.8,2,2.4,cream,0,1.45,0);const roof=cone(p,2.35,1.2,color,0,3.05);roof.rotation.y=Math.PI/4;box(p,.7,1.25,.08,wood,0,1.1,1.25);for(const x of [-.9,.9])box(p,.5,.6,.08,warm,x,1.65,1.25);}
 function gear(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);torus(g,.9,.16,orange,0,0,0);for(let i=0;i<8;i++){let b=box(g,.3,.5,.25,orange,Math.sin(i*Math.PI/4),Math.cos(i*Math.PI/4),0);b.rotation.z=-i*Math.PI/4;}cyl(g,.23,.23,.4,dark).rotation.x=Math.PI/2;return g;}
 const locations=new Map(),labels=[],buildingLabels=[],pickables=[],animated=[];
 const mainLayout=ISLAND_LAYOUT[0],center=island(mainLayout.x,mainLayout.z,mainLayout.radius,orange,mainLayout.elevation);locations.set('center',center);const centerLandmarkStart=center.children.length;
 cyl(center,2.5,2.8,.2,cream,0,.55,0,12);cyl(center,1,1.35,.5,white,0,.9,0);cyl(center,.7,1,5,white,0,3.5,0);for(const y of [1.7,3.1,4.5])cyl(center,.82,.86,.22,orange,0,y,0);cyl(center,1.15,1.15,.3,teal,0,6.15);cyl(center,.7,.7,.8,warm,0,6.7);cone(center,1.3,.7,teal,0,7.4);const halo=torus(center,1.05,.07,orange,0,8.25,0);animated.push({obj:halo,kind:'halo'});cone(center,.35,.8,orange,0,8.2,0);center.children.slice(centerLandmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building='center';}));tree(center,-3,-1,1);tree(center,3,-1,1);bench(center,-2,2);bench(center,2,2);lamp(center,-3.5,2);lamp(center,3.5,2);
 const accents=[orange,teal,orange,purple,teal,purple,orange];
 for(let i=0;i<data.courses.length;i++){const layout=ISLAND_LAYOUT[i+1],g=island(layout.x,layout.z,layout.radius,accents[i%accents.length],layout.elevation);g.rotation.y=[.12,-.22,.28,-.1,.2,-.3,.08][i%7];locations.set(data.courses[i].id,g);const landmarkStart=g.children.length;
   if(i===0){
    cyl(g,2.2,2.4,.25,cream,0,.55,0,12);
    box(g,.5,3.6,.5,purple,-1.3,2.35,0);
    box(g,.5,3.6,.5,teal,1.3,2.35,0);
    box(g,3.3,.4,.55,orange,0,4.25,0);
    const eyeRing=torus(g,1.15,.12,orange,0,2.5,0);
    animated.push({obj:eyeRing,kind:'halo'});
    ball(g,.38,warm,0,2.5,0);
    torus(g,.65,.05,cream,0,2.5,0);
    mesh(g,new THREE.OctahedronGeometry(.65,0),purple,1.8,1.3,1.3,{wireframe:true});
    book(g,-1.8,.7,1.4,orange);bench(g,1.9,1.8);
   }else if(i===1){
    box(g,2.6,1.8,2.4,cream,0,1.35,0);
    for(const sx of [-1,1])for(const sz of [-1,1])cyl(g,.14,.14,2.2,orange,sx*.85,3.1,sz*.85);
    const belfryRoof=cone(g,1.85,1.3,orange,0,4.7,0);belfryRoof.rotation.y=Math.PI/4;
    const bell=cone(g,.45,.55,warm,0,3.1,0);ball(g,.12,dark,0,2.7,0);animated.push({obj:bell,kind:'bell'});
    const hg=new THREE.Group();hg.position.set(-1.8,1.3,1.2);g.add(hg);
    cone(hg,.42,.55,mat('#e0f7fa',{transparent:true,opacity:.6}),0,.28,0);
    const hgB=cone(hg,.42,.55,mat('#e0f7fa',{transparent:true,opacity:.6}),0,-.28,0);hgB.rotation.x=Math.PI;
    ball(hg,.12,warm,0,0,0);box(hg,.95,.08,.95,wood,0,.58,0);box(hg,.95,.08,.95,wood,0,-.58,0);
    book(g,1.8,.7,1.3,teal);
   }else if(i===2){
    box(g,3.2,.35,2.6,cream,0,.6,0);
    for(const x of [-1.3,-.4,.4,1.3])cyl(g,.14,.15,2.2,white,x,1.8,-.9);
    box(g,3.4,.3,1.4,cream,0,3.05,-.9);
    cyl(g,.16,.18,3.6,wood,0,2.3,.6);
    const beam=box(g,3.4,.14,.14,orange,0,4.0,.6);animated.push({obj:beam,kind:'gear'});
    cyl(g,.02,.02,1.1,dark,-1.4,3.4,.6);cyl(g,.5,.3,.1,teal,-1.4,2.8,.6);ball(g,.38,warm,-1.4,3.25,.6);
    cyl(g,.02,.02,.9,dark,1.4,3.5,.6);cyl(g,.5,.3,.1,purple,1.4,3.0,.6);box(g,.55,.55,.55,teal,1.4,3.5,.6);
    book(g,-.6,1.0,2.1,orange);book(g,.6,1.0,2.1,purple);
   }else if(i===3){
    const pLvls=[{w:3.2,h:.45,c:mat('#c0392b')},{w:2.6,h:.45,c:mat('#d35400')},{w:2.0,h:.45,c:mat('#f39c12')},{w:1.4,h:.45,c:mat('#27ae60')},{w:.85,h:.45,c:mat('#8e44ad')}];
    let yb=.6;for(const lvl of pLvls){box(g,lvl.w,lvl.h,lvl.w,lvl.c,0,yb+lvl.h/2,0);yb+=lvl.h;}
    const star=mesh(g,new THREE.OctahedronGeometry(.48,0),warm,0,yb+.35,0);animated.push({obj:star,kind:'halo'});
    const heartRing=torus(g,2.2,.07,warm,0,1.8,0);animated.push({obj:heartRing,kind:'halo'});
    book(g,-1.8,.7,1.4,orange);bench(g,1.8,1.6);
   }else if(i===4){
    cyl(g,2.4,2.6,.25,cream,0,.55,0,10);
    const oColors=[purple,dark,orange,green,pink];
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5,px=Math.sin(a)*1.65,pz=Math.cos(a)*1.65;cyl(g,.22,.12,3.2,oColors[k],px,2.1,pz);cone(g,.2,.45,warm,px,3.9,pz);}
    const kaleido=mesh(g,new THREE.IcosahedronGeometry(.75,0),warm,0,2.6,0);animated.push({obj:kaleido,kind:'halo'});
    book(g,-1.5,.7,1.8,purple);book(g,1.5,.7,1.8,orange);
   }else if(i===5){
    const colMat=[orange,teal,warm,teal],heights=[2.4,1.6,2.4,3.2];
    for(let k=0;k<4;k++){const x=-1.5+k*.95;cyl(g,.18,.18,heights[k],colMat[k],x,.45+heights[k]/2,1.3);ball(g,.15,white,x,.45+heights[k]+.15,1.3);}
    for(let k=0;k<6;k++){const a=k*Math.PI/3;cyl(g,.15,.15,2.6,cream,Math.sin(a)*1.7,1.8,Math.cos(a)*1.7-.6);}
    const arch=torus(g,1.7,.16,cream,0,3.15,-.6);arch.rotation.x=Math.PI/2;
    box(g,.15,2.2,.15,warm,0,2.4,-.6);box(g,1.0,.15,.15,warm,0,3.3,-.6);box(g,.12,1.2,.12,warm,-.45,3.9,-.6);box(g,.12,1.2,.12,warm,.45,3.9,-.6);
   }else{
    box(g,2.8,2,2.4,cream,0,1.45,0);
   }
  g.children.slice(landmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building=data.courses[i].id;}));tree(g,-2.3,-1,i%3,.9);tree(g,2.3,-1,(i+1)%3,.75);lamp(g,-2.6,1.3);lamp(g,2.6,1.3);cyl(g,.25,.3,.25,orange,-2.1,.6,1.5);ball(g,.3,pink,-2.1,.95,1.5);
 }
 const nodes=[...locations].map(([id,g])=>({id,x:g.position.x,z:g.position.z,radius:g.userData.radius,height:g.position.y+.49,elevation:g.position.y,walkRadius:g.userData.walkRadius}));
 const connections=connectionsFor(data.courses.length),styles=bridgeStylesFor(connections.length),network=buildNetwork(nodes,connections.map((edge,i)=>[...edge,styles[i]])),walkSurfaces=[];
 const pathMat=mat('#f4dec1');for(const n of nodes){const ring=mesh(scene,new THREE.RingGeometry(n.walkRadius-.3,n.walkRadius+.3,72),pathMat,n.x,n.height,n.z);ring.rotation.x=-Math.PI/2;walkSurfaces.push(ring);}
 const bridgeView=createBridges(scene,network);walkSurfaces.push(...bridgeView.surfaces);
 const residents=createResidents(scene,network,data.residents,{onResident,onHost});
 pickables.push(...residents.pickables);
 function inspectWalkways(){scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),bridges=[];for(const p of network.paths.filter(p=>p.kind==='bridge')){const ends=[];for(const [key,point]of [[p.from,p.points[0]],[p.to,p.points.at(-1)]]){const g=locations.get(network.vertices[key].island),dx=p.points.at(-1).x-p.points[0].x,dz=p.points.at(-1).z-p.points[0].z,len=p.length;let hits=0;for(const width of [-(p.width||1.2)*.45,0,(p.width||1.2)*.45]){ray.set(new THREE.Vector3(point.x+dz/Math.hypot(dx,dz)*width,30,point.z-dx/Math.hypot(dx,dz)*width),down);if(ray.intersectObject(g.userData.land,false).length)hits++;}ends.push({island:network.vertices[key].island,landHits:hits,samples:3});}bridges.push({from:p.from,to:p.to,ends});}let supported=0,samples=0;const gaps=[];const surfaces=[...walkSurfaces,...[...locations.values()].map(g=>g.userData.land)];for(const p of network.paths){for(let d=0;d<=p.length;d+=.35){const pt=pointAt(p,d).point;ray.set(new THREE.Vector3(pt.x,30,pt.z),down);samples++;const hit=ray.intersectObjects(surfaces,false)[0];if(hit&&Math.abs(hit.point.y-pt.y)<.32)supported++;else gaps.push({path:p.style?.id||p.island,point:pt,surfaceY:hit?.point.y});}}return {bridges,supported,samples,gaps};}
 for(const [x,z,r,h] of [[-29,3,2.5,.5],[-13,-28,2.1,1.8],[31,-6,3.1,.35],[0,31,2.7,.9]]){const factor=Math.max(1,mapExtent/27);let g=island(x*factor,z*factor,r,cream,h);tree(g,-.7,0,2,.7);tree(g,.7,-.4,0,.8);}

 const halloween=createDecorations(scene,camera,locations,data.appearance);
 const environment=createSeascape(scene,locations);
 // 細短水紋保留安靜的海面，不使用外部紋理。
 const waveMat=mat('#ece1ed');for(let i=0;i<45;i++){let x=Math.sin(i*5.13)*37,z=Math.cos(i*2.71)*32;if([...locations.values()].some(g=>Math.hypot(x-g.position.x,z-g.position.z)<6))continue;box(scene,1.1+(i%3)*.4,.015,.055,waveMat,x,-1.2,z);}
 function courseNameFor(id){return data.courses.find(c=>c.id===id)?.name||data.center.name;}
 for(const [id,g]of locations){g.userData.islandId=id;g.traverse(o=>{if(o.isMesh){o.userData.island=id;pickables.push(o)}});const button=document.createElement('button');button.title=id==='center'?data.center.name:courseNameFor(id);button.setAttribute('aria-label',button.title);button.className='island-label'+(id==='center'?' center':'');button.dataset.island=id;const course=data.courses.find(c=>c.id===id);const plate=document.createElement('span');plate.className='island-name-plate';const number=document.createElement('b');number.textContent=id==='center'?'✦':String(course.order).padStart(2,'0');plate.append(number,document.createTextNode(id==='center'?data.center.name:course.name));button.append(plate);button.addEventListener('click',e=>{e.stopPropagation();focusIsland(id)});const object=new CSS2DObject(button);object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);g.add(object);labels.push({id,object,button});}
 for(const [id,g]of locations){const button=document.createElement('button');button.className='building-label';button.dataset.building=id;button.innerHTML=id==='center'?'<span>進入備課室 ↗</span>':'<span>教材 ↗</span>';button.setAttribute('aria-label',id==='center'?'點選中央主建築進入3D備課室':'點選主建築閱讀詳細教材');button.addEventListener('click',e=>{e.stopPropagation();enterBuilding(id);});const object=new CSS2DObject(button);object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);g.add(object);buildingLabels.push({id,object,button});}
 let reduced=false,frame=null,flight=null,selected=null,light='day',theme='morning',elapsed=0,last=0,rendering=false,shadowElapsed=0;
 let layoutKey='',overviewNeedsSpace='fit';
 function layoutLabels(){labels.forEach(l=>l.button.style.visibility=selected?'hidden':'visible');buildingLabels.forEach(l=>l.button.style.visibility=l.id===selected?'visible':'hidden');if(selected){if(layoutKey!==selected){leaders.replaceChildren();layoutKey=selected;}return;}const w=host.clientWidth,h=host.clientHeight;const key=[w,h,selected,camera.zoom,...camera.matrixWorld.elements].map(n=>typeof n==='number'?n.toFixed(3):n).join(',');if(key===layoutKey)return;layoutKey=key;const top=h<350?65:85,guideHeight=host.parentElement.querySelector('.map-guide')?.offsetHeight||45,bottom=h-Math.max(80,guideHeight+35);const entries=labels.map(l=>{const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera);return {...l,w:l.button.querySelector('.island-name-plate').offsetWidth,h:l.button.querySelector('.island-name-plate').offsetHeight,rawX:(p.x+1)*w/2,rawY:(-p.y+1)*h/2};}).sort((a,b)=>a.id===selected?-1:b.id===selected?1:a.rawY-b.rawY);placeOverviewLabels(entries,w,h);
 leaders.replaceChildren();for(const l of entries){l.button.style.left=`${l.x-l.rawX}px`;l.button.style.top=`${l.y-l.rawY}px`;}}

 const personLines=document.createElementNS('http://www.w3.org/2000/svg','g');
 function layoutPeople(){if(!selected){residents.labels.forEach(l=>l.button.style.visibility='hidden');personLines.replaceChildren();return;}const selectedIsland=locations.get(selected);const w=host.clientWidth,h=host.clientHeight,hostRect=host.getBoundingClientRect(),occupied=[];const rectFor=e=>{const r=e.getBoundingClientRect();return{x:r.left-hostRect.left,y:r.top-hostRect.top,w:r.width,h:r.height};};
 for(const l of [...labels,...buildingLabels])if(l.button.style.visibility!=='hidden')occupied.push(rectFor(l.button));for(const el of host.parentElement.querySelectorAll('.map-guide,.overview,.map-heading')){const r=rectFor(el);if(r.y<h&&r.y+r.h>0)occupied.push(r);}
 const entries=[...residents.labels].sort((a,b)=>Number(b.actor.hover)-Number(a.actor.hover));if(!personLines.isConnected)leaders.appendChild(personLines);personLines.replaceChildren();
 for(const l of entries){const position=l.actor.g.position;const isHost=l.button.dataset.hostIsland;const near= Math.hypot(position.x-selectedIsland.position.x,position.z-selectedIsland.position.z)<selectedIsland.userData.radius+.7;if((isHost&&isHost!==selected)||!near){l.button.style.visibility='hidden';continue;}const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera),rawX=(p.x+1)*w/2,rawY=(-p.y+1)*h/2;const bw=l.button.offsetWidth,bh=l.button.offsetHeight;if(p.z>1||rawX<-30||rawX>w+30||rawY<-30||rawY>h+30){l.button.style.visibility='hidden';continue;}l.button.style.visibility='visible';
 const fits=(x,y)=>x>=bw/2+3&&x<=w-bw/2-3&&y>=bh/2+6&&y<=h-bh/2-8&&!occupied.some(r=>x-bw/2<r.x+r.w+2&&x+bw/2>r.x-2&&y-bh/2<r.y+r.h+2&&y+bh/2>r.y-2);
 let choices=[];for(const dy of [0,-24,24,-48,48,-72,72])for(const dx of [0,-25,25,-50,50,-75,75]){let x=rawX+dx,y=rawY+dy;if(fits(x,y))choices.push({x,y,cost:Math.hypot(dx,dy)});}
 if(!choices.length)for(let y=bh/2+8;y<h-bh/2-10;y+=12)for(let x=bw/2+6;x<w-bw/2-5;x+=12)if(fits(x,y))choices.push({x,y,cost:Math.hypot(x-rawX,y-rawY)});
 choices.sort((a,b)=>a.cost-b.cost);const best=choices[0]||{x:Math.max(bw/2+3,Math.min(w-bw/2-3,rawX)),y:Math.max(bh/2+8,Math.min(h-bh/2-8,rawY))};l.button.style.left=`${best.x-rawX}px`;l.button.style.top=`${best.y-rawY}px`;occupied.push({x:best.x-bw/2,y:best.y-bh/2,w:bw,h:bh});

 }
 }
 function render(now=0){frame=null;rendering=true;const dt=Math.min((now-last)/1000,.05)||0;last=now;if(interior.active){renderer.shadowMap.autoUpdate=true;interior.render(dt,reduced);renderer.shadowMap.autoUpdate=false;rendering=false;if(!reduced)frame=requestAnimationFrame(render);return;}if(!reduced&&!flight){elapsed+=dt;shadowElapsed+=dt;if(shadowElapsed>.8){renderer.shadowMap.needsUpdate=true;shadowElapsed=0;}residents.update(dt);halloween.update(dt);environment.update(dt);animated.forEach(({obj,kind,base})=>{if(kind==='boat')obj.position.y=base+Math.sin(elapsed*.8+obj.position.x)*.07;if(kind==='halo')obj.rotation.y=elapsed*.2;if(kind==='gear')obj.rotation.z=elapsed*.12;if(kind==='bell')obj.rotation.z=Math.sin(elapsed*3)*.15;});}if(flight&&!reduced){const t=Math.min((performance.now()-flight.start)/650,1),s=t*t*t*(10+t*(-15+6*t));controls.target.lerpVectors(flight.targetFrom,flight.targetTo,s);const orbit=new THREE.Spherical(THREE.MathUtils.lerp(flight.orbitFrom.radius,flight.orbitTo.radius,s),THREE.MathUtils.lerp(flight.orbitFrom.phi,flight.orbitTo.phi,s),THREE.MathUtils.lerp(flight.orbitFrom.theta,flight.orbitTo.theta,s));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));camera.zoom=Math.exp(THREE.MathUtils.lerp(Math.log(flight.zoomFrom),Math.log(flight.zoomTo),s));camera.updateProjectionMatrix();if(t===1){camera.position.copy(flight.to);controls.target.copy(flight.targetTo);camera.zoom=flight.zoomTo;flight=null;controls.enableDamping=!reduced;}}controls.update();if(!selected&&!flight&&overviewNeedsSpace){fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);if(overviewNeedsSpace==='fit')fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight,true);else{camera.zoom*=.90;camera.updateProjectionMatrix();fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);}overviewNeedsSpace=false;}halloween.faceCamera();renderer.render(scene,camera);labelRenderer.render(scene,camera);layoutLabels();layoutPeople();rendering=false;if(!reduced||flight)frame=requestAnimationFrame(render);}
 function invalidate(){if(frame===null&&!rendering)frame=requestAnimationFrame(render);}
 function resize(){const w=host.clientWidth,h=host.clientHeight;const worldWidth=mapWidth*(w<500?76/83:w<800?79/83:1);camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=worldWidth/(w/h)/2;camera.bottom=-camera.top;if(!selected){camera.zoom=1;overviewNeedsSpace='fit';}layoutKey='';camera.updateProjectionMatrix();renderer.setSize(w,h);labelRenderer.setSize(w,h);invalidate();}new ResizeObserver(resize).observe(host);
 controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{flight=null;controls.enableDamping=!reduced;});
 function clearOrbitInertia(){const position=camera.position.clone(),target=controls.target.clone(),zoom=camera.zoom;controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);camera.zoom=zoom;controls.update();}
 function fly(target,zoom,position=null,kind='island'){const destination=position||target.clone().add(cameraOffset.clone());clearOrbitInertia();if(reduced){controls.target.copy(target);camera.position.copy(destination);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();flight=null;}else{const orbitFrom=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),orbitTo=new THREE.Spherical().setFromVector3(destination.clone().sub(target));orbitTo.theta=orbitFrom.theta+Math.atan2(Math.sin(orbitTo.theta-orbitFrom.theta),Math.cos(orbitTo.theta-orbitFrom.theta));flight={kind,start:performance.now(),from:camera.position.clone(),to:destination.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),orbitFrom,orbitTo,zoomFrom:camera.zoom,zoomTo:zoom};}invalidate();}
 function bestOverview(){const target=new THREE.Vector3(0,3,0),preview=camera.clone();preview.position.copy(target).add(cameraOffset.clone());preview.zoom=1;preview.lookAt(target);preview.updateProjectionMatrix();preview.updateMatrixWorld(true);fitOverview(preview,{target},locations,host.clientWidth,host.clientHeight,true);return {target,position:preview.position.clone(),zoom:preview.zoom};}
 function overview(){if(interior.active)leaveInterior();const pose=bestOverview();selected=null;overviewNeedsSpace=false;labels.forEach(l=>l.button.classList.remove('selected'));onFocus?.(null);fly(pose.target,pose.zoom,pose.position,'overview');}
 const interior=createInterior(renderer,host,{appearance:data.appearance,onMaterial:()=>onSelect('center'),onExit:leaveInterior,onInvalidate:invalidate});
 function leaveInterior(){interior.leave();controls.enabled=true;labelRenderer.domElement.hidden=false;leaders.style.display='';onFocus?.('center');invalidate();}
 function enterBuilding(id){if(id!=='center'){onSelect(id);return;}interior.enter();controls.enabled=false;flight=null;labelRenderer.domElement.hidden=true;leaders.style.display='none';onFocus?.('interior');invalidate();}
 const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){if(!selected){overviewNeedsSpace=true;invalidate();}return;}if(interior.active){interior.pick(e);return;}const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables,false)[0];if(hit?.object.userData.resident)onResident?.(hit.object.userData.resident);else if(hit?.object.userData.host)onHost?.();else if(hit){const id=hit.object.userData.island;if(selected===id&&hit.object.userData.building===id)enterBuilding(id);else focusIsland(id);}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);onFailure?.();});
 function focusIsland(id){if(interior.active)leaveInterior();const g=locations.get(id);if(!g)return;selected=id;labels.forEach(l=>l.button.classList.toggle('selected',l.id===id));onFocus?.(id);const phone=host.clientWidth<500,target=g.position.clone();target.y+=id==='center'?1.5:1;const zoom=(camera.right-camera.left)*(id==='center'?(phone?.72:.36):(phone?.82:.46))/(g.userData.radius*2);fly(target,Math.min(controls.maxZoom,zoom));requestAnimationFrame(()=>{if(selected===id&&!document.querySelector('#panel:not([hidden]),dialog[open]'))buildingLabels.find(l=>l.id===id)?.button.focus({preventScroll:true});});}resize();invalidate();return {overview,select(id){if(interior.active&&id==='center')return;focusIsland(id);},setTheme(t){theme=t;layoutKey='';const color=t==='night'?palette.night:t==='mist'?palette.mist:palette.water;water.color.set(color);renderer.setClearColor(color);waveMat.color.set(t==='night'?'#68577f':'#ece1ed');invalidate();},setLighting(v){renderer.shadowMap.needsUpdate=true;light=v;const night=v==='night';ambient.intensity=night?1.65:v==='dusk'?1.8:1.9;sun.intensity=night?.7:v==='dusk'?1.6:2.5;sun.color.set(night?'#dec8f1':v==='dusk'?'#ffd39b':'#fff0dd');sun.position.set(night?-25:-30,night?35:55,v==='dusk'?-20:22);warm.emissiveIntensity=night?2.8:v==='dusk'?1.1:.15;halloween.setLighting(v);environment.setLighting(v);invalidate();},setReduced(v){renderer.shadowMap.needsUpdate=true;reduced=v;controls.enableDamping=!v;if(v){residents.pause();if(flight){camera.position.copy(flight.to);controls.target.copy(flight.targetTo);camera.zoom=flight.zoomTo;camera.updateProjectionMatrix();}flight=null;if(frame){cancelAnimationFrame(frame);frame=null;}animated.forEach(a=>{if(a.kind==='boat')a.obj.position.y=a.base;});}invalidate();},inspectWalkways,getDiagnostics(){return {transition:flight?.kind||null,target:controls.target.toArray(),labelAnchors:labels.map(l=>{const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera);return {id:l.id,x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2};}),labelSafeBounds:projectIslandBounds(locations,camera,host.clientWidth,host.clientHeight),interior:interior.snapshot(),environment:environment.snapshot(),islandLayout:nodes.map(n=>({...n})),bridges:bridgeView.summary(),decorations:halloween.snapshot(),halloween:halloween.snapshot(),residents:residents.snapshot(),hosts:residents.hostSnapshot(),selected,islands:locations.size,labels:labels.length,reduced,theme,light,camera:camera.position.toArray(),zoom:camera.zoom};}};
}
