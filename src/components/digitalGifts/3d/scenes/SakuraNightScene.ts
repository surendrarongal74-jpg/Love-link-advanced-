import * as THREE from 'three';
import { DigitalGift } from '../../../../types/digitalGifts';
import { QualityConfig } from '../QualitySettings';
import { createSakuraPetalTexture, createWoodTexture } from '../ProceduralTextures';

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

export function createSakuraNightScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const defaultCamPos = new THREE.Vector3(0, 4.5, 12);
  const defaultTarget = new THREE.Vector3(0, 2.2, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 50;
  camera.updateProjectionMatrix();

  // Anime Moonlight Night Sky
  scene.background = new THREE.Color('#0F0A1C');
  scene.fog = new THREE.FogExp2('#150E28', 0.024);

  // Lighting: Cool moonlight & warm lantern fills
  const hemiLight = new THREE.HemisphereLight('#C5CAE9', '#1A0E2A', 0.7);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight('#E8EAF6', 1.8);
  moonLight.position.set(-15, 25, -20);
  moonLight.castShadow = quality.shadows;
  if (quality.shadows) {
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.bias = -0.0005;
  }
  scene.add(moonLight);

  // Glowing Giant Full Moon in sky
  const moonGeom = new THREE.SphereGeometry(7, 32, 32);
  const moonMat = new THREE.MeshBasicMaterial({ color: '#FFFDE7' });
  const moon = new THREE.Mesh(moonGeom, moonMat);
  moon.position.set(-18, 22, -45);
  scene.add(moon);
  disposables.push(moonGeom, moonMat);

  // Moon Halo
  const moonHaloGeom = new THREE.RingGeometry(7.2, 14, 32);
  const moonHaloMat = new THREE.MeshBasicMaterial({
    color: '#E1BEE7',
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const moonHalo = new THREE.Mesh(moonHaloGeom, moonHaloMat);
  moonHalo.position.copy(moon.position);
  moonHalo.position.z += 0.5;
  scene.add(moonHalo);
  disposables.push(moonHaloGeom, moonHaloMat);

  // 1. Garden Ground & Reflective Water Pond
  const groundGeom = new THREE.PlaneGeometry(50, 50);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#1B2418',
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.position.set(0, 0, 0);
  ground.receiveShadow = quality.shadows;
  scene.add(ground);
  disposables.push(groundGeom, groundMat);

  // Reflective Koi Pond
  const pondGeom = new THREE.CircleGeometry(8, 32);
  pondGeom.rotateX(-Math.PI / 2);
  const pondMat = new THREE.MeshStandardMaterial({
    color: '#0D1B2A',
    roughness: 0.1,
    metalness: 0.8,
  });
  const pond = new THREE.Mesh(pondGeom, pondMat);
  pond.position.set(0, 0.05, 0);
  pond.receiveShadow = quality.shadows;
  scene.add(pond);
  disposables.push(pondGeom, pondMat);

  // 2. Procedural Arched Wooden Bridge
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 0.1, 0);

  const woodTex = createWoodTexture(256);
  disposables.push(woodTex);
  const bridgeMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: '#8D4024',
    roughness: 0.5,
  });
  disposables.push(bridgeMat);

  // Curved Plank Deck
  const bridgeDeckGeom = new THREE.CylinderGeometry(8.2, 8.2, 2.2, 24, 1, true, -Math.PI / 6, Math.PI / 3);
  bridgeDeckGeom.rotateZ(Math.PI / 2);
  const bridgeDeck = new THREE.Mesh(bridgeDeckGeom, bridgeMat);
  bridgeDeck.position.set(0, -6.5, 0);
  bridgeDeck.castShadow = quality.shadows;
  bridgeDeck.receiveShadow = quality.shadows;
  bridgeGroup.add(bridgeDeck);
  disposables.push(bridgeDeckGeom);

  // Red Railings
  const redRailMat = new THREE.MeshStandardMaterial({ color: '#C62828', roughness: 0.4 });
  disposables.push(redRailMat);
  const railGeom = new THREE.TorusGeometry(8.2, 0.08, 8, 24, Math.PI / 3);
  railGeom.rotateZ(Math.PI / 3);
  const railL = new THREE.Mesh(railGeom, redRailMat);
  railL.position.set(0, -6.5, -1.05);
  railL.rotation.y = Math.PI / 2;
  bridgeGroup.add(railL);
  const railR = new THREE.Mesh(railGeom, redRailMat);
  railR.position.set(0, -6.5, 1.05);
  railR.rotation.y = Math.PI / 2;
  bridgeGroup.add(railR);
  disposables.push(railGeom);

  scene.add(bridgeGroup);

  // 3. Iconic Vermilion Torii Gate at the far side
  const toriiGroup = new THREE.Group();
  toriiGroup.position.set(0, 0, -9);

  const toriiMat = new THREE.MeshStandardMaterial({ color: '#D32F2F', roughness: 0.3 });
  disposables.push(toriiMat);
  const blackMat = new THREE.MeshStandardMaterial({ color: '#212121', roughness: 0.5 });
  disposables.push(blackMat);

  // Left & Right Pillars
  const pillarGeom = new THREE.CylinderGeometry(0.35, 0.4, 7, 12);
  disposables.push(pillarGeom);
  const pillarL = new THREE.Mesh(pillarGeom, toriiMat);
  pillarL.position.set(-3.2, 3.5, 0);
  pillarL.castShadow = quality.shadows;
  toriiGroup.add(pillarL);

  const pillarR = new THREE.Mesh(pillarGeom, toriiMat);
  pillarR.position.set(3.2, 3.5, 0);
  pillarR.castShadow = quality.shadows;
  toriiGroup.add(pillarR);

  // Top Lintels (Kasagi)
  const topLintelGeom = new THREE.BoxGeometry(8.5, 0.6, 0.7);
  const topLintel = new THREE.Mesh(topLintelGeom, toriiMat);
  topLintel.position.set(0, 6.8, 0);
  topLintel.castShadow = quality.shadows;
  toriiGroup.add(topLintel);
  disposables.push(topLintelGeom);

  const blackRoofGeom = new THREE.BoxGeometry(8.9, 0.2, 0.9);
  const blackRoof = new THREE.Mesh(blackRoofGeom, blackMat);
  blackRoof.position.set(0, 7.2, 0);
  toriiGroup.add(blackRoof);
  disposables.push(blackRoofGeom);

  const subLintelGeom = new THREE.BoxGeometry(7.2, 0.45, 0.5);
  const subLintel = new THREE.Mesh(subLintelGeom, toriiMat);
  subLintel.position.set(0, 5.8, 0);
  toriiGroup.add(subLintel);
  disposables.push(subLintelGeom);

  scene.add(toriiGroup);

  // 4. Procedural Blooming Sakura Trees
  function createSakuraTree(x: number, z: number, scale = 1) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Gnarled Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#3E2723', roughness: 0.9 });
    disposables.push(trunkMat);

    const trunkGeom = new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 4.5 * scale, 8);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.set(0, 2.25 * scale, 0);
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    trunk.castShadow = quality.shadows;
    treeGroup.add(trunk);
    disposables.push(trunkGeom);

    // Pink Floral Foliage Clusters
    const foliageMat = new THREE.MeshStandardMaterial({
      color: '#F8BBD0',
      roughness: 0.8,
    });
    disposables.push(foliageMat);

    const offsets = [
      [0, 4.6, 0, 2.6],
      [-1.5, 4.0, 0.8, 2.0],
      [1.6, 4.2, -0.6, 2.2],
      [0.8, 4.8, 1.2, 1.8],
      [-0.8, 5.2, -1.0, 1.9],
    ];

    offsets.forEach(([ox, oy, oz, r]) => {
      const fGeom = new THREE.SphereGeometry(r * scale, 12, 10);
      disposables.push(fGeom);
      const fMesh = new THREE.Mesh(fGeom, foliageMat);
      fMesh.position.set(ox * scale, oy * scale, oz * scale);
      fMesh.castShadow = quality.shadows;
      treeGroup.add(fMesh);
    });

    scene.add(treeGroup);
  }

  createSakuraTree(-6.5, -4, 1.1);
  createSakuraTree(6.8, -3, 1.2);
  createSakuraTree(-7.5, 4, 0.9);

  // 5. Floating Glowing Water Lanterns
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#FFE082',
    emissive: '#FFB300',
    emissiveIntensity: 0.8,
  });
  disposables.push(lanternMat);
  const lanternGeom = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  disposables.push(lanternGeom);

  const waterLanterns: THREE.Group[] = [];
  const lanternCoords = [
    [-3, 2],
    [3.5, 1.5],
    [-2, -3],
    [2, -2.5],
  ];

  lanternCoords.forEach(([lx, lz], i) => {
    const lGroup = new THREE.Group();
    lGroup.position.set(lx, 0.35, lz);

    const lMesh = new THREE.Mesh(lanternGeom, lanternMat);
    lGroup.add(lMesh);

    const lLight = new THREE.PointLight('#FFA726', 1.2, 5);
    lLight.position.set(0, 0.5, 0);
    lGroup.add(lLight);

    waterLanterns.push(lGroup);
    scene.add(lGroup);
  });

  // 6. Interactive Floating Romantic Love Scroll in the center
  const scrollGroup = new THREE.Group();
  scrollGroup.position.set(0, 2.4, 2.0);

  const scrollGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.6, 16);
  const scrollMat = new THREE.MeshStandardMaterial({
    color: '#FFF8E1',
    roughness: 0.3,
  });
  const scrollMesh = new THREE.Mesh(scrollGeom, scrollMat);
  scrollMesh.rotation.z = Math.PI / 2;
  scrollGroup.add(scrollMesh);
  disposables.push(scrollGeom, scrollMat);

  // Gold scroll ends
  const endGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  const endMat = new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.8 });
  disposables.push(endGeom, endMat);
  const endL = new THREE.Mesh(endGeom, endMat);
  endL.position.set(-0.9, 0, 0);
  endL.rotation.z = Math.PI / 2;
  scrollGroup.add(endL);
  const endR = new THREE.Mesh(endGeom, endMat);
  endR.position.set(0.9, 0, 0);
  endR.rotation.z = Math.PI / 2;
  scrollGroup.add(endR);

  // Glowing Aura
  const scrollGlow = new THREE.PointLight('#FF80AB', 1.6, 4);
  scrollGroup.add(scrollGlow);

  scrollGroup.userData = { isClickable: true, action: 'open_scroll' };
  scrollMesh.userData = { isClickable: true, action: 'open_scroll' };
  scene.add(scrollGroup);
  interactiveObjects.push(scrollGroup, scrollMesh);

  // 7. Swirling 3D Sakura Petal Particles
  const petalCount = Math.floor(90 * quality.particleMultiplier);
  const petalTex = createSakuraPetalTexture(64);
  disposables.push(petalTex);

  const petalGeom = new THREE.BufferGeometry();
  const petalPos = new Float32Array(petalCount * 3);
  const petalVels = new Float32Array(petalCount * 3);

  for (let i = 0; i < petalCount; i++) {
    petalPos[i * 3] = (Math.random() - 0.5) * 20;
    petalPos[i * 3 + 1] = 0.5 + Math.random() * 9;
    petalPos[i * 3 + 2] = (Math.random() - 0.5) * 20;

    petalVels[i * 3] = 0.4 + Math.random() * 0.6; // Wind blowing right
    petalVels[i * 3 + 1] = -(0.3 + Math.random() * 0.4); // Drifting down
    petalVels[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  petalGeom.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));

  const petalMat = new THREE.PointsMaterial({
    size: 0.65,
    map: petalTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const petals = new THREE.Points(petalGeom, petalMat);
  scene.add(petals);
  disposables.push(petalGeom, petalMat);

  // Raycasting
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
        onInteract(target.userData.action);
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
    // Scroll hover and spin
    scrollGroup.position.y = 2.4 + Math.sin(elapsed * 2.5) * 0.15;
    scrollGroup.rotation.y = elapsed * 0.5;

    // Water lanterns bobbing
    waterLanterns.forEach((l, idx) => {
      l.position.y = 0.35 + Math.sin(elapsed * 2 + idx) * 0.05;
      l.rotation.y = Math.sin(elapsed * 0.8 + idx) * 0.15;
    });

    // Petal wind particle physics
    const pos = petalGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < petalCount; i++) {
      pos[i * 3] += petalVels[i * 3] * delta;
      pos[i * 3 + 1] += petalVels[i * 3 + 1] * delta;
      pos[i * 3 + 2] += (petalVels[i * 3 + 2] + Math.sin(elapsed * 2 + i) * 0.2) * delta;

      // Wrap around when falling to ground or blowing past edge
      if (pos[i * 3 + 1] < 0.1 || pos[i * 3] > 12) {
        pos[i * 3] = -12 + (Math.random() - 0.5) * 4;
        pos[i * 3 + 1] = 7 + Math.random() * 3;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
    }
    petalGeom.attributes.position.needsUpdate = true;
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  const getTerrainHeight = (_x: number, _z: number) => 0.5;

  if (ctx.collisionSystem) {
    ctx.collisionSystem.setCircularPerimeter(0, 0, 11.5);
    // Torii gate pillars
    ctx.collisionSystem.addCylinder(-2.4, 6.0, 0.4);
    ctx.collisionSystem.addCylinder(2.4, 6.0, 0.4);
    // Shrine terrace altar
    ctx.collisionSystem.addBox(-2.5, 2.5, -5.5, -2.5);
  }

  return {
    update,
    dispose,
    resetCamera,
    getTerrainHeight,
    initialPlayerPos: new THREE.Vector3(0, 0.5, 3.5),
    onPointerDown: handlePointerDown,
  };
}
