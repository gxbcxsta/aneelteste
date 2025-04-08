import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroBg from "../assets/hero-bg.png";

export default function HeroSection() {
  return (
    <section 
      className="text-white py-12 md:py-16 bg-cover bg-center relative" 
      id="simular"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[var(--gov-blue-dark)] opacity-85"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight mb-4">
            Já pensou em receber de volta tudo que pagou a mais na conta de luz? Agora é possível.
          </h1>
          <p className="text-lg md:text-xl mb-6 leading-relaxed">
            O STF confirmou: milhões de brasileiros pagaram ICMS indevido na fatura de energia.
            Você pode recuperar até 5 anos de valores pagos a mais.
          </p>
          <p className="text-xl md:text-2xl font-semibold mb-8">
            Descubra em segundos se tem dinheiro a receber!
          </p>
          <div className="flex justify-start">
            <Link href="/verificar">
              <button
                className="flex items-center justify-center gap-2 whitespace-nowrap 
                        ring-offset-background focus-visible:outline-none focus-visible:ring-2 
                        focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none 
                        disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 
                        h-10 bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 
                        text-[var(--gov-blue-dark)] px-8 py-7 rounded-md text-lg md:text-xl 
                        font-bold shadow-lg transition-all text-center">
                🔎 Verificar meu direito à restituição
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
