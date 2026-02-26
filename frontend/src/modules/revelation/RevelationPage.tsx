import PageContainer from '@/shared/components/PageContainer';
import DecorativeDivider from '@/shared/components/DecorativeDivider';
import BlurredField from './components/BlurredField';

function RevelationPage() {
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-gold">
            El Llamamiento
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy tablet:text-4xl">
            Carta Misional
          </h1>
        </div>

        <DecorativeDivider className="my-6" />

        {/* Letter card */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-soft bg-white p-6 shadow-sm tablet:p-10">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate/60">
              La Iglesia de Jesucristo de los Santos de los Últimos Días
            </p>
            <p className="mt-1 text-xs text-slate/40">
              Oficina Misional del Área
            </p>
          </div>

          <div className="h-px bg-rose-soft" />

          {/* Letter body */}
          <div className="mt-6 space-y-4 text-slate">
            <p className="text-lg text-navy">
              Querida <span className="font-semibold">Hermana Nombre Apellido</span>,
            </p>

            <p className="leading-relaxed">
              Usted ha sido llamada a servir como misionera de La Iglesia de Jesucristo
              de los Santos de los Últimos Días. Se le asigna para trabajar en la
            </p>

            <div className="rounded-xl bg-cream py-4 text-center">
              <p className="text-sm uppercase tracking-wider text-slate/60">Misión</p>
              <p className="mt-1 text-2xl font-bold text-navy tablet:text-3xl">
                <BlurredField text="Misión Ciudad País" />
              </p>
            </div>

            <p className="leading-relaxed">
              hablando el idioma{' '}
              <span className="font-semibold">
                <BlurredField text="Idioma" />
              </span>
              .
            </p>

            <p className="leading-relaxed">
              Se espera que se presente en el Centro de Capacitación Misional de{' '}
              <BlurredField text="Ciudad CCM" /> el día
            </p>

            <div className="rounded-xl bg-cream py-4 text-center">
              <p className="text-sm uppercase tracking-wider text-slate/60">
                Fecha de Entrada al CCM
              </p>
              <p className="mt-1 text-xl font-bold text-navy">
                <BlurredField text="DD de Mes de AAAA" />
              </p>
            </div>

            <p className="leading-relaxed">
              Le animamos a que se prepare espiritual, física e intelectualmente
              para este sagrado servicio. Estamos seguros de que será una gran bendición
              para las personas a las que sirva.
            </p>

            <div className="mt-8 text-right">
              <p className="text-sm text-slate/60">Con amor,</p>
              <p className="mt-1 font-medium text-navy">
                La Primera Presidencia
              </p>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <p className="mt-6 text-center text-sm text-slate/50">
          La información borrosa será revelada durante el evento.
        </p>
      </div>
    </PageContainer>
  );
}

export default RevelationPage;
