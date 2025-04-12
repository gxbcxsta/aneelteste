import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SimuladorRestituicao from "@/components/SimuladorRestituicao";
import { useUserData } from "@/contexts/UserContext";

export default function Calculo() {
  const [location, navigate] = useLocation();
  const { userData, updateUserData } = useUserData();
  
  // Obter dados do contexto global
  const cpf = userData.cpf || "";
  const nome = userData.nome || "";
  const estado = userData.estado || "Minas Gerais";
  const companhia = userData.companhia || "CEMIG Distribuição";
  const dataNascimento = userData.dataNascimento || "";
  
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
                    // Atualizar o contexto com o valor da restituição e período
                    updateUserData({
                      valorRestituicao: valor,
                      periodo: meses
                    });
                    
                    console.log("Cálculo concluído e contexto atualizado:", { 
                      valor, 
                      meses, 
                      cpf: cpf ? `***.**.***.${cpf.substring(cpf.length - 2)}` : '',
                      nome: nome ? `${nome.split(' ')[0]} ***` : '',
                      dataNascimento: dataNascimento ? "**/**/****" : '',
                      companhia, 
                      estado 
                    });
                    // O fluxo permanece na página atual
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