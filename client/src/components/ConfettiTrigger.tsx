import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * ConfettiTrigger - fires a confetti animation when:
 * 1. `fire` transitions from false → true (e.g., user adds items to reach free delivery)
 * 2. `fireKey` changes while `fire` is true (e.g., cart modal reopens with free delivery already achieved)
 * 
 * Renders nothing visible. Place it anywhere in the component tree.
 */
export function ConfettiTrigger({ fire, fireKey = 0 }: { fire: boolean; fireKey?: number }) {
  const prevFireRef = useRef(false);
  const lastFiredKeyRef = useRef<number>(-1);

  useEffect(() => {
    const wasFiring = prevFireRef.current;
    prevFireRef.current = fire;

    if (!fire) {
      // Reset: when fire goes false, allow next true to trigger
      return;
    }

    // Case 1: fire transitioned from false → true (threshold just crossed)
    if (!wasFiring && fire) {
      lastFiredKeyRef.current = fireKey;
      launchConfetti();
      return;
    }

    // Case 2: fireKey changed while fire is already true (modal reopened)
    if (fire && fireKey !== lastFiredKeyRef.current) {
      lastFiredKeyRef.current = fireKey;
      launchConfetti();
      return;
    }
  }, [fire, fireKey]);

  return null;
}

function launchConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;
  const colors = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors,
      zIndex: 999999,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors,
      zIndex: 999999,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
