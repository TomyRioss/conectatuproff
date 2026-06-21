import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/home/HeroSection"
import CategoriesSection from "@/components/home/CategoriesSection"
import ProfessionalsSection from "@/components/home/ProfessionalsSection"
import HowItWorks from "@/components/home/HowItWorks"
import CTABanner from "@/components/home/CTABanner"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const subcategories = await prisma.subcategory.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <>
      <Navbar />
      <main>
        <HeroSection subcategories={subcategories} />
        <CategoriesSection />
        <ProfessionalsSection />
        <HowItWorks />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
