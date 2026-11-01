import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem';
import { CoupleAvatar, RomanticMoment } from './CoupleAvatars';

export type DriverTarget = 'boy' | 'galaxia' | 'both';
export type MovementSpeed = 'walk' | 'jog' | 'sprint';

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

  public boyAvatar: CoupleAvatar;
  public galaxiaAvatar: CoupleAvatar;

  public isActive = false;
  public activeDriver: DriverTarget = 'boy';
  public movementSpeed: MovementSpeed = 'jog';
  public activeMoment: RomanticMoment = 'idle';
  public momentTimer = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 }; // -1 to 1
  public clickTarget: THREE.Vector3 | null = null;

  // Camera settings
  private baseCameraDistance = 6.0;
  private cameraDistance = 6.0;
  private targetCameraDistance = 6.0;
  private cameraHeight = 3.0;
  private cameraYaw = 0;
  private cameraPitch = 0.28;
  private isDraggingCamera = false;
  private lastPointerPos = { x: 0, y: 0 };

  // Romantic particle celebration system
  private celebrationParticles: THREE.Points;
  private celebrationGeo: THREE.BufferGeometry;
  private particleCount = 40;
  private particleVels: Float32Array;

  constructor(config: ExplorationEngineConfig) {
    this.scene = config.scene;
    this.camera = config.camera;
    this.domElement = config.domElement;
    this.collisionSystem = config.collisionSystem;
    this.getTerrainHeight = config.getTerrainHeight || (() => 0);

    const initPos = config.initialPosition || new THREE.Vector3(0, 0, 0);
    const groundY = this.getTerrainHeight(initPos.x, initPos.z);

    // Initialize Character Boy 1 (https://skfb.ly/oMnnr)
    this.boyAvatar = new CoupleAvatar({
      name: config.playerName || 'Alex (Boy)',
      characterType: 'boy',
      primaryColor: '#2962FF',
      accentColor: '#263238',
      isPartner: false,
    });
    this.boyAvatar.group.position.set(initPos.x - 0.6, groundY, initPos.z);
    this.scene.add(this.boyAvatar.group);

    // Initialize Galaxia - Anime Girl (https://skfb.ly/o7qwD)
    this.galaxiaAvatar = new CoupleAvatar({
      name: config.partnerName || 'Taylor (Galaxia)',
      characterType: 'galaxia',
      primaryColor: '#EC407A',
      accentColor: '#7E57C2',
      isPartner: true,
    });
    this.galaxiaAvatar.group.position.set(initPos.x + 0.6, groundY, initPos.z);
    this.scene.add(this.galaxiaAvatar.group);

    // Celebration particles setup (Hearts & Starlight)
    this.celebrationGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(this.particleCount * 3);
    this.particleVels = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      pPos[i * 3] = 0;
      pPos[i * 3 + 1] = -100;
      pPos[i * 3 + 2] = 0;
    }
    this.celebrationGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#FF4081';
      pCtx.font = '24px serif';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.fillText('♥', 16, 16);
    }
    const pTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.PointsMaterial({
      size: 0.7,
      map: pTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.celebrationParticles = new THREE.Points(this.celebrationGeo, pMat);
    this.scene.add(this.celebrationParticles);

    this.bindEvents();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.isActive) return;
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    this.keys[e.code.toLowerCase()] = true;

    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      this.clickTarget = null;
      if (this.activeMoment !== 'idle' && this.activeMoment !== 'hold_hands') {
        this.clearMoment();
      }
    }

    // Spacebar Jump
    if (e.code === 'Space' || key === ' ') {
      e.preventDefault();
      this.triggerJump();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    this.keys[e.code.toLowerCase()] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.isActive) return;
    if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.45) {
      return; // Touch joystick zone
    }
    this.isDraggingCamera = true;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isActive || !this.isDraggingCamera) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    this.cameraYaw -= dx * 0.0055;
    this.cameraPitch = Math.max(0.05, Math.min(Math.PI / 2.2, this.cameraPitch + dy * 0.0045));
  };

  private onPointerUp = () => {
    this.isDraggingCamera = false;
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.isActive) return;
    this.targetCameraDistance = Math.max(2.5, Math.min(16, this.targetCameraDistance + e.deltaY * 0.005));
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
    this.boyAvatar.group.visible = true;
    this.galaxiaAvatar.group.visible = true;
    this.targetCameraDistance = this.baseCameraDistance;
    this.updateCamera(0.1);
  }

  public deactivate(): void {
    this.isActive = false;
    this.boyAvatar.group.visible = false;
    this.galaxiaAvatar.group.visible = false;
    this.isDraggingCamera = false;
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
    this.clickTarget = null;
  }

  public setClickTarget(point: THREE.Vector3): void {
    if (!this.isActive) return;
    this.clickTarget = point.clone();
    if (this.activeMoment !== 'idle' && this.activeMoment !== 'hold_hands') {
      this.clearMoment();
    }
  }

  public triggerJump(): void {
    this.boyAvatar.triggerJump();
    this.galaxiaAvatar.triggerJump();
    this.spawnCelebrationBurst(0.8);
  }

  public triggerMoment(moment: RomanticMoment): void {
    this.activeMoment = moment;
    this.momentTimer = 0;
    this.boyAvatar.setMoment(moment);
    this.galaxiaAvatar.setMoment(moment);

    // Cinematic camera zoom in for romantic moments
    if (['hug', 'kiss', 'dance'].includes(moment)) {
      this.targetCameraDistance = 3.6;
    } else {
      this.targetCameraDistance = this.baseCameraDistance;
    }

    // Spawn celebratory particles
    this.spawnCelebrationBurst(1.8);
  }

  public clearMoment(): void {
    this.activeMoment = 'idle';
    this.boyAvatar.setMoment('idle');
    this.galaxiaAvatar.setMoment('idle');
    this.targetCameraDistance = this.baseCameraDistance;
  }

  public setSpeed(speed: MovementSpeed): void {
    this.movementSpeed = speed;
  }

  public setDriver(driver: DriverTarget): void {
    this.activeDriver = driver;
  }

  private getSpeedMultiplier(): number {
    switch (this.movementSpeed) {
      case 'walk': return 0.8;
      case 'jog': return 1.25;
      case 'sprint': return 1.8;
      default: return 1.25;
    }
  }

  public update(delta: number, elapsed: number): void {
    if (!this.isActive) return;

    const clampedDelta = Math.min(delta, 0.1);

    // Primary driver avatar (Boy, Galaxia, or Lead)
    const leadAvatar = this.activeDriver === 'galaxia' ? this.galaxiaAvatar : this.boyAvatar;
    const followAvatar = this.activeDriver === 'galaxia' ? this.boyAvatar : this.galaxiaAvatar;
    const leadPos = leadAvatar.group.position;

    // Camera zoom damping
    this.cameraDistance = THREE.MathUtils.damp(this.cameraDistance, this.targetCameraDistance, 8, clampedDelta);

    // Handle Moment specific kinematics
    if (this.activeMoment !== 'idle') {
      this.updateMomentKinematics(clampedDelta, leadAvatar, followAvatar);
    } else {
      // Standard Free Movement
      this.updateMovement(clampedDelta, leadAvatar, followAvatar);
    }

    // Smooth Camera Follow
    this.updateCamera(clampedDelta);

    // Update particles
    this.updateParticles(clampedDelta, elapsed);
  }

  private updateMovement(delta: number, leadAvatar: CoupleAvatar, followAvatar: CoupleAvatar): void {
    const leadPos = leadAvatar.group.position;
    const followPos = followAvatar.group.position;

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
      _diff.subVectors(this.clickTarget, leadPos);
      _diff.y = 0;
      const dist = _diff.length();
      if (dist > 0.3) {
        hasInput = true;
        _moveDir.copy(_diff).normalize();
      } else {
        this.clickTarget = null;
      }
    }

    const isSprintKey = this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright'];
    const speedMult = isSprintKey ? 1.8 : this.getSpeedMultiplier();
    const speed = 4.2 * speedMult;

    if (hasInput && _moveDir.lengthSq() > 0.001) {
      _targetPos.copy(leadPos).addScaledVector(_moveDir, speed * delta);

      // Solid collision resolution (walls, obstacles, island perimeter)
      const resolved = this.collisionSystem.resolve(leadPos, _targetPos, 0.45);

      const targetY = this.getTerrainHeight(resolved.x, resolved.z);
      resolved.y = THREE.MathUtils.damp(leadPos.y, targetY, 15, delta);

      leadPos.copy(resolved);

      // Heading rotation
      const targetHeading = Math.atan2(_moveDir.x, _moveDir.z);
      let diffH = targetHeading - leadAvatar.heading;
      while (diffH < -Math.PI) diffH += Math.PI * 2;
      while (diffH > Math.PI) diffH -= Math.PI * 2;
      leadAvatar.heading += diffH * Math.min(1, delta * 12);

      leadAvatar.updateAnimation(delta, true, speedMult);
    } else {
      leadAvatar.updateAnimation(delta, false, 1.0);
    }

    // Partner smooth companion follow
    this.updatePartnerFollow(delta, leadAvatar, followAvatar);
  }

  private updatePartnerFollow(delta: number, leadAvatar: CoupleAvatar, followAvatar: CoupleAvatar): void {
    const leadPos = leadAvatar.group.position;
    const followPos = followAvatar.group.position;

    // Follower walks alongside on the right or left
    const sideAngle = leadAvatar.heading + Math.PI / 2;
    const sideX = Math.sin(sideAngle) * 1.35;
    const sideZ = Math.cos(sideAngle) * 1.35;
    const backX = -Math.sin(leadAvatar.heading) * 0.4;
    const backZ = -Math.cos(leadAvatar.heading) * 0.4;

    _partnerOffset.set(sideX + backX, 0, sideZ + backZ);
    _partnerTarget.copy(leadPos).add(_partnerOffset);

    // Collision check for follower
    const resolvedTarget = this.collisionSystem.resolve(followPos, _partnerTarget, 0.45);

    _diff.subVectors(resolvedTarget, followPos);
    _diff.y = 0;
    const distToTarget = _diff.length();

    if (distToTarget > 0.22) {
      _diff.normalize();
      const followSpeed = Math.min(distToTarget * 4.2, 8.5);
      followPos.addScaledVector(_diff, followSpeed * delta);

      const targetY = this.getTerrainHeight(followPos.x, followPos.z);
      followPos.y = THREE.MathUtils.damp(followPos.y, targetY, 15, delta);

      const followHeading = Math.atan2(_diff.x, _diff.z);
      let diffH = followHeading - followAvatar.heading;
      while (diffH < -Math.PI) diffH += Math.PI * 2;
      while (diffH > Math.PI) diffH -= Math.PI * 2;
      followAvatar.heading += diffH * Math.min(1, delta * 10);

      followAvatar.updateAnimation(delta, true, 1.2);
    } else {
      // Turn gently to face lead partner when stopped
      const toLeadX = leadPos.x - followPos.x;
      const toLeadZ = leadPos.z - followPos.z;
      const faceLeadHeading = Math.atan2(toLeadX, toLeadZ);
      let diffH = faceLeadHeading - followAvatar.heading;
      while (diffH < -Math.PI) diffH += Math.PI * 2;
      while (diffH > Math.PI) diffH -= Math.PI * 2;
      followAvatar.heading += diffH * Math.min(1, delta * 6);

      followAvatar.updateAnimation(delta, false, 1.0);
    }
  }

  private updateMomentKinematics(delta: number, boy: CoupleAvatar, girl: CoupleAvatar): void {
    const boyPos = boy.group.position;
    const girlPos = girl.group.position;

    if (this.activeMoment === 'hug' || this.activeMoment === 'kiss') {
      // Step closely together facing each other
      const midX = (boyPos.x + girlPos.x) * 0.5;
      const midZ = (boyPos.z + girlPos.z) * 0.5;

      const targetDist = this.activeMoment === 'hug' ? 0.65 : 0.72;
      const angle = boy.heading;

      const targetBoyX = midX - Math.sin(angle) * (targetDist * 0.5);
      const targetBoyZ = midZ - Math.cos(angle) * (targetDist * 0.5);
      const targetGirlX = midX + Math.sin(angle) * (targetDist * 0.5);
      const targetGirlZ = midZ + Math.cos(angle) * (targetDist * 0.5);

      boyPos.x = THREE.MathUtils.damp(boyPos.x, targetBoyX, 10, delta);
      boyPos.z = THREE.MathUtils.damp(boyPos.z, targetBoyZ, 10, delta);
      girlPos.x = THREE.MathUtils.damp(girlPos.x, targetGirlX, 10, delta);
      girlPos.z = THREE.MathUtils.damp(girlPos.z, targetGirlZ, 10, delta);

      // Face each other exactly
      boy.heading = angle;
      girl.heading = angle + Math.PI;

      boy.updateAnimation(delta, false);
      girl.updateAnimation(delta, false);
    } else if (this.activeMoment === 'dance') {
      // Gracefully spin in a circle together
      this.momentTimer += delta * 2.5;
      const spinRadius = 0.55;
      const centerPos = (boyPos.clone().add(girlPos)).multiplyScalar(0.5);

      boyPos.x = centerPos.x + Math.sin(this.momentTimer) * spinRadius;
      boyPos.z = centerPos.z + Math.cos(this.momentTimer) * spinRadius;
      girlPos.x = centerPos.x - Math.sin(this.momentTimer) * spinRadius;
      girlPos.z = centerPos.z - Math.cos(this.momentTimer) * spinRadius;

      boy.heading = this.momentTimer + Math.PI / 2;
      girl.heading = this.momentTimer - Math.PI / 2;

      boy.updateAnimation(delta, true, 1.0);
      girl.updateAnimation(delta, true, 1.0);
    } else if (this.activeMoment === 'hold_hands') {
      // Walk together side by side holding hands
      this.updateMovement(delta, boy, girl);
    } else {
      boy.updateAnimation(delta, false);
      girl.updateAnimation(delta, false);
    }
  }

  private updateCamera(delta: number): void {
    const boyPos = this.boyAvatar.group.position;
    const girlPos = this.galaxiaAvatar.group.position;
    const midX = (boyPos.x + girlPos.x) * 0.5;
    const midY = (boyPos.y + girlPos.y) * 0.5 + 1.25;
    const midZ = (boyPos.z + girlPos.z) * 0.5;

    const camX = midX + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camZ = midZ + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camY = midY + this.cameraHeight + Math.sin(this.cameraPitch) * (this.cameraDistance * 0.45);

    const damp = Math.min(1, delta * 9);
    this.camera.position.x += (camX - this.camera.position.x) * damp;
    this.camera.position.y += (camY - this.camera.position.y) * damp;
    this.camera.position.z += (camZ - this.camera.position.z) * damp;

    this.camera.lookAt(midX, midY, midZ);
  }

  public spawnCelebrationBurst(intensity = 1.0): void {
    const boyPos = this.boyAvatar.group.position;
    const girlPos = this.galaxiaAvatar.group.position;
    const midX = (boyPos.x + girlPos.x) * 0.5;
    const midY = (boyPos.y + girlPos.y) * 0.5 + 1.4;
    const midZ = (boyPos.z + girlPos.z) * 0.5;

    const pos = this.celebrationGeo.attributes.position.array as Float32Array;
    const count = Math.min(this.particleCount, Math.floor(25 * intensity));

    for (let i = 0; i < count; i++) {
      pos[i * 3] = midX + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = midY;
      pos[i * 3 + 2] = midZ + (Math.random() - 0.5) * 0.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = (0.8 + Math.random() * 1.5) * intensity;
      this.particleVels[i * 3] = Math.cos(angle) * speed;
      this.particleVels[i * 3 + 1] = 1.2 + Math.random() * 2.0;
      this.particleVels[i * 3 + 2] = Math.sin(angle) * speed;
    }
    this.celebrationGeo.attributes.position.needsUpdate = true;
  }

  private updateParticles(delta: number, elapsed: number): void {
    const pos = this.celebrationGeo.attributes.position.array as Float32Array;
    let anyActive = false;

    for (let i = 0; i < this.particleCount; i++) {
      if (pos[i * 3 + 1] > -10) {
        anyActive = true;
        pos[i * 3] += this.particleVels[i * 3] * delta;
        pos[i * 3 + 1] += this.particleVels[i * 3 + 1] * delta;
        pos[i * 3 + 2] += this.particleVels[i * 3 + 2] * delta;

        this.particleVels[i * 3 + 1] -= 2.5 * delta; // Gravity

        // Dissolve when below ground or too high
        if (pos[i * 3 + 1] < 0.2 || pos[i * 3 + 1] > 6.0) {
          pos[i * 3 + 1] = -100;
        }
      }
    }

    if (anyActive) {
      this.celebrationGeo.attributes.position.needsUpdate = true;
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.scene.remove(this.boyAvatar.group);
    this.scene.remove(this.galaxiaAvatar.group);
    this.scene.remove(this.celebrationParticles);
    this.celebrationGeo.dispose();
  }
}
