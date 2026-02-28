interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-cream px-4 py-8 tablet:px-10 tablet:py-14 desktop:px-16 ${className}`}
    >
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
}

export default PageContainer;
