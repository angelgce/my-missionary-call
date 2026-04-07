import { useEffect, useState } from 'react';

interface RotatingImageProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  className?: string;
}

function RotatingImage({
  images,
  alt,
  intervalMs = 4000,
  className = '',
}: RotatingImageProps) {
  // 1. Local state
  const [index, setIndex] = useState(0);

  // 5. Effects
  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  // 8. Main render
  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-blush/40 ${className}`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gold/40"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-warm-white' : 'bg-warm-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RotatingImage;
