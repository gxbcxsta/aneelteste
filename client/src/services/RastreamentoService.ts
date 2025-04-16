/**
 * Serviço de Rastreamento de Usuários
 * 
 * Este serviço gerencia o registro e rastreamento de visitantes e páginas visitadas
 */

// Tipos de dispositivos
type Dispositivo = 'desktop' | 'tablet' | 'mobile';

// Interface para os dados de um visitante
interface Visitante {
  id?: number;
  cpf: string;
  nome?: string;
  telefone?: string;
  ip?: string;
  navegador?: string;
  sistema_operacional?: string;
}

// Interface para os dados de uma página visitada
interface PaginaVisitada {
  visitante_id: number;
  url: string;
  pagina: string;
  referrer?: string;
  dispositivo?: Dispositivo;
}

/**
 * Detecta o tipo de dispositivo do usuário
 */
function detectarDispositivo(): Dispositivo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

/**
 * Detecta o navegador do usuário
 */
function detectarNavegador(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
  
  return "Desconhecido";
}

/**
 * Detecta o sistema operacional do usuário
 */
function detectarSistemaOperacional(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Windows NT 10.0") > -1) return "Windows 10";
  if (userAgent.indexOf("Windows NT 6.3") > -1) return "Windows 8.1";
  if (userAgent.indexOf("Windows NT 6.2") > -1) return "Windows 8";
  if (userAgent.indexOf("Windows NT 6.1") > -1) return "Windows 7";
  if (userAgent.indexOf("Mac") > -1) return "macOS";
  if (userAgent.indexOf("Android") > -1) return "Android";
  if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
  if (userAgent.indexOf("Linux") > -1) return "Linux";
  
  return "Desconhecido";
}

/**
 * Classe principal do serviço de rastreamento
 */
class RastreamentoService {
  private visitanteId: number | null = null;
  private cpf: string | null = null;
  private inicializado: boolean = false;
  
  constructor() {
    // Inicializar o serviço automaticamente se houver um CPF salvo
    this.carregarEstado();
  }
  
  /**
   * Inicializa o serviço com o CPF do usuário
   */
  async inicializar(cpf: string, nome?: string, telefone?: string): Promise<boolean> {
    if (!cpf) return false;
    
    try {
      // Limpar o CPF removendo caracteres não numéricos
      const cpfLimpo = cpf.replace(/\D/g, "");
      
      if (cpfLimpo.length !== 11) {
        console.error("CPF inválido");
        return false;
      }
      
      // Salvar o CPF
      this.cpf = cpfLimpo;
      
      // Detectar informações do dispositivo
      const navegador = detectarNavegador();
      const sistemaOperacional = detectarSistemaOperacional();
      
      // Obter endereço IP (será resolvido pelo servidor)
      const ip = "";
      
      // Registrar o visitante na API
      const resposta = await fetch('/api/rastreamento/visitante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: cpfLimpo,
          nome,
          telefone,
          ip,
          navegador,
          sistema_operacional: sistemaOperacional
        }),
      });
      
      if (!resposta.ok) {
        console.error("Erro ao registrar visitante");
        return false;
      }
      
      const dados = await resposta.json();
      this.visitanteId = dados.id;
      this.inicializado = true;
      
      // Salvar o estado
      this.salvarEstado();
      
      return true;
    } catch (erro) {
      console.error("Erro ao inicializar rastreamento:", erro);
      return false;
    }
  }
  
  /**
   * Registra uma visita a uma página
   */
  async registrarVisitaPagina(rota: string, tituloPagina: string): Promise<boolean> {
    if (!this.inicializado || !this.visitanteId) {
      console.warn("Serviço de rastreamento não inicializado");
      return false;
    }
    
    try {
      // Obter URL completa
      const url = window.location.href;
      
      // Obter referrer (de onde o usuário veio)
      const referrer = document.referrer;
      
      // Detectar tipo de dispositivo
      const dispositivo = detectarDispositivo();
      
      // Registrar a página visitada na API
      const resposta = await fetch('/api/rastreamento/pagina', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitante_id: this.visitanteId,
          url,
          pagina: tituloPagina || rota,
          referrer,
          dispositivo
        }),
      });
      
      if (!resposta.ok) {
        console.error("Erro ao registrar visita de página");
        return false;
      }
      
      return true;
    } catch (erro) {
      console.error("Erro ao registrar visita de página:", erro);
      return false;
    }
  }
  
  /**
   * Atualiza os dados do visitante
   */
  async atualizarDadosVisitante(nome?: string, telefone?: string): Promise<boolean> {
    if (!this.inicializado || !this.visitanteId) {
      console.warn("Serviço de rastreamento não inicializado");
      return false;
    }
    
    try {
      // Registrar o visitante na API
      const resposta = await fetch('/api/rastreamento/visitante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: this.cpf,
          nome,
          telefone
        }),
      });
      
      if (!resposta.ok) {
        console.error("Erro ao atualizar dados do visitante");
        return false;
      }
      
      return true;
    } catch (erro) {
      console.error("Erro ao atualizar dados do visitante:", erro);
      return false;
    }
  }
  
  /**
   * Salva o estado atual do serviço de rastreamento no localStorage
   */
  private salvarEstado(): void {
    try {
      const estado = {
        visitanteId: this.visitanteId,
        cpf: this.cpf,
        inicializado: this.inicializado
      };
      
      localStorage.setItem('rastreamento', JSON.stringify(estado));
    } catch (erro) {
      console.error("Erro ao salvar estado do rastreamento:", erro);
    }
  }
  
  /**
   * Carrega o estado do serviço de rastreamento do localStorage
   */
  private carregarEstado(): void {
    try {
      const estadoJson = localStorage.getItem('rastreamento');
      
      if (estadoJson) {
        const estado = JSON.parse(estadoJson);
        
        this.visitanteId = estado.visitanteId;
        this.cpf = estado.cpf;
        this.inicializado = estado.inicializado;
      }
    } catch (erro) {
      console.error("Erro ao carregar estado do rastreamento:", erro);
    }
  }
  
  /**
   * Limpa o estado do serviço de rastreamento
   */
  limparEstado(): void {
    this.visitanteId = null;
    this.cpf = null;
    this.inicializado = false;
    
    try {
      localStorage.removeItem('rastreamento');
    } catch (erro) {
      console.error("Erro ao limpar estado do rastreamento:", erro);
    }
  }
  
  /**
   * Verifica se o serviço está inicializado
   */
  isInicializado(): boolean {
    return this.inicializado;
  }
  
  /**
   * Retorna o ID do visitante
   */
  getVisitanteId(): number | null {
    return this.visitanteId;
  }
  
  /**
   * Retorna o CPF do visitante
   */
  getCpf(): string | null {
    return this.cpf;
  }
}

// Exportar uma instância singleton do serviço
export const rastreamentoService = new RastreamentoService();