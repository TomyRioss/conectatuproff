import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ServiceDetailContent } from "@/components/profesionales/ServiceDetailContent";
import { ServiceProfessionalHeader } from "@/components/profesionales/ServiceProfessionalHeader";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ handle: string; serviceId: string }>;
}) {
  const { handle, serviceId } = await params;
  const username = handle.replace(/^@/, "");

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      professional: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          specialty: true,
          location: true,
          isPro: true,
          user: { select: { username: true, image: true } },
        },
      },
    },
  });

  if (!service || service.professional.user.username !== username) notFound();

  const otherServices = await prisma.service.findMany({
    where: { professionalId: service.professionalId, OR: [{ status: "ACTIVE" }, { id: service.id }] },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  });

  const pro = service.professional;
  const price = service.price ? Number(service.price.toString()) : 0;
  const coverImage = service.gallery.find((image) => image.imageUrl === service.imageUrl);
  const serviceImages = [
    ...(service.imageUrl ? [{ key: service.imageUrl, description: coverImage?.description ?? "" }] : []),
    ...service.gallery
      .filter((image) => image.imageUrl !== service.imageUrl)
      .map((image) => ({ key: image.imageUrl, description: image.description ?? "" })),
  ];

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <ServiceProfessionalHeader professional={pro} />

        <ServiceDetailContent
          serviceId={service.id}
          handle={handle}
          title={service.title}
          description={service.description}
          price={price}
          currency={service.currency}
          durationMin={service.durationMin}
          serviceType={service.serviceType}
          videoUrl={service.videoUrl}
          images={serviceImages}
          faqs={service.faqs}
          services={otherServices}
        />
      </div>
    </main>
  );
}
