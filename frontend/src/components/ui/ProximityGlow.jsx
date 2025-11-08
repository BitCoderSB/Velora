import { useEffect, useRef } from "react";

/**
 * ProximityGlow
 * Wrap children to get a soft glow that intensifies as the cursor approaches.
 * The glow follows the pointer and fades with distance using a radial gradient.
 *
 * Props:
 * - c1, c2: color strings for the gradient stops (defaults: cyan + fuchsia)
 * - radius: activation radius in px outside/around the element (default 200)
 * - intensity: 0..1 multiplier for max opacity (default 0.35)
 * - className: extra classes for the wrapper
 */
export default function ProximityGlow({
  children,
  className = "",
  c1 = "rgba(34,211,238,0.35)", // cyan-400
  c2 = "rgba(217,70,239,0.28)",  // fuchsia-500
  radius = 200,
  intensity = 0.35,
  style,
}) {
  const ref = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ x: 0, y: 0, o: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      // Support both mousemove and touchmove
      const pt = 'touches' in e && e.touches?.length ? e.touches[0] : e;
      const mx = pt.clientX, my = pt.clientY;
      const rect = el.getBoundingClientRect();

      // Nearest point on rect to mouse (so glow also near edges)
      const nx = Math.max(rect.left, Math.min(mx, rect.right));
      const ny = Math.max(rect.top, Math.min(my, rect.bottom));
      const dx = mx - nx, dy = my - ny;
      const dist = Math.hypot(dx, dy);

      // Opacity falloff with distance
      const t = Math.max(0, 1 - dist / radius);
      const o = Math.min(1, t * t) * intensity;

      stateRef.current = { x: mx - rect.left, y: my - rect.top, o };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          const { x, y, o } = stateRef.current;
          el.style.setProperty("--pg-x", `${x}px`);
          el.style.setProperty("--pg-y", `${y}px`);
          el.style.setProperty("--pg-o", o.toFixed(3));
        });
      }
    };

    const onLeave = () => {
      el.style.setProperty("--pg-o", "0");
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseout', onLeave, { passive: true });
    window.addEventListener('touchend', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseout', onLeave);
      window.removeEventListener('touchend', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [radius, intensity]);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={style}
    >
      {/* Glow Layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[inherit]"
        style={{
          background: `radial-gradient(180px circle at var(--pg-x, -1000px) var(--pg-y, -1000px), ${c1}, transparent 60%), radial-gradient(280px circle at var(--pg-x, -1000px) var(--pg-y, -1000px), ${c2}, transparent 70%)`,
          opacity: 'var(--pg-o, 0)',
          filter: 'blur(14px)',
          transition: 'opacity 120ms ease-out',
        }}
      />
      {children}
    </div>
  );
}
