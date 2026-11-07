import * as THREE from 'three';
import {createHalloween} from './halloween.mjs';
import {paletteFor} from './appearance.mjs';
export function createDecorations(scene,camera,locations,appearance={}){
 const theme=appearance.theme||'nature';
 if(theme==='halloween'){const d=createHalloween(scene,camera,locations);return {...d,snapshot:()=>({theme,...d.snapshot()})};}
 const p=paletteFor(appearance),items=[],mat=new THREE.MeshStandardMaterial({color:theme==='ocean'?'#effaff':theme==='space'?'#ffe4a3':p.pink,roughness:.6,transparent:theme==='ocean',opacity:theme==='ocean'?.55:1,emissive:'#c5c4d5',emissiveIntensity:.1});
 const anchors=[...locations.values()];
 for(let i=0;i<Math.max(8,Math.min(24,anchors.length*2));i++){const anchor=anchors[i%anchors.length].position.clone(),g=new THREE.Group();scene.add(g);const add=(geo,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};const wings=[];
 if(theme==='space'){const shape=new THREE.Shape();for(let k=0;k<10;k++){const a=k*Math.PI/5,r=k%2?.14:.34;if(k)shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);else shape.moveTo(Math.sin(a)*r,Math.cos(a)*r);}shape.closePath();add(new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:false}));}
 else if(theme==='ocean'){add(new THREE.SphereGeometry(.24+(i%3)*.05,10,8));}
 else {add(new THREE.SphereGeometry(.08,6,4));for(const side of [-1,1]){const w=add(new THREE.SphereGeometry(.23,8,6),side*.18);w.scale.set(1,1.2,.18);wings.push(w);}}
 items.push({g,anchor,wings,phase:i*.72});}
 let time=0;function update(dt){time+=dt;for(const a of items){const t=time*.15+a.phase;a.g.position.set(a.anchor.x+Math.sin(t)*3.4,a.anchor.y+5.8+Math.sin(t*1.4)*.7,a.anchor.z+Math.cos(t)*3.2);a.wings.forEach((w,i)=>w.rotation.y=Math.sin(time*6+a.phase)*.6*(i?1:-1));}}
 update(0);return {update,faceCamera(){for(const a of items)a.g.quaternion.copy(camera.quaternion);},setLighting(v){mat.emissiveIntensity=v==='night'?.8:.1;},snapshot(){return {theme,objects:items.map(a=>({position:a.g.position.toArray()})),pumpkins:0,witchRoofs:0,bats:[],pathObstructions:0};}};
}
