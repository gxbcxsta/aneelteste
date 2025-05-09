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
      "Authorization": this.secretKey,
      "X-Public-Key": this.publicKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }

  async createPixPayment(data: PaymentData): Promise<PaymentResponse> {
    console.log("[For4Payments] Iniciando criação de pagamento com os dados:", data);
    
    // Formatar o número de telefone (remover caracteres não numéricos)
    const phone = data.phone.replace(/\D/g, "");
    
    // Formatar CPF (remover caracteres não numéricos)
    const cpf = data.cpf.replace(/\D/g, "");
    
    // Converter valor para centavos (multiplicar por 100)
    const amountInCents = Math.round(data.amount * 100);
    
    // Data de expiração (30 minutos a partir de agora)
    const dueDate = new Date();
    dueDate.setMinutes(dueDate.getMinutes() + 30);
    
    // Criar payload conforme documentação da API
    const payload = {
      name: data.name,
      email: data.email,
      cpf: cpf,
      phone: phone,
      paymentMethod: "PIX",
      amount: amountInCents,
      items: [
        {
          title: "Taxa de Regularização Energética (TRE)",
          quantity: 1,
          unitPrice: amountInCents,
          tangible: false
        }
      ],
      dueDate: dueDate.toISOString()
    };
    
    console.log("[For4Payments] Enviando dados para API:", JSON.stringify(payload));
    console.log("[For4Payments] URL completa:", `${this.API_URL}/transaction.purchase`);
    
    const response = await fetch(`${this.API_URL}/transaction.purchase`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    
    console.log("[For4Payments] Status da resposta:", response.status, response.statusText);
    
    if (!response.ok) {
      let errorText = "";
      try {
        const errorData = await response.text();
        errorText = errorData;
        console.error("[For4Payments] Erro na API:", errorData);
      } catch (e) {
        console.error("[For4Payments] Erro ao ler resposta de erro:", e);
      }
      
      throw new Error(`Erro ao criar pagamento: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Retornar exatamente o que a API retornou
    return result;
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string }> {
    console.log("[For4Payments] Verificando status do pagamento:", paymentId);
    
    const response = await fetch(`${this.API_URL}/transaction.getPayment?id=${paymentId}`, {
      method: "GET",
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("[For4Payments] Resposta do status:", result);
    
    return { status: result.status.toLowerCase() };
  }
}

// As chaves fornecidas no documento anexado
export const paymentApi = new For4PaymentsAPI(
  "ad6ab253-8ae1-454c-91f3-8ccb18933065", // Secret Key
  "6d485c73-303b-466c-9344-d7b017dd1ecc"  // Public Key
);