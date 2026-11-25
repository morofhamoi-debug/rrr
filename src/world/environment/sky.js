import * as THREE from 'three';

function makeSunGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(255,246,218,0.95)');
  gradient.addColorStop(0.13, 'rgba(255,220,166,0.62)');
  gradient.addColorStop(0.38, 'rgba(255,184,125,0.16)');
  gradient.addColorStop(1, 'rgba(255,184,125,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(4200, 64, 40),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDay: { value: 0.72 },
          uSunDir: { value: new THREE.Vector3(0.3, 0.4, -0.8).normalize() }
        },
        vertexShader: `
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vDirection;
          uniform float uDay;
          uniform vec3 uSunDir;
          void main() {
            vec3 dir = normalize(vDirection);
            float height = max(0.0, dir.y);
            float horizonFade = pow(1.0 - height, 3.0);
            vec3 sunset = vec3(0.94, 0.55, 0.34);
            vec3 daylight = vec3(0.55, 0.76, 0.86);
            vec3 horizon = mix(sunset, daylight, smoothstep(0.08, 0.72, uDay));
            vec3 zenithNight = vec3(0.018, 0.035, 0.065);
            vec3 zenithDay = vec3(0.16, 0.37, 0.65);
            vec3 zenith = mix(zenithNight, zenithDay, uDay);
            float sunGlow = pow(max(dot(dir, normalize(uSunDir)), 0.0), 11.0);
            float sunHalo = pow(max(dot(dir, normalize(uSunDir)), 0.0), 2.0) * 0.13;
            vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.88, height));
            color += vec3(1.0, 0.62, 0.34) * (sunGlow * 0.55 + sunHalo) * (0.25 + uDay);
            color += vec3(0.12, 0.18, 0.22) * horizonFade * uDay;
            gl_FragColor = vec4(color, 1.0);
          }
        `
      })
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);

    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(22, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xffebcb, fog: false })
    );
    scene.add(this.sun);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSunGlow(),
      color: 0xffd8a8,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    this.glow.scale.set(210, 210, 1);
    scene.add(this.glow);
  }

  update(camera, time) {
    this.mesh.position.copy(camera.position);
    const angle = (time / 24) * Math.PI * 2 - Math.PI * 0.5;
    const sunDir = new THREE.Vector3(Math.cos(angle), Math.sin(angle) * 0.82 + 0.18, -0.72).normalize();
    const sunPosition = camera.position.clone().addScaledVector(sunDir, 1400);
    this.sun.position.copy(sunPosition);
    this.glow.position.copy(sunPosition);
    this.mesh.material.uniforms.uDay.value = THREE.MathUtils.clamp(Math.sin(angle) * 0.55 + 0.48, 0.08, 1);
    this.mesh.material.uniforms.uSunDir.value.copy(sunDir);
    const visible = sunDir.y > -0.12;
    this.sun.visible = visible;
    this.glow.visible = visible;
  }
}