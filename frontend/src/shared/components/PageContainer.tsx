interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`min-h-screen bg-cream px-4 py-8 tablet:px-8 tablet:py-12 desktop:px-16 ${className}`}
    >
      <div className="mx-auto max-w-4xl">{children}</div>
    </div>
  );
}

export default PageContainer;
