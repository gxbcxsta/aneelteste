import { useEffect } from "react";
import { useLocalizacao } from "../components/LocalizacaoDetector";

export default function DebugDetectorIp() {
  const { localizacao, carregando, erro, detectarNovamente } = useLocalizacao();

  useEffect(() => {
    console.log("DEBUG IP - Informações de IP e localização:");
    console.log("Estado detectado:", localizacao?.estado);
    console.log("IP detectado:", localizacao?.ip);
    console.log("Detalhes:", localizacao?.detalhes);
    console.log("Carregando:", carregando);
    console.log("Erro:", erro);
  }, [localizacao, carregando, erro]);

  // Função para limpar completamente os caches do navegador
  const limparCache = () => {
    try {
      // Limpar localStorage
      localStorage.clear();
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Forçar recarga da página sem usar cache
      window.location.reload();
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-white p-3 border rounded shadow text-xs">
      <h5 className="font-bold mb-1">Debug Info:</h5>
      <p>IP: {localizacao?.ip || "Desconhecido"}</p>
      <p>Estado: {localizacao?.estado || "Desconhecido"}</p>
      <p>Região: {localizacao?.detalhes?.regionCode || "N/A"}</p>
      <p>Status: {carregando ? "Carregando..." : "Completo"}</p>
      {erro && <p className="text-red-500">Erro: {erro}</p>}
      <div className="flex flex-col gap-1 mt-2">
        <button 
          onClick={detectarNovamente}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Forçar Detecção
        </button>
        <button 
          onClick={limparCache}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Limpar Cache
        </button>
      </div>
    </div>
  );
}
