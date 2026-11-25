import * as THREE from 'three';
import { createRibbon } from './road_markings.js';

export function addSecondaryRoad(scene, asphaltBase) {
  const group = new THREE.Group();
  group.name = 'secondary-asphalt-road';
  const asphalt = asphaltBase.clone();
  asphalt.color.set(0xe6e8e6);
  const shoulder = new THREE.MeshStandardMaterial({ color: 0x817b66, roughness: 1 });
  const points = [[-710,-455],[-570,-200],[-430,15],[-260,195],[30,420],[310,520],[660,610]];
  group.add(createRibbon(points, 12, shoulder, 0.11, 160).mesh);
  group.add(createRibbon(points, 8.2, asphalt, 0.2, 160).mesh);
  group.userData.road = { points, width: 12 };
  scene.add(group);
  return group;
}