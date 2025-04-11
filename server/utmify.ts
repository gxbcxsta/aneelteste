import fetch from 'node-fetch';

const UTMIFY_TOKEN = process.env.UTMIFY_API_TOKEN || "XAo52G3UkJ6ePs7Aq3UqHs32hvDPZ8rjUog4";

interface PagamentoData {
  id: string;
  amount: number;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  ip?: string;
  createdAt?: string;
  [key: string]: any; // Outras propriedades que possam vir do objeto de pagamento
}

interface UTMParams {
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/**
 * Envia dados de conversão para a API da UTMIFY
 * @param {PagamentoData} pagamento - Objeto contendo dados do pagamento
 * @param {UTMParams} utms - Objeto contendo parâmetros UTM para rastreamento
 * @returns {Promise<void>}
 */
export async function enviarConversaoUTMIFY(pagamento: PagamentoData, utms: UTMParams): Promise<void> {
  const payload = {
    orderId: pagamento.id,
    platform: "ReplitChaosSystem",
    paymentMethod: "pix",
    status: "paid",
    createdAt: pagamento.createdAt || new Date().toISOString(),
    approvedDate: new Date().toISOString(),
    customer: {
      name: pagamento.name,
      email: pagamento.email,
      phone: pagamento.phone,
      document: pagamento.cpf,
      country: "BR",
      ip: pagamento.ip || "8.8.8.8"
    },
    products: [
      {
        id: "TRE_PIX",
        name: "Taxa de Regularização Energética (TRE)",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: pagamento.amount
      }
    ],
    trackingParameters: {
      utm_source: utms.utm_source || null,
      utm_campaign: utms.utm_campaign || null,
      utm_medium: utms.utm_medium || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null
    },
    commission: {
      totalPriceInCents: pagamento.amount,
      gatewayFeeInCents: 300,
      userCommissionInCents: pagamento.amount - 300
    }
  };

  console.log("[UTMIFY] Enviando conversão:", payload);

  try {
    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": UTMIFY_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("[UTMIFY] Falhou:", erro);
    } else {
      console.log("[UTMIFY] Conversão enviada com sucesso.");
    }
  } catch (error) {
    console.error("[UTMIFY] Erro ao enviar conversão:", error);
    throw error;
  }
}