import { ServiceDetailContent } from "@/components/profesionales/ServiceDetailContent";
import { ServiceProfessionalHeader, type ServiceProfessionalHeaderData } from "@/components/profesionales/ServiceProfessionalHeader";
import type { WizardState } from "./types";

export function StepRevisar({ state, videoUrl, professional, serviceId, otherServices = [] }: {
  state: WizardState;
  videoUrl: string;
  professional?: ServiceProfessionalHeaderData | null;
  serviceId?: string;
  otherServices?: { id: string; title: string; imageUrl: string | null }[];
}) {
  const previewId = serviceId ?? "service-preview";
  const images = state.gallery
    .filter((item) => item.type === "image")
    .map(({ key, description }) => ({ key, description }));
  const currentService = { id: previewId, title: state.title || "Tu servicio", imageUrl: images[0]?.key ?? null };
  const services = otherServices.some((item) => item.id === previewId)
    ? otherServices.map((item) => item.id === previewId ? currentService : item)
    : [...otherServices, currentService];

  return (
    <div className="max-w-7xl">
      <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Revisá y publicá</h2>
      <p className="mt-1 text-sm text-brand-gray">Así lo van a ver tus clientes.</p>

      <div className="mt-6">
        {professional && <ServiceProfessionalHeader professional={professional} />}
        <ServiceDetailContent
          serviceId={previewId}
          title={state.title || "Sin título"}
          description={state.description}
          price={Number(state.price || 0)}
          currency="ARS"
          durationMin={Number(state.durationMin) || null}
          videoUrl={videoUrl || null}
          images={images}
          faqs={state.faqs.filter((faq) => faq.question.trim() && faq.answer.trim())}
          services={services}
          preview
        />
      </div>
    </div>
  );
}
