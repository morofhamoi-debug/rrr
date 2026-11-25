import * as THREE from 'three';
const SAVE_KEY='leonida-camera-v1';
export class FreeCamera{
 constructor(camera,canvas){
  this.camera=camera;this.canvas=canvas;this.keys=new Set();this.enabled=false;this.locked=false;this.dragging=false;
  this.isTouchDevice=window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  this.sensitivity=.0022;this.speed=34;this.yaw=-Math.PI*.5;this.pitch=-.12;
  this.touchMove={x:0,y:0};this.touchVertical=0;this.touchSprint=false;this.touchTurn=0;this.touchTurnSpeed=1.85;
  this.direction=new THREE.Vector3();this.forward=new THREE.Vector3();this.right=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);
  this.onPointerLock=()=>{};this.bindEvents();this.camera.position.set(22,24,78);this.updateLook();
 }
 bindEvents(){
  window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){this.keys.add(e.code);if(this.enabled)e.preventDefault();}});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('blur',()=>{this.keys.clear();this.setTouchMove(0,0);this.setTouchVertical(0);this.setTouchSprint(false);this.setTouchTurn(0);});
  this.canvas.addEventListener('click',()=>{if(!this.isTouchDevice&&this.enabled&&!this.locked&&this.canvas.requestPointerLock)this.canvas.requestPointerLock();});
  document.addEventListener('pointerlockchange',()=>{this.locked=document.pointerLockElement===this.canvas;this.onPointerLock(this.locked);});
  if(!this.isTouchDevice){
   this.canvas.addEventListener('mousedown',()=>{if(!this.locked&&this.enabled)this.dragging=true;});
   window.addEventListener('mouseup',()=>{this.dragging=false;});
   window.addEventListener('mousemove',e=>{if(this.enabled&&(this.locked||this.dragging))this.rotate(e.movementX,e.movementY);});
   this.canvas.addEventListener('wheel',e=>{if(!this.enabled)return;e.preventDefault();this.zoomBy((e.deltaY>0?1:-1)*Math.max(3,this.speed*.22));},{passive:false});
  }
 }
 // Positive horizontal input always rotates to the right; negative rotates left.
 rotate(dx,dy){this.yaw+=dx*this.sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*this.sensitivity,-1.42,1.42);this.updateLook();}
 zoomBy(distance){this.camera.position.addScaledVector(this.direction,distance);this.camera.position.y=Math.max(2.2,Math.min(420,this.camera.position.y));this.updateLook();}
 updateLook(){this.direction.set(Math.cos(this.pitch)*Math.cos(this.yaw),Math.sin(this.pitch),Math.cos(this.pitch)*Math.sin(this.yaw)).normalize();this.camera.lookAt(this.camera.position.clone().add(this.direction));}
 getForward(){return this.forward.set(Math.cos(this.yaw),0,Math.sin(this.yaw)).normalize();}
 setTouchMove(x,y){this.touchMove.x=THREE.MathUtils.clamp(x,-1,1);this.touchMove.y=THREE.MathUtils.clamp(y,-1,1);}
 setTouchVertical(v){this.touchVertical=THREE.MathUtils.clamp(v,-1,1);}
 setTouchSprint(v){this.touchSprint=Boolean(v);}
 setTouchTurn(v){this.touchTurn=THREE.MathUtils.clamp(Number(v)||0,-1,1);}
 update(dt){
  if(!this.enabled)return;
  const forward=this.getForward();this.right.crossVectors(forward,this.up).normalize();
  let x=this.touchMove.x,y=this.touchMove.y;
  if(this.keys.has('KeyW'))y+=1;if(this.keys.has('KeyS'))y-=1;if(this.keys.has('KeyD'))x+=1;if(this.keys.has('KeyA'))x-=1;
  const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}
  const sprint=this.touchSprint||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'),speed=this.speed*(sprint?2.7:1)*dt;
  this.camera.position.addScaledVector(forward,y*speed);this.camera.position.addScaledVector(this.right,x*speed);
  const vertical=this.touchVertical+(this.keys.has('KeyE')?1:0)-(this.keys.has('KeyQ')?1:0);
  this.camera.position.y+=THREE.MathUtils.clamp(vertical,-1,1)*speed;
  this.camera.position.y=Math.max(2.2,Math.min(420,this.camera.position.y));
  if(this.touchTurn)this.yaw+=this.touchTurn*this.touchTurnSpeed*dt;
  this.updateLook();
 }
 enableInput(v){this.enabled=v;this.keys.clear();this.setTouchMove(0,0);this.setTouchVertical(0);this.setTouchSprint(false);this.setTouchTurn(0);}
 releasePointer(){if(document.pointerLockElement===this.canvas)document.exitPointerLock();}
 setSensitivity(v){this.sensitivity=THREE.MathUtils.clamp(Number(v)/100,.0005,.008);}
 save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({position:this.camera.position.toArray(),yaw:this.yaw,pitch:this.pitch}));}catch(e){console.warn('Camera position was not saved:',e);}}
 restore(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!s||!Array.isArray(s.position))return false;this.camera.position.fromArray(s.position);this.yaw=Number(s.yaw)||this.yaw;this.pitch=Number(s.pitch)||this.pitch;this.updateLook();return true;}catch{return false;}}
}