import * as THREE from 'three';
import { terrainHeight } from '../terrain/terrain_manager.js';
export function createRibbon(points,width,material,offset=0.16,segments=110,sideShift=0){
 const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+offset,z)),false,'centripetal');
 const positions=[],uvs=[],indices=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,p=curve.getPointAt(t),tan=curve.getTangentAt(t).setY(0).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x);
  for(const edge of [-1,1]){const v=p.clone().addScaledVector(side,sideShift+edge*width*0.5);v.y=terrainHeight(v.x,v.z)+offset+0.012;positions.push(v.x,v.y,v.z);uvs.push(edge===-1?0:1,t*curve.getLength()/8);}
 }
 for(let i=0;i<segments;i++){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.castShadow=false;return{mesh,curve};
}
export function createRoadMarkings(group,points,width,dashed=false){
 const edgeMat=new THREE.MeshStandardMaterial({color:0xe5dfc7,roughness:0.72});
 group.add(createRibbon(points,0.16,edgeMat,0.27,110,-width*0.5+0.7).mesh);
 group.add(createRibbon(points,0.16,edgeMat,0.27,110,width*0.5-0.7).mesh);if(!dashed)return;
 const center=new THREE.MeshStandardMaterial({color:0xe5bd65,roughness:0.68});
 const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+0.3,z)),false,'centripetal');
 const length=curve.getLength(),dash=7.5,gap=7;
 for(let start=0;start<length;start+=dash+gap){const a=curve.getUtoTmapping(0,start/length),b=curve.getUtoTmapping(0,Math.min(length,start+dash)/length);
  const seg=[curve.getPoint(a),curve.getPoint(b)].map(p=>[p.x,p.z]);group.add(createRibbon(seg,0.18,center,0.3,8).mesh);}
}