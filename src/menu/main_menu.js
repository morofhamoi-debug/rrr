export class MainMenu {
  constructor(root, game, settings, loading) {
    this.root = root; this.game = game; this.settings = settings; this.loading = loading;
    window.addEventListener('leonida:show-menu', () => this.render());
  }
  mount() { this.render(); }
  render() {
    document.querySelector('#menu-screen').classList.remove('is-hidden');
    this.root.innerHTML = `
      <div class="menu-layout">
        <header class="menu-topline">
          <div class="menu-wordmark">LEONIDA<span>®</span></div>
          <div class="topline-copy">STATE OF LEONIDA <i>—</i> OPEN WORLD</div>
          <div class="version-tag">ENVIRONMENT <b>01 / 01</b></div>
        </header>
        <div class="menu-main">
          <section class="menu-copy">
            <div class="eyebrow"><span class="live-dot"></span> НЕИЗВЕДАННАЯ ТЕРРИТОРИЯ</div>
            <div class="hero-title">LEONIDA</div>
            <div class="hero-subtitle">THE LAND IS YOURS TO EXPLORE</div>
            <div class="hero-rule"></div>
            <p>Большая земля. Длинные дороги.<br>Только ты и горизонт.</p>
            <nav class="main-nav">
              <button class="primary-menu-button" data-action="start"><span>01</span><b>Новая игра</b><i>↗</i></button>
              <button data-action="continue"><span>02</span><b>Продолжить</b><i>→</i></button>
              <button data-action="settings"><span>03</span><b>Настройки</b><i>→</i></button>
              <button data-action="controls"><span>04</span><b>Управление</b><i>→</i></button>
              <button data-action="exit"><span>05</span><b>Выход</b><i>↗</i></button>
            </nav>
          </section>
          <aside class="menu-art" aria-hidden="true">
            <div class="art-sun"></div><div class="art-haze"></div>
            <div class="art-ridge art-ridge-back"></div><div class="art-ridge art-ridge-mid"></div>
            <div class="art-field"></div><div class="art-road"><span></span></div>
            <div class="art-coordinate">26° 32' N&nbsp; / &nbsp;81° 48' W</div>
            <div class="art-stamp">L / 01</div><div class="art-caption">A DIFFERENT KIND OF OPEN WORLD</div>
          </aside>
        </div>
        <footer class="menu-footer"><span>© LEONIDA PROJECT</span><span>FLORIDA PENINSULA <b>·</b> CONCEPT WORLD</span><span>BUILD 0.2.0 <b>ULTRA</b></span></footer>
      </div>`;
    this.root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.handleAction(button.dataset.action)));
  }
  async handleAction(action) {
    if (action === 'start' || action === 'continue') {
      await this.loading.show(); await this.game.start(action === 'continue');
      document.querySelector('#menu-screen').classList.add('is-hidden');
      document.querySelector('#hud').classList.remove('is-hidden'); return;
    }
    if (action === 'settings') { this.settings.render(() => this.render()); return; }
    if (action === 'controls') {
      this.root.innerHTML = `
        <section class="controls-panel">
          <header class="subscreen-header"><div><div class="eyebrow">FIELD NAVIGATION</div><h1>Управление</h1></div><button id="controls-back" class="text-button">← Назад</button></header>
          <div class="controls-grid">
            <div class="control-card"><span class="control-symbol">W A S D</span><b>Перемещение</b><small>Свободное движение камеры по территории</small></div>
            <div class="control-card"><span class="control-symbol">MOUSE / TOUCH</span><b>Осмотр и поворот</b><small>На телефоне свайп влево поворачивает влево, свайп вправо — вправо. Кнопки ↶ / ↷ дают точный поворот.</small></div>
            <div class="control-card"><span class="control-symbol">PINCH</span><b>Зум на телефоне</b><small>Сведите или разведите два пальца в зоне обзора справа</small></div>
            <div class="control-card"><span class="control-symbol">E / Q</span><b>Высота</b><small>Подъём и спуск камеры, на телефоне — кнопки справа</small></div>
            <div class="control-card"><span class="control-symbol">SHIFT / »</span><b>Ускорение</b><small>Удерживайте для ускоренного движения</small></div>
            <div class="control-card"><span class="control-symbol">T</span><b>Время суток</b><small>Переключение освещения на следующий час</small></div>
            <div class="control-card"><span class="control-symbol">ESC</span><b>Главное меню</b><small>Сохранить позицию и открыть меню</small></div>
          </div>
        </section>`;
      this.root.querySelector('#controls-back').addEventListener('click', () => this.render());
    }
    if (action === 'exit') { try { window.close(); } catch {} this.game.toast('Чтобы выйти, закройте вкладку браузера.'); }
  }
}