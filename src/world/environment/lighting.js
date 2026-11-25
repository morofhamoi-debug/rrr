import * as THREE from 'three';
export class Lighting{
 constructor(scene){
  this.scene=scene;this.hemisphere=new THREE.HemisphereLight(0xc9dbe1,0x5a553d,1.25);scene.add(this.hemisphere);
  this.sun=new THREE.DirectionalLight(0xffe1b5,2.25);this.sun.position.set(-280,420,-220);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-300;this.sun.shadow.camera.right=300;
  this.sun.shadow.camera.top=300;this.sun.shadow.camera.bottom=-300;this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=1100;
  this.sun.shadow.bias=-0.00012;scene.add(this.sun);this.ambient=new THREE.AmbientLight(0xffffff,0.18);scene.add(this.ambient);
 }
 setQuality(s){const size=s.shadowQuality==='high'?2048:1024;this.sun.shadow.mapSize.set(size,size);this.sun.castShadow=s.shadowQuality!=='off';this.sun.shadow.needsUpdate=true;}
 update(time,camera){
  const angle=time/24*Math.PI*2-Math.PI*0.5,elevation=Math.sin(angle),day=THREE.MathUtils.clamp(elevation*0.82+0.32,0.06,1),x=Math.cos(angle);
  this.sun.position.set(camera.x-x*280,camera.y+Math.max(28,elevation*430),camera.z-250);this.sun.target.position.copy(camera);
  this.sun.intensity=0.16+day*2.15;this.hemisphere.intensity=0.35+day*1.05;this.ambient.intensity=0.08+day*0.16;
  this.sun.color.setHSL(0.105+day*0.015,0.42,0.72+day*0.15);
 }
}