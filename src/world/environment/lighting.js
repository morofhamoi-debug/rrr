import * as THREE from 'three';
export class Lighting{
 constructor(scene){
  this.scene=scene;this.qualityKey='';this.qualityMultiplier=1;
  this.hemisphere=new THREE.HemisphereLight(0xc8e0e7,0x514b32,1.35);scene.add(this.hemisphere);
  this.sun=new THREE.DirectionalLight(0xffdfb0,2.5);this.sun.position.set(-280,420,-220);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(4096,4096);this.sun.shadow.camera.left=-190;this.sun.shadow.camera.right=190;
  this.sun.shadow.camera.top=190;this.sun.shadow.camera.bottom=-190;this.sun.shadow.camera.near=.5;this.sun.shadow.camera.far=900;
  this.sun.shadow.bias=-.00008;this.sun.shadow.normalBias=.035;this.sun.shadow.radius=3;
  scene.add(this.sun);scene.add(this.sun.target);
  this.ambient=new THREE.AmbientLight(0xffffff,.2);scene.add(this.ambient);
 }
 setQuality(settings){
  const coarse=window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const key=[settings.shadowQuality,settings.lightingQuality,coarse].join(':');
  if(key===this.qualityKey)return;this.qualityKey=key;
  let size=settings.shadowQuality==='ultra'?4096:settings.shadowQuality==='high'?3072:settings.shadowQuality==='medium'?2048:1024;
  if(coarse)size=Math.min(size,2048);
  this.sun.shadow.mapSize.set(size,size);this.sun.castShadow=settings.shadowQuality!=='off';
  this.qualityMultiplier=settings.lightingQuality==='ultra'?1.18:settings.lightingQuality==='high'?1:.82;
  this.sun.shadow.needsUpdate=true;
 }
 update(time,camera){
  const angle=time/24*Math.PI*2-Math.PI*.5,elevation=Math.sin(angle);
  const daylight=THREE.MathUtils.clamp(elevation*.82+.32,.06,1),sunX=Math.cos(angle);
  this.sun.position.set(camera.x-sunX*280,camera.y+Math.max(32,elevation*430),camera.z-250);
  this.sun.target.position.set(camera.x,camera.y,camera.z);
  this.sun.intensity=(.14+daylight*2.45)*this.qualityMultiplier;
  this.hemisphere.intensity=(.32+daylight*1.12)*this.qualityMultiplier;
  this.ambient.intensity=(.06+daylight*.18)*this.qualityMultiplier;
  this.sun.color.setHSL(.105+daylight*.016,.48,.7+daylight*.17);
  this.hemisphere.color.setHSL(.54,.28,.5+daylight*.22);
  if(this.scene.fog){this.scene.fog.color.setHSL(.48,.14,.39+daylight*.24);this.scene.fog.density=this.qualityMultiplier>1.1?.00018:.00024;}
 }
}