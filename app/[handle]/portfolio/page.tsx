import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PortfolioGalleryCard } from "@/components/profesionales/PortfolioGalleryCard";
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
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {pro.avatarUrl && (
                <AvatarImage src={`/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`} alt={fullName} />
              )}
              <AvatarFallback className="bg-brand-violet text-white text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold text-brand-dark">{fullName}</h1>
              {pro.specialty && <p className="text-sm text-brand-gray mt-0.5">{pro.specialty}</p>}
            </div>
          </div>
          <Button disabled={isOwner} className="bg-brand-green text-white hover:opacity-90 disabled:opacity-50">
            Ponte en contacto
          </Button>
        </div>

        <hr className="border-gray-200 mb-6" />

        {isOwner && (
          <div className="flex justify-end mb-6">
            <Link
              href={`/${handle}/portfolio/new`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} /> Agregar proyecto
            </Link>
          </div>
        )}

        {pro.portfolio.length === 0 ? (
          <p className="text-sm text-brand-gray">Todavía no hay proyectos en este portfolio.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pro.portfolio.map((item) => (
              <PortfolioGalleryCard key={item.id} item={item} handle={handle} isOwner={isOwner} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
