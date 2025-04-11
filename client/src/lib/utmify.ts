/**
 * API de integração com UTMify para rastreamento de vendas
 * Módulo para envio de informações de pedidos para a plataforma UTMify
 */

const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
const UTMIFY_API_TOKEN = "XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4";

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  BOLETO = "boleto",
  PIX = "pix",
  PAYPAL = "paypal",
  FREE_PRICE = "free_price"
}

export enum PaymentStatus {
  WAITING_PAYMENT = "waiting_payment",
  PAID = "paid",
  REFUSED = "refused",
  REFUNDED = "refunded",
  CHARGEDBACK = "chargedback"
}

interface UtmifyCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  country?: string;
  ip?: string;
}

interface UtmifyProduct {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
}

interface UtmifyTrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface UtmifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "CAD";
}

export interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters: UtmifyTrackingParameters;
  commission: UtmifyCommission;
  isTest?: boolean;
}

/**
 * Formata a data no formato esperado pela UTMify: YYYY-MM-DD HH:MM:SS
 */
function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Extrai os parâmetros de tracking da URL atual
 */
function getTrackingParametersFromUrl(): UtmifyTrackingParameters {
  const url = new URL(window.location.href);
  
  return {
    src: url.searchParams.get('src'),
    sck: url.searchParams.get('sck'),
    utm_source: url.searchParams.get('utm_source'),
    utm_campaign: url.searchParams.get('utm_campaign'),
    utm_medium: url.searchParams.get('utm_medium'),
    utm_content: url.searchParams.get('utm_content'),
    utm_term: url.searchParams.get('utm_term')
  };
}

/**
 * Classe para integração com a API de vendas do UTMify
 */
export class UtmifyAPI {
  /**
   * Envia um pedido para a API do UTMify
   */
  static async sendOrder(order: UtmifyOrderPayload): Promise<Response> {
    try {
      const response = await fetch(UTMIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': UTMIFY_API_TOKEN
        },
        body: JSON.stringify(order)
      });
      
      if (!response.ok) {
        console.error('Erro ao enviar pedido para UTMify:', await response.text());
        throw new Error(`Erro ao enviar pedido para UTMify: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('Falha na integração com UTMify:', error);
      throw error;
    }
  }
  
  /**
   * Cria um objeto de pedido PIX com status 'waiting_payment'
   */
  static createPixOrder(
    orderId: string,
    cpf: string,
    nome: string,
    email: string,
    telefone: string,
    valorEmCentavos: number
  ): UtmifyOrderPayload {
    const now = new Date();
    const createdAtFormatted = formatDate(now);
    
    // Taxa de processamento (exemplos)
    const taxaDeProcessamento = Math.max(100, Math.round(valorEmCentavos * 0.03)); // 3% ou mínimo R$ 1,00
    
    return {
      orderId,
      platform: "RestituicaoICMS",
      paymentMethod: PaymentMethod.PIX,
      status: PaymentStatus.WAITING_PAYMENT,
      createdAt: createdAtFormatted,
      approvedDate: null,
      refundedAt: null,
      customer: {
        name: nome,
        email: email,
        phone: telefone || null,
        document: cpf || null,
        country: "BR"
      },
      products: [
        {
          id: "taxaDeServico",
          name: "Taxa de Serviço para Restituição de ICMS",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: valorEmCentavos
        }
      ],
      trackingParameters: getTrackingParametersFromUrl(),
      commission: {
        totalPriceInCents: valorEmCentavos,
        gatewayFeeInCents: taxaDeProcessamento,
        userCommissionInCents: valorEmCentavos - taxaDeProcessamento
      }
    };
  }
  
  /**
   * Atualiza o status de um pedido para 'paid'
   */
  static updateOrderPaid(order: UtmifyOrderPayload): UtmifyOrderPayload {
    const now = new Date();
    return {
      ...order,
      status: PaymentStatus.PAID,
      approvedDate: formatDate(now)
    };
  }
}

/**
 * Envio de notificação inicial para UTMify quando o PIX é gerado
 */
export async function notifyPixGenerated(
  orderId: string,
  cpf: string,
  nome: string,
  email: string,
  telefone: string,
  valorEmCentavos: number
): Promise<void> {
  try {
    const order = UtmifyAPI.createPixOrder(
      orderId,
      cpf,
      nome,
      email,
      telefone,
      valorEmCentavos
    );
    
    await UtmifyAPI.sendOrder(order);
    console.log("Notificação de PIX gerado enviada com sucesso para UTMify");
  } catch (error) {
    console.error("Erro ao enviar notificação de PIX gerado para UTMify:", error);
  }
}

/**
 * Envio de notificação para UTMify quando o pagamento é confirmado
 */
export async function notifyPaymentConfirmed(
  orderId: string,
  cpf: string,
  nome: string,
  email: string,
  telefone: string,
  valorEmCentavos: number
): Promise<void> {
  try {
    // Primeiro cria o pedido com o estado original
    const order = UtmifyAPI.createPixOrder(
      orderId,
      cpf,
      nome,
      email,
      telefone,
      valorEmCentavos
    );
    
    // Depois atualiza para o status de pago
    const updatedOrder = UtmifyAPI.updateOrderPaid(order);
    
    await UtmifyAPI.sendOrder(updatedOrder);
    console.log("Notificação de pagamento confirmado enviada com sucesso para UTMify");
  } catch (error) {
    console.error("Erro ao enviar notificação de pagamento confirmado para UTMify:", error);
  }
}