import * as THREE from 'three';
import { createDetailedHand } from './hand_mesh.js';

export class FirstPersonHands {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'First person arms and hands';
    this.camera.add(this.root);
    this.fillLight = new THREE.PointLight(0xffd6b7, .62, 2.4, 2);
    this.fillLight.position.set(0, .35, -.45);
    this.camera.add(this.fillLight);
    this.left = createDetailedHand(-1);
    this.right = createDetailedHand(1);
    this.left.position.set(-.245, -.295, -.48);
    this.right.position.set(.245, -.295, -.48);
    this.left.rotation.set(-.13, .12, .1);
    this.right.rotation.set(-.13, -.12, -.1);
    this.left.scale.setScalar(1.42);
    this.right.scale.setScalar(1.42);
    this.root.add(this.left, this.right);
    this.clock = 0;
    this.movement = 0;
  }

  update(dt, movement = 0, sprint = false) {
    this.clock += dt;
    this.movement = THREE.MathUtils.damp(this.movement, movement, 9, dt);
    const amount = this.movement;
    const rate = sprint ? 12 : 8;
    const phase = this.clock * rate;
    const bob = Math.sin(phase * 2) * .008 * amount;
    const swing = Math.sin(phase) * .025 * amount;
    this.left.position.y = -.295 + bob + swing;
    this.right.position.y = -.295 + bob - swing;
    this.left.rotation.x = -.13 + Math.sin(phase) * .12 * amount;
    this.right.rotation.x = -.13 - Math.sin(phase) * .12 * amount;
    this.left.rotation.z = .1 + Math.sin(phase) * .035 * amount;
    this.right.rotation.z = -.1 - Math.sin(phase) * .035 * amount;
  }

  dispose() {
    this.camera.remove(this.root);
    this.camera.remove(this.fillLight);
    this.root.traverse((obj) => {
      if (obj.isMesh) obj.geometry.dispose();
    });
  }
}
