/**
 * UtmifyService.ts
 * 
 * Serviço para integração com a API da Utmify.
 * Esta API é utilizada para metrificar e registrar vendas, capturando dados como:
 * - Origem de tráfego (utm_source, utm_campaign, etc)
 * - Informações do cliente
 * - Produto vendido
 * - Método e status do pagamento
 * - Valores da transação e comissões
 */

export interface Customer {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  pais: string;
  ip: string;
}

export interface Product {
  id: string;
  nome: string;
  planId: string | null;
  planName: string | null;
  quantidade: number;
  precoEmCentavos: number;
}

export interface TrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface Commission {
  precoTotalEmCentavos: number;
  taxaGatewayEmCentavos: number;
  comissaoUsuarioEmCentavos: number;
}

export interface UtmifyOrder {
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: 'waiting_payment' | 'paid' | 'refunded' | 'canceled';
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: Customer;
  products: Product[];
  trackingParameters: TrackingParameters;
  commission: Commission;
}

/**
 * Extrai parâmetros UTM da URL atual
 */
function getUtmParametersFromUrl(): TrackingParameters {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    src: urlParams.get('src'),
    sck: urlParams.get('sck'),
    utm_source: urlParams.get('utm_source'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_medium: urlParams.get('utm_medium'),
    utm_content: urlParams.get('utm_content'),
    utm_term: urlParams.get('utm_term')
  };
}

/**
 * Gera um ID único para uma ordem
 */
function generateOrderId(prefix: string, cpf: string): string {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000);
  const cpfPart = cpf.replace(/[^\d]/g, '').substring(0, 4);
  
  return `${prefix}_${cpfPart}_${timestamp}_${randomPart}`;
}

/**
 * Gera um timestamp em formato de string no padrão ISO
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Envia dados para a API da Utmify
 */
async function sendToUtmify(orderData: UtmifyOrder): Promise<any> {
  try {
    console.log('[Utmify] Enviando dados:', orderData);
    
    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': 'XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Utmify] Erro ao enviar dados:', errorText);
      return { success: false, error: errorText };
    }
    
    const data = await response.json();
    console.log('[Utmify] Resposta da API:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('[Utmify] Erro ao enviar dados:', error);
    return { success: false, error };
  }
}

/**
 * Formata o número de telefone para incluir apenas dígitos
 */
function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Registra um pagamento na Utmify
 * @param userData Dados do usuário
 * @param productInfo Informações do produto
 * @param paymentStatus Status do pagamento
 * @param paymentInfo Informações adicionais do pagamento
 */
export async function registerPayment(
  userData: {
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    ip: string;
  },
  productInfo: {
    id: string;
    nome: string;
    valorCentavos: number;
  },
  paymentStatus: 'waiting_payment' | 'paid',
  paymentInfo?: {
    paymentId?: string;
    approvedDate?: string;
  }
): Promise<any> {
  // Valores default para taxas e comissões
  const taxaGatewayEmCentavos = Math.round(productInfo.valorCentavos * 0.04); // 4% de taxa
  const comissaoUsuarioEmCentavos = productInfo.valorCentavos - taxaGatewayEmCentavos;
  
  // Gerar ID único para a ordem se não for fornecido
  const orderId = paymentInfo?.paymentId || generateOrderId(productInfo.id, userData.cpf);
  
  // Obter parâmetros UTM da URL
  const trackingParams = getUtmParametersFromUrl();
  
  // Construir objeto da ordem
  const orderData: UtmifyOrder = {
    orderId,
    platform: 'RestituicaoEnergia',
    paymentMethod: 'pix',
    status: paymentStatus,
    createdAt: getCurrentTimestamp(),
    approvedDate: paymentStatus === 'paid' ? (paymentInfo?.approvedDate || getCurrentTimestamp()) : null,
    refundedAt: null,
    customer: {
      nome: userData.nome,
      email: userData.email || `${userData.cpf.substring(0, 3)}xxx${userData.cpf.substring(userData.cpf.length-2)}@restituicao.gov.br`,
      telefone: formatPhone(userData.telefone) || '31999999999',
      documento: userData.cpf.replace(/\D/g, ''),
      pais: 'BR',
      ip: userData.ip || '127.0.0.1'
    },
    products: [
      {
        id: productInfo.id,
        nome: productInfo.nome,
        planId: null,
        planName: null,
        quantidade: 1,
        precoEmCentavos: productInfo.valorCentavos
      }
    ],
    trackingParameters: trackingParams,
    commission: {
      precoTotalEmCentavos: productInfo.valorCentavos,
      taxaGatewayEmCentavos: taxaGatewayEmCentavos,
      comissaoUsuarioEmCentavos: comissaoUsuarioEmCentavos
    }
  };
  
  // Enviar para a API da Utmify
  return sendToUtmify(orderData);
}

/**
 * Registra um pagamento PIX da taxa TRE (R$74,90)
 */
export async function registerTREPayment(
  userData: { nome: string; cpf: string; email: string; telefone: string; ip: string; },
  status: 'waiting_payment' | 'paid',
  paymentId?: string
): Promise<any> {
  return registerPayment(
    userData,
    {
      id: 'pix-tre',
      nome: 'Taxa TRE',
      valorCentavos: 7490
    },
    status,
    { paymentId }
  );
}

/**
 * Registra um pagamento PIX da taxa TCN (R$118,00)
 */
export async function registerTCNPayment(
  userData: { nome: string; cpf: string; email: string; telefone: string; ip: string; },
  status: 'waiting_payment' | 'paid',
  paymentId?: string
): Promise<any> {
  return registerPayment(
    userData,
    {
      id: 'pix-tcn',
      nome: 'Taxa TCN',
      valorCentavos: 11800
    },
    status,
    { paymentId }
  );
}

/**
 * Registra um pagamento PIX da taxa LAR (R$48,60)
 */
export async function registerLARPayment(
  userData: { nome: string; cpf: string; email: string; telefone: string; ip: string; },
  status: 'waiting_payment' | 'paid',
  paymentId?: string
): Promise<any> {
  return registerPayment(
    userData,
    {
      id: 'pix-lar',
      nome: 'Taxa LAR',
      valorCentavos: 4860
    },
    status,
    { paymentId }
  );
}

// Exportar funções principais
export default {
  registerPayment,
  registerTREPayment,
  registerTCNPayment,
  registerLARPayment
};