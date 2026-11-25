import * as THREE from 'three';
import { terrainHeight } from '../terrain/terrain_manager.js';

function makeTexture(kind) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const rand = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + 19.19) * 43758.5453;
    return n - Math.floor(n);
  };

  if (kind === 'roof-tile') {
    ctx.fillStyle = '#8b4935';
    ctx.fillRect(0, 0, size, size);
    const tileH = 34, tileW = 54;
    for (let y = 0; y < size + tileH; y += tileH) {
      const offset = (Math.floor(y / tileH) % 2) * (tileW / 2);
      for (let x = -tileW; x < size + tileW; x += tileW) {
        const tone = Math.floor(rand(x, y) * 34);
        ctx.fillStyle = `rgb(${126 + tone},${59 + tone * .55},${42 + tone * .42})`;
        ctx.fillRect(x + offset + 2, y + 2, tileW - 4, tileH - 4);
        ctx.fillStyle = 'rgba(255,210,165,.22)';
        ctx.fillRect(x + offset + 4, y + 3, tileW - 8, 2);
        ctx.fillStyle = 'rgba(39,23,19,.42)';
        ctx.fillRect(x + offset + 2, y + tileH - 4, tileW - 4, 3);
      }
    }
  } else if (kind === 'metal-roof') {
    ctx.fillStyle = '#4b5553';
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 20) {
      ctx.fillStyle = 'rgba(229,235,221,.12)';
      ctx.fillRect(x, 0, 2, size);
      ctx.fillStyle = 'rgba(9,18,17,.24)';
      ctx.fillRect(x + 3, 0, 3, size);
    }
    for (let i = 0; i < 1100; i++) {
      const x = rand(i, 2) * size, y = rand(i, 7) * size;
      ctx.fillStyle = `rgba(185,185,162,${rand(i, 11) * .12})`;
      ctx.fillRect(x, y, 2 + rand(i, 13) * 5, 1);
    }
  } else {
    const wood = kind === 'siding';
    ctx.fillStyle = wood ? '#9b9b7f' : '#d5c7a9';
    ctx.fillRect(0, 0, size, size);
    if (wood) {
      for (let y = 0; y < size; y += 28) {
        const shade = Math.floor(rand(y, 4) * 28);
        ctx.fillStyle = `rgb(${135 + shade},${139 + shade},${116 + shade * .7})`;
        ctx.fillRect(0, y + 2, size, 24);
        ctx.fillStyle = 'rgba(42,48,39,.28)';
        ctx.fillRect(0, y + 25, size, 2);
        ctx.fillStyle = 'rgba(246,230,198,.22)';
        ctx.fillRect(0, y + 3, size, 1);
      }
      for (let i = 0; i < 1700; i++) {
        const x = rand(i, 21) * size, y = rand(i, 29) * size;
        ctx.fillStyle = `rgba(42,47,37,${rand(i, 33) * .14})`;
        ctx.fillRect(x, y, 1 + rand(i, 35) * 11, 1);
      }
    } else {
      for (let i = 0; i < 15000; i++) {
        const x = rand(i, 41) * size, y = rand(i, 43) * size;
        ctx.fillStyle = `rgba(80,65,45,${rand(i, 47) * .075})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  map.generateMipmaps = true;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}

const MATERIALS = {
  stucco: new THREE.MeshStandardMaterial({ color: 0xe5d8b9, map: makeTexture('stucco'), roughness: .94 }),
  siding: new THREE.MeshStandardMaterial({ color: 0xd0d1b6, map: makeTexture('siding'), roughness: .9 }),
  tileRoof: new THREE.MeshStandardMaterial({ color: 0xffffff, map: makeTexture('roof-tile'), roughness: .84 }),
  metalRoof: new THREE.MeshStandardMaterial({ color: 0xffffff, map: makeTexture('metal-roof'), roughness: .68, metalness: .28 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xeee6d4, roughness: .78 }),
  warmTrim: new THREE.MeshStandardMaterial({ color: 0xc9a77b, roughness: .84 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x4b4032, roughness: .9 }),
  porchWood: new THREE.MeshStandardMaterial({ color: 0x9d8262, roughness: .92 }),
  door: new THREE.MeshStandardMaterial({ color: 0x34483d, roughness: .74 }),
  brick: new THREE.MeshStandardMaterial({ color: 0x855342, roughness: .95 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x89877a, roughness: .98 }),
  gravel: new THREE.MeshStandardMaterial({ color: 0x77766a, roughness: 1 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x555e58, metalness: .72, roughness: .43 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x9cbdba, roughness: .16, metalness: .22, clearcoat: .85, clearcoatRoughness: .12,
    emissive: 0x20383a, emissiveIntensity: .18, transparent: true, opacity: .86
  }),
  darkGlass: new THREE.MeshPhysicalMaterial({
    color: 0x536b67, roughness: .13, metalness: .35, clearcoat: 1, transparent: true, opacity: .9
  }),
  foliage: new THREE.MeshStandardMaterial({ color: 0x455e3d, roughness: 1 }),
  foliageLight: new THREE.MeshStandardMaterial({ color: 0x75804d, roughness: 1 }),
  flower: new THREE.MeshStandardMaterial({ color: 0xd69a72, roughness: 1 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xf2c88b, emissive: 0xffb66f, emissiveIntensity: 1.8, roughness: .4 })
};

function addBox(parent, w, h, d, material, x, y, z, castShadow = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addWindow(parent, x, y, z, width, height, rotationY = 0, shutterMaterial = MATERIALS.darkWood) {
  const window = new THREE.Group();
  window.position.set(x, y, z);
  window.rotation.y = rotationY;
  const frame = .12;
  addBox(window, width, height, .16, MATERIALS.trim, 0, 0, 0, false);
  addBox(window, width - frame * 2, height - frame * 2, .055, MATERIALS.glass, 0, 0, .105, false);
  addBox(window, frame, height, .18, MATERIALS.trim, -width / 2, 0, .1);
  addBox(window, frame, height, .18, MATERIALS.trim, width / 2, 0, .1);
  addBox(window, width, frame, .18, MATERIALS.trim, 0, height / 2, .1);
  addBox(window, width, frame, .18, MATERIALS.trim, 0, -height / 2, .1);
  addBox(window, .065, height - frame * 2, .12, MATERIALS.trim, 0, 0, .15);
  addBox(window, width - frame * 2, .065, .12, MATERIALS.trim, 0, 0, .15);
  addBox(window, width + .42, .18, .25, MATERIALS.trim, 0, -height / 2 - .08, .17);
  addBox(window, .32, height + .12, .16, shutterMaterial, -width / 2 - .26, 0, .015);
  addBox(window, .32, height + .12, .16, shutterMaterial, width / 2 + .26, 0, .015);
  parent.add(window);
  return window;
}

function addDoor(parent, frontZ) {
  addBox(parent, 1.65, 3.45, .22, MATERIALS.trim, 0, 1.86, frontZ, false);
  addBox(parent, 1.38, 3.16, .12, MATERIALS.door, 0, 1.84, frontZ + .14, false);
  for (const y of [.95, 2.05]) {
    addBox(parent, .46, .72, .035, MATERIALS.warmTrim, 0, y, frontZ + .22);
  }
  addBox(parent, .045, .15, .055, MATERIALS.metal, .49, 1.7, frontZ + .24);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), MATERIALS.warmTrim);
  knob.position.set(.52, 1.7, frontZ + .28);
  parent.add(knob);
  addBox(parent, 2.2, .2, .42, MATERIALS.trim, 0, .08, frontZ + .1);
  addBox(parent, 2.1, .2, .3, MATERIALS.warmTrim, 0, 3.7, frontZ + .1);
}

function addGable(parent, width, rise, wallHeight, z, material, reverse = false) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .22, bevelEnabled: true, bevelThickness: .04, bevelSize: .035, bevelSegments: 1 });
  const gable = new THREE.Mesh(geometry, material);
  gable.position.set(0, wallHeight, z);
  if (reverse) gable.rotation.y = Math.PI;
  gable.castShadow = true;
  gable.receiveShadow = true;
  parent.add(gable);
}

function addRoof(parent, width, depth, wallHeight, rise, material, metal = false) {
  const half = width / 2 + .65;
  const slope = Math.hypot(half, rise);
  const angle = Math.atan2(rise, half);
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(slope + .25, .32, depth + 1.45), material);
    panel.position.set(side * half / 2, wallHeight + rise / 2, 0);
    panel.rotation.z = side < 0 ? angle : -angle;
    panel.castShadow = true;
    panel.receiveShadow = true;
    parent.add(panel);

    for (const end of [-1, 1]) {
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(slope + .5, .24, .22), MATERIALS.trim);
      fascia.position.set(side * half / 2, wallHeight + rise / 2, end * (depth / 2 + .72));
      fascia.rotation.z = side < 0 ? angle : -angle;
      parent.add(fascia);
    }

    if (metal) {
      for (let i = 0; i < 13; i++) {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(slope, .045, .045), MATERIALS.metal);
        seam.position.set(side * half / 2, wallHeight + rise / 2 + .19, -depth / 2 + i * depth / 12);
        seam.rotation.z = side < 0 ? angle : -angle;
        parent.add(seam);
      }
    }
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, depth + 1.55, 10), MATERIALS.warmTrim);
  ridge.rotation.x = Math.PI / 2;
  ridge.position.set(0, wallHeight + rise + .12, 0);
  ridge.castShadow = true;
  parent.add(ridge);

  const eaveY = wallHeight + .08;
  for (const side of [-1, 1]) {
    addBox(parent, .24, .3, depth + 1.55, MATERIALS.trim, side * (width / 2 + .55), eaveY, 0);
  }
}

function addPorch(parent, width, depth, wallHeight, isLarge = false) {
  const front = depth / 2;
  const porchWidth = isLarge ? 9.2 : 7.8;
  const porchDepth = isLarge ? 4.2 : 3.6;
  const porchZ = front + porchDepth / 2 - .15;
  addBox(parent, porchWidth, .42, porchDepth, MATERIALS.porchWood, 0, .65, porchZ, true);
  addBox(parent, porchWidth + .45, .24, .22, MATERIALS.trim, 0, .83, front + porchDepth - .2);
  for (const x of [-porchWidth / 2 + .25, porchWidth / 2 - .25]) {
    for (const z of [front + .35, front + porchDepth - .25]) {
      addBox(parent, .34, wallHeight - 1.15, .34, MATERIALS.trim, x, (wallHeight - 1.15) / 2 + .8, z, true);
      addBox(parent, .52, .18, .52, MATERIALS.warmTrim, x, .98, z);
      addBox(parent, .5, .18, .5, MATERIALS.warmTrim, x, wallHeight - .45, z);
    }
  }
  addBox(parent, porchWidth + .75, .28, porchDepth + .55, MATERIALS.trim, 0, wallHeight - .1, porchZ, true);
  addBox(parent, porchWidth + .4, .1, porchDepth + .25, MATERIALS.metalRoof, 0, wallHeight + .08, porchZ);
  for (const x of [-porchWidth / 2 + .35, porchWidth / 2 - .35]) {
    addBox(parent, .12, .92, .12, MATERIALS.trim, x, 1.24, front + porchDepth - .2);
    addBox(parent, .12, .92, .12, MATERIALS.trim, x, 1.24, front + .45);
    addBox(parent, .14, .13, porchDepth - .1, MATERIALS.trim, x, 1.67, porchZ);
  }
  for (let i = -3; i <= 3; i++) {
    if (Math.abs(i) < 1) continue;
    addBox(parent, .1, .63, .1, MATERIALS.trim, i * .52, 1.08, front + porchDepth - .2);
  }
  addBox(parent, 2.4, .22, .55, MATERIALS.concrete, 0, .28, front + porchDepth + .35);
  addBox(parent, 2.15, .2, .48, MATERIALS.concrete, 0, .12, front + porchDepth + .8);
}

function addWallDetails(parent, width, depth, wallHeight, twoStorey, wallMaterial) {
  const levels = twoStorey ? [2.75, 6.25] : [3.05];
  const frontZ = depth / 2 + .12;
  for (const y of levels) {
    const x = twoStorey ? 5.25 : 4.7;
    addWindow(parent, -x, y, frontZ, 1.72, 2.02);
    addWindow(parent, x, y, frontZ, 1.72, 2.02);
    addWindow(parent, -x, y, -frontZ, 1.55, 1.8, Math.PI);
    addWindow(parent, x, y, -frontZ, 1.55, 1.8, Math.PI);
    addWindow(parent, width / 2 + .12, y, -2.7, 1.7, 1.9, Math.PI / 2);
    addWindow(parent, width / 2 + .12, y, 2.7, 1.7, 1.9, Math.PI / 2);
    addWindow(parent, -width / 2 - .12, y, -2.7, 1.7, 1.9, -Math.PI / 2);
    addWindow(parent, -width / 2 - .12, y, 2.7, 1.7, 1.9, -Math.PI / 2);
  }

  for (const x of [-width / 2 + .18, width / 2 - .18]) {
    addBox(parent, .23, wallHeight, .24, MATERIALS.trim, x, wallHeight / 2 + .45, frontZ - .18, false);
    addBox(parent, .23, wallHeight, .24, MATERIALS.trim, x, wallHeight / 2 + .45, -frontZ + .18, false);
  }
  addDoor(parent, frontZ + .03);

  // Small attic vent, address plaque and warm wall sconces.
  const ventY = wallHeight + (twoStorey ? 2.4 : 1.8);
  addBox(parent, 1.05, .13, .12, MATERIALS.darkWood, 0, ventY, frontZ + .08);
  for (let i = -3; i <= 3; i++) addBox(parent, .055, .55, .11, MATERIALS.trim, i * .13, ventY, frontZ + .15);
  addBox(parent, .48, .27, .07, MATERIALS.darkWood, 1.5, 2.15, frontZ + .16);
  addBox(parent, .32, .13, .08, MATERIALS.trim, 1.5, 2.15, frontZ + .21);
  for (const x of [-1.45, 1.45]) {
    addBox(parent, .16, .38, .16, MATERIALS.metal, x, 2.75, frontZ + .18);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), MATERIALS.lamp);
    bulb.position.set(x, 2.62, frontZ + .2);
    parent.add(bulb);
  }
}

function addYard(parent, width, depth, front, style) {
  const bushGeometry = new THREE.SphereGeometry(1, 12, 9);
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? -1 : 1;
    const bush = new THREE.Mesh(bushGeometry, i % 3 ? MATERIALS.foliage : MATERIALS.foliageLight);
    bush.position.set(side * (width / 2 + .5 + (i % 3) * .35), .85 + (i % 2) * .16, front + 1.9 + Math.floor(i / 2) * 1.05);
    bush.scale.set(1.1 + (i % 3) * .22, .65 + (i % 2) * .12, .68);
    bush.castShadow = false;
    parent.add(bush);
  }

  // A compact mailbox and a pair of low timber fence runs.
  addBox(parent, .18, 1.25, .18, MATERIALS.darkWood, width / 2 + 3.8, .65, front + 6.3);
  addBox(parent, .82, .5, .45, MATERIALS.warmTrim, width / 2 + 3.8, 1.35, front + 6.3);
  for (const side of [-1, 1]) {
    const fenceX = side * (width / 2 + 4.8);
    for (let i = 0; i < 5; i++) {
      const z = front + 3.4 + i * 2.05;
      addBox(parent, .13, 1.0, .13, MATERIALS.darkWood, fenceX, .57, z);
      addBox(parent, .14, .12, 2.05, MATERIALS.porchWood, fenceX, .78, z + .95);
      addBox(parent, .14, .12, 2.05, MATERIALS.porchWood, fenceX, .4, z + .95);
    }
  }

  // Drain pipes and a discreet outdoor AC condenser.
  for (const x of [-width / 2 - .18, width / 2 + .18]) {
    addBox(parent, .09, 3.8, .09, MATERIALS.metal, x, 2.1, -depth / 2 + .45);
    addBox(parent, 1.15, .85, .48, MATERIALS.trim, x, 1.15, -depth / 2 + 1.5);
    addBox(parent, .76, .06, .72, MATERIALS.metal, x, 1.6, -depth / 2 + 1.5);
  }
}

function addDriveway(parent, worldX, worldZ, baseY, depth, width) {
  const start = depth / 2 + 4.8;
  const end = start + 20;
  const verts = [
    -width / 2, terrainHeight(worldX - width / 2, worldZ + start) - baseY + .035, start,
     width / 2, terrainHeight(worldX + width / 2, worldZ + start) - baseY + .035, start,
     width * .68, terrainHeight(worldX + width * .68, worldZ + end) - baseY + .035, end,
    -width * .68, terrainHeight(worldX - width * .68, worldZ + end) - baseY + .035, end
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const driveway = new THREE.Mesh(geometry, MATERIALS.gravel);
  driveway.receiveShadow = true;
  parent.add(driveway);
  for (const side of [-1, 1]) {
    addBox(parent, .16, .08, end - start, MATERIALS.concrete, side * width * .58, .055, (start + end) / 2, false);
  }
}

function buildHouse(scene, config) {
  const {
    x, z, width, depth, wallHeight, roofRise, wall, roof, twoStorey = false,
    porchLarge = false, rotation = 0, name = 'Leonida residence'
  } = config;
  const group = new THREE.Group();
  group.name = name;
  const baseY = terrainHeight(x, z);
  group.position.set(x, baseY, z);
  group.rotation.y = rotation;

  addBox(group, width + .8, .62, depth + .8, MATERIALS.concrete, 0, .32, 0, true);
  addBox(group, width, wallHeight, depth, wall, 0, wallHeight / 2 + .62, 0, true);
  addGable(group, width + .2, roofRise, wallHeight + .62, depth / 2, wall);
  addGable(group, width + .2, roofRise, wallHeight + .62, -depth / 2 - .22, wall, true);
  addRoof(group, width, depth, wallHeight + .62, roofRise, roof, roof === MATERIALS.metalRoof);
  addWallDetails(group, width, depth, wallHeight, twoStorey, wall);
  addPorch(group, width, depth, wallHeight + .62, porchLarge);
  addYard(group, width, depth, depth / 2, name);
  addDriveway(group, x, z, baseY, depth, 5.1);

  // Roof chimney with cap, rain gutters and small service details.
  const chimneyX = width * .29;
  addBox(group, 1.05, 3.6, 1.05, MATERIALS.brick, chimneyX, wallHeight + roofRise - .5, -depth * .2, true);
  addBox(group, 1.3, .22, 1.3, MATERIALS.concrete, chimneyX, wallHeight + roofRise + 1.35, -depth * .2);
  for (const side of [-1, 1]) {
    addBox(group, .12, .12, depth + 1.6, MATERIALS.metal, side * (width / 2 + .7), wallHeight + .3, 0);
    addBox(group, .12, .12, depth + 1.6, MATERIALS.trim, side * (width / 2 + .7), wallHeight + .17, 0);
  }

  group.traverse((object) => {
    if (!object.isMesh) return;
    object.receiveShadow = true;
    if (object.geometry && object.geometry.type !== 'SphereGeometry') object.castShadow = object.castShadow || false;
  });
  scene.add(group);
  return group;
}

export class HouseManager {
  constructor(scene) {
    this.scene = scene;
    this.houses = [];
  }

  init() {
    if (this.houses.length) return;
    this.houses.push(
      buildHouse(this.scene, {
        name: 'Palm View — coastal stucco residence',
        x: 30, z: 43, width: 15.2, depth: 12.4, wallHeight: 5.7, roofRise: 3.15,
        wall: MATERIALS.stucco, roof: MATERIALS.tileRoof, porchLarge: true, rotation: -.035
      }),
      buildHouse(this.scene, {
        name: 'Pine Ridge — two-storey country house',
        x: 69, z: 27, width: 16.6, depth: 13.2, wallHeight: 8.1, roofRise: 3.85,
        wall: MATERIALS.siding, roof: MATERIALS.metalRoof, twoStorey: true, porchLarge: true, rotation: .045
      })
    );
  }

  update(cameraPosition) {
    for (const house of this.houses) {
      const dx = house.position.x - cameraPosition.x;
      const dz = house.position.z - cameraPosition.z;
      house.visible = dx * dx + dz * dz < 1700 * 1700;
    }
  }

  dispose() {
    for (const house of this.houses) {
      this.scene.remove(house);
      house.traverse((object) => object.geometry?.dispose());
    }
    this.houses.length = 0;
  }
}
