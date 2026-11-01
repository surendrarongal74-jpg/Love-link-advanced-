import { useState, useRef, useCallback, useEffect } from 'react';

export interface VirtualJoystickOptions {
  radius?: number; // Base joystick radius in pixels (default: 50)
  deadzone?: number; // Normalized deadzone 0..1 (default: 0.06)
  springReturnDamping?: number; // Damping rate when releasing stick (default: 18)
  enableHaptics?: boolean; // Trigger tactile haptic pulses (default: true)
}

export interface JoystickState {
  vector: { x: number; y: number }; // Normalized vector with curve applied [-1..1]
  rawVector: { x: number; y: number }; // Linear normalized vector [-1..1]
  magnitude: number; // 0..1
  angle: number; // Radians (-PI to PI)
  isActive: boolean;
  isSprinting: boolean; // Pushed past sprint threshold (> 0.85)
}

export interface JoystickVisualState {
  isActive: boolean;
  knobX: number; // Pixel offset X from base center
  knobY: number; // Pixel offset Y from base center
  intensity: number; // 0..1
}

export function useVirtualJoystick(options: VirtualJoystickOptions = {}) {
  const {
    radius = 50,
    deadzone = 0.06,
    springReturnDamping = 22,
    enableHaptics = true,
  } = options;

  // Mutable reference for high-frequency (60-120fps) game loop reads without React re-render churn
  const stateRef = useRef<JoystickState>({
    vector: { x: 0, y: 0 },
    rawVector: { x: 0, y: 0 },
    magnitude: 0,
    angle: 0,
    isActive: false,
    isSprinting: false,
  });

  // Visual state for rendering the touch UI stick and glowing knob
  const [visualState, setVisualState] = useState<JoystickVisualState>({
    isActive: false,
    knobX: 0,
    knobY: 0,
    intensity: 0,
  });

  const baseElementRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const centerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const springAnimFrameRef = useRef<number | null>(null);

  // Trigger subtle device haptic feedback
  const triggerHaptic = useCallback(
    (duration = 10) => {
      if (enableHaptics && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(duration);
        } catch {
          // ignore if vibration is restricted
        }
      }
    },
    [enableHaptics]
  );

  // Process touch/pointer displacement with refined ergonomic acceleration curves
  const updatePointerPosition = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - centerPosRef.current.x;
      const dy = clientY - centerPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.001) {
        stateRef.current = {
          vector: { x: 0, y: 0 },
          rawVector: { x: 0, y: 0 },
          magnitude: 0,
          angle: 0,
          isActive: true,
          isSprinting: false,
        };
        setVisualState({ isActive: true, knobX: 0, knobY: 0, intensity: 0 });
        return;
      }

      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, radius);
      const rawMagnitude = clampedDist / radius;

      // Apply deadzone and non-linear power curve for precision steering
      // (Gentle curve at low thumb deflection for stealth/walking, progressive ramp for running)
      let curvedMagnitude = 0;
      if (rawMagnitude > deadzone) {
        const normalized = (rawMagnitude - deadzone) / (1 - deadzone);
        curvedMagnitude = Math.min(1.0, Math.pow(normalized, 1.25));
      }

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const knobX = cos * clampedDist;
      const knobY = sin * clampedDist;

      const normX = cos * curvedMagnitude;
      const normY = sin * curvedMagnitude;

      const isSprinting = rawMagnitude > 0.88;

      stateRef.current = {
        vector: { x: normX, y: normY },
        rawVector: { x: cos * rawMagnitude, y: sin * rawMagnitude },
        magnitude: curvedMagnitude,
        angle,
        isActive: true,
        isSprinting,
      };

      setVisualState({
        isActive: true,
        knobX,
        knobY,
        intensity: curvedMagnitude,
      });
    },
    [radius, deadzone]
  );

  // Smooth return-to-center spring release animation
  const startSpringReturn = useCallback(() => {
    stateRef.current = {
      vector: { x: 0, y: 0 },
      rawVector: { x: 0, y: 0 },
      magnitude: 0,
      angle: 0,
      isActive: false,
      isSprinting: false,
    };

    if (springAnimFrameRef.current) {
      cancelAnimationFrame(springAnimFrameRef.current);
    }

    let lastTick = performance.now();

    const stepSpring = () => {
      setVisualState((prev) => {
        const now = performance.now();
        const dt = Math.min((now - lastTick) / 1000, 0.05);
        lastTick = now;

        const decay = Math.exp(-springReturnDamping * dt);
        const nextX = prev.knobX * decay;
        const nextY = prev.knobY * decay;
        const nextIntensity = prev.intensity * decay;

        if (Math.hypot(nextX, nextY) < 0.5) {
          springAnimFrameRef.current = null;
          return { isActive: false, knobX: 0, knobY: 0, intensity: 0 };
        }

        springAnimFrameRef.current = requestAnimationFrame(stepSpring);
        return {
          isActive: false,
          knobX: nextX,
          knobY: nextY,
          intensity: nextIntensity,
        };
      });
    };

    springAnimFrameRef.current = requestAnimationFrame(stepSpring);
  }, [springReturnDamping]);

  // Pointer Down: Lock pointer capture and calculate base center
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (springAnimFrameRef.current) {
        cancelAnimationFrame(springAnimFrameRef.current);
        springAnimFrameRef.current = null;
      }

      activePointerIdRef.current = e.pointerId;

      const target = e.currentTarget;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore if pointer capture not supported
      }

      const rect = target.getBoundingClientRect();
      centerPosRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      triggerHaptic(12);
      updatePointerPosition(e.clientX, e.clientY);
    },
    [triggerHaptic, updatePointerPosition]
  );

  // Pointer Move: Continual tracking
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      updatePointerPosition(e.clientX, e.clientY);
    },
    [updatePointerPosition]
  );

  // Pointer Up & Cancel: Release and smoothly spring return
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      e.stopPropagation();

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      activePointerIdRef.current = null;
      startSpringReturn();
    },
    [startSpringReturn]
  );

  const reset = useCallback(() => {
    activePointerIdRef.current = null;
    if (springAnimFrameRef.current) {
      cancelAnimationFrame(springAnimFrameRef.current);
      springAnimFrameRef.current = null;
    }
    stateRef.current = {
      vector: { x: 0, y: 0 },
      rawVector: { x: 0, y: 0 },
      magnitude: 0,
      angle: 0,
      isActive: false,
      isSprinting: false,
    };
    setVisualState({ isActive: false, knobX: 0, knobY: 0, intensity: 0 });
  }, []);

  useEffect(() => {
    return () => {
      if (springAnimFrameRef.current) {
        cancelAnimationFrame(springAnimFrameRef.current);
      }
    };
  }, []);

  return {
    baseElementRef,
    stateRef,
    visualState,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    reset,
  };
}
