import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="bg-[var(--gov-blue-light)] text-white py-12 md:py-16" id="simular">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Já pensou em receber de volta tudo que pagou a mais na conta de luz? Agora é possível.
          </h1>
          <p className="text-lg md:text-xl mb-6 leading-relaxed">
            O STF confirmou: milhões de brasileiros pagaram ICMS indevido na fatura de energia.
            Você pode recuperar até 5 anos de valores pagos a mais.
          </p>
          <p className="text-xl md:text-2xl font-semibold mb-8">
            Descubra em segundos se tem dinheiro a receber!
          </p>
          <Link href="/verificar">
            <Button 
              className="inline-block bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] px-8 py-7 rounded-md text-lg md:text-xl font-bold shadow-lg transition-all"
            >
              🔎 Simular minha restituição
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
