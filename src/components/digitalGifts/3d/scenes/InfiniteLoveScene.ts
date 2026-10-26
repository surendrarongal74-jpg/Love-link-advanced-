import * as THREE from 'three';
import { DigitalGift } from '../../../../types/digitalGifts';
import { QualityConfig } from '../QualitySettings';
import { createHeartTexture } from '../ProceduralTextures';

import { CollisionSystem } from '../CollisionSystem';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLDivElement;
  quality: QualityConfig;
  onInteract: (actionId: string, payload?: any) => void;
  collisionSystem?: CollisionSystem;
}

export interface Loveverse3DSceneInstance {
  update: (delta: number, elapsed: number) => void;
  dispose: () => void;
  resetCamera: () => void;
  getTerrainHeight?: (x: number, z: number) => number;
  initialPlayerPos?: THREE.Vector3;
  onPointerDown?: (event: MouseEvent | TouchEvent, raycaster: THREE.Raycaster) => boolean;
}

export function createInfiniteLoveScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const defaultCamPos = new THREE.Vector3(0, 4, 16);
  const defaultTarget = new THREE.Vector3(0, 0, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 55;
  camera.updateProjectionMatrix();

  // Deep space background
  scene.background = new THREE.Color('#080410');

  // Ambient starlight
  const ambientLight = new THREE.AmbientLight('#E1BEE7', 0.6);
  scene.add(ambientLight);

  // 1. Cosmic Crystal Heart Core
  const heartGroup = new THREE.Group();
  heartGroup.position.set(0, 0, 0);

  // Generate 3D Heart Geometry using Extrusion
  const heartShape = new THREE.Shape();
  const x = 0, y = 0;
  heartShape.moveTo(x, y + 1.2);
  heartShape.bezierCurveTo(x, y + 2.2, x - 2.0, y + 2.8, x - 2.0, y + 1.2);
  heartShape.bezierCurveTo(x - 2.0, y - 0.2, x, y - 1.2, x, y - 2.2);
  heartShape.bezierCurveTo(x, y - 1.2, x + 2.0, y - 0.2, x + 2.0, y + 1.2);
  heartShape.bezierCurveTo(x + 2.0, y + 2.8, x, y + 2.2, x, y + 1.2);

  const extrudeSettings = {
    depth: 0.9,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  };
  const heartGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  heartGeom.center();
  disposables.push(heartGeom);

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: '#FF4081',
    emissive: '#880E4F',
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.2,
    transmission: 0.85,
    ior: 1.6,
    transparent: true,
    opacity: 0.92,
  });
  disposables.push(crystalMat);

  const heartMesh = new THREE.Mesh(heartGeom, crystalMat);
  heartGroup.add(heartMesh);

  // Core Pulse Light inside Heart
  const heartLight = new THREE.PointLight('#FF4081', 3.0, 18);
  heartGroup.add(heartLight);

  heartGroup.userData = { isClickable: true, action: 'open_cosmic_heart' };
  heartMesh.userData = { isClickable: true, action: 'open_cosmic_heart' };
  scene.add(heartGroup);
  interactiveObjects.push(heartGroup, heartMesh);

  // 2. Glowing Planetary Rings of Light
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: '#E040FB',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  disposables.push(ringMat1);
  const ringGeom1 = new THREE.RingGeometry(4.5, 5.0, 48);
  disposables.push(ringGeom1);
  const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  const ringMat2 = new THREE.MeshBasicMaterial({
    color: '#00E5FF',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  disposables.push(ringMat2);
  const ringGeom2 = new THREE.RingGeometry(5.8, 6.2, 48);
  disposables.push(ringGeom2);
  const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
  ring2.rotation.x = -Math.PI / 4;
  ring2.rotation.y = Math.PI / 6;
  scene.add(ring2);

  // 3. Milestone Celestial Beacons (Constellation Nodes)
  const milestoneLabels = [
    'The First Hello ✨',
    'Our Favorite Laughs 💫',
    'Whispered Dreams 🌙',
    'Forever Promise 💖',
  ];

  const beaconMat = new THREE.MeshStandardMaterial({
    color: '#FFE082',
    emissive: '#FFB300',
    emissiveIntensity: 0.8,
  });
  disposables.push(beaconMat);
  const beaconGeom = new THREE.OctahedronGeometry(0.45);
  disposables.push(beaconGeom);

  const beaconNodes: THREE.Mesh[] = [];
  milestoneLabels.forEach((label, idx) => {
    const angle = (idx / milestoneLabels.length) * Math.PI * 2;
    const dist = 7.5;
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(Math.cos(angle) * dist, Math.sin(angle * 2) * 1.8, Math.sin(angle) * dist);

    // Glowing pointlight
    const bLight = new THREE.PointLight('#FFD54F', 1.2, 4);
    beacon.add(bLight);

    beacon.userData = { isClickable: true, action: 'select_milestone', milestoneIndex: idx, label };
    scene.add(beacon);
    beaconNodes.push(beacon);
    interactiveObjects.push(beacon);
  });

  // Connecting constellation lines
  const linePoints: THREE.Vector3[] = [];
  beaconNodes.forEach((b) => linePoints.push(b.position.clone()));
  linePoints.push(beaconNodes[0].position.clone()); // Close loop
  const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMat = new THREE.LineBasicMaterial({ color: '#E1BEE7', transparent: true, opacity: 0.4 });
  const constLine = new THREE.Line(lineGeom, lineMat);
  scene.add(constLine);
  disposables.push(lineGeom, lineMat);

  // 4. Infinite Starfield & Nebula Particles
  const starCount = Math.floor(600 * quality.particleMultiplier);
  const starGeom = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const colorPalette = [
    new THREE.Color('#FF8DA1'),
    new THREE.Color('#BA68C8'),
    new THREE.Color('#80DEEA'),
    new THREE.Color('#FFF9C4'),
  ];

  for (let i = 0; i < starCount; i++) {
    const r = 12 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);

    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeom, starMat);
  scene.add(stars);
  disposables.push(starGeom, starMat);

  // Swirling heart particles around the core
  const heartTex = createHeartTexture('#FF4081', 64);
  disposables.push(heartTex);

  const heartParticleCount = Math.floor(40 * quality.particleMultiplier);
  const hpGeom = new THREE.BufferGeometry();
  const hpPos = new Float32Array(heartParticleCount * 3);
  for (let i = 0; i < heartParticleCount; i++) {
    const a = (i / heartParticleCount) * Math.PI * 2;
    const rad = 2.8 + Math.random() * 1.5;
    hpPos[i * 3] = Math.cos(a) * rad;
    hpPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
    hpPos[i * 3 + 2] = Math.sin(a) * rad;
  }
  hpGeom.setAttribute('position', new THREE.BufferAttribute(hpPos, 3));
  const hpMat = new THREE.PointsMaterial({
    size: 0.7,
    map: heartTex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const heartPoints = new THREE.Points(hpGeom, hpMat);
  scene.add(heartPoints);
  disposables.push(hpGeom, hpMat);

  // Pointer Down Raycasting
  const handlePointerDown = (
    _event: MouseEvent | TouchEvent,
    raycaster: THREE.Raycaster
  ): boolean => {
    const hits = raycaster.intersectObjects(interactiveObjects, true);
    if (hits.length > 0) {
      let target: THREE.Object3D | null = hits[0].object;
      while (target && !target.userData?.action && target.parent) {
        target = target.parent;
      }
      if (target?.userData?.action) {
        onInteract(target.userData.action, target.userData);
        return true;
      }
    }
    return false;
  };

  const resetCamera = () => {
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);
  };

  const update = (delta: number, elapsed: number) => {
    // Crystal heart rotation and gentle heartbeat pulse
    heartGroup.rotation.y = elapsed * 0.4;
    heartGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.15;
    const pulse = 1.0 + Math.sin(elapsed * 3.5) * 0.08;
    heartGroup.scale.set(pulse, pulse, pulse);
    heartLight.intensity = 2.5 + Math.sin(elapsed * 3.5) * 1.0;

    // Rings rotation
    ring1.rotation.z = elapsed * 0.2;
    ring2.rotation.z = -elapsed * 0.25;

    // Starfield subtle cosmic drift
    stars.rotation.y = elapsed * 0.02;

    // Swirling hearts around core
    heartPoints.rotation.y = -elapsed * 0.6;

    // Beacon crystals spinning
    beaconNodes.forEach((b, i) => {
      b.rotation.y += delta * (1.0 + i * 0.3);
      b.rotation.x += delta * 0.5;
    });
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  const getTerrainHeight = (_x: number, _z: number) => 0;

  if (ctx.collisionSystem) {
    ctx.collisionSystem.setCircularPerimeter(0, 0, 18);
  }

  return {
    update,
    dispose,
    resetCamera,
    getTerrainHeight,
    initialPlayerPos: new THREE.Vector3(0, 0, 6),
    onPointerDown: handlePointerDown,
  };
}
