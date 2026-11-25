import * as THREE from 'three';
import { createGrassGeometry,createGrassMaterial } from './grass_01.js';
import { grassColor,seededRandom } from './grass_02.js';
import { terrainHeight } from '../terrain/terrain_manager.js';
export class GrassManager{
 constructor(scene,roads){
  this.scene=scene;this.roads=roads;this.chunks=new Map();this.chunkSize=90;this.radius=3;this.count=7200;this.time=0;
  this.windSpeed=4.2;this.windDirection=new THREE.Vector2(.7,.3);this.geometry=createGrassGeometry();this.material=createGrassMaterial();this.dummy=new THREE.Object3D();
  this.coarse=window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
 }
 setSettings(s){
  const radius=s.drawDistance==='ultra'?(this.coarse?3:4):s.drawDistance==='high'?3:s.drawDistance==='medium'?2:1;
  const count=s.grassQuality==='ultra'?8200:s.grassQuality==='high'?5600:s.grassQuality==='medium'?3000:1200;
  if(radius===this.radius&&count===this.count)return;this.radius=radius;this.count=count;this.regenerate();
 }
 makeChunk(cx,cz,tier){
  const key=cx+':'+cz,old=this.chunks.get(key);if(old&&old.userData.lodTier===tier)return;
  if(old){this.scene.remove(old);old.dispose();this.chunks.delete(key);}
  const density=[1,.58,.31,.16,.075][tier]||.075,amount=Math.max(180,Math.floor(this.count*density));
  const random=seededRandom((cx+1500)*928371+(cz+1500)*689287),mesh=new THREE.InstancedMesh(this.geometry,this.material,amount);
  mesh.name='grass-instances-'+key;mesh.userData.lodTier=tier;mesh.castShadow=tier===0&&!this.coarse;mesh.receiveShadow=false;mesh.frustumCulled=true;
  const color=new THREE.Color();let placed=0,attempts=0;
  while(placed<amount&&attempts<amount*5){
   attempts++;const x=cx*this.chunkSize+random()*this.chunkSize,z=cz*this.chunkSize+random()*this.chunkSize;
   if(this.roads.distanceToRoad(x,z)<6.3)continue;
   this.dummy.position.set(x,terrainHeight(x,z)-.015,z);this.dummy.rotation.set(0,random()*Math.PI*2,(random()-.5)*.1);
   const scale=.72+random()*1.18;this.dummy.scale.set(scale,scale*(.82+random()*.88),scale);this.dummy.updateMatrix();
   mesh.setMatrixAt(placed,this.dummy.matrix);color.copy(grassColor(Math.floor(random()*100),random()));mesh.setColorAt(placed,color);placed++;
  }
  mesh.count=placed;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  this.scene.add(mesh);this.chunks.set(key,mesh);
 }
 update(pos,dt,weather=null){
  this.time+=dt;if(weather){this.windSpeed=weather.windSpeed;this.windDirection.set(Math.cos(weather.windDirection),Math.sin(weather.windDirection));}
  const shader=this.material.userData.shader;if(shader){shader.uniforms.uTime.value=this.time;shader.uniforms.uWind.value=THREE.MathUtils.clamp(this.windSpeed/5,.25,1.8);shader.uniforms.uWindDirection.value.copy(this.windDirection);}
  const cx=Math.floor(pos.x/this.chunkSize),cz=Math.floor(pos.z/this.chunkSize);
  for(let z=cz-this.radius;z<=cz+this.radius;z++)for(let x=cx-this.radius;x<=cx+this.radius;x++){const ring=Math.max(Math.abs(x-cx),Math.abs(z-cz));this.makeChunk(x,z,Math.min(4,ring));}
  for(const [key,mesh] of this.chunks){const [x,z]=key.split(':').map(Number);if(Math.abs(x-cx)>this.radius+1||Math.abs(z-cz)>this.radius+1){this.scene.remove(mesh);mesh.dispose();this.chunks.delete(key);}}
 }
 regenerate(){for(const mesh of this.chunks.values()){this.scene.remove(mesh);mesh.dispose();}this.chunks.clear();}
 dispose(){this.regenerate();this.geometry.dispose();this.material.dispose();}
}