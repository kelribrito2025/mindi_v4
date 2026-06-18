/**
 * Stripe Connect Integration - Pagamento Online para Restaurantes
 * 
 * Permite que restaurantes recebam pagamentos via cartão no menu público.
 * Usa Stripe Connect com destination charges e taxa de 3,99% + R$ 0,89 da plataforma.
 */

import Stripe from "stripe";
import { ENV } from "./_core/env";

// Taxa da plataforma: 3,99% + R$ 0,89 fixo por transação
// A Stripe cobra ~3,99% + R$ 0,39 → nosso lucro é ~R$ 0,50 por transação
export const PLATFORM_FEE_PERCENT = 3.99;
export const PLATFORM_FEE_FIXED_CENTS = 89; // R$ 0,89 em centavos

/**
 * Calcula a taxa da plataforma (application_fee_amount)
 * Fórmula: totalAmount * 3,99% + R$ 0,89
 */
export function calculatePlatformFee(totalAmountInCents: number): number {
  const percentFee = totalAmountInCents * (PLATFORM_FEE_PERCENT / 100);
  return Math.round(percentFee + PLATFORM_FEE_FIXED_CENTS);
}

// Inicializar Stripe Client
function getStripe(): Stripe {
  if (!ENV.stripeSecretKey) {
    throw new Error("[Stripe Connect] STRIPE_SECRET_KEY não configurada");
  }
  return new Stripe(ENV.stripeSecretKey);
}

/**
 * Cria uma Connected Account no Stripe (API V2)
 * Cada restaurante precisa de uma connected account para receber pagamentos
 */
export async function createConnectedAccount(params: {
  displayName: string;
  contactEmail: string;
}): Promise<{ accountId: string }> {
  const stripe = getStripe();

  // Usar API V2 para criar a connected account
  const account = await stripe.accounts.create({
    type: "express",
    country: "BR",
    email: params.contactEmail,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: params.displayName,
      mcc: "5812", // Eating Places, Restaurants
    },
    settings: {
      payouts: {
        schedule: {
          interval: "daily",
        },
      },
    },
  });

  return { accountId: account.id };
}

/**
 * Cria um Account Link para onboarding do restaurante
 * O restaurante será redirecionado para o Stripe para completar o cadastro
 */
export async function createAccountLink(params: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();

  const accountLink = await stripe.accountLinks.create({
    account: params.accountId,
    type: "account_onboarding",
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
  });

  return { url: accountLink.url };
}

/**
 * Verifica o status da connected account
 * Retorna se o onboarding foi concluído e se a conta pode receber pagamentos
 */
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
  requirementsPastDue: string[];
}> {
  const stripe = getStripe();

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requirementsCurrentlyDue: account.requirements?.currently_due || [],
    requirementsPastDue: account.requirements?.past_due || [],
  };
}

/**
 * Cria uma Checkout Session com Destination Charge
 * O pagamento vai para a conta do restaurante, com taxa de 3,99% + R$ 0,89 para a plataforma
 */
export async function createOrderCheckoutSession(params: {
  connectedAccountId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    priceInCents: number;
    description?: string;
  }>;
  deliveryFeeInCents: number;
  customerEmail?: string;
  customerName?: string;
  establishmentId: number;
  establishmentName: string;
  orderData: string; // JSON stringified order data
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();

  // Calcular total do pedido
  const itemsTotal = params.orderItems.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );
  const totalAmount = itemsTotal + params.deliveryFeeInCents;

  // Calcular taxa da plataforma (3,99% + R$ 1,00)
  const applicationFee = calculatePlatformFee(totalAmount);

  // Montar line_items para o checkout
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.orderItems.map(
    (item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.priceInCents,
      },
      quantity: item.quantity,
    })
  );

  // Adicionar taxa de entrega como item separado, se houver
  if (params.deliveryFeeInCents > 0) {
    lineItems.push({
      price_data: {
        currency: "brl",
        product_data: {
          name: "Taxa de entrega",
        },
        unit_amount: params.deliveryFeeInCents,
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: lineItems,
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: params.connectedAccountId,
      },
    },
    metadata: {
      type: "online_order",
      establishment_id: params.establishmentId.toString(),
      establishment_name: params.establishmentName,
      order_data: params.orderData,
      delivery_fee: params.deliveryFeeInCents.toString(),
      platform_fee: applicationFee.toString(),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Verifica o status de uma Checkout Session
 * Usado para polling do frontend enquanto aguarda pagamento
 */
export async function getCheckoutSessionStatus(sessionId: string): Promise<{
  status: 'open' | 'complete' | 'expired';
  paymentStatus: string;
}> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    status: session.status as 'open' | 'complete' | 'expired',
    paymentStatus: session.payment_status,
  };
}

/**
 * Cria um login link para o Express Dashboard do restaurante
 * Permite que o restaurante veja seus pagamentos e configure dados bancários
 */
export async function createDashboardLink(accountId: string): Promise<{ url: string }> {
  const stripe = getStripe();

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return { url: loginLink.url };
}
