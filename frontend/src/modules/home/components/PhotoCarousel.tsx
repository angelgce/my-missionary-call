import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

import api from '@/core/services/api';

const PHOTO_KEYS = [
  'assets/FOTOS DE ALEXHA/CARRUSEL/5466.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/C074A6AC-8C40-4964-9129-D77E5C4F95B6.jpg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/FAMILIAVEN1.JPG',
  'assets/FOTOS DE ALEXHA/CARRUSEL/FAMILIAVEN2.JPG',
  'assets/FOTOS DE ALEXHA/CARRUSEL/FullSizeRender (1).jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/FullSizeRender (2).jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/FullSizeRender.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/IMG_2567.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/IMG_4611.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/IMG_5116.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/IMG_5569.jpeg',
  'assets/FOTOS DE ALEXHA/CARRUSEL/IMG_8899.JPG',
  'assets/FOTOS DE ALEXHA/CARRUSEL/YO2.JPG',
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function PhotoCarousel() {
  // Local state
  const shuffledKeys = useMemo(() => shuffleArray(PHOTO_KEYS), []);
  const [imageUrls, setImageUrls] = useState<(string | null)[]>(Array(shuffledKeys.length).fill(null));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [modalFlip, setModalFlip] = useState<'none' | 'flip-left' | 'flip-right'>('none');
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchedRef = useRef<Set<number>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDeltaRef = useRef(0);

  // Custom hooks
  const fetchSignedUrl = useCallback(async (index: number) => {
    if (fetchedRef.current.has(index) || imageUrls[index]) return;
    fetchedRef.current.add(index);
    try {
      const key = shuffledKeys[index];
      const res = await api.get(
        `/assets/signed-url/${key.split('/').map(encodeURIComponent).join('/')}`
      );
      setImageUrls((prev) => {
        const next = [...prev];
        next[index] = res.data.url as string;
        return next;
      });
    } catch {
      // leave as null
    }
  }, [imageUrls, shuffledKeys]);

  // Effects — lazy load nearby slides
  useEffect(() => {
    const total = shuffledKeys.length;
    const nearby = [-2, -1, 0, 1, 2, 3];
    nearby.forEach((offset) => {
      const idx = ((currentIndex + offset) % total + total) % total;
      fetchSignedUrl(idx);
    });
  }, [currentIndex, fetchSignedUrl, shuffledKeys]);

  const validUrls = imageUrls.filter(Boolean) as string[];
  const totalSlides = validUrls.length;

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    if (modalIndex !== null) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }
    resetAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [totalSlides, resetAutoPlay, modalIndex]);

  // Event handlers
  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    resetAutoPlay();
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const goPrev = () => goTo((currentIndex - 1 + totalSlides) % totalSlides);
  const goNext = () => goTo((currentIndex + 1) % totalSlides);

  const modalGo = (direction: 'prev' | 'next') => {
    if (modalIndex === null || modalFlip !== 'none') return;
    const flipDir = direction === 'next' ? 'flip-left' : 'flip-right';
    setModalFlip(flipDir);
    setTimeout(() => {
      setModalIndex(
        direction === 'next'
          ? (modalIndex + 1) % totalSlides
          : (modalIndex - 1 + totalSlides) % totalSlides
      );
      setModalFlip('none');
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchDeltaRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current.x;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const delta = touchDeltaRef.current;
    const threshold = 50;
    if (delta < -threshold) modalGo('next');
    else if (delta > threshold) modalGo('prev');
    touchStartRef.current = null;
    touchDeltaRef.current = 0;
  };

  // Render helpers
  const getSlideStyle = (offset: number) => {
    const rotations = [-6, -3, 0, 3, 6];
    const rotation = rotations[offset + 2] || 0;
    const absOffset = Math.abs(offset);
    const scale = offset === 0 ? 1 : absOffset === 1 ? 0.85 : 0.7;
    const translateX = offset * 120;
    const zIndex = 10 - absOffset;
    const opacity = absOffset > 2 ? 0 : 1;

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotate(${rotation}deg)`,
      zIndex,
      opacity,
      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    };
  };

  if (totalSlides === 0) return null;

  return (
    <>
    <div className="relative z-10 mx-auto mb-6 w-full max-w-lg tablet:max-w-2xl tablet:mb-8">
      {/* Carousel container */}
      <div className="relative flex items-center justify-center">
        {/* Left arrow */}
        <button
          onClick={goPrev}
          className="absolute left-0 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-white/80 text-navy/60 shadow-sm transition-all hover:border-gold/40 hover:text-gold tablet:left-2 tablet:h-10 tablet:w-10"
          aria-label="Anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Photos */}
        <div className="relative flex h-48 w-full items-center justify-center overflow-hidden tablet:h-64">
          {validUrls.map((url, i) => {
            const offset = i - currentIndex;
            const wrappedOffset =
              offset > totalSlides / 2 ? offset - totalSlides :
              offset < -totalSlides / 2 ? offset + totalSlides :
              offset;

            if (Math.abs(wrappedOffset) > 2) return null;

            return (
              <div
                key={i}
                className="absolute cursor-pointer"
                style={getSlideStyle(wrappedOffset)}
                onClick={() => wrappedOffset === 0 ? setModalIndex(i) : goTo(i)}
              >
                <div
                  className="overflow-hidden rounded bg-white p-1.5 shadow-lg tablet:p-2"
                  style={{
                    boxShadow: wrappedOffset === 0
                      ? '0 8px 30px rgba(59, 33, 64, 0.2), 0 2px 8px rgba(191, 155, 48, 0.15)'
                      : '0 4px 15px rgba(59, 33, 64, 0.12)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    loading="lazy"
                    className="h-36 w-28 rounded-sm object-cover tablet:h-48 tablet:w-36"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        setTimeout(() => { img.src = url; }, 1000);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={goNext}
          className="absolute right-0 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-white/80 text-navy/60 shadow-sm transition-all hover:border-gold/40 hover:text-gold tablet:right-2 tablet:h-10 tablet:w-10"
          aria-label="Siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5 tablet:mt-4">
        {validUrls.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'scale-125 bg-navy/60'
                : 'bg-navy/15 hover:bg-navy/30'
            }`}
            aria-label={`Ir a foto ${i + 1}`}
          />
        ))}
      </div>

    </div>

      {/* Modal — rendered via portal to escape parent stacking context */}
      {modalIndex !== null && validUrls[modalIndex] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setModalIndex(null)}
            className="absolute right-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy/70 shadow-md transition-colors hover:bg-white hover:text-navy"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Prev arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); modalGo('prev'); }}
            className="absolute left-3 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy/70 shadow-md transition-all hover:bg-white hover:text-gold tablet:left-6 tablet:h-12 tablet:w-12"
            aria-label="Foto anterior"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Photo with page-flip animation */}
          <div
            className="relative"
            style={{ perspective: '1200px' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="overflow-hidden rounded-lg bg-white p-2 shadow-2xl"
              style={{
                transition: 'transform 0.3s ease-in-out',
                transformStyle: 'preserve-3d',
                transform:
                  modalFlip === 'flip-left'
                    ? 'rotateY(-15deg) scale(0.97)'
                    : modalFlip === 'flip-right'
                    ? 'rotateY(15deg) scale(0.97)'
                    : 'rotateY(0deg) scale(1)',
              }}
            >
              <img
                src={validUrls[modalIndex]}
                alt={`Foto ${modalIndex + 1} de ${totalSlides}`}
                className="max-h-[65vh] max-w-[80vw] rounded object-contain tablet:max-h-[75vh] tablet:max-w-[65vw]"
              />
            </div>

            {/* Counter */}
            <div className="mt-3 text-center text-sm font-medium text-white/80">
              {modalIndex + 1} / {totalSlides}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); modalGo('next'); }}
            className="absolute right-3 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy/70 shadow-md transition-all hover:bg-white hover:text-gold tablet:right-6 tablet:h-12 tablet:w-12"
            aria-label="Foto siguiente"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default PhotoCarousel;
