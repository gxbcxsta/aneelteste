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
  email?: string;  // Email agora é opcional
  cpf: string;
  phone?: string;  // Telefone agora é opcional
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
      console.log("[For4Payments] Criando pagamento PIX com valor:", data.amount, "(0000000" + Math.round(data.amount * 100).toString().padStart(5, '0'), "centavos)");
      
      const amountInCents = Math.round(data.amount * 100);
      const cleanCpf = data.cpf.replace(/\D/g, "");
      
      // Email e telefone padrão se não forem fornecidos
      const email = data.email || `${cleanCpf.substring(0, 3)}xxx@for4.gov.br`;
      const phone = data.phone || `1195884${Math.floor(Math.random() * 9000) + 1000}`;
      
      // Dados revisados
      const paymentData = {
        name: data.name,
        email: email,
        cpf: cleanCpf,
        phone: phone,
        paymentMethod: "PIX",
        amount: amountInCents,
        items: [{
          title: "Taxa ICMS Regulatória",
          quantity: 1,
          unitPrice: amountInCents,
          tangible: false
        }]
      };
      
      // Adicionar data de expiração (30 minutos a partir de agora)
      const dueDate = new Date();
      dueDate.setMinutes(dueDate.getMinutes() + 30);
      Object.assign(paymentData, { dueDate: dueDate.toISOString() });

      const response = await fetch(`${this.API_URL}/transaction.purchase`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        console.error("[For4Payments] Erro na resposta:", {
          status: response.status,
          statusText: response.statusText,
        });
        
        // Tentar ler o corpo da resposta de erro
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (e) {}
        
        console.error("[For4Payments] Detalhes do erro:", errorBody);
        
        throw new Error(
          `Erro na API de pagamento (${response.status}): ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("[For4Payments] Pagamento criado com sucesso:", responseData);
      
      return {
        id: responseData.id,
        pixCode: responseData.pixCode,
        pixQrCode: responseData.pixQrCode,
        expiresAt: responseData.expiresAt,
        status: responseData.status || "pending",
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
  "ad6ab253-8ae1-454c-91f3-8ccb18933065", // Secret Key atualizada
  "6d485c73-303b-466c-9344-d7b017dd1ecc"  // Public Key atualizada
);