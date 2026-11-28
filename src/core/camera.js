import * as THREE from 'three';
const SAVE_KEY = 'ezid-russia-camera-v1';

export class FreeCamera {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.world = null;
    this.keys = new Set();
    this.enabled = false;
    this.locked = false;
    this.dragging = false;
    this.isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.sensitivity = .0022;
    this.walkSpeed = 2.7;
    this.sprintSpeed = 5.4;
    this.eyeHeight = 1.68;
    this.radius = .32;
    this.yaw = -Math.PI * .5;
    this.pitch = -.12;
    this.touchMove = { x: 0, y: 0 };
    this.touchSprint = false;
    this.touchTurn = 0;
    this.touchTurnSpeed = 1.85;
    this.direction = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.moveAmount = 0;
    this.onPointerLock = () => {};
    this.bindEvents();
    this.camera.position.set(22, 2, 78);
    this.updateLook();
  }

  setWorld(world) { this.world = world; this.snapToGround(); }

  bindEvents() {
    window.addEventListener('keydown', (event) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
        this.keys.add(event.code);
        if (this.enabled) event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.setTouchMove(0, 0);
      this.setTouchSprint(false);
      this.setTouchTurn(0);
    });
    this.canvas.addEventListener('click', () => {
      if (!this.isTouchDevice && this.enabled && !this.locked && this.canvas.requestPointerLock) this.canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      this.onPointerLock(this.locked);
    });
    if (!this.isTouchDevice) {
      this.canvas.addEventListener('mousedown', () => { if (!this.locked && this.enabled) this.dragging = true; });
      window.addEventListener('mouseup', () => { this.dragging = false; });
      window.addEventListener('mousemove', (event) => {
        if (this.enabled && (this.locked || this.dragging)) this.rotate(event.movementX, event.movementY);
      });
      this.canvas.addEventListener('wheel', (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.zoomBy((event.deltaY < 0 ? 1 : -1) * Math.max(3, this.walkSpeed * 3));
      }, { passive: false });
    }
  }

  rotate(dx, dy) {
    this.yaw += dx * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * this.sensitivity, -1.1, .85);
    this.updateLook();
  }

  zoomBy(amount) {
    this.camera.fov = THREE.MathUtils.clamp(this.camera.fov - amount * .7, 48, 78);
    this.camera.updateProjectionMatrix();
  }

  updateLook() {
    this.direction.set(
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.sin(this.yaw)
    ).normalize();
    this.camera.lookAt(this.camera.position.clone().add(this.direction));
  }

  getForward() { return this.forward.set(Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize(); }
  setTouchMove(x, y) {
    this.touchMove.x = THREE.MathUtils.clamp(x, -1, 1);
    this.touchMove.y = THREE.MathUtils.clamp(y, -1, 1);
  }
  setTouchSprint(value) { this.touchSprint = Boolean(value); }
  setTouchTurn(value) { this.touchTurn = THREE.MathUtils.clamp(Number(value) || 0, -1, 1); }
  groundAt(x, z) { return this.world?.groundHeightAt ? this.world.groundHeightAt(x, z) : 0; }

  snapToGround() {
    this.camera.position.y = this.groundAt(this.camera.position.x, this.camera.position.z) + this.eyeHeight;
    this.updateLook();
  }

  update(dt) {
    if (!this.enabled) return;
    const forward = this.getForward();
    this.right.crossVectors(forward, this.up).normalize();
    let x = this.touchMove.x, y = this.touchMove.y;
    if (this.keys.has('KeyW')) y += 1;
    if (this.keys.has('KeyS')) y -= 1;
    if (this.keys.has('KeyD')) x += 1;
    if (this.keys.has('KeyA')) x -= 1;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    const sprint = this.touchSprint || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = sprint ? this.sprintSpeed : this.walkSpeed;
    const previous = this.camera.position.clone();
    const candidate = previous.clone()
      .addScaledVector(forward, y * speed * dt)
      .addScaledVector(this.right, x * speed * dt);
    candidate.y = previous.y;
    const resolved = this.world?.resolvePosition
      ? this.world.resolvePosition(previous, candidate, this.radius)
      : candidate;
    this.camera.position.x = resolved.x;
    this.camera.position.z = resolved.z;
    const floor = this.groundAt(resolved.x, resolved.z);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, floor + this.eyeHeight, 18, dt);
    this.moveAmount = THREE.MathUtils.damp(this.moveAmount, Math.min(1, Math.hypot(x, y)), 12, dt);
    if (this.touchTurn) this.yaw += this.touchTurn * this.touchTurnSpeed * dt;
    this.updateLook();
  }

  enableInput(value) {
    this.enabled = value;
    this.keys.clear();
    this.setTouchMove(0, 0);
    this.setTouchSprint(false);
    this.setTouchTurn(0);
    this.moveAmount = 0;
  }
  releasePointer() { if (document.pointerLockElement === this.canvas) document.exitPointerLock(); }
  setSensitivity(value) { this.sensitivity = THREE.MathUtils.clamp(Number(value) / 100, .0005, .008); }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        position: this.camera.position.toArray(), yaw: this.yaw, pitch: this.pitch, fov: this.camera.fov
      }));
    } catch (error) { console.warn('Позицию игрока не удалось сохранить:', error); }
  }

  restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!saved || !Array.isArray(saved.position)) return false;
      this.camera.position.fromArray(saved.position);
      this.yaw = Number(saved.yaw) || this.yaw;
      this.pitch = Number(saved.pitch) || this.pitch;
      this.camera.fov = THREE.MathUtils.clamp(Number(saved.fov) || 66, 48, 78);
      this.camera.updateProjectionMatrix();
      this.snapToGround();
      return true;
    } catch { return false; }
  }
}
