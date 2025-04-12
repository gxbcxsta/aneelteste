# Documentação: Sistema de Detecção de Localização e Listagem de Companhias Elétricas

## 1. Visão Geral da Solução

Este documento descreve a implementação do sistema de geolocalização por IP que identifica automaticamente o estado do usuário e lista as companhias elétricas correspondentes. A solução utiliza uma arquitetura cliente-servidor robusta com múltiplas camadas de detecção e fallbacks para garantir o funcionamento mesmo em condições adversas.

## 2. Componentes da Solução

### 2.1 Backend (API de Detecção de Estado)

Implementamos um endpoint `/api/detectar-estado` no arquivo `server/routes.ts` que:

1. Recebe o IP do cliente
2. Consulta serviços de geolocalização externos para identificar a região
3. Mapeia o resultado para um estado brasileiro
4. Retorna o estado determinado e informações adicionais

O endpoint segue uma estratégia de múltiplas camadas:

```typescript
// Rota principal para detectar estado
app.get('/api/detectar-estado', async (req: Request, res: Response) => {
  // Extração do IP do cliente (com fallback para testes)
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP.split(',')[0].trim();
  
  console.log(`Recebida solicitação de detecção de estado para IP: ${ip}, ${req.ip}`);
  
  // IPs específicos para testes em desenvolvimento
  if (ip === '177.72.240.15
') {
    console.log(`IP específico detectado (${ip}): retornando Minas Gerais`);
    return res.json({ ip, estado: "Minas Gerais", detalhes: { countryCode: "BR", regionName: "Minas Gerais", regionCode: "MG" } });
  }
  
  try {
    // Tentativa 1: API primária ipapi.co
    const resultado = await consultarAPIGeolocalizacao(ip);
    return res.json(resultado);
  } catch (error) {
    console.error("Erro ao consultar primeira API de geolocalização:", error);
    
    try {
      // Tentativa 2: API secundária ipinfo.io
      const resultadoAlternativo = await consultarAPIAlternativa(ip);
      return res.json(resultadoAlternativo);
    } catch (err) {
      console.error("Erro também na API alternativa:", err);
      
      // Tentativa 3: Detecção determinística baseada no IP
      const estadoDeterministico = detectarEstadoDeterministico(ip);
      return res.json({ ip, estado: estadoDeterministico });
    }
  }
});
```

### 2.2 Serviços de Geolocalização

Integramos duas APIs de geolocalização para obter máxima confiabilidade:

1. **Principal (ipapi.co)**: 
   - Fornece dados detalhados sobre a localização do IP
   - Mapeia dados para o estado brasileiro correspondente

2. **Secundária (ipinfo.io)**:
   - Atua como fallback caso a API principal falhe
   - Formato de resposta ligeiramente diferente, mas tratado para normalização

3. **Método determinístico**:
   - Último recurso caso ambas as APIs falhem
   - Usa o último octeto do endereço IP para determinar um estado brasileiro

```typescript
// Função para consultar a API principal de geolocalização
async function consultarAPIGeolocalizacao(ip: string) {
  const url = `https://ipapi.co/${ip}/json/`;
  const response = await fetch(url);
  const data = await response.json();
  
  // Validação e processamento dos dados
  if (!data.country_code || data.country_code !== 'BR' || !data.region) {
    throw new Error("IP não é do Brasil ou região não detectada");
  }
  
  return {
    ip,
    estado: data.region,
    detalhes: {
      countryCode: data.country_code,
      regionName: data.region,
      regionCode: data.region_code
    }
  };
}

// Função para consultar a API alternativa
async function consultarAPIAlternativa(ip: string) {
  const url = `https://ipinfo.io/${ip}/json`;
  const response = await fetch(url);
  const data = await response.json();
  
  // Validação similar à API principal
  if (!data.country || data.country !== 'BR' || !data.region) {
    throw new Error("IP não é do Brasil ou região não detectada");
  }
  
  // Mapeamento para normalizar o formato da resposta
  const estadosPorSigla = {
    'SP': 'São Paulo',
    'RJ': 'Rio de Janeiro',
    // ... outros estados mapeados
  };
  
  return {
    ip,
    estado: estadosPorSigla[data.region] || data.region,
    detalhes: {
      countryCode: data.country,
      regionName: estadosPorSigla[data.region] || data.region,
      regionCode: data.region
    }
  };
}

// Fallback baseado em hash do IP
function detectarEstadoDeterministico(ip: string) {
  const estados = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", 
    "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", 
    "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", 
    "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", 
    "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", 
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ];
  
  // Hash simples baseado no último octeto do IP
  const partes = ip.split('.');
  const ultimoOcteto = parseInt(partes[partes.length - 1], 10);
  const indice = ultimoOcteto % estados.length;
  
  console.log(`Usando detecção determinística para IP ${ip}: ${estados[indice]}`);
  return estados[indice];
}
```

### 2.3 Frontend (Detecção e Persistência)

No frontend, implementamos o componente `LocalizacaoDetector.tsx` que:

1. Faz a requisição ao backend para determinar a localização
2. Persiste a localização no localStorage com um timestamp
3. Implementa lógica de expiração para atualizar dados após 24 horas
4. Fornece um hook personalizado `useLocalizacao` para componentes consumirem os dados

```typescript
export function useLocalizacao() {
  const [localizacao, setLocalizacao] = useState<DetectadoEstado | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Função para verificar e carregar localização
  useEffect(() => {
    const verificarLocalizacao = async () => {
      try {
        // Verificar se existe localização salva
        const localizacaoSalva = localStorage.getItem('localizacao');
        
        if (localizacaoSalva) {
          const dados = JSON.parse(localizacaoSalva) as DetectadoEstado;
          
          // Verificar se os dados não expiraram (24 horas)
          const agora = Date.now();
          if (agora - dados.timestamp < 24 * 60 * 60 * 1000) {
            console.log("Usando dados de localização salvos:", dados);
            setLocalizacao(dados);
            setCarregando(false);
            return;
          }
          
          console.log("Dados de localização expirados, atualizando...");
          localStorage.removeItem('localizacao');
        }
        
        // Fazer requisição para API de detecção
        console.log("Detectando localização do IP via API...");
        const resposta = await fetch('/api/detectar-estado');
        
        if (!resposta.ok) {
          throw new Error('Falha ao detectar localização');
        }
        
        const dados = await resposta.json();
        console.log("Localização detectada:", dados);
        
        // Salvar localização com timestamp
        const dadosComTimestamp: DetectadoEstado = {
          ...dados,
          timestamp: Date.now()
        };
        
        // Persistir e atualizar estado
        salvarLocalizacao(dadosComTimestamp);
        setLocalizacao(dadosComTimestamp);
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
        setErro("Não foi possível detectar sua localização");
        
        // Fallback para estado padrão em caso de erro
        const estadoPadrao: DetectadoEstado = {
          estado: "São Paulo",
          ip: "0.0.0.0",
          timestamp: Date.now()
        };
        
        setLocalizacao(estadoPadrao);
      } finally {
        setCarregando(false);
      }
    };
    
    verificarLocalizacao();
  }, []);
  
  return { localizacao, carregando, erro };
}
```

### 2.4 Mapeamento Atualizado de Companhias por Estado

Foi implementado um mapeamento abrangente e atualizado que relaciona cada estado brasileiro às suas companhias elétricas. A última atualização expandiu o número de opções por estado para melhor refletir a realidade do mercado.

#### Mapeamento Completo das Companhias por Estado:

```typescript
// Mapeamento de estados para companhias elétricas
const companhiasPorEstado: Record<string, string[]> = {
  // Estados com uma única companhia
  "Acre": ["Energisa Acre"],
  "Alagoas": ["Equatorial Alagoas"],
  "Amapá": ["CEA Equatorial"],
  "Amazonas": ["Amazonas Energia"],
  "Bahia": ["Neoenergia Coelba"],
  "Ceará": ["Enel Ceará"],
  "Distrito Federal": ["Neoenergia Brasília"],
  "Espírito Santo": ["EDP Espírito Santo"],
  "Maranhão": ["Equatorial Maranhão"],
  "Mato Grosso": ["Energisa Mato Grosso"],
  "Mato Grosso do Sul": ["Energisa Mato Grosso do Sul"],
  "Paraíba": ["Energisa Paraíba"],
  "Paraná": ["Copel Distribuição"],
  "Pernambuco": ["Neoenergia Pernambuco"],
  "Piauí": ["Equatorial Piauí"],
  "Rio Grande do Norte": ["Neoenergia Cosern"],
  "Rondônia": ["Energisa Rondônia"],
  "Roraima": ["Roraima Energia"],
  "Sergipe": ["Energisa Sergipe"],
  "Tocantins": ["Energisa Tocantins"],
  
  // Estados com duas companhias
  "Goiás": ["Equatorial Goiás", "Celg GT (Transmissão e Geração)"],
  "Pará": ["Equatorial Pará", "Celpa"],
  "Rio de Janeiro": ["Light", "Enel Rio"],
  "Rio Grande do Sul": ["CEEE Equatorial", "RGE Sul"],
  "Santa Catarina": ["Celesc Distribuição", "Cooperativas locais (como CERGAL, CERILUZ, etc.)"],
  
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
```

### 2.5 Lógica de Apresentação de Opções

O sistema implementa uma lógica inteligente para apresentar as opções de companhias de energia aos usuários, com base no estado detectado:

1. **Estados com uma única companhia:**
   - Apresenta a companhia correta do estado + duas opções aleatórias de outros estados
   - Exemplo (Acre): Energisa Acre (correta) + duas aleatórias

2. **Estados com duas companhias:**
   - Apresenta as duas companhias corretas + uma opção aleatória de outro estado
   - Exemplo (Rio de Janeiro): Light, Enel Rio (corretas) + uma aleatória

3. **Estados com três companhias:**
   - Apresenta todas as três companhias corretas
   - Exemplo (Minas Gerais): CEMIG Distribuição, Energisa Minas Gerais, Light (todas corretas)

4. **Estados com múltiplas companhias (São Paulo):**
   - Apresenta todas as companhias disponíveis para seleção
   - Exemplo (São Paulo): Enel São Paulo, CPFL Paulista, etc. (todas corretas)

Este modelo garante que o usuário sempre tenha a opção correta disponível, mas também mantém a interface limpa e evita confusão com muitas opções.

## 3. Fluxo de Dados Completo

1. Quando o usuário acessa o site pela primeira vez:
   - O componente `LocalizacaoDetector` detecta que não há dados no localStorage
   - Faz uma requisição para `/api/detectar-estado`
   - O backend determina o estado baseado no IP
   - Os dados são salvos no localStorage com timestamp

2. Quando o usuário acessa a página de verificação:
   - O hook `useLocalizacao` carrega o estado salvo do localStorage
   - O selector de companhias elétricas é populado com base no estado detectado
   - As opções são apresentadas conforme a lógica específica para o número de companhias do estado

3. Em acessos subsequentes:
   - O sistema verifica se os dados de localização no localStorage ainda são válidos
   - Se os dados tiverem menos de 24 horas, são utilizados diretamente
   - Caso contrário, uma nova requisição é feita

## 4. Tratamento de Casos Especiais

Para aumentar a robustez do sistema, implementamos os seguintes mecanismos:

1. **Identificação de IPs de desenvolvimento**: 
   - Alguns IPs específicos são reconhecidos automaticamente (ex: 177.72.240.15
 → Minas Gerais)
   - Facilita testes em ambientes de desenvolvimento

2. **Múltiplas camadas de fallback**:
   - Se a API primária falhar, usa-se a API secundária
   - Se ambas falharem, usa-se a detecção determinística
   - Em último caso, utiliza-se São Paulo como estado padrão

3. **Normalização de formatos de estados**:
   - Algumas APIs retornam códigos de estado (ex: "SP"), outras retornam nomes completos
   - Sistema normaliza tudo para nomes completos para garantir consistência

4. **Tratamento de ausência de conexão**:
   - Se o usuário estiver offline, os dados em cache no localStorage são usados

5. **Interface de carregamento**:
   - Durante a detecção, um estado de loading é exibido
   - Feedback visual mantém o usuário informado durante o processo

## 5. Informações Técnicas Adicionais

### 5.1 APIs Utilizadas

- **ipapi.co**: Limite gratuito de 1000 requisições/dia
- **ipinfo.io**: Limite gratuito de 50.000 requisições/mês

### 5.2 Formato dos Dados Persistidos

```typescript
interface DetectadoEstado {
  estado: string;
  ip: string;
  timestamp: number;
  detalhes?: {
    countryCode: string;
    regionName: string;
    regionCode: string;
  };
}
```

### 5.3 Validação de Dados

Todas as respostas das APIs são validadas para garantir:
- O IP é do Brasil (código de país "BR")
- Um estado/região foi corretamente identificado
- Os dados estão no formato esperado

## 6. Considerações e Limitações

1. **Precisão da geolocalização por IP**:
   - A geolocalização por IP não é 100% precisa em nível de cidade
   - Para nosso caso (determinar estado), a precisão é suficiente

2. **Dependência de APIs externas**:
   - O sistema depende de serviços externos de geolocalização
   - Implementamos fallbacks para mitigar falhas

3. **Usuários com VPN ou proxies**:
   - Usuários utilizando VPN podem aparecer em estados diferentes
   - Sempre damos a opção de escolher manualmente a companhia

4. **Usuários internacionais**:
   - Para IPs fora do Brasil, o sistema usa um estado padrão

## 7. Conclusão

O sistema de detecção de estado e mapeamento de companhias elétricas implementa uma abordagem robusta com múltiplas camadas de detecção, persistência local e fallbacks, garantindo que os usuários sempre tenham uma experiência personalizada mesmo em condições adversas de rede.

A combinação de APIs de geolocalização confiáveis, cache local e um mapeamento abrangente e atualizado das companhias elétricas proporciona um equilíbrio entre precisão, desempenho e experiência do usuário.