const STORAGE_KEY = 'ezid-russia-profile-v1';

function createDefaultProfile() {
  return {
    id: Math.floor(100000 + Math.random() * 900000),
    name: 'Игрок',
    level: 1,
    money: 15000,
    experience: 0,
    createdAt: new Date().toISOString()
  };
}

export class PlayerProfile {
  constructor() {
    this.value = this.load();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        return {
          ...createDefaultProfile(),
          ...saved,
          id: Number(saved.id) || createDefaultProfile().id,
          name: String(saved.name || 'Игрок').slice(0, 18),
          level: Math.max(1, Number(saved.level) || 1),
          money: Math.max(0, Number(saved.money) || 0),
          experience: Math.max(0, Number(saved.experience) || 0)
        };
      }
    } catch (error) {
      console.warn('Профиль не удалось прочитать:', error);
    }
    const value = createDefaultProfile();
    this.persist(value);
    return value;
  }

  persist(value = this.value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Профиль не удалось сохранить:', error);
      return false;
    }
  }

  get() {
    return { ...this.value };
  }

  setName(name) {
    const clean = String(name || '').trim().replace(/[<>]/g, '').slice(0, 18);
    if (!clean) return false;
    this.value.name = clean;
    return this.persist();
  }

  addMoney(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return false;
    this.value.money += Math.floor(value);
    return this.persist();
  }
}
