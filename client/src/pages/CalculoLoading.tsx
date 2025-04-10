import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CalculoLoading() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('Estamos calculando sua restituição...');
  const [progresso, setProgresso] = useState(10);
  
  // Recupera parâmetros da URL
  const searchParams = new URLSearchParams(window.location.search);
  const cpf = searchParams.get('cpf') || '';
  const nome = searchParams.get('nome') || '';
  const companhia = searchParams.get('companhia') || '';
  const estado = searchParams.get('estado') || '';
  const dataNascimento = searchParams.get('nasc') || '';
  const valorMedio = searchParams.get('valor') || '';
  const meses = searchParams.get('meses') || '';
  
  // Sequência de mensagens a serem exibidas
  const messages = [
    'Estamos calculando sua restituição...',
    'Verificando os dados da sua conta de energia...',
    'Analisando o histórico de cobranças...',
    'Calculando os valores de ICMS pagos...',
    'Conferindo os valores de restituição disponíveis...',
    'Finalizando seu cálculo...'
  ];
  
  useEffect(() => {
    let currentIndex = 0;
    let timer: NodeJS.Timeout;
    
    // Função para mostrar mensagens sequencialmente
    const showNextMessage = () => {
      if (currentIndex < messages.length - 1) {
        currentIndex++;
        setMessage(messages[currentIndex]);
        setProgresso((currentIndex + 1) / messages.length * 100);
      } else {
        // Quando terminar as mensagens, redirecionar para o resultado
        clearInterval(timer);
        
        // Criar valor de restituição base (R$ 74,90 em centavos)
        const valorRestituicao = 7490;
        
        // Redirecionar para o resultado com todos os dados necessários
        setTimeout(() => {
          setLocation(`/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorRestituicao)}&valorMedio=${encodeURIComponent(valorMedio)}&meses=${encodeURIComponent(meses)}`);
        }, 1000);
      }
    };
    
    // Exibir a primeira mensagem imediatamente
    setMessage(messages[0]);
    setProgresso(1 / messages.length * 100);
    
    // Configurar o temporizador para trocar as mensagens
    timer = setInterval(showNextMessage, 1500);
    
    // Limpar temporizador ao desmontar
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-[#f0f2f5] py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-md">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-6">
                <CardTitle className="text-2xl font-bold">Cálculo da Restituição</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Estamos processando os dados para calcular sua restituição
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-4 text-[var(--gov-blue-dark)]">
                    Verificando seus dados...
                  </h3>
                  <Progress value={progresso} className="h-2 mb-4" />
                  <p className="text-sm text-[var(--gov-gray-dark)] mb-4">
                    Estamos consultando suas informações para verificar o direito à restituição.
                  </p>
                  <p className="text-sm text-[var(--gov-blue-dark)] font-medium animate-pulse">
                    {message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}