import { useState, useEffect, useRef, useCallback } from 'react';

import api from '@/core/services/api';

const FADE_IN_MS = 2000;
const HOLD_MS = 5000;
const FADE_OUT_MS = 2000;
const CYCLE_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;

function ChristPhotoCascade() {
  // 1. Local state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5. Effects
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const listRes = await api.get(
          '/assets/list/assets/FOTOS%20DE%20ALEXHA/jesucristo/'
        );
        const keys: string[] = listRes.data.keys;
        if (!keys.length) return;

        const urlResults = await Promise.allSettled(
          keys.map((key) => {
            const encodedKey = key
              .split('/')
              .map(encodeURIComponent)
              .join('/');
            return api
              .get(`/assets/signed-url/${encodedKey}`)
              .then((res) => res.data.url as string);
          })
        );

        const urls = urlResults
          .filter(
            (r): r is PromiseFulfilledResult<string> =>
              r.status === 'fulfilled'
          )
          .map((r) => r.value);

        setImageUrls(urls);
      } catch {
        // silently fail
      }
    };

    fetchPhotos();
  }, []);

  const cycle = useCallback(() => {
    // Fade in
    setVisible(true);

    // Fade out
    const fadeOutTimer = setTimeout(() => {
      setVisible(false);
    }, FADE_IN_MS + HOLD_MS);

    // Next photo (change image while invisible, then fade in after 2s)
    const changeTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    const nextTimer = setTimeout(() => {
      cycle();
    }, FADE_IN_MS + HOLD_MS + FADE_OUT_MS + 300);

    timerRef.current = nextTimer;
    return [fadeOutTimer, changeTimer, nextTimer];
  }, [imageUrls.length]);

  useEffect(() => {
    if (!imageUrls.length) return;

    const timers = cycle();

    return () => {
      timers.forEach(clearTimeout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [imageUrls, cycle]);

  // 8. Main render
  if (!imageUrls.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={imageUrls[currentIndex]}
        alt=""
        className="h-full w-full object-cover"
        style={{
          opacity: visible ? 0.15 : 0,
          transition: visible
            ? `opacity ${FADE_IN_MS}ms ease-in`
            : `opacity ${FADE_OUT_MS}ms ease-out`,
          filter: 'saturate(0) brightness(1.2)',
          mixBlendMode: 'multiply',
        }}
        draggable={false}
      />
    </div>
  );
}

export default ChristPhotoCascade;
