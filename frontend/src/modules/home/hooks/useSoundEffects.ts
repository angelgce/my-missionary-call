import { useCallback, useRef } from 'react';

export interface CelebrationSound {
  id: string;
  name: string;
}

export const CELEBRATION_SOUNDS: CelebrationSound[] = [
  { id: 'arpa', name: 'Arpa Celestial' },
  { id: 'lluvia', name: 'Lluvia de Estrellas' },
  { id: 'caja-musical', name: 'Caja Musical' },
  { id: 'cristal', name: 'Campanas de Cristal' },
  { id: 'amanecer', name: 'Amanecer' },
  { id: 'cascada', name: 'Cascada Dorada' },
  { id: 'carillon', name: 'Carillon' },
  { id: 'aurora', name: 'Aurora Boreal' },
  { id: 'mariposas', name: 'Mariposas' },
  { id: 'constelacion', name: 'Constelacion' },
  { id: 'brisa', name: 'Brisa Angelical' },
];

function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  /** Single note with attack/decay envelope */
  const tone = useCallback(
    (freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine') => {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.012, dur * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    },
    [getCtx],
  );

  /** Two-layer note: sine fundamental + triangle octave harmonic */
  const shimmer = useCallback(
    (freq: number, start: number, dur: number, vol: number) => {
      tone(freq, start, dur, vol, 'sine');
      tone(freq * 2, start, dur * 0.7, vol * 0.3, 'triangle');
    },
    [tone],
  );

  // ── Arpa Celestial ── ascending C major glissando
  const playArpa = useCallback(() => {
    const t = getCtx().currentTime;
    const scale = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    scale.forEach((f, i) => {
      shimmer(f, t + i * 0.05, 1.2 - i * 0.05, 0.06);
    });
  }, [getCtx, shimmer]);

  // ── Lluvia de Estrellas ── descending sparkle cascade
  const playLluvia = useCallback(() => {
    const t = getCtx().currentTime;
    const freqs = [1046.5, 987.77, 880.0, 783.99, 698.46, 659.25, 587.33, 523.25, 493.88, 440.0, 392.0, 349.23, 329.63, 293.66, 261.63];
    freqs.forEach((f, i) => {
      shimmer(f, t + i * 0.055, 1.0 - i * 0.04, 0.055);
    });
    // Soft landing chord
    [261.63, 329.63, 392.0, 523.25].forEach((f) => {
      tone(f, t + 0.85, 1.2, 0.03, 'sine');
    });
  }, [getCtx, shimmer, tone]);

  // ── Caja Musical ── music box melody (high octave, short plucky notes)
  const playCajaMusical = useCallback(() => {
    const t = getCtx().currentTime;
    // Twinkle Twinkle pattern in high octave
    const melody = [
      { f: 1046.5, o: 0 },     // C6
      { f: 1046.5, o: 0.14 },
      { f: 1568.0, o: 0.28 },  // G6
      { f: 1568.0, o: 0.42 },
      { f: 1760.0, o: 0.56 },  // A6
      { f: 1760.0, o: 0.70 },
      { f: 1568.0, o: 0.84 },  // G6 (held)
      { f: 1396.9, o: 1.10 },  // F6
      { f: 1396.9, o: 1.24 },
      { f: 1318.5, o: 1.38 },  // E6
      { f: 1318.5, o: 1.52 },
      { f: 1174.7, o: 1.66 },  // D6
      { f: 1174.7, o: 1.80 },
      { f: 1046.5, o: 1.94 },  // C6 (held)
    ];
    melody.forEach(({ f, o }, i) => {
      const isHeld = i === 6 || i === 13;
      shimmer(f, t + o, isHeld ? 0.4 : 0.22, 0.05);
    });
  }, [getCtx, shimmer]);

  // ── Campanas de Cristal ── high delicate chime hits
  const playCristal = useCallback(() => {
    const t = getCtx().currentTime;
    const chimes = [
      { f: 1318.5, o: 0, d: 1.4 },
      { f: 1760.0, o: 0.2, d: 1.2 },
      { f: 2093.0, o: 0.4, d: 1.3 },
      { f: 1568.0, o: 0.65, d: 1.1 },
      { f: 2349.3, o: 0.85, d: 1.5 },
      { f: 2637.0, o: 1.05, d: 1.6 },
    ];
    chimes.forEach(({ f, o, d }) => {
      tone(f, t + o, d, 0.05, 'sine');
      tone(f * 2, t + o, d * 0.5, 0.015, 'sine');
      tone(f * 3, t + o, d * 0.3, 0.008, 'triangle');
    });
  }, [getCtx, tone]);

  // ── Amanecer ── slow building ascending chord (sunrise feel)
  const playAmanecer = useCallback(() => {
    const t = getCtx().currentTime;
    const notes = [
      { f: 261.63, o: 0, d: 2.5 },    // C4
      { f: 329.63, o: 0.3, d: 2.2 },   // E4
      { f: 392.0, o: 0.6, d: 1.9 },    // G4
      { f: 523.25, o: 0.9, d: 1.6 },   // C5
      { f: 659.25, o: 1.2, d: 1.3 },   // E5
      { f: 783.99, o: 1.5, d: 1.0 },   // G5
      { f: 1046.5, o: 1.8, d: 0.8 },   // C6
    ];
    notes.forEach(({ f, o, d }) => {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + o);
      gain.gain.setValueAtTime(0, t + o);
      gain.gain.linearRampToValueAtTime(0.05, t + o + d * 0.3);
      gain.gain.setValueAtTime(0.05, t + o + d * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + o + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + o);
      osc.stop(t + o + d);
      // Octave harmonic
      tone(f * 2, t + o + 0.1, d * 0.5, 0.02, 'triangle');
    });
  }, [getCtx, tone]);

  // ── Cascada Dorada ── pentatonic waterfall (both directions)
  const playCascada = useCallback(() => {
    const t = getCtx().currentTime;
    // C pentatonic ascending
    const up = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0];
    up.forEach((f, i) => {
      shimmer(f, t + i * 0.06, 0.8, 0.05);
    });
    // Then back down
    const down = [...up].reverse();
    down.forEach((f, i) => {
      shimmer(f, t + 0.65 + i * 0.06, 0.7, 0.04);
    });
  }, [getCtx, shimmer]);

  // ── Carillon ── bell tower melody (Westminster chime pattern)
  const playCarillon = useCallback(() => {
    const t = getCtx().currentTime;
    // Westminster quarters pattern: E-C-D-G (low), G-D-E-C
    const melody = [
      { f: 659.25, o: 0, d: 0.6 },     // E5
      { f: 523.25, o: 0.35, d: 0.6 },   // C5
      { f: 587.33, o: 0.70, d: 0.6 },   // D5
      { f: 392.0, o: 1.05, d: 1.0 },    // G4 (held)
      { f: 392.0, o: 1.7, d: 0.6 },     // G4
      { f: 587.33, o: 2.05, d: 0.6 },   // D5
      { f: 659.25, o: 2.40, d: 0.6 },   // E5
      { f: 523.25, o: 2.75, d: 1.2 },   // C5 (held)
    ];
    melody.forEach(({ f, o, d }) => {
      tone(f, t + o, d, 0.06, 'sine');
      tone(f * 2, t + o, d * 0.6, 0.02, 'sine');
      tone(f * 0.5, t + o, d * 0.4, 0.015, 'triangle');
    });
  }, [getCtx, tone]);

  // ── Aurora Boreal ── shimmering sustained tones with slow movement
  const playAurora = useCallback(() => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const chord = [329.63, 440.0, 523.25, 659.25, 783.99];
    chord.forEach((f, i) => {
      // Each voice slightly detuned for shimmer
      [-4, 0, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.15);
        osc.detune.setValueAtTime(detune, t + i * 0.15);
        gain.gain.setValueAtTime(0, t + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.025, t + i * 0.15 + 0.4);
        gain.gain.setValueAtTime(0.025, t + i * 0.15 + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.15);
        osc.stop(t + i * 0.15 + 2.0);
      });
    });
    // Sparkle on top
    [1318.5, 1568.0, 1760.0, 2093.0, 1568.0, 1318.5].forEach((f, i) => {
      tone(f, t + 0.8 + i * 0.12, 0.5, 0.025, 'sine');
    });
  }, [getCtx, tone]);

  // ── Mariposas ── fluttering quick alternating notes (trills)
  const playMariposas = useCallback(() => {
    const t = getCtx().currentTime;
    // Fluttering trills at different pitches
    const trills = [
      { f1: 659.25, f2: 783.99, start: 0, count: 6 },
      { f1: 880.0, f2: 1046.5, start: 0.35, count: 6 },
      { f1: 1174.7, f2: 1318.5, start: 0.7, count: 8 },
    ];
    trills.forEach(({ f1, f2, start, count }) => {
      for (let i = 0; i < count; i++) {
        const f = i % 2 === 0 ? f1 : f2;
        shimmer(f, t + start + i * 0.055, 0.18, 0.045);
      }
    });
    // Final gentle landing
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(f, t + 1.2 + i * 0.08, 0.9, 0.035, 'sine');
    });
  }, [getCtx, shimmer, tone]);

  // ── Constelacion ── random sparkle notes appearing like stars
  const playConstelacion = useCallback(() => {
    const t = getCtx().currentTime;
    // Pentatonic notes at semi-random timings
    const stars = [
      { f: 1046.5, o: 0 },
      { f: 1318.5, o: 0.08 },
      { f: 783.99, o: 0.18 },
      { f: 1568.0, o: 0.25 },
      { f: 880.0, o: 0.38 },
      { f: 1760.0, o: 0.45 },
      { f: 659.25, o: 0.55 },
      { f: 1174.7, o: 0.62 },
      { f: 2093.0, o: 0.72 },
      { f: 1396.9, o: 0.80 },
      { f: 523.25, o: 0.90 },
      { f: 1976.0, o: 0.98 },
    ];
    stars.forEach(({ f, o }) => {
      shimmer(f, t + o, 0.8, 0.045);
    });
    // Final chord bloom
    [523.25, 783.99, 1046.5, 1568.0].forEach((f) => {
      tone(f, t + 1.1, 1.2, 0.03, 'sine');
    });
  }, [getCtx, shimmer, tone]);

  // ── Brisa Angelical ── gentle wave pattern up and down
  const playBrisa = useCallback(() => {
    const t = getCtx().currentTime;
    // Wave 1: up
    const wave1 = [329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    wave1.forEach((f, i) => {
      shimmer(f, t + i * 0.09, 0.7, 0.05);
    });
    // Wave 2: down
    const wave2 = [659.25, 587.33, 523.25, 440.0, 392.0, 329.63];
    wave2.forEach((f, i) => {
      shimmer(f, t + 0.55 + i * 0.09, 0.65, 0.045);
    });
    // Wave 3: up higher
    const wave3 = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    wave3.forEach((f, i) => {
      shimmer(f, t + 1.1 + i * 0.07, 0.8, 0.04);
    });
  }, [getCtx, shimmer]);

  const play = useCallback(
    (soundId: string) => {
      const map: Record<string, () => void> = {
        'arpa': playArpa,
        'lluvia': playLluvia,
        'caja-musical': playCajaMusical,
        'cristal': playCristal,
        'amanecer': playAmanecer,
        'cascada': playCascada,
        'carillon': playCarillon,
        'aurora': playAurora,
        'mariposas': playMariposas,
        'constelacion': playConstelacion,
        'brisa': playBrisa,
      };
      map[soundId]?.();
    },
    [playArpa, playLluvia, playCajaMusical, playCristal, playAmanecer, playCascada, playCarillon, playAurora, playMariposas, playConstelacion, playBrisa],
  );

  return { play };
}

export default useSoundEffects;
