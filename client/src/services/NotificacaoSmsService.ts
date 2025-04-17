/**
 * Serviço para envio de notificações SMS baseadas na navegação do usuário
 */

interface DadosUsuario {
  nome: string;
  cpf: string;
  telefone: string;
  valor?: number;
}

/**
 * Classe responsável por gerenciar o envio de notificações SMS
 * quando o usuário acessa determinadas páginas
 */
export class NotificacaoSmsService {
  private static instance: NotificacaoSmsService;
  private dadosUsuario: DadosUsuario | null = null;
  private paginasNotificadas: Set<string> = new Set();
  
  /**
   * Singleton para garantir uma única instância do serviço
   */
  public static getInstance(): NotificacaoSmsService {
    if (!NotificacaoSmsService.instance) {
      NotificacaoSmsService.instance = new NotificacaoSmsService();
    }
    return NotificacaoSmsService.instance;
  }
  
  /**
   * Define os dados do usuário para enviar nas notificações
   */
  public setDadosUsuario(dados: DadosUsuario): void {
    this.dadosUsuario = dados;
    console.log("Dados do usuário configurados para notificações SMS:", dados);
  }
  
  /**
   * Obtém os dados do usuário configurados
   */
  public getDadosUsuario(): DadosUsuario | null {
    return this.dadosUsuario;
  }
  
  /**
   * Limpa os dados do usuário e reinicia o rastreamento de páginas
   */
  public limparDados(): void {
    this.dadosUsuario = null;
    this.paginasNotificadas.clear();
  }
  
  /**
   * Verifica se a página atual deve receber uma notificação SMS
   * e envia se necessário
   * 
   * @param pathname Caminho da página atual
   * @returns Promise que resolve para true se a notificação foi enviada
   */
  public async verificarEEnviarNotificacao(pathname: string): Promise<boolean> {
    // Lista de páginas que devem receber notificações
    const paginasPermitidas = [
      "/pagamento",
      "/taxa-complementar",
      "/pagamento-tcn",
      "/taxa-lar",
      "/pagamento-lar",
      "/sucesso",
      "/sucesso-padrao"
    ];
    
    // Se não é uma página que deve receber notificação, retorna false
    if (!paginasPermitidas.includes(pathname)) {
      return false;
    }
    
    // Se esta página já recebeu notificação na sessão atual, não envia novamente
    if (this.paginasNotificadas.has(pathname)) {
      console.log(`Página ${pathname} já recebeu notificação nesta sessão.`);
      return false;
    }
    
    // Se não temos os dados do usuário, não podemos enviar a notificação
    if (!this.dadosUsuario) {
      console.log("Dados do usuário não configurados para enviar notificação SMS.");
      return false;
    }
    
    try {
      // Registrar que estamos enviando para esta página
      this.paginasNotificadas.add(pathname);
      
      // Fazer a requisição para enviar a notificação
      const response = await fetch('/api/enviar-sms-notificacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefone: this.dadosUsuario.telefone,
          pagina: pathname,
          dados: {
            nome: this.dadosUsuario.nome,
            cpf: this.dadosUsuario.cpf,
            valor: this.dadosUsuario.valor
          }
        })
      });
      
      const resultado = await response.json();
      
      if (!response.ok || !resultado.success) {
        console.error(`Erro ao enviar notificação SMS para ${pathname}:`, resultado);
        return false;
      }
      
      console.log(`Notificação SMS enviada com sucesso para a página ${pathname}`);
      return true;
      
    } catch (error) {
      console.error(`Erro ao processar envio de notificação SMS para ${pathname}:`, error);
      return false;
    }
  }
}

// Exportar uma instância singleton do serviço
export const notificacaoSmsService = NotificacaoSmsService.getInstance();