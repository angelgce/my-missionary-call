interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-cream px-3 py-6 tablet:px-8 tablet:py-12 desktop:px-16 ${className}`}
    >
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
}

export default PageContainer;
