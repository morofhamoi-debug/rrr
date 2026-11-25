(function () {
  'use strict';

  var root = document.getElementById('viewRoot');
  var toastRoot = document.getElementById('toastRoot');
  var STORAGE_KEY = 'horror-game-demo-v1'; // legacy key: сохраняет ранее созданный локальный профиль
  var GAME_NAMES = { mines: 'Mines', crash: 'Crash', dice: 'Dice', plinko: 'Plinko', wheel: 'Wheel', cases: 'Cases', coinflip: 'Coinflip' };
  var GAME_ICONS = { mines: '▦', crash: '↗', dice: '⚄', plinko: '⠿', wheel: '◉', cases: '▣', coinflip: '◒' };
  var defaultState = {
    balance: 10000, rounds: 0, wins: 0, losses: 0, history: [], operations: [],
    username: 'Игрок', playerId: '1W-' + String(Math.floor(Math.random() * 900000 + 100000)),
    lastBonus: '', claimedMissions: [], sound: false, reducedMotion: false, support: []
  };
  var state = loadState();
  var page = 'home';
  var currentGame = 'mines';
  var runtime = { mines: null, crash: null, crashTimer: null, plinkoBusy: false, plinkoResult: null, wheelBusy: false, wheelResult: null, caseBusy: false, caseResult: null, coinResult: null, diceResult: null, diceBusy: false, diceInterval: null, diceTimeout: null, coinBusy: false, coinTimeout: null };
  var crashStartedAt = 0;
  var sessionVersion = 0;

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        return Object.assign({}, defaultState, saved, {
          balance: Math.max(0, Number(saved.balance) || 0),
          rounds: Math.max(0, Number(saved.rounds) || 0),
          wins: Math.max(0, Number(saved.wins) || 0),
          losses: Math.max(0, Number(saved.losses) || 0),
          history: Array.isArray(saved.history) ? saved.history.slice(0, 50) : [],
          operations: Array.isArray(saved.operations) ? saved.operations.slice(0, 60) : [],
          claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
          support: Array.isArray(saved.support) ? saved.support : [],
        });
      }
    } catch (e) {}
    return Object.assign({}, defaultState);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast('Браузер не разрешил сохранить прогресс.', 'bad'); }
    updateHeader();
  }

  function rand() {
    if (window.crypto && window.crypto.getRandomValues) {
      var data = new Uint32Array(1);
      window.crypto.getRandomValues(data);
      return data[0] / 4294967296;
    }
    return Math.random();
  }

  function randInt(max) { return Math.floor(rand() * max); }
  function money(value) { return Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2, minimumFractionDigits: 0 }); }
  function round2(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function timeLabel(value) { try { return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } }
  function toast(message, type) {
    var item = document.createElement('div');
    item.className = 'toast ' + (type || '');
    item.textContent = message;
    toastRoot.appendChild(item);
    setTimeout(function () { item.remove(); }, 3200);
  }
  function playTone(freq) {
    if (!state.sound) return;
    try {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      var ctx = new Audio();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq || 520;
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.13);
      setTimeout(function () { ctx.close(); }, 250);
    } catch (e) {}
  }

  function openGameMenu() {
    var menu = document.getElementById('gameMenu');
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  }
  function closeGameMenu() {
    var menu = document.getElementById('gameMenu');
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }

  function updateHeader() {
    var balance = document.getElementById('topBalance');
    var name = document.getElementById('topName');
    var avatar = document.getElementById('topAvatar');
    if (balance) balance.textContent = money(state.balance);
    if (name) name.textContent = state.username || 'Игрок';
    if (avatar) avatar.textContent = (state.username || '1').trim().charAt(0).toUpperCase() || 'H';
  }

  function updateNav() {
    document.querySelectorAll('.nav-btn,.dock-btn').forEach(function (button) {
      var isPage = button.getAttribute('data-page');
      var isGame = button.getAttribute('data-game');
      button.classList.toggle('active', (page === 'game' && isGame === currentGame) || (page !== 'game' && isPage === page));
    });
  }

  function setPage(next, game) {
    closeGameMenu();
    page = next;
    if (game) currentGame = game;
    render();
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
  }

  function pushOperation(kind, amount, note) {
    state.operations.unshift({ kind: kind, amount: round2(amount), note: note, date: new Date().toISOString() });
    state.operations = state.operations.slice(0, 60);
  }

  function placeStake(amount, label) {
    amount = round2(Number(amount));
    if (!Number.isFinite(amount) || amount < 1) { toast('Минимальная ставка — 1 ₽.', 'bad'); return false; }
    if (amount > 5000) { toast('Лимит одной виртуальной ставки — 5 000 ₽.', 'bad'); return false; }
    if (amount > state.balance) { toast('Недостаточно виртуальных ₽.', 'bad'); return false; }
    state.balance = round2(state.balance - amount);
    pushOperation('Ставка', -amount, label);
    save();
    return true;
  }

  function settleRound(game, stake, payout, result, note) {
    payout = round2(Math.max(0, Number(payout) || 0));
    if (payout > 0) {
      state.balance = round2(state.balance + payout);
      pushOperation('Результат', payout, GAME_NAMES[game] + ' · ' + note);
      state.wins += 1;
    } else {
      state.losses += 1;
    }
    state.rounds += 1;
    state.history.unshift({
      game: GAME_NAMES[game], stake: round2(stake), payout: payout,
      net: round2(payout - stake), result: result, note: note, date: new Date().toISOString()
    });
    state.history = state.history.slice(0, 50);
    save();
    playTone(payout > 0 ? 740 : 190);
  }

  function commonHead(title, subtitle, icon) {
    return '<div class="page-head"><div><div class="eyebrow">1WIN / ИГРОВАЯ ЗОНА</div><h1>' + title + '</h1><p>' + subtitle + '</p></div></div>' +
      '<div class="game-layout"><section class="game-main"><div class="game-panel"><div class="game-title-row"><div class="game-title"><span class="game-icon">' + icon + '</span><div><h2>' + title + '</h2><p>Все ставки — виртуальные ₽</p></div></div></div>';
  }

  function commonAside(extra) {
    return '</div></section><aside class="game-aside">' + extra + '<div class="side-note"><strong>Виртуальный режим</strong>Виртуальные ₽ существуют только внутри этого браузера. Их нельзя купить, вывести или обменять на деньги.</div></aside></div>';
  }

  function stakeControl(value) {
    return '<div class="field-label"><span>ВИРТУАЛЬНАЯ СТАВКА</span><small>₽</small></div><input class="field-input" id="stakeInput" type="number" min="1" max="5000" step="1" value="' + (value || 50) + '"><div class="field-help">От 1 до 5 000 виртуальных ₽ за раунд.</div>';
  }

  function renderHome() {
    var games = [
      ['mines', 'Mines', 'Найди безопасные клетки', '▦'],
      ['crash', 'Crash', 'Успей остановиться вовремя', '↗'],
      ['dice', 'Dice', 'Проверь свой прогноз', '⚄'],
      ['plinko', 'Plinko', 'Шар и путь множителей', '⠿'],
      ['wheel', 'Wheel', 'Крути виртуальное колесо', '◉'],
      ['cases', 'Cases', 'Открывай игровые кейсы', '▣'],
      ['coinflip', 'Coinflip', 'Орёл или решка', '◒']
    ];
    var cards = games.map(function (g) {
      return '<button class="game-card" type="button" data-game="' + g[0] + '"><div class="game-art"><span class="art-glyph">' + g[3] + '</span></div><div class="game-info"><span><strong>' + g[1] + '</strong><small>' + g[2] + '</small></span><span class="game-arrow">↗</span></div></button>';
    }).join('');
    return '<div class="hero"><div class="hero-copy"><div class="hero-kicker">✦ WELCOME TO THE NIGHT</div><h1>ИГРА НАЧИНАЕТСЯ <span>ЗДЕСЬ.</span></h1><p>Семь мини-игр, единый профиль и виртуальный баланс в ₽. Выбирай игру, проверяй механику и играй без реальных денежных ставок.</p><div class="hero-actions"><button class="primary-btn" type="button" data-game="mines">ОТКРЫТЬ MINES ↗</button><span class="hero-note">10 000 ₽ НА СТАРТЕ</span></div></div><div class="hero-emblem">1</div></div>' +
      '<div class="metrics">' +
      metric('Виртуальный баланс', money(state.balance) + ' <small>₽</small>', '✦', 'Без денежных операций') +
      metric('Сыграно раундов', money(state.rounds), '◷', 'Локальная статистика') +
      metric('Победы', money(state.wins), '♛', 'Завершённые раунды') +
      metric('Побед / раундов', state.rounds ? Math.round(state.wins / state.rounds * 100) + '%' : '—', '↗', 'Без прогноза доходности') +
      '</div><div class="section-row"><h2>Популярные игры</h2><span class="tiny-label">CHOOSE YOUR GAME</span></div><div class="game-grid">' + cards + '</div>' +
      '<div class="two-col"><div class="surface"><div class="surface-head"><strong>Последние события</strong><span>ТВОЯ ИСТОРИЯ</span></div>' + activityMarkup(4) + '</div><div class="surface"><div class="surface-head"><strong>Играй осознанно</strong><span>ВАЖНО</span></div><div class="notice">1WIN — неофициальная локальная игровая симуляция. Баланс, выигрыши и результаты не имеют денежной стоимости. Здесь нет пополнений, вывода или обмена ₽.</div><button class="soft-btn" type="button" data-page="fairplay">О принципах работы ↗</button></div></div>';
  }

  function metric(label, value, icon, sub) {
    return '<div class="metric"><div class="metric-top"><span>' + label + '</span><span class="metric-icon">' + icon + '</span></div><div class="metric-value">' + value + '</div><div class="metric-sub">' + sub + '</div></div>';
  }

  function activityMarkup(limit) {
    if (!state.history.length) return '<div class="empty-hint">Здесь появятся твои завершённые раунды. Выбери игру, чтобы начать.</div>';
    return '<div class="activity-list">' + state.history.slice(0, limit).map(function (h) {
      var good = h.payout > 0;
      return '<div class="activity-row"><span class="activity-icon">' + (good ? '↗' : '↘') + '</span><span><strong>' + esc(h.game) + ' · ' + esc(h.note) + '</strong><small>' + timeLabel(h.date) + ' · ставка ' + money(h.stake) + ' ₽</small></span><span class="activity-amount ' + (good ? 'positive' : '') + '">' + (good ? '+' : '') + money(h.net) + ' ₽</span></div>';
    }).join('') + '</div>';
  }

  function renderMines() {
    var r = runtime.mines;
    var mines = r ? r.mineSet : [];
    var cells = '';
    for (var i = 0; i < 25; i++) {
      var isOpen = r && r.opened.indexOf(i) >= 0;
      var isMine = r && mines.indexOf(i) >= 0;
      var showMine = r && r.revealAll && isMine;
      var cls = 'mine-cell';
      var symbol = '✧';
      if (isOpen && !isMine) { cls += ' safe'; symbol = '◆'; }
      if (showMine || (isOpen && isMine)) { cls += ' mine'; symbol = '✹'; }
      var disabled = !r || !r.active || isOpen || (r.revealAll && isMine);
      cells += '<button class="' + cls + '" type="button" data-action="open-cell" data-index="' + i + '"' + (disabled ? ' disabled' : '') + '>' + symbol + '</button>';
    }
    var active = r && r.active;
    var currentMineCount = r ? r.mineCount : 5;
    var mult = active ? minesMultiplier(r.mineCount, r.opened.length) : 1;
    var note = r ? r.message : 'Выбери количество мин и начни раунд.';
    var messageClass = r && r.messageType ? ' ' + r.messageType : '';
    var board = '<div class="game-stage"><span class="stage-caption">FIELD 5 × 5</span><div class="mines-grid">' + cells + '</div><div class="game-stats"><div class="game-stat"><small>ОТКРЫТО</small><strong>' + (r ? r.opened.length : 0) + '</strong></div><div class="game-stat"><small>МИНЫ</small><strong>' + (r ? r.mineCount : '—') + '</strong></div><div class="game-stat"><small>МНОЖИТЕЛЬ</small><strong>' + (active ? mult.toFixed(2) + '×' : '—') + '</strong></div></div><div class="game-message' + messageClass + '">' + esc(note) + '</div><span class="stage-foot">НАЙДИ КЛЕТКУ · ЗАБЕРИ РАУНД ДО МИНЫ</span></div>';
    var content = board + '<div class="spacer"></div>';
    var aside = '<div class="control-box"><h3>ПАРАМЕТРЫ РАУНДА</h3>' + stakeControl(50) +
      '<div class="field-label"><span>КОЛИЧЕСТВО МИН</span><small>5 × 5</small></div><select class="field-select" id="mineCount"><option value="3"' + (currentMineCount === 3 ? ' selected' : '') + '>3 мины · проще</option><option value="5"' + (currentMineCount === 5 ? ' selected' : '') + '>5 мин · стандарт</option><option value="8"' + (currentMineCount === 8 ? ' selected' : '') + '>8 мин · сложно</option><option value="12"' + (currentMineCount === 12 ? ' selected' : '') + '>12 мин · очень сложно</option><option value="18"' + (currentMineCount === 18 ? ' selected' : '') + '>18 мин · экстремально</option></select>' +
      '<button class="primary-btn full-btn" type="button" data-action="start-mines"' + (active ? ' disabled' : '') + '>НАЧАТЬ РАУНД</button>' +
      '<button class="soft-btn full-btn" type="button" data-action="cashout-mines"' + (!active || !r.opened.length ? ' disabled' : '') + '>ЗАБРАТЬ ' + (active && r.opened.length ? money(r.stake * mult) + ' ₽' : 'ВЫИГРЫШ') + '</button></div>' +
      '<div class="control-box"><h3>КАК ИГРАТЬ</h3><div class="field-help">1. Выбери ставку и число мин.<br>2. Запусти раунд и открывай клетки.<br>3. За безопасные клетки растёт множитель.<br>4. Забери виртуальный выигрыш до открытия мины.</div></div>';
    return commonHead('Mines', 'Открой безопасные клетки и следи за множителем.', GAME_ICONS.mines) + content + commonAside(aside);
  }

  function minesMultiplier(mineCount, opened) {
    var probability = 1;
    for (var i = 0; i < opened; i++) probability *= (25 - mineCount - i) / (25 - i);
    return probability > 0 ? 0.97 / probability : 0;
  }

  function renderCrash() {
    var r = runtime.crash;
    var active = r && r.active;
    var mult = active ? r.current : (r && r.last ? r.last : 1);
    var content = '<div class="game-stage"><span class="stage-caption">LIVE MULTIPLIER</span><div class="multiplier" id="crashMultiplier">' + mult.toFixed(2) + '<small>×</small></div><div class="crash-graph"><svg viewBox="0 0 500 190" preserveAspectRatio="none"><path id="crashPath" class="crash-line" d="M0 185 L60 170 L120 158 L180 135 L240 117 L300 85 L360 55 L420 20 L500 0"/></svg></div><div class="crash-status" id="crashStatus">' + (active ? 'РАУНД ИДЁТ · МОЖНО ЗАБРАТЬ' : 'НАЖМИ «СТАРТ», ЧТОБЫ НАЧАТЬ') + '</div><div class="game-message" id="crashMessage">' + esc(r && r.message ? r.message : 'Множитель растёт, но раунд может завершиться в любой момент.') + '</div><span class="stage-foot">УСПЕЙ ЗАФИКСИРОВАТЬ ВИРТУАЛЬНЫЙ РЕЗУЛЬТАТ</span></div><div class="spacer"></div>';
    var aside = '<div class="control-box"><h3>УПРАВЛЕНИЕ</h3>' + stakeControl(50) +
      '<button class="primary-btn full-btn" type="button" data-action="start-crash"' + (active ? ' disabled' : '') + '>ЗАПУСТИТЬ РАУНД</button>' +
      '<button class="soft-btn full-btn" type="button" data-action="cashout-crash"' + (!active ? ' disabled' : '') + '>ЗАБРАТЬ ВЫИГРЫШ</button><div class="field-help">Множитель увеличивается со временем. Если он достигнет скрытой точки остановки раньше фиксации — ставка раунда будет потеряна.</div></div>' +
      '<div class="control-box"><h3>ПОСЛЕДНИЙ РАУНД</h3><div class="metric-value" style="font-size:23px">' + (r && r.last ? r.last.toFixed(2) + '×' : '—') + '</div><div class="field-help">Последний результат отображается только в этом браузере.</div></div>';
    return commonHead('Crash', 'Фиксируй результат до случайной остановки множителя.', GAME_ICONS.crash) + content + commonAside(aside);
  }

  function renderDice() {
    var r = runtime.diceResult, busy = runtime.diceBusy;
    var target = r && r.target ? r.target : 50;
    var direction = r && r.direction ? r.direction : 'under';
    var probability = direction === 'under' ? target : 100 - target;
    var zoneLeft = direction === 'under' ? 0 : target;
    var rollText = busy ? '··' : (r && r.roll != null ? String(r.roll).padStart(2, '0') : '— —');
    var resultText = busy ? 'Кубик катится…' : (r ? r.message : 'Настрой диапазон и запусти бросок.');
    var resultClass = busy ? '' : (r ? (r.win ? 'good' : 'bad') : '');
    var marker = !busy && r && r.roll != null ? r.roll : 50;
    var content = '<div class="game-stage dice-stage"><span class="stage-caption">DICE ENGINE · 00—99</span><div class="dice-visual"><div class="dice-glow"></div><div class="dice-cube' + (busy ? ' is-rolling' : '') + '" id="diceValue">' + rollText + '</div></div><div class="dice-range-head"><span>0</span><strong>' + (busy ? 'ROLLING' : 'RESULT') + '</strong><span>99</span></div><div class="result-track"><span class="result-zone" style="left:' + zoneLeft + '%;width:' + probability + '%"></span><span class="result-marker" style="left:' + marker + '%"></span></div><div class="dice-outcome"><span>ТВОЯ ЦЕЛЬ <strong>' + target + '</strong></span><span>ШАНС <strong>' + probability + '%</strong></span><span>КОЭФФИЦИЕНТ <strong>' + (0.97 / (probability / 100)).toFixed(2) + '×</strong></span></div><div class="game-message ' + resultClass + '" id="diceMessage">' + esc(resultText) + '</div><span class="stage-foot">СЛУЧАЙНОЕ ЧИСЛО · ВИРТУАЛЬНЫЙ РАУНД</span></div>';
    var aside = '<div class="control-box"><h3>ПАРАМЕТРЫ DICE</h3>' + stakeControl(50) +
      '<div class="field-label"><span>ЦЕЛЕВОЕ ЧИСЛО</span><strong id="diceTargetValue">' + target + '</strong></div><input id="diceTarget" type="range" min="5" max="95" value="' + target + '" style="width:100%;accent-color:#367cff"' + (busy ? ' disabled' : '') + '>' +
      '<div class="field-label"><span>УСЛОВИЕ ВЫИГРЫША</span></div><select class="field-select" id="diceDirection"' + (busy ? ' disabled' : '') + '><option value="under"' + (direction === 'under' ? ' selected' : '') + '>Меньше цели</option><option value="over"' + (direction === 'over' ? ' selected' : '') + '>Больше или равно цели</option></select>' +
      '<button class="primary-btn full-btn" type="button" data-action="roll-dice"' + (busy ? ' disabled' : '') + '>' + (busy ? 'ИДЁТ БРОСОК…' : 'БРОСИТЬ КУБИК') + '</button><div class="field-help" id="diceOdds">Вероятность: ' + probability + '% · виртуальный коэффициент: ' + (0.97 / (probability / 100)).toFixed(2) + '×.</div></div>' +
      '<div class="control-box"><h3>КАК РАБОТАЕТ DICE</h3><div class="field-help">Число несколько секунд прокручивается, затем фиксируется итог от 00 до 99. Зона выигрыша зависит от выбранного условия.</div></div>';
    return commonHead('Dice', 'Выбери диапазон, наблюдай за броском и дождись результата.', GAME_ICONS.dice) + content + '<div class="spacer"></div>' + commonAside(aside);
  }

    function plinkoMultipliers(risk) {
    var tables = {
      low: [5.98, 2.99, 1.87, 1.34, 1.05, 0.86, 0.71, 0.86, 1.05, 1.34, 1.87, 2.99, 5.98],
      medium: [24.83, 9.93, 4.14, 2.07, 1.16, 0.54, 0.25, 0.54, 1.16, 2.07, 4.14, 9.93, 24.83],
      high: [98.44, 28.71, 8.20, 2.46, 0.66, 0.15, 0.04, 0.15, 0.66, 2.46, 8.20, 28.71, 98.44]
    };
    return tables[risk] || tables.low;
  }

  function renderPlinko() {
    var result = runtime.plinkoResult, rows = '';
    for (var row = 0; row < 12; row++) {
      var pegs = '';
      for (var col = 0; col <= row; col++) pegs += '<i class="peg"></i>';
      rows += '<div class="peg-row">' + pegs + '</div>';
    }
    var activeRisk = runtime.plinkoRisk || 'low';
    var slotValues = plinkoMultipliers(activeRisk);
    var slots = slotValues.map(function (v, i) {
      return '<span data-slot="' + i + '"' + (result && !runtime.plinkoBusy && result.slot === i ? ' class="is-hit"' : '') + '>' + v.toFixed(2).replace('.', ',') + '×</span>';
    });
    var stage = '<div class="game-stage plinko-stage"><span class="stage-caption">PLINKO ENGINE · 12 ROWS</span><div class="plinko-board"><span class="plinko-ball" id="plinkoBall"></span>' + rows + '<div class="plinko-slots">' + slots.join('') + '</div></div><div class="game-message" id="plinkoResult">' + (runtime.plinkoBusy ? 'Шар проходит ряд за рядом…' : (result ? esc(result.message) : 'Шар проходит через 12 рядов и попадает в один из 13 слотов.')) + '</div><span class="stage-foot">12 СТОЛКНОВЕНИЙ · 13 ВИРТУАЛЬНЫХ СЛОТОВ</span></div>';
    var aside = '<div class="control-box"><h3>ПАРАМЕТРЫ PLINKO</h3>' + stakeControl(50) +
      '<div class="field-label"><span>УРОВЕНЬ РИСКА</span></div><select class="field-select" id="plinkoRisk"' + (runtime.plinkoBusy ? ' disabled' : '') + '><option value="low"' + (activeRisk === 'low' ? ' selected' : '') + '>Low · низкий</option><option value="medium"' + (activeRisk === 'medium' ? ' selected' : '') + '>Medium · средний</option><option value="high"' + (activeRisk === 'high' ? ' selected' : '') + '>High · высокий</option></select>' +
      '<button class="primary-btn full-btn" type="button" data-action="drop-plinko"' + (runtime.plinkoBusy ? ' disabled' : '') + '>' + (runtime.plinkoBusy ? 'ШАР В ПУТИ…' : 'БРОСИТЬ ШАР') + '</button><div class="field-help">Каждый ряд добавляет случайный шаг влево или вправо. Итоговый слот определяется тем же маршрутом, который виден в анимации.</div><div class="plinko-last-result">' + (result && !runtime.plinkoBusy ? 'Последний слот: <strong>' + (result.slot + 1) + '</strong> · множитель <strong>' + result.mult.toFixed(2) + '×</strong>' : 'Чем дальше слот от центра, тем реже он выпадает.') + '</div></div>';
    return commonHead('Plinko', 'Наблюдай за траекторией шара и результатом каждого столкновения.', GAME_ICONS.plinko) + stage + '<div class="spacer"></div>' + commonAside(aside);
  }

    function renderWheel() {
    var labels = ['0×','0×','0.2×','0.3×','0.5×','0.7×','0.8×','1×','1.5×','3×'];
    var labelHTML = labels.map(function (v, i) { var a = i * 36 + 18; return '<span style="transform:rotate(' + a + 'deg) translateY(-104px) rotate(-' + a + 'deg)">' + v + '</span>'; }).join('');
    var result = runtime.wheelResult, angle = result ? result.angle : 0;
    var stage = '<div class="game-stage wheel-stage"><span class="stage-caption">LUCKY WHEEL · 10 СЕКТОРОВ</span><div class="wheel-wrap"><span class="wheel-pointer"></span><div class="wheel-disc" id="wheelDisc" style="transform:rotate(' + angle + 'deg)"><div class="wheel-labels">' + labelHTML + '</div></div></div><div class="game-message" id="wheelResult">' + (runtime.wheelBusy ? 'Колесо набирает скорость…' : (result ? esc(result.message) : 'Колесо делает десять полных оборотов и плавно останавливается.')) + '</div><span class="stage-foot">ПЛАВНОЕ ВРАЩЕНИЕ · ВИРТУАЛЬНЫЙ РЕЗУЛЬТАТ</span></div>';
    var aside = '<div class="control-box"><h3>WHEEL</h3>' + stakeControl(50) + '<button class="primary-btn full-btn" type="button" data-action="spin-wheel"' + (runtime.wheelBusy ? ' disabled' : '') + '>' + (runtime.wheelBusy ? 'КОЛЕСО ВРАЩАЕТСЯ…' : 'КРУТИТЬ КОЛЕСО') + '</button><div class="field-help">Колесо делает десять оборотов, постепенно замедляется и фиксируется точно на выбранном секторе.</div></div>';
    return commonHead('Wheel', 'Десять оборотов, длинное замедление и точная остановка на секторе.', GAME_ICONS.wheel) + stage + '<div class="spacer"></div>' + commonAside(aside);
  }

  function renderCases() {
    var result = runtime.caseResult, busy = runtime.caseBusy;
    var cases = [{ id: 'starter', name: 'Starter', cost: 100, icon: '▣', desc: 'Лёгкий кейс' }, { id: 'night', name: 'Night', cost: 250, icon: '◈', desc: 'Ночной набор' }, { id: 'legend', name: 'Legend', cost: 500, icon: '♛', desc: 'Редкий набор' }];
    var content = '<div class="game-stage cases-stage"><span class="stage-caption">CASE OPENING · VIRTUAL ITEMS</span><div class="case-opening-visual' + (busy ? ' is-opening' : (result ? ' is-open' : '')) + '"><span>' + (busy ? '✧' : (result ? '✦' : '▣')) + '</span></div><div class="case-status">' + (busy ? 'ОТКРЫВАЕМ КЕЙС…' : (result ? 'РЕЗУЛЬТАТ ЗАФИКСИРОВАН' : 'ВЫБЕРИ КЕЙС')) + '</div><div class="case-grid">' + cases.map(function (c) {
      return '<div class="case-card"><div class="case-box">' + c.icon + '</div><strong>' + c.name + '</strong><small>' + c.desc + ' · ' + c.cost + ' ₽</small><button type="button" data-action="open-case" data-case="' + c.id + '"' + (busy ? ' disabled' : '') + '>ОТКРЫТЬ</button></div>';
    }).join('') + '</div><div class="game-message" id="caseResult">' + (result ? esc(result.message) : 'Анимация открытия длится несколько секунд.') + '</div><span class="stage-foot">НАГРАДЫ НЕ ИМЕЮТ ДЕНЕЖНОЙ СТОИМОСТИ</span></div>';
    var aside = '<div class="control-box"><h3>КЕЙСЫ</h3><div class="field-help">Каждое открытие использует виртуальные ₽. Возможные коэффициенты: 0×, 0,3×, 0,5×, 0,8×, 1×, 1,5×, 2×, 3× и 5× с разной частотой.</div></div>';
    return commonHead('Cases', 'Открывай виртуальные кейсы с анимацией и плавным раскрытием результата.', GAME_ICONS.cases) + content + '<div class="spacer"></div>' + commonAside(aside);
  }

    function renderCoinflip() {
    var r = runtime.coinResult, busy = runtime.coinBusy;
    var side = r ? (r.face === 'heads' ? 'ОРЁЛ' : 'РЕШКА') : 'ВЫБЕРИ СТОРОНУ';
    var content = '<div class="game-stage coin-stage"><span class="stage-caption">COINFLIP · 50 / 50</span><div class="coin-scene"><div class="coin-aura"></div><div class="coin-disc" id="coinDisc"><div class="coin-face coin-front"><strong>О</strong><small>ОРЁЛ</small></div><div class="coin-face coin-back"><strong>Р</strong><small>РЕШКА</small></div></div><div class="coin-shadow"></div></div><div class="coin-result-title">' + (busy ? 'МОНЕТА В ПОЛЁТЕ…' : side) + '</div><div class="game-message ' + (busy ? '' : (r ? (r.win ? 'good' : 'bad') : '')) + '">' + (busy ? 'Подбрасываем монету и ждём её приземления.' : (r ? esc(r.message) : 'Выбери сторону. Монета совершит несколько оборотов перед остановкой.')) + '</div><span class="stage-foot">ОДИН БРОСОК · ДВА РАВНОВЕРОЯТНЫХ ИСХОДА</span></div>';
    var aside = '<div class="control-box"><h3>СТАВКА COINFLIP</h3>' + stakeControl(50) + '<div class="flip-choices"><button type="button" class="flip-choice" data-action="flip-coin" data-face="heads"' + (busy ? ' disabled' : '') + '>✦<small>ОРЁЛ</small></button><button type="button" class="flip-choice" data-action="flip-coin" data-face="tails"' + (busy ? ' disabled' : '') + '>◉<small>РЕШКА</small></button></div><div class="field-help">После выбора монета вращается около трёх секунд. Выплата при совпадении — 1,94× виртуальной ставки.</div></div>';
    return commonHead('Coinflip', 'Выбери сторону и дождись завершения вращения монеты.', GAME_ICONS.coinflip) + content + '<div class="spacer"></div>' + commonAside(aside);
  }

    function renderGame() {
    if (currentGame === 'mines') return renderMines();
    if (currentGame === 'crash') return renderCrash();
    if (currentGame === 'dice') return renderDice();
    if (currentGame === 'plinko') return renderPlinko();
    if (currentGame === 'wheel') return renderWheel();
    if (currentGame === 'cases') return renderCases();
    return renderCoinflip();
  }

  function renderHistory() {
    var rows = state.history.length ? state.history.map(function (h) {
      return '<tr><td>' + timeLabel(h.date) + '</td><td><strong>' + esc(h.game) + '</strong></td><td>' + money(h.stake) + ' ₽</td><td class="' + (h.net >= 0 ? 'status-win' : 'status-loss') + '">' + (h.net > 0 ? '+' : '') + money(h.net) + ' ₽</td><td><span class="pill">' + esc(h.result) + '</span></td></tr>';
    }).join('') : '<tr><td colspan="5" class="muted">Раундов пока нет. История появится после завершения игры.</td></tr>';
    var ops = state.operations.slice(0, 12).map(function (o) { return '<tr><td>' + timeLabel(o.date) + '</td><td>' + esc(o.kind) + '</td><td>' + esc(o.note) + '</td><td class="' + (o.amount >= 0 ? 'status-win' : 'status-loss') + '">' + (o.amount > 0 ? '+' : '') + money(o.amount) + ' ₽</td></tr>'; }).join('');
    return '<div class="page-head"><div><div class="eyebrow">ACCOUNT / HISTORY</div><h1>История</h1><p>Локальные игровые раунды и операции с виртуальным балансом.</p></div></div><div class="surface"><div class="surface-head"><strong>Раунды</strong><span>' + state.history.length + ' ЗАПИСЕЙ</span></div><div class="table-wrap"><table><thead><tr><th>ДАТА</th><th>ИГРА</th><th>СТАВКА</th><th>ИТОГ</th><th>СТАТУС</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><div class="spacer"></div><div class="surface"><div class="surface-head"><strong>Операции баланса</strong><span>ПОСЛЕДНИЕ 12</span></div><div class="table-wrap"><table><thead><tr><th>ДАТА</th><th>ТИП</th><th>ОПИСАНИЕ</th><th>ИЗМЕНЕНИЕ</th></tr></thead><tbody>' + (ops || '<tr><td colspan="4" class="muted">Операций пока нет.</td></tr>') + '</tbody></table></div></div>';
  }

  function renderProfile() {
    return '<div class="page-head"><div><div class="eyebrow">ACCOUNT / PLAYER</div><h1>Профиль</h1><p>Статистика и настройки локального игрового профиля.</p></div></div><div class="profile-hero"><div class="profile-avatar">' + esc((state.username || '1').charAt(0).toUpperCase()) + '</div><div><h2>' + esc(state.username) + '</h2><p>VIRTUAL PLAYER · ' + esc(state.playerId) + '</p></div><div class="profile-id">БАЛАНС<br><strong style="display:block;color:#f1ce91;font-size:16px;margin-top:6px">' + money(state.balance) + ' ₽</strong></div></div><div class="metrics">' + metric('Раундов', money(state.rounds), '◷', 'Завершено') + metric('Побед', money(state.wins), '♛', 'Выигранные раунды') + metric('Поражений', money(state.losses), '↘', 'Проигранные раунды') + metric('Доля побед', state.rounds ? Math.round(state.wins / state.rounds * 100) + '%' : '—', '％', 'Исторический показатель') + '</div><div class="surface support-form"><div class="surface-head"><strong>Данные профиля</strong><span>СОХРАНЯЮТСЯ ЛОКАЛЬНО</span></div><div class="field-label"><span>ИМЯ ИГРОКА</span></div><input class="field-input" id="profileName" maxlength="18" value="' + esc(state.username) + '"><button class="primary-btn full-btn" type="button" data-action="save-profile">СОХРАНИТЬ ПРОФИЛЬ</button><div class="field-help">Изменение имени не влияет на игровые результаты и баланс.</div></div>';
  }

  function renderLive() {
    var rows = state.history.slice(0, 10).map(function (h) { return '<div class="list-card"><span class="list-icon">' + (h.payout > 0 ? '↗' : '↘') + '</span><span><strong>Ты сыграл в ' + esc(h.game) + '</strong><small>' + timeLabel(h.date) + ' · ' + esc(h.result) + '</small></span><span class="list-right">' + (h.net > 0 ? '+' : '') + money(h.net) + ' ₽</span></div>'; }).join('');
    var activitySamples = [
      ['ShadowFox', 'Mines', '2,4×'], ['RedCrow', 'Crash', '1,8×'], ['NightWolf', 'Dice', '1,3×'], ['GhostLine', 'Plinko', '0,8×']
    ].map(function (x) { return '<div class="list-card"><span class="list-icon">◈</span><span><strong>' + x[0] + ' · ' + x[1] + '</strong><small>Пример данных, не реальные игроки</small></span><span class="list-right">' + x[2] + '</span></div>'; }).join('');
    return '<div class="page-head"><div><div class="eyebrow">PLATFORM / LIVE</div><h1>Live</h1><p>Примеры активности интерфейса. Лента не подключена к другим игрокам.</p></div></div><div class="surface"><div class="surface-head"><strong>Твои последние раунды</strong><span>LOCAL ACTIVITY</span></div>' + (rows || '<div class="empty-hint">Здесь появятся твои события после первой игры.</div>') + '</div><div class="spacer"></div><div class="surface"><div class="surface-head"><strong>Примеры событий платформы</strong><span>НЕ РЕАЛЬНЫЕ ИГРОКИ</span></div>' + activitySamples + '</div>';
  }

  function renderLeaderboard() {
    var players = [{ n: 'Crimson', s: 18200 }, { n: 'Nocturne', s: 15400 }, { n: 'BlackRose', s: 12800 }, { n: 'NightRunner', s: 11200 }, { n: 'Phantom', s: 9800 }];
    players.push({ n: state.username || 'Игрок', s: Math.round(state.balance), me: true });
    players.sort(function (a, b) { return b.s - a.s; });
    var rows = players.map(function (p, i) { return '<tr><td><span class="rank-num">#' + (i + 1) + '</span></td><td><strong>' + esc(p.n) + (p.me ? ' <span class="pill">ТЫ</span>' : '') + '</strong></td><td>' + money(p.s) + ' ₽</td><td><span class="pill">' + (p.me ? 'Локальный профиль' : 'Виртуальный профиль') + '</span></td></tr>'; }).join('');
    return '<div class="page-head"><div><div class="eyebrow">COMMUNITY / RANKING</div><h1>Рейтинг</h1><p>Локальный пример таблицы лидеров. Другие строки не являются реальными игроками.</p></div></div><div class="surface"><div class="surface-head"><strong>Баланс игроков</strong><span>ВИРТУАЛЬНЫЕ ₽</span></div><div class="table-wrap"><table><thead><tr><th>МЕСТО</th><th>ИГРОК</th><th>БАЛАНС</th><th>ТИП</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function renderBonuses() {
    var claimed = state.lastBonus === todayKey();
    return '<div class="page-head"><div><div class="eyebrow">REWARDS / DAILY</div><h1>Бонусы</h1><p>Бесплатные виртуальные ₽ для игровых заданий.</p></div></div><div class="bonus-card"><div class="bonus-gift">✧</div><div><h3>Ежедневный бонус · 300 ₽</h3><p>Один бесплатный бонус в день. Счётчик хранится в локальном браузере.</p></div><button class="' + (claimed ? 'secondary-btn' : 'primary-btn') + '" type="button" data-action="claim-bonus"' + (claimed ? ' disabled' : '') + '>' + (claimed ? 'УЖЕ ПОЛУЧЕН' : 'ЗАБРАТЬ БОНУС') + '</button></div><div class="spacer"></div><div class="surface"><div class="surface-head"><strong>Как работают бонусы</strong><span>БЕЗ ДЕНЕЖНОЙ ЦЕННОСТИ</span></div><div class="field-help">Бонус увеличивает только локальный виртуальный баланс. Нельзя приобрести дополнительные кредиты, передать их другому человеку или получить за них деньги.</div></div>';
  }

  function renderMissions() {
    var missions = [
      { id: 'play3', title: 'Первый игровой опыт', desc: 'Заверши 3 игровых раунда.', goal: 3, value: state.rounds, reward: 120 },
      { id: 'win1', title: 'Первая победа', desc: 'Заверши хотя бы один раунд с положительной выплатой.', goal: 1, value: state.wins, reward: 80 },
      { id: 'try3', title: 'Исследователь', desc: 'Заверши 3 разных типа игр.', goal: 3, value: new Set(state.history.map(function (x) { return x.game; })).size, reward: 150 }
    ];
    return '<div class="page-head"><div><div class="eyebrow">CHALLENGES / MISSIONS</div><h1>Задания</h1><p>Небольшие цели для знакомства с механиками.</p></div></div>' + missions.map(function (m) {
      var done = m.value >= m.goal;
      var claimed = state.claimedMissions.indexOf(m.id) >= 0;
      return '<div class="list-card"><span class="list-icon">' + (claimed ? '✓' : '✧') + '</span><span style="flex:1"><strong>' + m.title + '</strong><small>' + m.desc + '</small><div class="progress"><span style="width:' + Math.min(100, m.value / m.goal * 100) + '%"></span></div><small>' + Math.min(m.value, m.goal) + ' / ' + m.goal + '</small></span><span class="list-right"><strong>' + m.reward + ' ₽</strong><br><button class="' + (done && !claimed ? 'soft-btn' : 'secondary-btn') + '" style="margin-top:8px;padding:7px 9px;font-size:8px" type="button" data-action="claim-mission" data-mission="' + m.id + '"' + (!done || claimed ? ' disabled' : '') + '>' + (claimed ? 'ПОЛУЧЕНО' : done ? 'ЗАБРАТЬ' : 'В ПРОЦЕССЕ') + '</button></span></div>';
    }).join('');
  }

  function renderFairplay() {
    return '<div class="page-head"><div><div class="eyebrow">TRANSPARENCY / FAIR PLAY</div><h1>Честная игра</h1><p>Как рассчитываются результаты и какие у проекта ограничения.</p></div></div><div class="notice">Это развлекательная симуляция. Виртуальные суммы не имеют денежной стоимости, а результат игры не создаёт права на выплату.</div><div class="surface"><div class="surface-head"><strong>Генерация случайных чисел</strong><span>CLIENT-SIDE RNG</span></div><p class="field-help">Когда браузер поддерживает Web Crypto API, случайные значения для игровых результатов берутся через crypto.getRandomValues(). Резервный режим использует Math.random().</p><div class="spacer"></div><div class="surface-head"><strong>Проверяемость</strong><span>ВАЖНОЕ ОГРАНИЧЕНИЕ</span></div><p class="field-help">Все расчёты происходят на устройстве пользователя. Нет серверного журнала, внешнего аудитора или независимой проверки результата. Локальные данные можно изменить через инструменты браузера — это не защищённый игровой счёт.</p><div class="spacer"></div><div class="surface-head"><strong>Виртуальная экономика</strong><span>NO REAL MONEY</span></div><p class="field-help">Нет депозитов, платежей, вывода, передачи кредитов или обмена на реальные ценности. Статистика и баланс сохраняются только в локальном хранилище браузера.</p></div>';
  }

  function renderSettings() {
    return '<div class="page-head"><div><div class="eyebrow">PREFERENCES / SETTINGS</div><h1>Настройки</h1><p>Настрой игровые эффекты и локальные данные.</p></div></div><div class="surface"><div class="list-card"><span class="list-icon">♫</span><span><strong>Звуковые сигналы</strong><small>Короткие звуки при завершении раунда.</small></span><button class="' + (state.sound ? 'soft-btn' : 'secondary-btn') + '" type="button" data-action="toggle-sound">' + (state.sound ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО') + '</button></div><div class="list-card"><span class="list-icon">◌</span><span><strong>Уменьшить декоративную анимацию</strong><small>Сократить только декоративные эффекты интерфейса.</small></span><button class="' + (state.reducedMotion ? 'soft-btn' : 'secondary-btn') + '" type="button" data-action="toggle-motion">' + (state.reducedMotion ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО') + '</button></div><div class="spacer"></div><div class="notice">Фон сайта — белый. Баланс в виртуальных ₽ нельзя пополнить, вывести или обменять на реальные деньги. Очистка удалит локальную статистику и профиль.</div><button class="secondary-btn" type="button" data-action="reset-demo">ОЧИСТИТЬ ПРОФИЛЬ</button></div>';
  }

  function renderSupport() {
    return '<div class="page-head"><div><div class="eyebrow">HELP / SUPPORT</div><h1>Поддержка</h1><p>Форма создаёт локальное обращение в этом браузере — сообщение никуда не отправляется.</p></div></div><div class="surface support-form"><div class="surface-head"><strong>Новое обращение</strong><span>LOCAL FORM</span></div><div class="field-label"><span>ТЕМА</span></div><select class="field-select" id="supportTopic"><option>Ошибка в игре</option><option>Вопрос по профилю</option><option>Предложение</option><option>Другое</option></select><div class="field-label"><span>СООБЩЕНИЕ</span></div><textarea class="field-textarea" id="supportMessage" maxlength="1000" placeholder="Опиши вопрос или проблему..."></textarea><button class="primary-btn full-btn" type="button" data-action="send-support">СОХРАНИТЬ ОБРАЩЕНИЕ</button><div class="field-help">Обращение сохранится локально и будет видно только на этом устройстве.</div></div><div class="spacer"></div><div class="surface"><div class="surface-head"><strong>Локальные обращения</strong><span>' + state.support.length + '</span></div>' + (state.support.length ? state.support.map(function (s) { return '<div class="activity-row"><span class="activity-icon">◌</span><span><strong>' + esc(s.topic) + '</strong><small>' + esc(s.message) + ' · ' + timeLabel(s.date) + '</small></span><span class="pill">СОХРАНЕНО</span></div>'; }).join('') : '<div class="empty-hint">Пока нет обращений.</div>') + '</div>';
  }

  function render() {
    if (page === 'home') root.innerHTML = renderHome();
    else if (page === 'game') root.innerHTML = renderGame();
    else if (page === 'profile') root.innerHTML = renderProfile();
    else if (page === 'history') root.innerHTML = renderHistory();
    else if (page === 'live') root.innerHTML = renderLive();
    else if (page === 'leaderboard') root.innerHTML = renderLeaderboard();
    else if (page === 'bonuses') root.innerHTML = renderBonuses();
    else if (page === 'missions') root.innerHTML = renderMissions();
    else if (page === 'fairplay') root.innerHTML = renderFairplay();
    else if (page === 'settings') root.innerHTML = renderSettings();
    else if (page === 'support') root.innerHTML = renderSupport();
    else root.innerHTML = renderHome();
    updateHeader();
    updateNav();
    document.body.classList.toggle('reduce-motion', !!state.reducedMotion);
    document.body.setAttribute('data-theme', 'light');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', '#ffffff');
  }

  function readStake() {
    var field = document.getElementById('stakeInput');
    return field ? Number(field.value) : NaN;
  }

  function startMines() {
    var stake = readStake();
    var countField = document.getElementById('mineCount');
    var count = countField ? Number(countField.value) : 5;
    if (!Number.isInteger(count) || count < 1 || count > 24 || !placeStake(stake, 'Mines')) return;
    var pool = Array.from({ length: 25 }, function (_, i) { return i; });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = randInt(i + 1); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    runtime.mines = { active: true, stake: stake, mineCount: count, mineSet: pool.slice(0, count), opened: [], revealAll: false, message: 'Раунд начат. Выбирай клетки.', messageType: '' };
    render();
  }

  function openMineCell(index) {
    var r = runtime.mines;
    if (!r || !r.active || r.opened.indexOf(index) >= 0) return;
    if (r.mineSet.indexOf(index) >= 0) {
      r.active = false; r.revealAll = true; r.message = 'Мина! Ставка раунда потеряна.'; r.messageType = 'bad';
      settleRound('mines', r.stake, 0, 'ПРОИГРЫШ', 'Мина');
      render(); return;
    }
    r.opened.push(index);
    var multiplier = minesMultiplier(r.mineCount, r.opened.length);
    r.message = 'Безопасно! Текущий множитель ' + multiplier.toFixed(2) + '×.';
    r.messageType = 'good';
    if (r.opened.length === 25 - r.mineCount) {
      cashoutMines();
    } else render();
  }

  function cashoutMines() {
    var r = runtime.mines;
    if (!r || !r.active || !r.opened.length) return;
    r.active = false; r.revealAll = true;
    var mult = minesMultiplier(r.mineCount, r.opened.length);
    var payout = round2(r.stake * mult);
    r.message = 'Раунд завершён. Начислено ' + money(payout) + ' ₽ (' + mult.toFixed(2) + '×).';
    r.messageType = 'good';
    settleRound('mines', r.stake, payout, 'ПОБЕДА', mult.toFixed(2) + '×');
    render();
  }

  function startCrash() {
    var stake = readStake();
    if (!placeStake(stake, 'Crash')) return;
    if (runtime.crashTimer) clearInterval(runtime.crashTimer);
    var x = rand();
    var crashAt = Math.max(1, Math.min(35, Math.floor((0.985 / Math.max(0.015, 1 - x)) * 100) / 100));
    runtime.crash = { active: true, stake: stake, crashAt: crashAt, current: 1, last: crashAt, message: 'Раунд идёт. Забери результат до остановки.' };
    crashStartedAt = Date.now();
    render();
    runtime.crashTimer = setInterval(function () {
      var r = runtime.crash;
      if (!r || !r.active) { clearInterval(runtime.crashTimer); return; }
      var elapsed = (Date.now() - crashStartedAt) / 1000;
      r.current = Math.min(35, Math.floor(Math.exp(elapsed * 0.46) * 100) / 100);
      var multNode = document.getElementById('crashMultiplier');
      var statusNode = document.getElementById('crashStatus');
      var pathNode = document.getElementById('crashPath');
      if (multNode) multNode.innerHTML = r.current.toFixed(2) + '<small>×</small>';
      if (statusNode) statusNode.textContent = 'РАУНД ИДЁТ · ЗАБРАТЬ МОЖНО СЕЙЧАС';
      if (pathNode) {
        var pct = Math.min(1, (r.current - 1) / 12);
        var y = 184 - pct * 168;
        var xPos = Math.min(500, 60 + pct * 420);
        pathNode.setAttribute('d', 'M0 185 Q' + Math.max(40, xPos * .45) + ' ' + (185 - pct * 28) + ' ' + xPos + ' ' + y);
      }
      if (r.current >= r.crashAt) finishCrashLoss();
    }, 55);
  }

  function finishCrashLoss() {
    var r = runtime.crash;
    if (!r || !r.active) return;
    r.active = false; r.last = r.crashAt; r.message = 'Краш на ' + r.crashAt.toFixed(2) + '×. В этом раунде ставка потеряна.';
    if (runtime.crashTimer) clearInterval(runtime.crashTimer);
    runtime.crashTimer = null;
    settleRound('crash', r.stake, 0, 'КРАШ', r.crashAt.toFixed(2) + '×');
    if (page === 'game' && currentGame === 'crash') render();
    toast('Раунд Crash завершён: ' + r.crashAt.toFixed(2) + '×', 'bad');
  }

  function cashoutCrash() {
    var r = runtime.crash;
    if (!r || !r.active || r.current >= r.crashAt) return;
    r.active = false;
    if (runtime.crashTimer) clearInterval(runtime.crashTimer);
    runtime.crashTimer = null;
    var payout = round2(r.stake * r.current);
    r.last = r.current; r.message = 'Зафиксировано ' + r.current.toFixed(2) + '× · ' + money(payout) + ' ₽.';
    settleRound('crash', r.stake, payout, 'ЗАБРАНО', r.current.toFixed(2) + '×');
    render();
  }

  function rollDice() {
    var stake = readStake();
    var target = Number(document.getElementById('diceTarget').value);
    var direction = document.getElementById('diceDirection').value;
    if (!Number.isInteger(target) || target < 5 || target > 95 || !placeStake(stake, 'Dice')) return;
    var roll = randInt(100);
    var probability = direction === 'under' ? target / 100 : (100 - target) / 100;
    var win = direction === 'under' ? roll < target : roll >= target;
    var mult = 0.98 / probability;
    var payout = win ? round2(stake * mult) : 0;
    runtime.diceResult = { roll: roll, target: target, win: win, message: win ? 'Попадание! Выплата ' + money(payout) + ' ₽ · ' + mult.toFixed(2) + '×.' : 'Не совпало. Попробуй другой прогноз.', };
    settleRound('dice', stake, payout, win ? 'ПОБЕДА' : 'ПРОИГРЫШ', 'Выпало ' + roll);
    render();
  }

  function dropPlinko() {
    if (runtime.plinkoBusy) return;
    var stake = readStake();
    var risk = document.getElementById('plinkoRisk').value;
    if (!placeStake(stake, 'Plinko')) return;
    var tables = {
      low: [1.7, 1.3, 1, 0.8, 0.7, 0.8, 1, 1.3, 1.7],
      medium: [6, 2.2, 1.3, 0.65, 0.35, 0.65, 1.3, 2.2, 6],
      high: [15, 4, 1.5, 0.3, 0.1, 0.3, 1.5, 4, 15]
    };
    runtime.plinkoRisk = risk;
    var slot = 0;
    for (var i = 0; i < 8; i++) if (rand() >= 0.5) slot++;
    var mult = tables[risk][slot];
    var payout = round2(stake * mult);
    runtime.plinkoBusy = true;
    var session = sessionVersion;
    runtime.plinkoResult = { message: 'Шар попал в слот ' + (slot + 1) + ' · ' + mult.toFixed(2) + '× · ' + money(payout) + ' ₽.', slot: slot, mult: mult };
    render();
    var ball = document.getElementById('plinkoBall');
    if (ball) { ball.style.display = 'block'; ball.style.setProperty('--ball-end', (slot / 8 * 100) + '%'); ball.classList.add('drop'); }
    setTimeout(function () {
      if (session !== sessionVersion) return;
      runtime.plinkoBusy = false;
      settleRound('plinko', stake, payout, payout > 0 ? 'РЕЗУЛЬТАТ' : 'ПРОИГРЫШ', slot + 1 + ' слот · ' + mult.toFixed(2) + '×');
      if (page === 'game' && currentGame === 'plinko') render();
      else toast('Plinko: ' + mult.toFixed(2) + '×', payout > 0 ? 'good' : 'bad');
    }, 950);
  }

  function spinWheel() {
    if (runtime.wheelBusy) return;
    var stake = readStake();
    if (!placeStake(stake, 'Wheel')) return;
    var values = [0, 0, 0.2, 0.3, 0.5, 0.7, 0.8, 1, 1.5, 3];
    var index = randInt(values.length);
    var mult = values[index];
    var payout = round2(stake * mult);
    runtime.wheelBusy = true;
    var session = sessionVersion;
    var totalAngle = 360 * 8 + (360 - (index * 36 + 18));
    var wheelDuration = state.reducedMotion ? 0 : 7800;
    runtime.wheelResult = { angle: 0, message: 'Колесо набирает скорость...', index: index, mult: mult };
    render();
    requestAnimationFrame(function () {
      var wheel = document.getElementById('wheelDisc');
      if (wheel) wheel.style.transform = 'rotate(' + totalAngle + 'deg)';
    });
    setTimeout(function () {
      if (session !== sessionVersion) return;
      if (runtime.wheelResult) {
        runtime.wheelResult.angle = totalAngle;
        runtime.wheelResult.message = 'Сектор ' + (index + 1) + ' · ' + mult.toFixed(2) + '× · ' + money(payout) + ' ₽.';
      }
      runtime.wheelBusy = false;
      settleRound('wheel', stake, payout, payout > 0 ? 'РЕЗУЛЬТАТ' : 'ПУСТО', mult.toFixed(2) + '×');
      if (page === 'game' && currentGame === 'wheel') render();
      else toast('Wheel: ' + mult.toFixed(2) + '×', payout > 0 ? 'good' : 'bad');
    }, wheelDuration + 120);
  }function openCase(id) {
    if (runtime.caseBusy) return;
    var cases = { starter: 100, night: 250, legend: 500 };
    var cost = cases[id];
    if (!cost || !placeStake(cost, 'Cases · ' + id)) return;
    var drops = [
      { m: 0, w: 8 }, { m: 0.3, w: 18 }, { m: 0.5, w: 24 }, { m: 0.8, w: 22 },
      { m: 1, w: 14 }, { m: 1.5, w: 7 }, { m: 2, w: 4 }, { m: 3, w: 2 }, { m: 5, w: 1 }
    ];
    var pick = rand() * 100;
    var sum = 0;
    var mult = 0;
    for (var i = 0; i < drops.length; i++) { sum += drops[i].w; if (pick < sum) { mult = drops[i].m; break; } }
    var payout = round2(cost * mult);
    runtime.caseBusy = true;
    var session = sessionVersion;
    runtime.caseResult = { message: 'Кейс открывается...', mult: mult };
    render();
    setTimeout(function () {
      if (session !== sessionVersion) return;
      runtime.caseBusy = false;
      runtime.caseResult.message = 'Выпало ' + mult.toFixed(2) + '× · ' + money(payout) + ' ₽.';
      settleRound('cases', cost, payout, payout > 0 ? 'ОТКРЫТ' : 'ПУСТО', mult.toFixed(2) + '×');
      if (page === 'game' && currentGame === 'cases') render();
      else toast('Кейс: ' + mult.toFixed(2) + '×', payout > 0 ? 'good' : 'bad');
    }, 1100);
  }

  function flipCoin(face) {
    var stake = readStake();
    if (!placeStake(stake, 'Coinflip')) return;
    var result = rand() < 0.5 ? 'heads' : 'tails';
    var win = result === face;
    var payout = win ? round2(stake * 1.96) : 0;
    runtime.coinResult = { face: result, win: win, message: win ? 'Совпало! Начислено ' + money(payout) + ' ₽.' : 'Не совпало. Раунд завершён.' };
    settleRound('coinflip', stake, payout, win ? 'ПОБЕДА' : 'ПРОИГРЫШ', result === 'heads' ? 'Орёл' : 'Решка');
    render();
  }

  function claimBonus() {
    if (state.lastBonus === todayKey()) { toast('Сегодня бонус уже получен.', 'bad'); return; }
    state.lastBonus = todayKey();
    state.balance = round2(state.balance + 300);
    pushOperation('Бонус', 300, 'Ежедневный бонус');
    save(); render(); toast('Начислено 300 виртуальных ₽.', 'good');
  }

  function claimMission(id) {
    if (state.claimedMissions.indexOf(id) >= 0) return;
    var missions = {
      play3: { ok: state.rounds >= 3, reward: 120, name: 'Первый игровой опыт' },
      win1: { ok: state.wins >= 1, reward: 80, name: 'Первая победа' },
      try3: { ok: new Set(state.history.map(function (x) { return x.game; })).size >= 3, reward: 150, name: 'Исследователь' }
    };
    var m = missions[id];
    if (!m || !m.ok) { toast('Задание ещё не выполнено.', 'bad'); return; }
    state.claimedMissions.push(id);
    state.balance = round2(state.balance + m.reward);
    pushOperation('Награда', m.reward, m.name);
    save(); render(); toast('Награда ' + m.reward + ' ₽ получена.', 'good');
  }

  function saveProfile() {
    var field = document.getElementById('profileName');
    var name = field ? field.value.trim() : '';
    if (!name) { toast('Имя не должно быть пустым.', 'bad'); return; }
    state.username = name.slice(0, 18);
    save(); render(); toast('Профиль сохранён.', 'good');
  }

  function sendSupport() {
    var topic = document.getElementById('supportTopic').value;
    var message = document.getElementById('supportMessage').value.trim();
    if (message.length < 5) { toast('Напиши сообщение длиной от 5 символов.', 'bad'); return; }
    state.support.unshift({ topic: topic, message: message.slice(0, 1000), date: new Date().toISOString() });
    state.support = state.support.slice(0, 20);
    save(); render(); toast('Обращение сохранено локально.', 'good');
  }

  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeGameMenu(); });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-page],button[data-game],button[data-action]');
    if (!button) return;
    if (button.disabled) return;
    var nextPage = button.getAttribute('data-page');
    var nextGame = button.getAttribute('data-game');
    var action = button.getAttribute('data-action');
    if (nextPage) { closeGameMenu(); setPage(nextPage); return; }
    if (nextGame) { closeGameMenu(); setPage('game', nextGame); return; }
    if (!action) return;
    if (action === 'start-mines') startMines();
    else if (action === 'open-cell') openMineCell(Number(button.getAttribute('data-index')));
    else if (action === 'cashout-mines') cashoutMines();
    else if (action === 'start-crash') startCrash();
    else if (action === 'cashout-crash') cashoutCrash();
    else if (action === 'roll-dice') rollDice();
    else if (action === 'drop-plinko') dropPlinko();
    else if (action === 'spin-wheel') spinWheel();
    else if (action === 'open-case') openCase(button.getAttribute('data-case'));
    else if (action === 'flip-coin') flipCoin(button.getAttribute('data-face'));
    else if (action === 'claim-bonus') claimBonus();
    else if (action === 'claim-mission') claimMission(button.getAttribute('data-mission'));
    else if (action === 'save-profile') saveProfile();
    else if (action === 'send-support') sendSupport();
    else if (action === 'toggle-game-menu') { openGameMenu(); }
    else if (action === 'close-game-menu') { closeGameMenu(); }
    else if (action === 'toggle-theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; save(); render(); toast(state.theme === 'light' ? 'Светлая тема включена.' : 'Тёмная тема включена.'); }
    else if (action === 'toggle-sound') { state.sound = !state.sound; save(); render(); toast('Настройка звука обновлена.'); }
    else if (action === 'toggle-motion') { state.reducedMotion = !state.reducedMotion; save(); render(); toast('Настройка анимации обновлена.'); }
    else if (action === 'reset-demo') {
      if (window.confirm('Сбросить профиль, баланс и всю локальную историю?')) {
        if (runtime.crashTimer) clearInterval(runtime.crashTimer);
        sessionVersion += 1;
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        state = Object.assign({}, defaultState, { playerId: '1W-' + String(Math.floor(Math.random() * 900000 + 100000)) });
        runtime = { mines: null, crash: null, crashTimer: null, plinkoBusy: false, plinkoResult: null, wheelBusy: false, wheelResult: null, caseBusy: false, caseResult: null, coinResult: null, diceResult: null, diceBusy: false, diceInterval: null, diceTimeout: null, coinBusy: false, coinTimeout: null };
        page = 'home'; render(); toast('Профиль сброшен.', 'good');
      }
    }
  });

  document.addEventListener('input', function (event) {
    if (event.target && event.target.id === 'diceTarget') {
      var label = document.getElementById('diceTargetValue');
      if (label) label.textContent = event.target.value;
      var direction = document.getElementById('diceDirection');
      var odds = document.getElementById('diceOdds');
      if (odds && direction) {
        var probability = direction.value === 'under' ? Number(event.target.value) : 100 - Number(event.target.value);
        odds.textContent = 'Вероятность: ' + probability + '% · теоретический множитель: ' + (0.98 / (probability / 100)).toFixed(2) + '×.';
      }
    }
  });
  document.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'plinkoRisk') {
      runtime.plinkoRisk = event.target.value;
      var slotValues = { low: [1.7, 1.3, 1, 0.8, 0.7, 0.8, 1, 1.3, 1.7], medium: [6, 2.2, 1.3, 0.65, 0.35, 0.65, 1.3, 2.2, 6], high: [15, 4, 1.5, 0.3, 0.1, 0.3, 1.5, 4, 15] }[runtime.plinkoRisk];
      document.querySelectorAll('.plinko-slots span').forEach(function (node, i) { if (slotValues) node.textContent = String(Number(slotValues[i].toFixed(2))) + '×'; });
    }
    if (event.target && event.target.id === 'diceDirection') {
      var target = Number(document.getElementById('diceTarget').value);
      var probability = event.target.value === 'under' ? target : 100 - target;
      document.getElementById('diceOdds').textContent = 'Вероятность: ' + probability + '% · теоретический множитель: ' + (0.98 / (probability / 100)).toFixed(2) + '×.';
    }
  });

  updateHeader();
  render();
})();