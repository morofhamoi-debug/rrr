import { addMainRoad } from './road_01.js';
import { addSecondaryRoad } from './road_02.js';
import { addNarrowRoad } from './road_03.js';
import { addDirtRoad } from './dirt_road.js';
import { createSurfaceMaterial } from '../materials/surface_materials.js';

export class RoadManager {
  constructor(scene) {
    this.scene = scene;
    this.roads = [];
    this.asphalt = null;
    this.earth = null;
  }

  init() {
    this.asphalt = createSurfaceMaterial('asphalt');
    this.earth = createSurfaceMaterial('earth');
    this.roads.push(
      addMainRoad(this.scene, this.asphalt),
      addSecondaryRoad(this.scene, this.asphalt),
      addNarrowRoad(this.scene, this.asphalt),
      addDirtRoad(this.scene, this.earth)
    );
  }

  distanceToRoad(x, z) {
    let nearest = Infinity;
    for (const road of this.roads) {
      const { points, width } = road.userData.road;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const dx = b[0] - a[0], dz = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
        const px = a[0] + dx * t, pz = a[1] + dz * t;
        nearest = Math.min(nearest, Math.hypot(x - px, z - pz) - width * 0.5);
      }
    }
    return nearest;
  }

  dispose() {
    for (const road of this.roads) {
      this.scene.remove(road);
      road.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
      });
    }
    this.roads.length = 0;
    this.asphalt?.dispose();
    this.earth?.dispose();
  }
}