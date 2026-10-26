import * as THREE from 'three';
import { DigitalGift, GiftPhotoItem } from '../../../../types/digitalGifts';
import { QualityConfig } from '../QualitySettings';
import {
  createWoodTexture,
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
  focusArtwork?: (index: number) => void;
  getTerrainHeight?: (x: number, z: number) => number;
  initialPlayerPos?: THREE.Vector3;
  onPointerDown?: (event: MouseEvent | TouchEvent, raycaster: THREE.Raycaster) => boolean;
}

export function createOurMuseumScene(
  gift: DigitalGift,
  ctx: SceneContext
): Loveverse3DSceneInstance {
  const { scene, camera, quality, onInteract, collisionSystem } = ctx;

  const disposables: { dispose: () => void }[] = [];
  const interactiveObjects: THREE.Object3D[] = [];
  const frameTargets: { pos: THREE.Vector3; lookAt: THREE.Vector3; photo: GiftPhotoItem; index: number }[] = [];

  const defaultCamPos = new THREE.Vector3(0, 3.2, 12);
  const defaultTarget = new THREE.Vector3(0, 2.5, 0);
  camera.position.copy(defaultCamPos);
  camera.lookAt(defaultTarget);
  camera.fov = 55;
  camera.updateProjectionMatrix();

  // Romantic warm gallery atmosphere
  scene.background = new THREE.Color('#1F1424');
  scene.fog = new THREE.FogExp2('#1F1424', 0.035);

  // Lighting
  const hemiLight = new THREE.HemisphereLight('#FFF5EB', '#2A1B28', 0.9);
  scene.add(hemiLight);

  const getTerrainHeight = (_x: number, _z: number) => 0.0;

  // 1. Polished Gallery Floor (Richard's Art Gallery reference by shinymagic)
  const floorTex = createWoodTexture(512);
  disposables.push(floorTex);
  const floorGeom = new THREE.PlaneGeometry(24, 44);
  floorGeom.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.28,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.receiveShadow = quality.shadows;
  scene.add(floor);
  disposables.push(floorGeom, floorMat);

  // 2. Classical Gallery Walls (Left, Right, Back, Front Entrance)
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#EDE3D8',
    roughness: 0.85,
  });
  disposables.push(wallMat);

  // Left Wall
  const leftWallGeom = new THREE.PlaneGeometry(44, 9);
  leftWallGeom.rotateY(Math.PI / 2);
  const leftWall = new THREE.Mesh(leftWallGeom, wallMat);
  leftWall.position.set(-6, 4.5, 0);
  leftWall.receiveShadow = quality.shadows;
  scene.add(leftWall);
  disposables.push(leftWallGeom);

  // Right Wall
  const rightWallGeom = new THREE.PlaneGeometry(44, 9);
  rightWallGeom.rotateY(-Math.PI / 2);
  const rightWall = new THREE.Mesh(rightWallGeom, wallMat);
  rightWall.position.set(6, 4.5, 0);
  rightWall.receiveShadow = quality.shadows;
  scene.add(rightWall);
  disposables.push(rightWallGeom);

  // Back Wall
  const backWallGeom = new THREE.PlaneGeometry(12, 9);
  const backWall = new THREE.Mesh(backWallGeom, wallMat);
  backWall.position.set(0, 4.5, -20);
  backWall.receiveShadow = quality.shadows;
  scene.add(backWall);
  disposables.push(backWallGeom);

  // Front Entrance Wall
  const frontWallGeom = new THREE.PlaneGeometry(12, 9);
  frontWallGeom.rotateY(Math.PI);
  const frontWall = new THREE.Mesh(frontWallGeom, wallMat);
  frontWall.position.set(0, 4.5, 20);
  scene.add(frontWall);
  disposables.push(frontWallGeom);

  // Wall Moldings & Baseboards
  const moldingMat = new THREE.MeshStandardMaterial({ color: '#4A2E18', roughness: 0.4 });
  disposables.push(moldingMat);
  const moldGeom = new THREE.BoxGeometry(0.3, 0.4, 44);
  const moldLeft = new THREE.Mesh(moldGeom, moldingMat);
  moldLeft.position.set(-5.9, 0.2, 0);
  scene.add(moldLeft);
  const moldRight = new THREE.Mesh(moldGeom, moldingMat);
  moldRight.position.set(5.9, 0.2, 0);
  scene.add(moldRight);
  disposables.push(moldGeom);

  // 3. Classical Fluted Marble Columns
  const columnMat = new THREE.MeshStandardMaterial({
    color: '#F5EBE6',
    roughness: 0.35,
    metalness: 0.05,
  });
  disposables.push(columnMat);

  const columnGeom = new THREE.CylinderGeometry(0.4, 0.45, 9, 16);
  disposables.push(columnGeom);
  for (let z = -16; z <= 16; z += 8) {
    const colL = new THREE.Mesh(columnGeom, columnMat);
    colL.position.set(-5.4, 4.5, z);
    colL.castShadow = quality.shadows;
    scene.add(colL);

    const colR = new THREE.Mesh(columnGeom, columnMat);
    colR.position.set(5.4, 4.5, z);
    colR.castShadow = quality.shadows;
    scene.add(colR);

    if (collisionSystem) {
      collisionSystem.addCylinder(-5.4, z, 0.55);
      collisionSystem.addCylinder(5.4, z, 0.55);
    }
  }

  // 4. Gallery Viewing Benches (berkgedik reference)
  function createGalleryBench(z: number) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0, z);

    // Velvet Cushion Top
    const velvetMat = new THREE.MeshStandardMaterial({
      color: '#880E4F', // Royal burgundy velvet
      roughness: 0.7,
    });
    disposables.push(velvetMat);

    const seatGeom = new THREE.BoxGeometry(3.2, 0.25, 1.2);
    const seat = new THREE.Mesh(seatGeom, velvetMat);
    seat.position.set(0, 0.75, 0);
    seat.castShadow = quality.shadows;
    benchGroup.add(seat);
    disposables.push(seatGeom);

    // Dark walnut wooden bench base
    const baseGeom = new THREE.BoxGeometry(3.0, 0.65, 1.0);
    const base = new THREE.Mesh(baseGeom, moldingMat);
    base.position.set(0, 0.32, 0);
    base.castShadow = quality.shadows;
    benchGroup.add(base);
    disposables.push(baseGeom);

    scene.add(benchGroup);

    if (collisionSystem) {
      collisionSystem.addBox(-1.8, 1.8, z - 0.7, z + 0.7);
    }
  }

  createGalleryBench(3.0);
  createGalleryBench(-8.0);

  // 5. Photos Setup & Fancy Picture Frames (jamiemcfarlane reference)
  const photos = gift.content?.photos?.length
    ? gift.content.photos
    : [
        {
          id: 'demo_1',
          url: '',
          caption: 'Where our story first began to blossom.',
          date: 'Our First Spark',
          order: 1,
        },
        {
          id: 'demo_2',
          url: '',
          caption: 'Laughing until twilight under the open summer sky.',
          date: 'Summer of Love',
          order: 2,
        },
        {
          id: 'demo_3',
          url: '',
          caption: 'Quiet mornings and promises whispered in the dark.',
          date: 'Forever Season',
          order: 3,
        },
      ];

  const textureLoader = new THREE.TextureLoader();

  // Ornate Gold Frame Material
  const goldFrameMat = new THREE.MeshStandardMaterial({
    color: '#D4AF37',
    metalness: 0.88,
    roughness: 0.22,
  });
  disposables.push(goldFrameMat);

  photos.forEach((photo, idx) => {
    const isLeft = idx % 2 === 0;
    const pairIndex = Math.floor(idx / 2);
    const zPos = 8 - pairIndex * 6.0;
    const xPos = isLeft ? -5.85 : 5.85;
    const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;

    const frameGroup = new THREE.Group();
    frameGroup.position.set(xPos, 3.2, zPos);
    frameGroup.rotation.y = rotY;

    // Fancy Molded Frame with Bevelled Edge
    const frameMeshGeom = new THREE.BoxGeometry(2.5, 3.1, 0.16);
    disposables.push(frameMeshGeom);
    const frameMesh = new THREE.Mesh(frameMeshGeom, goldFrameMat);
    frameMesh.castShadow = quality.shadows;
    frameGroup.add(frameMesh);

    // Inner Canvas Artwork
    let canvasTex: THREE.Texture;
    if (photo.url && photo.url.startsWith('http')) {
      canvasTex = textureLoader.load(
        photo.url,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          loadedTex.needsUpdate = true;
        },
        undefined,
        () => {
          const fb = createFallbackArtworkTexture(photo.caption || '', idx);
          artMat.map = fb;
          artMat.needsUpdate = true;
        }
      );
    } else {
      canvasTex = createFallbackArtworkTexture(photo.caption || '', idx);
    }
    disposables.push(canvasTex);

    const artGeom = new THREE.PlaneGeometry(2.1, 2.6);
    disposables.push(artGeom);
    const artMat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      roughness: 0.5,
    });
    disposables.push(artMat);
    const artMesh = new THREE.Mesh(artGeom, artMat);
    artMesh.position.set(0, 0, 0.09);
    frameGroup.add(artMesh);

    // Brass Exhibition Nameplate
    const nameplateCanvas = document.createElement('canvas');
    nameplateCanvas.width = 256;
    nameplateCanvas.height = 64;
    const nCtx = nameplateCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#D4AF37';
      nCtx.fillRect(0, 0, 256, 64);
      nCtx.fillStyle = '#2A1810';
      nCtx.font = 'bold 16px Georgia, serif';
      nCtx.textAlign = 'center';
      nCtx.fillText((photo.date || `Memory #${idx + 1}`).toUpperCase(), 128, 38);
    }
    const nameplateTex = new THREE.CanvasTexture(nameplateCanvas);
    nameplateTex.colorSpace = THREE.SRGBColorSpace;
    disposables.push(nameplateTex);

    const npGeom = new THREE.PlaneGeometry(1.3, 0.32);
    const npMat = new THREE.MeshBasicMaterial({ map: nameplateTex });
    disposables.push(npGeom, npMat);
    const nameplate = new THREE.Mesh(npGeom, npMat);
    nameplate.position.set(0, -1.72, 0.09);
    frameGroup.add(nameplate);

    // Overhead Spotlight
    const spot = new THREE.SpotLight('#FFE8D6', 2.2, 8, Math.PI / 4, 0.4);
    spot.position.set(isLeft ? -3.8 : 3.8, 5.8, zPos);
    spot.target = artMesh;
    scene.add(spot);
    scene.add(spot.target);

    frameGroup.userData = { isClickable: true, action: 'select_photo', photo, index: idx };
    artMesh.userData = { isClickable: true, action: 'select_photo', photo, index: idx };
    frameMesh.userData = { isClickable: true, action: 'select_photo', photo, index: idx };

    scene.add(frameGroup);
    interactiveObjects.push(frameGroup, artMesh, frameMesh);

    frameTargets.push({
      pos: new THREE.Vector3(isLeft ? -2.8 : 2.8, 3.2, zPos),
      lookAt: new THREE.Vector3(xPos, 3.2, zPos),
      photo,
      index: idx,
    });
  });

  // 6. SOLID WALL COLLISION BOUNDARIES
  if (collisionSystem) {
    // Left wall barrier (x = -5.8)
    collisionSystem.addBox(-10, -5.5, -25, 25);
    // Right wall barrier (x = 5.8)
    collisionSystem.addBox(5.5, 10, -25, 25);
    // Back wall barrier (z = -20)
    collisionSystem.addBox(-7, 7, -25, -19.5);
    // Front entrance wall barrier (z = 20)
    collisionSystem.addBox(-7, 7, 19.5, 25);
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
        onInteract(target.userData.action, {
          photo: target.userData.photo,
          index: target.userData.index,
        });
        return true;
      }
    }
    return false;
  };

  const focusArtwork = (index: number) => {
    const t = frameTargets[index];
    if (!t) return;
    camera.position.copy(t.pos);
    camera.lookAt(t.lookAt);
  };

  const resetCamera = () => {
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);
  };

  const update = (_delta: number, _elapsed: number) => {
    // Gallery scene is mostly static and dignified, camera and couple avatar are updated by exploration engine
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return {
    update,
    dispose,
    resetCamera,
    focusArtwork,
    getTerrainHeight,
    initialPlayerPos: new THREE.Vector3(0, 0, 8),
    onPointerDown: handlePointerDown,
  };
}
