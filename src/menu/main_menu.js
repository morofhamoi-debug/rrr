export class MainMenu{
 constructor(root,game,settings,loading){this.root=root;this.game=game;this.settings=settings;this.loading=loading;window.addEventListener('leonida:show-menu',()=>this.render());}
 mount(){this.render();}
 render(){
  document.querySelector('#menu-screen').classList.remove('is-hidden');
  this.root.innerHTML='<div class="menu-layout"><div class="menu-topline"><span class="brand-mark">L<span>·</span></span><span class="topline-copy">LEONIDA STATE <i>/</i> OPEN WORLD ENVIRONMENT</span><span class="version-tag">PHASE 01 <b>0.1.0</b></span></div>'+
   '<div class="menu-main"><div class="menu-copy"><div class="eyebrow"><span class="live-dot"></span> AN UNDISCOVERED TERRITORY</div><div class="hero-title">LEONIDA</div><div class="hero-subtitle">THE LAND IS YOURS TO EXPLORE</div><div class="hero-rule"></div><p>Открытая природная территория.<br>Дороги, поля и горизонт без границ.</p>'+
   '<nav class="main-nav"><button class="primary-menu-button" data-action="start"><span>01</span><b>Начать исследование</b><i>↗</i></button><button data-action="continue"><span>02</span><b>Продолжить</b><i>→</i></button><button data-action="settings"><span>03</span><b>Настройки</b><i>→</i></button><button data-action="controls"><span>04</span><b>Управление</b><i>→</i></button><button data-action="exit"><span>05</span><b>Выход</b><i>↗</i></button></nav></div>'+
   '<div class="menu-caption"><span>26° 32\' N &nbsp; 81° 48\' W</span><span>FLORIDA PENINSULA · CONCEPT WORLD</span></div></div><div class="menu-footer"><span>© LEONIDA PROJECT</span><span>ENVIRONMENT BUILD <b>ALPHA 01</b></span><span>WASD TO EXPLORE</span></div></div>';
  this.root.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>this.handleAction(btn.dataset.action)));
 }
 async handleAction(action){
  if(action==='start'||action==='continue'){
   await this.loading.show();await this.game.start(action==='continue');
   document.querySelector('#menu-screen').classList.add('is-hidden');document.querySelector('#hud').classList.remove('is-hidden');return;
  }
  if(action==='settings'){this.settings.render(()=>this.render());return;}
  if(action==='controls'){
   this.root.innerHTML='<section class="controls-panel"><header class="subscreen-header"><div><div class="eyebrow">FIELD NAVIGATION</div><h1>Управление</h1></div><button id="controls-back" class="text-button">← Назад</button></header><div class="controls-grid">'+
    '<div class="control-card"><span class="control-symbol">W A S D</span><b>Перемещение</b><small>Свободное движение камеры по территории</small></div>'+
    '<div class="control-card"><span class="control-symbol">MOUSE</span><b>Осмотр</b><small>Поворот камеры. Нажмите на сцену для захвата мыши</small></div>'+
    '<div class="control-card"><span class="control-symbol">SCROLL</span><b>Приближение</b><small>Перемещение камеры вперёд и назад</small></div>'+
    '<div class="control-card"><span class="control-symbol">E / Q</span><b>Высота</b><small>Подъём и спуск камеры</small></div>'+
    '<div class="control-card"><span class="control-symbol">SHIFT</span><b>Ускорение</b><small>Увеличенная скорость перемещения</small></div>'+
    '<div class="control-card"><span class="control-symbol">T</span><b>Время суток</b><small>Переключение освещения на следующий час</small></div>'+
    '<div class="control-card"><span class="control-symbol">ESC</span><b>Главное меню</b><small>Сохранить позицию и открыть меню</small></div></div></section>';
   this.root.querySelector('#controls-back').addEventListener('click',()=>this.render());return;
  }
  if(action==='exit'){try{window.close();}catch{}this.game.toast('Чтобы выйти, закройте вкладку браузера.');}
 }
}