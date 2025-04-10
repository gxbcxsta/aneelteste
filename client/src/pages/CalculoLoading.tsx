import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function CalculoLoading() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('Estamos calculando sua restituição...');
  const [progress, setProgress] = useState(0);
  
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
        setProgress((currentIndex + 1) / messages.length * 100);
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
    setProgress(1 / messages.length * 100);
    
    // Configurar o temporizador para trocar as mensagens
    timer = setInterval(showNextMessage, 1500);
    
    // Limpar temporizador ao desmontar
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 text-[var(--gov-blue)] mx-auto animate-spin" />
            
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)]">
              Verificando seus dados...
            </h2>
            
            <p className="text-[var(--gov-gray-dark)]">
              Estamos consultando suas informações para verificar o direito à restituição.
            </p>
            
            <div className="relative pt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--gov-blue)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <p className="mt-4 text-[var(--gov-blue-dark)] font-medium animate-pulse">
                {message}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}