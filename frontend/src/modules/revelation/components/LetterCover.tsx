import { useState } from 'react';

interface LetterCoverProps {
  onReveal: () => void;
  children: React.ReactNode;
}

/* ── Reusable SVG sub-components ────────────────────────────── */

/** Small stylised rose – petals + centre + leaves */
const Rose = ({
  size = 28,
  className = '',
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
  >
    {/* Outer petals */}
    <path d="M20,8 C14,10 10,16 12,22 C14,16 18,12 20,8Z" fill="#D4849B" opacity="0.8" />
    <path d="M20,8 C26,10 30,16 28,22 C26,16 22,12 20,8Z" fill="#BE6B84" opacity="0.7" />
    <path d="M12,22 C10,28 14,34 20,34 C16,30 14,26 12,22Z" fill="#D4849B" opacity="0.75" />
    <path d="M28,22 C30,28 26,34 20,34 C24,30 26,26 28,22Z" fill="#BE6B84" opacity="0.65" />
    {/* Middle petals */}
    <path d="M20,12 C16,15 14,20 16,24 C17,19 19,15 20,12Z" fill="#F0CCD7" opacity="0.9" />
    <path d="M20,12 C24,15 26,20 24,24 C23,19 21,15 20,12Z" fill="#D4849B" opacity="0.85" />
    {/* Centre */}
    <circle cx="20" cy="20" r="3" fill="#BE6B84" />
    <circle cx="20" cy="20" r="1.5" fill="#D4849B" />
    {/* Leaves */}
    <path d="M12,28 Q6,32 8,36 Q12,33 12,28Z" fill="#c9a84c" opacity="0.6" />
    <path d="M28,28 Q34,32 32,36 Q28,33 28,28Z" fill="#c9a84c" opacity="0.6" />
    {/* Small stem accent */}
    <path d="M20,34 Q18,38 16,40" stroke="#c9a84c" strokeWidth="0.8" opacity="0.5" fill="none" />
  </svg>
);

/** Tiny rosebud for vine/border accents */
const Rosebud = ({ cx, cy }: { cx: number; cy: number }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx="2.5" ry="3" fill="#D4849B" opacity="0.7" />
    <ellipse cx={cx} cy={cy - 0.5} rx="1.5" ry="2" fill="#F0CCD7" opacity="0.8" />
    <ellipse cx={cx} cy={cy} rx="0.8" ry="1" fill="#BE6B84" opacity="0.6" />
    {/* Tiny leaf pair */}
    <path d={`M${cx - 2.5},${cy + 2} Q${cx - 5},${cy + 4} ${cx - 3},${cy + 5}`} stroke="#c9a84c" strokeWidth="0.4" fill="none" opacity="0.5" />
    <path d={`M${cx + 2.5},${cy + 2} Q${cx + 5},${cy + 4} ${cx + 3},${cy + 5}`} stroke="#c9a84c" strokeWidth="0.4" fill="none" opacity="0.5" />
  </g>
);

/** Corner ornament with scrollwork and small rose – inspired by Home.tsx */
const CornerOrnament = ({
  flip = '',
  className = '',
}: {
  flip?: string;
  className?: string;
}) => (
  <svg className={className} width="72" height="72" viewBox="0 0 72 72" fill="none">
    <g opacity="0.55" stroke="#c9a84c" fill="#c9a84c" transform={flip}>
      {/* Main corner curl */}
      <path d="M6,6 C6,6 18,5 26,12 C34,19 29,30 22,26 C15,22 20,14 26,12" strokeWidth="0.7" fill="none" />
      <path d="M6,6 C6,6 5,18 12,26 C19,34 30,29 26,22 C22,15 14,20 12,26" strokeWidth="0.7" fill="none" />
      <circle cx="6" cy="6" r="2" />
      {/* Extended scrollwork */}
      <path d="M26,12 C34,8 44,6 56,7 C48,10 40,14 34,20" strokeWidth="0.5" fill="none" />
      <path d="M12,26 C8,34 6,44 7,56 C10,48 14,40 20,34" strokeWidth="0.5" fill="none" />
      {/* Leaf shapes */}
      <path d="M56,7 Q62,4 66,7 Q62,10 56,7" strokeWidth="0.3" />
      <path d="M7,56 Q4,62 7,66 Q10,62 7,56" strokeWidth="0.3" />
      <path d="M40,9 Q44,5 48,8 Q44,11 40,9" strokeWidth="0.3" />
      <path d="M9,40 Q5,44 8,48 Q11,44 9,40" strokeWidth="0.3" />
      {/* Small dots */}
      <circle cx="50" cy="8" r="0.6" />
      <circle cx="8" cy="50" r="0.6" />
      <circle cx="34" cy="10" r="0.5" />
      <circle cx="10" cy="34" r="0.5" />
      {/* Inner spiral */}
      <path d="M18,12 Q22,10 24,15 Q20,17 18,12" strokeWidth="0.35" fill="none" />
      <path d="M12,18 Q10,22 15,24 Q17,20 12,18" strokeWidth="0.35" fill="none" />
      {/* Small rose accent near corner */}
      <circle cx="16" cy="16" r="3.5" fill="#D4849B" opacity="0.35" />
      <circle cx="16" cy="16" r="2" fill="#F0CCD7" opacity="0.45" />
      <circle cx="16" cy="16" r="1" fill="#BE6B84" opacity="0.4" />
    </g>
  </svg>
);

/** Vine border with rosebuds – runs vertically along the center seam */
const CenterVine = () => (
  <svg
    className="absolute left-1/2 top-0 z-[5] h-full -translate-x-1/2"
    width="20"
    height="100%"
    viewBox="0 0 20 200"
    preserveAspectRatio="none"
    fill="none"
  >
    {/* Main vine stem */}
    <path
      d="M10,0 Q6,20 10,40 Q14,60 10,80 Q6,100 10,120 Q14,140 10,160 Q6,180 10,200"
      stroke="#c9a84c"
      strokeWidth="0.6"
      opacity="0.3"
      fill="none"
    />
    {/* Secondary thin vine */}
    <path
      d="M10,10 Q14,25 10,45 Q6,65 10,85 Q14,105 10,125 Q6,145 10,165 Q14,185 10,195"
      stroke="#c9a84c"
      strokeWidth="0.35"
      opacity="0.2"
      fill="none"
    />
    {/* Tiny leaves along vine */}
    <path d="M10,30 Q5,28 4,32 Q7,33 10,30" fill="#c9a84c" opacity="0.25" />
    <path d="M10,30 Q15,28 16,32 Q13,33 10,30" fill="#c9a84c" opacity="0.2" />
    <path d="M10,70 Q5,68 4,72 Q7,73 10,70" fill="#c9a84c" opacity="0.25" />
    <path d="M10,70 Q15,68 16,72 Q13,73 10,70" fill="#c9a84c" opacity="0.2" />
    <path d="M10,110 Q5,108 4,112 Q7,113 10,110" fill="#c9a84c" opacity="0.25" />
    <path d="M10,110 Q15,108 16,112 Q13,113 10,110" fill="#c9a84c" opacity="0.2" />
    <path d="M10,150 Q5,148 4,152 Q7,153 10,150" fill="#c9a84c" opacity="0.25" />
    <path d="M10,150 Q15,148 16,152 Q13,153 10,150" fill="#c9a84c" opacity="0.2" />
    {/* Rosebuds at intervals */}
    <Rosebud cx={10} cy={50} />
    <Rosebud cx={10} cy={100} />
    <Rosebud cx={10} cy={150} />
  </svg>
);


/* ── Main component ─────────────────────────────────────────── */

function LetterCover({ onReveal, children }: LetterCoverProps) {
  // Local state
  const [isOpening, setIsOpening] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  // Event handlers
  const handleClick = () => {
    if (isOpening || isFullyOpen) return;
    setIsOpening(true);

    setTimeout(() => {
      setIsFullyOpen(true);
      onReveal();
    }, 1000);
  };

  // Render helpers
  const textureStyle: React.CSSProperties = {
    backgroundImage: [
      'radial-gradient(circle at 1px 1px, rgba(201,168,76,0.6) 0.4px, transparent 0)',
      'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(201,168,76,0.08) 8px, rgba(201,168,76,0.08) 8.5px)',
      'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(201,168,76,0.06) 8px, rgba(201,168,76,0.06) 8.5px)',
    ].join(', '),
    backgroundSize: '12px 12px, 12px 12px, 12px 12px',
  };

  // Main render
  if (isFullyOpen) {
    return (
      <div className="cover-content-reveal" style={{ opacity: 0 }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex w-[85%] max-w-lg cursor-pointer items-center justify-center"
      style={{ minHeight: '60vh', perspective: '1200px' }}
      onClick={handleClick}
    >
      {/* Center vine border (behind both doors) */}
      <CenterVine />

      {/* Left door */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 overflow-hidden ${
          isOpening ? 'cover-left-open' : ''
        }`}
        style={{
          transformOrigin: 'left center',
          backfaceVisibility: 'hidden',
          borderTopLeftRadius: '1rem',
          borderBottomLeftRadius: '1rem',
          background: 'linear-gradient(135deg, #FFF8FA 0%, #FAE5ED 50%, #F3D4DE 100%)',
          boxShadow: '2px 0 12px rgba(59,33,64,0.08)',
        }}
      >
        {/* Paper / lino texture overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={textureStyle} />

        {/* Corner ornament - top left */}
        <CornerOrnament className="absolute left-1 top-1" />

        {/* Corner ornament - bottom left */}
        <CornerOrnament className="absolute bottom-1 left-1" flip="translate(0,72) scale(1,-1)" />

        {/* Rose - top left corner */}
        <Rose
          size={32}
          className="absolute left-2 top-2 opacity-40"
          style={{ transform: 'rotate(-15deg)' }}
        />

        {/* Rose - bottom left door */}
        <Rose
          size={24}
          className="absolute bottom-3 left-6 opacity-35"
          style={{ transform: 'rotate(20deg)' }}
        />

        {/* Subtle rose accent mid-left */}
        <Rose
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20"
          style={{ transform: 'rotate(-30deg) translateY(-50%)' }}
        />
      </div>

      {/* Right door */}
      <div
        className={`absolute inset-y-0 right-0 w-1/2 overflow-hidden ${
          isOpening ? 'cover-right-open' : ''
        }`}
        style={{
          transformOrigin: 'right center',
          backfaceVisibility: 'hidden',
          borderTopRightRadius: '1rem',
          borderBottomRightRadius: '1rem',
          background: 'linear-gradient(225deg, #FFF8FA 0%, #FAE5ED 50%, #F3D4DE 100%)',
          boxShadow: '-2px 0 12px rgba(59,33,64,0.08)',
        }}
      >
        {/* Paper / lino texture overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={textureStyle} />

        {/* Corner ornament - top right */}
        <CornerOrnament className="absolute right-1 top-1" flip="translate(72,0) scale(-1,1)" />

        {/* Corner ornament - bottom right */}
        <CornerOrnament className="absolute bottom-1 right-1" flip="translate(72,72) scale(-1,-1)" />

        {/* Rose - top right corner */}
        <Rose
          size={32}
          className="absolute right-2 top-2 opacity-40"
          style={{ transform: 'rotate(15deg) scaleX(-1)' }}
        />

        {/* Rose - bottom right door */}
        <Rose
          size={24}
          className="absolute bottom-3 right-6 opacity-35"
          style={{ transform: 'rotate(-20deg) scaleX(-1)' }}
        />

        {/* Subtle rose accent mid-right */}
        <Rose
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20"
          style={{ transform: 'rotate(30deg) scaleX(-1) translateY(-50%)' }}
        />
      </div>

      {/* Center content (visible before opening) */}
      {!isOpening && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-cover-breathe">
          {/* Glow ring behind seal – pink toned */}
          <div
            className="absolute top-0 h-28 w-28 rounded-full tablet:h-32 tablet:w-32"
            style={{
              background:
                'radial-gradient(circle, rgba(212,132,155,0.15) 0%, rgba(201,168,76,0.08) 50%, transparent 70%)',
              animation: 'coverSealGlow 3s ease-in-out infinite',
            }}
          />

{/* Seal / emblem */}
          <div
            className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full tablet:h-24 tablet:w-24"
            style={{
              background: 'rgba(201,168,76,0.06)',
              boxShadow:
                '0 0 0 1px rgba(201,168,76,0.2), 0 0 0 6px rgba(212,132,155,0.08), 0 0 0 10px rgba(201,168,76,0.04), 0 8px 32px rgba(212,132,155,0.12)',
            }}
          >
            <svg
              className="h-9 w-9 text-gold tablet:h-11 tablet:w-11"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <p className="font-serif text-xl font-bold text-navy tablet:text-3xl">
            Tu Llamamiento
          </p>

          <p className="mt-2 text-sm text-slate/50">
            Toca para abrir la carta
          </p>
        </div>
      )}

      <style>{`
        @keyframes coverSealGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LetterCover;
