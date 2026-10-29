import Link from "next/link";
import { Clock, Heart } from "lucide-react";
import { FavoriteButton } from "@/components/profesionales/FavoriteButton";
import { ServiceGallery } from "@/components/profesionales/ServiceGallery";
import { ServiceVideo } from "@/components/profesionales/ServiceVideo";
import { formatDuration } from "@/lib/time";

export type ServiceDetailContentProps = {
  serviceId?: string;
  handle?: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  durationMin?: number | null;
  serviceType?: string | null;
  videoUrl?: string | null;
  images: { key: string; description: string }[];
  faqs: { question: string; answer: string }[];
  services: { id: string; title: string; imageUrl: string | null }[];
  preview?: boolean;
};

export function ServiceDetailContent({
  serviceId,
  handle,
  title,
  description,
  price,
  currency,
  durationMin,
  serviceType,
  videoUrl,
  images,
  faqs,
  services,
  preview = false,
}: ServiceDetailContentProps) {
  const unit = serviceType === "CLASE" ? "clase" : "sesión";

  return (
    <div className={`grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-9 ${preview ? "" : "lg:min-h-[calc(100dvh-15rem)]"}`}>
      <aside className="flex min-w-0 flex-col rounded-xl bg-white p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-gray">Servicios</h2>
        <nav aria-label="Servicios de este profesional" className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {services.map((item) => {
            const selected = item.id === serviceId;
            const cardClass = `group w-36 shrink-0 overflow-hidden rounded-xl border bg-white transition-colors lg:w-full ${
              selected ? "border-brand-violet ring-2 ring-brand-violet/15" : "border-gray-200 hover:border-brand-violet/50"
            }`;
            const content = (
              <>
                <div className="h-[84px] overflow-hidden bg-brand-bg">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/avatar?key=${encodeURIComponent(item.imageUrl)}`} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs text-brand-gray">{item.title}</div>
                  )}
                </div>
                <p className="line-clamp-2 px-2.5 py-2 text-xs font-semibold leading-4 text-brand-dark">{item.title}</p>
              </>
            );

            return preview || !handle ? (
              <div key={item.id} aria-current={selected ? "page" : undefined} className={cardClass}>{content}</div>
            ) : (
              <Link key={item.id} href={`/${handle}/servicios/${item.id}`} aria-current={selected ? "page" : undefined} className={cardClass}>
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200 pt-4">
          {preview && (
            <div className="mb-3">
              <p className="text-xl font-bold text-brand-violet">
                {price.toLocaleString("es-AR", { style: "currency", currency })}
              </p>
              <p className="text-xs uppercase text-brand-gray">por {unit}</p>
            </div>
          )}
          {durationMin && (
            <p className="mb-3 flex items-center gap-1 text-xs text-brand-gray">
              <Clock size={13} /> {formatDuration(durationMin)} por {unit}
            </p>
          )}
          <div className="flex items-center gap-2">
            {preview || !handle || !serviceId ? (
              <button type="button" disabled className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-white opacity-100">
                Agendar
              </button>
            ) : (
              <Link href={`/perfil/profesional/${handle}/agendar?service=${serviceId}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                Agendar
              </Link>
            )}
            {preview || !serviceId ? (
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-brand-gray"><Heart size={18} /></span>
            ) : (
              <FavoriteButton type="servicio" id={serviceId} initialFavorited={false} />
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <section className={`order-1 grid items-start gap-6 ${videoUrl ? "md:grid-cols-[minmax(0,1fr)_max-content]" : ""}`}>
          <div className="rounded-xl bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">{title}</h1>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-brand-gray sm:text-base sm:leading-7">
              {description || "Consultá con el profesional para conocer los detalles de este servicio."}
            </p>
          </div>
          {videoUrl && (
            <div className="md:justify-self-end">
              <ServiceVideo videoKey={videoUrl} title={title} />
            </div>
          )}
        </section>

        <section aria-labelledby="service-gallery-heading" className={`order-3 rounded-xl bg-white p-4 sm:p-6 sm:pb-8 ${preview ? "" : "mt-auto"}`}>
          <h2 id="service-gallery-heading" className="mb-3 text-lg font-bold text-brand-dark">Galería</h2>
          {images.length > 0 ? (
            <ServiceGallery images={images} title={title} />
          ) : (
            <p className="py-2 text-sm text-brand-gray">Este servicio todavía no tiene imágenes en su galería.</p>
          )}
        </section>

        {faqs.length > 0 && (
          <section className="order-2 rounded-xl bg-white p-6 sm:p-8">
            <h2 className="mb-3 text-lg font-bold text-brand-dark">Preguntas frecuentes</h2>
            <div className="divide-y divide-gray-100">
              {faqs.map((faq, index) => (
                <details key={`${faq.question}-${index}`} className="group p-4">
                  <summary className="flex w-full cursor-pointer list-none items-center justify-between text-sm font-semibold text-brand-dark [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="text-brand-gray transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
