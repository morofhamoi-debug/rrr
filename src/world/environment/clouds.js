import * as THREE from 'three';

export class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'high-altitude-cloud-formations';
    this.clouds = [];
    this.puffGeometry = new THREE.SphereGeometry(1, 20, 14);
    this.cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f0e9,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.76,
      depthWrite: false
    });

    for (let i = 0; i < 26; i++) {
      const cloud = new THREE.Group();
      const seed = i * 17.23;
      const count = 5 + (i % 5);
      for (let j = 0; j < count; j++) {
        const puff = new THREE.Mesh(this.puffGeometry, this.cloudMaterial);
        puff.position.set(j * 26 - count * 12, Math.sin(j * 1.7 + seed) * 8, Math.cos(j * 2.1) * 16);
        puff.scale.set(34 + (j % 2) * 19, 10 + (i % 3) * 5, 18 + (j % 3) * 6);
        cloud.add(puff);
      }
      cloud.position.set(Math.sin(seed) * 1450, 175 + (i % 6) * 27, Math.cos(seed * 0.7) * 1550);
      cloud.rotation.y = seed * 0.1;
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
    scene.add(this.group);
  }

  update(dt, windSpeed = 4) {
    const drift = dt * (1.15 + windSpeed * 0.22);
    for (const cloud of this.clouds) {
      cloud.position.x += drift;
      cloud.position.z += drift * 0.12;
      if (cloud.position.x > 1750) cloud.position.x = -1750;
    }
  }
}