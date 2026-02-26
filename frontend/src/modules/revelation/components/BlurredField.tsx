interface BlurredFieldProps {
  text: string;
  isRevealed?: boolean;
  className?: string;
}

function BlurredField({ text, isRevealed = false, className = '' }: BlurredFieldProps) {
  return (
    <span
      className={`inline-block transition-all duration-1000 ${
        isRevealed ? 'blur-0' : 'animate-blur-pulse select-none blur-[8px]'
      } ${className}`}
    >
      {text}
    </span>
  );
}

export default BlurredField;
