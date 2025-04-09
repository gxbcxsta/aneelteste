import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Download, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Sucesso() {
  const [protocolo, setProtocolo] = useState("");
  const [dataEstimada, setDataEstimada] = useState("");
  const [nome, setNome] = useState("");

  useEffect(() => {
    // Gerar protocolo aleatório
    const gerarProtocolo = () => {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numeros = "0123456789";
      let resultado = "";
      
      // Formato: 2 letras + 6 números + 2 letras
      for (let i = 0; i < 2; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      for (let i = 0; i < 6; i++) {
        resultado += numeros.charAt(Math.floor(Math.random() * numeros.length));
      }
      
      for (let i = 0; i < 2; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      return resultado;
    };

    // Gerar data estimada (30 dias a partir de hoje)
    const gerarDataEstimada = () => {
      const hoje = new Date();
      const dataFutura = new Date(hoje);
      dataFutura.setDate(hoje.getDate() + 30);
      
      return dataFutura.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    // Obter nome da URL ou definir padrão
    const obterNome = () => {
      const params = new URLSearchParams(window.location.search);
      let nomeCompleto = params.get("nome") || "Cliente";
      
      // Retorna apenas o primeiro nome
      return nomeCompleto.split(" ")[0];
    };

    setProtocolo(gerarProtocolo());
    setDataEstimada(gerarDataEstimada());
    setNome(obterNome());
  }, []);

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
          Solicitação Concluída com Sucesso!
        </h1>
        <p className="text-[var(--gov-gray-dark)] max-w-md">
          {nome}, sua solicitação de restituição foi registrada e está em processamento.
        </p>
      </div>

      <Card className="border-green-200 shadow-md mb-8">
        <CardHeader className="bg-green-50 border-b border-green-200">
          <CardTitle className="text-green-800">Dados da Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-sm text-[var(--gov-gray-dark)]">Número do Protocolo:</span>
            <span className="font-semibold text-[var(--gov-blue-dark)]">{protocolo}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-sm text-[var(--gov-gray-dark)]">Status:</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              Em processamento
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-sm text-[var(--gov-gray-dark)]">Data da Solicitação:</span>
            <span className="text-[var(--gov-gray-dark)]">
              {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--gov-gray-dark)]">Previsão de Pagamento:</span>
            <span className="text-[var(--gov-gray-dark)]">Até {dataEstimada}</span>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Salvar Comprovante
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Acompanhar Solicitação
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="space-y-4 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="font-semibold text-blue-800">O que acontece agora?</h2>
        <ol className="list-decimal pl-5 text-blue-700 space-y-2">
          <li>
            Nossa equipe irá analisar sua solicitação de restituição
          </li>
          <li>
            Um e-mail de confirmação foi enviado com todos os detalhes
          </li>
          <li>
            O pagamento será realizado em até 30 dias úteis via PIX
          </li>
          <li>
            Você receberá notificações sobre o status do processo
          </li>
        </ol>
      </div>

      <div className="mt-8 text-center">
        <Link href="/">
          <Button className="bg-[var(--gov-blue)]">
            <Home className="mr-2 h-4 w-4" />
            Voltar para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
}