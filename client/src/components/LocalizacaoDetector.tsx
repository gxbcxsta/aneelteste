import { useEffect, useState } from "react";
import { useUserData } from "@/contexts/UserContext";

// Interface para o objeto de estado detectado
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

  // Função para limpar localização salva
  const limparLocalizacaoSalva = () => {
    try {
      localStorage.removeItem(LS_KEY);
      console.log("Dados de localização removidos do localStorage");
    } catch (error) {
      console.error("Erro ao remover dados de localização:", error);
    }
  };

  // Função para obter localização salva
  const obterLocalizacaoSalva = (): DetectadoEstado | null => {
    try {
      const savedData = localStorage.getItem(LS_KEY);
      if (!savedData) return null;
      
      const parsedData = JSON.parse(savedData) as DetectadoEstado;
      
      // Verificar se os dados não estão muito antigos (30 minutos)
      // Reduzindo para 30 minutos para garantir detecção mais precisa
      const meiaHoraEmMs = 30 * 60 * 1000;
      if (Date.now() - parsedData.timestamp > meiaHoraEmMs) {
        console.log("Dados de localização expirados, detectando novamente");
        limparLocalizacaoSalva();
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
      // Garantir que temos um timestamp
      const dadosComTimestamp = {
        ...data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(LS_KEY, JSON.stringify(dadosComTimestamp));
      setLocalizacao(dadosComTimestamp);
      console.log("Localização salva com sucesso:", dadosComTimestamp);
    } catch (error) {
      console.error("Erro ao salvar dados de localização:", error);
    }
  };

  // Função para detectar localização pelo IP
  const detectarLocalizacao = async (forcarDeteccao = false) => {
    setCarregando(true);
    setErro(null);
    
    try {
      // Se não forçar a detecção, verificar se já existe uma localização salva
      if (!forcarDeteccao) {
        const localizacaoSalva = obterLocalizacaoSalva();
        if (localizacaoSalva) {
          console.log("Usando dados de localização salvos:", localizacaoSalva);
          setLocalizacao(localizacaoSalva);
          setCarregando(false);
          return;
        }
      } else {
        // Se forçar detecção, limpar dados salvos
        limparLocalizacaoSalva();
      }
      
      // Fazer a consulta na API com parâmetro para evitar cache
      console.log("Detectando localização do IP via API...");
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/detectar-estado?_nocache=${timestamp}&forceDetection=true`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao detectar localização: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Localização detectada:", data);
      
      if (!data || !data.estado) {
        throw new Error("API não retornou um estado válido");
      }
      
      // Salvar no localStorage e no estado
      salvarLocalizacao(data);
      setCarregando(false);
      
    } catch (error) {
      console.error("Erro na detecção de localização:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
      setCarregando(false);
      
      // Em caso de erro, tentar usar um estado padrão
      const estadoPadrao: DetectadoEstado = {
        estado: "São Paulo",
        ip: "desconhecido",
        timestamp: Date.now(),
        detalhes: {
          countryCode: "BR",
          regionName: "São Paulo",
          regionCode: "SP"
        }
      };
      
      setLocalizacao(estadoPadrao);
      // Não salvamos o estado padrão no localStorage para que seja feita nova tentativa no futuro
    }
  };

  // Função para forçar nova detecção
  const forcarNovaDeteccao = () => {
    return detectarLocalizacao(true);
  };

  // Iniciar a detecção quando o componente montar
  useEffect(() => {
    detectarLocalizacao();
    
    // Adicionar listener para detectar quando o usuário volta para a página
    // Isso ajuda a capturar mudanças de IP caso o usuário mude de conexão
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Usuário voltou para a página, verificando localização novamente");
        detectarLocalizacao(true); // Forçar nova detecção
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { 
    localizacao, 
    carregando, 
    erro, 
    detectarNovamente: forcarNovaDeteccao 
  };
}

// Componente para detectar e armazenar informações de localização
export default function LocalizacaoDetector() {
  const { localizacao, carregando, erro } = useLocalizacao();
  const { userData, updateUserData } = useUserData();
  
  // useEffect para atualizar o contexto do usuário quando a localização for detectada
  useEffect(() => {
    if (localizacao && localizacao.estado) {
      // Se o estado no contexto estiver vazio ou for diferente do detectado, atualizar
      if (!userData.estado || userData.estado !== localizacao.estado) {
        console.log("Atualizando contexto do usuário com o estado detectado:", localizacao.estado);
        updateUserData({
          estado: localizacao.estado,
          ip: localizacao.ip
        });
      }
    }
  }, [localizacao, updateUserData, userData.estado]);
  
  // Este componente não renderiza nada visualmente, apenas detecta a localização
  return null;
}