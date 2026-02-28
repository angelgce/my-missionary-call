import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';

import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

import api from '@/core/services/api';
import { useAppDispatch, useAppSelector } from '@/core/hooks/useAppDispatch';
import { fetchPredictions, submitPrediction, Prediction } from '@/core/store/slices/predictionSlice';
import { setAdviceGuestName, setAdviceText, submitAdvice } from '@/core/store/slices/adviceSlice';
import { getSessionId } from '@/core/utils/session';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';
import SparkleBackground from '@/modules/home/components/SparkleBackground';
import ChristPhotoCascade from '@/modules/home/components/ChristPhotoCascade';
import HintsChatModal from '@/modules/home/components/HintsChatModal';
const WorldMap = lazy(() => import('@/modules/predict/components/WorldMap'));
import LetterCover from '@/modules/revelation/components/LetterCover';
import PhotoCarousel from '@/modules/home/components/PhotoCarousel';
const ResultsView = lazy(() => import('@/modules/home/components/ResultsView'));

import LocationSelector from '@/modules/predict/components/LocationSelector';

import { useHintsChat } from '@/modules/home/hooks/useHintsChat';
import { useCountryData } from '@/modules/predict/hooks/useCountryData';

interface RevelationData {
  missionaryName: string;
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
  pdfText: string | null;
  normalizedPdfText: string | null;
  isRevealed: boolean;
}

const CALL_LETTER_TEMPLATE = `27 de enero de 2026

Hermana {{MISSIONARY_NAME}}
Calle Belisario Dominguez 127 Colony Primero de Mayo
Villahermosa Tabasco 86190
Mexico

Estimada hermana {{MISSIONARY_NAME}}:

Por medio de la presente, se le llama a prestar servicio como misionera de La Iglesia de Jesucristo de los Santos de los Últimos Días.

Se le ha recomendado como una persona digna de representar al Señor en calidad de ministro del evangelio restaurado de Jesucristo. Será una representante oficial de la Iglesia. Como tal, se espera que usted honre los convenios que ha hecho con el Padre Celestial, guarde los mandamientos, mantenga las más altas normas de conducta y siga el consejo recto de su presidente de misión. Al dedicar su tiempo y su atención a servir al Señor, dejando a un lado todos los demás asuntos personales, usted será bendecida con un mayor conocimiento y testimonio de Jesucristo y de Su evangelio restaurado.

Su objetivo será invitar a otras personas a venir a Cristo al ayudarlos a recibir el Evangelio restaurado por medio de la fe en Jesucristo y en Su expiación, del arrepentimiento y del bautismo, al recibir el don del Espíritu Santo y perseverar hasta el fin. Al prestar servicio con todo su corazón, alma, mente y fuerza, el Señor la guiará a aquellos que quieran escuchar Su mensaje. Así también ellos pueden tener la oportunidad de recibir ordenanzas sagradas y hacer convenios con el Padre Celestial.

Se le ha asignado a servir en la Misión {{MISSION_NAME}} y se preparará para predicar el Evangelio en el idioma {{LANGUAGE}}. Usted comenzará su capacitación misional el lunes {{ENTRY_DATE}}, después de ser apartada por su presidente de estaca. Tenga a bien revisar el Portal Misional para obtener información adicional sobre su experiencia de capacitación. Se anticipa que prestará servicio por un período de 18 meses.

Nuestro Padre Celestial la recompensará por su bondad en la vida. Si sirve al Señor con humildad y con espíritu de oración en esta obra de amor entre Sus hijos, recibirá mayores bendiciones y más gozo de los que nunca haya recibido. Ponemos nuestra confianza en usted y rogamos que el Señor le ayude a convertirse en una misionera eficiente.

Atentamente,

Presidente`;

function Home() {
  // Local state
  const [data, setData] = useState<RevelationData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [coverOpened, setCoverOpened] = useState(false);
  const [coverKey, setCoverKey] = useState(0);
  const [missionRevealed, setMissionRevealed] = useState(false);
  const [langRevealed, setLangRevealed] = useState(false);
  const [dateRevealed, setDateRevealed] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [destination, setDestination] = useState<{ lat: number; lng: number; missionName: string } | null>(null);
  const [loadingDestination, setLoadingDestination] = useState(false);

  const [eventSettings, setEventSettings] = useState<{ openingDate: string; locationAddress: string; locationUrl: string } | null>(null);
  const [quickPrediction, setQuickPrediction] = useState<{
    country: string;
    countryCode: string;
    state: string;
    stateCode: string;
    city: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickNameError, setQuickNameError] = useState(false);
  const [quickLocationErrors, setQuickLocationErrors] = useState({ country: false, state: false, city: false });
  const [showMapHint, setShowMapHint] = useState(false);
  const [adviceSubmitting, setAdviceSubmitting] = useState(false);
  const [adviceSent, setAdviceSent] = useState(false);
  const [adviceErrors, setAdviceErrors] = useState({ guestName: false, advice: false });
  const [adviceRejection, setAdviceRejection] = useState<string | null>(null);
  const [showAdviceHint, setShowAdviceHint] = useState(false);
  const [marquePaused, setMarqueePaused] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const marqueeResumeTimer = useRef<ReturnType<typeof setTimeout>>();
  const adviceSectionRef = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Redux selectors
  const dispatch = useAppDispatch();
  const predictions = useAppSelector((s) => s.prediction.predictions);
  const adviceGuestName = useAppSelector((s) => s.advice.guestName);
  const adviceText = useAppSelector((s) => s.advice.advice);
  const isAdmin = useAppSelector((s) => s.admin.isAuthenticated);

  // Custom hooks
  const { phase, messages, hintCount, isLoading, initChat, sendMessage, resetChat } = useHintsChat();
  const { countries, getStates, getCities, findNearestLocation, findNearestCity, getCountryName, getStateName } = useCountryData();

  // Computed values
  const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const predictUrl = `${window.location.origin}/predict`;
  const shareUrl = 'https://aletaraz.com';
  const isRevealed = data?.isRevealed ?? false;
  const missionaryName = data?.missionaryName || 'Hermana Nombre Apellido';
  const allFieldsRevealed = missionRevealed && langRevealed && dateRevealed;
  const quickStates = quickPrediction ? getStates(quickPrediction.countryCode) : [];
  const quickCities = quickPrediction ? getCities(quickPrediction.countryCode, quickPrediction.stateCode) : [];

  // Countdown — always relative to Villahermosa, Tabasco (America/Mexico_City, UTC-6, no DST)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!eventSettings?.openingDate) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [eventSettings?.openingDate]);

  const { countdown, openingDateFormatted } = useMemo(() => {
    if (!eventSettings?.openingDate) return { countdown: null, openingDateFormatted: '' };

    // The stored date has no timezone (e.g. "2026-03-15T10:00").
    // new Date() parses it as local browser time; adjust to Villahermosa (UTC-6).
    const localDate = new Date(eventSettings.openingDate);
    const VILLAHERMOSA_OFFSET_MIN = 360; // UTC-6 in positive minutes
    const adjustment = (VILLAHERMOSA_OFFSET_MIN - localDate.getTimezoneOffset()) * 60_000;
    const targetUtc = localDate.getTime() + adjustment;

    const formatted = new Date(targetUtc).toLocaleDateString('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const diff = targetUtc - now;
    if (diff <= 0)
      return { countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }, openingDateFormatted: formatted };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { countdown: { days, hours, minutes, seconds, expired: false }, openingDateFormatted: formatted };
  }, [eventSettings?.openingDate, now]);

  const isFreeForAll = isRevealed && (countdown?.expired === true || !eventSettings?.openingDate);
  const canOpenEnvelope = isFreeForAll || (isAdmin && isRevealed);

  // Effects
  useEffect(() => {
    const fetchAll = () => {
      dispatch(fetchPredictions());
    };
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const fetchRevelation = async () => {
      try {
        const revRes = await api.get('/revelation');
        if (revRes.data) {
          setData(revRes.data);
        }
      } catch {
        // silently fail
      }
      try {
        const settingsRes = await api.get('/revelation/event-settings');
        if (settingsRes?.data) {
          setEventSettings(settingsRes.data);
        }
      } catch {
        // silently fail
      }
    };
    fetchRevelation();

    const interval = setInterval(fetchRevelation, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const fetchSignature = async () => {
      try {
        const res = await api.get('/assets/signed-url/assets/signature.png');
        setSignatureUrl(res.data.url);
      } catch {
        // silently fail
      }
    };
    fetchSignature();
  }, [showModal]);

  // Marquee auto-scroll
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el || predictions.length <= 3) return;

    let raf: number;
    const speed = 0.5; // px per frame

    const step = () => {
      if (!marquePaused && el) {
        el.scrollLeft += speed;
        // Loop: when halfway scrolled (duplicated content), reset to start
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [predictions.length, marquePaused]);

  // Marquee interaction handlers
  const handleMarqueeInteractionStart = useCallback(() => {
    clearTimeout(marqueeResumeTimer.current);
    setMarqueePaused(true);
  }, []);

  const handleMarqueeInteractionEnd = useCallback(() => {
    clearTimeout(marqueeResumeTimer.current);
    marqueeResumeTimer.current = setTimeout(() => setMarqueePaused(false), 3000);
  }, []);

  const handleMarqueeMouseDown = useCallback((e: React.MouseEvent) => {
    const el = marqueeRef.current;
    if (!el) return;
    marqueeDragRef.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    handleMarqueeInteractionStart();
  }, [handleMarqueeInteractionStart]);

  const handleMarqueeMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = marqueeDragRef.current;
    if (!drag.isDown) return;
    e.preventDefault();
    const el = marqueeRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = drag.scrollLeft - (x - drag.startX);
  }, []);

  const handleMarqueeMouseUp = useCallback(() => {
    marqueeDragRef.current.isDown = false;
    handleMarqueeInteractionEnd();
  }, [handleMarqueeInteractionEnd]);

  // Event handlers
  const handleGlobalMapClick = useCallback((lng: number, lat: number) => {
    const result = findNearestLocation(lng, lat);
    if (!result) return;

    const countryName = getCountryName(result.countryCode);
    const stateName = result.stateCode ? getStateName(result.stateCode, result.countryCode) : '';
    const cityName = result.stateCode ? findNearestCity(result.countryCode, result.stateCode, lng, lat) : '';

    setQuickPrediction({
      country: countryName,
      countryCode: result.countryCode,
      state: stateName,
      stateCode: result.stateCode || '',
      city: cityName || '',
      lat,
      lng,
    });
    setQuickName('');
    setQuickNameError(false);
    setQuickLocationErrors({ country: false, state: false, city: false });
    setShowMapHint(false);
  }, [findNearestLocation, findNearestCity, getCountryName, getStateName]);

  const handleQuickSubmit = async () => {
    if (!quickPrediction) return;
    const nameErr = !quickName.trim();
    const locErr = {
      country: !quickPrediction.countryCode,
      state: !quickPrediction.stateCode,
      city: !quickPrediction.city,
    };
    setQuickNameError(nameErr);
    setQuickLocationErrors(locErr);
    if (nameErr || locErr.country || locErr.state || locErr.city) return;
    setQuickSubmitting(true);
    try {
      await dispatch(
        submitPrediction({
          name: quickName.trim(),
          country: quickPrediction.country,
          countryCode: quickPrediction.countryCode,
          state: quickPrediction.state,
          stateCode: quickPrediction.stateCode,
          city: quickPrediction.city,
          sessionId: getSessionId(),
          latitude: String(quickPrediction.lat),
          longitude: String(quickPrediction.lng),
        })
      ).unwrap();
      await dispatch(fetchPredictions()).unwrap();
      setQuickPrediction(null);
    } catch {
      // silently fail
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleScrollToMap = () => {
    setShowMapHint(true);
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollToAdvice = () => {
    setShowAdviceHint(true);
    adviceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAdviceSubmit = async () => {
    const newErrors = {
      guestName: !adviceGuestName.trim(),
      advice: !adviceText.trim(),
    };
    setAdviceErrors(newErrors);
    if (newErrors.guestName || newErrors.advice || adviceSubmitting) return;

    setAdviceSubmitting(true);
    setAdviceRejection(null);
    try {
      await dispatch(
        submitAdvice({
          name: adviceGuestName,
          advice: adviceText,
          sessionId: getSessionId(),
        })
      ).unwrap();
      setAdviceSent(true);
      setShowAdviceHint(false);
      setTimeout(() => setAdviceSent(false), 3000);
    } catch (err: unknown) {
      if (typeof err === 'string') setAdviceRejection(err);
    } finally {
      setAdviceSubmitting(false);
    }
  };

  const handleOpenLetter = () => {
    if (!canOpenEnvelope) return;
    setShowChat(true);
    initChat();
  };

  const handleShowLetter = () => {
    setShowChat(false);
    setCoverOpened(false);
    setMissionRevealed(false);
    setLangRevealed(false);
    setDateRevealed(false);
    setCoverKey((k) => k + 1);
    setShowModal(true);
  };

  const fireConfetti = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x, y },
      colors: ['#BF9B30', '#D4849B', '#3B2140', '#F8E0E8', '#FFD700'],
      startVelocity: 30,
      gravity: 0.8,
      ticks: 120,
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x, y: y - 0.05 },
        colors: ['#BF9B30', '#D4849B', '#FFD700', '#FFF8FA'],
        startVelocity: 25,
        gravity: 0.7,
        ticks: 100,
      });
    }, 200);

    setTimeout(() => {
      confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#BF9B30', '#D4849B', '#3B2140'] });
      confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#BF9B30', '#D4849B', '#3B2140'] });
    }, 400);
  }, []);

  const fireConfettiAt = useCallback((x: number, y: number) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x, y },
      colors: ['#BF9B30', '#D4849B', '#3B2140', '#F8E0E8', '#FFD700'],
      startVelocity: 30,
      gravity: 0.8,
      ticks: 120,
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x, y: y - 0.05 },
        colors: ['#BF9B30', '#D4849B', '#FFD700', '#FFF8FA'],
        startVelocity: 25,
        gravity: 0.7,
        ticks: 100,
      });
    }, 200);
    setTimeout(() => {
      confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#BF9B30', '#D4849B', '#3B2140'] });
      confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#BF9B30', '#D4849B', '#3B2140'] });
    }, 400);
  }, []);

  const handleRevealMission = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMissionRevealed(true);
    setLangRevealed(true);
    setDateRevealed(true);
    fireConfetti(e);
  }, [fireConfetti]);

  const handleRevealLang = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLangRevealed(true);
    fireConfetti(e);
  }, [fireConfetti]);

  const handleRevealDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRevealed(true);
    fireConfetti(e);
  }, [fireConfetti]);

  const handleResetChat = async () => {
    await resetChat();
    initChat();
  };

  const handleContinuar = async () => {
    setLoadingDestination(true);
    try {
      const res = await api.get('/revelation/destination');
      setDestination(res.data);
      setShowModal(false);
      setShowResults(true);
    } catch {
      // silently fail
    } finally {
      setLoadingDestination(false);
    }
  };

  // Show results view
  if (showResults && destination) {
    return (
      <Suspense fallback={null}>
        <ResultsView
          predictions={predictions}
          destination={destination}
          onBack={() => setShowResults(false)}
        />
      </Suspense>
    );
  }

  return (
    <PageContainer className="relative flex min-h-screen flex-col items-center justify-center text-center">
      <ChristPhotoCascade />
      <SparkleBackground />
      <div className="relative z-10 w-full animate-fade-in">
        <p
          className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] tablet:text-sm tablet:tracking-[0.3em]"
          style={{
            background: 'linear-gradient(90deg, #BF9B30 0%, #D4A843 30%, #FFD700 50%, #D4A843 70%, #BF9B30 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'titleShimmer 5s ease-in-out infinite',
          }}
        >
          La Iglesia de Jesucristo de los Santos de los Últimos Días
        </p>

        <DecorativeDivider />

        <h1
          className="font-serif text-2xl font-bold tablet:text-5xl desktop:text-7xl"
          style={{
            background: 'linear-gradient(90deg, #3B2140 0%, #3B2140 35%, #BF9B30 50%, #3B2140 65%, #3B2140 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'titleShimmer 4s ease-in-out infinite',
          }}
        >
          Llamada a Servir
        </h1>

        <p
          className="mt-3 text-2xl text-slate tablet:mt-4 tablet:text-3xl"
          style={{
            fontFamily: "'Dancing Script', cursive",
            animation: 'textGlow 3s ease-in-out infinite 1s',
          }}
        >
          {missionaryName}
        </p>

        <DecorativeDivider className="my-6" />

        {/* Envelope */}
        <div>
          <div
            onClick={handleOpenLetter}
            className={`group relative mx-auto w-72 tablet:w-96 ${canOpenEnvelope ? 'cursor-pointer' : 'cursor-default'}`}
            style={{
              animation: canOpenEnvelope ? 'envelopeFloat 3s ease-in-out infinite' : 'none',
            }}
          >
            {/* Floating shadow */}
            <div
              className="absolute -bottom-4 left-8 right-8 h-8 rounded-[50%] blur-xl transition-all duration-300 group-hover:-bottom-5"
              style={{ background: 'rgba(59,33,64,0.15)' }}
            />

            {/* Glow when ready */}
            {canOpenEnvelope && (
              <div
                className="absolute -inset-10 z-0 rounded-full"
                style={{
                  animation: 'sealGlow 2.5s ease-in-out infinite',
                  background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
                }}
              />
            )}

            {/* Envelope body */}
            <div
              className={`relative z-10 overflow-hidden rounded-sm transition-transform duration-300 ${
                canOpenEnvelope ? 'group-hover:scale-[1.03]' : ''
              }`}
              style={{
                background: '#FAE5ED',
                boxShadow: '0 10px 40px rgba(59,33,64,0.12), 0 2px 8px rgba(59,33,64,0.06)',
                aspectRatio: '7 / 5',
                animation: canOpenEnvelope ? 'sparklePulse 3s ease-in-out infinite' : 'none',
              }}
            >
              {/* Gold ornamental border on body */}
              <svg className="absolute inset-0 z-[15] h-full w-full" viewBox="0 0 280 200" preserveAspectRatio="none" fill="none">
                {/* Outer border */}
                <rect x="5" y="5" width="270" height="190" rx="1" stroke="#c9a84c" strokeWidth="0.7" opacity="0.45" />
                <rect x="9" y="9" width="262" height="182" rx="1" stroke="#c9a84c" strokeWidth="0.35" opacity="0.3" />

                {/* Corner ornament definition - top left */}
                <g opacity="0.6" stroke="#c9a84c" fill="#c9a84c">
                  {/* Main corner curl */}
                  <path d="M12,12 C12,12 22,11 28,16 C34,21 30,30 24,27 C18,24 22,18 28,16" strokeWidth="0.6" fill="none" />
                  <path d="M12,12 C12,12 11,22 16,28 C21,34 30,30 27,24 C24,18 18,22 16,28" strokeWidth="0.6" fill="none" />
                  <circle cx="12" cy="12" r="1.5" />
                  {/* Extended scrollwork */}
                  <path d="M28,16 C34,13 42,11 52,12 C46,14 38,17 34,22" strokeWidth="0.45" fill="none" />
                  <path d="M16,28 C13,34 11,42 12,52 C14,46 17,38 22,34" strokeWidth="0.45" fill="none" />
                  <path d="M52,12 C56,11 62,10 68,11 Q62,13 56,12" strokeWidth="0.35" fill="none" />
                  <path d="M12,52 C11,56 10,62 11,68 Q13,62 12,56" strokeWidth="0.35" fill="none" />
                  {/* Leaf shapes */}
                  <path d="M52,12 Q57,9 62,11 Q57,14 52,12" strokeWidth="0.25" />
                  <path d="M12,52 Q9,57 11,62 Q14,57 12,52" strokeWidth="0.25" />
                  <path d="M36,14 Q40,10 44,12 Q40,15 36,14" strokeWidth="0.25" />
                  <path d="M14,36 Q10,40 12,44 Q15,40 14,36" strokeWidth="0.25" />
                  {/* Small dots */}
                  <circle cx="46" cy="13" r="0.5" />
                  <circle cx="13" cy="46" r="0.5" />
                  <circle cx="32" cy="15" r="0.4" />
                  <circle cx="15" cy="32" r="0.4" />
                  {/* Inner spiral detail */}
                  <path d="M20,16 Q24,14 26,18 Q22,20 20,16" strokeWidth="0.3" fill="none" />
                  <path d="M16,20 Q14,24 18,26 Q20,22 16,20" strokeWidth="0.3" fill="none" />
                </g>

                {/* Corner ornament - top right */}
                <g opacity="0.6" stroke="#c9a84c" fill="#c9a84c" transform="translate(280,0) scale(-1,1)">
                  <path d="M12,12 C12,12 22,11 28,16 C34,21 30,30 24,27 C18,24 22,18 28,16" strokeWidth="0.6" fill="none" />
                  <path d="M12,12 C12,12 11,22 16,28 C21,34 30,30 27,24 C24,18 18,22 16,28" strokeWidth="0.6" fill="none" />
                  <circle cx="12" cy="12" r="1.5" />
                  <path d="M28,16 C34,13 42,11 52,12 C46,14 38,17 34,22" strokeWidth="0.45" fill="none" />
                  <path d="M16,28 C13,34 11,42 12,52 C14,46 17,38 22,34" strokeWidth="0.45" fill="none" />
                  <path d="M52,12 Q57,9 62,11 Q57,14 52,12" strokeWidth="0.25" />
                  <path d="M12,52 Q9,57 11,62 Q14,57 12,52" strokeWidth="0.25" />
                  <path d="M36,14 Q40,10 44,12 Q40,15 36,14" strokeWidth="0.25" />
                  <path d="M14,36 Q10,40 12,44 Q15,40 14,36" strokeWidth="0.25" />
                  <circle cx="46" cy="13" r="0.5" />
                  <circle cx="13" cy="46" r="0.5" />
                  <circle cx="32" cy="15" r="0.4" />
                  <circle cx="15" cy="32" r="0.4" />
                  <path d="M20,16 Q24,14 26,18 Q22,20 20,16" strokeWidth="0.3" fill="none" />
                  <path d="M16,20 Q14,24 18,26 Q20,22 16,20" strokeWidth="0.3" fill="none" />
                </g>

                {/* Corner ornament - bottom left */}
                <g opacity="0.6" stroke="#c9a84c" fill="#c9a84c" transform="translate(0,200) scale(1,-1)">
                  <path d="M12,12 C12,12 22,11 28,16 C34,21 30,30 24,27 C18,24 22,18 28,16" strokeWidth="0.6" fill="none" />
                  <path d="M12,12 C12,12 11,22 16,28 C21,34 30,30 27,24 C24,18 18,22 16,28" strokeWidth="0.6" fill="none" />
                  <circle cx="12" cy="12" r="1.5" />
                  <path d="M28,16 C34,13 42,11 52,12 C46,14 38,17 34,22" strokeWidth="0.45" fill="none" />
                  <path d="M16,28 C13,34 11,42 12,52 C14,46 17,38 22,34" strokeWidth="0.45" fill="none" />
                  <path d="M52,12 Q57,9 62,11 Q57,14 52,12" strokeWidth="0.25" />
                  <path d="M12,52 Q9,57 11,62 Q14,57 12,52" strokeWidth="0.25" />
                  <path d="M36,14 Q40,10 44,12 Q40,15 36,14" strokeWidth="0.25" />
                  <path d="M14,36 Q10,40 12,44 Q15,40 14,36" strokeWidth="0.25" />
                  <circle cx="46" cy="13" r="0.5" />
                  <circle cx="13" cy="46" r="0.5" />
                  <circle cx="32" cy="15" r="0.4" />
                  <circle cx="15" cy="32" r="0.4" />
                  <path d="M20,16 Q24,14 26,18 Q22,20 20,16" strokeWidth="0.3" fill="none" />
                  <path d="M16,20 Q14,24 18,26 Q20,22 16,20" strokeWidth="0.3" fill="none" />
                </g>

                {/* Corner ornament - bottom right */}
                <g opacity="0.6" stroke="#c9a84c" fill="#c9a84c" transform="translate(280,200) scale(-1,-1)">
                  <path d="M12,12 C12,12 22,11 28,16 C34,21 30,30 24,27 C18,24 22,18 28,16" strokeWidth="0.6" fill="none" />
                  <path d="M12,12 C12,12 11,22 16,28 C21,34 30,30 27,24 C24,18 18,22 16,28" strokeWidth="0.6" fill="none" />
                  <circle cx="12" cy="12" r="1.5" />
                  <path d="M28,16 C34,13 42,11 52,12 C46,14 38,17 34,22" strokeWidth="0.45" fill="none" />
                  <path d="M16,28 C13,34 11,42 12,52 C14,46 17,38 22,34" strokeWidth="0.45" fill="none" />
                  <path d="M52,12 Q57,9 62,11 Q57,14 52,12" strokeWidth="0.25" />
                  <path d="M12,52 Q9,57 11,62 Q14,57 12,52" strokeWidth="0.25" />
                  <path d="M36,14 Q40,10 44,12 Q40,15 36,14" strokeWidth="0.25" />
                  <path d="M14,36 Q10,40 12,44 Q15,40 14,36" strokeWidth="0.25" />
                  <circle cx="46" cy="13" r="0.5" />
                  <circle cx="13" cy="46" r="0.5" />
                  <circle cx="32" cy="15" r="0.4" />
                  <circle cx="15" cy="32" r="0.4" />
                  <path d="M20,16 Q24,14 26,18 Q22,20 20,16" strokeWidth="0.3" fill="none" />
                  <path d="M16,20 Q14,24 18,26 Q20,22 16,20" strokeWidth="0.3" fill="none" />
                </g>

                {/* Side scrollwork - left */}
                <g opacity="0.35" stroke="#c9a84c" fill="#c9a84c">
                  <path d="M8,85 Q6,95 8,105 Q10,95 8,85" strokeWidth="0.4" fill="none" />
                  <path d="M8,105 Q6,115 8,125 Q10,115 8,105" strokeWidth="0.4" fill="none" />
                  <circle cx="8" cy="100" r="0.6" />
                </g>

                {/* Side scrollwork - right */}
                <g opacity="0.35" stroke="#c9a84c" fill="#c9a84c">
                  <path d="M272,85 Q274,95 272,105 Q270,95 272,85" strokeWidth="0.4" fill="none" />
                  <path d="M272,105 Q274,115 272,125 Q270,115 272,105" strokeWidth="0.4" fill="none" />
                  <circle cx="272" cy="100" r="0.6" />
                </g>

                {/* Top center ornament */}
                <g opacity="0.35" stroke="#c9a84c" fill="#c9a84c">
                  <path d="M120,8 Q130,6 140,8 Q150,6 160,8" strokeWidth="0.35" fill="none" />
                  <circle cx="140" cy="7" r="0.6" />
                </g>

                {/* Bottom center ornament */}
                <g opacity="0.35" stroke="#c9a84c" fill="#c9a84c">
                  <path d="M120,192 Q130,194 140,192 Q150,194 160,192" strokeWidth="0.35" fill="none" />
                  <circle cx="140" cy="193" r="0.6" />
                </g>
              </svg>

              {/* Envelope flap */}
              <div
                className="absolute inset-x-0 top-0 z-20"
                style={{
                  height: '42%',
                  background: 'linear-gradient(180deg, #F3D4DE 0%, #EEC8D4 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }}
              />

              {/* Gold filigree on flap */}
              <svg className="absolute inset-x-0 top-0 z-[22] h-[42%] w-full" viewBox="0 0 280 84" preserveAspectRatio="none" fill="none" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}>
                {/* Flap border lines */}
                <path d="M3,2 L140,80 L277,2" stroke="#c9a84c" strokeWidth="0.7" opacity="0.45" fill="none" />
                <path d="M7,2 L140,76 L273,2" stroke="#c9a84c" strokeWidth="0.35" opacity="0.3" fill="none" />

                {/* Star emblem on flap */}
                <g transform="translate(140,30)" opacity="0.45" fill="#c9a84c">
                  <path d="M0,-6 L1.2,-1.8 L6,-1.8 L2.2,1.2 L3.4,6 L0,3 L-3.4,6 L-2.2,1.2 L-6,-1.8 L-1.2,-1.8 Z" />
                </g>

                {/* Flap scrollwork - left */}
                <g opacity="0.45" stroke="#c9a84c" fill="#c9a84c">
                  <path d="M10,3 C20,3 26,6 24,12 C22,6 16,4 10,3" strokeWidth="0.45" />
                  <path d="M10,3 Q34,6 52,22" strokeWidth="0.35" fill="none" />
                  <path d="M24,8 Q30,6 36,8 Q30,10 24,8" strokeWidth="0.25" />
                  <circle cx="10" cy="3" r="1" />
                  <circle cx="30" cy="7" r="0.4" />
                </g>
                {/* Flap scrollwork - right */}
                <g opacity="0.45" stroke="#c9a84c" fill="#c9a84c" transform="translate(280,0) scale(-1,1)">
                  <path d="M10,3 C20,3 26,6 24,12 C22,6 16,4 10,3" strokeWidth="0.45" />
                  <path d="M10,3 Q34,6 52,22" strokeWidth="0.35" fill="none" />
                  <path d="M24,8 Q30,6 36,8 Q30,10 24,8" strokeWidth="0.25" />
                  <circle cx="10" cy="3" r="1" />
                  <circle cx="30" cy="7" r="0.4" />
                </g>
              </svg>

              {/* Bottom V-shape fold */}
              <div
                className="absolute inset-x-0 bottom-0 z-[5]"
                style={{
                  height: '60%',
                  clipPath: 'polygon(0 100%, 50% 10%, 100% 100%)',
                  background: 'linear-gradient(0deg, rgba(201,168,76,0.04) 0%, transparent 100%)',
                }}
              />

              {/* Fold lines */}
              <svg className="absolute inset-0 z-10 h-full w-full" preserveAspectRatio="none">
                <line x1="0" y1="100%" x2="50%" y2="38%" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
                <line x1="100%" y1="100%" x2="50%" y2="38%" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
              </svg>

              {/* Center content - name and text only, no seal */}
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-5 tablet:pb-7">
                {/* Name */}
                <p className="font-serif text-sm font-bold text-navy/70 tablet:text-lg">
                  {missionaryName}
                </p>

                {/* Decorative gold separator */}
                <div className="mx-auto mt-1.5 flex items-center gap-2">
                  <div className="h-px w-8 tablet:w-12" style={{ background: 'rgba(201,168,76,0.35)' }} />
                  <div className="h-1 w-1 rotate-45" style={{ background: 'rgba(201,168,76,0.45)' }} />
                  <div className="h-px w-8 tablet:w-12" style={{ background: 'rgba(201,168,76,0.35)' }} />
                </div>

                <p className="mt-1.5 text-[7px] font-semibold uppercase tracking-[0.25em] tablet:text-[9px]" style={{ color: 'rgba(201,168,76,0.5)' }}>
                  Llamada a Servir
                </p>

                {canOpenEnvelope && (
                  <p
                    className="mt-2 text-[10px] font-medium"
                    style={{
                      background: 'linear-gradient(90deg, rgba(201,168,76,0.3) 0%, rgba(201,168,76,1) 50%, rgba(201,168,76,0.3) 100%)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'titleShimmer 2s ease-in-out infinite',
                    }}
                  >
                    Toca para abrir
                  </p>
                )}
              </div>
            </div>
          </div>

          {(!isRevealed || (isRevealed && !isFreeForAll && !isAdmin)) && (
            <div className="mx-auto mt-3 max-w-xs space-y-1.5 text-center">
              {isRevealed && !isFreeForAll && !isAdmin ? (
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-cream">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold/70">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-navy/70">
                    El llamamiento sera revelado pronto
                  </p>
                  {eventSettings?.openingDate && countdown && !countdown.expired && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-gold/60">
                        Se revela en
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        {[
                          { value: countdown.days, label: 'Días' },
                          { value: countdown.hours, label: 'Hrs' },
                          { value: countdown.minutes, label: 'Min' },
                          { value: countdown.seconds, label: 'Seg' },
                        ].map(({ value, label }, i) => (
                          <div key={label} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className="animate-countdown-pulse rounded-lg border border-gold/15 px-2 py-1.5"
                                style={{
                                  background: 'rgba(248, 224, 232, 0.35)',
                                  animationDelay: `${i * 0.3}s`,
                                }}
                              >
                                <span
                                  key={value}
                                  className="block font-serif text-lg font-bold tabular-nums text-navy"
                                  style={{ animation: 'countdownFlipIn 0.4s ease-out' }}
                                >
                                  {String(value).padStart(2, '0')}
                                </span>
                              </div>
                              <span className="mt-1 text-[8px] uppercase tracking-[0.12em] text-slate/60">
                                {label}
                              </span>
                            </div>
                            {i < 3 && (
                              <span className="animate-countdown-colon mb-3 px-0.5 font-serif text-sm text-gold/50">:</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] italic text-slate/40">
                        {openingDateFormatted}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {eventSettings?.openingDate && countdown && (
                    <div className="animate-countdown-fade space-y-3">
                      {countdown.expired ? (
                        <p
                          className="font-serif text-sm font-semibold tracking-wide text-gold"
                          style={{ animation: 'textGlow 2s ease-in-out infinite' }}
                        >
                          Ya es hora!
                        </p>
                      ) : (
                        <>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-gold/60">
                            Fecha de apertura
                          </p>

                          <div className="flex items-center justify-center gap-1">
                            {[
                              { value: countdown.days, label: 'Días' },
                              { value: countdown.hours, label: 'Hrs' },
                              { value: countdown.minutes, label: 'Min' },
                              { value: countdown.seconds, label: 'Seg' },
                            ].map(({ value, label }, i) => (
                              <div key={label} className="flex items-center">
                                <div className="flex flex-col items-center">
                                  <div
                                    className="animate-countdown-pulse rounded-lg border border-gold/15 px-2 py-1.5"
                                    style={{
                                      background: 'rgba(248, 224, 232, 0.35)',
                                      animationDelay: `${i * 0.3}s`,
                                      perspective: '200px',
                                    }}
                                  >
                                    <span
                                      key={value}
                                      className="block font-serif text-lg font-bold tabular-nums text-navy"
                                      style={{ animation: 'countdownFlipIn 0.4s ease-out' }}
                                    >
                                      {String(value).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <span className="mt-1 text-[8px] uppercase tracking-[0.12em] text-slate/60">
                                    {label}
                                  </span>
                                </div>
                                {i < 3 && (
                                  <span
                                    className="animate-countdown-colon mb-3 px-0.5 font-serif text-sm text-gold/50"
                                  >
                                    :
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          <p className="text-[10px] italic text-slate/40">
                            {openingDateFormatted}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  {eventSettings?.locationAddress && (
                    <p className="text-[11px] text-slate/60">
                      <span className="font-medium text-gold/80">Lugar:</span>{' '}
                      {eventSettings.locationUrl ? (
                        <a
                          href={eventSettings.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-gold/30 underline-offset-2 transition-colors hover:text-gold"
                        >
                          {eventSettings.locationAddress}
                        </a>
                      ) : (
                        eventSettings.locationAddress
                      )}
                    </p>
                  )}
                  {eventSettings?.locationUrl && !eventSettings?.locationAddress && (
                    <a
                      href={eventSettings.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] font-medium text-gold/80 underline decoration-gold/30 underline-offset-2 transition-colors hover:text-gold"
                    >
                      Ver en Google Maps
                    </a>
                  )}
                  {!eventSettings?.openingDate && !eventSettings?.locationAddress && (
                    <p className="text-[10px] text-slate/35">
                      El llamamiento será revelado durante el evento
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DecorativeDivider className="my-5 tablet:my-8" />
      </div>

      {/* Photo carousel */}
      <PhotoCarousel />

      {/* Action buttons */}
      <div className="relative z-10 flex w-full flex-col items-center gap-3 tablet:gap-4">
        <div className="flex w-full flex-col gap-2 tablet:flex-row tablet:justify-center tablet:gap-3">
          <button
            onClick={handleScrollToMap}
            className="w-full rounded-full border-2 border-gold bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-white tablet:w-auto tablet:px-6 tablet:py-2.5 tablet:text-sm"
            style={{ animation: 'sparklePulse 4s ease-in-out infinite' }}
          >
            Mi Predicción
          </button>
          <button
            onClick={handleScrollToAdvice}
            className="w-full rounded-full border-2 border-gold bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-white tablet:w-auto tablet:px-6 tablet:py-2.5 tablet:text-sm"
            style={{ animation: 'sparklePulse 4s ease-in-out infinite 2s' }}
          >
            Dejar un Consejo
          </button>
        </div>

        {/* Share */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate/40">Compartir</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-slate/50 transition-colors hover:border-gold/40 hover:text-gold"
              aria-label="Compartir en Facebook"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('¡Adivina a dónde irá de misión! Registra tu predicción:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-slate/50 transition-colors hover:border-gold/40 hover:text-gold"
              aria-label="Compartir en X"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('¡Adivina a dónde irá de misión! Registra tu predicción: ' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-slate/50 transition-colors hover:border-gold/40 hover:text-gold"
              aria-label="Compartir en WhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <button
              onClick={() => setShowQr(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-slate/50 transition-colors hover:border-gold/40 hover:text-gold"
              aria-label="Código QR"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v2h2v-2zm-4-4h-2v2h2v-2zm4 4h2v2h-2v-2zm0-4h2v2h-2v-2zm-4 4h-2v2h2v-2zm0 4h2v-2h-2v2zm4 0h2v-2h-2v2z" />
              </svg>
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-slate/50 transition-colors hover:border-gold/40 hover:text-gold"
              aria-label="Copiar enlace"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Predictions marquee */}
      <div className="relative left-1/2 z-10 mt-6 w-screen -translate-x-1/2 tablet:mt-8">
        {predictions.length > 0 && (() => {
          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
          const predShouldScroll = predictions.length > 3;

          return (
            <>
              <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gold tablet:text-xs">
                {predictions.length} {predictions.length === 1 ? 'predicción' : 'predicciones'}
              </p>
              <div
                ref={predShouldScroll ? marqueeRef : undefined}
                className={`hide-scrollbar px-2 tablet:px-0 ${predShouldScroll ? 'cursor-grab overflow-x-auto active:cursor-grabbing' : 'overflow-hidden'}`}
                onTouchStart={predShouldScroll ? handleMarqueeInteractionStart : undefined}
                onTouchEnd={predShouldScroll ? handleMarqueeInteractionEnd : undefined}
                onMouseDown={predShouldScroll ? handleMarqueeMouseDown : undefined}
                onMouseMove={predShouldScroll ? handleMarqueeMouseMove : undefined}
                onMouseUp={predShouldScroll ? handleMarqueeMouseUp : undefined}
                onMouseLeave={predShouldScroll ? handleMarqueeMouseUp : undefined}
              >
                <div
                  className={`flex gap-2 tablet:gap-3 ${predShouldScroll ? '' : 'justify-center'}`}
                  style={predShouldScroll ? { width: 'max-content' } : undefined}
                >
                  {(predShouldScroll ? [...predictions, ...predictions] : predictions).map((p, i) => (
                    <div
                      key={`pred-${p.id}-${i}`}
                      className="w-40 shrink-0 rounded-lg border border-rose-soft bg-warm-white p-2.5 text-left tablet:w-52 tablet:rounded-xl tablet:p-4"
                    >
                      <div className="flex items-start gap-2 tablet:gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/5 tablet:h-8 tablet:w-8">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-navy/40 tablet:h-[14px] tablet:w-[14px]">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-serif text-sm font-bold text-navy tablet:text-base">
                            {normalizeName(p.guestName)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-navy/70 tablet:text-sm">
                            {p.city}{p.state ? `, ${p.state}` : ''}
                          </p>
                          <p className="text-[10px] text-slate/50 tablet:text-xs">
                            {p.country}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate/40 tablet:text-[10px]">
                            {formatDate(p.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

        {/* Map */}
        <div ref={mapSectionRef} className="mt-3 px-4 tablet:mt-4 tablet:px-[10%] desktop:px-[15%]">
          {showMapHint && (
            <p className="mb-2 animate-fade-in text-center text-sm font-medium text-gold">
              Toca en el mapa el lugar donde crees que será enviada
            </p>
          )}
          <Suspense fallback={null}>
            <WorldMap
              selectedCountryCode=""
              selectedStateCode=""
              selectedCity=""
              countryCenter={null}
              states={[]}
              cities={[]}
              predictions={predictions}
              onMapClick={handleGlobalMapClick}
              onPredictionClick={() => {}}
            />
          </Suspense>
          <p className="mt-2 text-center text-xs text-slate/60">
            Haz clic en el mapa para registrar tu predicción
          </p>
        </div>

        {/* Advice form */}
        <div ref={adviceSectionRef} className="mt-6 px-4 tablet:mt-8 tablet:px-[10%] desktop:px-[15%]">
          {showAdviceHint && (
            <p className="mb-3 animate-fade-in text-center text-sm font-medium text-gold">
              Escribe un consejo o mensaje para la misionera
            </p>
          )}
          {adviceSent ? (
            <div className="flex flex-col items-center py-6">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-gold">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor" />
              </svg>
              <p className="mt-3 font-serif text-lg font-bold text-navy">Consejo enviado</p>
              <p className="mt-1 text-sm text-slate/70">Puedes enviar otro consejo si lo deseas</p>
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-xl border border-rose-soft bg-warm-white p-6 shadow-sm">
              <p className="mb-1 text-center text-xs font-medium uppercase tracking-[0.15em] text-gold/60">Buzón de Consejos</p>
              <p className="mb-4 text-center text-[11px] italic text-slate/50">Solo la misionera podrá leer tu consejo</p>
              <div className="mb-4">
                <label htmlFor="adviceName" className="mb-1 block text-sm font-medium text-navy">
                  Tu nombre
                </label>
                <input
                  id="adviceName"
                  type="text"
                  value={adviceGuestName}
                  onChange={(e) => {
                    dispatch(setAdviceGuestName(e.target.value));
                    if (e.target.value.trim()) setAdviceErrors((prev) => ({ ...prev, guestName: false }));
                  }}
                  placeholder="Escribe tu nombre..."
                  className={`w-full rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${adviceErrors.guestName ? 'border-red-400' : 'border-rose-soft'}`}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="adviceText" className="mb-1 block text-sm font-medium text-navy">
                  Tu consejo o mensaje
                </label>
                <textarea
                  id="adviceText"
                  value={adviceText}
                  onChange={(e) => {
                    dispatch(setAdviceText(e.target.value));
                    if (e.target.value.trim()) setAdviceErrors((prev) => ({ ...prev, advice: false }));
                  }}
                  placeholder="Escribe tu consejo para la misionera..."
                  rows={4}
                  className={`w-full resize-none rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${adviceErrors.advice ? 'border-red-400' : 'border-rose-soft'}`}
                />
              </div>
              <button
                onClick={handleAdviceSubmit}
                disabled={adviceSubmitting}
                className="w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
              >
                {adviceSubmitting ? 'Enviando...' : 'Enviar Consejo'}
              </button>
              {adviceRejection && (
                <p className="mt-3 text-center text-sm text-red-500">{adviceRejection}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Prediction Modal */}
      {quickPrediction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQuickPrediction(null)}
        >
          <div
            className="relative mx-4 w-full max-w-sm animate-fade-in rounded-2xl border border-gold/20 bg-warm-white p-6 shadow-2xl tablet:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickPrediction(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate/40 transition-colors hover:bg-blush/20 hover:text-gold"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <p className="mb-1 text-xs uppercase tracking-widest text-gold/60">Predicción</p>
            <h3 className="mb-5 font-serif text-lg font-semibold text-navy">¿A dónde será enviada?</h3>

            {/* Name input */}
            <div className="mb-4">
              <label htmlFor="quickName" className="mb-1 block text-sm font-medium text-navy">
                Tu nombre
              </label>
              <input
                id="quickName"
                type="text"
                value={quickName}
                onChange={(e) => {
                  setQuickName(e.target.value);
                  if (e.target.value.trim()) setQuickNameError(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickSubmit(); }}
                placeholder="Escribe tu nombre..."
                autoFocus
                className={`w-full rounded-lg border bg-cream px-4 py-3 text-navy outline-none transition-colors placeholder:text-slate/40 focus:border-gold ${quickNameError ? 'border-red-400' : 'border-rose-soft'}`}
              />
              {quickNameError && (
                <p className="mt-1 text-xs text-red-400">Ingresa tu nombre</p>
              )}
            </div>

            {/* Editable location */}
            <div className="mb-5">
              <LocationSelector
                countries={countries}
                states={quickStates}
                cities={quickCities}
                selectedCountryCode={quickPrediction.countryCode}
                selectedStateCode={quickPrediction.stateCode}
                selectedCity={quickPrediction.city}
                onCountryChange={(code) => {
                  const name = getCountryName(code);
                  setQuickPrediction((prev) => prev ? { ...prev, countryCode: code, country: name, stateCode: '', state: '', city: '' } : null);
                  if (code) setQuickLocationErrors((prev) => ({ ...prev, country: false }));
                }}
                onStateChange={(code) => {
                  const name = getStateName(code, quickPrediction.countryCode);
                  setQuickPrediction((prev) => prev ? { ...prev, stateCode: code, state: name, city: '' } : null);
                  if (code) setQuickLocationErrors((prev) => ({ ...prev, state: false }));
                }}
                onCityChange={(name) => {
                  setQuickPrediction((prev) => prev ? { ...prev, city: name } : null);
                  if (name) setQuickLocationErrors((prev) => ({ ...prev, city: false }));
                }}
                errors={quickLocationErrors}
              />
            </div>

            <button
              onClick={handleQuickSubmit}
              disabled={quickSubmitting}
              className="w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {quickSubmitting ? 'Guardando...' : 'Guardar Predicción'}
            </button>
          </div>
        </div>
      )}

      {/* Hints Chat Modal */}
      {showChat && (
        <HintsChatModal
          messages={messages}
          hintCount={hintCount}
          isLoading={isLoading}
          isDone={phase === 'done'}
          onSendMessage={sendMessage}
          onReveal={handleShowLetter}
          onReset={handleResetChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Revelation Letter Modal */}
      {showModal && canOpenEnvelope && data && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 tablet:p-8"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            style={{ animation: 'revealFadeIn 0.3s ease-out forwards' }}
          />

          {/* Letter page */}
          <div
            className="relative z-10 mx-auto max-h-[92vh] w-full max-w-2xl overflow-hidden"
            style={{
              background: coverOpened ? '#fff' : 'transparent',
              boxShadow: coverOpened ? '0 25px 80px rgba(59, 33, 64, 0.35)' : 'none',
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate/30 transition-colors hover:bg-navy/5 hover:text-navy"
              style={{ opacity: coverOpened ? 1 : 0, pointerEvents: coverOpened ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <LetterCover key={coverKey} onReveal={() => setCoverOpened(true)}>
            {/* Scrollable letter content — hidden scrollbar */}
            <div className="hide-scrollbar max-h-[88vh] overflow-y-auto bg-white px-4 pb-8 pt-8 tablet:max-h-[92vh] tablet:px-16 tablet:pb-16 tablet:pt-12">
              {/* Letterhead */}
              <div className="mb-8 text-center">
                <p
                  className="text-xs tracking-[0.05em] text-navy/80 tablet:text-base tablet:tracking-[0.08em]"
                  style={{ fontFamily: "'Cormorant SC', serif", fontWeight: 600, fontSize: 'clamp(11px, 2.5vw, 17px)' }}
                >
                  La Iglesia de Jesucristo de los Santos de los Últimos Días
                </p>
                <p
                  className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-navy/50 tablet:text-[11px] tablet:tracking-[0.15em]"
                  style={{ fontFamily: "'Cormorant SC', serif" }}
                >
                  oficina de la primera presidencia
                </p>
                <p className="mt-0.5 text-[8px] tracking-[0.05em] text-navy/35 tablet:text-[10px] tablet:tracking-[0.08em]">
                  47 East South Temple Street, Salt Lake City, Utah 84150-1200
                </p>
                <div className="mx-auto mt-3 h-px w-full bg-navy/10" />
              </div>

              {/* Letter body — render pdfText grouped into paragraphs */}
              <div
                className="text-[12px] leading-[1.7] text-navy/85 tablet:text-[14.5px] tablet:leading-[1.8]"
                style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", textAlign: 'justify' }}
              >
                {(() => {
                  // Use hardcoded template with dynamic field substitution
                  const text = CALL_LETTER_TEMPLATE
                    .replace(/\{\{MISSIONARY_NAME\}\}/g, data.missionaryName || '')
                    .replace(/\{\{MISSION_NAME\}\}/g, data.missionName || '')
                    .replace(/\{\{LANGUAGE\}\}/g, data.language || '')
                    .replace(/\{\{ENTRY_DATE\}\}/g, data.entryDate || '');

                  return text
                    .split(/\n\s*\n/)
                    .map((block) => block.trim())
                    .filter(Boolean)
                    .map((block, i) => {
                      // "Atentamente," — signature block with signed image
                      if (block.startsWith('Atentamente')) {
                        return (
                          <div key={i} className="mt-8 text-center" style={{ textAlign: 'center' }}>
                            <p>{block}</p>
                            {signatureUrl && (
                              <img
                                src={signatureUrl}
                                alt="Firma"
                                className="mx-auto my-2 h-8 w-auto tablet:h-10"
                              />
                            )}
                            <p>Presidente</p>
                          </div>
                        );
                      }

                      // Skip standalone "Presidente" since it's now in the Atentamente block
                      if (block === 'Presidente') {
                        return null;
                      }

                      // Date line — underlined
                      if (/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}$/.test(block.split('\n')[0].trim())) {
                        return (
                          <p key={i} className="mb-6">
                            <span className="border-b border-navy/20 pb-0.5">
                              {block.split('\n')[0].trim()}
                            </span>
                          </p>
                        );
                      }

                      // Address block — multi-line, left aligned, no justify
                      if (
                        (block.startsWith('Hermana ') || block.startsWith('Elder ') || block.startsWith('Élder ')) &&
                        block.split('\n').length >= 2
                      ) {
                        return (
                          <div key={i} className="mb-6" style={{ textAlign: 'left' }}>
                            {block.split('\n').map((line, j) => (
                              <p key={j}>{line.trim()}</p>
                            ))}
                          </div>
                        );
                      }

                      // Salutation — "Estimada hermana..." — left, no justify
                      if (block.startsWith('Estimad')) {
                        return (
                          <p key={i} className="mb-4" style={{ textAlign: 'left' }}>
                            {block.replace(/\n/g, ' ')}
                          </p>
                        );
                      }

                      // --- Render helpers ---
                      const lockIcon = (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(191,155,48,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block shrink-0" style={{ verticalAlign: 'middle' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      );

                      const makeBadge = (handler: (e: React.MouseEvent) => void, withLabel = true) => (
                        <span
                          className="relative inline-flex cursor-pointer select-none items-center gap-1 rounded-md px-2 py-0.5 align-baseline transition-all hover:opacity-80"
                          style={{
                            background: 'rgba(191,155,48,0.12)',
                            border: '1px dashed rgba(191,155,48,0.4)',
                          }}
                          onClick={handler}
                        >
                          {lockIcon}
                          {withLabel && (
                            <span className="text-xs" style={{ color: 'rgba(191,155,48,0.8)', fontFamily: "'Poppins', sans-serif" }}>
                              toca para revelar
                            </span>
                          )}
                        </span>
                      );

                      const revealedText = (text: string) => (
                        <span className="inline-block font-bold" style={{ color: '#BF9B30' }}>
                          {text}
                        </span>
                      );

                      // --- Paragraph with censored fields (mission, language, date) ---
                      const flatBlock = block.replace(/\n/g, ' ');
                      const hasMission = /(Misión\s+[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(\s+y\s+se preparará)/.test(flatBlock);
                      const hasLang = /idioma\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]+/i.test(flatBlock);
                      const hasDate = /el\s+(?:(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+)?\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i.test(flatBlock);

                      if (hasMission || hasLang || hasDate) {
                        // Split the text into segments, replacing censored parts with markers
                        const censorDefs: { pattern: RegExp; revealed: boolean; handler: (e: React.MouseEvent) => void; group: number; withLabel: boolean }[] = [
                          { pattern: /(Misión\s+[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(\s+y\s+se preparará)/, revealed: missionRevealed, handler: handleRevealMission, group: 1, withLabel: true },
                          { pattern: /(idioma\s+[a-záéíóúñA-ZÁÉÍÓÚÑ]+)/i, revealed: langRevealed, handler: handleRevealLang, group: 1, withLabel: false },
                          { pattern: /(el\s+(?:(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+)?\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i, revealed: dateRevealed, handler: handleRevealDate, group: 1, withLabel: false },
                        ];

                        // Build React nodes by progressively splitting text
                        let remaining = flatBlock;
                        const nodes: React.ReactNode[] = [];
                        let nodeKey = 0;

                        while (remaining.length > 0) {
                          // Find the earliest match among all censor patterns
                          let earliest: { index: number; match: RegExpMatchArray; def: typeof censorDefs[0] } | null = null;

                          for (const def of censorDefs) {
                            const m = remaining.match(def.pattern);
                            if (m && m.index !== undefined) {
                              if (!earliest || m.index < earliest.index) {
                                earliest = { index: m.index, match: m, def };
                              }
                            }
                          }

                          if (!earliest) {
                            nodes.push(<span key={nodeKey++}>{remaining}</span>);
                            break;
                          }

                          // Text before match
                          const before = remaining.slice(0, earliest.index);
                          if (before) {
                            nodes.push(<span key={nodeKey++}>{before}</span>);
                          }

                          // The censored/revealed part
                          const matchedText = earliest.match[earliest.def.group];
                          if (!earliest.def.revealed) {
                            nodes.push(<span key={nodeKey++}>{makeBadge(earliest.def.handler, earliest.def.withLabel)}</span>);
                          } else {
                            nodes.push(<span key={nodeKey++}>{revealedText(matchedText)}</span>);
                          }

                          // For mission pattern, we need to keep the trailing group ("y se preparará")
                          const fullMatchLen = earliest.match[0].length;
                          const trailingText = earliest.match[0].slice(matchedText.length);
                          if (trailingText) {
                            nodes.push(<span key={nodeKey++}>{trailingText}</span>);
                          }

                          remaining = remaining.slice(earliest.index + fullMatchLen);
                        }

                        return (
                          <p key={i} className="mb-4">
                            {nodes}
                          </p>
                        );
                      }

                      // Regular paragraph
                      return (
                        <p key={i} className="mb-4">
                          {block.replace(/\n/g, ' ')}
                        </p>
                      );
                    });
                })()}
              </div>

              {/* Continuar button — appears after all fields revealed */}
              {allFieldsRevealed && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleContinuar}
                    disabled={loadingDestination}
                    className="rounded-full bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loadingDestination ? 'Cargando...' : 'Continuar'}
                  </button>
                </div>
              )}
            </div>
            </LetterCover>
          </div>
        </div>
      )}
      {/* QR Modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative mx-4 w-full max-w-xs animate-fade-in rounded-2xl border border-gold/20 bg-warm-white p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate/40 transition-colors hover:bg-blush/20 hover:text-gold"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <p className="mb-1 text-xs uppercase tracking-widest text-gold/60">Escanea y comparte</p>
            <h3 className="mb-6 font-serif text-lg font-semibold text-navy">Código QR</h3>
            <div className="mx-auto inline-block rounded-xl border border-rose-soft bg-cream p-4">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="H"
                fgColor="#3B2140"
                bgColor="#FEF6F9"
              />
            </div>
            <p className="mt-5 text-xs text-slate">{shareUrl}</p>
          </div>
        </div>
      )}
      {/* Google Maps — event location */}
      {!isFreeForAll && eventSettings?.locationUrl && (() => {
        const url = eventSettings.locationUrl;
        let embedSrc = '';
        if (url.includes('/embed')) {
          embedSrc = url;
        } else {
          const query = eventSettings.locationAddress || url;
          embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
        return (
          <div className="relative left-1/2 z-10 mt-8 w-screen -translate-x-1/2">
            <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gold/70">
              Ubicación del evento
            </p>
            <div className="overflow-hidden">
              <iframe
                key={embedSrc}
                src={embedSrc}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del evento"
              />
            </div>
          </div>
        );
      })()}
    </PageContainer>
  );
}

export default Home;
