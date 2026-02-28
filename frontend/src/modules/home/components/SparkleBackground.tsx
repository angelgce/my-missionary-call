import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'dot' | 'star' | 'orb' | 'diamond' | 'glitter' | 'falling';
}

function generateSparkles(count: number): Sparkle[] {
  const types: Sparkle['type'][] = ['dot', 'star', 'orb', 'diamond', 'glitter', 'falling'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 10,
    duration: Math.random() * 4 + 3,
    type: types[Math.floor(Math.random() * types.length)],
  }));
}

function SparkleBackground() {
  const [sparkles] = useState<Sparkle[]>(() => generateSparkles(55));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft floating orbs */}
      <div
        className="sparkle-orb absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          top: '10%',
          left: '5%',
          background: 'rgba(212, 132, 155, 0.06)',
          animation: 'floatOrb 20s ease-in-out infinite',
        }}
      />
      <div
        className="sparkle-orb absolute rounded-full"
        style={{
          width: 250,
          height: 250,
          top: '60%',
          right: '5%',
          background: 'rgba(248, 224, 232, 0.08)',
          animation: 'floatOrb 25s ease-in-out infinite reverse',
        }}
      />
      <div
        className="sparkle-orb absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          bottom: '15%',
          left: '30%',
          background: 'rgba(240, 204, 215, 0.06)',
          animation: 'floatOrb 18s ease-in-out infinite 5s',
        }}
      />
      {/* Gold glow orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          top: '35%',
          right: '15%',
          background: 'rgba(191, 155, 48, 0.04)',
          animation: 'floatOrb 22s ease-in-out infinite 3s',
        }}
      />

      {/* Sparkle particles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
          }}
        >
          {sparkle.type === 'dot' && (
            <div
              className="rounded-full"
              style={{
                width: sparkle.size,
                height: sparkle.size,
                background: 'rgba(212, 132, 155, 0.4)',
                animation: `twinkle ${sparkle.duration}s ease-in-out infinite ${sparkle.delay}s`,
              }}
            />
          )}
          {sparkle.type === 'star' && (
            <svg
              width={sparkle.size * 3}
              height={sparkle.size * 3}
              viewBox="0 0 24 24"
              fill="none"
              style={{
                animation: `twinkleStar ${sparkle.duration}s ease-in-out infinite ${sparkle.delay}s`,
              }}
            >
              <path
                d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07"
                stroke="rgba(212, 132, 155, 0.3)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          )}
          {sparkle.type === 'orb' && (
            <div
              className="rounded-full"
              style={{
                width: sparkle.size * 2.5,
                height: sparkle.size * 2.5,
                background: 'rgba(248, 224, 232, 0.5)',
                boxShadow: '0 0 8px rgba(212, 132, 155, 0.2)',
                animation: `floatParticle ${sparkle.duration + 2}s ease-in-out infinite ${sparkle.delay}s`,
              }}
            />
          )}
          {sparkle.type === 'diamond' && (
            <div
              style={{
                width: sparkle.size * 2,
                height: sparkle.size * 2,
                background: 'rgba(191, 155, 48, 0.35)',
                transform: 'rotate(45deg)',
                animation: `diamondSparkle ${sparkle.duration}s ease-in-out infinite ${sparkle.delay}s`,
              }}
            />
          )}
          {sparkle.type === 'glitter' && (
            <svg
              width={sparkle.size * 4}
              height={sparkle.size * 4}
              viewBox="0 0 24 24"
              fill="none"
              style={{
                animation: `glitterBurst ${sparkle.duration * 0.8}s ease-in-out infinite ${sparkle.delay}s`,
              }}
            >
              <path
                d="M12 0L13.5 9L24 12L13.5 15L12 24L10.5 15L0 12L10.5 9Z"
                fill="rgba(191, 155, 48, 0.3)"
              />
            </svg>
          )}
          {sparkle.type === 'falling' && (
            <div
              className="rounded-full"
              style={{
                width: sparkle.size * 0.8,
                height: sparkle.size * 0.8,
                background: 'rgba(191, 155, 48, 0.5)',
                boxShadow: '0 0 4px rgba(191, 155, 48, 0.3)',
                animation: `fallingSparkle ${sparkle.duration + 4}s linear infinite ${sparkle.delay}s`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default SparkleBackground;
