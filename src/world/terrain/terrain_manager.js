import * as THREE from 'three';
import { fieldHeight01 } from './field_01.js';
import { fieldHeight02,fieldTint02 } from './field_02.js';
import { fieldHeight03,soilFactor } from './field_03.js';
export function terrainHeight(x,z){
 const blend=Math.max(0,Math.min(1,(Math.sin(x*0.0017+z*0.0012)+1)*0.5));
 return fieldHeight01(x,z)*0.56+fieldHeight02(x,z)*0.24+fieldHeight03(x,z)*0.2+blend*0.25;
}
export function terrainColor(x,z,h){
 const patch=fieldTint02(x,z),soil=soilFactor(x,z),slope=Math.max(0,Math.min(1,(Math.abs(h)-2.5)/9));
 return new THREE.Color(Math.max(0.06,0.14+patch*0.025+soil*0.018+slope*0.035),
 Math.max(0.1,0.23+patch*0.035-soil*0.02-slope*0.025),Math.max(0.04,0.105+patch*0.012+soil*0.008));
}
export class TerrainManager{
 constructor(scene){this.scene=scene;this.chunks=new Map();this.chunkSize=180;this.radius=2;this.subdivisions=34;this.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.98,metalness:0});}
 setSettings(s){this.radius=s.drawDistance==='high'?3:s.drawDistance==='medium'?2:1;this.subdivisions=s.textureQuality==='high'?38:24;}
 heightAt(x,z){return terrainHeight(x,z);}
 createChunk(cx,cz){
  const key=cx+':'+cz;if(this.chunks.has(key))return;
  const n=this.subdivisions,positions=[],colors=[],indices=[],sx=cx*this.chunkSize,sz=cz*this.chunkSize;
  for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){
   const x=sx+ix/n*this.chunkSize,z=sz+iz/n*this.chunkSize,y=terrainHeight(x,z),c=terrainColor(x,z,y);
   positions.push(x,y,z);colors.push(c.r,c.g,c.b);
  }
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,this.material);mesh.name='terrain-'+key;mesh.receiveShadow=true;mesh.frustumCulled=true;
  this.scene.add(mesh);this.chunks.set(key,mesh);
 }
 update(pos){
  const cx=Math.floor(pos.x/this.chunkSize),cz=Math.floor(pos.z/this.chunkSize);
  for(let z=cz-this.radius;z<=cz+this.radius;z++)for(let x=cx-this.radius;x<=cx+this.radius;x++)this.createChunk(x,z);
  for(const [key,mesh] of this.chunks){const [x,z]=key.split(':').map(Number);
   if(Math.abs(x-cx)>this.radius+1||Math.abs(z-cz)>this.radius+1){this.scene.remove(mesh);mesh.geometry.dispose();this.chunks.delete(key);}
  }
 }
 dispose(){for(const mesh of this.chunks.values()){this.scene.remove(mesh);mesh.geometry.dispose();}this.chunks.clear();this.material.dispose();}
}