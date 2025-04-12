/**
 * API de Pagamentos For4Payments
 * Base URL: https://app.for4payments.com.br/api/v1
 */

interface PaymentResponse {
  id: string;
  pixCode: string;
  pixQrCode: string;
  expiresAt: string;
  status: string;
}

interface PaymentData {
  amount: number; // Valor em reais
  name: string; // Nome completo
  email: string; // Email válido
  cpf: string; // CPF (com ou sem pontuação)
  phone: string; // Telefone (com ou sem pontuação)
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
      
      // Formatar e validar dados
      const amountInCents = Math.round(data.amount * 100);
      const cleanPhone = data.phone.replace(/\D/g, "");
      const cleanCpf = data.cpf.replace(/\D/g, "");
      
      // Verificar campos obrigatórios
      if (!data.name || !data.email || !cleanCpf || !cleanPhone) {
        console.error("[For4Payments] Campos obrigatórios faltando:", { data });
        throw new Error("Campos obrigatórios faltando");
      }
      
      // Criar payload conforme documentação
      const paymentData = {
        name: data.name,
        email: data.email,
        cpf: cleanCpf,
        phone: cleanPhone,
        paymentMethod: "PIX",
        amount: amountInCents,
        items: [
          {
            title: "DNT IVN - 22/03", // Título padrão conforme documentação
            quantity: 1,
            unitPrice: amountInCents,
            tangible: false
          }
        ]
      };
      
      console.log("[For4Payments] Enviando dados para API:", JSON.stringify(paymentData));
      
      const response = await fetch(`${this.API_URL}/transaction.purchase`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData)
      });
      
      console.log("[For4Payments] Status da resposta:", response.status, response.statusText);
      
      if (!response.ok) {
        console.error("[For4Payments] Erro na resposta:", {
          status: response.status,
          statusText: response.statusText
        });
        
        // Ler o corpo do erro para diagnóstico
        const errorText = await response.text();
        console.error("[For4Payments] Corpo do erro:", errorText);
        
        throw new Error(`Erro na API de pagamento (${response.status}): ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("[For4Payments] Resposta da API:", responseData);
      
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
      
      const url = new URL(`${this.API_URL}/transaction.getPayment`);
      url.searchParams.append("id", paymentId);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        const paymentData = await response.json();
        
        const statusMapping: Record<string, string> = {
          PENDING: "pending",
          PROCESSING: "pending",
          APPROVED: "completed",
          COMPLETED: "completed",
          PAID: "completed",
          EXPIRED: "failed",
          FAILED: "failed",
          CANCELED: "cancelled",
          CANCELLED: "cancelled"
        };
        
        const currentStatus = paymentData.status || "PENDING";
        return { status: statusMapping[currentStatus] || "pending" };
      } else {
        console.error("[For4Payments] Erro ao verificar status:", response.statusText);
        return { status: "pending" };
      }
    } catch (error) {
      console.error("[For4Payments] Erro ao verificar status do pagamento:", error);
      return { status: "pending" };
    }
  }
}

// Inicialização da API com as chaves fornecidas
export const paymentApi = new For4PaymentsAPI(
  "ad6ab253-8ae1-454c-91f3-8ccb18933065", // Secret Key
  "6d485c73-303b-466c-9344-d7b017dd1ecc"  // Public Key
);