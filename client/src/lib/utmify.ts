/**
 * API de integração com UTMify para rastreamento de vendas
 * Módulo para envio de informações de pedidos para a plataforma UTMify
 */

const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
const UTMIFY_API_TOKEN = "XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4";

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
  phone: string;
  document: string;
  country: string;
  ip?: string;
}

interface UtmifyProduct {
  id: string;
  name: string;
  quantity: number;
  priceInCents: number;
}

interface UtmifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency: "BRL";
}

export interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  commission: UtmifyCommission;
  trackingParameters?: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
}

/**
 * Formata a data no formato esperado pela UTMify: YYYY-MM-DD HH:MM:SS
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Extrai os parâmetros de tracking da URL atual
 */
function getTrackingParametersFromUrl() {
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
      console.log("Enviando venda para UTMify:", order);
      
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
      
      console.log("Venda enviada com sucesso para UTMify");
      return response;
    } catch (error) {
      console.error('Falha na integração com UTMify:', error);
      throw error;
    }
  }
}

/**
 * Função para enviar notificação de PIX gerado (aguardando pagamento)
 */
export async function sendPixGeneratedNotification(
  orderId: string,
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  },
  amount: number, // Valor em centavos (ex: 10000 = R$ 100,00)
  ip?: string
): Promise<void> {
  try {
    const now = new Date();
    const createdAt = formatDate(now);
    
    // Calcular valor da taxa de gateway (4% ou mínimo R$ 4,00)
    const gatewayFee = Math.max(400, Math.round(amount * 0.04));
    
    const order: UtmifyOrderPayload = {
      orderId,
      platform: "RestituicaoICMS",
      paymentMethod: "pix",
      status: "waiting_payment",
      createdAt,
      approvedDate: null,
      refundedAt: null,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document,
        country: "BR",
        ip: ip
      },
      products: [
        {
          id: "TRE",
          name: "Taxa de Regularização Energética",
          quantity: 1,
          priceInCents: amount
        }
      ],
      commission: {
        totalPriceInCents: amount,
        gatewayFeeInCents: gatewayFee,
        userCommissionInCents: amount - gatewayFee,
        currency: "BRL"
      },
      trackingParameters: getTrackingParametersFromUrl()
    };
    
    await UtmifyAPI.sendOrder(order);
    console.log("Notificação de PIX gerado enviada com sucesso para UTMify");
  } catch (error) {
    console.error("Erro ao enviar notificação de PIX gerado para UTMify:", error);
  }
}

/**
 * Função para enviar notificação de pagamento confirmado
 */
export async function sendPaymentConfirmedNotification(
  orderId: string,
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  },
  amount: number, // Valor em centavos (ex: 10000 = R$ 100,00)
  ip?: string
): Promise<void> {
  try {
    const now = new Date();
    const createdAt = formatDate(new Date(now.getTime() - 60000)); // 1 minuto atrás
    const approvedDate = formatDate(now);
    
    // Calcular valor da taxa de gateway (4% ou mínimo R$ 4,00)
    const gatewayFee = Math.max(400, Math.round(amount * 0.04));
    
    const order: UtmifyOrderPayload = {
      orderId,
      platform: "RestituicaoICMS",
      paymentMethod: "pix",
      status: "paid",
      createdAt,
      approvedDate,
      refundedAt: null,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document,
        country: "BR",
        ip: ip
      },
      products: [
        {
          id: "TRE",
          name: "Taxa de Regularização Energética",
          quantity: 1,
          priceInCents: amount
        }
      ],
      commission: {
        totalPriceInCents: amount,
        gatewayFeeInCents: gatewayFee,
        userCommissionInCents: amount - gatewayFee,
        currency: "BRL"
      },
      trackingParameters: getTrackingParametersFromUrl()
    };
    
    await UtmifyAPI.sendOrder(order);
    console.log("Notificação de pagamento confirmado enviada com sucesso para UTMify");
  } catch (error) {
    console.error("Erro ao enviar notificação de pagamento confirmado para UTMify:", error);
  }
}