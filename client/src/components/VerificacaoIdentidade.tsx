import { useState, useEffect } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface DadosPessoais {
  Result: {
    NumeroCpf: string;
    NomePessoaFisica: string;
    DataNascimento: string;
  };
}

interface VerificacaoIdentidadeProps {
  dadosPessoais: DadosPessoais;
  onClose: () => void;
  onSuccess: (dados: any) => void;
}

enum EtapaVerificacao {
  ANO_NASCIMENTO = 0,
  NOME = 1,
  CONFIRMACAO = 2
}

export default function VerificacaoIdentidade({ dadosPessoais, onClose, onSuccess }: VerificacaoIdentidadeProps) {
  const [etapaAtual, setEtapaAtual] = useState<EtapaVerificacao>(EtapaVerificacao.ANO_NASCIMENTO);
  const [anoSelecionado, setAnoSelecionado] = useState<string>("");
  const [nomeSelecionado, setNomeSelecionado] = useState<string>("");
  const [opcoesAno, setOpcoesAno] = useState<string[]>([]);
  const [opcoesNome, setOpcoesNome] = useState<string[]>([]);
  const [estado, setEstado] = useState<string>("");
  const [companhiaEletrica, setCompanhiaEletrica] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);

  // Extrair dados do objeto de resposta
  const nomeCompleto = dadosPessoais.Result.NomePessoaFisica;
  const dataNascimento = dadosPessoais.Result.DataNascimento;
  
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
  
  // Extrair ano da data de nascimento
  const getAnoDaNascimento = (): string => {
    if (!dataNascimento) return "";
    
    // Verificar se é uma data no formato ISO completo
    if (dataNascimento.includes("T")) {
      const dataObj = new Date(dataNascimento);
      if (isNaN(dataObj.getTime())) return "";
      return dataObj.getFullYear().toString();
    }
    
    // Formato YYYY-MM-DD simples
    return dataNascimento.split("-")[0];
  };

  // Criar opções de ano aleatórias, incluindo o ano correto
  useEffect(() => {
    const anoCorreto = getAnoDaNascimento();
    if (!anoCorreto) return;
    
    // Gerar anos aleatórios diferentes do ano correto
    const gerarAnoAleatorio = () => {
      const anoCorretoNum = parseInt(anoCorreto);
      const variacao = Math.floor(Math.random() * 15) + 1; // Variação de 1 a 15 anos
      const sinal = Math.random() > 0.5 ? 1 : -1;
      return (anoCorretoNum + variacao * sinal).toString();
    };
    
    // Gerar 3 anos aleatórios diferentes
    const anosAleatorios: string[] = [];
    while (anosAleatorios.length < 3) {
      const anoAleatorio = gerarAnoAleatorio();
      if (!anosAleatorios.includes(anoAleatorio) && anoAleatorio !== anoCorreto) {
        anosAleatorios.push(anoAleatorio);
      }
    }
    
    // Adicionar o ano correto e embaralhar
    const opcoes = [...anosAleatorios, anoCorreto];
    setOpcoesAno(embaralharArray(opcoes));
  }, [dataNascimento]);

  // Criar opções de nome, incluindo o nome correto
  useEffect(() => {
    if (!nomeCompleto) return;
    
    // Gerar nomes aleatórios
    const nomesCensurados = [
      "P**** A****** D* S****",
      "J*** C***** A*****",
      "M**** D* L****** S******"
    ];
    
    // Censurar o nome real, mantendo apenas as primeiras letras
    const censurarNome = (nome: string): string => {
      return nome.split(' ').map(palavra => 
        palavra.charAt(0) + palavra.slice(1).replace(/[a-zA-Z]/g, '*')
      ).join(' ');
    };
    
    // Adicionar o nome censurado correto
    const nomeCensuradoCorreto = censurarNome(nomeCompleto);
    let opcoes = [...nomesCensurados];
    
    // Garantir que não estamos duplicando padrões de censura
    if (!opcoes.includes(nomeCensuradoCorreto)) {
      opcoes = opcoes.slice(0, 2);
      opcoes.push(nomeCensuradoCorreto);
    }
    
    setOpcoesNome(embaralharArray(opcoes));
  }, [nomeCompleto]);

  // Detectar localização e definir estado e companhia elétrica
  useEffect(() => {
    const detectarLocalizacao = async () => {
      try {
        // Usar API de geolocalização por IP - mais confiável que a API do navegador
        const response = await fetch('https://ipapi.co/json/');
        
        if (response.ok) {
          const data = await response.json();
          
          // Verificar se estamos no Brasil
          if (data.country === 'BR') {
            // Mapeamento das siglas de estados para nomes completos
            const mapaEstados: Record<string, string> = {
              'AC': 'Acre',
              'AL': 'Alagoas',
              'AP': 'Amapá',
              'AM': 'Amazonas',
              'BA': 'Bahia',
              'CE': 'Ceará',
              'DF': 'Distrito Federal',
              'ES': 'Espírito Santo',
              'GO': 'Goiás',
              'MA': 'Maranhão',
              'MT': 'Mato Grosso',
              'MS': 'Mato Grosso do Sul',
              'MG': 'Minas Gerais',
              'PA': 'Pará',
              'PB': 'Paraíba',
              'PR': 'Paraná',
              'PE': 'Pernambuco',
              'PI': 'Piauí',
              'RJ': 'Rio de Janeiro',
              'RN': 'Rio Grande do Norte',
              'RS': 'Rio Grande do Sul',
              'RO': 'Rondônia',
              'RR': 'Roraima',
              'SC': 'Santa Catarina',
              'SP': 'São Paulo',
              'SE': 'Sergipe',
              'TO': 'Tocantins'
            };
            
            // Obter o nome completo do estado a partir da sigla
            const estadoDetectado = mapaEstados[data.region_code] || 'São Paulo';
            console.log("Estado detectado pelo IP:", estadoDetectado);
            
            // Definir o estado e a companhia elétrica correspondente
            setEstado(estadoDetectado);
            setCompanhiaEletrica(getCompanhiaPorEstado(estadoDetectado));
          } else {
            // Se não estiver no Brasil, usar São Paulo como padrão
            setEstado("São Paulo");
            setCompanhiaEletrica("Enel Distribuição São Paulo");
          }
        } else {
          // Em caso de erro na API, tentar com a geolocalização do navegador como fallback
          usarGeolocalizacaoNavegador();
        }
      } catch (error) {
        console.error("Erro ao detectar localização por IP:", error);
        // Em caso de erro, tentar com a geolocalização do navegador
        usarGeolocalizacaoNavegador();
      }
    };
    
    // Função para tentar usar a geolocalização do navegador como método secundário
    const usarGeolocalizacaoNavegador = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Usando uma API pública para reverter geocodificação
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              
              if (response.ok) {
                const data = await response.json();
                // Extrair o estado e definir
                if (data.address && data.address.state) {
                  const estadoDetectado = data.address.state;
                  setEstado(estadoDetectado);
                  
                  // Definir companhia com base no estado
                  setCompanhiaEletrica(getCompanhiaPorEstado(estadoDetectado));
                } else {
                  // Fallback para SP como padrão
                  setEstado("São Paulo");
                  setCompanhiaEletrica("Enel Distribuição São Paulo");
                }
              } else {
                // Fallback para SP como padrão
                setEstado("São Paulo");
                setCompanhiaEletrica("Enel Distribuição São Paulo");
              }
            } catch (error) {
              console.error("Erro ao reverter geocodificação:", error);
              // Fallback para SP como padrão
              setEstado("São Paulo");
              setCompanhiaEletrica("Enel Distribuição São Paulo");
            }
          },
          (error) => {
            console.error("Erro ao obter localização pelo navegador:", error);
            // Fallback para SP como padrão
            setEstado("São Paulo");
            setCompanhiaEletrica("Enel Distribuição São Paulo");
          }
        );
      } else {
        console.log("Geolocalização não suportada pelo navegador");
        // Fallback para SP como padrão
        setEstado("São Paulo");
        setCompanhiaEletrica("Enel Distribuição São Paulo");
      }
    };
    
    // Iniciar o processo de detecção de localização
    detectarLocalizacao();
  }, []);

  // Mapear estados para suas concessionárias (alguns estados têm múltiplas)
  const getCompanhiasPorEstado = (estado: string): string[] => {
    // Mapeamento atual baseado na lista fornecida para 2025
    const mapeamentoCompanhias: Record<string, string[]> = {
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
    
    return mapeamentoCompanhias[estado] || ["Empresa não identificada"];
  };

  // Obter a primeira companhia elétrica para um estado (para compatibilidade)
  const getCompanhiaPorEstado = (estado: string): string => {
    const companhias = getCompanhiasPorEstado(estado);
    return companhias[0];
  };

  // Estados brasileiros para o select
  const estados = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];

  // Função para embaralhar array
  const embaralharArray = <T,>(array: T[]): T[] => {
    const arrayCopia = [...array];
    for (let i = arrayCopia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopia[i], arrayCopia[j]] = [arrayCopia[j], arrayCopia[i]];
    }
    return arrayCopia;
  };

  // Verificar se o ano selecionado está correto
  const verificarAno = () => {
    if (anoSelecionado === getAnoDaNascimento()) {
      setEtapaAtual(EtapaVerificacao.NOME);
    } else {
      // Feedback de erro
      alert("Ano de nascimento incorreto. Por favor, tente novamente.");
    }
  };

  // Verificar se o nome selecionado está correto
  const verificarNome = () => {
    const nomeCensurado = nomeSelecionado;
    const nomeCorreto = nomeCompleto.split(' ').map(palavra => 
      palavra.charAt(0) + palavra.slice(1).replace(/[a-zA-Z]/g, '*')
    ).join(' ');
    
    if (nomeCensurado === nomeCorreto) {
      setEtapaAtual(EtapaVerificacao.CONFIRMACAO);
    } else {
      // Feedback de erro
      alert("Nome incorreto. Por favor, tente novamente.");
    }
  };

  // Lidar com a mudança de estado
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoEstado = e.target.value;
    setEstado(novoEstado);
    
    // Obter a lista de companhias para este estado
    const companhias = getCompanhiasPorEstado(novoEstado);
    
    // Se há apenas uma companhia, selecioná-la automaticamente
    if (companhias.length === 1) {
      setCompanhiaEletrica(companhias[0]);
    } else {
      // Se houver múltiplas opções, seleciona a primeira por padrão
      // O usuário pode mudar depois no dropdown
      setCompanhiaEletrica(companhias[0]);
    }
  };
  
  // Lidar com a mudança de companhia elétrica
  const handleCompanhiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanhiaEletrica(e.target.value);
  };

  // Concluir a verificação
  // Configuração do contador regressivo e redirecionamento automático
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;
    
    if (etapaAtual === EtapaVerificacao.CONFIRMACAO) {
      // Reset do contador quando chegar à etapa de confirmação
      setCountdown(5);
      
      // Temporizador para decrementar o contador a cada segundo
      countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Temporizador para redirecionar após 5 segundos
      timer = setTimeout(() => {
        onSuccess({
          nome: nomeCompleto,
          dataNascimento: formatarData(dataNascimento),
          estado,
          companhia: companhiaEletrica
        });
      }, 5000);
    }
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [etapaAtual]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--gov-blue-dark)]">
              {etapaAtual === EtapaVerificacao.ANO_NASCIMENTO && "Confirme sua identidade"}
              {etapaAtual === EtapaVerificacao.NOME && "Confirme sua identidade"}
              {etapaAtual === EtapaVerificacao.CONFIRMACAO && "Identidade Confirmada!"}
            </h2>
            
            {etapaAtual !== EtapaVerificacao.CONFIRMACAO && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Separator className="mb-4" />
          
          {/* Etapa 1: Verificação de Ano de Nascimento */}
          {etapaAtual === EtapaVerificacao.ANO_NASCIMENTO && (
            <>
              <p className="mb-4 text-[var(--gov-gray-dark)]">
                Qual é o seu ano de nascimento?
              </p>
              
              <RadioGroup value={anoSelecionado} onValueChange={setAnoSelecionado} className="space-y-3">
                {opcoesAno.map((ano, index) => (
                  <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value={ano} id={`ano-${index}`} />
                    <Label htmlFor={`ano-${index}`} className="flex-1 cursor-pointer">{ano}</Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={verificarAno} 
                className="w-full mt-6 bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)]"
                disabled={!anoSelecionado}
              >
                Próximo
              </Button>
            </>
          )}
          
          {/* Etapa 2: Verificação de Nome */}
          {etapaAtual === EtapaVerificacao.NOME && (
            <>
              <p className="mb-4 text-[var(--gov-gray-dark)]">
                Selecione o seu nome correto:
              </p>
              
              <RadioGroup value={nomeSelecionado} onValueChange={setNomeSelecionado} className="space-y-3">
                {opcoesNome.map((nome, index) => (
                  <div key={index} className="flex items-center space-x-2 border p-3 rounded-md">
                    <RadioGroupItem value={nome} id={`nome-${index}`} />
                    <Label htmlFor={`nome-${index}`} className="flex-1 cursor-pointer">{nome}</Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={verificarNome} 
                className="w-full mt-6 bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)]"
                disabled={!nomeSelecionado}
              >
                Verificar
              </Button>
            </>
          )}
          
          {/* Etapa 3: Confirmação e Dados Adicionais */}
          {etapaAtual === EtapaVerificacao.CONFIRMACAO && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-2">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-700">Identidade Confirmada!</h3>
                <p className="text-sm text-[var(--gov-gray-dark)]">
                  Agora você pode prosseguir com a consulta
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-[var(--gov-gray-dark)]">Nome:</label>
                  <p className="font-semibold text-[var(--gov-blue-dark)]">{nomeCompleto}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[var(--gov-gray-dark)]">Data de Nascimento:</label>
                  <p className="font-semibold text-[var(--gov-blue-dark)]">{formatarData(dataNascimento)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[var(--gov-gray-dark)]">Selecione seu estado:</label>
                  <select
                    value={estado}
                    onChange={handleEstadoChange}
                    className="w-full p-2 border rounded mt-1"
                  >
                    {estados.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[var(--gov-gray-dark)]">Companhia Elétrica:</label>
                  {getCompanhiasPorEstado(estado).length === 1 ? (
                    // Se há apenas uma companhia para este estado, apenas exibe o texto
                    <p className="font-semibold text-[var(--gov-blue-dark)]">{companhiaEletrica}</p>
                  ) : (
                    // Se há múltiplas companhias, exibe um select para escolha
                    <select
                      value={companhiaEletrica}
                      onChange={handleCompanhiaChange}
                      className="w-full p-2 border rounded mt-1"
                    >
                      {getCompanhiasPorEstado(estado).map((comp) => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center mt-4">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-blue-700 font-medium text-sm mt-2">
                    Preparando sua simulação...
                  </p>
                  <div className="w-32 bg-gray-200 h-1 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${100 - (100/5) * countdown}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}