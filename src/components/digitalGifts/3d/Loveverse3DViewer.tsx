import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Compass,
  Footprints,
  Navigation,
  Heart,
  Smile,
  Music,
  Armchair,
  HandHeart,
  Zap,
} from 'lucide-react';
import { DigitalGift } from '../../../types/digitalGifts';
import { useAuth } from '../../../contexts/AuthContext';
import { useCoupleSpace } from '../../../contexts/CoupleSpaceContext';
import {
  QualityLevel,
  QUALITY_PRESETS,
  getStoredQuality,
  setStoredQuality,
} from './QualitySettings';
import { CollisionSystem } from './CollisionSystem';
import { ExplorationEngine, DriverTarget, MovementSpeed } from './ExplorationEngine';
import { RomanticMoment } from './CoupleAvatars';
import { ModelCreditsModal } from './ModelCreditsModal';
import { createEverTideIslandScene } from './scenes/EverTideIslandScene';
import { createOurMuseumScene } from './scenes/OurMuseumScene';
import { createParisTogetherScene } from './scenes/ParisTogetherScene';
import { createKittyLetterScene } from './scenes/KittyLetterScene';
import { createSakuraNightScene } from './scenes/SakuraNightScene';
import { createInfiniteLoveScene } from './scenes/InfiniteLoveScene';
import { createMemoryArchiveScene } from './scenes/MemoryArchiveScene';
import { playSound } from '../../../lib/sound';

interface Props {
  gift: DigitalGift;
  onInteract: (actionId: string, payload?: any) => void;
  onSwitchTo2D?: () => void;
  className?: string;
}

export function Loveverse3DViewer({ gift, onInteract, onSwitchTo2D, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Authentication & partner context for personalized avatars
  const { userData } = useAuth();
  const { partnerData } = useCoupleSpace();

  const playerName = userData?.displayName || gift.creatorName || 'Alex (Boy)';
  const partnerName = partnerData?.displayName || gift.recipientName || 'Taylor (Galaxia)';

  // Viewer state
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>(getStoredQuality);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [controlsHint, setControlsHint] = useState(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'orbit' | 'explore'>('explore');

  // Character control states
  const [activeDriver, setActiveDriver] = useState<DriverTarget>('boy');
  const [movementSpeed, setMovementSpeed] = useState<MovementSpeed>('jog');
  const [activeMoment, setActiveMoment] = useState<RomanticMoment>('idle');
  const [isMomentsMenuOpen, setIsMomentsMenuOpen] = useState(false);

  // References across re-renders
  const sceneInstanceRef = useRef<any>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const explorationEngineRef = useRef<ExplorationEngine | null>(null);
  const collisionSystemRef = useRef<CollisionSystem>(new CollisionSystem(0.45));
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  // Virtual touch joystick state
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  // Auto-dismiss hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setControlsHint(false), 5500);
    return () => clearTimeout(timer);
  }, []);

  const handleResetCamera = useCallback(() => {
    if (viewMode === 'explore' && explorationEngineRef.current) {
      explorationEngineRef.current.activate();
    } else {
      if (sceneInstanceRef.current?.resetCamera) {
        sceneInstanceRef.current.resetCamera();
      }
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  }, [viewMode]);

  const handleQualityChange = (level: QualityLevel) => {
    setQualityLevel(level);
    setStoredQuality(level);
    setIsQualityMenuOpen(false);
  };

  const handleToggleMode = (newMode: 'orbit' | 'explore') => {
    setViewMode(newMode);
    if (newMode === 'explore') {
      if (controlsRef.current) controlsRef.current.enabled = false;
      if (explorationEngineRef.current) explorationEngineRef.current.activate();
    } else {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.update();
      }
      if (explorationEngineRef.current) explorationEngineRef.current.deactivate();
    }
  };

  // Driver switch handler (Boy vs Galaxia Girl)
  const handleDriverSwitch = (driver: DriverTarget) => {
    setActiveDriver(driver);
    if (explorationEngineRef.current) {
      explorationEngineRef.current.setDriver(driver);
    }
    playSound('pop');
  };

  // Speed switch handler
  const handleSpeedSwitch = (speed: MovementSpeed) => {
    setMovementSpeed(speed);
    if (explorationEngineRef.current) {
      explorationEngineRef.current.setSpeed(speed);
    }
    playSound('pop');
  };

  // Jump trigger
  const handleJump = () => {
    if (explorationEngineRef.current) {
      explorationEngineRef.current.triggerJump();
      playSound('pop');
    }
  };

  // Trigger romantic moments
  const handleTriggerMoment = (moment: RomanticMoment) => {
    setActiveMoment(moment);
    if (explorationEngineRef.current) {
      explorationEngineRef.current.triggerMoment(moment);
    }
    playSound('chime');
  };

  // Clear romantic moment
  const handleClearMoment = () => {
    setActiveMoment('idle');
    if (explorationEngineRef.current) {
      explorationEngineRef.current.clearMoment();
    }
  };

  // Virtual joystick pointer handlers for mobile & desktop
  const handleJoystickTouchStart = (e: React.PointerEvent<HTMLDivElement> | React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if ('pointerId' in e) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    setIsJoystickActive(true);
  };

  const handleJoystickTouchMove = (e: React.PointerEvent<HTMLDivElement> | React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive || !joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent | React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent | React.MouseEvent).clientY;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });

    if (explorationEngineRef.current) {
      explorationEngineRef.current.joystickVector = {
        x: dx / maxRadius,
        y: dy / maxRadius,
      };
    }
  };

  const handleJoystickTouchEnd = (e?: React.PointerEvent<HTMLDivElement> | React.TouchEvent | React.MouseEvent) => {
    if (e && 'pointerId' in e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    if (explorationEngineRef.current) {
      explorationEngineRef.current.joystickVector = { x: 0, y: 0 };
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as instructed by the Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const currentQuality = QUALITY_PRESETS[qualityLevel];

    // Initialize Three.js Scene, Camera, and Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);

    const renderer = new THREE.WebGLRenderer({
      antialias: currentQuality.antialias && !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, currentQuality.pixelRatioMax)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    if (currentQuality.shadows && !isSoftwareGl) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Attach canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('RoomEnvironment notice:', e);
    }

    // OrbitControls for inspect/orbit mode
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 45;
    controls.minDistance = 2.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // Reset collision system
    const collisionSystem = new CollisionSystem(0.45);
    collisionSystemRef.current = collisionSystem;

    // Raycaster for click/touch interaction & ground walk commands
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersectPoint = new THREE.Vector3();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // Check scene interactive objects first
      if (sceneInstanceRef.current?.onPointerDown) {
        const handled = sceneInstanceRef.current.onPointerDown(event, raycaster);
        if (handled) return;
      }

      // If in explore mode and clicked on ground, move couple there
      if (explorationEngineRef.current && explorationEngineRef.current.isActive) {
        if (raycaster.ray.intersectPlane(groundPlane, planeIntersectPoint)) {
          explorationEngineRef.current.setClickTarget(planeIntersectPoint);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Context object passed to scene builders
    const sceneContext = {
      scene,
      camera,
      renderer,
      container,
      quality: currentQuality,
      collisionSystem,
      onInteract: (actionId: string, payload?: any) => {
        onInteractRef.current(actionId, payload);
      },
    };

    // Instantiate appropriate 3D scene
    let instance: any = null;
    switch (gift.productId) {
      case 'ever_tide':
        instance = createEverTideIslandScene(gift, sceneContext);
        break;
      case 'our_museum':
        instance = createOurMuseumScene(gift, sceneContext);
        break;
      case 'paris_together':
        instance = createParisTogetherScene(gift, sceneContext);
        break;
      case 'kitty_letter':
        instance = createKittyLetterScene(gift, sceneContext);
        break;
      case 'sakura_night':
        instance = createSakuraNightScene(gift, sceneContext);
        break;
      case 'infinite_love':
        instance = createInfiniteLoveScene(gift, sceneContext);
        break;
      case 'memory_archive':
        instance = createMemoryArchiveScene(gift, sceneContext);
        break;
      default:
        instance = createEverTideIslandScene(gift, sceneContext);
        break;
    }
    sceneInstanceRef.current = instance;

    // Create Exploration Engine with Boy and Galaxia Girl avatars
    const explorationEngine = new ExplorationEngine({
      scene,
      camera,
      domElement: renderer.domElement,
      playerName,
      partnerName,
      collisionSystem,
      initialPosition: instance.initialPlayerPos || new THREE.Vector3(0, 0, 3),
      getTerrainHeight: instance.getTerrainHeight || (() => 0),
    });
    explorationEngine.setDriver(activeDriver);
    explorationEngine.setSpeed(movementSpeed);
    explorationEngineRef.current = explorationEngine;

    // Default to active explore mode or orbit mode
    if (viewMode === 'explore') {
      controls.enabled = false;
      explorationEngine.activate();
    } else {
      controls.enabled = true;
      explorationEngine.deactivate();
    }

    // Save default camera position in controls
    controls.saveState();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Render Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (viewMode === 'explore' && explorationEngine.isActive) {
        explorationEngine.update(delta, elapsed);
      } else {
        controls.update();
      }

      if (instance?.update) {
        instance.update(delta, elapsed);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      if (explorationEngine) {
        explorationEngine.dispose();
      }
      if (instance?.dispose) {
        instance.dispose();
      }

      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gift, qualityLevel, viewMode, playerName, partnerName]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${className || ''}`}>
      {/* Dedicated Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left Navigation Bar (Minimal Badge & Quick Actions) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {onSwitchTo2D && (
          <button
            type="button"
            onClick={onSwitchTo2D}
            className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-rose-500/30 shadow-lg flex items-center gap-1.5 transition active:scale-95"
            title="Switch to lightweight 2D mode"
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>2D View</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsCreditsOpen(true)}
          className="px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60 shadow-lg flex items-center gap-1.5 transition active:scale-95"
          title="3D World & Character Inspirations"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">3D Credits</span>
        </button>
      </div>

      {/* Top Right Mode Status Badge & Character Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {viewMode === 'explore' && (
          <div className="flex items-center bg-slate-900/90 border border-slate-700/70 p-0.5 rounded-full shadow-lg text-[11px]">
            <button
              type="button"
              onClick={() => handleDriverSwitch('boy')}
              className={`px-2.5 py-1 rounded-full font-semibold transition ${
                activeDriver === 'boy'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Control Character Boy 1 (Alex)"
            >
              🧑 Boy
            </button>
            <button
              type="button"
              onClick={() => handleDriverSwitch('galaxia')}
              className={`px-2.5 py-1 rounded-full font-semibold transition ${
                activeDriver === 'galaxia'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Control Galaxia Anime Girl (Taylor)"
            >
              👧 Galaxia
            </button>
          </div>
        )}

        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] font-medium text-slate-300 flex items-center gap-1.5 shadow-md">
          {viewMode === 'explore' ? (
            <>
              <Footprints className="w-3 h-3 text-rose-400" />
              <span>Partner Walk Mode</span>
            </>
          ) : (
            <>
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Orbit View</span>
            </>
          )}
        </div>
      </div>

      {/* On-Screen Virtual Touch Joystick (Bottom Left) */}
      {viewMode === 'explore' && (
        <div
          className="absolute bottom-24 left-6 z-20 pointer-events-auto touch-none select-none"
          title="Virtual Joystick (Drag to walk)"
        >
          <div
            ref={joystickContainerRef}
            onPointerDown={handleJoystickTouchStart}
            onPointerMove={handleJoystickTouchMove}
            onPointerUp={handleJoystickTouchEnd}
            onPointerCancel={handleJoystickTouchEnd}
            className="relative w-28 h-28 rounded-full bg-slate-950/65 border-2 border-slate-700/80 flex items-center justify-center shadow-2xl"
          >
            <div
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 border border-rose-300 shadow-md flex items-center justify-center text-white"
            >
              <Navigation className="w-5 h-5 -rotate-45" />
            </div>
            <div className="absolute -top-5 text-[10px] text-slate-300 font-semibold whitespace-nowrap bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
              Move & Walk
            </div>
          </div>
        </div>
      )}

      {/* Mobile Jump Button (Bottom Right above dock) */}
      {viewMode === 'explore' && (
        <div className="absolute bottom-24 right-6 z-20">
          <button
            type="button"
            onClick={handleJump}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold shadow-xl border border-pink-300/60 flex flex-col items-center justify-center active:scale-90 transition"
            title="Jump (or press Spacebar)"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">Jump</span>
          </button>
        </div>
      )}

      {/* Controls Guidance Hint Banner */}
      {controlsHint && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-opacity duration-1000">
          <div className="bg-slate-950/90 border border-rose-500/30 text-slate-200 text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span>✨ WASD to walk • Space to jump • Click Romantic Moments below!</span>
          </div>
        </div>
      )}

      {/* Romantic Moments Menu Popover */}
      {isMomentsMenuOpen && viewMode === 'explore' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-pink-500/40 rounded-3xl p-3 shadow-2xl max-w-[94vw] text-slate-200 animate-fadeIn">
          <div className="text-[11px] font-bold text-pink-400 mb-2 px-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
              <span>Romantic Moments for Boy & Galaxia Girl</span>
            </span>
            <button
              type="button"
              onClick={() => setIsMomentsMenuOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleTriggerMoment('hold_hands')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'hold_hands'
                  ? 'bg-rose-500/30 border-rose-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <HandHeart className="w-5 h-5 text-rose-400" />
              <span>Hold Hands</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerMoment('hug')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'hug'
                  ? 'bg-pink-500/30 border-pink-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
              <span>Warm Hug</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerMoment('kiss')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'kiss'
                  ? 'bg-rose-600/30 border-rose-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Sweet Kiss</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerMoment('dance')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'dance'
                  ? 'bg-purple-500/30 border-purple-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Music className="w-5 h-5 text-purple-400" />
              <span>Waltz Dance</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerMoment('sit')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'sit'
                  ? 'bg-amber-500/30 border-amber-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Armchair className="w-5 h-5 text-amber-400" />
              <span>Sit Together</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerMoment('wave')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition active:scale-95 ${
                activeMoment === 'wave'
                  ? 'bg-sky-500/30 border-sky-400 text-white font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Smile className="w-5 h-5 text-sky-400" />
              <span>Wave & Kiss</span>
            </button>
          </div>

          {activeMoment !== 'idle' && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={handleClearMoment}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Return to Free Roam
              </button>
            </div>
          )}
        </div>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
              <span>Show Controls & Moments</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Dock Bar */}
        {!isDockCollapsed && (
          <div className="px-3 py-2 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl flex items-center gap-2 max-w-[94vw] overflow-x-auto text-xs text-slate-200">
            {/* Walk Together vs Orbit Toggle */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleToggleMode('explore')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                  viewMode === 'explore'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk Partner</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('orbit')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                  viewMode === 'orbit'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Orbit View</span>
              </button>
            </div>

            {/* Romantic Moments Drawer Button */}
            {viewMode === 'explore' && (
              <button
                type="button"
                onClick={() => setIsMomentsMenuOpen(!isMomentsMenuOpen)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition active:scale-95 ${
                  isMomentsMenuOpen
                    ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border-pink-500/30'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                <span>Moments</span>
              </button>
            )}

            {/* Speed Selector (Walk, Jog, Sprint) */}
            {viewMode === 'explore' && (
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSpeedSwitch('walk')}
                  className={`px-2 py-1 rounded-lg transition ${
                    movementSpeed === 'walk' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                  title="Walk Speed"
                >
                  Walk
                </button>
                <button
                  type="button"
                  onClick={() => handleSpeedSwitch('jog')}
                  className={`px-2 py-1 rounded-lg transition ${
                    movementSpeed === 'jog' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                  title="Jog Speed"
                >
                  Jog
                </button>
                <button
                  type="button"
                  onClick={() => handleSpeedSwitch('sprint')}
                  className={`px-2 py-1 rounded-lg transition ${
                    movementSpeed === 'sprint' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'
                  }`}
                  title="Sprint Speed"
                >
                  Run
                </button>
              </div>
            )}

            {/* Reset Camera View */}
            <button
              type="button"
              onClick={handleResetCamera}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition active:scale-95"
              title="Reset Camera View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Graphics Quality Preset Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition active:scale-95"
                title="Graphics Quality"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{qualityLevel}</span>
              </button>

              {isQualityMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 text-xs text-slate-200 z-30">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Graphics Quality
                  </div>
                  {(['low', 'medium', 'high'] as QualityLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleQualityChange(lvl)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                        qualityLevel === lvl ? 'text-rose-400 font-bold bg-slate-800/60' : ''
                      }`}
                    >
                      <span>{QUALITY_PRESETS[lvl].label}</span>
                      {qualityLevel === lvl && <Sparkles className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Model Attribution Credits Modal */}
      <ModelCreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
        currentWorld={gift.title || gift.productId}
      />
    </div>
  );
}
