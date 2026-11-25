import * as THREE from 'three';
import { addMainRoad } from './road_01.js';
import { addSecondaryRoad } from './road_02.js';
import { addNarrowRoad } from './road_03.js';
import { addDirtRoad } from './dirt_road.js';
function makeAsphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#454a49';ctx.fillRect(0,0,512,512);
 for(let i=0;i<21000;i++){const x=Math.random()*512,y=Math.random()*512,v=35+Math.random()*65;ctx.fillStyle='rgba('+v+','+v+','+v+','+(Math.random()*0.16)+')';ctx.fillRect(x,y,1+Math.random()*2,1+Math.random()*2);}
 for(let i=0;i<22;i++){ctx.strokeStyle='rgba(20,22,21,0.36)';ctx.lineWidth=0.5+Math.random()*1.2;ctx.beginPath();const x=Math.random()*512,y=Math.random()*512;ctx.moveTo(x,y);ctx.lineTo(x+(Math.random()-0.5)*60,y+15+Math.random()*60);ctx.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,3);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export class RoadManager{
 constructor(scene){this.scene=scene;this.roads=[];this.texture=null;}
 init(){this.texture=makeAsphaltTexture();this.roads.push(addMainRoad(this.scene,this.texture),addSecondaryRoad(this.scene,this.texture),addNarrowRoad(this.scene,this.texture),addDirtRoad(this.scene));}
 distanceToRoad(x,z){
  let nearest=Infinity;
  for(const road of this.roads){const {points,width}=road.userData.road;
   for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
    const px=a[0]+dx*t,pz=a[1]+dz*t;nearest=Math.min(nearest,Math.hypot(x-px,z-pz)-width*0.5);
   }
  }return nearest;
 }
}