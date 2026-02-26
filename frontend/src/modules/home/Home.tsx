import { Link } from 'react-router-dom';

import { QRCodeSVG } from 'qrcode.react';

import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';

function Home() {
  const predictUrl = `${window.location.origin}/predict`;

  return (
    <PageContainer className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="animate-fade-in">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-gold">
          La Iglesia de Jesucristo de los Santos de los Últimos Días
        </p>

        <DecorativeDivider />

        <h1 className="font-serif text-5xl font-bold text-navy tablet:text-6xl desktop:text-7xl">
          Llamada a Servir
        </h1>

        <p className="mt-4 text-lg text-slate tablet:text-xl">
          Hermana Nombre Apellido
        </p>

        <DecorativeDivider className="my-6" />

        <p className="mx-auto max-w-md text-sm text-slate/70">
          Escanea el código QR para registrar tu predicción de a dónde será
          enviada a servir.
        </p>

        <div className="mt-6 flex justify-center">
          <div className="rounded-xl border-2 border-gold/20 bg-white p-4">
            <QRCodeSVG
              value={predictUrl}
              size={180}
              bgColor="#FFFFFF"
              fgColor="#3B2140"
              level="M"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate/50">
          o visita: {predictUrl}
        </p>

        <div className="mt-10">
          <Link
            to="/revelation"
            className="inline-block rounded-full bg-gold px-10 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-gold-dark"
          >
            Abrir el Llamamiento
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default Home;
