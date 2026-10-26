import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem';
import { CoupleAvatar } from './CoupleAvatars';

export interface ExplorationEngineConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  playerName?: string;
  partnerName?: string;
  collisionSystem: CollisionSystem;
  initialPosition?: THREE.Vector3;
  getTerrainHeight?: (x: number, z: number) => number;
}

// Module-scope pre-allocated scratch objects for zero GC per frame
const _moveDir = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _partnerTarget = new THREE.Vector3();
const _partnerOffset = new THREE.Vector3();
const _diff = new THREE.Vector3();

export class ExplorationEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;
  public collisionSystem: CollisionSystem;
  public getTerrainHeight: (x: number, z: number) => number;

  public playerAvatar: CoupleAvatar;
  public partnerAvatar: CoupleAvatar;

  public isActive = false;

  // Input states
  private keys: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 }; // -1 to 1
  public clickTarget: THREE.Vector3 | null = null;

  // Camera settings
  private cameraDistance = 6.5;
  private cameraHeight = 3.2;
  private cameraYaw = 0;
  private cameraPitch = 0.28;
  private isDraggingCamera = false;
  private lastPointerPos = { x: 0, y: 0 };

  // Romantic heart particle emitter
  private heartParticles: THREE.Points;
  private heartGeo: THREE.BufferGeometry;
  private heartCount = 20;

  constructor(config: ExplorationEngineConfig) {
    this.scene = config.scene;
    this.camera = config.camera;
    this.domElement = config.domElement;
    this.collisionSystem = config.collisionSystem;
    this.getTerrainHeight = config.getTerrainHeight || (() => 0);

    const initPos = config.initialPosition || new THREE.Vector3(0, 0, 0);
    const groundY = this.getTerrainHeight(initPos.x, initPos.z);

    // Initialize player avatar
    this.playerAvatar = new CoupleAvatar({
      name: config.playerName || 'You',
      color: '#4A90E2',
      accentColor: '#1E3A8A',
      isPartner: false,
    });
    this.playerAvatar.group.position.set(initPos.x, groundY, initPos.z);
    this.scene.add(this.playerAvatar.group);

    // Initialize partner avatar
    this.partnerAvatar = new CoupleAvatar({
      name: config.partnerName || 'Partner 💖',
      color: '#E8547A',
      accentColor: '#9C27B0',
      isPartner: true,
    });
    this.partnerAvatar.group.position.set(initPos.x + 1.2, groundY, initPos.z);
    this.scene.add(this.partnerAvatar.group);

    // Heart particles setup
    this.heartGeo = new THREE.BufferGeometry();
    const hPos = new Float32Array(this.heartCount * 3);
    for (let i = 0; i < this.heartCount; i++) {
      hPos[i * 3] = 0;
      hPos[i * 3 + 1] = -100; // hidden until spawned
      hPos[i * 3 + 2] = 0;
    }
    this.heartGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));

    // Simple procedural heart shape texture
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 32;
    hCanvas.height = 32;
    const hCtx = hCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#FF4081';
      hCtx.font = '24px serif';
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';
      hCtx.fillText('♥', 16, 16);
    }
    const hTex = new THREE.CanvasTexture(hCanvas);
    const hMat = new THREE.PointsMaterial({
      size: 0.6,
      map: hTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.heartParticles = new THREE.Points(this.heartGeo, hMat);
    this.scene.add(this.heartParticles);

    // Bind event listeners
    this.bindEvents();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.isActive) return;
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code.toLowerCase()] = true;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
      this.clickTarget = null;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code.toLowerCase()] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.isActive) return;
    // Right button or touch drag on right side moves camera
    if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45) {
      return; // Left side is for touch joystick
    }
    this.isDraggingCamera = true;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isActive || !this.isDraggingCamera) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    this.cameraYaw -= dx * 0.006;
    this.cameraPitch = Math.max(0.05, Math.min(Math.PI / 2.2, this.cameraPitch + dy * 0.005));
  };

  private onPointerUp = () => {
    this.isDraggingCamera = false;
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.isActive) return;
    this.cameraDistance = Math.max(2.5, Math.min(16, this.cameraDistance + e.deltaY * 0.005));
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: true });
  }

  public activate(): void {
    this.isActive = true;
    this.playerAvatar.group.visible = true;
    this.partnerAvatar.group.visible = true;

    // Align camera behind player
    const pPos = this.playerAvatar.group.position;
    this.cameraYaw = this.playerAvatar.heading;
    this.updateCamera(0.1);
  }

  public deactivate(): void {
    this.isActive = false;
    this.playerAvatar.group.visible = false;
    this.partnerAvatar.group.visible = false;
    this.isDraggingCamera = false;
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
    this.clickTarget = null;
  }

  public setClickTarget(point: THREE.Vector3): void {
    if (!this.isActive) return;
    this.clickTarget = point.clone();
  }

  public update(delta: number, elapsed: number): void {
    if (!this.isActive) return;

    const clampedDelta = Math.min(delta, 0.1);
    const pPos = this.playerAvatar.group.position;

    // 1. Calculate movement direction from inputs
    _moveDir.set(0, 0, 0);

    // Keyboard inputs
    let forward = 0;
    let right = 0;

    if (this.keys['w'] || this.keys['arrowup'] || this.keys['keyw']) forward += 1;
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['keys']) forward -= 1;
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['keya']) right -= 1;
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['keyd']) right += 1;

    // Virtual Joystick input
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      right += this.joystickVector.x;
      forward += -this.joystickVector.y;
    }

    // Camera relative directions
    this.camera.getWorldDirection(_camForward);
    _camForward.y = 0;
    _camForward.normalize();

    _camRight.crossVectors(_camForward, new THREE.Vector3(0, 1, 0)).normalize();

    let hasInput = false;
    if (forward !== 0 || right !== 0) {
      hasInput = true;
      _moveDir.addScaledVector(_camForward, forward);
      _moveDir.addScaledVector(_camRight, right);
      _moveDir.normalize();
    } else if (this.clickTarget) {
      _diff.subVectors(this.clickTarget, pPos);
      _diff.y = 0;
      const dist = _diff.length();
      if (dist > 0.3) {
        hasInput = true;
        _moveDir.copy(_diff).normalize();
      } else {
        this.clickTarget = null;
      }
    }

    // Speed (sprint if shift is pressed)
    const isSprint = this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright'];
    const speed = (isSprint ? 6.5 : 3.8);

    if (hasInput && _moveDir.lengthSq() > 0.001) {
      // Calculate target next position
      _targetPos.copy(pPos).addScaledVector(_moveDir, speed * clampedDelta);

      // Resolve collisions (walls, obstacles, perimeters) with sliding response
      const resolved = this.collisionSystem.resolve(pPos, _targetPos, 0.45);

      // Adjust height to match terrain
      const targetY = this.getTerrainHeight(resolved.x, resolved.z);
      resolved.y = THREE.MathUtils.damp(pPos.y, targetY, 15, clampedDelta);

      pPos.copy(resolved);

      // Smooth heading rotation toward move direction
      const targetHeading = Math.atan2(_moveDir.x, _moveDir.z);
      // Angular lerp
      let diffHeading = targetHeading - this.playerAvatar.heading;
      while (diffHeading < -Math.PI) diffHeading += Math.PI * 2;
      while (diffHeading > Math.PI) diffHeading -= Math.PI * 2;
      this.playerAvatar.heading += diffHeading * Math.min(1, clampedDelta * 12);

      this.playerAvatar.updateAnimation(clampedDelta, true);
    } else {
      this.playerAvatar.updateAnimation(clampedDelta, false);
    }

    // 2. Partner AI Companion following behavior
    this.updatePartnerCompanion(clampedDelta, hasInput);

    // 3. Smooth Camera Follow
    this.updateCamera(clampedDelta);

    // 4. Romantic Heart Sparkles when standing or walking closely
    this.updateHearts(clampedDelta, elapsed);
  }

  private updatePartnerCompanion(delta: number, playerIsMoving: boolean): void {
    const pPos = this.playerAvatar.group.position;
    const partnerPos = this.partnerAvatar.group.position;

    // Partner wants to walk beside or slightly behind player
    const side = Math.sin(this.playerAvatar.heading + Math.PI / 2);
    const forward = Math.cos(this.playerAvatar.heading + Math.PI / 2);

    _partnerOffset.set(side * 1.3 - Math.sin(this.playerAvatar.heading) * 0.4, 0, forward * 1.3 - Math.cos(this.playerAvatar.heading) * 0.4);
    _partnerTarget.copy(pPos).add(_partnerOffset);

    // Check collision for partner target
    const resolvedTarget = this.collisionSystem.resolve(partnerPos, _partnerTarget, 0.4);

    _diff.subVectors(resolvedTarget, partnerPos);
    _diff.y = 0;
    const distToTarget = _diff.length();

    if (distToTarget > 0.25) {
      // Partner moves toward target
      _diff.normalize();
      const partnerSpeed = Math.min(distToTarget * 3.5, 6.0);
      partnerPos.addScaledVector(_diff, partnerSpeed * delta);

      // Update height
      const targetY = this.getTerrainHeight(partnerPos.x, partnerPos.z);
      partnerPos.y = THREE.MathUtils.damp(partnerPos.y, targetY, 15, delta);

      // Partner faces move direction or player
      const partnerHeading = Math.atan2(_diff.x, _diff.z);
      let diffH = partnerHeading - this.partnerAvatar.heading;
      while (diffH < -Math.PI) diffH += Math.PI * 2;
      while (diffH > Math.PI) diffH -= Math.PI * 2;
      this.partnerAvatar.heading += diffH * Math.min(1, delta * 10);

      this.partnerAvatar.updateAnimation(delta, true);
    } else {
      // When stopped, turn gently to face player
      const toPlayerX = pPos.x - partnerPos.x;
      const toPlayerZ = pPos.z - partnerPos.z;
      const facePlayerHeading = Math.atan2(toPlayerX, toPlayerZ);
      let diffH = facePlayerHeading - this.partnerAvatar.heading;
      while (diffH < -Math.PI) diffH += Math.PI * 2;
      while (diffH > Math.PI) diffH -= Math.PI * 2;
      this.partnerAvatar.heading += diffH * Math.min(1, delta * 6);

      this.partnerAvatar.updateAnimation(delta, false);
    }
  }

  private updateCamera(delta: number): void {
    const pPos = this.playerAvatar.group.position;

    // Spherical coordinates around player
    const camX = pPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camZ = pPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camY = pPos.y + this.cameraHeight + Math.sin(this.cameraPitch) * (this.cameraDistance * 0.5);

    // Smooth exponential damping
    const dampFactor = Math.min(1, delta * 8);
    this.camera.position.x += (camX - this.camera.position.x) * dampFactor;
    this.camera.position.y += (camY - this.camera.position.y) * dampFactor;
    this.camera.position.z += (camZ - this.camera.position.z) * dampFactor;

    // Look target is mid-point between player and partner, chest height
    const midX = (pPos.x + this.partnerAvatar.group.position.x) * 0.5;
    const midY = (pPos.y + 1.2);
    const midZ = (pPos.z + this.partnerAvatar.group.position.z) * 0.5;

    this.camera.lookAt(midX, midY, midZ);
  }

  private updateHearts(delta: number, elapsed: number): void {
    const pPos = this.playerAvatar.group.position;
    const partPos = this.partnerAvatar.group.position;
    const dist = pPos.distanceTo(partPos);

    const pos = this.heartGeo.attributes.position.array as Float32Array;

    // Spawn a heart between them if they are close
    if (dist < 2.0 && Math.random() < 0.08) {
      // Find inactive particle
      for (let i = 0; i < this.heartCount; i++) {
        if (pos[i * 3 + 1] < -10) {
          pos[i * 3] = (pPos.x + partPos.x) * 0.5 + (Math.random() - 0.5) * 0.4;
          pos[i * 3 + 1] = pPos.y + 1.4;
          pos[i * 3 + 2] = (pPos.z + partPos.z) * 0.5 + (Math.random() - 0.5) * 0.4;
          break;
        }
      }
    }

    // Float active particles up
    for (let i = 0; i < this.heartCount; i++) {
      if (pos[i * 3 + 1] > -10) {
        pos[i * 3 + 1] += delta * 0.8;
        pos[i * 3] += Math.sin(elapsed * 4 + i) * delta * 0.15;
        if (pos[i * 3 + 1] > pPos.y + 3.2) {
          pos[i * 3 + 1] = -100;
        }
      }
    }
    this.heartGeo.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.scene.remove(this.playerAvatar.group);
    this.scene.remove(this.partnerAvatar.group);
    this.scene.remove(this.heartParticles);
    this.heartGeo.dispose();
  }
}
