import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PortfolioGalleryGrid } from "@/components/profesionales/PortfolioGalleryGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default async function PortfolioGalleryPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const username = handle.replace(/^@/, "");
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      image: true,
      professional: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          specialty: true,
          portfolio: {
            orderBy: { order: "asc" },
            include: { images: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!user?.professional) notFound();
  const pro = user.professional;
  const isOwner = session?.user?.id === pro.userId;
  const fullName = `${pro.firstName} ${pro.lastName}`;
  const initials = `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase();
  const avatarSrc = pro.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`
    : (user.image?.startsWith("http") ? user.image : null);

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-6 sm:mb-10">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-4 sm:gap-5 min-w-0">
            <Avatar className="h-24 w-24 sm:h-20 sm:w-20 shrink-0">
              {avatarSrc && (
                <AvatarImage src={avatarSrc} alt={fullName} />
              )}
              <AvatarFallback className="bg-brand-violet text-white text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-dark truncate">{fullName}</h1>
              {pro.specialty && <p className="text-sm sm:text-base text-brand-gray mt-1 truncate">{pro.specialty}</p>}
            </div>
          </div>
          <Button
            disabled={isOwner}
            className="bg-brand-green text-white hover:opacity-90 disabled:opacity-50 text-base px-6 min-h-[48px] sm:py-6 w-full sm:w-auto"
          >
            Ponte en contacto
          </Button>
        </div>

        <hr className="border-gray-200 mb-8" />

        {isOwner && (
          <div className="flex sm:justify-end mb-6 sm:mb-8">
            <Link
              href={`/${handle}/portfolio/new`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-green text-white px-5 py-3 min-h-[48px] sm:min-h-0 text-base font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={18} /> Agregar proyecto
            </Link>
          </div>
        )}

        {pro.portfolio.length === 0 ? (
          <p className="text-sm text-brand-gray">Todavía no hay proyectos en este portfolio.</p>
        ) : (
          <PortfolioGalleryGrid
            items={pro.portfolio}
            handle={handle}
            isOwner={isOwner}
            proName={fullName}
            proAvatarSrc={pro.avatarUrl ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}` : null}
          />
        )}
      </div>
    </main>
  );
}
