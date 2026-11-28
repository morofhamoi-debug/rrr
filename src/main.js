import { Game } from './game.js';
import { SettingsPanel } from './menu/settings.js';
import { MainMenu } from './menu/main_menu.js';
import { LoadingScreen } from './menu/loading_screen.js';
import { TouchControls } from './core/touch_controls.js';

const canvas = document.querySelector('#game-canvas');
const menuRoot = document.querySelector('#menu-content');
const loading = new LoadingScreen(document.querySelector('#loading-screen'));
const game = new Game(canvas);
const settings = new SettingsPanel(menuRoot, game);
const menu = new MainMenu(menuRoot, game, settings, loading);
const touchControls = new TouchControls(game.engine.camera);

menu.mount();
game.setStateListener((state) => {
  document.querySelector('#hud').classList.toggle('is-hidden', state !== 'playing');
});
document.querySelector('#hud-menu').addEventListener('click', () => game.openMenu());
document.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && game.isPlaying()) {
    event.preventDefault();
    game.openMenu();
  }
  if (event.code === 'KeyT' && game.isPlaying()) game.world.advanceTime(1.5);
});
await game.init(settings.get());
game.run();
window.__EZID_RUSSIA__ = { game, settings, touchControls };
