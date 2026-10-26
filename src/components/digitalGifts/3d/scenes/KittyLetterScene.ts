import * as THREE from 'three';
import { DigitalGift } from '../../../../types/digitalGifts';
import { QualityConfig } from '../QualitySettings';
import { createHeartTexture, createWoodTexture } from '../ProceduralTextures';
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

export function createKittyLetterScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract, collisionSystem } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const defaultCamPos = new THREE.Vector3(0, 3.2, 6.8);
  const defaultTarget = new THREE.Vector3(0, 1.4, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 48;
  camera.updateProjectionMatrix();

  // Cozy pastel bedroom colors
  scene.background = new THREE.Color('#FFF5F7');
  scene.fog = new THREE.FogExp2('#FFEBEF', 0.038);

  // Lighting
  const hemiLight = new THREE.HemisphereLight('#FFF0F5', '#FCE4EC', 1.0);
  scene.add(hemiLight);

  const warmSunLight = new THREE.DirectionalLight('#FFF3E0', 1.8);
  warmSunLight.position.set(5, 8, 4);
  warmSunLight.castShadow = quality.shadows;
  if (quality.shadows) {
    warmSunLight.shadow.mapSize.width = 1024;
    warmSunLight.shadow.mapSize.height = 1024;
    warmSunLight.shadow.bias = -0.0005;
  }
  scene.add(warmSunLight);

  const getTerrainHeight = (_x: number, _z: number) => 0.0;

  // 1. Room Floor & Cozy Circular Rug
  const woodTex = createWoodTexture(256);
  disposables.push(woodTex);
  const floorGeom = new THREE.PlaneGeometry(16, 16);
  floorGeom.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: '#FFE0B2',
    roughness: 0.7,
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.receiveShadow = quality.shadows;
  scene.add(floor);
  disposables.push(floorGeom, floorMat);

  // Cozy Room Walls (Left, Right, Back)
  const roomWallMat = new THREE.MeshStandardMaterial({ color: '#FFF0F5', roughness: 0.8 });
  disposables.push(roomWallMat);

  const backWallGeom = new THREE.PlaneGeometry(16, 8);
  const backWall = new THREE.Mesh(backWallGeom, roomWallMat);
  backWall.position.set(0, 4, -7.9);
  backWall.receiveShadow = quality.shadows;
  scene.add(backWall);
  disposables.push(backWallGeom);

  const leftWallGeom = new THREE.PlaneGeometry(16, 8);
  leftWallGeom.rotateY(Math.PI / 2);
  const leftWall = new THREE.Mesh(leftWallGeom, roomWallMat);
  leftWall.position.set(-7.9, 4, 0);
  scene.add(leftWall);
  disposables.push(leftWallGeom);

  const rightWallGeom = new THREE.PlaneGeometry(16, 8);
  rightWallGeom.rotateY(-Math.PI / 2);
  const rightWall = new THREE.Mesh(rightWallGeom, roomWallMat);
  rightWall.position.set(7.9, 4, 0);
  scene.add(rightWall);
  disposables.push(rightWallGeom);

  // Fluffy Pastel Rug
  const rugGeom = new THREE.CylinderGeometry(3.6, 3.8, 0.08, 32);
  const rugMat = new THREE.MeshStandardMaterial({
    color: '#F8BBD0',
    roughness: 0.9,
  });
  const rug = new THREE.Mesh(rugGeom, rugMat);
  rug.position.set(0, 0.04, 0);
  rug.receiveShadow = quality.shadows;
  scene.add(rug);
  disposables.push(rugGeom, rugMat);

  // Cozy Velvet Cushion
  const cushionGeom = new THREE.CylinderGeometry(2.0, 2.3, 0.4, 24);
  const cushionMat = new THREE.MeshStandardMaterial({
    color: '#F48FB1',
    roughness: 0.7,
  });
  const cushion = new THREE.Mesh(cushionGeom, cushionMat);
  cushion.position.set(0, 0.28, 0);
  cushion.castShadow = quality.shadows;
  cushion.receiveShadow = quality.shadows;
  scene.add(cushion);
  disposables.push(cushionGeom, cushionMat);

  // 2. Cute Chibi Cat Model (_polybit_ reference)
  const kittyGroup = new THREE.Group();
  kittyGroup.position.set(-0.4, 0.5, 0);

  const furMat = new THREE.MeshStandardMaterial({
    color: '#FFF9FB',
    roughness: 0.6,
  });
  disposables.push(furMat);

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: '#FF80AB',
    roughness: 0.5,
  });
  disposables.push(innerEarMat);

  // Chubby Body
  const bodyGeom = new THREE.SphereGeometry(0.85, 20, 20);
  bodyGeom.scale(1, 1.15, 1);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.position.set(0, 0.8, 0);
  body.castShadow = quality.shadows;
  kittyGroup.add(body);
  disposables.push(bodyGeom);

  // Head with Chubby Cheeks
  const headGeom = new THREE.SphereGeometry(0.75, 20, 20);
  headGeom.scale(1.15, 1.0, 1.05);
  const head = new THREE.Mesh(headGeom, furMat);
  head.position.set(0, 1.85, 0.15);
  head.castShadow = quality.shadows;
  kittyGroup.add(head);
  disposables.push(headGeom);

  // Pointed Ears
  const earGeom = new THREE.ConeGeometry(0.3, 0.5, 4);
  disposables.push(earGeom);

  const earL = new THREE.Mesh(earGeom, furMat);
  earL.position.set(-0.55, 2.45, 0.1);
  earL.rotation.z = 0.35;
  earL.rotation.y = -0.2;
  kittyGroup.add(earL);

  const earR = new THREE.Mesh(earGeom, furMat);
  earR.position.set(0.55, 2.45, 0.1);
  earR.rotation.z = -0.35;
  earR.rotation.y = 0.2;
  kittyGroup.add(earR);

  // Big Cute Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1A1A1A' });
  const eyeGeom = new THREE.SphereGeometry(0.12, 12, 12);
  eyeGeom.scale(1, 1.25, 0.5);
  disposables.push(eyeMat, eyeGeom);

  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.35, 1.9, 0.85);
  kittyGroup.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(0.35, 1.9, 0.85);
  kittyGroup.add(eyeR);

  // Eye Highlights
  const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const eyeHlGeom = new THREE.SphereGeometry(0.04, 8, 8);
  disposables.push(eyeHighlightMat, eyeHlGeom);

  const hlL = new THREE.Mesh(eyeHlGeom, eyeHighlightMat);
  hlL.position.set(-0.32, 1.96, 0.92);
  kittyGroup.add(hlL);

  const hlR = new THREE.Mesh(eyeHlGeom, eyeHighlightMat);
  hlR.position.set(0.38, 1.96, 0.92);
  kittyGroup.add(hlR);

  // Cute Pink Nose & Mouth
  const noseGeom = new THREE.ConeGeometry(0.06, 0.08, 3);
  noseGeom.rotateX(Math.PI);
  const nose = new THREE.Mesh(noseGeom, innerEarMat);
  nose.position.set(0, 1.76, 0.92);
  kittyGroup.add(nose);
  disposables.push(noseGeom);

  // Blush on cheeks
  const blushMat = new THREE.MeshBasicMaterial({ color: '#FF80AB', transparent: true, opacity: 0.65 });
  const blushGeom = new THREE.CircleGeometry(0.14, 12);
  disposables.push(blushMat, blushGeom);

  const blushL = new THREE.Mesh(blushGeom, blushMat);
  blushL.position.set(-0.55, 1.7, 0.78);
  blushL.rotation.y = -0.4;
  kittyGroup.add(blushL);

  const blushR = new THREE.Mesh(blushGeom, blushMat);
  blushR.position.set(0.55, 1.7, 0.78);
  blushR.rotation.y = 0.4;
  kittyGroup.add(blushR);

  // Collar with Golden Bell
  const collarGeom = new THREE.TorusGeometry(0.68, 0.06, 8, 20);
  collarGeom.rotateX(Math.PI / 2);
  const collarMat = new THREE.MeshStandardMaterial({ color: '#E91E63' });
  const collar = new THREE.Mesh(collarGeom, collarMat);
  collar.position.set(0, 1.3, 0.05);
  kittyGroup.add(collar);
  disposables.push(collarGeom, collarMat);

  const bellGeom = new THREE.SphereGeometry(0.1, 10, 10);
  const bellMat = new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.9, roughness: 0.2 });
  const bell = new THREE.Mesh(bellGeom, bellMat);
  bell.position.set(0, 1.22, 0.72);
  kittyGroup.add(bell);
  disposables.push(bellGeom, bellMat);

  // Animated Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, -0.7),
    new THREE.Vector3(0.2, 0.8, -1.1),
    new THREE.Vector3(0.1, 1.4, -1.2),
  ]);
  const tailGeom = new THREE.TubeGeometry(tailCurve, 12, 0.1, 8, false);
  const tail = new THREE.Mesh(tailGeom, furMat);
  kittyGroup.add(tail);
  disposables.push(tailGeom);

  // Paws holding the letter
  const pawGeom = new THREE.SphereGeometry(0.18, 12, 12);
  pawGeom.scale(1, 0.8, 1.2);
  disposables.push(pawGeom);

  const pawL = new THREE.Mesh(pawGeom, furMat);
  pawL.position.set(-0.35, 0.85, 0.75);
  kittyGroup.add(pawL);

  const pawR = new THREE.Mesh(pawGeom, furMat);
  pawR.position.set(0.35, 0.85, 0.75);
  kittyGroup.add(pawR);

  kittyGroup.userData = { isClickable: true, action: 'pet_kitten' };
  body.userData = { isClickable: true, action: 'pet_kitten' };
  head.userData = { isClickable: true, action: 'pet_kitten' };
  scene.add(kittyGroup);
  interactiveObjects.push(kittyGroup, body, head);

  // 3. The Interactive Love Letter Envelope
  const letterGroup = new THREE.Group();
  letterGroup.position.set(0, 0.88, 1.05);
  letterGroup.rotation.x = Math.PI / 8;

  const envGeom = new THREE.BoxGeometry(1.4, 0.06, 0.95);
  const envMat = new THREE.MeshStandardMaterial({ color: '#FFF9C4', roughness: 0.4 });
  const envMesh = new THREE.Mesh(envGeom, envMat);
  envMesh.castShadow = quality.shadows;
  letterGroup.add(envMesh);
  disposables.push(envGeom, envMat);

  // Red Heart Wax Seal
  const sealGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
  const sealMat = new THREE.MeshStandardMaterial({ color: '#E91E63', roughness: 0.2 });
  const seal = new THREE.Mesh(sealGeom, sealMat);
  seal.position.set(0, 0.05, 0);
  letterGroup.add(seal);
  disposables.push(sealGeom, sealMat);

  // Heart aura
  const letterGlow = new THREE.PointLight('#FF4081', 1.2, 2.5);
  letterGlow.position.set(0, 0.3, 0);
  letterGroup.add(letterGlow);

  letterGroup.userData = { isClickable: true, action: 'open_letter' };
  envMesh.userData = { isClickable: true, action: 'open_letter' };
  seal.userData = { isClickable: true, action: 'open_letter' };
  scene.add(letterGroup);
  interactiveObjects.push(letterGroup, envMesh, seal);

  // 4. Room Furniture: Writing Desk & Bookshelf
  const deskGroup = new THREE.Group();
  deskGroup.position.set(-4.5, 0, -4.5);

  const deskTopGeom = new THREE.BoxGeometry(3.6, 0.15, 2.0);
  const deskTop = new THREE.Mesh(deskTopGeom, floorMat);
  deskTop.position.set(0, 2.0, 0);
  deskTop.castShadow = quality.shadows;
  deskGroup.add(deskTop);
  disposables.push(deskTopGeom);

  const legGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8);
  disposables.push(legGeom);
  [[-1.6, -0.8], [1.6, -0.8], [-1.6, 0.8], [1.6, 0.8]].forEach(([lx, lz]) => {
    const dLeg = new THREE.Mesh(legGeom, floorMat);
    dLeg.position.set(lx, 1.0, lz);
    dLeg.castShadow = quality.shadows;
    deskGroup.add(dLeg);
  });

  scene.add(deskGroup);

  // 5. SOLID ROOM COLLISION BOUNDARIES
  if (collisionSystem) {
    // Left, Right, Back, Front bounds
    collisionSystem.addBox(-10, -7.0, -10, 10);
    collisionSystem.addBox(7.0, 10, -10, 10);
    collisionSystem.addBox(-10, 10, -10, -7.0);
    collisionSystem.addBox(-10, 10, 7.0, 10);

    // Center Kitty Cushion
    collisionSystem.addCylinder(0, 0, 2.2);

    // Writing Desk
    collisionSystem.addBox(-6.5, -2.5, -5.8, -3.2);
  }

  // 6. Floating Heart Particles
  const particleCount = Math.floor(40 * quality.particleMultiplier);
  const heartTex = createHeartTexture('#FF4081', 64);
  disposables.push(heartTex);

  const pGeom = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 1] = 0.5 + Math.random() * 5;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.7,
    map: heartTex,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeom, pMat);
  scene.add(particles);
  disposables.push(pGeom, pMat);

  // Pointer interactions
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

  // Per-frame animation
  const update = (delta: number, elapsed: number) => {
    // Kitty head tilt & breathing
    head.rotation.z = Math.sin(elapsed * 1.5) * 0.08;
    body.position.y = 0.8 + Math.sin(elapsed * 2.0) * 0.02;

    // Tail wagging
    tail.rotation.y = Math.sin(elapsed * 3.5) * 0.25;

    // Letter hover
    letterGroup.position.y = 0.88 + Math.sin(elapsed * 2.5) * 0.03;

    // Particles drift
    const pos = pGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += delta * 0.35;
      if (pos[i * 3 + 1] > 6.0) {
        pos[i * 3 + 1] = 0.5;
      }
    }
    pGeom.attributes.position.needsUpdate = true;
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    update,
    dispose,
    resetCamera,
    getTerrainHeight,
    initialPlayerPos: new THREE.Vector3(0, 0, 3.8),
    onPointerDown: handlePointerDown,
  };
}
