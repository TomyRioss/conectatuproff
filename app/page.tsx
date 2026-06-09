import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/home/HeroSection"
import ProfessionalsSection from "@/components/home/ProfessionalsSection"
import HowItWorks from "@/components/home/HowItWorks"
import CTABanner from "@/components/home/CTABanner"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProfessionalsSection />
        <HowItWorks />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
