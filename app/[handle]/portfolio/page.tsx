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

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              {pro.avatarUrl && (
                <AvatarImage src={`/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`} alt={fullName} />
              )}
              <AvatarFallback className="bg-brand-violet text-white text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">{fullName}</h1>
              {pro.specialty && <p className="text-base text-brand-gray mt-1">{pro.specialty}</p>}
            </div>
          </div>
          <Button
            disabled={isOwner}
            className="bg-brand-green text-white hover:opacity-90 disabled:opacity-50 text-base px-6 py-6"
          >
            Ponte en contacto
          </Button>
        </div>

        <hr className="border-gray-200 mb-8" />

        {isOwner && (
          <div className="flex justify-end mb-8">
            <Link
              href={`/${handle}/portfolio/new`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green text-white px-5 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
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
