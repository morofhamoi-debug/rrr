import { Engine } from './core/engine.js';
import { AudioEnvironment } from './core/audio.js';
import { PlayerProfile } from './systems/player_profile.js';

const JOB_STORAGE_KEY='ezid-russia-courier-job-v1';

export class Game {
  constructor(canvas) {
    this.engine=new Engine(canvas);this.world=this.engine.world;this.audio=new AudioEnvironment();this.profile=new PlayerProfile();
    this.state='menu';this.stateListener=()=>{};this.toastTimer=null;
    this.jobActive=localStorage.getItem(JOB_STORAGE_KEY)==='delivery';
    this.hudTime=document.querySelector('#hud-time');this.hudWeather=document.querySelector('#hud-weather');this.hudFps=document.querySelector('#hud-fps');
    this.hudMoney=document.querySelector('#hud-money');this.hudNickname=document.querySelector('#hud-nickname');
    this.interactionHint=document.querySelector('#interaction-hint');this.interactionText=document.querySelector('#interaction-text');
    this.interactionButton=document.querySelector('#interaction-button');this.pointerHint=document.querySelector('#pointer-hint');this.toastNode=document.querySelector('#toast');
    this.engine.camera.onPointerLock=locked=>this.pointerHint.classList.toggle('is-hidden',locked||this.state!=='playing');
    this.engine.onFrame=stats=>this.updateHud(stats);
  }
  async init(settings){
    await this.engine.init(settings);this.world.city.setJobStage(this.jobActive?'delivery':'start');
    this.engine.camera.restore();this.updateHud({fps:60,wind:this.world.windSpeed});
  }
  run(){this.engine.start();}
  setStateListener(listener){this.stateListener=listener;}
  isPlaying(){return this.state==='playing';}
  async start(resume=false){
    if(resume)this.engine.camera.restore();
    this.state='playing';this.stateListener(this.state);this.audio.start();this.engine.camera.enableInput(true);
    this.toast(this.engine.camera.isTouchDevice
      ? 'Левый джойстик — ходьба. Свайп справа — обзор. Подойдите к машине или маркеру и нажмите «ДЕЙСТВИЕ».'
      : 'WASD — ходьба. Shift — бег. Мышь — обзор. E — действие рядом с машиной или заданием.');
    this.updateInteractionHint();
  }
  openMenu(){
    if(this.state!=='playing')return;
    if(this.engine.camera.vehicle)this.engine.camera.exitVehicle();
    this.state='menu';this.engine.camera.enableInput(false);this.engine.camera.releasePointer();this.engine.camera.save();this.audio.pause();
    this.stateListener(this.state);document.querySelector('#menu-screen').classList.remove('is-hidden');document.querySelector('#hud').classList.add('is-hidden');
    window.dispatchEvent(new CustomEvent('ezid:show-menu'));
  }
  applySettings(settings){
    this.engine.applySettings(settings);this.audio.applySettings(settings);
    document.documentElement.style.setProperty('--ui-scale',String(settings.uiScale/100));this.hudFps.classList.toggle('is-hidden',!settings.showFPS);
  }
  getCurrentAction(){
    const camera=this.engine.camera;
    if(camera.vehicle)return {label:'Выйти из автомобиля',desktop:'Нажмите E, чтобы выйти',touch:'ВЫЙТИ'};
    const vehicle=this.world.city.findNearestVehicle(camera.camera.position,10);
    if(vehicle)return {label:'Сесть в '+vehicle.name,desktop:'Нажмите E, чтобы сесть',touch:'СЕСТЬ В АВТО'};
    const action=this.world.city.getJobAction(camera.camera.position);
    if(action==='start')return {label:'Начать работу курьером',desktop:'Нажмите E, чтобы взять заказ',touch:'ВЗЯТЬ ЗАКАЗ'};
    if(action==='deliver')return {label:'Доставить заказ · +2 500 ₽',desktop:'Нажмите E, чтобы доставить',touch:'ДОСТАВИТЬ'};
    return null;
  }
  updateInteractionHint(){
    const action=this.getCurrentAction();if(!this.interactionHint||!this.interactionButton||!this.interactionText)return;
    this.interactionHint.classList.toggle('is-hidden',!action||!this.isPlaying());if(!action)return;
    this.interactionText.textContent=action.desktop;this.interactionButton.textContent=action.touch;this.interactionButton.setAttribute('aria-label',action.label);
  }
  interact(){
    if(!this.isPlaying())return;
    const camera=this.engine.camera;
    if(camera.vehicle){camera.exitVehicle();this.toast('Вы вышли из автомобиля.');this.updateInteractionHint();return;}
    const vehicle=this.world.city.findNearestVehicle(camera.camera.position,10);
    if(vehicle){camera.enterVehicle(vehicle.source);this.toast('Вы в автомобиле. Джойстик или WASD — газ и поворот. E — выйти.');this.updateInteractionHint();return;}
    const action=this.world.city.getJobAction(camera.camera.position);
    if(action==='start'){
      this.jobActive=true;localStorage.setItem(JOB_STORAGE_KEY,'delivery');this.world.city.setJobStage('delivery');
      this.toast('Заказ принят! Доставьте посылку к зелёному маркеру.');
    }else if(action==='deliver'){
      this.profile.addMoney(2500);const levelUp=this.profile.addExperience(100);this.jobActive=false;localStorage.removeItem(JOB_STORAGE_KEY);
      this.world.city.setJobStage('start');
      this.toast(levelUp?'Доставка выполнена! +2 500 ₽ · новый уровень!':'Доставка выполнена! +2 500 ₽ и 100 опыта.');
    }
    this.updateHud({fps:this.engine.fps||60,wind:this.world.windSpeed});this.updateInteractionHint();
  }
  updateHud(stats){
    const time=this.world.getTime(),h=Math.floor(time),m=Math.floor((time-h)*60),player=this.profile.get();
    this.hudTime.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
    this.hudWeather.textContent='ВЕТЕР · '+stats.wind.toFixed(1)+' М/С';this.hudFps.textContent=Math.round(stats.fps)+' FPS';
    this.hudMoney.textContent=player.money.toLocaleString('ru-RU')+' ₽';this.hudNickname.textContent=player.name.toLocaleUpperCase('ru-RU');
    this.updateInteractionHint();
  }
  toast(message){
    this.toastNode.textContent=message;this.toastNode.classList.add('is-visible');clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>this.toastNode.classList.remove('is-visible'),3800);
  }
}
