import * as THREE from 'three';

function makeSkinMaps() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');
  ctx.fillStyle = '#c58e70';
  ctx.fillRect(0, 0, size, size);
  let seed = 731;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 22000; i++) {
    const x = random() * size, y = random() * size, r = .25 + random() * 1.1;
    ctx.fillStyle = random() > .48 ? 'rgba(255,218,188,.10)' : 'rgba(79,42,31,.075)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 95; i++) {
    const x = random() * size, y = random() * size;
    ctx.strokeStyle = random() > .5 ? 'rgba(255,218,190,.12)' : 'rgba(91,48,36,.10)';
    ctx.lineWidth = .5 + random();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + random() * 12, y + random() * 5, x + random() * 24, y + random() * 8); ctx.stroke();
  }
  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8; map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');
  bctx.fillStyle = '#888'; bctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 26000; i++) {
    const x = random() * size, y = random() * size, v = Math.floor(95 + random() * 70);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.fillRect(x, y, .7 + random() * 1.3, .7 + random() * 1.3);
  }
  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.anisotropy = 8;
  return { map, bump };
}
const skinMaps = makeSkinMaps();
const SKIN = new THREE.MeshStandardMaterial({ color: 0xffffff, map: skinMaps.map, bumpMap: skinMaps.bump, bumpScale: .006, roughness: .76, metalness: 0 });
const SKIN_LIGHT = new THREE.MeshStandardMaterial({ color: 0xffffff, map: skinMaps.map, bumpMap: skinMaps.bump, bumpScale: .004, roughness: .72 });
const SKIN_SHADOW = new THREE.MeshStandardMaterial({ color: 0x98664f, roughness: .86 });
const NAIL = new THREE.MeshStandardMaterial({ color: 0xd9b8a7, roughness: .5 });
const CUFF = new THREE.MeshStandardMaterial({ color: 0x303b31, roughness: .9 });

function ellipsoid(parent, material, position, scale, segments = 18) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(10, segments - 4)), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function capsuleBetween(parent, a, b, radius, material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.max(.001, delta.length() - radius * 2), 4, 10), material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildFinger(parent, x, length, spread, index) {
  const rootZ = -.078 - Math.abs(index - 2) * .008;
  const width = index === 2 ? .012 : .0105;
  const points = [
    [x, .004, rootZ],
    [x + spread * .33, .006, rootZ - length * .34],
    [x + spread * .72, .004, rootZ - length * .68],
    [x + spread, -.003, rootZ - length]
  ];
  const radii = [width, width * .91, width * .78];
  for (let i = 0; i < 3; i++) {
    capsuleBetween(parent, points[i], points[i + 1], radii[i], i === 2 ? SKIN_LIGHT : SKIN);
    ellipsoid(parent, SKIN_LIGHT, points[i + 1], [width * .92, width * .88, width * .92], 12);
  }
  // A small, curved nail plate sits on the back of each fingertip.
  const tip = points[3];
  const nail = ellipsoid(parent, NAIL, [tip[0], tip[1] + width * .62, tip[2] - .002], [width * .64, .0028, .012], 12);
  nail.rotation.x = -.12;
}

export function createDetailedHand(side = 1) {
  const hand = new THREE.Group();
  hand.name = side < 0 ? 'Left human hand' : 'Right human hand';
  const mirror = side < 0 ? -1 : 1;

  // Forearm: tapered anatomical volume with a wrist transition.
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .31, 7, 18), SKIN);
  forearm.position.set(0, -.005, .245);
  forearm.rotation.x = Math.PI / 2;
  forearm.scale.set(.9, 1.06, .78);
  hand.add(forearm);
  ellipsoid(hand, SKIN_SHADOW, [0, -.003, .105], [.048, .043, .052], 18);
  ellipsoid(hand, SKIN_LIGHT, [0, .002, -.006], [.069, .035, .085], 22);

  // Palm has a broad metacarpal base and a subtly tapered heel.
  ellipsoid(hand, SKIN, [0, -.002, -.048], [.075, .033, .072], 22);
  ellipsoid(hand, SKIN_LIGHT, [0, .013, -.054], [.057, .012, .045], 18);

  const fingerLengths = [.105, .132, .145, .124];
  const fingerXs = [-.047, -.017, .016, .046];
  for (let i = 0; i < 4; i++) {
    buildFinger(hand, fingerXs[i], fingerLengths[i], (i - 1.5) * .009, i);
  }

  // Thumb: two articulated phalanges angled away from the palm.
  const thumbA = [-mirror * .062, 0, -.024];
  const thumbB = [-mirror * .092, -.001, -.073];
  const thumbC = [-mirror * .105, -.004, -.125];
  capsuleBetween(hand, thumbA, thumbB, .014, SKIN);
  ellipsoid(hand, SKIN_LIGHT, thumbB, [.014, .014, .014], 12);
  capsuleBetween(hand, thumbB, thumbC, .0115, SKIN_LIGHT);
  ellipsoid(hand, SKIN_LIGHT, thumbC, [.011, .011, .014], 12);
  const thumbNail = ellipsoid(hand, NAIL, [thumbC[0], .007, thumbC[2] - .002], [.007, .0025, .012], 12);
  thumbNail.rotation.z = mirror * .22;

  // Knuckle creases, subtle tendon ridges and palm folds add readable anatomy.
  for (let i = 0; i < 4; i++) {
    const x = fingerXs[i];
    ellipsoid(hand, SKIN_SHADOW, [x, -.002, -.082], [.009, .004, .009], 10);
    ellipsoid(hand, SKIN_LIGHT, [x, .018, -.025], [.009, .004, .018], 10);
  }
  for (let i = 0; i < 3; i++) {
    const crease = new THREE.Mesh(new THREE.TorusGeometry(.017 + i * .003, .0018, 5, 14, Math.PI), SKIN_SHADOW);
    crease.position.set(0, -.030, -.065 - i * .012);
    crease.rotation.x = Math.PI / 2;
    hand.add(crease);
  }

  // A simple sleeve cuff gives a clean transition to the forearm.
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.052, .058, .055, 18), CUFF);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.set(0, -.004, .39);
  hand.add(cuff);
  const cuffSeam = new THREE.Mesh(new THREE.TorusGeometry(.054, .003, 6, 20), SKIN_SHADOW);
  cuffSeam.rotation.x = Math.PI / 2;
  cuffSeam.position.set(0, -.004, .365);
  hand.add(cuffSeam);

  hand.traverse((obj) => {
    if (obj.isMesh) {
      obj.frustumCulled = false;
      obj.renderOrder = 20;
      obj.material.depthTest = true;
      obj.material.depthWrite = true;
    }
  });
  return hand;
}
