export class LoadingScreen {
  constructor(root){this.root=root;this.bar=root.querySelector('#loading-bar');this.label=root.querySelector('#loading-label');}
  async show(){
    this.root.classList.remove('is-hidden');this.bar.style.width='12%';this.label.textContent='Синхронизация ландшафта…';
    await new Promise(r=>requestAnimationFrame(r));this.bar.style.width='68%';this.label.textContent='Подготовка окружения…';
    await new Promise(r=>setTimeout(r,260));this.bar.style.width='100%';this.label.textContent='Готово';
    await new Promise(r=>setTimeout(r,150));this.hide();
  }
  hide(){this.root.classList.add('is-hidden');}
}