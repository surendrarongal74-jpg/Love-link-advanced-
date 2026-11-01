import * as THREE from 'three';
import { CollisionSystem } from '../digitalGifts/3d/CollisionSystem';
import { WorldPhysicsValidator } from './WorldPhysicsValidator';

export interface CrystalObject {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  color: string;
  collected: boolean;
}

export interface PressureSwitch {
  id: 'switchA' | 'switchB';
  position: THREE.Vector3;
  radius: number;
  isActive: boolean;
  mesh: THREE.Group;
  lightMesh: THREE.Mesh;
}

export class SkyIslandsWorld {
  public rootGroup: THREE.Group;
  public collisionSystem: CollisionSystem;
  public crystals: CrystalObject[] = [];
  public switchA!: PressureSwitch;
  public switchB!: PressureSwitch;
  public energyBridgeGroup: THREE.Group;
  public portalGroup: THREE.Group;
  public floatingPlatforms: { mesh: THREE.Group; initialY: number; speed: number; offset: number }[] = [];
  public particlesGroup: THREE.Points | null = null;
  public skyMesh: THREE.Mesh | null = null;

  constructor() {
    this.rootGroup = new THREE.Group();
    this.collisionSystem = new CollisionSystem(0.45);
    this.energyBridgeGroup = new THREE.Group();
    this.portalGroup = new THREE.Group();

    this.buildSkyAtmosphere();
    this.buildMainIsland();
    this.buildSteppingStones();
    this.buildWestIsland();
    this.buildEastIsland();
    this.buildEnergyBridge();
    this.buildCelestialSanctuary();
    this.buildFloatingParticles();
  }

  /**
   * Dreamy sunset/twilight sky dome
   */
  private buildSkyAtmosphere(): void {
    const skyGeo = new THREE.SphereGeometry(180, 32, 24);
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#0d1b2a'); // Deep cosmic zenith
      grad.addColorStop(0.4, '#3a0ca3'); // Twilight violet
      grad.addColorStop(0.7, '#f72585'); // Magenta glow
      grad.addColorStop(0.9, '#ffb703'); // Golden sunset horizon
      grad.addColorStop(1.0, '#fb8500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 512);
    }
    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.rootGroup.add(this.skyMesh);

    // Warm directional sun light and atmospheric ambient
    const sunLight = new THREE.DirectionalLight('#fff1e6', 1.6);
    sunLight.position.set(25, 45, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    this.rootGroup.add(sunLight);

    const hemiLight = new THREE.HemisphereLight('#c77dff', '#240046', 0.9);
    this.rootGroup.add(hemiLight);
  }

  /**
   * Helper to create floating island rock with lush grass plateau
   */
  private createFloatingIsland(
    x: number,
    y: number,
    z: number,
    radiusTop: number,
    depth: number,
    grassColor = '#38b000'
  ): THREE.Group {
    const island = new THREE.Group();
    island.position.set(x, y, z);

    // Grass plateau
    const topGeo = new THREE.CylinderGeometry(radiusTop, radiusTop * 0.9, 0.8, 16);
    const grassMat = new THREE.MeshStandardMaterial({
      color: grassColor,
      roughness: 0.8,
      metalness: 0.05,
    });
    const topMesh = new THREE.Mesh(topGeo, grassMat);
    topMesh.position.y = 0;
    topMesh.receiveShadow = true;
    island.add(topMesh);

    // Stone rim
    const rimGeo = new THREE.TorusGeometry(radiusTop * 0.95, 0.25, 8, 16);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#6c757d',
      roughness: 0.9,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.35;
    island.add(rimMesh);

    // Floating inverted cone underbelly
    const bottomGeo = new THREE.ConeGeometry(radiusTop * 0.9, depth, 16);
    bottomGeo.rotateX(Math.PI);
    const rockMat = new THREE.MeshStandardMaterial({
      color: '#495057',
      roughness: 0.95,
      metalness: 0.1,
    });
    const bottomMesh = new THREE.Mesh(bottomGeo, rockMat);
    bottomMesh.position.y = -depth / 2 - 0.4;
    bottomMesh.castShadow = true;
    island.add(bottomMesh);

    this.rootGroup.add(island);
    return island;
  }

  /**
   * Main Spawn Island (Center)
   */
  private buildMainIsland(): void {
    this.createFloatingIsland(0, 0, 0, 7.5, 6, '#48cae4');

    // Ancient Entrance Runic Archway
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.4, 4.5);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#adb5bd',
      roughness: 0.6,
      metalness: 0.2,
    });
    const pillarGeo = new THREE.BoxGeometry(0.5, 3.2, 0.5);

    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-1.8, 1.6, 0);
    leftPillar.castShadow = true;
    archGroup.add(leftPillar);
    // Tree & Arch obstacles (solid pillars that block walking through)
    this.collisionSystem.addCylinder(-1.8, 4.5, 0.4);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(1.8, 1.6, 0);
    rightPillar.castShadow = true;
    archGroup.add(rightPillar);
    this.collisionSystem.addCylinder(1.8, 4.5, 0.4);

    const beamGeo = new THREE.BoxGeometry(4.2, 0.5, 0.6);
    const beam = new THREE.Mesh(beamGeo, pillarMat);
    beam.position.set(0, 3.3, 0);
    beam.castShadow = true;
    archGroup.add(beam);

    // Glowing heart talisman atop arch
    const talismanGeo = new THREE.DodecahedronGeometry(0.35);
    const talismanMat = new THREE.MeshStandardMaterial({
      color: '#ff4d6d',
      emissive: '#ff4d6d',
      emissiveIntensity: 0.8,
    });
    const talisman = new THREE.Mesh(talismanGeo, talismanMat);
    talisman.position.set(0, 3.8, 0);
    archGroup.add(talisman);

    this.rootGroup.add(archGroup);

    // Decorative Bonsai Cherry Trees
    this.createCherryTree(-4.5, 0.4, -2.5);
    this.createCherryTree(4.5, 0.4, -2.5);

    // Central ancient fountain / reflection circle
    const pondGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16);
    const pondMat = new THREE.MeshStandardMaterial({
      color: '#4cc9f0',
      roughness: 0.1,
      metalness: 0.9,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(0, 0.42, 0);
    this.rootGroup.add(pond);
  }

  /**
   * Floating Cherry Tree helper
   */
  private createCherryTree(x: number, y: number, z: number): void {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: '#582f0e', roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.2, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.1;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: '#ff758f',
      roughness: 0.6,
      emissive: '#ffb3c1',
      emissiveIntensity: 0.2,
    });

    const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), foliageMat);
    f1.position.set(0, 2.4, 0);
    tree.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), foliageMat);
    f2.position.set(0.7, 2.8, 0.3);
    tree.add(f2);

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), foliageMat);
    f3.position.set(-0.6, 2.6, -0.4);
    tree.add(f3);

    this.rootGroup.add(tree);
    this.collisionSystem.addCylinder(x, z, 0.6);
  }

  /**
   * Floating Stepping Stones bridging across islands
   */
  private buildSteppingStones(): void {
    // Left path to West Island
    const leftStones = [
      { x: -9.5, y: -0.2, z: 0.5, r: 1.2 },
      { x: -12.5, y: 0.2, z: -1.0, r: 1.3 },
    ];
    leftStones.forEach((s, idx) => {
      const stone = this.createFloatingIsland(s.x, s.y, s.z, s.r, 2.5, '#72efdd');
      this.floatingPlatforms.push({
        mesh: stone,
        initialY: s.y,
        speed: 1.2 + idx * 0.3,
        offset: idx * 1.5,
      });
    });

    // Right path to East Island
    const rightStones = [
      { x: 9.5, y: -0.1, z: 0.5, r: 1.2 },
      { x: 12.5, y: 0.3, z: -1.0, r: 1.3 },
    ];
    rightStones.forEach((s, idx) => {
      const stone = this.createFloatingIsland(s.x, s.y, s.z, s.r, 2.5, '#f72585');
      this.floatingPlatforms.push({
        mesh: stone,
        initialY: s.y,
        speed: 1.1 + idx * 0.4,
        offset: idx * 2.0,
      });
    });
  }

  /**
   * West Island: Pressure Plate A & Azure Crystal
   */
  private buildWestIsland(): void {
    const islandX = -17.5;
    const islandZ = -2.0;
    this.createFloatingIsland(islandX, 0.2, islandZ, 4.2, 4.5, '#4895ef');

    // Switch A (Pressure Plate)
    const switchPos = new THREE.Vector3(islandX, 0.6, islandZ + 1.0);
    this.switchA = this.createPressureSwitch('switchA', switchPos, '#4cc9f0');

    // Collectible Azure Star Crystal
    this.createCrystal('azure_crystal', new THREE.Vector3(islandX, 2.0, islandZ - 1.5), '#00f5d4');
  }

  /**
   * East Island: Pressure Plate B & Rose Crystal
   */
  private buildEastIsland(): void {
    const islandX = 17.5;
    const islandZ = -2.0;
    this.createFloatingIsland(islandX, 0.2, islandZ, 4.2, 4.5, '#f72585');

    // Switch B (Pressure Plate)
    const switchPos = new THREE.Vector3(islandX, 0.6, islandZ + 1.0);
    this.switchB = this.createPressureSwitch('switchB', switchPos, '#ff4d6d');

    // Collectible Rose Star Crystal
    this.createCrystal('rose_crystal', new THREE.Vector3(islandX, 2.0, islandZ - 1.5), '#ff007f');
  }

  /**
   * Create interactive glowing pressure plate
   */
  private createPressureSwitch(
    id: 'switchA' | 'switchB',
    position: THREE.Vector3,
    glowColor: string
  ): PressureSwitch {
    const group = new THREE.Group();
    group.position.copy(position);

    // Outer rim
    const rimGeo = new THREE.CylinderGeometry(1.1, 1.15, 0.12, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#343a40',
      metalness: 0.8,
      roughness: 0.3,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    group.add(rim);

    // Inner glowing plate
    const padGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.16, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.3,
      roughness: 0.4,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.05;
    group.add(pad);

    // Rune ring
    const ringGeo = new THREE.RingGeometry(0.6, 0.75, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.14;
    group.add(ring);

    this.rootGroup.add(group);

    return {
      id,
      position,
      radius: 1.05,
      isActive: false,
      mesh: group,
      lightMesh: pad,
    };
  }

  /**
   * Materialized Crystalline Energy Bridge spanning to Sanctuary
   */
  private buildEnergyBridge(): void {
    this.energyBridgeGroup.position.set(0, 0.4, -10.5);

    // 5 bridge segments
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: '#7209b7',
      emissive: '#4cc9f0',
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.15, // Starts dormant/invisible
      roughness: 0.1,
      metalness: 0.8,
    });

    for (let i = 0; i < 5; i++) {
      const z = -i * 2.2;
      const segGeo = new THREE.BoxGeometry(3.2, 0.25, 1.8);
      const seg = new THREE.Mesh(segGeo, bridgeMat);
      seg.position.set(0, 0, z);
      this.energyBridgeGroup.add(seg);
    }

    this.rootGroup.add(this.energyBridgeGroup);
  }

  public isBridgeSolid = false;

  /**
   * Set energy bridge active / solid
   */
  public setBridgeActive(active: boolean): void {
    this.isBridgeSolid = active;
    this.energyBridgeGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.opacity = active ? 0.9 : 0.15;
        mat.emissiveIntensity = active ? 0.9 : 0.2;
      }
    });
  }

  /**
   * Calculate ground surface elevation under character (x, z)
   * Returns y elevation when above an island or stepping stone, or null if over the open sky void.
   */
  public getSurfaceElevation(x: number, z: number): number | null {
    return WorldPhysicsValidator.getSurfaceElevation(x, z, this.isBridgeSolid);
  }

  /**
   * Resolves continuous sliding collision against all static walls and obstacles.
   */
  public resolvePlayerPhysics(
    targetPos: THREE.Vector3,
    prevPos: THREE.Vector3,
    isGrounded: boolean
  ): { position: THREE.Vector3; isGrounded: boolean; surfaceElevation: number | null } {
    const res = WorldPhysicsValidator.validateAndResolvePosition(
      targetPos,
      prevPos,
      isGrounded,
      this.isBridgeSolid
    );
    return {
      position: new THREE.Vector3(res.position.x, res.position.y, res.position.z),
      isGrounded: res.isGrounded,
      surfaceElevation: res.surfaceElevation,
    };
  }

  /**
   * Ancient Sanctuary & Teleportation Portal
   */
  private buildCelestialSanctuary(): void {
    const sancX = 0;
    const sancY = 0.8;
    const sancZ = -26.0;

    this.createFloatingIsland(sancX, sancY, sancZ, 6.0, 7.0, '#7b2cbf');

    // Sanctuary pillars
    const pillarPositions = [
      { x: -3.0, z: sancZ - 2.5 },
      { x: 3.0, z: sancZ - 2.5 },
      { x: -3.0, z: sancZ + 2.5 },
      { x: 3.0, z: sancZ + 2.5 },
    ];

    pillarPositions.forEach((p) => {
      const pilGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.0, 12);
      const pilMat = new THREE.MeshStandardMaterial({ color: '#e0aaff', roughness: 0.4 });
      const pil = new THREE.Mesh(pilGeo, pilMat);
      pil.position.set(p.x, sancY + 2.0, p.z);
      pil.castShadow = true;
      this.rootGroup.add(pil);
      this.collisionSystem.addCylinder(p.x, p.z, 0.45);
    });

    // Master Celestial Portal
    this.portalGroup.position.set(sancX, sancY + 2.5, sancZ);

    // Outer portal ring
    const ringGeo = new THREE.TorusGeometry(2.0, 0.22, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#f72585',
      emissive: '#b5179e',
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const portalRing = new THREE.Mesh(ringGeo, ringMat);
    this.portalGroup.add(portalRing);

    // Portal inner shimmering vortex
    const discGeo = new THREE.CircleGeometry(1.8, 24);
    const discMat = new THREE.MeshBasicMaterial({
      color: '#4cc9f0',
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const vortex = new THREE.Mesh(discGeo, discMat);
    this.portalGroup.add(vortex);

    this.rootGroup.add(this.portalGroup);

    // Master Star Crystal in Sanctuary
    this.createCrystal('celestial_shard', new THREE.Vector3(sancX, sancY + 1.8, sancZ + 2.5), '#ffd166');
  }

  /**
   * Helper to spawn spinning 3D collectible crystals
   */
  private createCrystal(id: string, position: THREE.Vector3, color: string): void {
    const group = new THREE.Group();
    group.position.copy(position);

    // Dual-cone octahedron gemstone
    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    crystalGeo.scale(0.8, 1.4, 0.8);
    const crystalMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(crystalGeo, crystalMat);
    mesh.castShadow = true;
    group.add(mesh);

    // Orbiting sparkle ring
    const ringGeo = new THREE.TorusGeometry(0.7, 0.03, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    this.rootGroup.add(group);

    this.crystals.push({
      id,
      mesh: group,
      position,
      color,
      collected: false,
    });
  }

  /**
   * Ambient floating cosmic dust / starlight motes
   */
  private buildFloatingParticles(): void {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      color: '#e2afff',
      size: 0.2,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.particlesGroup = new THREE.Points(geo, pMat);
    this.rootGroup.add(this.particlesGroup);
  }

  /**
   * Per-frame animation for crystals, floating platforms, and portal
   */
  public update(time: number): void {
    // 1. Bob floating stepping stones
    this.floatingPlatforms.forEach((p) => {
      p.mesh.position.y = p.initialY + Math.sin(time * p.speed + p.offset) * 0.35;
    });

    // 2. Spin collectibles
    this.crystals.forEach((c) => {
      if (!c.collected) {
        c.mesh.rotation.y = time * 2.0;
        c.mesh.position.y = c.position.y + Math.sin(time * 3.0) * 0.15;
      }
    });

    // 3. Spin portal vortex & ring
    if (this.portalGroup) {
      this.portalGroup.rotation.z = time * 0.5;
    }

    // 4. Drift starlight particles
    if (this.particlesGroup) {
      this.particlesGroup.rotation.y = time * 0.03;
    }
  }

  /**
   * Cleanup Three.js materials and geometries
   */
  public dispose(): void {
    this.rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
