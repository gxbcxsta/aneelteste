import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { notificacaoSmsService } from '@/services/NotificacaoSmsService';

/**
 * Componente para monitorar alterações de rota e disparar notificações SMS
 * quando o usuário acessar páginas específicas.
 * 
 * Este componente deve ser renderizado no App.tsx para monitorar todas as páginas.
 */
function NotificacaoSmsMonitor() {
  // Obter a localização atual (path)
  const [location] = useLocation();
  
  // Efeito para verificar e enviar a notificação quando a rota mudar
  useEffect(() => {
    // Função para verificar e enviar a notificação
    const verificarEEnviar = async () => {
      // Obter os dados do usuário do localStorage se disponíveis
      const dadosUsuario = localStorage.getItem('usuarioDados');
      
      // Se encontramos dados do usuário no localStorage e o serviço ainda não tem dados configurados
      if (dadosUsuario && !notificacaoSmsService.getDadosUsuario()) {
        try {
          // Converter os dados do usuário de JSON para objeto
          const dados = JSON.parse(dadosUsuario);
          
          // Verificar se temos todos os dados necessários
          if (dados.nome && dados.cpf && dados.telefone) {
            // Configurar os dados do usuário no serviço
            notificacaoSmsService.setDadosUsuario({
              nome: dados.nome,
              cpf: dados.cpf,
              telefone: dados.telefone,
              valor: dados.valor || 0
            });
          }
        } catch (error) {
          console.error('Erro ao processar dados do usuário para notificações SMS:', error);
        }
      }
      
      // Verificar e enviar a notificação para a página atual
      await notificacaoSmsService.verificarEEnviarNotificacao(location);
    };
    
    // Chamar a função
    verificarEEnviar();
    
  }, [location]); // Executar o efeito sempre que a localização mudar
  
  // Este componente não renderiza nada visualmente
  return null;
}

export default NotificacaoSmsMonitor;