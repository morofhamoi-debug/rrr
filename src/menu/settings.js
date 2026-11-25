const STORAGE_KEY='leonida-settings-v1';
export const DEFAULT_SETTINGS=Object.freeze({textureQuality:'high',grassQuality:'high',shadowQuality:'high',drawDistance:'high',lightingQuality:'high',resolution:'100',fpsLimit:'60',antialias:true,masterVolume:80,ambienceVolume:70,musicVolume:0,uiScale:100,showFPS:true,cameraSensitivity:22});
const SELECTS={
 textureQuality:[['high','Высокое'],['medium','Среднее']],
 grassQuality:[['high','Высокое'],['medium','Среднее'],['low','Низкое']],
 shadowQuality:[['high','Высокое'],['medium','Среднее'],['off','Выключено']],
 drawDistance:[['high','Далёкая'],['medium','Средняя'],['low','Ближняя']],
 lightingQuality:[['high','Высокое'],['medium','Среднее']],
 resolution:[['100','100%'],['85','85%'],['70','70%'],['50','50%']],
 fpsLimit:[['30','30 FPS'],['60','60 FPS'],['90','90 FPS'],['120','120 FPS'],['240','Без ограничения']]
};
function loadSettings(){try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{return {...DEFAULT_SETTINGS};}}
export class SettingsPanel{
 constructor(root,game){this.root=root;this.game=game;this.value=loadSettings();}
 get(){return {...this.value};}
 save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.value));}catch(e){console.warn('Settings could not be saved:',e);}this.game.applySettings(this.value);}
 render(onBack){
  const opts=k=>SELECTS[k].map(([v,l])=>'<option value="'+v+'"'+(this.value[k]===v?' selected':'')+'>'+l+'</option>').join('');
  const sel=(k,l,h)=>'<label class="setting-row"><span><b>'+l+'</b><small>'+h+'</small></span><select data-setting="'+k+'">'+opts(k)+'</select></label>';
  const range=(k,l,h,min=0,max=100,step=1)=>'<label class="setting-row setting-range"><span><b>'+l+'</b><small>'+h+'</small></span><input data-setting="'+k+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+this.value[k]+'"><output data-output="'+k+'">'+this.value[k]+'</output></label>';
  const toggle=(k,l,h)=>'<label class="setting-row"><span><b>'+l+'</b><small>'+h+'</small></span><input class="switch-input" data-setting="'+k+'" type="checkbox"'+(this.value[k]?' checked':'')+'><span class="switch-ui"></span></label>';
  this.root.innerHTML='<section class="settings-panel"><header class="subscreen-header"><div><div class="eyebrow">SYSTEM CONFIGURATION</div><h1>Настройки</h1></div><button class="text-button" id="settings-back">← Назад</button></header>'+
   '<div class="settings-tabs"><button class="active" data-tab="graphics">Графика</button><button data-tab="sound">Звук</button><button data-tab="interface">Интерфейс</button><button data-tab="controls">Управление</button></div><div class="settings-body">'+
   '<section class="settings-group active" data-group="graphics"><h2>Изображение</h2>'+
   sel('textureQuality','Качество текстур','Детализация материалов поверхности')+sel('grassQuality','Качество травы','Плотность и дальность растительности')+
   sel('shadowQuality','Качество теней','Разрешение карты теней')+sel('drawDistance','Дальность прорисовки','Радиус загружаемых чанков')+
   sel('lightingQuality','Качество освещения','Качество и интенсивность света')+sel('resolution','Масштаб рендеринга','Влияет на производительность')+
   sel('fpsLimit','Ограничение FPS','Максимальная частота кадров')+toggle('antialias','Сглаживание','Сглаживание краёв геометрии')+'</section>'+
   '<section class="settings-group" data-group="sound"><h2>Звуковая среда</h2>'+range('masterVolume','Общая громкость','Главный уровень звука')+
   range('ambienceVolume','Звуки окружения','Процедурный шум ветра')+range('musicVolume','Музыка','Фоновый синтезаторный слой')+'</section>'+
   '<section class="settings-group" data-group="interface"><h2>Интерфейс</h2>'+range('uiScale','Масштаб интерфейса','Размер элементов HUD',80,120,5)+toggle('showFPS','Отображать FPS','Счётчик частоты кадров в игре')+'</section>'+
   '<section class="settings-group" data-group="controls"><h2>Камера</h2>'+range('cameraSensitivity','Чувствительность камеры','Скорость поворота мышью',5,60,1)+
   '<div class="setting-note"><b>WASD</b> — движение · <b>Мышь</b> — обзор · <b>Колесо</b> — приближение · <b>E / Q</b> — высота · <b>Shift</b> — ускорение · <b>T</b> — время суток</div></section></div>'+
   '<footer class="settings-footer"><span>Изменения применяются автоматически и сохраняются на устройстве.</span><button id="settings-reset" class="text-button">Сбросить по умолчанию</button></footer></section>';
  this.root.querySelector('#settings-back').addEventListener('click',onBack);
  this.root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
   this.root.querySelectorAll('[data-tab]').forEach(item=>item.classList.toggle('active',item===btn));
   this.root.querySelectorAll('[data-group]').forEach(group=>group.classList.toggle('active',group.dataset.group===btn.dataset.tab));
  }));
  const change=e=>{const input=e.target.closest('[data-setting]');if(!input)return;const k=input.dataset.setting;
   this.value[k]=input.type==='checkbox'?input.checked:(input.type==='range'?Number(input.value):input.value);
   const out=this.root.querySelector('[data-output="'+k+'"]');if(out)out.value=String(this.value[k]);this.save();};
  this.root.oninput=change;this.root.onchange=change;
  this.root.querySelector('#settings-reset').addEventListener('click',()=>{this.value={...DEFAULT_SETTINGS};this.save();this.render(onBack);});
 }
}