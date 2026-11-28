export class LoadingScreen {
  constructor(root) {
    this.root = root;
    this.bar = root.querySelector('#loading-bar');
    this.label = root.querySelector('#loading-label');
  }

  async show() {
    this.root.classList.remove('is-hidden');
    this.bar.style.width = '12%';
    this.label.textContent = 'Подготовка городского района…';
    await new Promise((resolve) => requestAnimationFrame(resolve));
    this.bar.style.width = '68%';
    this.label.textContent = 'Загрузка окружения и зданий…';
    await new Promise((resolve) => setTimeout(resolve, 260));
    this.bar.style.width = '100%';
    this.label.textContent = 'Город готов';
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.hide();
  }

  hide() { this.root.classList.add('is-hidden'); }
}
