import { useEffect, useState } from "react";

// Cria um objeto localStorage global para armazenar o estado
export interface DetectadoEstado {
  estado: string;
  ip: string;
  timestamp: number;
  detalhes?: {
    countryCode: string;
    regionName: string;
    regionCode: string;
  };
}

// Namespace para o localStorage
const LS_KEY = "app_geolocalizacao";

// Hook customizado para expor o estado de localização
export function useLocalizacao() {
  const [localizacao, setLocalizacao] = useState<DetectadoEstado | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Função para obter localização salva
  const obterLocalizacaoSalva = (): DetectadoEstado | null => {
    try {
      const savedData = localStorage.getItem(LS_KEY);
      if (!savedData) return null;
      
      const parsedData = JSON.parse(savedData) as DetectadoEstado;
      
      // Verificar se os dados não estão muito antigos (1 hora)
      const umaHoraEmMs = 60 * 60 * 1000;
      if (Date.now() - parsedData.timestamp > umaHoraEmMs) {
        console.log("Dados de localização expirados, detectando novamente");
        return null;
      }
      
      return parsedData;
    } catch (error) {
      console.error("Erro ao ler dados de localização salvos:", error);
      return null;
    }
  };

  // Função para salvar localização
  const salvarLocalizacao = (data: DetectadoEstado) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setLocalizacao(data);
    } catch (error) {
      console.error("Erro ao salvar dados de localização:", error);
    }
  };

  // Função para detectar localização pelo IP
  const detectarLocalizacao = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      // Verificar se já existe uma localização salva
      const localizacaoSalva = obterLocalizacaoSalva();
      if (localizacaoSalva) {
        console.log("Usando dados de localização salvos:", localizacaoSalva);
        setLocalizacao(localizacaoSalva);
        setCarregando(false);
        return;
      }
      
      // Se não tiver dados salvos, fazer a consulta na API
      console.log("Detectando localização do IP via API...");
      const response = await fetch('/api/detectar-estado');
      
      if (!response.ok) {
        throw new Error(`Erro ao detectar localização: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Localização detectada:", data);
      
      // Adicionar timestamp para controle de expiração
      const localizacaoDetectada: DetectadoEstado = {
        ...data,
        timestamp: Date.now()
      };
      
      // Salvar no localStorage e no estado
      salvarLocalizacao(localizacaoDetectada);
      setCarregando(false);
      
    } catch (error) {
      console.error("Erro na detecção de localização:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
      setCarregando(false);
      
      // Em caso de erro, tentar usar um estado padrão
      setLocalizacao({
        estado: "São Paulo",
        ip: "desconhecido",
        timestamp: Date.now()
      });
    }
  };

  // Iniciar a detecção quando o componente montar
  useEffect(() => {
    detectarLocalizacao();
  }, []);

  return { 
    localizacao, 
    carregando, 
    erro, 
    detectarNovamente: detectarLocalizacao 
  };
}

// Componente para detectar e armazenar informações de localização
export default function LocalizacaoDetector() {
  const { localizacao, carregando, erro } = useLocalizacao();
  
  // Este componente não renderiza nada visualmente, apenas detecta a localização
  return null;
}