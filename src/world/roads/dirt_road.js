import * as THREE from 'three';
import { createRibbon } from './road_markings.js';

export function addDirtRoad(scene, earthBase) {
  const group = new THREE.Group();
  group.name = 'dirt-road';
  const earth = earthBase.clone();
  earth.color.set(0xffffff);
  const track = earthBase.clone();
  track.color.set(0xa7a19a);
  const points = [[-760,-100],[-520,-40],[-320,18],[-95,70],[-20,88],[110,160],[310,305],[540,435],[760,505]];
  group.add(createRibbon(points, 7.4, earth, 0.13, 160).mesh);
  group.add(createRibbon(points, 4.8, track, 0.18, 160, -1.15).mesh);
  group.add(createRibbon(points, 4.8, track, 0.18, 160, 1.15).mesh);
  group.userData.road = { points, width: 7.4 };
  scene.add(group);
  return group;
}