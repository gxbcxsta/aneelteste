import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { rastreamentoService } from '@/services/RastreamentoService';
import { useUserData } from '@/contexts/UserContext';

/**
 * Componente para rastreamento de páginas visitadas
 * 
 * Este componente deve ser incluído no App.tsx para que todas as páginas sejam
 * rastreadas automaticamente.
 */
export default function Rastreamento() {
  const [location] = useLocation();
  const { userData } = useUserData();
  const [lastTrackedLocation, setLastTrackedLocation] = useState<string>('');
  
  // Efeito para inicializar o serviço de rastreamento quando o CPF for definido
  useEffect(() => {
    const inicializarRastreamento = async () => {
      // Se o serviço já estiver inicializado, não faça nada
      if (rastreamentoService.isInicializado()) {
        return;
      }
      
      // Se o CPF estiver definido no contexto, inicialize o serviço
      if (userData.cpf) {
        console.log("Inicializando rastreamento com CPF:", userData.cpf);
        
        await rastreamentoService.inicializar(
          userData.cpf,
          userData.nome || undefined,
          userData.telefone || undefined
        );
      }
    };
    
    inicializarRastreamento();
  }, [userData.cpf]);
  
  // Efeito para atualizar os dados do visitante quando o usuário fornecer mais informações
  useEffect(() => {
    const atualizarDadosVisitante = async () => {
      // Se o serviço não estiver inicializado, não faça nada
      if (!rastreamentoService.isInicializado()) {
        return;
      }
      
      // Se o CPF atual for diferente do CPF no serviço, reinicialize
      if (userData.cpf && userData.cpf !== rastreamentoService.getCpf()) {
        await rastreamentoService.inicializar(
          userData.cpf,
          userData.nome || undefined,
          userData.telefone || undefined
        );
        return;
      }
      
      // Se tivermos nome ou telefone, atualize os dados
      if (userData.nome || userData.telefone) {
        await rastreamentoService.atualizarDadosVisitante(
          userData.nome || undefined,
          userData.telefone || undefined
        );
      }
    };
    
    atualizarDadosVisitante();
  }, [userData.nome, userData.telefone]);
  
  // Efeito para rastrear a página atual sempre que a localização mudar
  useEffect(() => {
    const rastrearPagina = async () => {
      // Evitar rastreamento duplicado da mesma URL
      if (location === lastTrackedLocation) {
        return;
      }
      
      // Obter título da página
      const tituloPagina = obterTituloPagina(location);
      
      try {
        // Registrar a visita (mesmo que o serviço não esteja inicializado)
        // O serviço tratará isso registrando uma visita anônima
        console.log(`Rastreando visita à página: ${location} (${tituloPagina})`);
        await rastreamentoService.registrarVisitaPagina(location, tituloPagina);
        
        // Atualizar última localização rastreada
        setLastTrackedLocation(location);
      } catch (erro) {
        console.error("Erro ao rastrear página:", erro);
        // Não atualizar lastTrackedLocation em caso de erro para que possamos tentar novamente
      }
    };
    
    // Pequeno atraso para garantir que o DOM esteja pronto e evitar race conditions
    const timer = setTimeout(() => {
      rastrearPagina();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location, lastTrackedLocation]);
  
  // Função para obter a URL exata da página para rastreamento
  function obterTituloPagina(rota: string): string {
    // Retornar a URL exata conforme solicitado
    return rota;
  }
  
  return null; // Este componente não renderiza nada visualmente
}