import * as THREE from 'three';
import { fieldHeight01 } from './field_01.js';
import { fieldHeight02,fieldTint02 } from './field_02.js';
import { fieldHeight03,soilFactor } from './field_03.js';
import { createSurfaceMaterial } from '../materials/surface_materials.js';
export function terrainHeight(x,z){
 const blend=Math.max(0,Math.min(1,(Math.sin(x*.0017+z*.0012)+1)*.5));
 const broad=fieldHeight01(x,z)*.56+fieldHeight02(x,z)*.24+fieldHeight03(x,z)*.2;
 const rolling=Math.sin(x*.0008+z*.0011)*1.6+Math.cos(z*.00075-x*.0006)*1.25;
 return broad+blend*.25+rolling;
}
export function terrainColor(x,z,h){
 const p=fieldTint02(x,z),s=soilFactor(x,z),slope=Math.max(0,Math.min(1,(Math.abs(h)-2.5)/9));
 return new THREE.Color(
  THREE.MathUtils.clamp(.91+p*.12+s*.055-slope*.12,.66,1.08),
  THREE.MathUtils.clamp(.94+p*.14-s*.045-slope*.1,.68,1.1),
  THREE.MathUtils.clamp(.82+p*.09+s*.025-slope*.08,.62,1.02)
 );
}
export class TerrainManager{
 constructor(scene){
  this.scene=scene;this.chunks=new Map();this.chunkSize=180;this.radius=3;this.baseSegments=72;
  this.material=createSurfaceMaterial('field');this.material.vertexColors=true;this.material.roughness=.96;this.material.envMapIntensity=.35;
 }
 setSettings(settings){
  const radius=settings.drawDistance==='ultra'?4:settings.drawDistance==='high'?3:settings.drawDistance==='medium'?2:1;
  const segments=settings.textureQuality==='ultra'?76:settings.textureQuality==='high'?60:42;
  if(radius===this.radius&&segments===this.baseSegments)return;
  this.radius=radius;this.baseSegments=segments;
 }
 heightAt(x,z){return terrainHeight(x,z);}
 createChunk(cx,cz,segments){
  const key=cx+':'+cz,old=this.chunks.get(key);
  if(old&&old.userData.lodSegments===segments)return;
  if(old){this.scene.remove(old);old.geometry.dispose();this.chunks.delete(key);}
  const n=segments,positions=[],colors=[],uvs=[],indices=[],sx=cx*this.chunkSize,sz=cz*this.chunkSize;
  for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){
   const x=sx+ix/n*this.chunkSize,z=sz+iz/n*this.chunkSize,y=terrainHeight(x,z),t=terrainColor(x,z,y);
   positions.push(x,y,z);colors.push(t.r,t.g,t.b);uvs.push(x/18,z/18);
  }
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('uv2',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,this.material);mesh.name='terrain-'+key;mesh.userData.lodSegments=segments;mesh.receiveShadow=true;mesh.castShadow=false;mesh.frustumCulled=true;
  this.scene.add(mesh);this.chunks.set(key,mesh);
 }
 update(pos){
  const cx=Math.floor(pos.x/this.chunkSize),cz=Math.floor(pos.z/this.chunkSize);
  for(let z=cz-this.radius;z<=cz+this.radius;z++)for(let x=cx-this.radius;x<=cx+this.radius;x++){
   const ring=Math.max(Math.abs(x-cx),Math.abs(z-cz)),segments=ring<=1?this.baseSegments:ring===2?42:ring===3?26:16;
   this.createChunk(x,z,segments);
  }
  for(const [key,mesh] of this.chunks){const [x,z]=key.split(':').map(Number);if(Math.abs(x-cx)>this.radius+1||Math.abs(z-cz)>this.radius+1){this.scene.remove(mesh);mesh.geometry.dispose();this.chunks.delete(key);}}
 }
 dispose(){for(const mesh of this.chunks.values()){this.scene.remove(mesh);mesh.geometry.dispose();}this.chunks.clear();this.material.dispose();}
}