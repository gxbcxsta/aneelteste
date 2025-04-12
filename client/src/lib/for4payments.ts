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
  email?: string;
  cpf: string;
  phone?: string;
}

export class For4PaymentsAPI {
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
      
      // Formatar o número de telefone (remover caracteres não numéricos)
      const phone = data.phone?.replace(/\D/g, "") || `1198${Math.floor(Math.random() * 10000000 + 10000000)}`;
      
      // Formatar CPF (remover caracteres não numéricos)
      const cpfLimpo = data.cpf.replace(/\D/g, "");
      
      // Email padrão se não for fornecido
      const email = data.email || `${cpfLimpo.substring(0, 3)}xxx${cpfLimpo.substring(cpfLimpo.length-2)}@cpf.gov.br`;
      
      // Converter valor para centavos (multiplicar por 100)
      const amountInCents = Math.round(data.amount * 100);
      
      // Decidir o título do item com base no valor
      let titleItem = "Taxa de Regularização Energética (TRE)";
      if (data.amount === 118.0) {
        titleItem = "Taxa de Conformidade Nacional (TCN)";
      } else if (data.amount === 48.0) {
        titleItem = "Liberação Acelerada de Restituição (LAR)";
      }
      
      console.log("[For4Payments] Criando pagamento PIX com valor:", data.amount, `(${amountInCents} centavos)`);
      
      // Criar payload conforme documentação
      const payload = {
        name: data.name,
        email: email,
        cpf: cpfLimpo,
        phone: phone,
        paymentMethod: "PIX",
        amount: amountInCents,
        items: [
          {
            title: titleItem,
            quantity: 1,
            unitPrice: amountInCents,
            tangible: false
          }
        ]
      };
      
      // Adicionar data de expiração (30 minutos a partir de agora)
      const dueDate = new Date();
      dueDate.setMinutes(dueDate.getMinutes() + 30);
      Object.assign(payload, { dueDate: dueDate.toISOString() });
      
      console.log("[For4Payments] Enviando dados para API:", JSON.stringify(payload));
      
      const response = await fetch(`${this.API_URL}/transaction.purchase`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      
      console.log("[For4Payments] Status da resposta:", response.status, response.statusText);
      
      if (!response.ok) {
        // Tentar ler corpo de erro
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error("[For4Payments] Corpo do erro:", errorBody);
        } catch (e) {
          console.error("[For4Payments] Não foi possível ler corpo do erro");
        }
        
        throw new Error(`Erro ao criar pagamento: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log("[For4Payments] Resposta da API (texto):", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("[For4Payments] Dados do pagamento gerado:", {
          id: responseData.id,
          status: responseData.status
        });
      } catch (e) {
        console.error("[For4Payments] Erro ao fazer parse da resposta JSON:", e);
        throw new Error("Formato de resposta inválido da API de pagamento");
      }
      
      // Retornar os dados formatados
      return {
        id: responseData.id,
        pixCode: responseData.pixCode,
        pixQrCode: responseData.pixQrCode,
        expiresAt: responseData.expiresAt,
        status: responseData.status || "pending"
      };
    } catch (error) {
      console.error("[For4Payments] Erro:", error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string }> {
    try {
      console.log("[For4Payments] Verificando status do pagamento:", paymentId);
      
      // Construir a URL com o parâmetro id como parâmetro de consulta
      const url = new URL(`${this.API_URL}/transaction.getPayment`);
      url.searchParams.append('id', paymentId);
      
      console.log("[For4Payments] URL de verificação:", url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const paymentData = await response.json();
        console.log("[For4Payments] Resposta de status:", paymentData);

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

        const currentStatus = paymentData.status || "PENDING";
        return { status: statusMapping[currentStatus] || "pending" };
      } else {
        const errorText = await response.text();
        console.error(
          "[For4Payments] Erro ao verificar status:",
          response.status,
          response.statusText,
          errorText
        );
        
        // Para não interromper a experiência do usuário, retornamos pending em caso de erro
        if (response.status === 404) {
          console.log("[For4Payments] Pagamento ainda não encontrado, retornando status 'pending'");
        }
        
        return { status: "pending" };
      }
    } catch (error) {
      console.error(
        "[For4Payments] Erro ao verificar status do pagamento:",
        error,
      );
      return { status: "pending" };
    }
  }
}

// Inicialização da API com as chaves fornecidas
export const paymentApi = new For4PaymentsAPI(
  "ad6ab253-8ae1-454c-91f3-8ccb18933065", // Secret Key correta
  "6d485c73-303b-466c-9344-d7b017dd1ecc"  // Public Key correta
);