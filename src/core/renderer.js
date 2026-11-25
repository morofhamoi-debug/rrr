import * as THREE from 'three';
function getPixelRatio(settings) {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  return Math.min((window.devicePixelRatio || 1) * (Number(settings.resolution || 150) / 100), coarse ? 2.15 : 2.75);
}
export function createRenderer(canvas, settings = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.antialias !== false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.useLegacyLights = false;
  renderer.shadowMap.enabled = settings.shadowQuality !== 'off';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(getPixelRatio(settings));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x9db2ad, 1);
  renderer.info.autoReset = true;
  return renderer;
}
export function resizeRenderer(renderer, camera, settings = {}) {
  renderer.setPixelRatio(getPixelRatio(settings));
  camera.aspect = Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}