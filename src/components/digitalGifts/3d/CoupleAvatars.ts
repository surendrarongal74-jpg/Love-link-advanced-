import * as THREE from 'three';

export interface AvatarOptions {
  name: string;
  color: string;
  accentColor: string;
  isPartner?: boolean;
}

export class CoupleAvatar {
  public group: THREE.Group;
  public options: AvatarOptions;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isMoving = false;
  public heading = 0; // rotation around Y

  // Limb refs for walking animation
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private nameplateMesh: THREE.Mesh | null = null;
  private walkCycle = 0;

  constructor(options: AvatarOptions) {
    this.options = options;
    this.group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: '#FFDEC8',
      roughness: 0.6,
      metalness: 0.05,
    });

    const clothesMat = new THREE.MeshStandardMaterial({
      color: options.color,
      roughness: 0.5,
      metalness: 0.1,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: options.accentColor,
      roughness: 0.6,
      metalness: 0.1,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: '#33292F',
      roughness: 0.4,
    });

    // 1. Torso / Sweater
    const bodyGeom = new THREE.CapsuleGeometry(0.24, 0.45, 8, 12);
    this.bodyMesh = new THREE.Mesh(bodyGeom, clothesMat);
    this.bodyMesh.position.set(0, 0.85, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // 2. Head
    const headGeom = new THREE.SphereGeometry(0.22, 16, 16);
    this.headMesh = new THREE.Mesh(headGeom, skinMat);
    this.headMesh.position.set(0, 1.35, 0);
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Hair cap
    const hairMat = new THREE.MeshStandardMaterial({
      color: options.isPartner ? '#5D4037' : '#3E2723',
      roughness: 0.7,
    });
    const hairGeom = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.set(0, 1.39, -0.02);
    this.group.add(hair);

    // 3. Cute face features (eyes)
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#212121' });
    const eyeGeom = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-0.08, 1.36, 0.2);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.08, 1.36, 0.2);
    this.group.add(eyeL, eyeR);

    // Blush
    const blushMat = new THREE.MeshBasicMaterial({ color: '#FF8A80', transparent: true, opacity: 0.6 });
    const blushGeom = new THREE.CircleGeometry(0.035, 8);
    const blushL = new THREE.Mesh(blushGeom, blushMat);
    blushL.position.set(-0.12, 1.3, 0.19);
    blushL.rotation.y = -0.1;
    const blushR = new THREE.Mesh(blushGeom, blushMat);
    blushR.position.set(0.12, 1.3, 0.19);
    blushR.rotation.y = 0.1;
    this.group.add(blushL, blushR);

    // 4. Arms
    const armGeom = new THREE.CapsuleGeometry(0.07, 0.35, 6, 8);
    this.leftArm = new THREE.Mesh(armGeom, clothesMat);
    this.leftArm.position.set(-0.32, 0.85, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, clothesMat);
    this.rightArm.position.set(0.32, 0.85, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // 5. Legs
    const legGeom = new THREE.CapsuleGeometry(0.08, 0.42, 6, 8);
    this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
    this.leftLeg.position.set(-0.12, 0.35, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, pantsMat);
    this.rightLeg.position.set(0.12, 0.35, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Shoes
    const shoeGeom = new THREE.BoxGeometry(0.12, 0.08, 0.18);
    const shoeL = new THREE.Mesh(shoeGeom, shoeMat);
    shoeL.position.set(-0.12, 0.06, 0.04);
    shoeL.castShadow = true;
    const shoeR = new THREE.Mesh(shoeGeom, shoeMat);
    shoeR.position.set(0.12, 0.06, 0.04);
    shoeR.castShadow = true;
    this.group.add(shoeL, shoeR);

    // 6. Nameplate canvas sprite above avatar
    this.createNameplate(options.name);
  }

  private createNameplate(text: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Pill background
      ctx.fillStyle = 'rgba(26, 18, 28, 0.75)';
      ctx.roundRect(10, 10, 236, 44, 22);
      ctx.fill();

      // Border
      ctx.strokeStyle = this.options.isPartner ? 'rgba(255, 105, 180, 0.6)' : 'rgba(100, 181, 246, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = this.options.isPartner ? `💖 ${text}` : `✨ ${text}`;
      ctx.fillText(label, 128, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(0, 1.85, 0);
    sprite.scale.set(1.5, 0.38, 1);
    this.group.add(sprite);
  }

  public updateAnimation(delta: number, moving: boolean): void {
    this.isMoving = moving;

    if (moving) {
      this.walkCycle += delta * 10;
      const legSwing = Math.sin(this.walkCycle) * 0.45;
      const armSwing = Math.sin(this.walkCycle) * 0.4;

      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -armSwing;
      this.rightArm.rotation.x = armSwing;

      // Slight natural vertical bob
      this.bodyMesh.position.y = 0.85 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
      this.headMesh.position.y = 1.35 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
    } else {
      // Smoothly return limbs to idle rest
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
      this.bodyMesh.position.y = 0.85;
      this.headMesh.position.y = 1.35;
    }

    // Smooth heading rotation
    this.group.rotation.y = this.heading;
  }
}
