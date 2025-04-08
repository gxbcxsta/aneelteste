import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Impostometro from "@/components/Impostometro";
import InfoSection from "@/components/InfoSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <Impostometro />
        <InfoSection />
      </main>
      <Footer />
    </div>
  );
}
