import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Coins, ChevronRight, ChevronLeft, AlertCircle, Loader2, Phone, Mail, BanknoteIcon, CreditCard, CheckCircle, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CalculoLoadingPopup } from "@/components/CalculoLoadingPopup";

// Validação para o número de cliente/CPF
const clienteSchema = z.object({
  numeroCliente: z.string().min(1, "Campo obrigatório"),
  usarCpf: z.boolean().default(false),
});

// Validação para o valor médio da conta
const valorContaSchema = z.object({
  valorMedio: z.string()
    .min(1, "Campo obrigatório")
    .refine((val) => {
      const valor = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return !isNaN(valor) && valor > 0;
    }, "Valor incorreto. Digite um valor maior que zero."),
});

// Validação para o período
const periodoSchema = z.object({
  periodo: z.string().min(1, "Selecione um período"),
});

// Validação para dados de contato
const contatoSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos (DDD + número)")
    .max(17, "Telefone inválido")
    .regex(/[\d\s\(\)\-]+/, "Formato inválido de telefone"),
});

// Validação para dados bancários
const dadosBancariosSchema = z.object({
  banco: z.string().min(1, "Selecione um banco"),
  chavePix: z.string().optional(), // Chave PIX será sempre o CPF, não precisa validação
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

type ClienteFormValues = z.infer<typeof clienteSchema>;
type ValorContaFormValues = z.infer<typeof valorContaSchema>;
type PeriodoFormValues = z.infer<typeof periodoSchema>;
type ContatoFormValues = z.infer<typeof contatoSchema>;
type DadosBancariosFormValues = z.infer<typeof dadosBancariosSchema>;

interface SimuladorRestituicaoProps {
  cpf: string;
  nome: string;
  companhia: string;
  estado: string;
  dataNascimento: string;
  onSimulacaoConcluida: (valor: number, meses: number) => void;
}

export default function SimuladorRestituicao({
  cpf,
  nome,
  companhia,
  estado,
  dataNascimento,
  onSimulacaoConcluida
}: SimuladorRestituicaoProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [valorMedioFinal, setValorMedioFinal] = useState(0);
  const [mesesConsiderados, setMesesConsiderados] = useState(0);
  const [valorFinalRestituicao, setValorFinalRestituicao] = useState(0);
  const [valorRealRestituicao, setValorRealRestituicao] = useState(0);
  const [calculando, setCalculando] = useState(false);
  
  // Estados para os dados de contato e bancários
  const [telefoneConfirmado, setTelefoneConfirmado] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  
  // Inicializar toast para feedback
  const { toast } = useToast();
  
  // Formatação de CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Formulários para as etapas adicionais
  const contatoForm = useForm<ContatoFormValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      email: "",
      telefone: "",
    },
  });
  
  const dadosBancariosForm = useForm<DadosBancariosFormValues>({
    resolver: zodResolver(dadosBancariosSchema),
    defaultValues: {
      banco: "",
      chavePix: "", // Será configurado depois de formatarCPF estar disponível
    },
  });
  
  // Formatação de valores monetários
  const formatarMoeda = (valor: number | string) => {
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) : valor;
    
    if (isNaN(valorNumerico)) return "R$ 0,00";
    
    return valorNumerico.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  // Formatar input de moeda
  const formatarInputMoeda = (valor: string) => {
    // Remove tudo exceto números e vírgula
    let apenasNumeros = valor.replace(/[^\d,]/g, '');
    
    // Substitui múltiplas vírgulas por uma única
    apenasNumeros = apenasNumeros.replace(/,+/g, ',');
    
    // Se começa com vírgula, adiciona zero na frente
    if (apenasNumeros.startsWith(',')) {
      apenasNumeros = '0' + apenasNumeros;
    }
    
    // Converte para número (para remover zeros à esquerda)
    const partes = apenasNumeros.split(',');
    let inteiros = partes[0] ? parseInt(partes[0], 10).toString() : '0';
    
    // Reconstrói o valor
    let resultado = inteiros;
    if (partes.length > 1) {
      resultado += ',' + partes[1].substring(0, 2);
    }
    
    // Formata com R$
    return 'R$ ' + resultado;
  };
  
  // Extrai o valor numérico de uma string formatada como moeda
  const extrairValorNumerico = (valorFormatado: string) => {
    return parseFloat(valorFormatado.replace(/[^\d,.-]/g, '').replace(',', '.'));
  };
  
  // Para a etapa de número de cliente
  const clienteForm = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      numeroCliente: "",
      usarCpf: false
    }
  });
  
  // Para a etapa de valor médio da conta
  const valorContaForm = useForm<ValorContaFormValues>({
    resolver: zodResolver(valorContaSchema),
    defaultValues: {
      valorMedio: ""
    }
  });
  
  // Para a etapa de período
  const periodoForm = useForm<PeriodoFormValues>({
    resolver: zodResolver(periodoSchema),
    defaultValues: {
      periodo: "menos-12" // Definir um valor padrão para evitar erro de validação
    }
  });
  
  // Não precisamos mais dos efeitos para controlar o usarContas e os campos de contas
  
  // Atualiza o campo de número de cliente quando o checkbox usarCpf muda
  useEffect(() => {
    const usarCpf = clienteForm.watch("usarCpf");
    if (usarCpf) {
      clienteForm.setValue("numeroCliente", formatarCPF(cpf));
    } else {
      // Se desmarcar, limpar o campo
      clienteForm.setValue("numeroCliente", "");
    }
  }, [clienteForm.watch("usarCpf"), cpf]);
  
  // Define o valor de chavePix formatado depois que o componente for montado
  useEffect(() => {
    // Atualiza o chavePix com o CPF formatado
    dadosBancariosForm.setValue("chavePix", formatarCPF(cpf));
  }, [cpf]);

  // Submissão do formulário da etapa 1 (cliente)
  const onSubmitCliente = (data: ClienteFormValues) => {
    // O valor do numeroCliente já está atualizado pelo useEffect
    // Avança para a próxima etapa
    proximaEtapa();
  };
  
  // Submissão do formulário da etapa 2 (valor médio)
  const onSubmitValorConta = (data: ValorContaFormValues) => {
    // Extrai o valor numérico da string formatada
    const valorMedio = extrairValorNumerico(data.valorMedio);
    
    // Define o valor médio
    setValorMedioFinal(valorMedio);
    
    // Avança para a próxima etapa
    proximaEtapa();
  };
  
  // Estado para controlar a exibição do PopUp de cálculo
  const [showCalculoPopup, setShowCalculoPopup] = useState(false);

  // Estado para controlar tela de loading com barra de progresso
  const [mostrarTelaLoading, setMostrarTelaLoading] = useState(false);
  const [mensagemCarregamento, setMensagemCarregamento] = useState('');
  const [progressoCarregamento, setProgressoCarregamento] = useState(0);
  
  // Submissão do formulário da etapa 3 (período)
  const onSubmitPeriodo = async (data: PeriodoFormValues) => {
    // Define o número de meses baseado na seleção do usuário
    let meses = 0;
    
    switch(data.periodo) {
      case 'menos-12':
        meses = 12;
        break;
      case '1-3-anos':
        meses = 24;
        break;
      case '3-5-anos':
        meses = 42;
        break;
      case '5-anos':
        meses = 60;
        break;
      default:
        meses = 12;
    }
    
    // Redirecionar DIRETAMENTE para a página de resultado-calculo
    window.location.href = `/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedioFinal)}&meses=${encodeURIComponent(meses)}`;
  };
  
  // Funções de navegação entre etapas
  const proximaEtapa = () => {
    setEtapaAtual(etapa => etapa + 1);
  };
  
  const voltarEtapa = () => {
    // Se estiver na primeira etapa, não podemos voltar mais
    if (etapaAtual === 0) {
      return;
    }
    
    // Caso contrário, voltar uma etapa
    setEtapaAtual(etapa => etapa - 1);
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
        proximaEtapa();
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
    
    // Obter o nome do banco selecionado para exibição
    setBancoSelecionado(
      bancosBrasileiros.find((banco) => banco.id === data.banco)?.nome || ""
    );
    
    // Sempre usar o CPF formatado como chave PIX
    setChavePix(formatarCPF(cpf));
    
    // Avançar para a próxima etapa com um pequeno atraso para animação
    setTimeout(() => {
      proximaEtapa();
      setAnimacaoAtiva(false);
    }, 300);
  };
  
  // Ir para etapa dos seus dados
  const iniciarSolicitacao = () => {
    proximaEtapa();
  };
  
  // Finalizar processo
  const finalizarProcesso = () => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    setTimeout(() => {
      // Redirecionar para a página de pagamento PIX com todos os dados relevantes
      window.location.href = `/pagamento?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&valor=${encodeURIComponent(valorFinalRestituicao)}&nasc=${encodeURIComponent(dataNascimento)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&bancoNome=${encodeURIComponent(bancoSelecionado)}`;
    }, 500);
  };
  
  // Remover etapas desnecessárias do fluxo e ajustar a navegação
  useEffect(() => {
    // Quando o etapaAtual é atualizado e está tentando ir para etapa 5 (Seus Dados)
    // pular diretamente para etapa 7 (Finalizar) que leva para pagamento
    if (etapaAtual === 5) {
      setEtapaAtual(4); // Voltar para o resultado
    }
    
    // Se for para a etapa 6 (Dados Bancários), também voltar para o resultado
    if (etapaAtual === 6) {
      setEtapaAtual(4); // Voltar para o resultado
    }
  }, [etapaAtual]);
  
  // Renderiza a etapa atual do simulador
  const renderEtapa = () => {
    // Se a tela de loading estiver ativa, mostrar ela no lugar de qualquer etapa
    if (mostrarTelaLoading) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-4 text-[var(--gov-blue-dark)]">
            Verificando seus dados...
          </h3>
          
          <Progress value={progressoCarregamento} className="h-2 mb-4" />
          
          <p className="text-sm text-[var(--gov-gray-dark)] mb-4">
            Estamos consultando suas informações para verificar o direito à restituição.
          </p>
          
          <p className="text-sm text-[var(--gov-blue-dark)] font-medium animate-pulse">
            {mensagemCarregamento}
          </p>
        </div>
      );
    }
      
    // Caso contrário, mostrar a etapa atual
    switch(etapaAtual) {
      case 0: // Etapa inicial
        return (
          <div className="text-center space-y-6 py-6">
            <Coins className="h-16 w-16 text-[var(--gov-yellow)] mx-auto" />
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)]">
              Vamos calcular quanto você pode receber de volta da sua conta de luz.
            </h2>
            <p className="text-[var(--gov-gray-dark)]">
              Com base nos seus dados e histórico de pagamentos, iremos estimar o valor
              que você tem direito a receber de restituição do ICMS cobrado indevidamente.
            </p>
            <Button 
              onClick={proximaEtapa}
              className="w-full bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-semibold px-8 py-6 text-lg"
            >
              Calcular
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );
        
      case 1: // Etapa de número de cliente
        return (
          <Form {...clienteForm}>
            <form onSubmit={clienteForm.handleSubmit(onSubmitCliente)} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Etapa 1: Informações do Cliente
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Companhia Elétrica: {companhia}</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Estado: {estado}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <FormField
                control={clienteForm.control}
                name="numeroCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">
                      {clienteForm.watch("usarCpf") 
                        ? "CPF do Titular" 
                        : `Nº de Cliente da ${companhia}`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={clienteForm.watch("usarCpf") 
                          ? "000.000.000-00" 
                          : "Digite o número de cliente"}
                        className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                        value={clienteForm.watch("usarCpf") ? formatarCPF(cpf) : field.value}
                        disabled={clienteForm.watch("usarCpf")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clienteForm.control}
                name="usarCpf"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[var(--gov-gray-dark)]">
                        Não tenho o número de cliente, usar CPF
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={voltarEtapa}
                  variant="outline"
                  className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 2: // Etapa de valor médio da conta
        return (
          <Form {...valorContaForm}>
            <form onSubmit={valorContaForm.handleSubmit(onSubmitValorConta)} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Etapa 2: Valor médio da conta de luz
              </h2>
              
              <FormField
                control={valorContaForm.control}
                name="valorMedio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">
                      Valor médio mensal da sua conta de luz
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="R$ 0,00"
                        className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                        onChange={(e) => {
                          field.onChange(formatarInputMoeda(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={voltarEtapa}
                  variant="outline"
                  className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 3: // Etapa de período
        return (
          <Form {...periodoForm}>
            <form onSubmit={periodoForm.handleSubmit(onSubmitPeriodo)} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Etapa 3: Período de pagamento
              </h2>
              
              <div className="space-y-4">
                <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">
                  Por quanto tempo você pagou essa média nos últimos 5 anos?
                </FormLabel>
                
                <div className="space-y-2">
                  <div 
                    className={`border rounded-md p-3 cursor-pointer ${periodoForm.watch("periodo") === "menos-12" ? "border-[var(--gov-blue)] bg-blue-50" : "border-gray-200"}`}
                    onClick={() => periodoForm.setValue("periodo", "menos-12")}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${periodoForm.watch("periodo") === "menos-12" ? "border-[var(--gov-blue)]" : "border-gray-300"}`}>
                        {periodoForm.watch("periodo") === "menos-12" && (
                          <div className="w-2 h-2 rounded-full bg-[var(--gov-blue)]"></div>
                        )}
                      </div>
                      <span className="font-medium text-sm">1 a 11 Meses</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-3 cursor-pointer ${periodoForm.watch("periodo") === "1-3-anos" ? "border-[var(--gov-blue)] bg-blue-50" : "border-gray-200"}`}
                    onClick={() => periodoForm.setValue("periodo", "1-3-anos")}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${periodoForm.watch("periodo") === "1-3-anos" ? "border-[var(--gov-blue)]" : "border-gray-300"}`}>
                        {periodoForm.watch("periodo") === "1-3-anos" && (
                          <div className="w-2 h-2 rounded-full bg-[var(--gov-blue)]"></div>
                        )}
                      </div>
                      <span className="font-medium text-sm">1 a 3 anos</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-3 cursor-pointer ${periodoForm.watch("periodo") === "3-5-anos" ? "border-[var(--gov-blue)] bg-blue-50" : "border-gray-200"}`}
                    onClick={() => periodoForm.setValue("periodo", "3-5-anos")}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${periodoForm.watch("periodo") === "3-5-anos" ? "border-[var(--gov-blue)]" : "border-gray-300"}`}>
                        {periodoForm.watch("periodo") === "3-5-anos" && (
                          <div className="w-2 h-2 rounded-full bg-[var(--gov-blue)]"></div>
                        )}
                      </div>
                      <span className="font-medium text-sm">4 a 5 anos</span>
                    </div>
                  </div>
                </div>
                
                {periodoForm.formState.errors.periodo && (
                  <p className="text-sm text-red-500 mt-1">
                    {periodoForm.formState.errors.periodo.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={voltarEtapa}
                  variant="outline"
                  className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                  disabled={calculando}
                >
                  {calculando ? (
                    <>
                      <span className="animate-pulse">Calculando...</span>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Calcular
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        );
        
      case 4: // Resultado da simulação
        return (
          <div className="space-y-6 py-4">
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
              Resultado da simulação
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-[var(--gov-gray-dark)] mb-2">Valor estimado da sua restituição:</p>
              <div className="flex items-center justify-center">
                <Coins className="h-8 w-8 text-green-500 mr-2" />
                <span className="text-3xl font-bold text-green-600">
                  {formatarMoeda(valorFinalRestituicao)}
                </span>
              </div>
              
              {valorRealRestituicao > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-sm">
                    Você tem direito a {formatarMoeda(valorRealRestituicao)}. Valores acima de R$ 5.000 são 
                    pagos em etapas. O primeiro pagamento será feito agora, e o restante pode 
                    ser solicitado após 30 dias.
                  </p>
                </div>
              )}
              
              <p className="text-sm text-[var(--gov-gray-dark)] mt-4">
                {(() => {
                  switch(mesesConsiderados) {
                    case 12:
                      return "Cálculo baseado em 12 meses com valor médio de " + formatarMoeda(valorMedioFinal);
                    case 24:
                      return "Cálculo baseado em 12/36 meses com valor médio de " + formatarMoeda(valorMedioFinal);
                    case 42:
                      return "Cálculo baseado em 36/60 meses com valor médio de " + formatarMoeda(valorMedioFinal);
                    default:
                      return "Cálculo baseado em " + mesesConsiderados + " meses com valor médio de " + formatarMoeda(valorMedioFinal);
                  }
                })()}
              </p>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                onClick={voltarEtapa}
                variant="outline"
                className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              
              <Button 
                onClick={finalizarProcesso} // Vamos redirecionar diretamente para a página de pagamento
                className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
              >
                Prosseguir para pagamento
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 5: // Etapa de Seus Dados (Contato)
        return (
          <div className={cn("space-y-6 py-4", { "opacity-50 pointer-events-none": animacaoAtiva })}>
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
              Seus Dados de Contato
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Titular:</span> {nome}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-medium">CPF:</span> {formatarCPF(cpf)}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-medium">Data de Nascimento:</span> {dataNascimento}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <span className="font-medium">Distribuidora:</span> {companhia}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Preencha os campos abaixo para receber atualizações sobre o processo.
                  </p>
                </div>
              </div>
            </div>
            
            <Form {...contatoForm}>
              <form onSubmit={contatoForm.handleSubmit(onSubmitContato)} className="space-y-6">
                <FormField
                  control={contatoForm.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--gov-blue-dark)] font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Telefone celular com DDD
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(11) 9 8888 8888"
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                          maxLength={16}
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
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Formato: (11) 9 8888 8888
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={contatoForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--gov-blue-dark)] font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    onClick={voltarEtapa}
                    variant="outline"
                    className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <Button 
                    type="submit"
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
      
      case 6: // Etapa de Dados Bancários
        return (
          <div className={cn("space-y-6 py-4", { "opacity-50 pointer-events-none": animacaoAtiva })}>
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
              Dados Bancários
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-green-800 font-medium">
                    Falta pouco para receber sua restituição de {formatarMoeda(valorFinalRestituicao)}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Informe os dados bancários para depósito.
                  </p>
                </div>
              </div>
            </div>
            
            <Form {...dadosBancariosForm}>
              <form onSubmit={dadosBancariosForm.handleSubmit(onSubmitDadosBancarios)} className="space-y-6">
                <div className="space-y-3">
                  <FormField
                    control={dadosBancariosForm.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--gov-blue-dark)] font-medium flex items-center">
                          <BanknoteIcon className="h-4 w-4 mr-2" />
                          Banco
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Garantir que o valor seja registrado imediatamente
                            dadosBancariosForm.setValue("banco", value, { shouldValidate: true });
                            // Atualizar o nome do banco imediatamente para feedback visual
                            const nomeBanco = bancosBrasileiros.find((banco) => banco.id === value)?.nome || "";
                            setBancoSelecionado(nomeBanco);
                            console.log("Banco selecionado:", value, nomeBanco);
                          }}
                          defaultValue=""
                        >
                          <FormControl>
                            <SelectTrigger className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]">
                              <SelectValue placeholder="Selecione seu banco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bancosBrasileiros.map((banco) => (
                              <SelectItem key={banco.id} value={banco.id}>
                                {banco.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Campo de exibição do banco selecionado */}
                  {bancoSelecionado && (
                    <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                      <span className="font-medium">Banco selecionado:</span> {bancoSelecionado}
                    </div>
                  )}
                </div>
                
                <FormField
                  control={dadosBancariosForm.control}
                  name="chavePix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--gov-blue-dark)] font-medium flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        CPF (Chave PIX)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="CPF como chave PIX"
                          className="border-[var(--gov-gray)] bg-gray-50 cursor-not-allowed"
                          maxLength={14}
                          value={formatarCPF(cpf)}
                          disabled={true}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Usaremos seu CPF como chave PIX para transferência
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    onClick={voltarEtapa}
                    variant="outline"
                    className="border-[var(--gov-blue)] text-[var(--gov-blue)]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <Button 
                    type="submit"
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
        
      case 7: // Etapa de Finalização
        return (
          <div className={cn("space-y-6 py-6 text-center", { "opacity-50 pointer-events-none": animacaoAtiva })}>
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
            
            <h2 className="text-xl font-semibold text-amber-600">
              Você Está Quase Lá!
            </h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4">Resumo da solicitação</h3>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Titular:</span>
                  <span className="font-medium">{nome}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">CPF:</span>
                  <span className="font-medium">{formatarCPF(cpf)}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Data de Nascimento:</span>
                  <span className="font-medium">{dataNascimento}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Companhia:</span>
                  <span className="font-medium">{companhia}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Telefone:</span>
                  <span className="font-medium">{telefoneConfirmado}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">E-mail:</span>
                  <span className="font-medium">{emailConfirmado}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Banco:</span>
                  <span className="font-medium">{bancoSelecionado}</span>
                </div>
                
                <div className="flex justify-between border-b border-amber-200 pb-2">
                  <span className="text-amber-700">Valor a receber:</span>
                  <span className="font-medium text-amber-600">{formatarMoeda(valorFinalRestituicao)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[var(--gov-gray-dark)]">
              Após a confirmação, uma cópia destas informações será enviada para o seu e-mail.
              Acompanhe o status da sua solicitação e receba o valor em até 72 horas úteis.
            </p>
            
            <Button 
              onClick={finalizarProcesso}
              className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 font-bold py-6 text-lg w-full"
            >
              Finalizar
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Calcula a porcentagem de progresso baseado na etapa atual
  const calcularProgresso = () => {
    const totalEtapas = 3; // Total de 4 etapas (0 a 3)
    return ((etapaAtual) / totalEtapas) * 100;
  };
  
  // Função para redirecionar para página de resultado
  const redirecionarParaCalculo = () => {
    // Finaliza o carregamento
    setCalculando(false);
    setAnimacaoAtiva(false);
    
    // Construir URL com os parâmetros necessários e redirecionar diretamente para a página de resultado
    const url = `/resultado-calculo?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}&nasc=${encodeURIComponent(dataNascimento)}&valor=${encodeURIComponent(valorMedioFinal)}&meses=${encodeURIComponent(mesesConsiderados)}`;
    
    // Redirecionar para a página de resultado
    window.location.href = url;
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      {/* Barra de progresso */}
      <div className="mb-6">
        <div className="h-2 w-full bg-gray-200 rounded-full">
          <div 
            className="h-full bg-[var(--gov-blue)] rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${calcularProgresso()}%` }}
          ></div>
        </div>
        {/* Versão desktop - apenas as etapas necessárias são visíveis */}
        <div className="hidden md:flex justify-between mt-2 text-xs text-[var(--gov-gray-dark)]">
          <span className={cn("font-medium", etapaAtual >= 0 ? "text-[var(--gov-blue)]" : "")}>Início</span>
          <span className={cn("font-medium", etapaAtual >= 1 ? "text-[var(--gov-blue)]" : "")}>Dados</span>
          <span className={cn("font-medium", etapaAtual >= 2 ? "text-[var(--gov-blue)]" : "")}>Valor</span>
          <span className={cn("font-medium", etapaAtual >= 3 ? "text-[var(--gov-blue)]" : "")}>Período</span>
        </div>
        
        {/* Versão mobile - apenas etapa atual e adjacentes */}
        <div className="flex md:hidden justify-center mt-2 text-xs text-[var(--gov-gray-dark)]">
          <div className="text-center">
            <span className="font-medium text-[var(--gov-blue-dark)]">
              Etapa {etapaAtual + 1} de 4: {" "}
              {etapaAtual === 0 ? "Início" : 
               etapaAtual === 1 ? "Dados" : 
               etapaAtual === 2 ? "Valor" : 
               etapaAtual === 3 ? "Período" : 
               "Resultado"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Conteúdo da etapa atual */}
      {renderEtapa()}
      
      {/* Removemos o popup de carregamento, vamos usar a página dedicada */}
    </div>
  );
}