import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesteParaiba from '@/components/TesteParaiba';
import { useLocalizacao } from '@/components/LocalizacaoDetector';

export default function TesteParaibaPage() {
  const { localizacao, carregando } = useLocalizacao();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          Teste de Detecção de Estado: Paraíba
        </h1>
        
        <div className="grid gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Detecção de Estado Atual</CardTitle>
              <CardDescription>
                Informações sobre o estado detectado pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <p>Carregando informações de localização...</p>
              ) : localizacao ? (
                <div>
                  <p><strong>IP detectado:</strong> {localizacao.ip}</p>
                  <p><strong>Estado detectado:</strong> {localizacao.estado}</p>
                  <p><strong>Código da região:</strong> {localizacao.detalhes?.regionCode}</p>
                  <p><strong>Timestamp:</strong> {new Date(localizacao.timestamp || 0).toLocaleString()}</p>
                </div>
              ) : (
                <p>Nenhuma localização detectada</p>
              )}
            </CardContent>
          </Card>
          
          <TesteParaiba />
          
          <Card>
            <CardHeader>
              <CardTitle>Informações sobre o Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Este teste simula a detecção de um usuário da Paraíba e mostra as opções de companhias elétricas 
                que seriam apresentadas para ele.
              </p>
              <p className="mb-4">
                <strong>Para usuários da Paraíba, o sistema mostra:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Energisa Paraíba</strong> (opção válida/correta)</li>
                <li>Neoenergia Pernambuco (opção adicional, não válida)</li>
                <li>Equatorial Alagoas (opção adicional, não válida)</li>
              </ul>
              <p>
                O sistema aceita apenas a primeira opção (Energisa Paraíba) como resposta correta para 
                usuários do estado da Paraíba.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}