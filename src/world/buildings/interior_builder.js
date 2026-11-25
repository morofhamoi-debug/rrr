import * as THREE from 'three';

const mat = {
  floor: new THREE.MeshStandardMaterial({ color: 0x9a7959, roughness: .78 }),
  plank: new THREE.MeshStandardMaterial({ color: 0xb08c68, roughness: .83 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xd9cfb8, roughness: .95 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xe2dac8, roughness: .96 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x644a35, roughness: .82 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x342a22, roughness: .78 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0x536b5c, roughness: .96 }),
  fabricLight: new THREE.MeshStandardMaterial({ color: 0x9a8064, roughness: .98 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x5b4232, roughness: .72 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x777d78, metalness: .72, roughness: .34 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xe7e0d2, roughness: .3 }),
  black: new THREE.MeshStandardMaterial({ color: 0x171b19, roughness: .25 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x839a96, roughness: .12, metalness: .22, clearcoat: .9 }),
  warm: new THREE.MeshStandardMaterial({ color: 0xffd39a, emissive: 0xffb66b, emissiveIntensity: 1.25 })
};

function box(parent, size, position, material, cast = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, position, material, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeRug(parent, x, z, w, d, y = .665) {
  box(parent, [w, .025, d], [x, y, z], mat.fabricLight);
  box(parent, [w - .28, .012, d - .28], [x, y + .019, z], mat.fabric);
  for (const side of [-1, 1]) {
    box(parent, [.045, .012, d - .2], [x + side * (w / 2 - .11), y + .025, z], mat.wood);
    box(parent, [w - .2, .012, .045], [x, y + .025, z + side * (d / 2 - .11)], mat.wood);
  }
}

function makeSofa(parent, x, z, angle = 0) {
  const sofa = new THREE.Group();
  sofa.position.set(x, .66, z);
  sofa.rotation.y = angle;
  box(sofa, [3.25, .34, 1.05], [0, .28, 0], mat.fabric, true);
  box(sofa, [3.25, .78, .28], [0, .78, -.39], mat.fabric, true);
  for (const side of [-1, 1]) {
    box(sofa, [.3, .58, 1.05], [side * 1.48, .53, 0], mat.fabric, true);
    box(sofa, [1.02, .16, .88], [side * .74, .54, .02], mat.fabricLight);
  }
  for (const x2 of [-1.25, 1.25]) for (const z2 of [-.32, .32]) cylinder(sofa, .055, .07, .25, [x2, .12, z2], mat.darkWood, 10);
  parent.add(sofa);
}

function makeKitchen(parent, width, depth) {
  const z = -depth / 2 + 1.15;
  box(parent, [width - 1.2, .16, 1.15], [0, 2.38, z], mat.wood, true);
  box(parent, [width - 1.2, 1.55, 1.0], [0, 1.55, z], mat.fabricLight, true);
  for (let x = -width / 2 + 1.2; x < width / 2 - 1; x += 1.5) {
    box(parent, [1.32, 1.28, .045], [x, 1.58, z + .52], mat.wood);
    box(parent, [1.2, .055, .04], [x, 1.7, z + .55], mat.darkWood);
    cylinder(parent, .025, .025, .07, [x + .5, 1.7, z + .6], mat.metal);
  }
  // Refrigerator with handle and upper freezer door.
  const fridgeX = width / 2 - 1.0;
  box(parent, [.95, 2.2, .9], [fridgeX, 1.75, z + 1.15], mat.ceramic, true);
  box(parent, [.82, .68, .035], [fridgeX, 2.48, z + 1.62], mat.wall);
  box(parent, [.035, .42, .055], [fridgeX + .34, 2.0, z + 1.66], mat.metal);
  box(parent, [.035, .34, .055], [fridgeX + .34, 2.65, z + 1.66], mat.metal);
  // Sink, tap and hob.
  box(parent, [1.15, .035, .58], [-2.3, 2.48, z + .1], mat.metal);
  box(parent, [.075, .32, .075], [-2.3, 2.68, z + .1], mat.metal);
  cylinder(parent, .035, .035, .36, [-2.3, 2.83, z + .27], mat.metal);
  for (const x of [-.55, .05, .65]) cylinder(parent, .11, .11, .045, [x, 2.49, z + .1], mat.black);
}

function makeLivingRoom(parent, width, depth) {
  makeRug(parent, 0, .2, 6.3, 4.2);
  makeSofa(parent, 0, depth / 2 - 1.5, Math.PI);
  box(parent, [2.1, .22, 1.15], [0, .98, .1], mat.wood, true);
  for (const x of [-.88, .88]) for (const z of [-.4, .4]) cylinder(parent, .045, .055, .52, [x, .76, z + .1], mat.darkWood, 10);
  // Television, low console, speakers and a framed landscape.
  box(parent, [4.5, .55, .55], [0, .96, -depth / 2 + 1.2], mat.darkWood, true);
  box(parent, [3.65, 1.95, .13], [0, 2.2, -depth / 2 + .88], mat.black, true);
  box(parent, [3.48, 1.77, .035], [0, 2.2, -depth / 2 + .79], mat.glass);
  for (const x of [-2.25, 2.25]) box(parent, [.22, .7, .3], [x, 1.2, -depth / 2 + 1.1], mat.black);
  // Standing lamp with shade.
  cylinder(parent, .035, .035, 2.0, [width / 2 - 1.0, 1.68, depth / 2 - 1.1], mat.metal);
  cylinder(parent, .32, .16, .42, [width / 2 - 1.0, 2.75, depth / 2 - 1.1], mat.fabricLight);
}

function makeDetails(parent, width, depth, twoStorey) {
  // Baseboards, sockets and ceiling lights.
  for (const x of [-width / 2 + .2, width / 2 - .2]) {
    box(parent, [.1, .18, depth - .4], [x, .76, 0], mat.wood);
  }
  box(parent, [width - .4, .18, .1], [0, .76, -depth / 2 + .2], mat.wood);
  box(parent, [width - .4, .18, .1], [0, .76, depth / 2 - .2], mat.wood);
  const ceilingY = twoStorey ? 8.7 : 6.3;
  box(parent, [1.0, .06, 1.0], [0, ceilingY - .18, 0], mat.warm);
  cylinder(parent, .025, .025, .3, [0, ceilingY - .4, 0], mat.metal);
  const light = new THREE.PointLight(0xffd6a4, 18, 17, 2);
  light.position.set(0, ceilingY - .65, 0);
  parent.add(light);
  const light2 = new THREE.PointLight(0xffd6a4, 9, 11, 2);
  light2.position.set(-width / 3, ceilingY - .6, depth / 3);
  parent.add(light2);
}

export function addHouseInterior(parent, width, depth, wallHeight, twoStorey = false) {
  // Floor finish sits just above the concrete foundation slab.
  box(parent, [width - .18, .035, depth - .18], [0, .65, 0], mat.floor);
  for (let z = -depth / 2 + .5; z < depth / 2; z += 1.15) {
    box(parent, [width - .35, .012, .018], [0, .672, z], mat.plank);
  }
  makeKitchen(parent, width, depth);
  makeLivingRoom(parent, width, depth);
  makeDetails(parent, width, depth, twoStorey);

  if (twoStorey) {
    // Compact staircase and upstairs landing for the second floor.
    for (let i = 0; i < 12; i++) {
      const step = box(parent, [1.35, .18, .48], [-width / 2 + 1.1 + i * .36, .78 + i * .25, depth / 2 - 1.0 - i * .42], mat.wood, true);
      step.rotation.z = -.12;
    }
    box(parent, [width - 2, .18, depth - 2], [0, 3.65, -depth / 2 + 1.3], mat.floor, true);
    box(parent, [3.2, .85, .25], [0, 4.2, -depth / 2 + 1.3], mat.fabric, true);
    box(parent, [2.2, .16, 1.1], [0, 4.2, -depth / 2 + 2.3], mat.wood, true);
    for (const x of [-1.4, 1.4]) box(parent, [.08, .95, .08], [x, 4.35, -depth / 2 + 2.3], mat.metal);
  }
}
