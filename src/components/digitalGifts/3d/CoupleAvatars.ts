import * as THREE from 'three';

export type CharacterType = 'boy' | 'galaxia';

export type RomanticMoment =
  | 'idle'
  | 'walk'
  | 'run'
  | 'hold_hands'
  | 'hug'
  | 'kiss'
  | 'dance'
  | 'sit'
  | 'wave'
  | 'jump';

export interface AvatarOptions {
  name: string;
  characterType: CharacterType;
  primaryColor?: string;
  accentColor?: string;
  isPartner?: boolean;
}

export class CoupleAvatar {
  public group: THREE.Group;
  public options: AvatarOptions;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isMoving = false;
  public heading = 0; // rotation around Y
  public activeMoment: RomanticMoment = 'idle';
  public momentElapsed = 0;

  // Jump physics
  public isGrounded = true;
  public verticalVelocity = 0;
  public jumpHeightOffset = 0;

  // Joint nodes for silky-smooth procedural animation
  private bodyRoot: THREE.Group;
  private headGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private leftArmUpper: THREE.Group;
  private rightArmUpper: THREE.Group;
  private leftLegUpper: THREE.Group;
  private rightLegUpper: THREE.Group;
  private hairOrnaments: THREE.Object3D[] = [];
  private eyesMesh: THREE.Mesh | null = null;
  private auraParticles: THREE.Points | null = null;

  // Current smooth pose angles
  private curLArmX = 0;
  private curLArmZ = 0;
  private curRArmX = 0;
  private curRArmZ = 0;
  private curLLegX = 0;
  private curRLegX = 0;
  private curTorsoPitch = 0;
  private curHeadPitch = 0;
  private curHeadYaw = 0;

  private walkCycle = 0;

  constructor(options: AvatarOptions) {
    this.options = options;
    this.group = new THREE.Group();
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    if (options.characterType === 'boy') {
      this.buildBoyCharacter();
    } else {
      this.buildGalaxiaGirlCharacter();
    }

    this.createNameplate(options.name);
  }

  /**
   * Character Boy 1 (Reference: https://skfb.ly/oMnnr)
   * Stylized Anime Boy with layered hair, streetwear jacket, fitted pants, and sneakers
   */
  private buildBoyCharacter(): void {
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#FFDEC8',
      roughness: 0.55,
      metalness: 0.05,
    });

    const jacketColor = this.options.primaryColor || '#2962FF'; // Vibrant cobalt streetwear jacket
    const jacketMat = new THREE.MeshStandardMaterial({
      color: jacketColor,
      roughness: 0.45,
      metalness: 0.1,
    });

    const innerTeeMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.6,
    });

    const pantsColor = this.options.accentColor || '#263238'; // Dark charcoal pants
    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: '#3E2723', // Deep chestnut anime hair
      roughness: 0.65,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#ECEFF1',
      roughness: 0.35,
    });

    // 1. Torso (Jacket + Inner Tee)
    const torsoGeom = new THREE.CapsuleGeometry(0.24, 0.46, 8, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeom, jacketMat);
    this.torsoMesh.position.set(0, 0.88, 0);
    this.torsoMesh.castShadow = true;
    this.bodyRoot.add(this.torsoMesh);

    // Inner white shirt insert
    const teeGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.42, 8);
    const tee = new THREE.Mesh(teeGeom, innerTeeMat);
    tee.position.set(0, 0.02, 0.08);
    this.torsoMesh.add(tee);

    // Jacket collar
    const collarGeom = new THREE.TorusGeometry(0.2, 0.05, 6, 12, Math.PI);
    collarGeom.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeom, jacketMat);
    collar.position.set(0, 0.28, 0.04);
    this.torsoMesh.add(collar);

    // 2. Head & Anime Boy Hair
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.4, 0);
    this.bodyRoot.add(this.headGroup);

    const headGeom = new THREE.SphereGeometry(0.22, 16, 16);
    headGeom.scale(1.0, 1.08, 1.02);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Layered Anime Hair (Spiky / Tousled bangs)
    const hairCapGeom = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairCap = new THREE.Mesh(hairCapGeom, hairMat);
    hairCap.position.set(0, 0.04, -0.02);
    this.headGroup.add(hairCap);

    // Anime bangs strands
    const strandGeom = new THREE.ConeGeometry(0.06, 0.18, 4);
    strandGeom.rotateX(-Math.PI / 4);
    for (let b = -3; b <= 3; b++) {
      const strand = new THREE.Mesh(strandGeom, hairMat);
      strand.position.set(b * 0.055, 0.12, 0.18);
      strand.rotation.z = b * -0.12;
      this.headGroup.add(strand);
    }

    // Expressive Anime Eyes
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 128;
    eyeCanvas.height = 64;
    const eCtx = eyeCanvas.getContext('2d');
    if (eCtx) {
      // Clear
      eCtx.clearRect(0, 0, 128, 64);
      // Left eye
      eCtx.fillStyle = '#1E88E5'; // Bright blue anime iris
      eCtx.beginPath();
      eCtx.ellipse(38, 34, 14, 18, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = '#0D47A1';
      eCtx.beginPath();
      eCtx.ellipse(38, 34, 8, 10, 0, 0, Math.PI * 2);
      eCtx.fill();
      // Highlight
      eCtx.fillStyle = '#FFFFFF';
      eCtx.beginPath();
      eCtx.arc(33, 26, 5, 0, Math.PI * 2);
      eCtx.fill();

      // Right eye
      eCtx.fillStyle = '#1E88E5';
      eCtx.beginPath();
      eCtx.ellipse(90, 34, 14, 18, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = '#0D47A1';
      eCtx.beginPath();
      eCtx.ellipse(90, 34, 8, 10, 0, 0, Math.PI * 2);
      eCtx.fill();
      // Highlight
      eCtx.fillStyle = '#FFFFFF';
      eCtx.beginPath();
      eCtx.arc(85, 26, 5, 0, Math.PI * 2);
      eCtx.fill();
    }
    const eyeTex = new THREE.CanvasTexture(eyeCanvas);
    eyeTex.colorSpace = THREE.SRGBColorSpace;
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTex, transparent: true });
    const eyeGeom = new THREE.PlaneGeometry(0.24, 0.12);
    this.eyesMesh = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyesMesh.position.set(0, 0.02, 0.22);
    this.headGroup.add(this.eyesMesh);

    // Warm faint smile
    const smileGeom = new THREE.TorusGeometry(0.04, 0.008, 4, 8, Math.PI);
    smileGeom.rotateX(Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: '#A1554A' });
    const smile = new THREE.Mesh(smileGeom, smileMat);
    smile.position.set(0, -0.1, 0.21);
    this.headGroup.add(smile);

    // 3. Arms & Joints
    const armGeom = new THREE.CapsuleGeometry(0.07, 0.38, 6, 8);

    // Left Arm
    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.32, 1.15, 0);
    const lArmMesh = new THREE.Mesh(armGeom, jacketMat);
    lArmMesh.position.set(0, -0.22, 0);
    lArmMesh.castShadow = true;
    this.leftArmUpper.add(lArmMesh);
    // Hand
    const handGeom = new THREE.SphereGeometry(0.065, 8, 8);
    const lHand = new THREE.Mesh(handGeom, skinMat);
    lHand.position.set(0, -0.44, 0);
    this.leftArmUpper.add(lHand);
    this.bodyRoot.add(this.leftArmUpper);

    // Right Arm
    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.32, 1.15, 0);
    const rArmMesh = new THREE.Mesh(armGeom, jacketMat);
    rArmMesh.position.set(0, -0.22, 0);
    rArmMesh.castShadow = true;
    this.rightArmUpper.add(rArmMesh);
    // Hand
    const rHand = new THREE.Mesh(handGeom, skinMat);
    rHand.position.set(0, -0.44, 0);
    this.rightArmUpper.add(rHand);
    this.bodyRoot.add(this.rightArmUpper);

    // 4. Legs & Sneakers
    const legGeom = new THREE.CapsuleGeometry(0.08, 0.44, 6, 8);

    // Left Leg
    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.13, 0.65, 0);
    const lLegMesh = new THREE.Mesh(legGeom, pantsMat);
    lLegMesh.position.set(0, -0.24, 0);
    lLegMesh.castShadow = true;
    this.leftLegUpper.add(lLegMesh);

    // High-top sneaker
    const shoeGeom = new THREE.BoxGeometry(0.12, 0.09, 0.22);
    const lShoe = new THREE.Mesh(shoeGeom, shoeMat);
    lShoe.position.set(0, -0.55, 0.04);
    lShoe.castShadow = true;
    this.leftLegUpper.add(lShoe);
    this.bodyRoot.add(this.leftLegUpper);

    // Right Leg
    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.13, 0.65, 0);
    const rLegMesh = new THREE.Mesh(legGeom, pantsMat);
    rLegMesh.position.set(0, -0.24, 0);
    rLegMesh.castShadow = true;
    this.rightLegUpper.add(rLegMesh);

    const rShoe = new THREE.Mesh(shoeGeom, shoeMat);
    rShoe.position.set(0, -0.55, 0.04);
    rShoe.castShadow = true;
    this.rightLegUpper.add(rShoe);
    this.bodyRoot.add(this.rightLegUpper);
  }

  /**
   * Galaxia - Anime Girl (Reference: https://skfb.ly/o7qwD)
   * Celestial Anime Girl with long flowing twin-tail hair, cosmic dress, ribbons, and star particles
   */
  private buildGalaxiaGirlCharacter(): void {
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#FFF0EA',
      roughness: 0.5,
      metalness: 0.05,
    });

    const dressColor = this.options.primaryColor || '#EC407A'; // Cosmic rose / magenta
    const dressMat = new THREE.MeshStandardMaterial({
      color: dressColor,
      roughness: 0.4,
      metalness: 0.15,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: '#FFD54F',
      metalness: 0.8,
      roughness: 0.2,
    });

    const galaxyHairColor = this.options.accentColor || '#7E57C2'; // Cosmic violet galaxy hair
    const hairMat = new THREE.MeshStandardMaterial({
      color: galaxyHairColor,
      roughness: 0.5,
      metalness: 0.1,
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: '#4A148C', // Deep violet anime boots
      roughness: 0.4,
    });

    // 1. Torso & Celestial Skater Dress
    const torsoGeom = new THREE.CapsuleGeometry(0.21, 0.42, 8, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeom, dressMat);
    this.torsoMesh.position.set(0, 0.86, 0);
    this.torsoMesh.castShadow = true;
    this.bodyRoot.add(this.torsoMesh);

    // Flared Skater Skirt
    const skirtGeom = new THREE.ConeGeometry(0.38, 0.35, 16, 1, true);
    skirtGeom.rotateX(Math.PI);
    const skirt = new THREE.Mesh(skirtGeom, dressMat);
    skirt.position.set(0, -0.16, 0);
    skirt.castShadow = true;
    this.torsoMesh.add(skirt);

    // Gold waist ribbon & star belt
    const beltGeom = new THREE.TorusGeometry(0.22, 0.03, 6, 16);
    beltGeom.rotateX(Math.PI / 2);
    const belt = new THREE.Mesh(beltGeom, goldTrimMat);
    belt.position.set(0, 0.02, 0);
    this.torsoMesh.add(belt);

    // 2. Head, Twin-Tails & Star Hair Ornaments
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.36, 0);
    this.bodyRoot.add(this.headGroup);

    const headGeom = new THREE.SphereGeometry(0.21, 16, 16);
    headGeom.scale(1.0, 1.05, 1.0);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Hair cap
    const hairCapGeom = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairCap = new THREE.Mesh(hairCapGeom, hairMat);
    hairCap.position.set(0, 0.04, -0.02);
    this.headGroup.add(hairCap);

    // Front soft fringe bangs
    for (let b = -3; b <= 3; b++) {
      const bangGeom = new THREE.ConeGeometry(0.045, 0.16, 4);
      bangGeom.rotateX(-Math.PI / 4);
      const bang = new THREE.Mesh(bangGeom, hairMat);
      bang.position.set(b * 0.05, 0.11, 0.17);
      bang.rotation.z = b * -0.08;
      this.headGroup.add(bang);
    }

    // Long Flowing Twin-Tails (Left & Right)
    const twinTailCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.15, -0.05),
      new THREE.Vector3(-0.38, -0.2, -0.1),
      new THREE.Vector3(-0.35, -0.65, 0.02),
    ]);
    const twinTailGeomL = new THREE.TubeGeometry(twinTailCurveL, 12, 0.065, 6, false);
    const twinTailL = new THREE.Mesh(twinTailGeomL, hairMat);
    this.headGroup.add(twinTailL);
    this.hairOrnaments.push(twinTailL);

    const twinTailCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, 0.15, -0.05),
      new THREE.Vector3(0.38, -0.2, -0.1),
      new THREE.Vector3(0.35, -0.65, 0.02),
    ]);
    const twinTailGeomR = new THREE.TubeGeometry(twinTailCurveR, 12, 0.065, 6, false);
    const twinTailR = new THREE.Mesh(twinTailGeomR, hairMat);
    this.headGroup.add(twinTailR);
    this.hairOrnaments.push(twinTailR);

    // Star hairpins atop twin-tails
    const starGeom = new THREE.DodecahedronGeometry(0.05, 0);
    const starL = new THREE.Mesh(starGeom, goldTrimMat);
    starL.position.set(-0.24, 0.16, 0.02);
    this.headGroup.add(starL);

    const starR = new THREE.Mesh(starGeom, goldTrimMat);
    starR.position.set(0.24, 0.16, 0.02);
    this.headGroup.add(starR);

    // Expressive Starry Anime Eyes
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 128;
    eyeCanvas.height = 64;
    const eCtx = eyeCanvas.getContext('2d');
    if (eCtx) {
      eCtx.clearRect(0, 0, 128, 64);
      // Iris purple & pink gradient
      const grad = eCtx.createRadialGradient(38, 34, 2, 38, 34, 16);
      grad.addColorStop(0, '#F48FB1');
      grad.addColorStop(1, '#8E24AA');

      // Left eye
      eCtx.fillStyle = grad;
      eCtx.beginPath();
      eCtx.ellipse(38, 34, 15, 19, 0, 0, Math.PI * 2);
      eCtx.fill();
      // Starry highlight
      eCtx.fillStyle = '#FFFFFF';
      eCtx.beginPath();
      eCtx.arc(32, 25, 5, 0, Math.PI * 2);
      eCtx.arc(42, 38, 3, 0, Math.PI * 2);
      eCtx.fill();

      // Right eye
      eCtx.fillStyle = grad;
      eCtx.beginPath();
      eCtx.ellipse(90, 34, 15, 19, 0, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = '#FFFFFF';
      eCtx.beginPath();
      eCtx.arc(84, 25, 5, 0, Math.PI * 2);
      eCtx.arc(94, 38, 3, 0, Math.PI * 2);
      eCtx.fill();
    }
    const eyeTex = new THREE.CanvasTexture(eyeCanvas);
    eyeTex.colorSpace = THREE.SRGBColorSpace;
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTex, transparent: true });
    const eyeGeom = new THREE.PlaneGeometry(0.24, 0.12);
    this.eyesMesh = new THREE.Mesh(eyeGeom, eyeMat);
    this.eyesMesh.position.set(0, 0.02, 0.21);
    this.headGroup.add(this.eyesMesh);

    // Cute rosy cheeks blush
    const blushCanvas = document.createElement('canvas');
    blushCanvas.width = 128;
    blushCanvas.height = 32;
    const bCtx = blushCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = 'rgba(255, 64, 129, 0.45)';
      bCtx.beginPath();
      bCtx.ellipse(32, 16, 12, 6, 0, 0, Math.PI * 2);
      bCtx.ellipse(96, 16, 12, 6, 0, 0, Math.PI * 2);
      bCtx.fill();
    }
    const blushTex = new THREE.CanvasTexture(blushCanvas);
    const blushMat = new THREE.MeshBasicMaterial({ map: blushTex, transparent: true });
    const blushMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.06), blushMat);
    blushMesh.position.set(0, -0.06, 0.21);
    this.headGroup.add(blushMesh);

    // 3. Arms
    const armGeom = new THREE.CapsuleGeometry(0.065, 0.36, 6, 8);

    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.28, 1.12, 0);
    const lArmMesh = new THREE.Mesh(armGeom, skinMat);
    lArmMesh.position.set(0, -0.2, 0);
    lArmMesh.castShadow = true;
    this.leftArmUpper.add(lArmMesh);
    this.bodyRoot.add(this.leftArmUpper);

    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.28, 1.12, 0);
    const rArmMesh = new THREE.Mesh(armGeom, skinMat);
    rArmMesh.position.set(0, -0.2, 0);
    rArmMesh.castShadow = true;
    this.rightArmUpper.add(rArmMesh);
    this.bodyRoot.add(this.rightArmUpper);

    // 4. Legs & Boots
    const legGeom = new THREE.CapsuleGeometry(0.075, 0.42, 6, 8);

    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.12, 0.62, 0);
    const lLegMesh = new THREE.Mesh(legGeom, skinMat);
    lLegMesh.position.set(0, -0.22, 0);
    lLegMesh.castShadow = true;
    this.leftLegUpper.add(lLegMesh);

    const bootGeom = new THREE.BoxGeometry(0.11, 0.18, 0.18);
    const lBoot = new THREE.Mesh(bootGeom, bootMat);
    lBoot.position.set(0, -0.46, 0.03);
    lBoot.castShadow = true;
    this.leftLegUpper.add(lBoot);
    this.bodyRoot.add(this.leftLegUpper);

    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.12, 0.62, 0);
    const rLegMesh = new THREE.Mesh(legGeom, skinMat);
    rLegMesh.position.set(0, -0.22, 0);
    rLegMesh.castShadow = true;
    this.rightLegUpper.add(rLegMesh);

    const rBoot = new THREE.Mesh(bootGeom, bootMat);
    rBoot.position.set(0, -0.46, 0.03);
    rBoot.castShadow = true;
    this.rightLegUpper.add(rBoot);
    this.bodyRoot.add(this.rightLegUpper);

    // Orbiting Starlight / Sparkle Aura
    this.createStarlightAura();
  }

  private createStarlightAura(): void {
    const auraCount = 15;
    const auraGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(auraCount * 3);
    for (let i = 0; i < auraCount; i++) {
      const theta = (i / auraCount) * Math.PI * 2;
      pos[i * 3] = Math.cos(theta) * 0.55;
      pos[i * 3 + 1] = 0.5 + (i / auraCount) * 0.9;
      pos[i * 3 + 2] = Math.sin(theta) * 0.55;
    }
    auraGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const sCtx = starCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#FFF59D';
      sCtx.font = '24px serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText('★', 16, 16);
    }
    const starTex = new THREE.CanvasTexture(starCanvas);
    const auraMat = new THREE.PointsMaterial({
      size: 0.35,
      map: starTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.auraParticles = new THREE.Points(auraGeo, auraMat);
    this.bodyRoot.add(this.auraParticles);
  }

  private createNameplate(text: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 10, 24, 0.85)';
      ctx.roundRect(10, 10, 236, 44, 22);
      ctx.fill();

      ctx.strokeStyle = this.options.characterType === 'boy' ? '#64B5F6' : '#F06292';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const badge = this.options.characterType === 'boy' ? `🧑 ${text}` : `✨ ${text}`;
      ctx.fillText(badge, 128, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(0, 1.88, 0);
    sprite.scale.set(1.5, 0.38, 1);
    this.group.add(sprite);
  }

  /**
   * Jump trigger with smooth physics
   */
  public triggerJump(): void {
    if (this.isGrounded) {
      this.isGrounded = false;
      this.verticalVelocity = 5.5; // Jump launch impulse
    }
  }

  /**
   * Set active romantic moment
   */
  public setMoment(moment: RomanticMoment): void {
    this.activeMoment = moment;
    this.momentElapsed = 0;
  }

  /**
   * Main per-frame smooth animation and kinematics update
   */
  public updateAnimation(delta: number, moving: boolean, speedMultiplier = 1.0): void {
    const clampedDelta = Math.min(delta, 0.1);
    this.isMoving = moving;
    this.momentElapsed += clampedDelta;

    // Handle Jump physics
    if (!this.isGrounded) {
      this.jumpHeightOffset += this.verticalVelocity * clampedDelta;
      this.verticalVelocity -= 14.0 * clampedDelta; // Gravity

      if (this.jumpHeightOffset <= 0) {
        this.jumpHeightOffset = 0;
        this.isGrounded = true;
        this.verticalVelocity = 0;
      }
    }
    this.bodyRoot.position.y = this.jumpHeightOffset;

    // Target limb angles
    let targetLArmX = 0;
    let targetLArmZ = 0;
    let targetRArmX = 0;
    let targetRArmZ = 0;
    let targetLLegX = 0;
    let targetRLegX = 0;
    let targetTorsoPitch = 0;
    let targetHeadPitch = 0;
    let targetHeadYaw = 0;

    // Compute target angles according to active moment or movement
    if (this.activeMoment === 'hug') {
      // Warm embrace pose: arms wrapped around partner, slight tilt
      targetLArmX = -Math.PI / 2.3;
      targetLArmZ = -0.45;
      targetRArmX = -Math.PI / 2.3;
      targetRArmZ = 0.45;
      targetTorsoPitch = 0.12;
      targetHeadPitch = -0.08;
      targetHeadYaw = this.options.characterType === 'boy' ? 0.2 : -0.2;
    } else if (this.activeMoment === 'kiss') {
      // Gentle romantic lean-in pose
      targetLArmX = -Math.PI / 4;
      targetLArmZ = -0.2;
      targetRArmX = -Math.PI / 4;
      targetRArmZ = 0.2;
      targetTorsoPitch = 0.22;
      targetHeadPitch = 0.15;
      targetHeadYaw = this.options.characterType === 'boy' ? 0.15 : -0.15;
    } else if (this.activeMoment === 'dance') {
      // Graceful waltz pose
      const spinPhase = this.momentElapsed * 3.5;
      targetLArmX = -Math.PI / 2;
      targetLArmZ = -0.55 + Math.sin(spinPhase) * 0.15;
      targetRArmX = -Math.PI / 3;
      targetRArmZ = 0.4;
      targetTorsoPitch = Math.sin(spinPhase) * 0.08;
    } else if (this.activeMoment === 'sit') {
      // Seated pose
      this.bodyRoot.position.y = -0.38 + this.jumpHeightOffset;
      targetLLegX = -Math.PI / 2;
      targetRLegX = -Math.PI / 2;
      targetLArmX = -Math.PI / 6;
      targetRArmX = -Math.PI / 6;
    } else if (this.activeMoment === 'wave') {
      // Waving with right arm
      targetRArmX = -Math.PI / 1.3;
      targetRArmZ = 0.35 + Math.sin(this.momentElapsed * 8) * 0.3;
      targetLArmX = 0;
    } else if (this.activeMoment === 'hold_hands') {
      // Holding hands: inner arm held out forward/side, outer arm gentle swing
      const isLeftPartner = this.options.characterType === 'boy';
      if (isLeftPartner) {
        targetRArmX = -Math.PI / 4;
        targetRArmZ = 0.3;
      } else {
        targetLArmX = -Math.PI / 4;
        targetLArmZ = -0.3;
      }

      if (moving) {
        this.walkCycle += clampedDelta * 8 * speedMultiplier;
        const swing = Math.sin(this.walkCycle) * 0.35;
        targetLLegX = swing;
        targetRLegX = -swing;
        if (isLeftPartner) targetLArmX = -swing * 0.6;
        else targetRArmX = swing * 0.6;
      }
    } else if (moving) {
      // Dynamic Walk / Run cycle
      const cycleSpeed = speedMultiplier > 1.2 ? 14 : 9;
      this.walkCycle += clampedDelta * cycleSpeed;
      const legAmplitude = speedMultiplier > 1.2 ? 0.65 : 0.45;
      const armAmplitude = speedMultiplier > 1.2 ? 0.6 : 0.38;

      const swing = Math.sin(this.walkCycle);
      targetLLegX = swing * legAmplitude;
      targetRLegX = -swing * legAmplitude;
      targetLArmX = -swing * armAmplitude;
      targetRArmX = swing * armAmplitude;

      // Natural forward body lean when sprinting
      targetTorsoPitch = speedMultiplier > 1.2 ? 0.16 : 0.06;

      // Natural vertical bounce
      const bounce = Math.abs(Math.sin(this.walkCycle * 2)) * (speedMultiplier > 1.2 ? 0.08 : 0.04);
      this.bodyRoot.position.y = bounce + this.jumpHeightOffset;
    } else {
      // Idle breathing
      const breath = Math.sin(this.momentElapsed * 2) * 0.02;
      this.torsoMesh.scale.set(1 + breath, 1 + breath, 1 + breath);
    }

    // Silky-Smooth Exponential Damping for all joint angles
    const dampRate = 14;
    this.curLArmX = THREE.MathUtils.damp(this.curLArmX, targetLArmX, dampRate, clampedDelta);
    this.curLArmZ = THREE.MathUtils.damp(this.curLArmZ, targetLArmZ, dampRate, clampedDelta);
    this.curRArmX = THREE.MathUtils.damp(this.curRArmX, targetRArmX, dampRate, clampedDelta);
    this.curRArmZ = THREE.MathUtils.damp(this.curRArmZ, targetRArmZ, dampRate, clampedDelta);
    this.curLLegX = THREE.MathUtils.damp(this.curLLegX, targetLLegX, dampRate, clampedDelta);
    this.curRLegX = THREE.MathUtils.damp(this.curRLegX, targetRLegX, dampRate, clampedDelta);
    this.curTorsoPitch = THREE.MathUtils.damp(this.curTorsoPitch, targetTorsoPitch, dampRate, clampedDelta);
    this.curHeadPitch = THREE.MathUtils.damp(this.curHeadPitch, targetHeadPitch, dampRate, clampedDelta);
    this.curHeadYaw = THREE.MathUtils.damp(this.curHeadYaw, targetHeadYaw, dampRate, clampedDelta);

    // Apply damped rotations
    this.leftArmUpper.rotation.set(this.curLArmX, 0, this.curLArmZ);
    this.rightArmUpper.rotation.set(this.curRArmX, 0, this.curRArmZ);
    this.leftLegUpper.rotation.x = this.curLLegX;
    this.rightLegUpper.rotation.x = this.curRLegX;
    this.torsoMesh.rotation.x = this.curTorsoPitch;
    this.headGroup.rotation.set(this.curHeadPitch, this.curHeadYaw, 0);

    // Twin-tail gentle hair physics for Galaxia girl
    if (this.hairOrnaments.length > 0) {
      const hairWave = Math.sin(this.momentElapsed * 3) * 0.06;
      this.hairOrnaments.forEach((h, idx) => {
        h.rotation.z = (idx === 0 ? -1 : 1) * (0.05 + hairWave);
      });
    }

    // Orbiting starlight aura rotation
    if (this.auraParticles) {
      this.auraParticles.rotation.y += clampedDelta * 1.5;
    }

    // Smooth heading rotation
    this.group.rotation.y = this.heading;
  }
}
