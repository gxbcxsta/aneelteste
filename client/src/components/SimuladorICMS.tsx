import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Coins, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

// Validação para o valor médio da conta
const valorContaSchema = z.object({
  valorMedio: z.string().min(1, "Campo obrigatório"),
});

// Validação para o período
const periodoSchema = z.object({
  periodo: z.string().min(1, "Selecione um período"),
});

type ValorContaFormValues = z.infer<typeof valorContaSchema>;
type PeriodoFormValues = z.infer<typeof periodoSchema>;

interface SimuladorICMSProps {
  onSimulacaoConcluida?: (valor: number, meses: number) => void;
}

export default function SimuladorICMS({
  onSimulacaoConcluida
}: SimuladorICMSProps) {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [valorMedioFinal, setValorMedioFinal] = useState(0);
  const [mesesConsiderados, setMesesConsiderados] = useState(0);
  const [valorFinalRestituicao, setValorFinalRestituicao] = useState(0);
  const [valorRealRestituicao, setValorRealRestituicao] = useState(0);
  
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
  
  // Para a etapa de valor médio da conta
  const valorContaForm = useForm<ValorContaFormValues>({
    resolver: zodResolver(valorContaSchema),
    defaultValues: {
      valorMedio: "R$ 0,00"
    }
  });
  
  // Para a etapa de período
  const periodoForm = useForm<PeriodoFormValues>({
    resolver: zodResolver(periodoSchema),
    defaultValues: {
      periodo: "menos-12" // Definir um valor padrão para evitar erro de validação
    }
  });
  
  // Não precisamos mais do efeito para atualizar o valor médio
  
  // Submissão do formulário da etapa 2 (valor médio)
  const onSubmitValorConta = (data: ValorContaFormValues) => {
    // Extrai o valor numérico da string formatada
    const valorMedio = extrairValorNumerico(data.valorMedio);
    
    // Define o valor médio final
    setValorMedioFinal(valorMedio);
    
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
    let valorFinal = valorMinimo;
    if (valorMinimo > 5000) {
      valorFinal = 5000;
      setValorFinalRestituicao(5000);
      setValorRealRestituicao(valorMinimo);
    } else {
      valorFinal = valorMinimo;
      setValorFinalRestituicao(valorMinimo);
      setValorRealRestituicao(0); // Não há valor "real" adicional
    }
    
    // Notifica o componente pai sobre a conclusão (se existir callback)
    if (onSimulacaoConcluida) {
      onSimulacaoConcluida(valorFinal, meses);
    }
    
    // Avança para a próxima etapa
    proximaEtapa();
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
  
  // Progresso do wizard
  const renderProgresso = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        {[0, 1, 2, 3].map((etapa) => (
          <div key={etapa} className="flex flex-col items-center relative">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                etapa <= etapaAtual 
                  ? "bg-[var(--gov-blue)] text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {etapa < etapaAtual ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span>{etapa + 1}</span>
              )}
            </div>
            {etapa < 3 && (
              <div 
                className={`absolute top-4 w-full h-[2px] left-1/2 ${
                  etapa < etapaAtual ? "bg-[var(--gov-blue)]" : "bg-gray-200"
                }`}
                style={{ width: 'calc(100% - 2rem)' }}
              ></div>
            )}
            <span className={`text-xs mt-2 ${
              etapa <= etapaAtual ? "text-[var(--gov-blue-dark)] font-medium" : "text-gray-500"
            }`}>
              {etapa === 0 ? "Início" : 
               etapa === 1 ? "Valor" : 
               etapa === 2 ? "Período" : "Resultado"}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderiza a etapa atual do simulador
  const renderEtapa = () => {
    switch(etapaAtual) {
      case 0: // Etapa inicial
        return (
          <div className="text-center space-y-6 py-6">
            <Coins className="h-16 w-16 text-[var(--gov-yellow)] mx-auto animate-pulse" />
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)]">
              Vamos calcular quanto você pode receber de volta da sua conta de luz.
            </h2>
            <Button 
              onClick={proximaEtapa}
              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-semibold px-8 py-6 text-lg"
            >
              Iniciar simulação
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );
        
      case 1: // Etapa de valor médio da conta
        return (
          <Form {...valorContaForm}>
            <form onSubmit={valorContaForm.handleSubmit(onSubmitValorConta)} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Valor médio da conta
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
        
      case 2: // Etapa de período
        return (
          <Form {...periodoForm}>
            <form onSubmit={periodoForm.handleSubmit(onSubmitPeriodo)} className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                Período
              </h2>
              
              <FormField
                control={periodoForm.control}
                name="periodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">
                      Quantos meses você pagou essa média nos últimos 5 anos?
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-[var(--gov-gray)] focus:ring-[var(--gov-blue)]">
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
        
      case 3: // Resultado da simulação
        return (
          <div className="space-y-6 py-4">
            <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
              Resultado
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-[var(--gov-gray-dark)] mb-2">Valor estimado da sua restituição:</p>
              <div className="flex items-center justify-center">
                <Coins className="h-8 w-8 text-green-500 mr-2 animate-bounce" />
                <span className="text-3xl font-bold text-green-600">
                  {formatarMoeda(valorFinalRestituicao)}
                </span>
              </div>
              
              {valorRealRestituicao > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-sm">
                    <span role="img" aria-label="alerta" className="mr-1">🔴</span> Você tem direito a {formatarMoeda(valorRealRestituicao)}. Valores acima de R$ 5.000 são 
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
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Iniciar solicitação
              </Button>
              
              <Button
                type="button"
                onClick={voltarEtapa}
                variant="outline"
                className="w-full mt-4 border-[var(--gov-blue)] text-[var(--gov-blue)]"
              >
                Refazer simulação
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="max-w-3xl mx-auto">
        {renderProgresso()}
        {renderEtapa()}
      </div>
    </div>
  );
}