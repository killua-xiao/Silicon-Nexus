import { useEffect, useRef, useState } from 'react';

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduce;
}

const NODES = [
  { x: 500, y: 118, r: 5, delay: '0s' },
  { x: 742, y: 248, r: 4, delay: '0.6s' },
  { x: 786, y: 500, r: 5, delay: '1.2s' },
  { x: 690, y: 742, r: 4, delay: '1.8s' },
  { x: 500, y: 842, r: 4, delay: '0.3s' },
  { x: 248, y: 720, r: 5, delay: '0.9s' },
  { x: 168, y: 468, r: 4, delay: '1.5s' },
  { x: 286, y: 214, r: 4, delay: '2.1s' },
];

export function HeroBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduce) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      setTilt({
        x: (event.clientX - box.left) / box.width - 0.5,
        y: (event.clientY - box.top) / box.height - 0.5,
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce]);

  const parallax = (depth: number) =>
    reduce
      ? undefined
      : {
          transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`,
        };

  return (
    <div ref={rootRef} className="hero-backdrop" aria-hidden>
      <div className="hero-aurora" />
      <div className="hero-floor" />
      <div className="hero-scan" />
      <div className="hero-stage">
        <div className="hero-stage-inner" style={parallax(18)}>
        <svg className="hero-scene" viewBox="0 0 1000 1000" role="presentation">
          <defs>
            <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0.55" />
              <stop offset="42%" stopColor="#0f766e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0b1014" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#c48b5a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.1" />
            </linearGradient>
            <pattern id="hero-die" width="26" height="26" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill="none" stroke="#2dd4bf" strokeOpacity="0.28" />
            </pattern>
            <filter id="hero-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="500" cy="500" r="310" fill="url(#hero-core)" />
          <circle cx="500" cy="500" r="248" fill="url(#hero-die)" />
          <circle
            cx="500"
            cy="500"
            r="248"
            fill="none"
            stroke="#2dd4bf"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />

          <g className={reduce ? undefined : 'hero-spin-slow'}>
            <circle
              cx="500"
              cy="500"
              r="340"
              fill="none"
              stroke="url(#hero-ring)"
              strokeWidth="1.2"
              strokeDasharray="6 14"
            />
            <circle
              cx="500"
              cy="500"
              r="400"
              fill="none"
              stroke="#2dd4bf"
              strokeOpacity="0.14"
              strokeWidth="1"
            />
          </g>

          <g className={reduce ? undefined : 'hero-spin-reverse'}>
            <circle
              cx="500"
              cy="500"
              r="188"
              fill="none"
              stroke="#c48b5a"
              strokeOpacity="0.28"
              strokeDasharray="3 10"
            />
          </g>

          <polygon
            points="500,412 572,454 572,546 500,588 428,546 428,454"
            fill="none"
            stroke="#2dd4bf"
            strokeOpacity="0.7"
            strokeWidth="1.6"
            filter="url(#hero-glow)"
          />
          <polygon
            points="500,444 546,470 546,530 500,556 454,530 454,470"
            fill="#0f766e"
            fillOpacity="0.18"
            stroke="#5eead4"
            strokeOpacity="0.55"
          />

          {NODES.map((node, i) => {
            const next = NODES[(i + 3) % NODES.length];
            return (
              <path
                key={`t-${i}`}
                className={reduce ? undefined : 'hero-trace'}
                d={`M${node.x} ${node.y} Q500 500 ${next.x} ${next.y}`}
                fill="none"
                stroke="#2dd4bf"
                strokeOpacity="0.22"
                strokeWidth="1"
              />
            );
          })}

          {NODES.map((node, i) => (
            <g key={`n-${i}`} filter="url(#hero-glow)">
              <circle cx={node.x} cy={node.y} r={node.r + 7} fill="#2dd4bf" fillOpacity="0.08" />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="#5eead4"
                className={reduce ? undefined : 'hero-node'}
                style={{ animationDelay: node.delay }}
              />
            </g>
          ))}
        </svg>
        </div>
      </div>
      <div className="hero-orbs" style={parallax(28)}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
