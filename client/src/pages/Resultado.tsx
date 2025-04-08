import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Download, AlertTriangle, CalendarClock } from "lucide-react";

export default function Resultado() {
  const [location, navigate] = useLocation();
  // Extrair parâmetros de consulta da URL atual
  const query = new URLSearchParams(location.split('?')[1] || '');
  
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(0);
  
  // Dados do usuário da URL
  const cpf = query.get("cpf") || "";
  const nome = query.get("nome") || "";
  
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
  
  // Simulação de cálculo da restituição
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
    }, 6000);
    
    return () => clearInterval(timer);
  }, [cpf, nome, navigate]);
  
  // Função para gerar o PDF de comprovante
  const gerarComprovante = () => {
    alert("Seu comprovante será enviado para o e-mail cadastrado junto à Receita Federal.");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg overflow-hidden">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-8">
                <CardTitle className="text-2xl font-bold">Resultado da Análise</CardTitle>
              </CardHeader>
              
              <CardContent className="p-8">
                {isLoading ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--gov-blue-dark)]">
                      Analisando seu histórico de pagamentos...
                    </h3>
                    <Progress value={progresso} className="h-2 mb-4" />
                    <p className="text-sm text-[var(--gov-gray-dark)]">
                      Estamos calculando o valor da sua restituição com base no histórico
                      de contas de energia elétrica dos últimos 5 anos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start">
                      <CheckCircle className="text-green-500 mr-3 mt-1 h-5 w-5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-green-800">Restituição Aprovada!</h3>
                        <p className="text-sm text-green-700">
                          Sua solicitação foi analisada e você tem direito à restituição de valores pagos indevidamente.
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
                        </div>
                      </div>
                      
                      {/* Detalhes da Restituição */}
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
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}