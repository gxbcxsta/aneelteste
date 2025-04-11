import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SimuladorRestituicao from "@/components/SimuladorRestituicao";

export default function Calculo() {
  const [location, navigate] = useLocation();
  // Extrair parâmetros de consulta da URL atual
  const query = new URLSearchParams(window.location.search);
  
  // Dados do usuário da URL
  const cpf = query.get("cpf") || "";
  const nome = query.get("nome") || "";
  const estado = query.get("estado") || "Minas Gerais";
  const companhia = query.get("companhia") || "CEMIG Distribuição";
  const dataNascimento = query.get("nasc") || "";
  
  // Verificar se temos dados necessários
  useEffect(() => {
    if (!cpf || !nome) {
      navigate("/verificar");
    }
  }, [cpf, nome, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg overflow-hidden">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-8">
                <CardTitle className="text-2xl font-bold">Cálculo da Restituição</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Complete as informações para calcular o valor da sua restituição
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <SimuladorRestituicao 
                  cpf={cpf}
                  nome={nome}
                  companhia={companhia}
                  estado={estado}
                  dataNascimento={dataNascimento}
                  onSimulacaoConcluida={(valor, meses) => {
                    // Não redirecionar para outra página, o componente lidará com a exibição do resultado
                    console.log("Cálculo concluído: valor", valor, "meses", meses);
                    // O fluxo permance na página atual
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}