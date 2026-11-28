export class MainMenu {
  constructor(root, game, settings, loading) {
    this.root = root;
    this.game = game;
    this.settings = settings;
    this.loading = loading;
    window.addEventListener('ezid:show-menu', () => this.render());
  }

  mount() { this.render(); }

  render() {
    const profile = this.game.profile.get();
    document.querySelector('#menu-screen').classList.remove('is-hidden');
    this.root.innerHTML = [
      '<div class="menu-layout">',
      '<header class="menu-topline">',
      '<div class="menu-wordmark">EZID<span>®</span></div>',
      '<div class="topline-copy">RUSSIA <i>—</i> ROLEPLAY WORLD</div>',
      '<div class="version-tag">EARLY ACCESS <b>0.1.0</b></div>',
      '</header>',
      '<div class="menu-main">',
      '<section class="menu-copy">',
      '<div class="eyebrow"><span class="live-dot"></span> ОТКРЫТЫЙ МИР · ТВОЯ ИСТОРИЯ</div>',
      '<div class="hero-title">EZID</div>',
      '<div class="hero-subtitle">RUSSIA ROLEPLAY</div>',
      '<div class="hero-rule"></div>',
      '<p>Город уже просыпается.<br>Твоя история начинается здесь.</p>',
      '<div class="menu-player-line"><span>' + profile.name + '</span><b>' + profile.money.toLocaleString('ru-RU') + ' ₽</b></div>',
      '<nav class="main-nav">',
      '<button class="primary-menu-button" data-action="start"><span>01</span><b>Войти в город</b><i>↗</i></button>',
      '<button data-action="continue"><span>02</span><b>Продолжить</b><i>→</i></button>',
      '<button data-action="profile"><span>03</span><b>Персонаж и профиль</b><i>→</i></button>',
      '<button data-action="settings"><span>04</span><b>Настройки</b><i>→</i></button>',
      '<button data-action="controls"><span>05</span><b>Управление</b><i>→</i></button>',
      '</nav>',
      '</section>',
      '<aside class="menu-art city-art" aria-hidden="true">',
      '<div class="art-coordinate">EZID CITY · RUSSIA</div><div class="art-stamp">ER / 01</div>',
      '<div class="city-skyline"><span class="tower t1"></span><span class="tower t2"></span><span class="tower t3"></span><span class="tower t4"></span><span class="tower t5"></span><span class="tower t6"></span><span class="tower t7"></span><span class="tower t8"></span></div>',
      '<div class="city-road"><span></span></div><div class="art-caption">EXPLORE · WORK · LIVE</div>',
      '</aside>',
      '</div>',
      '<footer class="menu-footer"><span>© EZID RUSSIA</span><span>OPEN WORLD ROLEPLAY <b>·</b> LOCAL BUILD</span><span>VERSION <b>0.1.0</b></span></footer>',
      '</div>'
    ].join('');
    this.root.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => this.handleAction(button.dataset.action));
    });
  }

  async handleAction(action) {
    if (action === 'start' || action === 'continue') {
      await this.loading.show();
      await this.game.start(action === 'continue');
      document.querySelector('#menu-screen').classList.add('is-hidden');
      document.querySelector('#hud').classList.remove('is-hidden');
      return;
    }
    if (action === 'settings') {
      this.settings.render(() => this.render());
      return;
    }
    if (action === 'profile') {
      const profile = this.game.profile.get();
      this.root.innerHTML = [
        '<section class="profile-panel settings-panel">',
        '<header class="subscreen-header"><div><div class="eyebrow">PLAYER ACCOUNT</div><h1>Персонаж</h1></div><button class="text-button" id="profile-back">← Назад</button></header>',
        '<div class="profile-summary"><div class="profile-avatar">EZ</div><div><span class="profile-caption">ИГРОВОЙ ID</span><strong>#' + profile.id + '</strong><small>Уровень ' + profile.level + ' · ' + profile.experience + ' опыта</small></div></div>',
        '<label class="profile-name-label" for="profile-name">Имя персонажа</label>',
        '<input id="profile-name" class="profile-name-input" maxlength="18" value="' + profile.name.replace(/"/g, '&quot;') + '" autocomplete="off" />',
        '<div class="profile-money"><span>Наличные</span><b>' + profile.money.toLocaleString('ru-RU') + ' ₽</b></div>',
        '<p class="profile-note">Профиль и баланс сохраняются локально на этом устройстве. Серверной авторизации и мультиплеера в этой сборке пока нет.</p>',
        '<button class="primary-menu-button profile-save" id="profile-save" type="button">Сохранить профиль</button>',
        '</section>'
      ].join('');
      this.root.querySelector('#profile-back').addEventListener('click', () => this.render());
      this.root.querySelector('#profile-save').addEventListener('click', () => {
        const input = this.root.querySelector('#profile-name');
        if (!this.game.profile.setName(input.value)) {
          this.game.toast('Введите имя персонажа.');
          return;
        }
        this.game.toast('Профиль сохранён на устройстве.');
        this.render();
      });
      return;
    }
    if (action === 'controls') {
      this.root.innerHTML = [
        '<section class="controls-panel">',
        '<header class="subscreen-header"><div><div class="eyebrow">PLAYER NAVIGATION</div><h1>Управление</h1></div><button id="controls-back" class="text-button">← Назад</button></header>',
        '<div class="controls-grid">',
        '<div class="control-card"><span class="control-symbol">W A S D</span><b>Перемещение</b><small>Ходьба по городу и жилым районам</small></div>',
        '<div class="control-card"><span class="control-symbol">MOUSE / TOUCH</span><b>Обзор</b><small>Мышь на ПК, свайп в правой части экрана на телефоне</small></div>',
        '<div class="control-card"><span class="control-symbol">PINCH</span><b>Приближение</b><small>Сведите или разведите два пальца в зоне обзора</small></div>',
        '<div class="control-card"><span class="control-symbol">SHIFT / »</span><b>Бег</b><small>Удерживайте клавишу или сенсорную кнопку</small></div>',
        '<div class="control-card"><span class="control-symbol">E / ESC</span><b>Взаимодействие и меню</b><small>ESC открывает меню. Доступные двери позволяют войти в дома.</small></div>',
        '</div></section>'
      ].join('');
      this.root.querySelector('#controls-back').addEventListener('click', () => this.render());
      return;
    }
  }
}
