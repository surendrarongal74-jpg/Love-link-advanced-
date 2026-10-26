import * as THREE from 'three';
import { DigitalGift, GiftPhotoItem } from '../../../../types/digitalGifts';
import { QualityConfig } from '../QualitySettings';
import {
  createWoodTexture,
  createLetterParchmentTexture,
  createFallbackArtworkTexture,
} from '../ProceduralTextures';

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

export function createMemoryArchiveScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const defaultCamPos = new THREE.Vector3(0, 3.8, 5.2);
  const defaultTarget = new THREE.Vector3(0, 1.4, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 46;
  camera.updateProjectionMatrix();

  // Cozy warm study atmosphere
  scene.background = new THREE.Color('#1A101C');
  scene.fog = new THREE.FogExp2('#1A101C', 0.04);

  // Lighting
  const hemiLight = new THREE.HemisphereLight('#FFF3E0', '#2B1A2E', 0.65);
  scene.add(hemiLight);

  // 1. Rich Mahogany Wooden Desk
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, 0);

  const woodTex = createWoodTexture(512);
  disposables.push(woodTex);

  // Desk top surface
  const deskTopGeom = new THREE.BoxGeometry(6.4, 0.25, 4.2);
  const deskMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.35,
    metalness: 0.1,
  });
  const deskTop = new THREE.Mesh(deskTopGeom, deskMat);
  deskTop.position.set(0, 1.4, 0);
  deskTop.castShadow = quality.shadows;
  deskTop.receiveShadow = quality.shadows;
  deskGroup.add(deskTop);
  disposables.push(deskTopGeom, deskMat);

  // Desk Legs
  const legGeom = new THREE.CylinderGeometry(0.12, 0.08, 1.4, 12);
  disposables.push(legGeom);
  const legMat = new THREE.MeshStandardMaterial({ color: '#3E2723', roughness: 0.6 });
  disposables.push(legMat);
  const legCoords = [
    [-2.9, -1.8],
    [2.9, -1.8],
    [-2.9, 1.8],
    [2.9, 1.8],
  ];
  legCoords.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(lx, 0.7, lz);
    leg.castShadow = quality.shadows;
    deskGroup.add(leg);
  });

  scene.add(deskGroup);

  // 2. Vintage Banker's Desk Lamp with Emerald Glass Shade
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-2.0, 1.52, -1.0);

  // Brass base
  const lampBaseGeom = new THREE.CylinderGeometry(0.35, 0.4, 0.1, 16);
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#D4AF37',
    metalness: 0.85,
    roughness: 0.25,
  });
  const lampBase = new THREE.Mesh(lampBaseGeom, brassMat);
  lampGroup.add(lampBase);
  disposables.push(lampBaseGeom, brassMat);

  // Brass Stem
  const stemGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
  const stem = new THREE.Mesh(stemGeom, brassMat);
  stem.position.set(0, 0.55, 0);
  lampGroup.add(stem);
  disposables.push(stemGeom);

  // Green glass shade
  const shadeGeom = new THREE.CylinderGeometry(0.22, 0.35, 0.8, 16, 1, false, 0, Math.PI);
  shadeGeom.rotateZ(Math.PI / 2);
  shadeGeom.rotateY(-Math.PI / 2);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#004D40',
    emissive: '#1B5E20',
    emissiveIntensity: 0.3,
    roughness: 0.2,
    transmission: 0.6,
    transparent: true,
  });
  const shade = new THREE.Mesh(shadeGeom, glassMat);
  shade.position.set(0, 1.1, 0);
  lampGroup.add(shade);
  disposables.push(shadeGeom, glassMat);

  // Warm Desk Spotlight under lamp
  const deskSpot = new THREE.SpotLight('#FFE082', 3.0, 6, Math.PI / 3, 0.5);
  deskSpot.position.set(0, 1.1, 0);
  deskSpot.target.position.set(0.5, 0, 0.5);
  lampGroup.add(deskSpot);
  lampGroup.add(deskSpot.target);

  scene.add(lampGroup);

  // 3. Open Antique Leather Memory Scrapbook
  const bookGroup = new THREE.Group();
  bookGroup.position.set(-0.2, 1.55, -0.4);
  bookGroup.rotation.y = 0.08;

  // Leather cover
  const coverGeom = new THREE.BoxGeometry(2.2, 0.05, 1.5);
  const leatherMat = new THREE.MeshStandardMaterial({ color: '#4E342E', roughness: 0.7 });
  const cover = new THREE.Mesh(coverGeom, leatherMat);
  bookGroup.add(cover);
  disposables.push(coverGeom, leatherMat);

  // Parchment Pages with handwritten dedication
  const parchmentTex = createLetterParchmentTexture(
    gift.creatorName || 'Your Love',
    gift.recipientName || 'My Beloved',
    gift.content?.message || 'Every memory written in these pages holds our forever.'
  );
  disposables.push(parchmentTex);

  const pageGeom = new THREE.PlaneGeometry(2.0, 1.35);
  pageGeom.rotateX(-Math.PI / 2);
  const pageMat = new THREE.MeshStandardMaterial({ map: parchmentTex, roughness: 0.5 });
  const page = new THREE.Mesh(pageGeom, pageMat);
  page.position.set(0, 0.03, 0);
  bookGroup.add(page);
  disposables.push(pageGeom, pageMat);

  bookGroup.userData = { isClickable: true, action: 'open_scrapbook' };
  page.userData = { isClickable: true, action: 'open_scrapbook' };
  cover.userData = { isClickable: true, action: 'open_scrapbook' };
  scene.add(bookGroup);
  interactiveObjects.push(bookGroup, page, cover);

  // 4. Inspectable 3D Polaroid Photo Cards Scattered on Desk
  const photos: GiftPhotoItem[] = gift.content?.photos?.length
    ? gift.content.photos
    : [
        { id: 'p1', url: '', caption: 'The smile that stole my heart forever.', date: 'Our Beginning' },
        { id: 'p2', url: '', caption: 'Stargazing until midnight on the roof.', date: 'Midnight Dream' },
        { id: 'p3', url: '', caption: 'Holding hands across chilly winter avenues.', date: 'Winter Glow' },
      ];

  const polaroidGroup = new THREE.Group();
  const textureLoader = new THREE.TextureLoader();

  photos.forEach((photo, idx) => {
    const card = new THREE.Group();
    // Scatter cards naturally on the desk
    const offsetX = 1.4 + (idx % 2 === 0 ? 0.3 : -0.2) + idx * 0.15;
    const offsetZ = 0.4 + (idx - 1) * 0.6;
    const rotZ = (idx * 0.22 - 0.2);

    card.position.set(offsetX, 1.55 + idx * 0.02, offsetZ);
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = rotZ;

    // White Polaroid frame
    const frameGeom = new THREE.PlaneGeometry(1.2, 1.45);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4 });
    const frameMesh = new THREE.Mesh(frameGeom, frameMat);
    frameMesh.castShadow = quality.shadows;
    card.add(frameMesh);
    disposables.push(frameGeom, frameMat);

    // Photo window inside
    let photoTex: THREE.Texture;
    if (photo.url && photo.url.startsWith('http')) {
      photoTex = textureLoader.load(
        photo.url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.needsUpdate = true;
        },
        undefined,
        () => {
          artMat.map = createFallbackArtworkTexture(photo.caption || '', idx);
          artMat.needsUpdate = true;
        }
      );
    } else {
      photoTex = createFallbackArtworkTexture(photo.caption || '', idx);
    }
    disposables.push(photoTex);

    const artGeom = new THREE.PlaneGeometry(1.0, 1.0);
    const artMat = new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.5 });
    const artMesh = new THREE.Mesh(artGeom, artMat);
    artMesh.position.set(0, 0.12, 0.005);
    card.add(artMesh);
    disposables.push(artGeom, artMat);

    card.userData = { isClickable: true, action: 'inspect_polaroid', photo, index: idx };
    frameMesh.userData = { isClickable: true, action: 'inspect_polaroid', photo, index: idx };
    artMesh.userData = { isClickable: true, action: 'inspect_polaroid', photo, index: idx };

    polaroidGroup.add(card);
    interactiveObjects.push(card, frameMesh, artMesh);
  });

  scene.add(polaroidGroup);

  // 5. Glowing Glass Memory Jar
  const jarGroup = new THREE.Group();
  jarGroup.position.set(2.2, 1.53, -1.1);

  const jarGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
  const jarMat = new THREE.MeshPhysicalMaterial({
    color: '#E0F7FA',
    transmission: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const jar = new THREE.Mesh(jarGeom, jarMat);
  jar.position.set(0, 0.45, 0);
  jarGroup.add(jar);
  disposables.push(jarGeom, jarMat);

  // Cork stopper
  const corkGeom = new THREE.CylinderGeometry(0.3, 0.34, 0.16, 12);
  const corkMat = new THREE.MeshStandardMaterial({ color: '#8D6E63' });
  const cork = new THREE.Mesh(corkGeom, corkMat);
  cork.position.set(0, 0.95, 0);
  jarGroup.add(cork);
  disposables.push(corkGeom, corkMat);

  // Trapped glowing starlight motes inside jar
  const jarLight = new THREE.PointLight('#FF4081', 1.6, 3);
  jarLight.position.set(0, 0.5, 0);
  jarGroup.add(jarLight);

  jarGroup.userData = { isClickable: true, action: 'open_memory_jar' };
  jar.userData = { isClickable: true, action: 'open_memory_jar' };
  scene.add(jarGroup);
  interactiveObjects.push(jarGroup, jar);

  // Floating room dust / ember particles
  const particleCount = Math.floor(40 * quality.particleMultiplier);
  const pGeom = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 5;
    pPos[i * 3 + 1] = 1.5 + Math.random() * 2.5;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.08,
    color: '#FFE082',
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeom, pMat);
  scene.add(particles);
  disposables.push(pGeom, pMat);

  // Raycasting Click
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
    // Memory jar pulsing light
    jarLight.intensity = 1.4 + Math.sin(elapsed * 3) * 0.5;

    // Gentle dust float
    const pos = pGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += Math.sin(elapsed + i) * delta * 0.08;
    }
    pGeom.attributes.position.needsUpdate = true;
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  const getTerrainHeight = (_x: number, _z: number) => 0;

  if (ctx.collisionSystem) {
    ctx.collisionSystem.setCircularPerimeter(0, 0, 8.5);
    ctx.collisionSystem.addBox(-3.6, 3.6, -2.4, 2.4);
  }

  return {
    update,
    dispose,
    resetCamera,
    getTerrainHeight,
    initialPlayerPos: new THREE.Vector3(0, 0, 3.2),
    onPointerDown: handlePointerDown,
  };
}
