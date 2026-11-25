import * as THREE from 'three';
import { createGrassGeometry,createGrassMaterial } from './grass_01.js';
import { grassColor,seededRandom } from './grass_02.js';
import { terrainHeight } from '../terrain/terrain_manager.js';
export class GrassManager{
 constructor(scene,roads){
  this.scene=scene;this.roads=roads;this.chunks=new Map();this.chunkSize=90;this.radius=2;this.count=1750;this.time=0;
  this.geometry=createGrassGeometry();this.material=createGrassMaterial();this.dummy=new THREE.Object3D();
 }
 setSettings(s){this.radius=s.drawDistance==='high'?3:s.drawDistance==='medium'?2:1;this.count=s.grassQuality==='high'?1900:s.grassQuality==='medium'?1050:420;this.regenerate();}
 makeChunk(cx,cz){
  const key=cx+':'+cz;if(this.chunks.has(key))return;
  const rand=seededRandom((cx+1500)*928371+(cz+1500)*689287),mesh=new THREE.InstancedMesh(this.geometry,this.material,this.count);
  mesh.name='grass-instances-'+key;mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=true;
  const color=new THREE.Color();let placed=0,attempts=0;
  while(placed<this.count&&attempts<this.count*5){
   attempts++;const x=cx*this.chunkSize+rand()*this.chunkSize,z=cz*this.chunkSize+rand()*this.chunkSize;
   if(this.roads.distanceToRoad(x,z)<5.5)continue;
   this.dummy.position.set(x,terrainHeight(x,z)-0.02,z);this.dummy.rotation.set(0,rand()*Math.PI,(rand()-0.5)*0.16);
   const scale=0.55+rand()*1.05;this.dummy.scale.set(scale,scale*(0.65+rand()*0.8),scale);this.dummy.updateMatrix();
   mesh.setMatrixAt(placed,this.dummy.matrix);color.copy(grassColor(Math.floor(rand()*100),rand()));mesh.setColorAt(placed,color);placed++;
  }
  mesh.count=placed;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  this.scene.add(mesh);this.chunks.set(key,mesh);
 }
 update(pos,dt){
  this.time+=dt;if(this.material.userData.shader)this.material.userData.shader.uniforms.uTime.value=this.time;
  const cx=Math.floor(pos.x/this.chunkSize),cz=Math.floor(pos.z/this.chunkSize);
  for(let z=cz-this.radius;z<=cz+this.radius;z++)for(let x=cx-this.radius;x<=cx+this.radius;x++)this.makeChunk(x,z);
  for(const [key,mesh] of this.chunks){const [x,z]=key.split(':').map(Number);
   if(Math.abs(x-cx)>this.radius+1||Math.abs(z-cz)>this.radius+1){this.scene.remove(mesh);mesh.dispose();this.chunks.delete(key);}
  }
 }
 regenerate(){for(const mesh of this.chunks.values()){this.scene.remove(mesh);mesh.dispose();}this.chunks.clear();}
 dispose(){this.regenerate();this.geometry.dispose();this.material.dispose();}
}