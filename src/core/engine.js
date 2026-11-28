import * as THREE from 'three';
import { createRenderer, resizeRenderer } from './renderer.js';
import { FreeCamera } from './camera.js';
import { WorldManager } from '../world/world_manager.js';
import { FirstPersonHands } from '../character/first_person_hands.js';

export class Engine {
  constructor(canvas) {
    this.canvas=canvas;this.renderer=null;this.scene=new THREE.Scene();
    this.camera=new FreeCamera(new THREE.PerspectiveCamera(66,window.innerWidth/window.innerHeight,.08,6500),canvas);
    this.world=new WorldManager(this.scene);this.camera.setWorld(this.world);this.hands=new FirstPersonHands(this.camera.camera);
    this.settings={};this.running=false;this.lastTime=0;this.accumulator=0;this.frames=0;this.fps=60;this.onFrame=()=>{};
    this.boundFrame=this.frame.bind(this);
    window.addEventListener('resize',()=>{if(this.renderer)resizeRenderer(this.renderer,this.camera.camera,this.settings);});
  }
  async init(settings){
    this.settings=settings;this.renderer=createRenderer(this.canvas,settings);this.world.init(settings);
    const start={x:137,z:25};
    this.camera.camera.position.set(start.x,this.world.groundHeightAt(start.x,start.z)+this.camera.eyeHeight,start.z);
    this.camera.yaw=0;this.camera.pitch=-.1;this.camera.updateLook();this.applySettings(settings);
  }
  applySettings(settings){
    this.settings=settings;if(!this.renderer)return;
    this.renderer.shadowMap.enabled=settings.shadowQuality!=='off';
    const coarse=window.matchMedia?.('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
    const cap=coarse?1.5:2.2;
    this.renderer.setPixelRatio(Math.min((window.devicePixelRatio||1)*(Number(settings.resolution||100)/100),cap));
    this.camera.setSensitivity(settings.cameraSensitivity);this.world.applySettings(settings);
  }
  start(){if(this.running)return;this.running=true;this.lastTime=performance.now();requestAnimationFrame(this.boundFrame);}
  frame(now){
    if(!this.running)return;requestAnimationFrame(this.boundFrame);
    const dt=Math.min((now-this.lastTime)/1000,.05);this.lastTime=now;this.accumulator+=dt;
    const limit=Number(this.settings.fpsLimit||60),frameMs=limit>=240?0:1000/limit;
    if(frameMs&&this.accumulator*1000<frameMs)return;
    const step=this.accumulator;this.accumulator=0;this.camera.update(step);
    this.hands.root.visible=!this.camera.vehicle;
    this.hands.update(step,this.camera.moveAmount,this.camera.touchSprint);
    this.world.update(step,this.camera.camera);this.renderer.render(this.scene,this.camera.camera);
    this.frames++;this.fpsElapsed=(this.fpsElapsed||0)+step;
    if(this.fpsElapsed>=.5){this.fps=this.frames/this.fpsElapsed;this.frames=0;this.fpsElapsed=0;this.onFrame({fps:this.fps,wind:this.world.windSpeed});}
  }
}
