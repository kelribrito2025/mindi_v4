import { useEffect, useRef } from "react";

interface FreeDeliveryCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

function R(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function FreeDeliveryCelebration({ active, onComplete }: FreeDeliveryCelebrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!active || hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    const c = containerRef.current;
    if (!c) return;

    // Find the parent card element (the delivery progress card)
    const card = c.closest("[data-delivery-card]") as HTMLElement;
    if (!card) {
      onComplete?.();
      return;
    }

    // Ensure card has relative positioning for absolute children
    const originalPosition = card.style.position;
    const originalOverflow = card.style.overflow;
    card.style.position = "relative";
    card.style.overflow = "visible";

    const cleanup: (() => void)[] = [];

    // 1. Glow pulse on the card
    const glowAnim = card.animate(
      [
        { boxShadow: "0 0 0 0 rgba(34,197,94,0)", borderColor: "#bbf7d0" },
        { boxShadow: "0 0 20px 8px rgba(34,197,94,.4)", borderColor: "#22c55e" },
        { boxShadow: "0 0 0 0 rgba(34,197,94,0)", borderColor: "#bbf7d0" },
      ],
      { duration: 800, iterations: 2 }
    );
    cleanup.push(() => glowAnim.cancel());

    // 2. Bounce
    const bounceAnim = card.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.05)" },
        { transform: "scale(.97)" },
        { transform: "scale(1.03)" },
        { transform: "scale(1)" },
      ],
      { duration: 600, delay: 100 }
    );
    cleanup.push(() => bounceAnim.cancel());

    // 3. Shimmer wave
    const shimmer = document.createElement("div");
    shimmer.style.cssText =
      "position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);pointer-events:none;z-index:10;border-radius:12px";
    shimmer.animate(
      [{ transform: "translateX(-100%)" }, { transform: "translateX(200%)" }],
      { duration: 700, delay: 300 }
    );
    card.appendChild(shimmer);
    const shimmerTimeout = setTimeout(() => shimmer.remove(), 1200);
    cleanup.push(() => {
      clearTimeout(shimmerTimeout);
      shimmer.remove();
    });

    // 4. Color particles burst from center
    const particleTimeout = setTimeout(() => {
      const cx = card.offsetWidth / 2;
      const cy = card.offsetHeight / 2;
      for (let i = 0; i < 20; i++) {
        const el = document.createElement("div");
        const sz = R(3, 7);
        el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${pick(COLORS)};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};pointer-events:none;z-index:10`;
        const a = (Math.PI * 2 * i) / 20;
        const d = R(30, 80);
        el.animate(
          [
            { transform: "translate(-50%,-50%) scale(0)", opacity: "1" },
            {
              transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1)`,
              opacity: "0.8",
              offset: 0.4,
            },
            {
              transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.3}px),calc(-50% + ${Math.sin(a) * d * 1.3}px)) scale(0)`,
              opacity: "0",
            },
          ],
          { duration: 900, easing: "ease-out", fill: "forwards" }
        );
        card.appendChild(el);
        const removeTimeout = setTimeout(() => el.remove(), 1200);
        cleanup.push(() => {
          clearTimeout(removeTimeout);
          el.remove();
        });
      }
    }, 200);
    cleanup.push(() => clearTimeout(particleTimeout));

    // 5. Large motorcycle & gift emojis floating up
    const emojiTimeout = setTimeout(() => {
      const emojis = ["🛵", "🎁"];
      for (let i = 0; i < 12; i++) {
        const emojiDelay = setTimeout(() => {
          const el = document.createElement("span");
          el.textContent = emojis[i % emojis.length];
          el.style.cssText = `position:absolute;left:${R(5, 85)}%;bottom:${R(-10, 20)}%;font-size:${R(18, 28)}px;pointer-events:none;z-index:10`;
          el.animate(
            [
              { opacity: "0", transform: "translateY(10px) scale(0.3) rotate(-15deg)" },
              {
                opacity: "1",
                transform: `translateY(-${R(20, 40)}px) scale(1) rotate(${R(-10, 10)}deg)`,
                offset: 0.35,
              },
              {
                opacity: "1",
                transform: `translateY(-${R(50, 70)}px) scale(1.1) rotate(${R(-5, 5)}deg)`,
                offset: 0.65,
              },
              {
                opacity: "0",
                transform: `translateY(-${R(80, 110)}px) scale(0.5) rotate(${R(-20, 20)}deg)`,
              },
            ],
            { duration: R(1200, 1800), easing: "ease-out", fill: "forwards" }
          );
          card.appendChild(el);
          const removeTimeout = setTimeout(() => el.remove(), 2000);
          cleanup.push(() => {
            clearTimeout(removeTimeout);
            el.remove();
          });
        }, i * 100);
        cleanup.push(() => clearTimeout(emojiDelay));
      }
    }, 300);
    cleanup.push(() => clearTimeout(emojiTimeout));

    // Complete after all animations finish
    const completeTimeout = setTimeout(() => {
      card.style.position = originalPosition;
      card.style.overflow = originalOverflow;
      onComplete?.();
    }, 2500);
    cleanup.push(() => clearTimeout(completeTimeout));

    return () => {
      cleanup.forEach((fn) => fn());
      card.style.position = originalPosition;
      card.style.overflow = originalOverflow;
    };
  }, [active, onComplete]);

  // Reset hasPlayed when active goes false so it can play again next time
  useEffect(() => {
    if (!active) {
      hasPlayedRef.current = false;
    }
  }, [active]);

  return <div ref={containerRef} className="hidden" />;
}

