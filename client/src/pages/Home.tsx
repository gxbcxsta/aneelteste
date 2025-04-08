import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Impostometro from "@/components/Impostometro";
import InfoSection from "@/components/InfoSection";
import FaqSection from "@/components/FaqSection";
import ContatoSection from "@/components/ContatoSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <Impostometro />
        <InfoSection />
        <FaqSection />
        <ContatoSection />
      </main>
      <Footer />
    </div>
  );
}
