interface BlurredFieldProps {
  text: string;
  isRevealed?: boolean;
  className?: string;
}

function BlurredField({ text, isRevealed = false, className = '' }: BlurredFieldProps) {
  if (!isRevealed) {
    return (
      <span className={`inline-block select-none text-slate/20 ${className}`}>
        {'•'.repeat(text.length > 20 ? 20 : text.length)}
      </span>
    );
  }

  return (
    <span className={`inline-block ${className}`}>
      {text}
    </span>
  );
}

export default BlurredField;
