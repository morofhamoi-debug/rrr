import * as THREE from 'three';
import { createRibbon, createRoadMarkings } from './road_markings.js';

export function addNarrowRoad(scene, asphaltBase) {
  const group = new THREE.Group();
  group.name = 'narrow-asphalt-road';
  const asphalt = asphaltBase.clone();
  asphalt.color.set(0xd8dad6);
  const points = [[720,520],[590,270],[470,-55],[560,-310],[740,-500]];
  group.add(createRibbon(points, 7.2, new THREE.MeshStandardMaterial({ color: 0x777461, roughness: 1 }), 0.12, 140).mesh);
  group.add(createRibbon(points, 5.6, asphalt, 0.2, 140).mesh);
  createRoadMarkings(group, points, 5.6, false);
  group.userData.road = { points, width: 7.2 };
  scene.add(group);
  return group;
}