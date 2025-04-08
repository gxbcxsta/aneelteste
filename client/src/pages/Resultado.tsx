import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Download, AlertTriangle, CalendarClock, ChevronRight } from "lucide-react";
import SimuladorRestituicao from "@/components/SimuladorRestituicao";

export default function Resultado() {
  const [location, navigate] = useLocation();
  // Extrair parâmetros de consulta da URL atual
  const query = new URLSearchParams(location.split('?')[1] || '');
  
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [activeTab, setActiveTab] = useState("dados");
  
  // Dados do usuário da URL
  const cpf = query.get("cpf") || "";
  const nome = query.get("nome") || "";
  
  // Dados da simulação
  const [simulacaoRealizada, setSimulacaoRealizada] = useState(false);
  
  // Dados extras
  const [estado, setEstado] = useState(query.get("estado") || "Minas Gerais");
  const [companhia, setCompanhia] = useState(query.get("companhia") || "CEMIG");
  const [dataNascimento, setDataNascimento] = useState("");
  
  // Dados calculados da restituição
  const [valorTotal, setValorTotal] = useState(0);
  const [mesesAvaliados, setMesesAvaliados] = useState(0);
  const [dataPagamento, setDataPagamento] = useState("");
  
  // Função para formatar CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Função para formatar valor em reais
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Definir data de nascimento do usuário a partir dos dados da API
  useEffect(() => {
    if (query.get("nasc")) {
      const nascimento = query.get("nasc") || "";
      const dataObj = new Date(nascimento);
      setDataNascimento(dataObj.toLocaleDateString('pt-BR'));
    } else {
      // Se não tiver data de nascimento na URL, usamos uma padrão para teste
      setDataNascimento("01/01/1990");
    }
  }, [query]);
  
  // Detectar estado e companhia baseado no IP do usuário apenas se não tiverem vindo no URL
  useEffect(() => {
    // Se já temos os dados da URL, não precisamos detectar
    if (query.get("estado") && query.get("companhia")) {
      return;
    }
    
    const detectarLocalizacao = async () => {
      try {
        // Em um cenário real, usaríamos um serviço de geolocalização por IP
        // Para simplificar, usamos valores padrão
        if (!query.get("estado")) {
          setEstado("Minas Gerais");
        }
        
        if (!query.get("companhia")) {
          setCompanhia("CEMIG");
        }
        
        // Simulação de chamada bem-sucedida
        console.log("Estado detectado pelo IP:", estado);
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
        // Manter os valores padrão em caso de erro
      }
    };
    
    detectarLocalizacao();
  }, [query]);
  
  // Simulação inicial de cálculo da restituição (para a tab "dados")
  useEffect(() => {
    // Verificar se temos CPF e nome
    if (!cpf || !nome) {
      navigate("/verificar");
      return;
    }
    
    // Simulação de carregamento
    const timer = setInterval(() => {
      setProgresso(oldProgress => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return oldProgress + 10;
      });
    }, 600);
    
    // Simulação de cálculo concluído
    setTimeout(() => {
      // Gerando valores aleatórios para demonstração
      const baseValue = (parseInt(cpf.slice(-4)) % 30) * 100 + 1500; // Valor entre R$ 1.500 e R$ 4.500
      const meses = Math.floor(Math.random() * 36) + 24; // Entre 24 e 60 meses (2 a 5 anos)
      
      // Calcular data de pagamento (entre 30 e 90 dias no futuro)
      const diasParaPagamento = Math.floor(Math.random() * 60) + 30;
      const dataPgto = new Date();
      dataPgto.setDate(dataPgto.getDate() + diasParaPagamento);
      
      setValorTotal(baseValue);
      setMesesAvaliados(meses);
      setDataPagamento(dataPgto.toLocaleDateString('pt-BR'));
      setIsLoading(false);
      
      clearInterval(timer);
      setProgresso(100);
    }, 3000); // Reduzido para 3 segundos para melhor experiência do usuário
    
    return () => clearInterval(timer);
  }, [cpf, nome, navigate]);
  
  // Função para gerar o PDF de comprovante
  const gerarComprovante = () => {
    alert("Seu comprovante será enviado para o e-mail cadastrado junto à Receita Federal.");
  };
  
  // Função chamada quando a simulação é concluída
  const handleSimulacaoConcluida = (valor: number, meses: number) => {
    setValorTotal(valor);
    setMesesAvaliados(meses);
    
    // Calcular data de pagamento (30 dias no futuro)
    const dataPgto = new Date();
    dataPgto.setDate(dataPgto.getDate() + 30);
    setDataPagamento(dataPgto.toLocaleDateString('pt-BR'));
    
    setSimulacaoRealizada(true);
    
    // Opcional: mudar para a aba de dados após a simulação
    // setActiveTab("dados");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg overflow-hidden">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-8">
                <CardTitle className="text-2xl font-bold">Restituição de ICMS</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Consulte seus direitos e simule o valor da sua restituição
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="dados" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b px-6">
                  <TabsList className="bg-transparent border-b-0 p-0">
                    <TabsTrigger 
                      value="dados" 
                      className="data-[state=active]:text-[var(--gov-blue)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--gov-blue)] rounded-none py-4"
                    >
                      Dados Pessoais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="simulador" 
                      className="data-[state=active]:text-[var(--gov-blue)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--gov-blue)] rounded-none py-4"
                    >
                      Simulador de Restituição
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="dados" className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-semibold mb-4 text-[var(--gov-blue-dark)]">
                        Verificando seus dados...
                      </h3>
                      <Progress value={progresso} className="h-2 mb-4" />
                      <p className="text-sm text-[var(--gov-gray-dark)]">
                        Estamos consultando suas informações para verificar o direito à restituição.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start">
                        <CheckCircle className="text-green-500 mr-3 mt-1 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-green-800">Verificação Concluída!</h3>
                          <p className="text-sm text-green-700">
                            Seus dados foram verificados e você tem direito à restituição do ICMS.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Dados do Solicitante */}
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-semibold mb-3 text-[var(--gov-blue-dark)]">
                            Dados do Solicitante
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Nome Completo:</p>
                              <p className="font-medium">{nome}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">CPF:</p>
                              <p className="font-medium">{formatarCPF(cpf)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Data de Nascimento:</p>
                              <p className="font-medium">{dataNascimento}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Estado:</p>
                              <p className="font-medium">{estado}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Companhia Elétrica:</p>
                              <p className="font-medium">{companhia}</p>
                            </div>
                          </div>
                        </div>
                        
                        {simulacaoRealizada ? (
                          <>
                            {/* Detalhes da Restituição (após simulação) */}
                            <div className="border-b pb-4">
                              <h3 className="text-lg font-semibold mb-3 text-[var(--gov-blue-dark)]">
                                Detalhes da Restituição
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Período Analisado:</p>
                                  <p className="font-medium">{mesesAvaliados} meses</p>
                                </div>
                                <div>
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Data de Pagamento Prevista:</p>
                                  <p className="font-medium flex items-center">
                                    <CalendarClock className="h-4 w-4 mr-1 text-[var(--gov-blue)]" />
                                    {dataPagamento}
                                  </p>
                                </div>
                                <div className="md:col-span-2">
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Valor Total da Restituição:</p>
                                  <p className="text-2xl font-bold text-[var(--gov-blue-dark)]">
                                    {formatarValor(valorTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Informações Adicionais */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                              <div className="flex items-start">
                                <AlertTriangle className="text-amber-500 mr-3 mt-1 h-5 w-5 flex-shrink-0" />
                                <div>
                                  <h3 className="font-semibold text-amber-800">Importante</h3>
                                  <p className="text-sm text-amber-700">
                                    O pagamento será processado automaticamente e depositado na conta bancária 
                                    vinculada ao seu CPF na Receita Federal. Verifique se seus dados 
                                    bancários estão atualizados.
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Ações */}
                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                              <Button 
                                onClick={gerarComprovante}
                                className="flex items-center justify-center bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Comprovante
                              </Button>
                              
                              <Button 
                                onClick={() => navigate("/")}
                                variant="outline"
                                className="border-[var(--gov-blue)] text-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)]/10"
                              >
                                Voltar para Página Inicial
                              </Button>
                            </div>
                          </>
                        ) : (
                          // Opção para iniciar simulação
                          <div className="py-6 text-center">
                            <p className="mb-4 text-[var(--gov-gray-dark)]">
                              Para calcular o valor exato da sua restituição, prossiga para a simulação
                              fornecendo informações sobre sua conta de energia.
                            </p>
                            <Button 
                              onClick={() => setActiveTab("simulador")}
                              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-semibold px-6 py-2"
                            >
                              Prosseguir para Simulação
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="simulador" className="p-6">
                  <SimuladorRestituicao 
                    cpf={cpf}
                    nome={nome}
                    companhia={companhia}
                    estado={estado}
                    dataNascimento={dataNascimento}
                    onSimulacaoConcluida={handleSimulacaoConcluida}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}