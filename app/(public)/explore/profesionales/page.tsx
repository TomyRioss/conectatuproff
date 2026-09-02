import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { ProfCard, type ProfCardData } from "@/components/home/ProfCard";
import { NearbyProfessionals } from "@/components/explore/NearbyProfessionals";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#1EC97E", "#6C5CE7", "#1A1A2E"];

export default async function ExploreProfesionalesPage() {
  const pros = await prisma.professional.findMany({
    where: { isActive: true, user: { isActive: true, username: { not: null } } },
    orderBy: { rating: "desc" },
    include: {
      user: { select: { username: true, image: true } },
      _count: { select: { reviews: true } },
      services: { where: { status: "ACTIVE" }, select: { price: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });

  const data: ProfCardData[] = pros.map((pro, i) => ({
    slug: pro.user.username as string,
    name: `${pro.firstName} ${pro.lastName}`,
    specialty: pro.specialty ?? "",
    zone: pro.location ?? "",
    rating: pro.rating,
    reviews: pro._count.reviews,
    priceFrom: pro.services[0] ? Number(pro.services[0].price) : null,
    premium: false,
    verified: pro.isVerified,
    initials: `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase(),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    avatarSrc: pro.avatarUrl ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}` : pro.user.image,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-brand-dark">
            Profesionales
          </h1>
        </div>

        <NearbyProfessionals />

        <section className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-brand-dark mb-6">
            Todos los profesionales
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {data.map((pro) => (
              <div key={pro.slug} className="flex-none w-[calc(25%-18px)] min-w-[260px] snap-start">
                <ProfCard pro={pro} />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
