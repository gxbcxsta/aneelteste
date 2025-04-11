import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

enum EtapaVerificacao {
  NOME = 0,
  ANO_NASCIMENTO = 1,
  COMPANHIA_ELETRICA = 2,
}

// Definir o esquema de validação para o formulário
const nomeSchema = z.object({
  nome: z.string().min(1, "Selecione uma opção"),
});

const anoSchema = z.object({
  ano: z.string().min(1, "Selecione uma opção"),
});

const companhiaSchema = z.object({
  companhia: z.string().min(1, "Selecione uma opção"),
});

type NomeFormValues = z.infer<typeof nomeSchema>;
type AnoFormValues = z.infer<typeof anoSchema>;
type CompanhiaFormValues = z.infer<typeof companhiaSchema>;

// Lista de companhias elétricas por estado (atualizada para 2025)
const companhiasEletricas: Record<string, string[]> = {
  // Região Norte
  "Acre": ["Energisa Acre"],
  "Amapá": ["Equatorial CEA"],
  "Amazonas": ["Amazonas Energia"],
  "Pará": ["Equatorial Pará"],
  "Rondônia": ["Energisa Rondônia"],
  "Roraima": ["Roraima Energia"],
  "Tocantins": ["Energisa Tocantins"],
  
  // Região Nordeste
  "Alagoas": ["Equatorial Alagoas"],
  "Bahia": ["Neoenergia Coelba"],
  "Ceará": ["Enel Distribuição Ceará"],
  "Maranhão": ["Equatorial Maranhão"],
  "Paraíba": ["Energisa Paraíba"],
  "Pernambuco": ["Neoenergia Pernambuco"],
  "Piauí": ["Equatorial Piauí"],
  "Rio Grande do Norte": ["Neoenergia Cosern"],
  "Sergipe": ["Energisa Sergipe"],
  
  // Região Centro-Oeste
  "Distrito Federal": ["Neoenergia Brasília"],
  "Goiás": ["Equatorial Goiás"],
  "Mato Grosso": ["Energisa Mato Grosso"],
  "Mato Grosso do Sul": ["Energisa Mato Grosso do Sul"],
  
  // Região Sudeste
  "Espírito Santo": ["EDP Espírito Santo"],
  "Minas Gerais": ["CEMIG Distribuição"],
  "Rio de Janeiro": ["Enel Distribuição Rio", "Light S/A"],
  "São Paulo": [
    "Enel Distribuição São Paulo",
    "EDP São Paulo",
    "CPFL Paulista",
    "CPFL Piratininga",
    "Neoenergia Elektro",
    "ISA Energia Brasil"
  ],
  
  // Região Sul
  "Paraná": ["COPEL Distribuição"],
  "Rio Grande do Sul": ["CPFL Rio Grande Energia (RGE)", "Equatorial CEEE"],
  "Santa Catarina": ["CELESC Distribuição"]
};

export default function ConfirmarIdentidade() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ cpf: string }>("/confirmar-identidade/:cpf");
  const cpf = params?.cpf || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [etapaAtual, setEtapaAtual] = useState<EtapaVerificacao>(EtapaVerificacao.NOME);
  const [dadosPessoais, setDadosPessoais] = useState<any>(null);
  const [opcoesNome, setOpcoesNome] = useState<string[]>([]);
  const [opcoesAno, setOpcoesAno] = useState<string[]>([]);
  const [opcoesCompanhia, setOpcoesCompanhia] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [estado, setEstado] = useState<string>("");
  const [companhiaCorreta, setCompanhiaCorreta] = useState<string>("");
  const [localizado, setLocalizado] = useState<boolean>(false);

  // Formulário para seleção de nome
  const nomeForm = useForm<NomeFormValues>({
    resolver: zodResolver(nomeSchema),
    defaultValues: {
      nome: "",
    },
  });

  // Formulário para seleção de ano
  const anoForm = useForm<AnoFormValues>({
    resolver: zodResolver(anoSchema),
    defaultValues: {
      ano: "",
    },
  });
  
  // Formulário para seleção de companhia elétrica
  const companhiaForm = useForm<CompanhiaFormValues>({
    resolver: zodResolver(companhiaSchema),
    defaultValues: {
      companhia: "",
    },
  });

  // Detectar estado por IP - vamos usar a API de geolocalização real
  // E implementar um fallback mais inteligente caso não consiga detectar
  const detectarEstadoPorIP = async () => {
    try {
      console.log("Detectando estado por IP...");
      
      // Tentar obter o estado real através da API de geolocalização
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Mapear o código do estado para o nome completo
      const mapeamentoEstados: Record<string, string> = {
        "SP": "São Paulo",
        "RJ": "Rio de Janeiro",
        "RS": "Rio Grande do Sul",
        "MG": "Minas Gerais",
        "ES": "Espírito Santo",
        "BA": "Bahia",
        "CE": "Ceará",
        "PE": "Pernambuco",
        "GO": "Goiás",
        "MT": "Mato Grosso",
        "MS": "Mato Grosso do Sul",
        "SC": "Santa Catarina",
        "PR": "Paraná",
        "PA": "Pará",
        "AM": "Amazonas",
        "AC": "Acre",
        "AP": "Amapá",
        "RO": "Rondônia",
        "RR": "Roraima",
        "TO": "Tocantins",
        "AL": "Alagoas",
        "MA": "Maranhão",
        "PB": "Paraíba",
        "PI": "Piauí",
        "RN": "Rio Grande do Norte",
        "SE": "Sergipe",
        "DF": "Distrito Federal"
      };
      
      // Obter o estado real com base no IP
      const estadoSigla = data.region_code;
      let estadoDetectado = mapeamentoEstados[estadoSigla];
      
      // Se temos um estado válido detectado, use-o
      if (estadoDetectado && Object.keys(companhiasEletricas).includes(estadoDetectado)) {
        console.log(`Estado detectado: ${estadoDetectado}`);
        setEstado(estadoDetectado);
        setLocalizado(true);
        return estadoDetectado;
      } else {
        // Se não conseguimos detectar o estado, usar Minas Gerais como fallback
        console.log("Não foi possível detectar o estado, usando Minas Gerais como padrão");
        setEstado("Minas Gerais");
        setLocalizado(true);
        return "Minas Gerais";
      }
    } catch (error) {
      console.error("Erro ao detectar localização:", error);
      // Por padrão, usamos Minas Gerais se houver erro
      console.log("Erro na detecção, usando Minas Gerais como padrão");
      setEstado("Minas Gerais");
      setLocalizado(true);
      return "Minas Gerais";
    }
  };

  useEffect(() => {
    if (!cpf) {
      navigate("/verificar");
      return;
    }

    // Detectar localização do usuário
    detectarEstadoPorIP();

    // Carregar dados do CPF
    const fetchCpfData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/consulta-cpf?cpf=${cpf}`);
        if (!response.ok) {
          throw new Error("Erro ao consultar CPF");
        }
        const data = await response.json();
        setDadosPessoais(data);
        
        // Preparar opções de nome
        const nomeCorreto = data.Result.NomePessoaFisica;
        const nomesAlternativos = [
          "MÔNICA DE SOUZA ALVES",
          "VINICIUS CESAR FILHO"
        ];
        
        let opcoes = [...nomesAlternativos];
        if (!opcoes.includes(nomeCorreto)) {
          opcoes = opcoes.slice(0, 2);
          opcoes.push(nomeCorreto);
        }
        
        // Embaralhar os nomes
        const embaralharArray = (array: string[]): string[] => {
          const arrayCopia = [...array];
          for (let i = arrayCopia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayCopia[i], arrayCopia[j]] = [arrayCopia[j], arrayCopia[i]];
          }
          return arrayCopia;
        };
        
        setOpcoesNome(embaralharArray(opcoes));
        
        // Preparar opções de ano
        const dataNascimento = data.Result.DataNascimento;
        const anoCorreto = getAnoNascimento(dataNascimento);
        
        const gerarAnoAleatorio = () => {
          const anoCorretoNum = parseInt(anoCorreto);
          const variacao = Math.floor(Math.random() * 15) + 1; // Variação de 1 a 15 anos
          const sinal = Math.random() > 0.5 ? 1 : -1;
          return (anoCorretoNum + variacao * sinal).toString();
        };
        
        // Gerar 2 anos aleatórios diferentes
        const anosAleatorios: string[] = [];
        while (anosAleatorios.length < 2) {
          const anoAleatorio = gerarAnoAleatorio();
          if (!anosAleatorios.includes(anoAleatorio) && anoAleatorio !== anoCorreto) {
            anosAleatorios.push(anoAleatorio);
          }
        }
        
        // Adicionar o ano correto e embaralhar
        setOpcoesAno(embaralharArray([...anosAleatorios, anoCorreto]));
        
      } catch (error) {
        console.error("Erro ao buscar dados do CPF:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar o CPF. Tente novamente mais tarde.",
          variant: "destructive",
        });
        navigate("/verificar");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCpfData();
  }, [cpf, navigate, toast]);

  // Extrair o ano da data de nascimento
  const getAnoNascimento = (dataStr: string): string => {
    if (!dataStr) return "";
    
    // Verificar se é uma data no formato ISO completo
    if (dataStr.includes("T")) {
      const dataObj = new Date(dataStr);
      if (isNaN(dataObj.getTime())) return "";
      return dataObj.getFullYear().toString();
    }
    
    // Formato YYYY-MM-DD simples
    return dataStr.split("-")[0];
  };

  // Transformar data no formato ISO para DD/MM/YYYY
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    
    // Verificar se é uma data no formato ISO completo
    if (dataStr.includes("T")) {
      const dataObj = new Date(dataStr);
      if (isNaN(dataObj.getTime())) return dataStr;
      
      return `${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}/${dataObj.getFullYear()}`;
    }
    
    // Formato YYYY-MM-DD simples
    const partes = dataStr.split("-");
    if (partes.length !== 3) return dataStr;
    
    return `${partes[2].substring(0, 2)}/${partes[1]}/${partes[0]}`;
  };

  // Lidar com o envio do formulário de nome
  const onSubmitNome = (values: NomeFormValues) => {
    const nomeCorreto = dadosPessoais?.Result?.NomePessoaFisica || "";
    
    if (values.nome === nomeCorreto) {
      setEtapaAtual(EtapaVerificacao.ANO_NASCIMENTO);
    } else {
      toast({
        title: "Nome incorreto",
        description: "Por favor, selecione seu nome correto.",
        variant: "destructive",
      });
    }
  };

  // Função para embaralhar arrays
  const embaralharArray = (array: string[]): string[] => {
    const arrayCopia = [...array];
    for (let i = arrayCopia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopia[i], arrayCopia[j]] = [arrayCopia[j], arrayCopia[i]];
    }
    return arrayCopia;
  };
  
  // Função para gerar opções de companhia elétrica com base no estado
  const gerarOpcoesCompanhia = (estadoSelecionado: string) => {
    console.log(`Gerando opções de companhia para: ${estadoSelecionado}`);
    setEstado(estadoSelecionado);
    
    // Buscar a(s) companhia(s) correta(s) para o estado
    const companhiasDoEstado = companhiasEletricas[estadoSelecionado] || [];
    
    // CASO 1: SÃO PAULO - mostrar todas as 6 companhias, qualquer uma é válida
    if (estadoSelecionado === "São Paulo") {
      console.log("Caso São Paulo: 6 opções, todas válidas");
      // São Paulo tem 6 opções, todas são corretas
      setOpcoesCompanhia(companhiasDoEstado);
      // Qualquer uma será válida, mas definimos uma por padrão
      setCompanhiaCorreta(companhiasDoEstado[0]);
      return;
    }
    
    // CASO 2: RIO DE JANEIRO - mostrar as 2 companhias do estado + 1 aleatória
    if (estadoSelecionado === "Rio de Janeiro") {
      console.log("Caso Rio de Janeiro: 2 opções reais + 1 aleatória");
      
      // Buscar uma companhia aleatória de outro estado
      const todosEstados = Object.keys(companhiasEletricas).filter(e => e !== "Rio de Janeiro");
      const estadoAleatorio = todosEstados[Math.floor(Math.random() * todosEstados.length)];
      const companhiasAleatorias = companhiasEletricas[estadoAleatorio];
      const companhiaAleatoria = companhiasAleatorias[0];
      
      // Adicionar a companhia aleatória junto com as do RJ
      const opcoes = [...companhiasDoEstado, companhiaAleatoria];
      
      // Embaralhar e definir as opções
      setOpcoesCompanhia(embaralharArray(opcoes));
      // Qualquer companhia do RJ é válida
      setCompanhiaCorreta(companhiasDoEstado[0]);
      return;
    }
    
    // CASO 3: RIO GRANDE DO SUL - mostrar as 2 companhias do estado + 1 aleatória
    if (estadoSelecionado === "Rio Grande do Sul") {
      console.log("Caso Rio Grande do Sul: 2 opções reais + 1 aleatória");
      
      // Buscar uma companhia aleatória de outro estado
      const todosEstados = Object.keys(companhiasEletricas).filter(e => e !== "Rio Grande do Sul");
      const estadoAleatorio = todosEstados[Math.floor(Math.random() * todosEstados.length)];
      const companhiasAleatorias = companhiasEletricas[estadoAleatorio];
      const companhiaAleatoria = companhiasAleatorias[0];
      
      // Adicionar a companhia aleatória junto com as do RS
      const opcoes = [...companhiasDoEstado, companhiaAleatoria];
      
      // Embaralhar e definir as opções
      setOpcoesCompanhia(embaralharArray(opcoes));
      // Qualquer companhia do RS é válida
      setCompanhiaCorreta(companhiasDoEstado[0]);
      return;
    }
    
    // CASO 4: OUTROS ESTADOS - mostrar 1 companhia correta do estado + 2 aleatórias
    console.log("Caso padrão: 1 opção correta + 2 aleatórias");
    if (companhiasDoEstado.length > 0) {
      const companhiaCorretaEstado = companhiasDoEstado[0];
      setCompanhiaCorreta(companhiaCorretaEstado);
      
      // Buscar 2 companhias aleatórias de outros estados
      const todosEstados = Object.keys(companhiasEletricas);
      const estadosComExcecao = todosEstados.filter(e => e !== estadoSelecionado);
      
      const companhiasAleatorias: string[] = [];
      while (companhiasAleatorias.length < 2 && estadosComExcecao.length > 0) {
        const estadoAleatorioIndex = Math.floor(Math.random() * estadosComExcecao.length);
        const estadoAleatorio = estadosComExcecao[estadoAleatorioIndex];
        
        const companhiasEstadoAleatorio = companhiasEletricas[estadoAleatorio] || [];
        if (companhiasEstadoAleatorio.length > 0) {
          const companhiaAleatoria = companhiasEstadoAleatorio[0];
          if (!companhiasAleatorias.includes(companhiaAleatoria)) {
            companhiasAleatorias.push(companhiaAleatoria);
          }
        }
        
        // Remover este estado para não reutilizá-lo
        estadosComExcecao.splice(estadoAleatorioIndex, 1);
      }
      
      // Embaralhar as opções
      const opcoes = [companhiaCorretaEstado, ...companhiasAleatorias];
      setOpcoesCompanhia(embaralharArray(opcoes));
    }
  };

  // Lidar com o envio do formulário de ano
  const onSubmitAno = async (values: AnoFormValues) => {
    const dataNascimento = dadosPessoais?.Result?.DataNascimento || "";
    const anoCorreto = getAnoNascimento(dataNascimento);
    
    if (values.ano === anoCorreto) {
      // Verificar se já temos o estado detectado ou precisamos detectar novamente
      let estadoSelecionado = estado;
      if (!localizado) {
        // Se não temos o estado ainda, detectar por IP
        estadoSelecionado = await detectarEstadoPorIP();
      }
      
      console.log("Utilizando estado:", estadoSelecionado);
      
      // Gerar opções de companhia com base no estado
      gerarOpcoesCompanhia(estadoSelecionado);
      
      // Avançar para a próxima etapa
      setEtapaAtual(EtapaVerificacao.COMPANHIA_ELETRICA);
    } else {
      toast({
        title: "Ano incorreto",
        description: "Por favor, selecione o ano correto do seu nascimento.",
        variant: "destructive",
      });
    }
  };
  
  // Lidar com o envio do formulário de companhia elétrica
  const onSubmitCompanhia = (values: CompanhiaFormValues) => {
    // Para SP, RJ e RS, qualquer companhia do estado é considerada correta
    // Para outros estados, somente a companhia específica é correta
    const companhiaSelecionadaEhValida = () => {
      if (estado === "São Paulo" || estado === "Rio de Janeiro" || estado === "Rio Grande do Sul") {
        // Para estes estados, qualquer opção do array de companhias do estado é válida
        const companhiasDoEstado = companhiasEletricas[estado] || [];
        return companhiasDoEstado.includes(values.companhia);
      } else {
        // Para outros estados, tem que ser a companhia correta específica
        return values.companhia === companhiaCorreta;
      }
    };
    
    if (companhiaSelecionadaEhValida()) {
      // Extrair dados para a próxima etapa
      const nome = dadosPessoais?.Result?.NomePessoaFisica || "";
      const dataNasc = formatarData(dadosPessoais?.Result?.DataNascimento || "");
      
      const params = new URLSearchParams();
      params.append("cpf", cpf);
      params.append("nome", nome);
      params.append("nasc", dataNasc);
      params.append("estado", estado);
      // Usar a companhia selecionada pelo usuário ao invés da "companhiaCorreta"
      params.append("companhia", values.companhia);
      
      // Navegar para a página de resultado
      navigate(`/resultado?${params.toString()}`);
    } else {
      toast({
        title: "Companhia incorreta",
        description: "Por favor, selecione a companhia elétrica correta para o seu estado.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-[#f0f2f5] py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-md">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-6">
                <CardTitle className="text-2xl font-bold">Confirmação de Identidade</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Para confirmar sua identidade, precisamos validar alguns dados pessoais.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">

                  {etapaAtual === EtapaVerificacao.NOME && (
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                        Selecione o seu nome completo entre as opções abaixo:
                      </h2>
                      
                      <Form {...nomeForm}>
                        <form onSubmit={nomeForm.handleSubmit(onSubmitNome)} className="space-y-4">
                          <FormField
                            control={nomeForm.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="space-y-3"
                                  >
                                    {opcoesNome.map((nome, index) => (
                                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                                        <RadioGroupItem value={nome} id={`nome-${index}`} />
                                        <Label htmlFor={`nome-${index}`} className="flex-1 cursor-pointer">
                                          {nome}
                                        </Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="text-center mt-6">
                            <Button 
                              type="submit"
                              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex items-center justify-center w-full py-3"
                              disabled={isLoading || !nomeForm.watch("nome")}
                            >
                              <span>Prosseguir</span>
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}

                  {etapaAtual === EtapaVerificacao.ANO_NASCIMENTO && (
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                        Agora, selecione o ano do seu nascimento entre as opções abaixo:
                      </h2>
                      
                      <Form {...anoForm}>
                        <form onSubmit={anoForm.handleSubmit(onSubmitAno)} className="space-y-4">
                          <FormField
                            control={anoForm.control}
                            name="ano"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="space-y-3"
                                  >
                                    {opcoesAno.map((ano, index) => (
                                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                                        <RadioGroupItem value={ano} id={`ano-${index}`} />
                                        <Label htmlFor={`ano-${index}`} className="flex-1 cursor-pointer">
                                          {ano}
                                        </Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="text-center mt-6">
                            <Button 
                              type="submit"
                              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex items-center justify-center w-full py-3"
                              disabled={isLoading || !anoForm.watch("ano")}
                            >
                              <span>Prosseguir</span>
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                  
                  {etapaAtual === EtapaVerificacao.COMPANHIA_ELETRICA && (
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                        Agora, selecione a sua companhia elétrica entre as opções abaixo:
                      </h2>
                      
                      <Form {...companhiaForm}>
                        <form onSubmit={companhiaForm.handleSubmit(onSubmitCompanhia)} className="space-y-4">
                          <FormField
                            control={companhiaForm.control}
                            name="companhia"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="space-y-3"
                                  >
                                    {opcoesCompanhia.map((companhia, index) => (
                                      <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                                        <RadioGroupItem value={companhia} id={`companhia-${index}`} />
                                        <Label htmlFor={`companhia-${index}`} className="flex-1 cursor-pointer">
                                          {companhia}
                                        </Label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="text-center mt-6">
                            <Button 
                              type="submit"
                              className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex items-center justify-center w-full py-3"
                              disabled={isLoading || !companhiaForm.watch("companhia")}
                            >
                              <span>Prosseguir</span>
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}

                  {/* Requisitos de segurança */}
                  <div className="mt-8 bg-[var(--gov-gray-light)] p-4 rounded-md border border-[var(--gov-gray)]">
                    <h3 className="text-[var(--gov-blue-dark)] font-semibold mb-2">Informações de Segurança:</h3>
                    <ul className="text-sm text-[var(--gov-gray-dark)] space-y-2">
                      <li>• Seus dados são protegidos e criptografados.</li>
                      <li>• A consulta é feita nos sistemas oficiais da Receita Federal.</li>
                      <li>• É necessário confirmar sua identidade para prosseguir.</li>
                      <li>• Não compartilhamos seus dados com terceiros.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}