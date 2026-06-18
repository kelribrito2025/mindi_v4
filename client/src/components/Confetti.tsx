import { useEffect, useRef, useCallback } from "react";

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle" | "star";
  opacity: number;
  gravity: number;
  wobble: number;
  wobbleSpeed: number;
}

const COLORS = [
  "#ef4444", // red-500
  "#ef4444", // red-600
  "#f87171", // red-400
  "#fca5a5", // red-300
  "#fbbf24", // amber-400
  "#f59e0b", // amber-500
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#ffffff", // white
  "#fde68a", // amber-200
];

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const shape = (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)];

  return {
    x: Math.random() * canvasWidth,
    y: -20 - Math.random() * canvasHeight * 0.5,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 3 + 2,
    color,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    shape,
    opacity: 1,
    gravity: 0.08 + Math.random() * 0.04,
    wobble: Math.random() * 10,
    wobbleSpeed: 0.03 + Math.random() * 0.05,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);

  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(
      x + Math.cos(rot) * outerRadius,
      y + Math.sin(rot) * outerRadius
    );
    rot += step;
    ctx.lineTo(
      x + Math.cos(rot) * innerRadius,
      y + Math.sin(rot) * innerRadius
    );
    rot += step;
  }

  ctx.lineTo(x, y - outerRadius);
  ctx.closePath();
  ctx.fill();
}

export function Confetti({
  active,
  duration = 4000,
  particleCount = 150,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fadeStart = duration * 0.7;
      const globalFade =
        elapsed > fadeStart
          ? 1 - (elapsed - fadeStart) / (duration - fadeStart)
          : 1;

      let aliveCount = 0;

      for (const p of particlesRef.current) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.5;
        p.opacity = Math.max(0, globalFade);

        if (p.y > canvas.height + 50 || p.opacity <= 0) continue;
        aliveCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "rect":
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "star":
            drawStar(ctx, 0, 0, p.size / 2);
            break;
        }

        ctx.restore();
      }

      if (elapsed < duration && aliveCount > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    },
    [duration, onComplete]
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    startTimeRef.current = 0;
    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height)
    );

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, particleCount, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
