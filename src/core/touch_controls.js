export class TouchControls{
 constructor(camera){
  this.camera=camera;this.activeLookPointer=null;this.lookPointers=new Map();this.lastLook={x:0,y:0};this.lastPinchDistance=0;
  this.stick=document.querySelector('#move-stick');this.knob=this.stick?.querySelector('.stick-knob');this.lookZone=document.querySelector('#look-zone');
  this.coarse=window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  document.documentElement.classList.toggle('touch-device',this.coarse);
  if(!this.stick||!this.coarse)return;
  this.bindJoystick();this.bindLook();this.bindHoldButton('#touch-up',1);this.bindHoldButton('#touch-down',-1);this.bindSprint();
 }
 bindJoystick(){
  const update=e=>{const r=this.stick.getBoundingClientRect(),radius=r.width*.34;let x=(e.clientX-(r.left+r.width/2))/radius,y=(e.clientY-(r.top+r.height/2))/radius;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}this.knob.style.transform='translate('+x*radius+'px,'+y*radius+'px)';this.camera.setTouchMove(x,-y);};
  this.stick.addEventListener('pointerdown',e=>{e.preventDefault();this.movePointer=e.pointerId;this.stick.setPointerCapture(e.pointerId);this.stick.classList.add('is-active');update(e);});
  this.stick.addEventListener('pointermove',e=>{if(e.pointerId===this.movePointer){e.preventDefault();update(e);}});
  const release=e=>{if(e.pointerId!==this.movePointer)return;this.movePointer=null;this.camera.setTouchMove(0,0);this.knob.style.transform='translate(0,0)';this.stick.classList.remove('is-active');};
  this.stick.addEventListener('pointerup',release);this.stick.addEventListener('pointercancel',release);this.stick.addEventListener('lostpointercapture',release);
 }
 bindLook(){
  const distance=()=>{const p=[...this.lookPointers.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
  this.lookZone.addEventListener('pointerdown',e=>{
   if(e.target.closest('button'))return;e.preventDefault();this.lookZone.setPointerCapture(e.pointerId);
   this.lookPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(this.lookPointers.size===1){this.activeLookPointer=e.pointerId;this.lastLook={x:e.clientX,y:e.clientY};}
   if(this.lookPointers.size===2){this.activeLookPointer=null;this.lastPinchDistance=distance();}
   this.lookZone.classList.add('is-active');
  });
  this.lookZone.addEventListener('pointermove',e=>{
   if(!this.lookPointers.has(e.pointerId))return;e.preventDefault();
   const p=this.lookPointers.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;
   this.lookPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(this.lookPointers.size>=2){const next=distance();if(this.lastPinchDistance)this.camera.zoomBy((next-this.lastPinchDistance)*.11);this.lastPinchDistance=next;return;}
   if(e.pointerId===this.activeLookPointer)this.camera.rotate(dx*1.45,dy*1.45);
  });
  const release=e=>{
   if(!this.lookPointers.has(e.pointerId))return;this.lookPointers.delete(e.pointerId);this.lastPinchDistance=0;
   if(this.lookPointers.size===1){const [id,p]=this.lookPointers.entries().next().value;this.activeLookPointer=id;this.lastLook=p;}
   else this.activeLookPointer=null;
   if(this.lookPointers.size===0)this.lookZone.classList.remove('is-active');
  };
  this.lookZone.addEventListener('pointerup',release);this.lookZone.addEventListener('pointercancel',release);this.lookZone.addEventListener('lostpointercapture',release);
 }
 bindHoldButton(selector,direction){
  const b=document.querySelector(selector),press=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);this.camera.setTouchVertical(direction);b.classList.add('is-pressed');},release=()=>{this.camera.setTouchVertical(0);b.classList.remove('is-pressed');};
  b.addEventListener('pointerdown',press);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 }
 bindSprint(){
  const b=document.querySelector('#touch-sprint'),press=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);this.camera.setTouchSprint(true);b.classList.add('is-pressed');},release=()=>{this.camera.setTouchSprint(false);b.classList.remove('is-pressed');};
  b.addEventListener('pointerdown',press);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 }
}