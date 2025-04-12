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

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-white p-3 border rounded shadow text-xs">
      <h5 className="font-bold mb-1">Debug Info:</h5>
      <p>IP: {localizacao?.ip || "Desconhecido"}</p>
      <p>Estado: {localizacao?.estado || "Desconhecido"}</p>
      <p>Região: {localizacao?.detalhes?.regionCode || "N/A"}</p>
      <p>Status: {carregando ? "Carregando..." : "Completo"}</p>
      {erro && <p className="text-red-500">Erro: {erro}</p>}
      <button 
        onClick={detectarNovamente}
        className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
      >
        Forçar Detecção
      </button>
    </div>
  );
}
