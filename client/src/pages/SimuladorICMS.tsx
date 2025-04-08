import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimuladorICMS from "@/components/SimuladorICMS";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PaginaSimuladorICMS() {
  const [, navigate] = useLocation();
  const [simulacaoConcluida, setSimulacaoConcluida] = useState(false);
  const [valorRestituicao, setValorRestituicao] = useState(0);
  const [mesesAvaliados, setMesesAvaliados] = useState(0);
  
  const handleSimulacaoConcluida = (valor: number, meses: number) => {
    setValorRestituicao(valor);
    setMesesAvaliados(meses);
    setSimulacaoConcluida(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="mb-6 border-[var(--gov-blue)] text-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)]/10"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar para a página inicial
            </Button>
            
            <Card className="shadow-lg overflow-hidden">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-8">
                <CardTitle className="text-2xl font-bold">Simulador de Restituição de ICMS</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Calcule o valor que você tem direito a receber de volta
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <SimuladorICMS onSimulacaoConcluida={handleSimulacaoConcluida} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}