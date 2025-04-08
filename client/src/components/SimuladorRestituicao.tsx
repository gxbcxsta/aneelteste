import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Coins, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Validação para o número de cliente/CPF
const clienteSchema = z.object({
  numeroCliente: z.string().min(1, "Campo obrigatório"),
  usarCpf: z.boolean().default(false),
});

// Validação para o valor médio da conta
const valorContaSchema = z.object({
  valorMedio: z.string().min(1, "Campo obrigatório"),
  usarContas: z.boolean().default(false),
  contas: z.array(z.string()).optional(),
});

// Validação para o período
const periodoSchema = z.object({
  periodo: z.string().min(1, "Selecione um período"),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;
type ValorContaFormValues = z.infer<typeof valorContaSchema>;
type PeriodoFormValues = z.infer<typeof periodoSchema>;

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
  
  // Formatação de CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
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
      valorMedio: "R$ 0,00",
      usarContas: false,
      contas: Array(12).fill("")
    }
  });
  
  // Para a etapa de período
  const periodoForm = useForm<PeriodoFormValues>({
    resolver: zodResolver(periodoSchema),
    defaultValues: {
      periodo: ""
    }
  });
  
  // Efeito para atualizar o valor médio quando as contas individuais são preenchidas
  useEffect(() => {
    const contas = valorContaForm.watch("contas") || [];
    const usarContas = valorContaForm.watch("usarContas");
    
    if (usarContas) {
      // Calcular média das contas preenchidas
      let total = 0;
      let count = 0;
      
      contas.forEach(conta => {
        if (conta) {
          const valor = extrairValorNumerico(conta);
          if (!isNaN(valor)) {
            total += valor;
            count++;
          }
        }
      });
      
      if (count > 0) {
        const media = total / count;
        valorContaForm.setValue("valorMedio", formatarInputMoeda(media.toString()));
      }
    }
  }, [valorContaForm.watch("contas"), valorContaForm.watch("usarContas")]);
  
  // Submissão do formulário da etapa 1 (cliente)
  const onSubmitCliente = (data: ClienteFormValues) => {
    // Se marcou para usar CPF, substitui o número do cliente pelo CPF formatado
    if (data.usarCpf) {
      data.numeroCliente = formatarCPF(cpf);
    }
    
    // Avança para a próxima etapa
    proximaEtapa();
  };
  
  // Submissão do formulário da etapa 2 (valor médio)
  const onSubmitValorConta = (data: ValorContaFormValues) => {
    // Extrai o valor numérico da string formatada
    const valorMedio = extrairValorNumerico(data.valorMedio);
    
    // Se estiver usando contas individuais, calcular a média
    if (data.usarContas) {
      let total = 0;
      let count = 0;
      
      (data.contas || []).forEach(conta => {
        if (conta) {
          const valor = extrairValorNumerico(conta);
          if (!isNaN(valor)) {
            total += valor;
            count++;
          }
        }
      });
      
      if (count > 0) {
        setValorMedioFinal(total / count);
      } else {
        setValorMedioFinal(valorMedio);
      }
    } else {
      setValorMedioFinal(valorMedio);
    }
    
    // Avança para a próxima etapa
    proximaEtapa();
  };
  
  // Submissão do formulário da etapa 3 (período)
  const onSubmitPeriodo = (data: PeriodoFormValues) => {
    // Define o número de meses baseado na seleção do usuário
    let meses = 0;
    
    switch(data.periodo) {
      case 'menos-12':
        meses = 6;
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
        meses = 6;
    }
    
    setMesesConsiderados(meses);
    
    // Calcula o valor estimado da restituição
    const valorEstimado = valorMedioFinal * meses * 0.15;
    
    // Aplica as regras:
    // 1. O valor nunca pode ser menor que R$ 2.000,00
    const valorMinimo = Math.max(valorEstimado, 2000);
    
    // 2. Se o valor for maior que R$ 5.000,00, mostrar apenas R$ 5.000,00 e o valor real
    if (valorMinimo > 5000) {
      setValorFinalRestituicao(5000);
      setValorRealRestituicao(valorMinimo);
    } else {
      setValorFinalRestituicao(valorMinimo);
      setValorRealRestituicao(0); // Não há valor "real" adicional
    }
    
    // Avança para a próxima etapa
    proximaEtapa();
    
    // Notifica o componente pai sobre a conclusão
    onSimulacaoConcluida(valorFinalRestituicao, meses);
  };
  
  // Funções de navegação entre etapas
  const proximaEtapa = () => {
    setEtapaAtual(etapa => etapa + 1);
  };
  
  const voltarEtapa = () => {
    setEtapaAtual(etapa => etapa - 1);
  };
  
  // Inicia a solicitação após a simulação
  const iniciarSolicitacao = () => {
    alert("Iniciar processo de solicitação de restituição");
    // Aqui você pode implementar a lógica para iniciar o processo de solicitação
    // Como por exemplo, navegar para uma nova página ou mostrar um formulário adicional
  };
  
  // Renderiza a etapa atual do simulador
  const renderEtapa = () => {
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
              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-semibold px-8 py-6 text-lg"
            >
              Iniciar simulação
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
                        disabled={valorContaForm.watch("usarContas")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={valorContaForm.control}
                name="usarContas"
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
                        Tenho valores de contas anteriores para informar
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {valorContaForm.watch("usarContas") && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-medium text-[var(--gov-blue-dark)]">
                    Informe os valores das contas (até 12 meses anteriores)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <FormField
                        key={index}
                        control={valorContaForm.control}
                        name={`contas.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-[var(--gov-gray-dark)]">
                              Conta {index + 1}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="R$ 0,00"
                                className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                                onChange={(e) => {
                                  const formattedValue = formatarInputMoeda(e.target.value);
                                  field.onChange(formattedValue);
                                  
                                  // Atualiza o array de contas
                                  const contas = valorContaForm.getValues("contas") || [];
                                  contas[index] = formattedValue;
                                  valorContaForm.setValue("contas", contas);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              
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
              
              <FormField
                control={periodoForm.control}
                name="periodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">
                      Por quanto tempo você pagou essa média nos últimos 5 anos?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]">
                          <SelectValue placeholder="Selecione um período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="menos-12">Menos de 12 meses</SelectItem>
                        <SelectItem value="1-3-anos">De 1 a 3 anos</SelectItem>
                        <SelectItem value="3-5-anos">De 3 a 5 anos</SelectItem>
                        <SelectItem value="5-anos">Os 5 anos completos</SelectItem>
                      </SelectContent>
                    </Select>
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
                  Calcular Restituição
                  <ChevronRight className="ml-2 h-4 w-4" />
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
                Cálculo baseado em {mesesConsiderados} meses com valor médio de {formatarMoeda(valorMedioFinal)}
              </p>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={iniciarSolicitacao}
                className="w-full bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold py-6 text-lg"
              >
                Iniciar Solicitação
              </Button>
              
              <Button
                type="button"
                onClick={voltarEtapa}
                variant="outline"
                className="w-full mt-4 border-[var(--gov-blue)] text-[var(--gov-blue)]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar e Refazer a Simulação
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Calcula a porcentagem de progresso baseado na etapa atual
  const calcularProgresso = () => {
    const totalEtapas = 4; // 0 (inicial), 1, 2, 3 e 4 (resultado)
    return ((etapaAtual) / totalEtapas) * 100;
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
        <div className="flex justify-between mt-2 text-xs text-[var(--gov-gray-dark)]">
          <span className={cn("font-medium", etapaAtual >= 0 ? "text-[var(--gov-blue)]" : "")}>Início</span>
          <span className={cn("font-medium", etapaAtual >= 1 ? "text-[var(--gov-blue)]" : "")}>Dados</span>
          <span className={cn("font-medium", etapaAtual >= 2 ? "text-[var(--gov-blue)]" : "")}>Valor</span>
          <span className={cn("font-medium", etapaAtual >= 3 ? "text-[var(--gov-blue)]" : "")}>Período</span>
          <span className={cn("font-medium", etapaAtual >= 4 ? "text-[var(--gov-blue)]" : "")}>Resultado</span>
        </div>
      </div>
      
      {/* Conteúdo da etapa atual */}
      {renderEtapa()}
    </div>
  );
}