import * as THREE from 'three';
export function createRenderer(canvas, settings = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.antialias !== false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = settings.shadowQuality !== 'off';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(settings.resolution || 100) / 100));
  renderer.setSize(window.innerWidth, window.innerHeight, false); renderer.setClearColor(0x9db2ad, 1);
  return renderer;
}
export function resizeRenderer(renderer, camera) {
  camera.aspect = Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight);
  camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight, false);
}