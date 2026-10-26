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

export function createParisTogetherScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract, collisionSystem } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  const defaultCamPos = new THREE.Vector3(0, 3.8, 8.5);
  const defaultTarget = new THREE.Vector3(0, 2.0, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 50;
  camera.updateProjectionMatrix();

  // Romantic Twilight Parisian Sky
  scene.background = new THREE.Color('#1F1433');
  scene.fog = new THREE.FogExp2('#2A183D', 0.022);

  // Lighting
  const hemiLight = new THREE.HemisphereLight('#FFB6C1', '#1A0E2E', 0.9);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight('#E0E7FF', 1.2);
  moonLight.position.set(-15, 25, 20);
  moonLight.castShadow = quality.shadows;
  if (quality.shadows) {
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.bias = -0.0005;
  }
  scene.add(moonLight);

  const getTerrainHeight = (_x: number, _z: number) => 1.0;

  // 1. Parisian Cobblestone Terrace & Boulevard Floor
  const terraceGeom = new THREE.BoxGeometry(28, 1.0, 24);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#D8C3B5',
    roughness: 0.75,
  });
  const terrace = new THREE.Mesh(terraceGeom, stoneMat);
  terrace.position.set(0, 0.5, 0);
  terrace.receiveShadow = quality.shadows;
  scene.add(terrace);
  disposables.push(terraceGeom, stoneMat);

  // Balustrade overlooking the Seine and Eiffel Tower (Front railing)
  const railMat = new THREE.MeshStandardMaterial({ color: '#2B2B2B', metalness: 0.8, roughness: 0.3 });
  disposables.push(railMat);

  // Curved balustrade railing
  const balustradeGroup = new THREE.Group();
  balustradeGroup.position.set(0, 1.0, 9.5);

  const topRailGeom = new THREE.BoxGeometry(24, 0.12, 0.25);
  const topRail = new THREE.Mesh(topRailGeom, railMat);
  topRail.position.set(0, 1.1, 0);
  topRail.castShadow = quality.shadows;
  balustradeGroup.add(topRail);
  disposables.push(topRailGeom);

  // Baluster posts
  const postGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
  disposables.push(postGeom);
  for (let rx = -11.5; rx <= 11.5; rx += 0.8) {
    const post = new THREE.Mesh(postGeom, railMat);
    post.position.set(rx, 0.55, 0);
    post.castShadow = quality.shadows;
    balustradeGroup.add(post);
  }
  scene.add(balustradeGroup);

  // 2. Haussmann-Style Building Block (kingdome & maheylah references)
  // Background street architecture behind terrace
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(0, 1.0, -10.5);

  const haussmannMat = new THREE.MeshStandardMaterial({
    color: '#EFEBE9', // Parisian limestone cream
    roughness: 0.6,
  });
  disposables.push(haussmannMat);

  const roofMat = new THREE.MeshStandardMaterial({
    color: '#455A64', // Parisian zinc slate blue-gray
    roughness: 0.4,
    metalness: 0.4,
  });
  disposables.push(roofMat);

  // Main facade body
  const facadeGeom = new THREE.BoxGeometry(26, 12, 3);
  const facade = new THREE.Mesh(facadeGeom, haussmannMat);
  facade.position.set(0, 6, 0);
  facade.castShadow = quality.shadows;
  facade.receiveShadow = quality.shadows;
  buildingGroup.add(facade);
  disposables.push(facadeGeom);

  // Zinc Mansard Roof
  const roofGeom = new THREE.CylinderGeometry(11, 13, 3.5, 4);
  roofGeom.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 13.5, 0);
  roof.scale.set(1.0, 1.0, 0.25);
  buildingGroup.add(roof);
  disposables.push(roofGeom);

  // French Windows with warm glowing interior lights & wrought-iron balconies
  const windowGeom = new THREE.BoxGeometry(1.2, 1.8, 0.1);
  const windowMat = new THREE.MeshBasicMaterial({ color: '#FFE082' });
  disposables.push(windowGeom, windowMat);

  const balconyGeom = new THREE.BoxGeometry(1.5, 0.5, 0.4);
  disposables.push(balconyGeom);

  for (let floor = 1; floor <= 2; floor++) {
    const wy = floor * 3.4;
    for (let wx = -10; wx <= 10; wx += 3.5) {
      const win = new THREE.Mesh(windowGeom, windowMat);
      win.position.set(wx, wy, 1.55);
      buildingGroup.add(win);

      const balc = new THREE.Mesh(balconyGeom, railMat);
      balc.position.set(wx, wy - 0.7, 1.7);
      balc.castShadow = quality.shadows;
      buildingGroup.add(balc);
    }
  }

  // 3. Cafe OZ Ground Floor Terrace (alban reference)
  // Striped awning canopy over cafe storefront
  const awningGeom = new THREE.BoxGeometry(12, 0.1, 2.5);
  awningGeom.rotateX(Math.PI / 10);
  const awningMat = new THREE.MeshStandardMaterial({
    color: '#C62828', // Classic Parisian bistro red
    roughness: 0.6,
  });
  const awning = new THREE.Mesh(awningGeom, awningMat);
  awning.position.set(0, 3.6, 2.5);
  awning.castShadow = quality.shadows;
  buildingGroup.add(awning);
  disposables.push(awningGeom, awningMat);

  // Cafe OZ Signboard
  const cafeSignCanvas = document.createElement('canvas');
  cafeSignCanvas.width = 256;
  cafeSignCanvas.height = 64;
  const cCtx = cafeSignCanvas.getContext('2d');
  if (cCtx) {
    cCtx.fillStyle = '#1A1A1A';
    cCtx.fillRect(0, 0, 256, 64);
    cCtx.strokeStyle = '#D4AF37';
    cCtx.lineWidth = 4;
    cCtx.strokeRect(3, 3, 250, 58);

    cCtx.fillStyle = '#FFE082';
    cCtx.font = 'bold 24px Georgia, serif';
    cCtx.textAlign = 'center';
    cCtx.fillText('CAFÉ DE PARIS', 128, 42);
  }
  const cafeSignTex = new THREE.CanvasTexture(cafeSignCanvas);
  cafeSignTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(cafeSignTex);

  const signMeshGeom = new THREE.PlaneGeometry(3.5, 0.9);
  const signMeshMat = new THREE.MeshBasicMaterial({ map: cafeSignTex });
  const cafeSign = new THREE.Mesh(signMeshGeom, signMeshMat);
  cafeSign.position.set(0, 4.3, 1.6);
  buildingGroup.add(cafeSign);
  disposables.push(signMeshGeom, signMeshMat);

  scene.add(buildingGroup);

  // 4. Parisian Lampposts (edemaistre reference)
  function createParisianLamppost(x: number, z: number) {
    const postGroup = new THREE.Group();
    postGroup.position.set(x, 1.0, z);

    // Fluted cast-iron column
    const baseGeom = new THREE.CylinderGeometry(0.3, 0.38, 0.6, 8);
    const base = new THREE.Mesh(baseGeom, railMat);
    base.position.set(0, 0.3, 0);
    postGroup.add(base);
    disposables.push(baseGeom);

    const shaftGeom = new THREE.CylinderGeometry(0.1, 0.14, 3.5, 10);
    const shaft = new THREE.Mesh(shaftGeom, railMat);
    shaft.position.set(0, 2.3, 0);
    shaft.castShadow = quality.shadows;
    postGroup.add(shaft);
    disposables.push(shaftGeom);

    // Six-sided Lantern
    const lanternGeom = new THREE.CylinderGeometry(0.32, 0.22, 0.65, 6);
    const lanternMat = new THREE.MeshPhysicalMaterial({
      color: '#FFE082',
      transmission: 0.8,
      opacity: 0.9,
      roughness: 0.1,
    });
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(0, 4.3, 0);
    postGroup.add(lantern);
    disposables.push(lanternGeom, lanternMat);

    // Lantern Cap & Finial
    const capGeom = new THREE.ConeGeometry(0.36, 0.35, 6);
    const cap = new THREE.Mesh(capGeom, railMat);
    cap.position.set(0, 4.8, 0);
    postGroup.add(cap);
    disposables.push(capGeom);

    // Warm Amber Streetlight
    const light = new THREE.PointLight('#FFA726', 1.8, 10);
    light.position.set(0, 4.3, 0);
    postGroup.add(light);

    scene.add(postGroup);

    if (collisionSystem) {
      collisionSystem.addCylinder(x, z, 0.5);
    }
  }

  createParisianLamppost(-6.5, 7.5);
  createParisianLamppost(6.5, 7.5);
  createParisianLamppost(-9.0, -1.0);
  createParisianLamppost(9.0, -1.0);

  // 5. Arc de Triomphe in distant skyline (HoangHiepVu reference)
  const arcGroup = new THREE.Group();
  arcGroup.position.set(-35, 0, -55);
  arcGroup.rotation.y = Math.PI / 6;

  const arcMat = new THREE.MeshStandardMaterial({
    color: '#D7CCC8',
    roughness: 0.7,
  });
  disposables.push(arcMat);

  // Left & right pillars
  const arcPillarGeom = new THREE.BoxGeometry(4.5, 16, 5);
  disposables.push(arcPillarGeom);
  const pL = new THREE.Mesh(arcPillarGeom, arcMat);
  pL.position.set(-5, 8, 0);
  const pR = new THREE.Mesh(arcPillarGeom, arcMat);
  pR.position.set(5, 8, 0);
  arcGroup.add(pL, pR);

  // Upper attic entablature
  const arcAtticGeom = new THREE.BoxGeometry(15, 6, 6);
  disposables.push(arcAtticGeom);
  const attic = new THREE.Mesh(arcAtticGeom, arcMat);
  attic.position.set(0, 19, 0);
  arcGroup.add(attic);

  scene.add(arcGroup);

  // 6. Detailed Eiffel Tower with Lattice & Beacon (Lambo_SC04 reference)
  const towerGroup = new THREE.Group();
  towerGroup.position.set(12, 0, -65);

  const towerMat = new THREE.MeshBasicMaterial({
    color: '#FFA726',
    wireframe: true,
  });
  disposables.push(towerMat);

  // Base tier arch
  const baseTierGeom = new THREE.CylinderGeometry(5, 12, 16, 4);
  const baseTier = new THREE.Mesh(baseTierGeom, towerMat);
  baseTier.position.set(0, 8, 0);
  towerGroup.add(baseTier);
  disposables.push(baseTierGeom);

  // Platform 1
  const plat1Geom = new THREE.BoxGeometry(12, 1.2, 12);
  const plat1 = new THREE.Mesh(plat1Geom, towerMat);
  plat1.position.set(0, 16.5, 0);
  towerGroup.add(plat1);
  disposables.push(plat1Geom);

  // Middle tier
  const midTierGeom = new THREE.CylinderGeometry(3, 6, 18, 4);
  const midTier = new THREE.Mesh(midTierGeom, towerMat);
  midTier.position.set(0, 26, 0);
  towerGroup.add(midTier);
  disposables.push(midTierGeom);

  // Platform 2
  const plat2Geom = new THREE.BoxGeometry(6, 1.0, 6);
  const plat2 = new THREE.Mesh(plat2Geom, towerMat);
  plat2.position.set(0, 35.5, 0);
  towerGroup.add(plat2);
  disposables.push(plat2Geom);

  // Top Spire
  const spireGeom = new THREE.ConeGeometry(2.0, 24, 4);
  const spire = new THREE.Mesh(spireGeom, towerMat);
  spire.position.set(0, 48, 0);
  towerGroup.add(spire);
  disposables.push(spireGeom);

  // Sparkling beacon atop Eiffel Tower
  const beaconLight = new THREE.PointLight('#FFF8E1', 3.5, 150);
  beaconLight.position.set(0, 60, 0);
  towerGroup.add(beaconLight);

  scene.add(towerGroup);

  // 7. Romantic Bistro Table & Chairs in Center of Terrace
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, 1.0, 2.0);

  const tableTopGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 32);
  const woodTex = createWoodTexture(256);
  disposables.push(woodTex);
  const tableTopMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.35,
  });
  const tableTop = new THREE.Mesh(tableTopGeom, tableTopMat);
  tableTop.position.set(0, 1.6, 0);
  tableTop.castShadow = quality.shadows;
  tableTop.receiveShadow = quality.shadows;
  tableGroup.add(tableTop);
  disposables.push(tableTopGeom, tableTopMat);

  const tableStemGeom = new THREE.CylinderGeometry(0.12, 0.16, 1.6, 12);
  const tableStem = new THREE.Mesh(tableStemGeom, railMat);
  tableStem.position.set(0, 0.8, 0);
  tableStem.castShadow = quality.shadows;
  tableGroup.add(tableStem);
  disposables.push(tableStemGeom);

  const tableBaseGeom = new THREE.CylinderGeometry(0.9, 1.0, 0.08, 16);
  const tableBase = new THREE.Mesh(tableBaseGeom, railMat);
  tableBase.position.set(0, 0.04, 0);
  tableGroup.add(tableBase);
  disposables.push(tableBaseGeom);

  // Bistro Chairs
  function createBistroChair(x: number, z: number, rotY: number) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x, 1.0, z);
    chairGroup.rotation.y = rotY;

    const seatGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16);
    const seat = new THREE.Mesh(seatGeom, railMat);
    seat.position.set(0, 1.0, 0);
    seat.castShadow = quality.shadows;
    chairGroup.add(seat);
    disposables.push(seatGeom);

    const backGeom = new THREE.TorusGeometry(0.6, 0.04, 8, 16, Math.PI);
    backGeom.rotateZ(Math.PI);
    const back = new THREE.Mesh(backGeom, railMat);
    back.position.set(0, 1.8, -0.6);
    chairGroup.add(back);
    disposables.push(backGeom);

    const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
    disposables.push(legGeom);
    [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeom, railMat);
      leg.position.set(lx, 0.5, lz);
      chairGroup.add(leg);
    });

    scene.add(chairGroup);
  }

  createBistroChair(-2.2, 2.0, Math.PI / 2);
  createBistroChair(2.2, 2.0, -Math.PI / 2);

  // 8. On Table: Candle, Champagne Flutes, and Wax-Sealed 3D Invitation
  const candleGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12);
  const candleMat = new THREE.MeshStandardMaterial({ color: '#FFF8E7', roughness: 0.2 });
  const candle = new THREE.Mesh(candleGeom, candleMat);
  candle.position.set(-0.5, 1.85, -0.4);
  tableGroup.add(candle);
  disposables.push(candleGeom, candleMat);

  const flameGeom = new THREE.ConeGeometry(0.06, 0.18, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: '#FFA000' });
  const flame = new THREE.Mesh(flameGeom, flameMat);
  flame.position.set(-0.5, 2.12, -0.4);
  tableGroup.add(flame);
  disposables.push(flameGeom, flameMat);

  const candleLight = new THREE.PointLight('#FFA726', 1.8, 5);
  candleLight.position.set(-0.5, 2.2, -0.4);
  tableGroup.add(candleLight);

  // Champagne Flutes
  const glassGeom = new THREE.CylinderGeometry(0.1, 0.04, 0.45, 12);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#FFF9C4',
    transmission: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  disposables.push(glassGeom, glassMat);

  const flute1 = new THREE.Mesh(glassGeom, glassMat);
  flute1.position.set(0.6, 1.88, -0.3);
  tableGroup.add(flute1);

  const flute2 = new THREE.Mesh(glassGeom, glassMat);
  flute2.position.set(0.8, 1.88, -0.15);
  tableGroup.add(flute2);

  // The 3D Wax-Sealed Invitation Letter
  const envelopeGroup = new THREE.Group();
  envelopeGroup.position.set(0, 1.68, 0.3);
  envelopeGroup.rotation.x = -Math.PI / 16;

  const envGeom = new THREE.BoxGeometry(1.2, 0.05, 0.85);
  const envMat = new THREE.MeshStandardMaterial({ color: '#FFF5EB', roughness: 0.5 });
  const envMesh = new THREE.Mesh(envGeom, envMat);
  envMesh.castShadow = quality.shadows;
  envelopeGroup.add(envMesh);
  disposables.push(envGeom, envMat);

  const sealGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16);
  const sealMat = new THREE.MeshStandardMaterial({ color: '#B71C1C', roughness: 0.2, metalness: 0.1 });
  const seal = new THREE.Mesh(sealGeom, sealMat);
  seal.position.set(0, 0.04, 0);
  envelopeGroup.add(seal);
  disposables.push(sealGeom, sealMat);

  const letterGlow = new THREE.PointLight('#FF4081', 1.0, 2);
  letterGlow.position.set(0, 0.2, 0);
  envelopeGroup.add(letterGlow);

  envelopeGroup.userData = { isClickable: true, action: 'open_invitation' };
  envMesh.userData = { isClickable: true, action: 'open_invitation' };
  seal.userData = { isClickable: true, action: 'open_invitation' };
  tableGroup.add(envelopeGroup);
  interactiveObjects.push(envelopeGroup, envMesh, seal);

  scene.add(tableGroup);

  // 9. SOLID COLLISION BOUNDARIES
  if (collisionSystem) {
    // 1. Back Building Wall (cannot walk through Haussmann facade)
    collisionSystem.addBox(-14, 14, -12, -7.5);

    // 2. Front Seine Balustrade (cannot walk off terrace into river)
    collisionSystem.addBox(-14, 14, 9.2, 11.0);

    // 3. Left and Right Terrace Edge Bounds
    collisionSystem.addBox(-14.5, -12.5, -12, 10.5);
    collisionSystem.addBox(12.5, 14.5, -12, 10.5);

    // 4. Central Bistro Table & Chairs
    collisionSystem.addCylinder(0, 2.0, 1.4);
  }

  // 10. Floating Heart Particles
  const particleCount = Math.floor(45 * quality.particleMultiplier);
  const heartTex = createHeartTexture('#FF4081', 64);
  disposables.push(heartTex);

  const pGeom = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 1] = 1.0 + Math.random() * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.8,
    map: heartTex,
    transparent: true,
    opacity: 0.75,
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
    // Candle flicker
    flame.scale.y = 1 + Math.sin(elapsed * 12) * 0.15;
    candleLight.intensity = 1.8 + Math.sin(elapsed * 15) * 0.3;

    // Eiffel tower beacon rotation
    beaconLight.intensity = 3.5 + Math.sin(elapsed * 6) * 1.5;

    // Invitation subtle breathing hover
    envelopeGroup.position.y = 1.68 + Math.sin(elapsed * 2.5) * 0.03;

    // Particles upward drift
    const pos = pGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += delta * 0.4;
      pos[i * 3] += Math.sin(elapsed + i) * delta * 0.1;
      if (pos[i * 3 + 1] > 9.0) {
        pos[i * 3 + 1] = 1.2;
        pos[i * 3] = (Math.random() - 0.5) * 16;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
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
    initialPlayerPos: new THREE.Vector3(0, 1.0, 5.0),
    onPointerDown: handlePointerDown,
  };
}
