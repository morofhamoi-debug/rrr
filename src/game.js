import { Engine } from './core/engine.js';
import { AudioEnvironment } from './core/audio.js';

export class Game {
  constructor(canvas) {
    this.engine = new Engine(canvas);
    this.world = this.engine.world;
    this.audio = new AudioEnvironment();
    this.state = 'menu';
    this.stateListener = () => {};
    this.toastTimer = null;
    this.hudTime = document.querySelector('#hud-time');
    this.hudWeather = document.querySelector('#hud-weather');
    this.hudFps = document.querySelector('#hud-fps');
    this.pointerHint = document.querySelector('#pointer-hint');
    this.toastNode = document.querySelector('#toast');
    this.engine.camera.onPointerLock = (locked) => {
      this.pointerHint.classList.toggle('is-hidden', locked || this.state !== 'playing');
    };
    this.engine.onFrame = (stats) => this.updateHud(stats);
  }

  async init(settings) {
    await this.engine.init(settings);
    this.engine.camera.restore();
  }

  run() { this.engine.start(); }
  setStateListener(listener) { this.stateListener = listener; }
  isPlaying() { return this.state === 'playing'; }

  async start(resume = false) {
    if (resume) this.engine.camera.restore();
    this.state = 'playing';
    this.stateListener(this.state);
    this.audio.start();
    this.engine.camera.enableInput(true);
    const hint = this.engine.camera.isTouchDevice
      ? 'Движение — джойстик слева. Обзор — свайп справа. Масштаб — жест двумя пальцами.'
      : 'WASD — движение. Мышь — обзор. Колесо — приближение.';
    this.toast(hint);
  }

  openMenu() {
    if (this.state !== 'playing') return;
    this.state = 'menu';
    this.engine.camera.enableInput(false);
    this.engine.camera.releasePointer();
    this.engine.camera.save();
    this.audio.pause();
    this.stateListener(this.state);
    document.querySelector('#menu-screen').classList.remove('is-hidden');
    document.querySelector('#hud').classList.add('is-hidden');
    window.dispatchEvent(new CustomEvent('leonida:show-menu'));
  }

  applySettings(settings) {
    this.engine.applySettings(settings);
    this.audio.applySettings(settings);
    document.documentElement.style.setProperty('--ui-scale', String(settings.uiScale / 100));
    this.hudFps.classList.toggle('is-hidden', !settings.showFPS);
  }

  updateHud(stats) {
    const time = this.engine.world.getTime();
    const h = Math.floor(time), m = Math.floor((time - h) * 60);
    this.hudTime.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    this.hudWeather.textContent = 'ВЕТЕР · ' + stats.wind.toFixed(1) + ' М/С';
    this.hudFps.textContent = Math.round(stats.fps) + ' FPS';
  }

  toast(message) {
    this.toastNode.textContent = message;
    this.toastNode.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastNode.classList.remove('is-visible'), 3300);
  }
}