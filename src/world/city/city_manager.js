import * as THREE from 'three';
import { terrainHeight } from '../terrain/terrain_manager.js';

const facadeMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xb9b8ad, roughness: .92 }),
  new THREE.MeshStandardMaterial({ color: 0xc3b7a4, roughness: .94 }),
  new THREE.MeshStandardMaterial({ color: 0x9ca9aa, roughness: .9 }),
  new THREE.MeshStandardMaterial({ color: 0xb58d79, roughness: .92 }),
  new THREE.MeshStandardMaterial({ color: 0xaaa49a, roughness: .94 })
];
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x343b3c, roughness: .82 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x344c55, roughness: .22, metalness: .18, emissive: 0x101f25, emissiveIntensity: .28 });
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xd7d3c8, roughness: .8 });
const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x394b4b, roughness: .72 });
const asphaltMaterial = new THREE.MeshStandardMaterial({ color: 0x303536, roughness: .96 });
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xd6c9a5 });
const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffd69a, emissive: 0xffbd70, emissiveIntensity: 1.5 });
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x42614a, roughness: 1 });
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x69513b, roughness: 1 });

function addBox(parent, size, position, material, castShadow = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoad(group, axis, coordinate, start, end, width = 8) {
  const length = end - start;
  const x = axis === 'x' ? (start + end) / 2 : coordinate;
  const z = axis === 'x' ? coordinate : (start + end) / 2;
  const y = terrainHeight(x, z) + .075;
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(axis === 'x' ? length : width, .13, axis === 'x' ? width : length),
    asphaltMaterial
  );
  road.position.set(x, y, z);
  road.receiveShadow = true;
  group.add(road);

  const dashCount = Math.floor(length / 18);
  for (let i = 0; i < dashCount; i++) {
    const along = start + 9 + i * 18;
    const mark = new THREE.Mesh(
      new THREE.BoxGeometry(axis === 'x' ? 5.2 : .12, .025, axis === 'x' ? .12 : 5.2),
      lineMaterial
    );
    mark.position.set(axis === 'x' ? along : coordinate, y + .08, axis === 'x' ? coordinate : along);
    group.add(mark);
  }
}

function addWindows(building, width, depth, floors) {
  const positions = [];
  const columnsX = Math.max(3, Math.floor(width / 4.1));
  const columnsZ = Math.max(3, Math.floor(depth / 4.1));
  for (let floor = 0; floor < floors; floor++) {
    const y = 2.05 + floor * 3.05;
    for (let col = 0; col < columnsX; col++) {
      const x = -width / 2 + 2.3 + col * ((width - 4.6) / Math.max(1, columnsX - 1));
      positions.push([x, y, depth / 2 + .075, 0]);
      positions.push([x, y, -depth / 2 - .075, Math.PI]);
    }
    for (let col = 0; col < columnsZ; col++) {
      const z = -depth / 2 + 2.3 + col * ((depth - 4.6) / Math.max(1, columnsZ - 1));
      positions.push([width / 2 + .075, y, z, Math.PI / 2]);
      positions.push([-width / 2 - .075, y, z, -Math.PI / 2]);
    }
  }

  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 1.42, .11), glassMaterial, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach(([x, y, z, angle], index) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, angle, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  building.add(mesh);
}

function addSign(building, text, width, depth) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 120;
  const context = canvas.getContext('2d');
  context.fillStyle = '#182326';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#e5c28e';
  context.font = 'bold 48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 256, 61, 470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(width - 2, 13), 1.25),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  sign.position.set(0, 2.55, depth / 2 + .15);
  building.add(sign);
}

function buildBuilding(scene, spec, index) {
  const { x, z, width, depth, floors, sign } = spec;
  const height = floors * 3.05 + .8;
  const group = new THREE.Group();
  group.name = 'EZID Russian city building ' + (index + 1);
  group.position.set(x, terrainHeight(x, z), z);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    facadeMaterials[index % facadeMaterials.length]
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  addBox(group, [width + .55, .28, depth + .55], [0, height + .12, 0], roofMaterial, true);
  addBox(group, [width + .8, .34, .42], [0, height + .35, depth / 2 - .1], trimMaterial);
  addBox(group, [.42, .34, depth + .5], [width / 2 - .1, height + .35, 0], trimMaterial);
  addWindows(group, width, depth, floors);

  addBox(group, [1.65, 2.45, .16], [0, 1.27, depth / 2 + .09], doorMaterial);
  addBox(group, [2.05, .18, .24], [0, 2.63, depth / 2 + .11], trimMaterial);
  if (sign) addSign(group, sign, width, depth);

  scene.add(group);
  return { group, x, z, halfWidth: width / 2, halfDepth: depth / 2 };
}

function buildCar(scene, x, z, color, angle = 0) {
  const group = new THREE.Group();
  group.name = 'Parked city car';
  group.position.set(x, terrainHeight(x, z) + .12, z);
  group.rotation.y = angle;

  const bodyMaterial = new THREE.MeshStandardMaterial({ color, metalness: .42, roughness: .38 });
  const window = new THREE.MeshStandardMaterial({ color: 0x26373e, metalness: .2, roughness: .18 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x171a1b, roughness: .95 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x9ba2a2, metalness: .8, roughness: .28 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xffe6b2, emissive: 0xffd68a, emissiveIntensity: .6 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x9c302a, emissive: 0x5b100d, emissiveIntensity: .5 });

  addBox(group, [2.05, .68, 4.35], [0, .78, 0], bodyMaterial, true);
  addBox(group, [1.7, .82, 2.1], [0, 1.48, -.12], bodyMaterial, true);
  addBox(group, [1.48, .57, .08], [0, 1.48, .96], window);
  addBox(group, [1.48, .57, .08], [0, 1.48, -1.17], window);
  for (const side of [-1, 1]) {
    addBox(group, [.08, .58, 1.65], [side * .89, 1.48, -.08], window);
    for (const zWheel of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .28, 16), rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.03, .44, zWheel);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .295, 12), rim);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      group.add(hub);
    }
  }
  for (const side of [-1, 1]) {
    addBox(group, [.48, .2, .08], [side * .66, .82, -2.18], lamp);
    addBox(group, [.42, .2, .08], [side * .69, .82, 2.18], tail);
  }
  group.userData.isVehicle = true;
  group.userData.speed = 0;
  scene.add(group);
  return group;
}

function createObjectiveMarker(x, z, color) {
  const marker = new THREE.Group();
  marker.position.set(x, terrainHeight(x, z) + .1, z);
  const beamMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .38, depthWrite: false });
  const ringMaterial = new THREE.MeshBasicMaterial({ color });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.16, .42, 3.1, 12, 1, true), beamMaterial);
  beam.position.y = 1.55;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, .085, 8, 36), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .12;
  const core = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), ringMaterial);
  core.position.y = 3.25;
  marker.add(beam, ring, core);
  marker.userData.ring = ring;
  marker.userData.core = core;
  return marker;
}

function addStreetLamp(group, x, z) {
  const lamp = new THREE.Group();
  lamp.position.set(x, terrainHeight(x, z), z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 6.2, 8), roofMaterial);
  pole.position.y = 3.1;
  lamp.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.25, .08, .08), roofMaterial);
  arm.position.set(.56, 6.08, 0);
  lamp.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 10), lampMaterial);
  bulb.position.set(1.05, 5.95, 0);
  lamp.add(bulb);
  group.add(lamp);
}

function addTree(group, x, z) {
  const tree = new THREE.Group();
  tree.position.set(x, terrainHeight(x, z), z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, 2.8, 8), trunkMaterial);
  trunk.position.y = 1.4;
  tree.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), treeMaterial);
  crown.position.y = 3.25;
  crown.scale.set(1, 1.15, 1);
  crown.castShadow = true;
  tree.add(crown);
  group.add(tree);
}

export class CityManager {
  constructor(scene, roads, houses) {
    this.scene = scene;
    this.roads = roads;
    this.houses = houses;
    this.root = new THREE.Group();
    this.root.name = 'EZID RUSSIA — starter city';
    this.buildings = [];
    this.colliders = [];
    this.vehicles = [];
    this.jobStage = 'start';
    this.jobStart = { x: 125, z: 52 };
    this.deliveryPoint = { x: 190, z: -43 };
    this.startMarker = null;
    this.deliveryMarker = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.scene.add(this.root);

    // A compact street grid connects the old suburban road to the first city district.
    for (const x of [130, 250, 370]) addRoad(this.root, 'z', x, -150, 220, 8.5);
    for (const z of [-130, 15, 175]) addRoad(this.root, 'x', z, 90, 410, 8.5);

    const lots = [
      { x: 190, z: -58, width: 23, depth: 22, floors: 4, sign: 'ПРОДУКТЫ' },
      { x: 310, z: -58, width: 25, depth: 22, floors: 5, sign: '' },
      { x: 190, z: 91, width: 22, depth: 22, floors: 3, sign: 'АПТЕКА' },
      { x: 310, z: 91, width: 25, depth: 23, floors: 4, sign: 'АВТОСЕРВИС' },
      { x: 190, z: 245, width: 24, depth: 22, floors: 4, sign: '' },
      { x: 310, z: 245, width: 24, depth: 22, floors: 3, sign: 'ПЕКАРНЯ' }
    ];

    lots.forEach((lot, index) => {
      const roadDistance = this.roads.distanceToRoad(lot.x, lot.z);
      const nearHouse = this.houses.houses.some((house) => Math.hypot(house.position.x - lot.x, house.position.z - lot.z) < 30);
      if (roadDistance < 14 || nearHouse) return;
      const building = buildBuilding(this.root, lot, index);
      this.buildings.push(building);
      this.colliders.push({ x: lot.x, z: lot.z, halfWidth: lot.width / 2 + .7, halfDepth: lot.depth / 2 + .7 });
    });

    // Street furniture and parked vehicles make the first district readable at a glance.
    for (const x of [130, 250, 370]) {
      for (const z of [-130, 15, 175]) addStreetLamp(this.root, x + 5.5, z + 5.5);
    }
    for (const [x, z] of [[148, -4], [270, 7], [350, 28]]) addTree(this.root, x, z);
    this.vehicles.push(
      { group: buildCar(this.root, 145, 24, 0x52636a, Math.PI / 2), name: 'Седан', speed: 0 },
      { group: buildCar(this.root, 265, 8, 0x8c3830, Math.PI / 2), name: 'Купе', speed: 0 },
      { group: buildCar(this.root, 350, 24, 0xb9b9b1, Math.PI / 2), name: 'Универсал', speed: 0 }
    );

    this.startMarker = createObjectiveMarker(this.jobStart.x, this.jobStart.z, 0xffb36b);
    this.deliveryMarker = createObjectiveMarker(this.deliveryPoint.x, this.deliveryPoint.z, 0x79d9a1);
    this.root.add(this.startMarker, this.deliveryMarker);
    this.setJobStage('start');
  }

  findNearestVehicle(position, maxDistance = 10) {
    let nearest = null;
    let bestDistance = maxDistance;
    for (const vehicle of this.vehicles) {
      const distance = Math.hypot(position.x - vehicle.group.position.x, position.z - vehicle.group.position.z);
      if (distance < bestDistance) { bestDistance = distance; nearest = vehicle; }
    }
    return nearest ? { ...nearest, distance: bestDistance, source: nearest } : null;
  }

  getJobAction(position) {
    const target = this.jobStage === 'delivery' ? this.deliveryPoint : this.jobStart;
    const distance = Math.hypot(position.x - target.x, position.z - target.z);
    if (distance > 6.5) return null;
    return this.jobStage === 'delivery' ? 'deliver' : 'start';
  }

  setJobStage(stage) {
    this.jobStage = stage === 'delivery' ? 'delivery' : 'start';
    if (this.startMarker) this.startMarker.visible = this.jobStage === 'start';
    if (this.deliveryMarker) this.deliveryMarker.visible = this.jobStage === 'delivery';
  }

  resolvePosition(previous, candidate, radius = .32) {
    for (const obstacle of this.colliders) {
      const oldInside = Math.abs(previous.x - obstacle.x) < obstacle.halfWidth + radius
        && Math.abs(previous.z - obstacle.z) < obstacle.halfDepth + radius;
      const nextInside = Math.abs(candidate.x - obstacle.x) < obstacle.halfWidth + radius
        && Math.abs(candidate.z - obstacle.z) < obstacle.halfDepth + radius;
      if (!oldInside && nextInside) return previous.clone();
    }
    return candidate;
  }

  update(dt = 0) {
    for (const marker of [this.startMarker, this.deliveryMarker]) {
      if (!marker?.visible) continue;
      marker.userData.ring.rotation.z += dt * .7;
      marker.userData.core.position.y = 3.25 + Math.sin(performance.now() * .002) * .16;
    }
  }

  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
    });
    this.buildings.length = 0;
    this.colliders.length = 0;
    this.vehicles.length = 0;
    this.startMarker = null;
    this.deliveryMarker = null;
    this.initialized = false;
  }
}
