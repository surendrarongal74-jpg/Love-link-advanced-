import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CoupleAvatar, CharacterType, RomanticMoment } from '../digitalGifts/3d/CoupleAvatars';
import { SkyIslandsWorld } from './SkyIslandsWorld';
import { useGame3DSession } from './useGame3DSession';
import { gameAudio } from './GameAudio';
import { useVirtualJoystick } from '../../hooks/useVirtualJoystick';
import {
  Volume2,
  VolumeX,
  Compass,
  ArrowUp,
  Sparkles,
  Heart,
  RotateCcw,
  X,
  Award,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Users,
  Bot,
  Zap,
  Gamepad2,
  Move
} from 'lucide-react';

// Pre-allocated reusable math objects to eliminate garbage collection pauses in the 60fps game loop
const _vCurrentPos = new THREE.Vector3();
const _vTargetPos = new THREE.Vector3();
const _vCamFocus = new THREE.Vector3();
const _vCamPos = new THREE.Vector3();
const _vAiTarget = new THREE.Vector3();
const _vAiDir = new THREE.Vector3();
const _vPartnerTarget = new THREE.Vector3();
const _vPortalPos = new THREE.Vector3(0, 3.0, -26.0);

interface LoveLink3DGameViewProps {
  worldId?: string;
  onExit: () => void;
  onCompleteLevel?: (rewards: { coins: number; xp: number; badge: string }) => void;
  initialCharacter?: CharacterType;
}

export const LoveLink3DGameView: React.FC<LoveLink3DGameViewProps> = ({
  worldId = 'world1_sky_islands',
  onExit,
  onCompleteLevel,
  initialCharacter = 'boy',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [characterType, setCharacterType] = useState<CharacterType>(initialCharacter);
  const [isMuted, setIsMuted] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [emotePrompt, setEmotePrompt] = useState<string | null>(null);
  const [activeObjective, setActiveObjective] = useState('Explore the Sky Islands and locate the twin pressure plates');

  // Multiplayer session
  const {
    session,
    partnerOnlineInGame,
    partnerState,
    partnerName,
    myDisplayName,
    publishLocalState,
    updatePuzzleState,
    collectCrystal,
    resetPuzzle,
  } = useGame3DSession({
    worldId,
    characterType,
  });

  // Control settings: Sprint toggle and Control pad mode
  const [isSprintActive, setIsSprintActive] = useState(false);
  const isSprintActiveRef = useRef(false);
  isSprintActiveRef.current = isSprintActive;

  const [controlStyle, setControlStyle] = useState<'joystick' | 'dpad'>('joystick');

  // Dedicated high-performance Virtual Joystick hook
  const {
    baseElementRef: joystickBaseRef,
    stateRef: joystickStateRef,
    visualState: joystickVisual,
    handlers: joystickHandlers,
  } = useVirtualJoystick({
    radius: 48,
    deadzone: 0.06,
    springReturnDamping: 22,
    enableHaptics: true,
  });

  // D-Pad input ref
  const dpadRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Camera Orbit controls state (current smoothed & target)
  const currentCameraAngleRef = useRef({ theta: 0, phi: 0.35, distance: 6.5 });
  const targetCameraAngleRef = useRef({ theta: 0, phi: 0.35, distance: 6.5 });
  const isOrbitingRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  // Smooth velocity for acceleration & inertia
  const smoothVelocityRef = useRef(new THREE.Vector3(0, 0, 0));

  // Key states
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Engine refs
  const worldRef = useRef<SkyIslandsWorld | null>(null);
  const localAvatarRef = useRef<CoupleAvatar | null>(null);
  const partnerAvatarRef = useRef<CoupleAvatar | null>(null);
  const reqAnimRef = useRef<number | null>(null);
  const clockRef = useRef(new THREE.Clock());

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#1d1135', 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
    camera.position.set(0, 4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Build World
    const skyWorld = new SkyIslandsWorld();
    scene.add(skyWorld.rootGroup);
    worldRef.current = skyWorld;

    // 3. Spawn Local Player Avatar
    const localAvatar = new CoupleAvatar({
      name: myDisplayName,
      characterType,
      primaryColor: characterType === 'boy' ? '#2563eb' : '#ec4899',
      accentColor: characterType === 'boy' ? '#1e293b' : '#831843',
      isPartner: false,
    });
    localAvatar.group.position.set(-1.5, 0.4, 2.0);
    scene.add(localAvatar.group);
    localAvatarRef.current = localAvatar;

    // 4. Spawn Partner Avatar (complementary character)
    const partnerCharType: CharacterType = characterType === 'boy' ? 'galaxia' : 'boy';
    const partnerAvatar = new CoupleAvatar({
      name: partnerName,
      characterType: partnerCharType,
      primaryColor: partnerCharType === 'boy' ? '#0284c7' : '#f43f5e',
      accentColor: partnerCharType === 'boy' ? '#0f172a' : '#4c0519',
      isPartner: true,
    });
    partnerAvatar.group.position.set(1.5, 0.4, 2.0);
    scene.add(partnerAvatar.group);
    partnerAvatarRef.current = partnerAvatar;

    // 5. Input Listeners with Page Scroll Prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();

      // Prevent window scroll on game movement keys
      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code) ||
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)
      ) {
        e.preventDefault();
      }

      keysRef.current[key] = true;
      keysRef.current[code] = true;

      if (key === ' ' || e.code === 'Space') {
        if (localAvatar.isGrounded) {
          localAvatar.triggerJump();
          gameAudio.playJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
      keysRef.current[code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Unified Pointer Canvas Orbit for Touch & Mouse
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'CANVAS') return;

      // Ignore touch in bottom-left controller zone (joystick/dpad area)
      if (
        e.pointerType === 'touch' &&
        e.clientX < window.innerWidth * 0.45 &&
        e.clientY > window.innerHeight * 0.5
      ) {
        return;
      }

      isOrbitingRef.current = true;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isOrbitingRef.current) return;
      const dx = e.clientX - lastPointerPosRef.current.x;
      const dy = e.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      targetCameraAngleRef.current.theta -= dx * 0.0055;
      targetCameraAngleRef.current.phi = Math.max(
        0.08,
        Math.min(Math.PI / 2.25, targetCameraAngleRef.current.phi + dy * 0.0045)
      );
    };

    const handlePointerUp = () => {
      isOrbitingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      targetCameraAngleRef.current.distance = Math.max(
        3.2,
        Math.min(14.0, targetCameraAngleRef.current.distance + e.deltaY * 0.005)
      );
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    canvasDom.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', handleResize);

    // 6. Game Loop
    let lastTime = performance.now();
    let footstepTimer = 0;

    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);
      const currentTime = performance.now();
      // Clamp delta to [0.001, 0.033] for consistent 60-120hz frame pacing without stutter
      const delta = Math.min(Math.max((currentTime - lastTime) / 1000, 0.001), 0.033);
      lastTime = currentTime;
      const elapsed = clockRef.current.getElapsedTime();

      // Update SkyIslands animations
      skyWorld.update(elapsed);

      // 1. Read discrete keyboard input
      let rawKeyX = 0;
      let rawKeyZ = 0;

      if (keysRef.current['w'] || keysRef.current['arrowup']) rawKeyZ -= 1;
      if (keysRef.current['s'] || keysRef.current['arrowdown']) rawKeyZ += 1;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) rawKeyX -= 1;
      if (keysRef.current['d'] || keysRef.current['arrowright']) rawKeyX += 1;

      // Add discrete D-Pad button inputs if in D-Pad mode
      if (dpadRef.current.up) rawKeyZ -= 1;
      if (dpadRef.current.down) rawKeyZ += 1;
      if (dpadRef.current.left) rawKeyX -= 1;
      if (dpadRef.current.right) rawKeyX += 1;

      // Normalize diagonal keyboard vectors so diagonal motion isn't 41% faster
      const keyLen = Math.hypot(rawKeyX, rawKeyZ);
      let normKeyX = 0;
      let normKeyZ = 0;
      if (keyLen > 0.001) {
        normKeyX = rawKeyX / keyLen;
        normKeyZ = rawKeyZ / keyLen;
      }

      // 2. Read analog mobile touch virtual joystick vector (zero GC, zero re-render overhead)
      const joy = joystickStateRef.current;
      let moveX = normKeyX;
      let moveZ = normKeyZ;

      if (joy.isActive && joy.magnitude > 0) {
        moveX += joy.vector.x;
        moveZ += joy.vector.y;
      }

      const inputLen = Math.hypot(moveX, moveZ);
      const isMoving = inputLen > 0.05;

      // Sprint: Shift key, sprint toggle pill, or joystick pushed > 88%
      const isSprinting = Boolean(
        keysRef.current['shift'] ||
        isSprintActiveRef.current ||
        joy.isSprinting
      );

      const maxSpeed = isSprinting ? 7.0 : 4.0;
      const targetSpeed = Math.min(inputLen, 1.0) * maxSpeed;

      // Camera-relative direction calculation
      const camTheta = currentCameraAngleRef.current.theta;
      let desiredVelX = 0;
      let desiredVelZ = 0;

      if (isMoving) {
        const normX = moveX / inputLen;
        const normZ = moveZ / inputLen;
        const worldDirX = normX * Math.cos(camTheta) + normZ * Math.sin(camTheta);
        const worldDirZ = -normX * Math.sin(camTheta) + normZ * Math.cos(camTheta);
        desiredVelX = worldDirX * targetSpeed;
        desiredVelZ = worldDirZ * targetSpeed;
      }

      // Refined Acceleration & Deceleration Physics Curves:
      // - Rapid responsive attack curve (24 m/s^2)
      // - Opposing direction cut brake (36 m/s^2 for crisp turning without ice-skating)
      // - Natural exponential deceleration decay (18 m/s^2) on key release
      const curVelX = smoothVelocityRef.current.x;
      const curVelZ = smoothVelocityRef.current.z;
      const isOpposing = curVelX * desiredVelX + curVelZ * desiredVelZ < -0.1;

      const accelRate = isMoving ? (isOpposing ? 36.0 : 24.0) : 18.0;

      smoothVelocityRef.current.x = THREE.MathUtils.damp(curVelX, desiredVelX, accelRate, delta);
      smoothVelocityRef.current.z = THREE.MathUtils.damp(curVelZ, desiredVelZ, accelRate, delta);

      const activeSpeed = Math.hypot(smoothVelocityRef.current.x, smoothVelocityRef.current.z);
      const isCharacterMoving = activeSpeed > 0.04;

      if (isCharacterMoving) {
        _vCurrentPos.copy(localAvatar.group.position);
        _vTargetPos.set(
          _vCurrentPos.x + smoothVelocityRef.current.x * delta,
          _vCurrentPos.y,
          _vCurrentPos.z + smoothVelocityRef.current.z * delta
        );

        // Authoritative continuous sliding collision resolution against all static world geometry
        const physResult = skyWorld.resolvePlayerPhysics(_vTargetPos, _vCurrentPos, localAvatar.isGrounded);
        localAvatar.group.position.x = physResult.position.x;
        localAvatar.group.position.z = physResult.position.z;

        // Turn character smoothly towards movement direction with safe wrap-around
        const targetAngle = Math.atan2(smoothVelocityRef.current.x, smoothVelocityRef.current.z);
        let diff = targetAngle - localAvatar.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        localAvatar.heading += diff * Math.min(1.0, 18.0 * delta);
        localAvatar.group.rotation.y = localAvatar.heading;

        // Footstep sound cadence
        footstepTimer += delta;
        if (footstepTimer > (isSprinting ? 0.22 : 0.34)) {
          footstepTimer = 0;
          if (localAvatar.isGrounded) {
            gameAudio.playFootstep();
          }
        }
      }

      // Ground Surface Elevation & Platform Gravity
      const surfaceElevation = skyWorld.getSurfaceElevation(
        localAvatar.group.position.x,
        localAvatar.group.position.z
      );

      if (surfaceElevation !== null) {
        if (localAvatar.isGrounded) {
          localAvatar.group.position.y = THREE.MathUtils.damp(
            localAvatar.group.position.y,
            surfaceElevation,
            20,
            delta
          );
          // Solid floor anti-clipping clamp: feet can never penetrate below floor plane
          if (localAvatar.group.position.y < surfaceElevation) {
            localAvatar.group.position.y = surfaceElevation;
          }
        } else {
          // Landing detection
          if (localAvatar.group.position.y <= surfaceElevation + 0.08) {
            localAvatar.group.position.y = surfaceElevation;
            localAvatar.isGrounded = true;
            localAvatar.verticalVelocity = 0;
            localAvatar.jumpHeightOffset = 0;
          }
        }
      } else {
        // Falling off island edge into open sky
        localAvatar.isGrounded = false;
        localAvatar.group.position.y -= 14.0 * delta;

        // Respawn if fallen into void
        if (localAvatar.group.position.y < -7.5) {
          localAvatar.group.position.set(0, 0.4, 2.5);
          localAvatar.jumpHeightOffset = 0;
          localAvatar.verticalVelocity = 0;
          localAvatar.isGrounded = true;
          smoothVelocityRef.current.set(0, 0, 0);
          gameAudio.playEmoteChime();
          setEmotePrompt('Gently floated back to safe sanctuary ✨');
          setTimeout(() => setEmotePrompt(null), 3000);
        }
      }

      // Update avatar physics and limb animations
      localAvatar.updateAnimation(delta, isCharacterMoving, isSprinting ? 1.6 : 1.0);

      // 7. Synchronize or Simulate Partner Avatar (Zero GC)
      if (partnerAvatar) {
        if (partnerOnlineInGame && partnerState) {
          _vPartnerTarget.set(partnerState.position.x, partnerState.position.y, partnerState.position.z);
          partnerAvatar.group.position.lerp(_vPartnerTarget, Math.min(1.0, 14 * delta));
          partnerAvatar.heading = partnerState.heading;
          partnerAvatar.group.rotation.y = partnerState.heading;
          partnerAvatar.updateAnimation(delta, partnerState.movementState !== 'idle');
        } else {
          // AI Companion Mode
          const pPos = partnerAvatar.group.position;
          const localPos = localAvatar.group.position;
          const distToSwitchA = localPos.distanceTo(skyWorld.switchA.position);

          if (distToSwitchA < 1.8) {
            _vAiTarget.copy(skyWorld.switchB.position);
          } else {
            _vAiDir.subVectors(localPos, pPos);
            if (_vAiDir.length() > 2.5) {
              _vAiDir.normalize().multiplyScalar(2.0);
              _vAiTarget.subVectors(localPos, _vAiDir);
            } else {
              _vAiTarget.copy(pPos);
            }
          }

          _vAiDir.subVectors(_vAiTarget, pPos);
          _vAiDir.y = 0;
          const aiDist = _vAiDir.length();
          const aiMoving = aiDist > 0.25;

          if (aiMoving) {
            _vAiDir.normalize();
            const aiSpeed = Math.min(aiDist * 2.5, 3.8);
            partnerAvatar.group.position.addScaledVector(_vAiDir, aiSpeed * delta);
            const aiAngle = Math.atan2(_vAiDir.x, _vAiDir.z);
            partnerAvatar.group.rotation.y = aiAngle;
          }
          partnerAvatar.updateAnimation(delta, aiMoving, 1.0);
        }
      }

      // 8. Publish local player state to Firestore
      publishLocalState(
        {
          x: localAvatar.group.position.x,
          y: localAvatar.group.position.y,
          z: localAvatar.group.position.z,
        },
        localAvatar.heading,
        isMoving ? (isSprinting ? 'run' : 'walk') : 'idle',
        localAvatar.isGrounded,
        localAvatar.activeMoment || 'idle'
      );

      // 9. Check Pressure Switches Interaction
      const p1Pos = localAvatar.group.position;
      const p2Pos = partnerAvatar.group.position;

      const p1OnA = p1Pos.distanceTo(skyWorld.switchA.position) < skyWorld.switchA.radius;
      const p2OnA = p2Pos.distanceTo(skyWorld.switchA.position) < skyWorld.switchA.radius;
      const switchAActive = p1OnA || p2OnA;

      const p1OnB = p1Pos.distanceTo(skyWorld.switchB.position) < skyWorld.switchB.radius;
      const p2OnB = p2Pos.distanceTo(skyWorld.switchB.position) < skyWorld.switchB.radius;
      const switchBActive = p1OnB || p2OnB;

      // Visual feedback for switches
      if (switchAActive !== skyWorld.switchA.isActive) {
        skyWorld.switchA.isActive = switchAActive;
        const mat = skyWorld.switchA.lightMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = switchAActive ? 1.5 : 0.3;
        if (switchAActive) gameAudio.playSwitchActivate();
        updatePuzzleState({ switchAActive });
      }

      if (switchBActive !== skyWorld.switchB.isActive) {
        skyWorld.switchB.isActive = switchBActive;
        const mat = skyWorld.switchB.lightMesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = switchBActive ? 1.5 : 0.3;
        if (switchBActive) gameAudio.playSwitchActivate();
        updatePuzzleState({ switchBActive });
      }

      // Check Bridge State
      const bothSwitchesActive = switchAActive && switchBActive;
      const isBridgeExtended = Boolean(session?.puzzle?.bridgeExtended);
      if (bothSwitchesActive && !isBridgeExtended) {
        skyWorld.setBridgeActive(true);
        gameAudio.playBridgeForm();
        updatePuzzleState({ bridgeExtended: true });
        setActiveObjective('The Energy Bridge has materialized! Cross over to the Celestial Sanctuary!');
      }

      // 10. Check Crystal Collectibles
      const collectedCrystals = session?.puzzle?.crystalsCollected || [];
      skyWorld.crystals.forEach((crystal) => {
        if (!crystal.collected && !collectedCrystals.includes(crystal.id)) {
          const dist1 = p1Pos.distanceTo(crystal.position);
          const dist2 = p2Pos.distanceTo(crystal.position);
          if (dist1 < 1.4 || dist2 < 1.4) {
            crystal.collected = true;
            crystal.mesh.visible = false;
            gameAudio.playCrystalCollect();
            collectCrystal(crystal.id);
          }
        } else if (collectedCrystals.includes(crystal.id)) {
          crystal.collected = true;
          crystal.mesh.visible = false;
        }
      });

      // 11. Check Victory Portal Entry
      const isPortalUnlocked =
        Boolean(session?.puzzle?.portalUnlocked) || (bothSwitchesActive && collectedCrystals.length >= 2);
      if (isPortalUnlocked) {
        if (p1Pos.distanceTo(_vPortalPos) < 2.5) {
          if (!showVictoryModal) {
            gameAudio.playVictoryFanfare();
            setShowVictoryModal(true);
            if (onCompleteLevel) {
              onCompleteLevel({
                coins: 100,
                xp: 250,
                badge: 'Sky Pioneer 🌟',
              });
            }
          }
        }
      }

      // 12. Silky-Smooth Damped Third-Person Camera Update
      const curCam = currentCameraAngleRef.current;
      const targetCam = targetCameraAngleRef.current;
      curCam.theta = THREE.MathUtils.damp(curCam.theta, targetCam.theta, 16, delta);
      curCam.phi = THREE.MathUtils.damp(curCam.phi, targetCam.phi, 16, delta);
      curCam.distance = THREE.MathUtils.damp(curCam.distance, targetCam.distance, 14, delta);

      _vCamFocus.copy(localAvatar.group.position);
      _vCamFocus.y += 1.35;

      const camX = _vCamFocus.x + curCam.distance * Math.sin(curCam.theta) * Math.cos(curCam.phi);
      const camY = Math.max(0.6, _vCamFocus.y + curCam.distance * Math.sin(curCam.phi));
      const camZ = _vCamFocus.z + curCam.distance * Math.cos(curCam.theta) * Math.cos(curCam.phi);
      _vCamPos.set(camX, camY, camZ);

      camera.position.lerp(_vCamPos, Math.min(1.0, 16 * delta));
      camera.lookAt(_vCamFocus);

      renderer.render(scene, camera);
    };

    reqAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasDom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      canvasDom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      skyWorld.dispose();
      renderer.dispose();
    };
  }, [
    characterType,
    myDisplayName,
    partnerName,
    partnerOnlineInGame,
    partnerState,
    publishLocalState,
    updatePuzzleState,
    collectCrystal,
    session?.puzzle?.bridgeExtended,
    session?.puzzle?.crystalsCollected,
    session?.puzzle?.portalUnlocked,
    showVictoryModal,
    onCompleteLevel,
  ]);

  // D-Pad handlers for simple tactile touch controls
  const handleDpadPress = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    dpadRef.current[dir] = pressed;
  };

  // Camera recenter helper
  const handleRecenterCamera = () => {
    if (localAvatarRef.current) {
      targetCameraAngleRef.current.theta = localAvatarRef.current.heading;
      targetCameraAngleRef.current.phi = 0.35;
      targetCameraAngleRef.current.distance = 6.5;
    }
  };

  const handleJumpPress = useCallback(() => {
    if (localAvatarRef.current && localAvatarRef.current.isGrounded) {
      localAvatarRef.current.triggerJump();
      gameAudio.playJump();
    }
  }, []);

  const handleEmoteTrigger = (moment: RomanticMoment, label: string) => {
    if (localAvatarRef.current) {
      localAvatarRef.current.setMoment(moment);
      gameAudio.playEmoteChime();
      setEmotePrompt(label);
      setTimeout(() => setEmotePrompt(null), 3000);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Low-Occlusion Banner */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-2.5 text-white shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <h2 className="text-sm font-semibold tracking-wide">World 1: Sky Islands</h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 max-w-xs md:max-w-md">{activeObjective}</p>
          </div>

          {/* Crystals Counter */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3.5 py-2.5 text-white shadow-xl flex items-center gap-2 pointer-events-auto">
            <span className="text-base">💎</span>
            <span className="text-xs font-bold text-amber-300">
              {(session?.puzzle?.crystalsCollected?.length || 0)}/3 Crystals
            </span>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Partner Connection Status */}
          <div
            className={`px-3 py-2 rounded-2xl text-xs font-medium border flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
              partnerOnlineInGame
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-purple-950/70 border-purple-500/50 text-purple-200'
            }`}
          >
            {partnerOnlineInGame ? (
              <>
                <Users className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">{partnerName} Live</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden sm:inline">AI Partner Assist</span>
              </>
            )}
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => {
              const muted = gameAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-white flex items-center justify-center hover:bg-slate-800 transition active:scale-95 shadow-lg"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset World */}
          <button
            onClick={resetPuzzle}
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-white flex items-center justify-center hover:bg-slate-800 transition active:scale-95 shadow-lg"
            title="Reset Puzzle" aria-label="Reset Puzzle"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>

          {/* Exit Game */}
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-700/60 text-rose-200 flex items-center justify-center hover:bg-rose-900 transition active:scale-95 shadow-lg"
            title="Exit Adventure" aria-label="Exit Adventure"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Emote Notification Badge */}
      {emotePrompt && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500/90 to-purple-600/90 backdrop-blur-md text-white font-semibold text-xs px-4 py-2 rounded-full shadow-2xl border border-white/20 animate-bounce z-20 pointer-events-none">
          {emotePrompt}
        </div>
      )}

      {/* Bridge Emergence Alert */}
      {Boolean(session?.puzzle?.bridgeExtended) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-indigo-950/90 border border-indigo-400/50 text-indigo-200 font-semibold text-xs px-4 py-2 rounded-full shadow-2xl z-20 pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>The Crystalline Bridge is Open!</span>
        </div>
      )}

      {/* Bottom Left Controller HUD (Joystick / D-Pad + Sprint & Recenter) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col gap-2">
        {/* Toggle Mode: Joystick / D-Pad & Sprint Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 shadow-lg w-fit">
          <button
            onClick={() => setControlStyle('joystick')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition ${
              controlStyle === 'joystick'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Analog Joystick"
          >
            <Move className="w-3 h-3" />
            <span>Stick</span>
          </button>
          <button
            onClick={() => setControlStyle('dpad')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition ${
              controlStyle === 'dpad'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Directional Pad"
          >
            <Gamepad2 className="w-3 h-3" />
            <span>D-Pad</span>
          </button>

          <span className="w-px h-3.5 bg-slate-700/60 mx-0.5" />

          {/* Sprint Toggle */}
          <button
            onClick={() => setIsSprintActive(!isSprintActive)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition ${
              isSprintActive
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Sprint / Run"
          >
            <Zap className="w-3 h-3" />
            <span>{isSprintActive ? 'Sprint ON' : 'Walk'}</span>
          </button>

          {/* Recenter Camera */}
          <button
            onClick={handleRecenterCamera}
            className="p-1 rounded-xl text-slate-400 hover:text-indigo-300 transition"
            title="Recenter Camera behind Character" aria-label="Recenter Camera behind Character"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controller Body */}
        {controlStyle === 'joystick' ? (
          /* Virtual Analog Joystick (Supports Multi-Touch, Mouse, Pointer Capture) */
          <div
            ref={joystickBaseRef}
            {...joystickHandlers}
            style={{ touchAction: 'none' }}
            className={`w-32 h-32 rounded-full bg-slate-900/75 border-2 transition-colors backdrop-blur-md flex items-center justify-center relative select-none shadow-2xl cursor-grab active:cursor-grabbing ${
              joystickVisual.isActive ? 'border-indigo-400 shadow-indigo-500/20' : 'border-indigo-500/50'
            }`}
          >
            {/* Cardinal direction guides */}
            <span className="absolute top-1 text-[9px] text-slate-500 font-bold pointer-events-none">▲</span>
            <span className="absolute bottom-1 text-[9px] text-slate-500 font-bold pointer-events-none">▼</span>
            <span className="absolute left-1.5 text-[9px] text-slate-500 font-bold pointer-events-none">◀</span>
            <span className="absolute right-1.5 text-[9px] text-slate-500 font-bold pointer-events-none">▶</span>

            {/* Inner draggable thumb stick with spring physics */}
            <div
              style={{
                transform: `translate3d(${joystickVisual.knobX}px, ${joystickVisual.knobY}px, 0)`,
              }}
              className={`w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 border-2 border-white/80 shadow-xl pointer-events-none flex items-center justify-center transition-shadow ${
                joystickVisual.isActive ? 'shadow-indigo-500/50 shadow-lg scale-105' : ''
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white/50" />
            </div>
          </div>
        ) : (
          /* 4-Way Directional Pad */
          <div className="w-32 h-32 relative select-none bg-slate-900/70 border-2 border-indigo-500/50 backdrop-blur-md rounded-2xl shadow-2xl p-1 flex items-center justify-center">
            {/* Up / Forward */}
            <button
              onPointerDown={() => handleDpadPress('up', true)}
              onPointerUp={() => handleDpadPress('up', false)}
              onPointerCancel={() => handleDpadPress('up', false)}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-slate-800/90 active:bg-indigo-600 text-slate-300 active:text-white flex items-center justify-center shadow transition active:scale-90 border border-slate-700/60"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            {/* Down / Backward */}
            <button
              onPointerDown={() => handleDpadPress('down', true)}
              onPointerUp={() => handleDpadPress('down', false)}
              onPointerCancel={() => handleDpadPress('down', false)}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-slate-800/90 active:bg-indigo-600 text-slate-300 active:text-white flex items-center justify-center shadow transition active:scale-90 border border-slate-700/60"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            {/* Left */}
            <button
              onPointerDown={() => handleDpadPress('left', true)}
              onPointerUp={() => handleDpadPress('left', false)}
              onPointerCancel={() => handleDpadPress('left', false)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-800/90 active:bg-indigo-600 text-slate-300 active:text-white flex items-center justify-center shadow transition active:scale-90 border border-slate-700/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Right */}
            <button
              onPointerDown={() => handleDpadPress('right', true)}
              onPointerUp={() => handleDpadPress('right', false)}
              onPointerCancel={() => handleDpadPress('right', false)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-800/90 active:bg-indigo-600 text-slate-300 active:text-white flex items-center justify-center shadow transition active:scale-90 border border-slate-700/60"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/40" />
          </div>
        )}
      </div>

      {/* Quick Action & Emote Bar (Right Side) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20 pointer-events-auto">
        {/* Emote Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEmoteTrigger('hug', 'Sent a warm embrace to your partner! 💖')}
            className="w-11 h-11 rounded-2xl bg-slate-900/80 border border-pink-500/40 text-pink-300 flex items-center justify-center hover:bg-slate-800 transition active:scale-95 shadow-xl"
            title="Embrace Partner"
          >
            <Heart className="w-5 h-5 fill-pink-500/40" />
          </button>
          <button
            onClick={() => handleEmoteTrigger('wave', 'Waved enthusiastically! 👋')}
            className="w-11 h-11 rounded-2xl bg-slate-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-slate-800 transition active:scale-95 shadow-xl text-lg"
            title="Wave"
          >
            👋
          </button>
          <button
            onClick={() => handleEmoteTrigger('dance', 'Started dancing together! 💃🕺')}
            className="w-11 h-11 rounded-2xl bg-slate-900/80 border border-purple-500/40 text-purple-300 flex items-center justify-center hover:bg-slate-800 transition active:scale-95 shadow-xl text-lg"
            title="Dance"
          >
            ✨
          </button>
        </div>

        {/* Primary Action / Jump Cluster */}
        <div className="flex items-center gap-3">
          {/* Light Ability */}
          <button
            onClick={() => {
              gameAudio.playEmoteChime();
              setEmotePrompt('Illuminated ancient sky runes! ✨');
              setTimeout(() => setEmotePrompt(null), 2500);
            }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 border border-yellow-200/50 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-95"
            title="Shine Starlight"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-bold">SHINE</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={handleJumpPress}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-300/40 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition"
            title="Jump" aria-label="Jump"
          >
            <ArrowUp className="w-7 h-7" />
            <span className="text-[10px] font-extrabold tracking-wider">JUMP</span>
          </button>
        </div>
      </div>

      {/* Desktop Key Helper Hint */}
      <div className="hidden md:flex absolute bottom-4 left-36 text-[11px] text-slate-400/80 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 z-10 pointer-events-none gap-3">
        <span>WASD / Arrows to Move</span>
        <span>•</span>
        <span>Space to Jump</span>
        <span>•</span>
        <span>Drag to Orbit Camera</span>
      </div>

      {/* Victory Celebration Modal */}
      {showVictoryModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border border-purple-500/40 rounded-3xl p-6 text-center shadow-2xl text-white relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center shadow-xl shadow-pink-500/20 mb-4 animate-bounce">
              <Award className="w-10 h-10 text-slate-950" />
            </div>

            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Sky Islands Conquered!
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              You and <span className="text-pink-300 font-semibold">{partnerName}</span> synchronized your spirits,
              awakened the ancient celestial portal, and unlocked the gateway to future realms!
            </p>

            <div className="my-6 grid grid-cols-2 gap-3 bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4 text-left">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Rewards Granted</span>
                <span className="text-lg font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
                  🪙 +100 Love Coins
                </span>
                <span className="text-xs font-semibold text-purple-300">+250 Couple XP</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">New Badge</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  🌟 Sky Pioneer
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowVictoryModal(false);
                  onExit();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Return to Adventure Hub</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowVictoryModal(false);
                  resetPuzzle();
                }}
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
              >
                Replay Expedition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
