# LEONIDA — Phase 1 / Ultra update

Браузерная 3D-среда открытого мира на Three.js. В фазе 1 представлены только природная территория, рельеф, трава, дороги, небо, облака и свет. Персонажей, машин, зданий, животных и города нет.

## Запуск

Откройте GitHub Pages или локально запустите проект через Node.js 20+:

    npm install
    npm run dev

Production:

    npm run check
    npm run build
    npm run preview

## Управление на телефоне

- Левый виртуальный джойстик — свободное движение.
- Свайп справа — поворот камеры.
- Два пальца справа — приближение и отдаление.
- «ВЫШЕ» / «НИЖЕ» — изменение высоты.
- Удержание «УСКОРЕНИЕ» — быстрый полёт камеры.

На компьютере: WASD, мышь, колесо, E/Q, Shift, T, Esc.

## Графика

Ultra-профиль по умолчанию. Процедурные PBR-карты поля, грунта и асфальта используют albedo, normal, roughness и height/bump данные. Рельеф и трава загружаются чанками с несколькими уровнями детализации. Трава размещается через InstancedMesh и анимируется в shader-коде с учётом силы и направления ветра. Используются ACES/AgX tone mapping, высокое внутреннее разрешение, анизотропная фильтрация, карты теней высокого разрешения, атмосферная дымка и динамическое освещение.

Для мобильных устройств есть автоматические ограничения разрешения рендеринга и теней. Ультра-профиль повышает нагрузку, нагрев и расход батареи; на разных устройствах реальная частота кадров будет отличаться.

Текстуры генерируются процедурно в браузере, а не загружаются из профессиональной фотограмметрической библиотеки. Это максимально детализированная текущая браузерная реализация LEONIDA, но не AAA-графика уровня GTA VI.

## First-person walking and interiors

- Player camera is locked to a 1.68 m eye height with grounded terrain following; free-flight and vertical movement controls are removed.
- Walking speed is 2.7 m/s and sprint speed is 5.4 m/s.
- House collision volumes leave a clear front-door passage; the front doors are modelled open.
- Both residences include furnished interiors, floorboards, kitchen fittings, living-room furniture, dining furniture, shelving, wall art, plants and warm interior lights.
- First-person arms and hands are implemented as separate modules in `src/character/`, with procedural skin microtexture and a subtle walking animation.
