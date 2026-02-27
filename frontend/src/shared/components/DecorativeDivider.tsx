interface DecorativeDividerProps {
  className?: string;
}

function DecorativeDivider({ className = '' }: DecorativeDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      <div className="h-px w-12 bg-gold/40" />
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="text-gold"
      >
        <path
          d="M8 0L9.79 6.21L16 8L9.79 9.79L8 16L6.21 9.79L0 8L6.21 6.21L8 0Z"
          fill="currentColor"
        />
      </svg>
      <div className="h-px w-12  bg-gold/40" />
    </div>
  );
}

export default DecorativeDivider;
