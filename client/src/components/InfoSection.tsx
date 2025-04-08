import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function InfoSection() {
  return (
    <section className="py-12 md:py-16" id="processo">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)] mb-8 text-center">
            O que você precisa saber sobre a restituição do ICMS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-[var(--gov-blue)]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[var(--gov-blue-dark)] mb-3">Decisão do STF</h3>
                <p className="text-[var(--gov-gray-dark)]">
                  O Supremo Tribunal Federal decidiu que é inconstitucional a cobrança de ICMS sobre tarifas de transmissão e distribuição de energia elétrica, beneficiando todos os consumidores brasileiros.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-[var(--gov-blue)]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[var(--gov-blue-dark)] mb-3">Período de Restituição</h3>
                <p className="text-[var(--gov-gray-dark)]">
                  Você tem direito a solicitar a restituição dos valores pagos indevidamente nos últimos 5 anos, conforme estabelecido pela legislação tributária brasileira.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-[var(--gov-yellow)]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[var(--gov-blue-dark)] mb-3">Quem tem direito?</h3>
                <p className="text-[var(--gov-gray-dark)]">
                  Todos os consumidores de energia elétrica, sejam pessoas físicas ou jurídicas, que pagaram contas de luz nos últimos 5 anos podem ter direito à restituição.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-[var(--gov-yellow)]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[var(--gov-blue-dark)] mb-3">Como solicitar?</h3>
                <p className="text-[var(--gov-gray-dark)]">
                  Use nossa ferramenta de simulação para calcular seu valor e receba orientações passo a passo sobre como iniciar seu processo de restituição de forma segura.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="#simular">
              <Button 
                className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)] text-white px-8 py-4 rounded-md text-lg font-bold transition-all"
              >
                Verificar meu direito à restituição
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
