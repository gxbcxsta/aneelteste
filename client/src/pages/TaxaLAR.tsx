import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, Clock, DollarSign, FileText, ReceiptText, HelpCircle, LockKeyhole, Timer, Shield, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ScrollToTop from "@/components/ScrollToTop";
import { useUserData } from "@/contexts/UserContext";

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

export default function TaxaLAR() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { userData, updateUserData } = useUserData();
  
  // Valor da Taxa de Liberação Acelerada de Restituição (LAR)
  const VALOR_TAXA_LAR = 48.60;
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dataPagamentoTCN, setDataPagamentoTCN] = useState("");
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
    // Definir protocolo baseado no CPF ou usar o existente no contexto
    if (userData.protocolo) {
      setProtocolo(userData.protocolo);
    } else if (userData.cpf) {
      const novoProtocolo = `${userData.cpf.substring(0, 4)}4714${userData.cpf.substring(6, 9)}`;
      setProtocolo(novoProtocolo);
      
      // Atualizar o contexto com o protocolo gerado
      updateUserData({
        protocolo: novoProtocolo
      });
    }
    
    // Definir data atual
    const dataHoje = new Date();
    setDataAtual(dataHoje.toLocaleDateString('pt-BR'));
    
    // Definir data do pagamento da primeira taxa (TRE)
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
    
    // Definir data do pagamento da TCN (usamos a data atual, poderia vir do contexto)
    setDataPagamentoTCN(dataHoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }));
    
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
  }, [userData, updateUserData]);
  
  // Função para prosseguir para a página de pagamento da LAR
  const prosseguirParaPagamentoLAR = () => {
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
      valorTaxaLAR: VALOR_TAXA_LAR,
      protocolo: protocolo
    });
    
    // Redirecionar para a página de pagamento da LAR
    setTimeout(() => {
      setLocation('/pagamento-lar');
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
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded mt-1 inline-flex items-center">
                  <CheckCircle2 size={12} className="mr-1" />
                  Taxas obrigatórias quitadas
                </div>
              </div>
              <div className="text-right bg-[#0C4DA2] rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">Valor aprovado:</p>
                <p className="font-bold text-lg text-white">{valorRestituicaoFormatado}</p>
                <div className="flex items-center justify-end mt-1 text-xs text-white">
                  <Clock size={12} className="mr-1" />
                  <span>TCN paga em: <span className="font-medium">{dataPagamentoTCN}</span></span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alerta de status */}
          <div className="mb-6">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-bold text-green-800">Status da Restituição: APROVADA</AlertTitle>
              <AlertDescription className="text-green-700">
                Seu pagamento da Taxa de Conformidade Nacional (TCN) foi confirmado. Todas as taxas obrigatórias 
                foram pagas. Agora você pode optar pela Liberação Acelerada para receber em até 60 minutos.
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
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">1ª ETAPA - Taxa de Regularização Energética (TRE)</p>
                  <p className="text-sm text-gray-600">Você realizou o pagamento da TRE com sucesso. Seu pedido foi validado no sistema.</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">2ª ETAPA - Taxa de Conformidade Nacional (TCN)</p>
                  <p className="text-sm text-gray-600">Você realizou o pagamento da TCN com sucesso. Seu processo foi validado no Sistema Nacional.</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">Concluído</Badge>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-amber-500 rounded-full p-2 text-white mt-0.5 mr-3 flex-shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">3ª ETAPA - Liberação Acelerada de Restituição (LAR)</p>
                  <p className="text-sm text-gray-600">Opção para receber sua restituição em até 60 minutos (opcional).</p>
                  <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">Disponível</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detalhes da taxa LAR */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 px-4 rounded-t-md font-semibold text-sm flex items-center mb-0">
            <div className="bg-white/20 p-1.5 rounded-md mr-2">
              <Zap className="h-4 w-4" />
            </div>
            LIBERAÇÃO ACELERADA DE RESTITUIÇÃO (LAR)
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-md p-5 bg-white shadow-sm mb-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Card destacado da Taxa LAR */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-amber-500 rounded-full p-2 text-white mr-3 flex-shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-lg">Liberação Acelerada de Restituição</h3>
                    <p className="text-amber-700 text-sm">Receba seu pagamento em até 60 minutos</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-md p-4 border border-amber-200 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-medium">Valor da Taxa:</span>
                    <span className="font-bold text-xl text-amber-800">{valorTaxaLARFormatado}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Receba em 60 minutos</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">Processo prioritário</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-amber-600 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700">100% seguro</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-amber-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Por que optar pela Liberação Acelerada?
                  </h4>
                  
                  <p className="text-sm text-amber-700">
                    Normalmente, o processo de restituição leva até 15 dias úteis. Com a Liberação Acelerada 
                    de Restituição (LAR), você receberá seu dinheiro em <strong>até 60 minutos</strong> após a confirmação do pagamento.
                  </p>
                  
                  <p className="text-sm text-amber-700">
                    Este serviço é opcional e garante prioridade absoluta no processamento da sua restituição, 
                    permitindo que você receba imediatamente o valor de {valorRestituicaoFormatado} em sua conta bancária.
                  </p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                    <p className="text-sm text-amber-800 font-medium">
                      Tempo limitado! Esta oferta é válida apenas nas próximas horas. Aproveite a oportunidade 
                      de receber sua restituição hoje mesmo, em vez de esperar dias ou semanas.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Comparativo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center mb-3 text-amber-800">
                    <Zap className="h-5 w-5 mr-2" />
                    <h4 className="font-bold">COM Liberação Acelerada</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-800">Receba em até <strong>60 minutos</strong></span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-800">Processamento prioritário</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-800">Confirmação por SMS e email</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-800">Suporte prioritário</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3 text-gray-700">
                    <Clock className="h-5 w-5 mr-2" />
                    <h4 className="font-bold">SEM Liberação Acelerada</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Receba em até <strong>15 dias úteis</strong></span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Processamento padrão</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Sem confirmação imediata</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">Suporte padrão</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Botões para prosseguir */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  onClick={prosseguirParaPagamentoLAR}
                  className="w-full font-bold py-6 text-lg bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center justify-center"
                >
                  <Zap className="h-6 w-6 mr-2" />
                  Quero Receber em 60 Minutos
                </Button>
                
                <Button 
                  onClick={() => setLocation('/sucesso-padrao')}
                  variant="outline"
                  className="w-full font-medium py-6 text-lg border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                >
                  <Clock className="h-6 w-6 mr-2" />
                  Prefiro Aguardar 15 Dias
                </Button>
              </div>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                A Liberação Acelerada é uma opção totalmente opcional. Você pode optar por aguardar o prazo padrão sem custo adicional.
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
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">1. A Liberação Acelerada (LAR) é obrigatória?</h4>
                  <p className="text-sm text-gray-600">
                    Não, a LAR é totalmente opcional. Você pode escolher receber sua restituição no prazo padrão sem custo adicional.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">2. Quanto tempo leva para receber com a LAR?</h4>
                  <p className="text-sm text-gray-600">
                    Com a Liberação Acelerada, você receberá o valor em sua conta bancária em até 60 minutos após a confirmação do pagamento.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">3. E se eu não optar pela Liberação Acelerada?</h4>
                  <p className="text-sm text-gray-600">
                    Sem a LAR, o processo segue o fluxo normal, e a restituição será depositada em até 15 dias úteis.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">4. Posso solicitar a LAR depois?</h4>
                  <p className="text-sm text-gray-600">
                    Não, a opção de Liberação Acelerada está disponível apenas neste momento, logo após a confirmação da TCN.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Garantia de Segurança */}
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
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Pagamento seguro via PIX</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Processo aprovado pelo SINACE</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Taxa de Conformidade paga</span>
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