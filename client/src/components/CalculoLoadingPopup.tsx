import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface CalculoLoadingPopupProps {
  companhia: string;
  onComplete: () => void;
}

export function CalculoLoadingPopup({ companhia, onComplete }: CalculoLoadingPopupProps) {
  const [etapa, setEtapa] = useState(0);
  const [, navigate] = useLocation();
  
  const mensagens = [
    {
      titulo: "Verificando a base de dados...",
      subtitulo: `Estamos consultando as informações da base de dados da ${companhia}.`
    },
    {
      titulo: "Verificando a base de dados...",
      subtitulo: "Base de dados verificada com sucesso."
    },
    {
      titulo: "Calculando sua restituição...",
      subtitulo: "Estamos realizando os cálculos com base na média de consumo do cliente, no período pago e no ICMS aplicado à energia elétrica no seu estado."
    },
    {
      titulo: "Tudo pronto! O cálculo foi finalizado.",
      subtitulo: ""
    }
  ];

  useEffect(() => {
    // Avançar para a próxima etapa a cada 2 segundos
    const timer = setTimeout(() => {
      if (etapa < mensagens.length - 1) {
        setEtapa(etapa + 1);
      } else {
        // Quando terminar, chamar o callback de conclusão
        onComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [etapa, mensagens.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl relative">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--gov-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          
          <h3 className="text-xl font-bold text-[var(--gov-blue-dark)] mb-3">
            {mensagens[etapa].titulo}
          </h3>
          
          {mensagens[etapa].subtitulo && (
            <p className="text-[var(--gov-gray-dark)]">
              {mensagens[etapa].subtitulo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}