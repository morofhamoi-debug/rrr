import * as THREE from 'three';
const SAVE_KEY = 'leonida-camera-v1';
export class FreeCamera {
  constructor(camera, canvas) {
    this.camera=camera;this.canvas=canvas;this.keys=new Set();this.enabled=false;this.locked=false;this.dragging=false;
    this.sensitivity=0.0022;this.speed=34;this.yaw=-Math.PI*0.5;this.pitch=-0.12;
    this.direction=new THREE.Vector3();this.forward=new THREE.Vector3();this.right=new THREE.Vector3();this.up=new THREE.Vector3(0,1,0);
    this.onPointerLock=()=>{};this.bindEvents();this.camera.position.set(22,24,78);this.updateLook();
  }
  bindEvents() {
    window.addEventListener('keydown',(e)=>{if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){this.keys.add(e.code);if(this.enabled)e.preventDefault();}});
    window.addEventListener('keyup',(e)=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.keys.clear());
    this.canvas.addEventListener('click',()=>{if(this.enabled&&!this.locked&&this.canvas.requestPointerLock)this.canvas.requestPointerLock();});
    document.addEventListener('pointerlockchange',()=>{this.locked=document.pointerLockElement===this.canvas;this.onPointerLock(this.locked);});
    this.canvas.addEventListener('mousedown',()=>{if(!this.locked&&this.enabled)this.dragging=true;});
    window.addEventListener('mouseup',()=>{this.dragging=false;});
    window.addEventListener('mousemove',(e)=>{if(this.enabled&&(this.locked||this.dragging))this.rotate(e.movementX,e.movementY);});
    this.canvas.addEventListener('wheel',(e)=>{if(!this.enabled)return;e.preventDefault();this.camera.position.addScaledVector(this.direction,(e.deltaY>0?1:-1)*Math.max(3,this.speed*0.22));},{passive:false});
  }
  rotate(dx,dy){this.yaw-=dx*this.sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*this.sensitivity,-1.42,1.42);this.updateLook();}
  updateLook(){this.direction.set(Math.cos(this.pitch)*Math.cos(this.yaw),Math.sin(this.pitch),Math.cos(this.pitch)*Math.sin(this.yaw)).normalize();this.camera.lookAt(this.camera.position.clone().add(this.direction));}
  getForward(){return this.forward.set(Math.cos(this.yaw),0,Math.sin(this.yaw)).normalize();}
  update(dt){
    if(!this.enabled)return;const forward=this.getForward();this.right.crossVectors(forward,this.up).normalize();
    const speed=this.speed*((this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'))?2.7:1)*dt;
    if(this.keys.has('KeyW'))this.camera.position.addScaledVector(forward,speed);
    if(this.keys.has('KeyS'))this.camera.position.addScaledVector(forward,-speed);
    if(this.keys.has('KeyD'))this.camera.position.addScaledVector(this.right,speed);
    if(this.keys.has('KeyA'))this.camera.position.addScaledVector(this.right,-speed);
    if(this.keys.has('KeyE'))this.camera.position.y+=speed;if(this.keys.has('KeyQ'))this.camera.position.y-=speed;
    this.camera.position.y=Math.max(2.2,Math.min(420,this.camera.position.y));this.updateLook();
  }
  enableInput(v){this.enabled=v;this.keys.clear();}
  releasePointer(){if(document.pointerLockElement===this.canvas)document.exitPointerLock();}
  setSensitivity(v){this.sensitivity=THREE.MathUtils.clamp(Number(v)/100,0.0005,0.008);}
  save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({position:this.camera.position.toArray(),yaw:this.yaw,pitch:this.pitch}));}catch(e){console.warn('Camera position was not saved:',e);}}
  restore(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!s||!Array.isArray(s.position))return false;this.camera.position.fromArray(s.position);this.yaw=Number(s.yaw)||this.yaw;this.pitch=Number(s.pitch)||this.pitch;this.updateLook();return true;}catch{return false;}}
}