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

export function createEverTideIslandScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract, collisionSystem } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];

  // Setup Camera
  const defaultCamPos = new THREE.Vector3(0, 7.5, 23);
  const defaultTarget = new THREE.Vector3(0, 2, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 50;
  camera.updateProjectionMatrix();

  // Romantic Sunset Sky Background & Fog
  scene.background = new THREE.Color('#3A1838');
  scene.fog = new THREE.FogExp2('#4A1D3F', 0.022);

  // Lighting
  const hemiLight = new THREE.HemisphereLight('#FFB6C1', '#2A102A', 0.85);
  scene.add(hemiLight);

  // Warm Sunset Directional Light
  const sunLight = new THREE.DirectionalLight('#FFD166', 2.0);
  sunLight.position.set(0, 12, -45);
  sunLight.castShadow = quality.shadows;
  if (quality.shadows) {
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.bias = -0.0005;
  }
  scene.add(sunLight);

  // Golden Sun Sphere in Horizon
  const sunGeom = new THREE.SphereGeometry(6, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: '#FFE082' });
  const sunMesh = new THREE.Mesh(sunGeom, sunMat);
  sunMesh.position.set(0, 8, -60);
  scene.add(sunMesh);
  disposables.push(sunGeom, sunMat);

  // Sun Glow Halo
  const haloGeom = new THREE.RingGeometry(6.2, 16, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#FF8A65',
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.position.copy(sunMesh.position);
  haloMesh.position.z += 0.5;
  scene.add(haloMesh);
  disposables.push(haloGeom, haloMat);

  // Terrain height calculation function
  const getTerrainHeight = (x: number, z: number): number => {
    // Check if on pier
    if (x >= -1.6 && x <= 1.6 && z >= 11 && z <= 19) {
      return 1.1;
    }
    const dist = Math.sqrt(x * x + z * z);
    if (dist > 14.5) return 0.2; // in ocean water
    // Gentle parabolic dune
    const h = 1.7 - Math.pow(dist / 14, 2) * 1.35;
    return Math.max(0.4, h);
  };

  // 1. Procedural Animated Ocean Surface
  const oceanSegments = quality.level === 'low' ? 32 : 64;
  const oceanGeom = new THREE.PlaneGeometry(140, 140, oceanSegments, oceanSegments);
  oceanGeom.rotateX(-Math.PI / 2);

  const posAttr = oceanGeom.attributes.position;
  const initialY = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    initialY[i] = posAttr.getY(i);
  }

  const oceanMat = new THREE.MeshStandardMaterial({
    color: '#D45D79',
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.92,
  });
  const oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
  oceanMesh.position.set(0, 0, 0);
  oceanMesh.receiveShadow = quality.shadows;
  scene.add(oceanMesh);
  disposables.push(oceanGeom, oceanMat);

  // 2. Stylized Tropical Beach Diorama Base (visthetique reference)
  const islandGeom = new THREE.CylinderGeometry(14, 18, 2.5, 36);
  const islandMat = new THREE.MeshStandardMaterial({
    color: '#E0A96D',
    roughness: 0.88,
    metalness: 0.05,
  });
  const islandMesh = new THREE.Mesh(islandGeom, islandMat);
  islandMesh.position.set(0, 0.4, 0);
  islandMesh.receiveShadow = quality.shadows;
  scene.add(islandMesh);
  disposables.push(islandGeom, islandMat);

  // Organic Dune Top
  const duneGeom = new THREE.SphereGeometry(13, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.34);
  const duneMat = new THREE.MeshStandardMaterial({
    color: '#ECC59A',
    roughness: 0.92,
    metalness: 0.0,
  });
  const duneMesh = new THREE.Mesh(duneGeom, duneMat);
  duneMesh.position.set(0, -1.8, 0);
  duneMesh.scale.set(1.1, 0.36, 1.1);
  duneMesh.receiveShadow = quality.shadows;
  scene.add(duneMesh);
  disposables.push(duneGeom, duneMat);

  // 3. Multi-part Stylized Palm Trees (yadrogames reference)
  function createPalmTree(x: number, z: number, scale = 1, rotY = 0) {
    const treeGroup = new THREE.Group();
    const groundY = getTerrainHeight(x, z);
    treeGroup.position.set(x, groundY, z);
    treeGroup.rotation.y = rotY;

    // Segmented curved trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#6D4C41',
      roughness: 0.85,
    });
    disposables.push(trunkMat);

    let prevY = 0;
    let prevX = 0;
    for (let i = 0; i < 5; i++) {
      const segH = 1.05 * scale;
      const segGeom = new THREE.CylinderGeometry(
        (0.36 - i * 0.04) * scale,
        (0.44 - i * 0.04) * scale,
        segH,
        8
      );
      disposables.push(segGeom);
      const seg = new THREE.Mesh(segGeom, trunkMat);
      const curveOffset = Math.sin(i * 0.35) * 0.3 * scale;
      seg.position.set(prevX + curveOffset * 0.5, prevY + segH / 2, 0);
      seg.rotation.z = -curveOffset * 0.55;
      seg.castShadow = quality.shadows;
      treeGroup.add(seg);
      prevY += segH * 0.95;
      prevX += curveOffset * 0.5;
    }

    // Coconut cluster
    const coconutGeom = new THREE.SphereGeometry(0.3 * scale, 8, 8);
    const coconutMat = new THREE.MeshStandardMaterial({ color: '#4E342E' });
    disposables.push(coconutGeom, coconutMat);
    for (let c = 0; c < 3; c++) {
      const nut = new THREE.Mesh(coconutGeom, coconutMat);
      nut.position.set(prevX + (c - 1) * 0.25 * scale, prevY - 0.1, (c % 2 ? 0.2 : -0.2) * scale);
      treeGroup.add(nut);
    }

    // Organic Palm Fronds
    const frondMat = new THREE.MeshStandardMaterial({
      color: '#386641',
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    disposables.push(frondMat);

    for (let l = 0; l < 8; l++) {
      const angle = (l / 8) * Math.PI * 2;
      const leafGeom = new THREE.ConeGeometry(0.85 * scale, 3.4 * scale, 4);
      leafGeom.translate(0, 1.7 * scale, 0);
      leafGeom.rotateX(Math.PI / 3);
      disposables.push(leafGeom);

      const leaf = new THREE.Mesh(leafGeom, frondMat);
      leaf.position.set(prevX, prevY, 0);
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.2;
      leaf.scale.set(0.65, 1, 0.16);
      leaf.castShadow = quality.shadows;
      treeGroup.add(leaf);
    }

    scene.add(treeGroup);

    // Register cylinder collision for trunk
    if (collisionSystem) {
      collisionSystem.addCylinder(x, z, 0.7 * scale);
    }

    return { x, z, topX: x + prevX, topY: groundY + prevY, topZ: z };
  }

  const tree1 = createPalmTree(-6.5, -2, 1.25, 0.4);
  const tree2 = createPalmTree(-8.5, 3.5, 0.95, -0.6);
  const tree3 = createPalmTree(7.5, 1.5, 1.15, 1.2);
  const tree4 = createPalmTree(6.0, -4.5, 1.0, -0.8);

  // 4. Simple String Lights (TrixtheProtogen reference)
  // Suspended string light curve between tree1 and tree2
  const stringCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(tree1.topX, tree1.topY - 0.5, tree1.topZ),
    new THREE.Vector3((tree1.topX + tree2.topX) / 2, (tree1.topY + tree2.topY) / 2 - 1.2, (tree1.topZ + tree2.topZ) / 2),
    new THREE.Vector3(tree2.topX, tree2.topY - 0.5, tree2.topZ),
  ]);
  const stringGeom = new THREE.TubeGeometry(stringCurve, 20, 0.03, 6, false);
  const stringMat = new THREE.MeshBasicMaterial({ color: '#2B2B2B' });
  const stringMesh = new THREE.Mesh(stringGeom, stringMat);
  scene.add(stringMesh);
  disposables.push(stringGeom, stringMat);

  // Glowing fairy light bulbs along string
  const bulbGeom = new THREE.SphereGeometry(0.12, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#FFE082' });
  disposables.push(bulbGeom, bulbMat);
  for (let i = 1; i <= 9; i++) {
    const pt = stringCurve.getPoint(i / 10);
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.copy(pt);
    scene.add(bulb);
  }

  // 5. Wooden Pier, Crates & Barrels (CGlads - Stylized Pirate Island Pack)
  const woodPlankTex = createWoodTexture(256);
  disposables.push(woodPlankTex);
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodPlankTex,
    color: '#8D6E63',
    roughness: 0.8,
  });
  disposables.push(woodMat);

  // Pier deck extending from shore into water
  const pierGroup = new THREE.Group();
  pierGroup.position.set(0, 1.05, 15);

  const pierDeckGeom = new THREE.BoxGeometry(3.2, 0.25, 8.5);
  const pierDeck = new THREE.Mesh(pierDeckGeom, woodMat);
  pierDeck.castShadow = quality.shadows;
  pierDeck.receiveShadow = quality.shadows;
  pierGroup.add(pierDeck);
  disposables.push(pierDeckGeom);

  // Wooden support posts underneath pier
  const postGeom = new THREE.CylinderGeometry(0.18, 0.18, 2.8, 8);
  disposables.push(postGeom);
  for (let pz = -3.5; pz <= 3.5; pz += 2.4) {
    const postL = new THREE.Mesh(postGeom, woodMat);
    postL.position.set(-1.4, -1.3, pz);
    postL.castShadow = quality.shadows;
    pierGroup.add(postL);

    const postR = new THREE.Mesh(postGeom, woodMat);
    postR.position.set(1.4, -1.3, pz);
    postR.castShadow = quality.shadows;
    pierGroup.add(postR);
  }
  scene.add(pierGroup);

  // Rustic Wooden Crates
  function createCrate(x: number, y: number, z: number, size = 0.9, rotY = 0) {
    const crateGeom = new THREE.BoxGeometry(size, size, size);
    const crateMat = new THREE.MeshStandardMaterial({
      map: woodPlankTex,
      color: '#A1887F',
      roughness: 0.7,
    });
    disposables.push(crateGeom, crateMat);
    const crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(x, y + size / 2, z);
    crate.rotation.y = rotY;
    crate.castShadow = quality.shadows;
    crate.receiveShadow = quality.shadows;
    scene.add(crate);

    if (collisionSystem) {
      collisionSystem.addBox(
        x - size * 0.55,
        x + size * 0.55,
        z - size * 0.55,
        z + size * 0.55
      );
    }
  }

  // Barrels with iron hoops
  function createBarrel(x: number, y: number, z: number, rad = 0.45, h = 1.1) {
    const barrelGroup = new THREE.Group();
    barrelGroup.position.set(x, y, z);

    const bGeom = new THREE.CylinderGeometry(rad * 0.88, rad * 0.88, h, 14);
    const bMesh = new THREE.Mesh(bGeom, woodMat);
    bMesh.position.set(0, h / 2, 0);
    bMesh.castShadow = quality.shadows;
    barrelGroup.add(bMesh);
    disposables.push(bGeom);

    // Iron bands
    const bandMat = new THREE.MeshStandardMaterial({ color: '#2B2B2B', metalness: 0.8, roughness: 0.3 });
    disposables.push(bandMat);
    const bandGeom = new THREE.CylinderGeometry(rad * 0.91, rad * 0.91, 0.08, 14);
    disposables.push(bandGeom);

    const band1 = new THREE.Mesh(bandGeom, bandMat);
    band1.position.set(0, h * 0.25, 0);
    const band2 = new THREE.Mesh(bandGeom, bandMat);
    band2.position.set(0, h * 0.75, 0);
    barrelGroup.add(band1, band2);

    scene.add(barrelGroup);

    if (collisionSystem) {
      collisionSystem.addCylinder(x, z, rad + 0.1);
    }
  }

  // Crates and barrels arranged naturally near pier and palms
  createCrate(-1.8, 1.18, 12.0, 0.8, 0.2);
  createCrate(-1.9, 1.18, 13.0, 0.7, -0.4);
  createBarrel(1.8, 1.18, 12.5, 0.4, 0.95);
  createBarrel(1.9, 1.18, 13.6, 0.35, 0.85);

  createCrate(-5.2, getTerrainHeight(-5.2, -1.2), -1.2, 0.85, 0.3);
  createBarrel(-5.8, getTerrainHeight(-5.8, 0.0), 0.0, 0.42, 1.0);

  // 6. Stylized Wood Sign "Ever Tide 🌴" (Pasindu.Anjana reference)
  const signGroup = new THREE.Group();
  const signGroundY = getTerrainHeight(2.8, 9.5);
  signGroup.position.set(2.8, signGroundY, 9.5);
  signGroup.rotation.y = -Math.PI / 6;

  // Signpost
  const signPostGeom = new THREE.CylinderGeometry(0.1, 0.12, 1.8, 8);
  const signPost = new THREE.Mesh(signPostGeom, woodMat);
  signPost.position.set(0, 0.9, 0);
  signPost.castShadow = quality.shadows;
  signGroup.add(signPost);
  disposables.push(signPostGeom);

  // Signboard canvas
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256;
  signCanvas.height = 128;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#6D4C41';
    sCtx.fillRect(0, 0, 256, 128);
    sCtx.strokeStyle = '#4E342E';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(4, 4, 248, 120);

    sCtx.fillStyle = '#FFE082';
    sCtx.font = 'bold 26px Georgia, serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('EVER TIDE', 128, 55);
    sCtx.font = '16px system-ui, sans-serif';
    sCtx.fillStyle = '#FFF8E1';
    sCtx.fillText('Our Sunset Island 🌴', 128, 90);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(signTex);

  const signBoardGeom = new THREE.BoxGeometry(1.6, 0.8, 0.1);
  const signBoardMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 });
  const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
  signBoard.position.set(0, 1.45, 0.06);
  signBoard.castShadow = quality.shadows;
  signGroup.add(signBoard);
  disposables.push(signBoardGeom, signBoardMat);

  scene.add(signGroup);
  if (collisionSystem) {
    collisionSystem.addCylinder(2.8, 9.5, 0.45);
  }

  // 7. Vintage Oil Lamp Lanterns (rudavin reference)
  function createOilLantern(x: number, y: number, z: number) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, y, z);

    // Brass Base
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#C5A059',
      metalness: 0.85,
      roughness: 0.25,
    });
    disposables.push(brassMat);

    const baseGeom = new THREE.CylinderGeometry(0.14, 0.18, 0.18, 10);
    const baseMesh = new THREE.Mesh(baseGeom, brassMat);
    baseMesh.position.set(0, 0.09, 0);
    lampGroup.add(baseMesh);
    disposables.push(baseGeom);

    // Glass Chimney
    const glassGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.35, 10);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#FFF8E1',
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
    });
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    glassMesh.position.set(0, 0.35, 0);
    lampGroup.add(glassMesh);
    disposables.push(glassGeom, glassMat);

    // Brass Top Hood & Handle
    const hoodGeom = new THREE.ConeGeometry(0.16, 0.12, 10);
    const hoodMesh = new THREE.Mesh(hoodGeom, brassMat);
    hoodMesh.position.set(0, 0.58, 0);
    lampGroup.add(hoodMesh);
    disposables.push(hoodGeom);

    // Amber Flame & Point Light
    const flameLight = new THREE.PointLight('#FFA726', 1.6, 6);
    flameLight.position.set(0, 0.35, 0);
    lampGroup.add(flameLight);

    scene.add(lampGroup);
  }

  // Place lanterns on pier and beach
  createOilLantern(1.2, 1.25, 17.5);
  createOilLantern(-1.2, 1.25, 17.5);

  // 8. Old Wooden Rowboat (donnichols reference)
  const boatGroup = new THREE.Group();
  boatGroup.position.set(8.5, 0.55, 6.0);
  boatGroup.rotation.y = -Math.PI / 3;
  boatGroup.rotation.z = 0.08; // slightly resting on sand

  // Hull (hollowed box with angled ends)
  const hullGeom = new THREE.BoxGeometry(1.6, 0.7, 3.8);
  const boatMat = new THREE.MeshStandardMaterial({
    map: woodPlankTex,
    color: '#5D4037',
    roughness: 0.8,
  });
  const hull = new THREE.Mesh(hullGeom, boatMat);
  hull.position.set(0, 0.35, 0);
  hull.castShadow = quality.shadows;
  boatGroup.add(hull);
  disposables.push(hullGeom, boatMat);

  // Seats across boat
  const seatGeom = new THREE.BoxGeometry(1.5, 0.08, 0.4);
  disposables.push(seatGeom);
  const seat1 = new THREE.Mesh(seatGeom, woodMat);
  seat1.position.set(0, 0.45, 0.5);
  const seat2 = new THREE.Mesh(seatGeom, woodMat);
  seat2.position.set(0, 0.45, -0.8);
  boatGroup.add(seat1, seat2);

  // Oars
  const oarGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6);
  disposables.push(oarGeom);
  const oar = new THREE.Mesh(oarGeom, woodMat);
  oar.position.set(0.6, 0.65, 0.2);
  oar.rotation.z = Math.PI / 8;
  boatGroup.add(oar);

  scene.add(boatGroup);
  if (collisionSystem) {
    collisionSystem.addBox(7.2, 9.8, 4.5, 7.8);
  }

  // 9. Classic Park Bench (berkgedik reference)
  const benchGroup = new THREE.Group();
  const benchY = getTerrainHeight(-3.2, 4.8);
  benchGroup.position.set(-3.2, benchY, 4.8);
  benchGroup.rotation.y = Math.PI / 4;

  const benchFrameMat = new THREE.MeshStandardMaterial({ color: '#212121', metalness: 0.8, roughness: 0.3 });
  disposables.push(benchFrameMat);

  // Wood slats for seat and back
  const slatGeom = new THREE.BoxGeometry(2.4, 0.06, 0.16);
  disposables.push(slatGeom);
  for (let s = 0; s < 3; s++) {
    const slat = new THREE.Mesh(slatGeom, woodMat);
    slat.position.set(0, 0.5, s * 0.18);
    slat.castShadow = quality.shadows;
    benchGroup.add(slat);
  }
  for (let b = 0; b < 3; b++) {
    const backSlat = new THREE.Mesh(slatGeom, woodMat);
    backSlat.position.set(0, 0.75 + b * 0.16, -0.15);
    backSlat.rotation.x = 0.15;
    backSlat.castShadow = quality.shadows;
    benchGroup.add(backSlat);
  }

  // Iron legs
  const benchLegGeom = new THREE.BoxGeometry(0.08, 0.55, 0.6);
  disposables.push(benchLegGeom);
  const bLegL = new THREE.Mesh(benchLegGeom, benchFrameMat);
  bLegL.position.set(-1.0, 0.25, 0.1);
  const bLegR = new THREE.Mesh(benchLegGeom, benchFrameMat);
  bLegR.position.set(1.0, 0.25, 0.1);
  benchGroup.add(bLegL, bLegR);

  scene.add(benchGroup);
  if (collisionSystem) {
    collisionSystem.addBox(-4.2, -2.2, 4.0, 5.6);
  }

  // 10. Beach Umbrella and Props (Edwin3D & SkinOmegaProductions references)
  const umbrellaGroup = new THREE.Group();
  const umbY = getTerrainHeight(4.5, -1.8);
  umbrellaGroup.position.set(4.5, umbY, -1.8);

  // Pole
  const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8);
  const pole = new THREE.Mesh(poleGeom, benchFrameMat);
  pole.position.set(0, 1.3, 0);
  pole.castShadow = quality.shadows;
  umbrellaGroup.add(pole);
  disposables.push(poleGeom);

  // Canopy
  const canopyGeom = new THREE.ConeGeometry(2.2, 0.9, 12, 1, true);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: '#FF6F61',
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(canopyGeom, canopyMat);
  canopy.position.set(0, 2.4, 0);
  canopy.castShadow = quality.shadows;
  umbrellaGroup.add(canopy);
  disposables.push(canopyGeom, canopyMat);

  // Beach Lounger Chair
  const loungerGeom = new THREE.BoxGeometry(1.0, 0.25, 2.2);
  const lounger = new THREE.Mesh(loungerGeom, woodMat);
  lounger.position.set(0.6, 0.15, 0.6);
  lounger.castShadow = quality.shadows;
  umbrellaGroup.add(lounger);
  disposables.push(loungerGeom);

  scene.add(umbrellaGroup);
  if (collisionSystem) {
    collisionSystem.addCylinder(4.5, -1.8, 0.5);
  }

  // 11. Romantic Couple Blanket on Beach
  const blanketGeom = new THREE.PlaneGeometry(3.5, 3.5);
  blanketGeom.rotateX(-Math.PI / 2);
  const blanketMat = new THREE.MeshStandardMaterial({
    color: '#FFF0F5',
    roughness: 0.9,
  });
  const blanket = new THREE.Mesh(blanketGeom, blanketMat);
  blanket.position.set(0, getTerrainHeight(0, 3) + 0.02, 3);
  blanket.receiveShadow = quality.shadows;
  scene.add(blanket);
  disposables.push(blanketGeom, blanketMat);

  // Glowing Lantern on blanket
  createOilLantern(0, getTerrainHeight(0, 2.5) + 0.02, 2.5);

  // 12. Interactive Message in a Bottle Bobbing near Pier
  const bottleGroup = new THREE.Group();
  bottleGroup.position.set(2.4, 0.35, 16.5);

  const bottleGeom = new THREE.CylinderGeometry(0.22, 0.25, 0.8, 12);
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: '#E0F7FA',
    transmission: 0.85,
    opacity: 0.9,
    transparent: true,
    roughness: 0.1,
    ior: 1.5,
  });
  const bottleBody = new THREE.Mesh(bottleGeom, bottleMat);
  bottleGroup.add(bottleBody);
  disposables.push(bottleGeom, bottleMat);

  const corkGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 8);
  const corkMat = new THREE.MeshStandardMaterial({ color: '#8D6E63' });
  const cork = new THREE.Mesh(corkGeom, corkMat);
  cork.position.set(0, 0.48, 0);
  bottleGroup.add(cork);
  disposables.push(corkGeom, corkMat);

  const scrollGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8);
  const scrollMat = new THREE.MeshStandardMaterial({ color: '#FFF8E1' });
  const scroll = new THREE.Mesh(scrollGeom, scrollMat);
  scroll.position.set(0, -0.05, 0);
  bottleGroup.add(scroll);
  disposables.push(scrollGeom, scrollMat);

  const bottleHalo = new THREE.PointLight('#FF4081', 1.2, 3);
  bottleHalo.position.set(0, 0.4, 0);
  bottleGroup.add(bottleHalo);

  bottleGroup.userData = { isClickable: true, action: 'open_bottle' };
  bottleBody.userData = { isClickable: true, action: 'open_bottle' };
  scene.add(bottleGroup);
  interactiveObjects.push(bottleBody, bottleGroup);

  // 13. Flying Toon Airplane with Banner (animanyarty reference)
  const planeGroup = new THREE.Group();
  planeGroup.position.set(-25, 12, -8);

  const fuselageGeom = new THREE.CapsuleGeometry(0.4, 2.0, 8, 8);
  fuselageGeom.rotateX(Math.PI / 2);
  const planeMat = new THREE.MeshStandardMaterial({ color: '#FAFAFA', roughness: 0.3 });
  const fuselage = new THREE.Mesh(fuselageGeom, planeMat);
  planeGroup.add(fuselage);
  disposables.push(fuselageGeom, planeMat);

  const wingGeom = new THREE.BoxGeometry(4.2, 0.08, 0.8);
  const wingMat = new THREE.MeshStandardMaterial({ color: '#E8547A' });
  const wing = new THREE.Mesh(wingGeom, wingMat);
  wing.position.set(0, 0.1, 0.2);
  planeGroup.add(wing);
  disposables.push(wingGeom, wingMat);

  const tailGeom = new THREE.BoxGeometry(0.08, 0.8, 0.6);
  const tail = new THREE.Mesh(tailGeom, wingMat);
  tail.position.set(0, 0.45, -0.9);
  planeGroup.add(tail);
  disposables.push(tailGeom);

  const propGeom = new THREE.BoxGeometry(0.9, 0.1, 0.04);
  const propMat = new THREE.MeshStandardMaterial({ color: '#333333' });
  const propeller = new THREE.Mesh(propGeom, propMat);
  propeller.position.set(0, 0, 1.2);
  planeGroup.add(propeller);
  disposables.push(propGeom, propMat);

  // Trailing Ribbon Banner
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 128;
  const bCtx = bannerCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.strokeStyle = '#E8547A';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(4, 4, 504, 120);

    bCtx.fillStyle = '#2B1A2E';
    bCtx.font = 'bold 22px Georgia, serif';
    bCtx.textAlign = 'center';
    const qText = gift.content?.question || 'Will you always be my favorite person?';
    bCtx.fillText(`💌 ${gift.recipientName || 'Beloved'}: ${qText.slice(0, 32)}...`, 256, 70);
  }
  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(bannerTex);

  const bannerGeom = new THREE.PlaneGeometry(6.5, 1.6);
  const bannerMat = new THREE.MeshBasicMaterial({
    map: bannerTex,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const banner = new THREE.Mesh(bannerGeom, bannerMat);
  banner.position.set(0, 0, -4.5);
  planeGroup.add(banner);
  disposables.push(bannerGeom, bannerMat);

  planeGroup.userData = { isClickable: true, action: 'open_question' };
  banner.userData = { isClickable: true, action: 'open_question' };
  fuselage.userData = { isClickable: true, action: 'open_question' };
  scene.add(planeGroup);
  interactiveObjects.push(planeGroup, banner, fuselage);

  // 14. Floating Heart Particles
  const particleCount = Math.floor(60 * quality.particleMultiplier);
  const heartTex = createHeartTexture('#FF8DA1', 64);
  disposables.push(heartTex);

  const pGeom = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  const pVelocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 30;
    pPositions[i * 3 + 1] = 1 + Math.random() * 12;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;

    pVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
    pVelocities[i * 3 + 1] = 0.2 + Math.random() * 0.5;
    pVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.9,
    map: heartTex,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeom, pMat);
  scene.add(particles);
  disposables.push(pGeom, pMat);

  // Set perimeter in collision system (island circular barrier + pier bounds)
  if (collisionSystem) {
    collisionSystem.setCircularPerimeter(0, 0, 13.8);
  }

  // Pointer interaction
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
  let planeAngle = 0;
  const update = (delta: number, elapsed: number) => {
    // 1. Ocean waves
    const pArray = oceanGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < posAttr.count; i++) {
      const u = pArray[i * 3];
      const w = pArray[i * 3 + 2];
      pArray[i * 3 + 1] =
        initialY[i] +
        Math.sin(u * 0.2 + elapsed * 1.5) * 0.22 +
        Math.cos(w * 0.25 + elapsed * 1.2) * 0.2;
    }
    oceanGeom.attributes.position.needsUpdate = true;
    oceanGeom.computeVertexNormals();

    // 2. Bobbing Bottle
    bottleGroup.position.y = 0.35 + Math.sin(elapsed * 2.5) * 0.12;
    bottleGroup.rotation.z = Math.sin(elapsed * 1.8) * 0.25;
    bottleGroup.rotation.x = Math.cos(elapsed * 1.5) * 0.15;

    // 3. Airplane flight path
    planeAngle += delta * 0.25;
    const radius = 24;
    planeGroup.position.x = Math.sin(planeAngle) * radius;
    planeGroup.position.z = -12 + Math.cos(planeAngle) * 8;
    planeGroup.position.y = 11 + Math.sin(planeAngle * 2) * 1.5;
    planeGroup.rotation.y = planeAngle + Math.PI / 2;
    planeGroup.rotation.z = Math.sin(planeAngle * 2) * 0.1;
    propeller.rotation.z += delta * 40;

    banner.rotation.y = Math.sin(elapsed * 4) * 0.12;

    // 4. Floating heart particles
    const positions = pGeom.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += pVelocities[i * 3] * delta;
      positions[i * 3 + 1] += pVelocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += pVelocities[i * 3 + 2] * delta;

      if (positions[i * 3 + 1] > 14) {
        positions[i * 3 + 1] = 1;
        positions[i * 3] = (Math.random() - 0.5) * 26;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
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
    initialPlayerPos: new THREE.Vector3(0, 1.7, 3.8),
    onPointerDown: handlePointerDown,
  };
}
