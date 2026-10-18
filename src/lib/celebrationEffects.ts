import confetti from 'canvas-confetti';
import { sound } from './sound';

// Heart SVG path for canvas-confetti
const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/**
 * Triggers a multi-stage romantic heart-burst and confetti particle explosion
 * when a user opens a virtual gift received from their partner.
 */
export function triggerHeartBurstConfetti(x = 0.5, y = 0.5) {
  try {
    sound.playCelebration();
  } catch {}

  let heartShape: any;
  try {
    if (typeof confetti.shapeFromPath === 'function') {
      heartShape = confetti.shapeFromPath({ path: HEART_PATH });
    }
  } catch {
    heartShape = undefined;
  }

  const shapes = heartShape ? [heartShape, 'circle'] : ['circle'];

  // Stage 1: Central Heart & Sparkle Radial Burst
  confetti({
    particleCount: 60,
    angle: 90,
    spread: 360,
    startVelocity: 30,
    decay: 0.92,
    gravity: 0.7,
    origin: { x, y },
    colors: ['#F43F5E', '#EC4899', '#FB7185', '#FDA4AF', '#FDE047', '#A855F7'],
    shapes: shapes as any,
    scalar: 1.4,
    ticks: 200,
    zIndex: 9999
  });

  // Stage 2: Dual Angle Shower from Left & Right for a theatrical cascade
  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 70,
      startVelocity: 40,
      origin: { x: Math.max(0.1, x - 0.25), y: Math.min(0.8, y + 0.1) },
      colors: ['#E11D48', '#FB7185', '#F59E0B', '#F472B6'],
      shapes: shapes as any,
      scalar: 1.2,
      zIndex: 9999
    });

    confetti({
      particleCount: 45,
      angle: 120,
      spread: 70,
      startVelocity: 40,
      origin: { x: Math.min(0.9, x + 0.25), y: Math.min(0.8, y + 0.1) },
      colors: ['#E11D48', '#FB7185', '#F59E0B', '#F472B6'],
      shapes: shapes as any,
      scalar: 1.2,
      zIndex: 9999
    });
  }, 180);

  // Stage 3: Gentle romantic floating drift
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 120,
      startVelocity: 15,
      decay: 0.94,
      gravity: 0.4,
      origin: { x, y: y - 0.15 },
      colors: ['#FDA4AF', '#FFF1F2', '#FDE047', '#E9D5FF'],
      shapes: shapes as any,
      scalar: 1.1,
      zIndex: 9999
    });
  }, 380);
}
