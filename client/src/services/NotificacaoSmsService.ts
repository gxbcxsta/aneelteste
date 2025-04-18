/**
 * Serviço para envio de notificações SMS baseadas na navegação do usuário
 */

interface DadosUsuario {
  nome: string;
  cpf: string;
  telefone: string;
  valor?: number;
}

// Tipos de eventos que podem disparar notificações SMS
export enum TipoEventoSMS {
  PIX_GERADO = 'pix_gerado',
  PAGAMENTO_CONFIRMADO = 'pagamento_confirmado'
}

/**
 * Classe responsável por gerenciar o envio de notificações SMS
 * quando o usuário acessa determinadas páginas
 */
export class NotificacaoSmsService {
  private static instance: NotificacaoSmsService;
  private dadosUsuario: DadosUsuario | null = null;
  private paginasNotificadas: Set<string> = new Set();
  private eventosNotificados: Set<string> = new Set(); // Rastreia eventos por tipo e contexto
  
  /**
   * Singleton para garantir uma única instância do serviço
   * com dados atualizados do localStorage
   */
  public static getInstance(): NotificacaoSmsService {
    if (!NotificacaoSmsService.instance) {
      NotificacaoSmsService.instance = new NotificacaoSmsService();
      
      // Tentar carregar dados do localStorage na inicialização
      try {
        const localStorageData = localStorage.getItem('usuarioDados');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          if (parsedData.cpf && parsedData.telefone && parsedData.nome) {
            NotificacaoSmsService.instance.setDadosUsuario({
              nome: parsedData.nome,
              cpf: parsedData.cpf,
              telefone: parsedData.telefone,
              valor: parsedData.valor || 0
            });
            console.log("Dados do usuário carregados na inicialização do serviço de SMS:", {
              nome: parsedData.nome,
              cpf: `***.**.***.${parsedData.cpf.slice(-2)}`, // Redação para log
              telefone: parsedData.telefone
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais para o serviço de SMS:", error);
      }
    }
    return NotificacaoSmsService.instance;
  }
  
  /**
   * Define os dados do usuário para enviar nas notificações
   */
  public setDadosUsuario(dados: DadosUsuario): void {
    // Verificar se os dados estão mudando de usuário (CPF diferente)
    if (this.dadosUsuario && this.dadosUsuario.cpf !== dados.cpf) {
      console.log(`Mudança de usuário detectada! CPF antigo: ***.**.***.${this.dadosUsuario.cpf.slice(-2)}, Novo CPF: ***.**.***.${dados.cpf.slice(-2)}`);
      // Limpar as páginas e eventos notificados para o usuário anterior
      this.paginasNotificadas.clear();
      this.eventosNotificados.clear();
    }
    
    this.dadosUsuario = dados;
    console.log("Dados do usuário configurados para notificações SMS:", {
      nome: dados.nome,
      cpf: `***.**.***.${dados.cpf.slice(-2)}`,
      telefone: dados.telefone
    });
    
    // Atualizar também no localStorage para ficar consistente
    try {
      localStorage.setItem('usuarioDados', JSON.stringify(dados));
    } catch (error) {
      console.error("Erro ao salvar dados do usuário no localStorage:", error);
    }
  }
  
  /**
   * Obtém os dados do usuário configurados
   */
  public getDadosUsuario(): DadosUsuario | null {
    return this.dadosUsuario;
  }
  
  /**
   * Limpa os dados do usuário e reinicia o rastreamento de páginas e eventos
   */
  public limparDados(): void {
    console.log("Limpando dados do serviço de notificação SMS");
    this.dadosUsuario = null;
    this.paginasNotificadas.clear();
    this.eventosNotificados.clear();
    
    // Remover a instância singleton para ser recriada na próxima chamada
    NotificacaoSmsService.instance = undefined as any;
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
    
    // Atualizar sempre os dados mais recentes do localStorage
    try {
      const localStorageData = localStorage.getItem('usuarioDados');
      if (localStorageData) {
        const parsedData = JSON.parse(localStorageData);
        if (parsedData.cpf && parsedData.telefone && parsedData.nome) {
          // Sobrescrever os dados do singleton com os dados mais recentes do localStorage
          this.dadosUsuario = {
            nome: parsedData.nome,
            cpf: parsedData.cpf,
            telefone: parsedData.telefone,
            valor: parsedData.valor || 0
          };
          console.log("Dados do usuário atualizados do localStorage para SMS:", this.dadosUsuario);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage para SMS:", error);
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

  /**
   * Envia uma notificação SMS para um evento específico
   * 
   * @param tipoEvento Tipo de evento que está gerando a notificação
   * @param contexto Contexto adicional para o evento (ex: página, ID de pagamento)
   * @returns Promise que resolve para true se a notificação foi enviada
   */
  public async enviarNotificacaoPorEvento(tipoEvento: TipoEventoSMS, contexto: string): Promise<boolean> {
    // Criar um ID único para o evento (combinação de tipo + contexto)
    const eventoId = `${tipoEvento}:${contexto}`;
    
    // Se este evento já foi notificado, não envia novamente
    if (this.eventosNotificados.has(eventoId)) {
      console.log(`Evento ${eventoId} já recebeu notificação nesta sessão.`);
      return false;
    }
    
    // Se não temos os dados do usuário, não podemos enviar a notificação
    if (!this.dadosUsuario) {
      console.log("Dados do usuário não configurados para enviar notificação de evento.");
      return false;
    }
    
    // Determinar a página apropriada com base no tipo de evento e contexto
    let pagina = '';
    
    switch (tipoEvento) {
      case TipoEventoSMS.PIX_GERADO:
        if (contexto === 'tre') pagina = '/pagamento';
        else if (contexto === 'tcn') pagina = '/pagamento-tcn';
        else if (contexto === 'lar') pagina = '/pagamento-lar';
        break;
        
      case TipoEventoSMS.PAGAMENTO_CONFIRMADO:
        if (contexto === 'tre') pagina = '/taxa-complementar';
        else if (contexto === 'tcn') pagina = '/taxa-lar';
        else if (contexto === 'lar') pagina = '/sucesso';
        else if (contexto === 'padrao') pagina = '/sucesso-padrao';
        break;
    }
    
    if (!pagina) {
      console.error(`Tipo de evento ${tipoEvento} com contexto ${contexto} não tem página correspondente.`);
      return false;
    }
    
    try {
      // Registrar que estamos enviando para este evento
      this.eventosNotificados.add(eventoId);
      
      // Fazer a requisição para enviar a notificação
      const response = await fetch('/api/enviar-sms-notificacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefone: this.dadosUsuario.telefone,
          pagina: pagina, // Usamos a página correspondente ao evento
          dados: {
            nome: this.dadosUsuario.nome,
            cpf: this.dadosUsuario.cpf,
            valor: this.dadosUsuario.valor
          }
        })
      });
      
      const resultado = await response.json();
      
      if (!response.ok || !resultado.success) {
        console.error(`Erro ao enviar notificação de evento ${eventoId}:`, resultado);
        return false;
      }
      
      console.log(`Notificação de evento ${eventoId} enviada com sucesso (página ${pagina})`);
      return true;
      
    } catch (error) {
      console.error(`Erro ao processar envio de notificação para evento ${eventoId}:`, error);
      return false;
    }
  }
}

// Exportar uma instância singleton do serviço
export const notificacaoSmsService = NotificacaoSmsService.getInstance();