const STORAGE_KEY = 'ezid-russia-settings-v1';

export const DEFAULT_SETTINGS = Object.freeze({
  textureQuality: 'high',
  grassQuality: 'medium',
  shadowQuality: 'medium',
  drawDistance: 'medium',
  lightingQuality: 'high',
  resolution: '100',
  fpsLimit: '60',
  antialias: true,
  masterVolume: 80,
  ambienceVolume: 70,
  musicVolume: 0,
  uiScale: 100,
  showFPS: true,
  cameraSensitivity: 22
});

const SELECTS = {
  textureQuality: [['ultra','Ультра'],['high','Высокое'],['medium','Среднее']],
  grassQuality: [['ultra','Ультра'],['high','Высокое'],['medium','Среднее'],['low','Низкое']],
  shadowQuality: [['ultra','Ультра · 4096'],['high','Высокое · 3072'],['medium','Среднее · 2048'],['off','Выключено']],
  drawDistance: [['ultra','Максимальная'],['high','Далёкая'],['medium','Средняя'],['low','Ближняя']],
  lightingQuality: [['ultra','Ультра'],['high','Высокое'],['medium','Среднее']],
  resolution: [['200','200%'],['175','175%'],['150','150%'],['125','125%'],['100','100%'],['80','80%']],
  fpsLimit: [['30','30 FPS'],['60','60 FPS'],['90','90 FPS'],['120','120 FPS'],['240','Без ограничения']]
};

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export class SettingsPanel {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.value = loadSettings();
  }
  get() { return { ...this.value }; }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value)); }
    catch (error) { console.warn('Настройки не удалось сохранить:', error); }
    this.game.applySettings(this.value);
  }

  render(onBack) {
    const options = (key) => SELECTS[key].map(([value, label]) =>
      '<option value="' + value + '"' + (this.value[key] === value ? ' selected' : '') + '>' + label + '</option>'
    ).join('');
    const select = (key, label, hint) =>
      '<label class="setting-row"><span><b>' + label + '</b><small>' + hint + '</small></span><select data-setting="' + key + '">' + options(key) + '</select></label>';
    const range = (key, label, hint, min = 0, max = 100, step = 1) =>
      '<label class="setting-row setting-range"><span><b>' + label + '</b><small>' + hint + '</small></span><input data-setting="' + key + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + this.value[key] + '"><output data-output="' + key + '">' + this.value[key] + '</output></label>';
    const toggle = (key, label, hint) =>
      '<label class="setting-row"><span><b>' + label + '</b><small>' + hint + '</small></span><input class="switch-input" data-setting="' + key + '" type="checkbox"' + (this.value[key] ? ' checked' : '') + '><span class="switch-ui"></span></label>';

    this.root.innerHTML =
      '<section class="settings-panel"><header class="subscreen-header"><div><div class="eyebrow">SYSTEM CONFIGURATION</div><h1>Настройки</h1></div><button class="text-button" id="settings-back">← Назад</button></header>' +
      '<div class="settings-tabs"><button class="active" data-tab="graphics">Графика</button><button data-tab="sound">Звук</button><button data-tab="interface">Интерфейс</button><button data-tab="controls">Управление</button></div>' +
      '<div class="settings-body">' +
      '<section class="settings-group active" data-group="graphics"><h2>Качество изображения</h2>' +
      select('textureQuality','Качество текстур','Детализация процедурных материалов и рельефа') +
      select('grassQuality','Качество травы','Плотность травы и дальность прорисовки') +
      select('shadowQuality','Качество теней','Разрешение теневой карты') +
      select('drawDistance','Дальность прорисовки','Радиус и уровни детализации чанков') +
      select('lightingQuality','Качество освещения','Качество освещения и цветовая модель') +
      select('resolution','Масштаб рендеринга','Внутреннее разрешение относительно экрана') +
      select('fpsLimit','Ограничение FPS','Частота кадров для охлаждения и стабильности') +
      toggle('antialias','Сглаживание','Сглаживание краёв геометрии') +
      '<div class="setting-note"><b>ПРОФИЛЬ ГРАФИКИ</b> — на смартфонах рекомендуется среднее или высокое качество. Ультра-профиль повышает нагрев и расход батареи; фактическая частота кадров зависит от устройства.</div>' +
      '</section>' +
      '<section class="settings-group" data-group="sound"><h2>Звуковая среда</h2>' +
      range('masterVolume','Общая громкость','Главный уровень звука') +
      range('ambienceVolume','Звуки окружения','Процедурный шум ветра') +
      range('musicVolume','Музыка','Фоновый синтезаторный слой') + '</section>' +
      '<section class="settings-group" data-group="interface"><h2>Интерфейс</h2>' +
      range('uiScale','Масштаб интерфейса','Размер элементов HUD',80,120,5) +
      toggle('showFPS','Отображать FPS','Счётчик частоты кадров в игре') + '</section>' +
      '<section class="settings-group" data-group="controls"><h2>Камера и сенсорное управление</h2>' +
      range('cameraSensitivity','Чувствительность камеры','Скорость поворота мышью и свайпом',5,60,1) +
      '<div class="setting-note"><b>СЕНСОРНЫЙ ЭКРАН</b><br>Левый виртуальный джойстик — движение. Свайп вправо — обзор. Кнопки ↶ / ↷ — поворот. Удерживайте «БЕГ» для ускорения.</div>' +
      '<div class="setting-note"><b>КЛАВИАТУРА</b><br>WASD — движение · Мышь — обзор · Колесо — приближение · Shift — бег · T — время суток.</div>' +
      '</section></div>' +
      '<footer class="settings-footer"><span>Изменения применяются автоматически и сохраняются на устройстве.</span><button id="settings-reset" class="text-button">Сбросить по умолчанию</button></footer></section>';

    this.root.querySelector('#settings-back').addEventListener('click', onBack);
    this.root.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      this.root.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active', item === button));
      this.root.querySelectorAll('[data-group]').forEach((group) => group.classList.toggle('active', group.dataset.group === button.dataset.tab));
    }));

    const change = (event) => {
      const input = event.target.closest('[data-setting]');
      if (!input) return;
      const key = input.dataset.setting;
      this.value[key] = input.type === 'checkbox' ? input.checked : (input.type === 'range' ? Number(input.value) : input.value);
      const output = this.root.querySelector('[data-output="' + key + '"]');
      if (output) output.value = String(this.value[key]);
      this.save();
      if (key === 'antialias') this.game.toast('Сглаживание изменится после перезагрузки страницы.');
    };
    this.root.oninput = change;
    this.root.onchange = change;
    this.root.querySelector('#settings-reset').addEventListener('click', () => {
      this.value = { ...DEFAULT_SETTINGS };
      this.save();
      this.render(onBack);
    });
  }
}
