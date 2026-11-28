import * as THREE from 'three';
import { TerrainManager } from './terrain/terrain_manager.js';
import { RoadManager } from './roads/road_manager.js';
import { GrassManager } from './vegetation/grass_manager.js';
import { Sky } from './environment/sky.js';
import { Clouds } from './environment/clouds.js';
import { Lighting } from './environment/lighting.js';
import { Weather } from './environment/weather.js';
import { HouseManager } from './buildings/house_manager.js';
import { CityManager } from './city/city_manager.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.terrain = new TerrainManager(scene);
    this.roads = new RoadManager(scene);
    this.grass = new GrassManager(scene, this.roads);
    this.sky = new Sky(scene);
    this.clouds = new Clouds(scene);
    this.lighting = new Lighting(scene);
    this.weather = new Weather();
    this.houses = new HouseManager(scene);
    this.city = new CityManager(scene, this.roads, this.houses);
    this.settings = {};
    this.windSpeed = this.weather.windSpeed;
  }

  init(settings) {
    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x91a59d, 0.00022);
    this.roads.init();
    this.houses.init();
    this.city.init();
    this.applySettings(settings);
    this.terrain.update({ x: 22, z: 78 });
    this.grass.update({ x: 22, z: 78 }, 0, this.weather);
  }

  heightAt(x, z) { return this.terrain.heightAt(x, z); }
  groundHeightAt(x, z) { return this.houses.groundHeightAt(x, z); }

  resolvePosition(previous, candidate, radius) {
    const houseSafe = this.houses.resolvePosition(previous, candidate, radius);
    return this.city.resolvePosition(previous, houseSafe, radius);
  }

  applySettings(settings) {
    this.settings = settings;
    this.terrain.setSettings(settings);
    this.grass.setSettings(settings);
    this.lighting.setQuality(settings);
  }

  update(dt, camera) {
    this.weather.update(dt);
    this.houses.update(camera.position);
    this.city.update(dt, camera.position);
    this.windSpeed = this.weather.windSpeed;
    this.terrain.update(camera.position);
    this.grass.update(camera.position, dt, this.weather);
    this.clouds.update(dt, this.weather.windSpeed);
    this.sky.update(camera, this.weather.time);
    this.lighting.update(this.weather.time, camera.position);
  }

  advanceTime(hours) { this.weather.advance(hours); }
  getTime() { return this.weather.time; }
}
