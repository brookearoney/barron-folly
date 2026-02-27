"use client";

import { useRef, useEffect } from "react";

export default function HalftoneWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      const spacing = 28;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;
      const centerX = w / 2;
      const centerY = h / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;

          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const normalizedDist = dist / maxDist;

          // Multiple overlapping wave patterns
          const wave1 = Math.sin(dist * 0.012 - time * 0.8) * 0.5 + 0.5;
          const wave2 = Math.sin(dx * 0.008 + time * 0.5) * 0.3 + 0.5;
          const wave3 = Math.cos(dy * 0.01 - time * 0.6) * 0.2 + 0.5;

          const combined = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);

          // Fade out toward edges with a vignette
          const vignette = 1 - Math.pow(normalizedDist, 1.5);

          // Dot radius — ranges from tiny to visible
          const baseRadius = 1;
          const maxRadius = 3.5;
          const radius = baseRadius + combined * maxRadius * vignette;

          // Opacity — stronger in center, fading to edges
          const alpha = combined * vignette * 0.35;

          if (alpha > 0.02 && radius > 0.5) {
            // Orange glow color #FF8400
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 132, 0, ${alpha})`;
            ctx.fill();
          }
        }
      }

      // Soft radial glow in center
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY * 0.85,
        0,
        centerX,
        centerY * 0.85,
        maxDist * 0.5
      );
      gradient.addColorStop(0, "rgba(255, 132, 0, 0.06)");
      gradient.addColorStop(0.5, "rgba(255, 132, 0, 0.02)");
      gradient.addColorStop(1, "rgba(255, 132, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      time += 0.02;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
