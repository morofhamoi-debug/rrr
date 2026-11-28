# EZID RUSSIA — playable browser prototype

EZID RUSSIA is a small single-player 3D roleplay prototype built with Three.js and Vite. It runs in a modern Android browser and can be added to the home screen as a web app. It is not a native APK and does not yet include online multiplayer.

## Play online

After GitHub Pages deployment, open:

https://morofhamoi-debug.github.io/rrr/

On Android, open the link in Chrome and use the browser menu → **Add to Home screen** (or **Install app**, when offered).

## Start locally

Requires Node.js 20+:

    npm install
    npm run dev

Production verification:

    npm run check
    npm run build
    npm run preview

## Current playable loop

- Explore a small 3D environment with a starter city district.
- Walk and sprint using WASD or the on-screen joystick.
- Enter and drive parked cars; exit with E or the action button.
- Start a courier job at the orange marker and complete the delivery at the green marker.
- Earn 2,500 in-game rubles and experience for a completed delivery.
- Change the character name and retain the local profile, balance, job state and position in browser storage.
- The service worker caches the application shell for repeat visits and limited offline use after the first successful load.

## Controls

**Android:** left joystick = move / throttle; swipe on the right = look around; arrow controls = turn / steer; sprint button = run; contextual action button = enter/exit car or accept/complete a courier job.

**Desktop:** WASD = walk / drive; Shift = sprint; mouse = look; E = action / enter / exit car; T = change time of day; Esc = menu.

## Important limits

- This is a local single-player prototype, not a production-scale RP game.
- Profile and game money are stored in the browser on the current device. Clearing browser data will erase them.
- Cars have prototype arcade handling; traffic, pedestrians, police, full missions, vehicle ownership, multiplayer, backend accounts and anti-cheat are not implemented yet.
- The rendering engine is Three.js in the browser. There is no Unity project or native APK in this branch.
- Performance depends on the phone and browser. If the device heats up or slows down, lower graphics settings in the menu.
