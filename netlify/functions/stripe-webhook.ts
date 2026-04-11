import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Stripe Webhook Handler
 * 
 * Listens for payment events and updates invoice status accordingly.
 * 
 * Events handled:
 * - payment_intent.succeeded: Mark invoice as paid
 * - payment_intent.payment_failed: Log failure, trigger notification
 * - charge.succeeded: Confirm payment receipt
 * 
 * Webhook endpoint: https://app.yourdomain.com/.netlify/functions/stripe-webhook
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const sig = event.headers['stripe-signature'];
  
  if (!sig) {
    console.error('Missing Stripe signature header');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  console.log('Received Stripe event:', stripeEvent.type, stripeEvent.id);

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(stripeEvent.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(stripeEvent.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(stripeEvent.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed', details: error.message }),
    };
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  const { user_id, invoice_number, project_id, client_id } = paymentIntent.metadata;

  if (!invoice_number) {
    console.error('No invoice_number in payment intent metadata');
    return;
  }

  // Find invoice by invoice_number
  const { data: invoice, error: findError } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoice_number)
    .single();

  if (findError || !invoice) {
    console.error('Invoice not found:', invoice_number);
    return;
  }

  // Update invoice status to paid
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
      payment_method: paymentIntent.payment_method_types[0] || 'card',
    })
    .eq('id', invoice.id);

  if (updateError) {
    console.error('Failed to update invoice:', updateError);
    return;
  }

  // Log activity
  await supabase.from('activities').insert({
    user_id: invoice.user_id,
    type: 'invoice.paid',
    description: `Invoice ${invoice_number} paid via Stripe`,
    metadata: {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      payment_method: paymentIntent.payment_method_types[0],
    },
    project_id: invoice.project_id,
    client_id: invoice.client_id,
    invoice_id: invoice.id,
  });

  console.log(`Invoice ${invoice_number} marked as paid`);

  // TODO: Send payment confirmation email via EmailAI
  // await sendPaymentConfirmationEmail(invoice);
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const { invoice_number } = paymentIntent.metadata;

  if (!invoice_number) {
    console.error('No invoice_number in payment intent metadata');
    return;
  }

  // Find invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoice_number)
    .single();

  if (!invoice) {
    console.error('Invoice not found:', invoice_number);
    return;
  }

  // Log activity
  await supabase.from('activities').insert({
    user_id: invoice.user_id,
    type: 'payment.failed',
    description: `Payment failed for invoice ${invoice_number}`,
    metadata: {
      payment_intent_id: paymentIntent.id,
      failure_code: paymentIntent.last_payment_error?.code,
      failure_message: paymentIntent.last_payment_error?.message,
    },
    project_id: invoice.project_id,
    client_id: invoice.client_id,
    invoice_id: invoice.id,
  });

  console.log(`Payment failed for invoice ${invoice_number}`);

  // TODO: Send payment failure notification to user
  // await notifyPaymentFailure(invoice, paymentIntent.last_payment_error);
}

/**
 * Handle successful charge (additional confirmation)
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log('Charge succeeded:', charge.id, 'Amount:', charge.amount / 100, charge.currency);

  // Additional logging or business logic can go here
  // Usually payment_intent.succeeded is sufficient for our use case
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  // Find invoice by payment intent ID
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('stripe_payment_intent_id', charge.payment_intent as string)
    .single();

  if (!invoice) {
    console.error('Invoice not found for refunded charge');
    return;
  }

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'cancelled',
    })
    .eq('id', invoice.id);

  // Log activity
  await supabase.from('activities').insert({
    user_id: invoice.user_id,
    type: 'payment.refunded',
    description: `Payment refunded for invoice ${invoice.invoice_number}`,
    metadata: {
      charge_id: charge.id,
      refund_amount: charge.amount_refunded / 100,
      currency: charge.currency.toUpperCase(),
    },
    project_id: invoice.project_id,
    client_id: invoice.client_id,
    invoice_id: invoice.id,
  });

  console.log(`Invoice ${invoice.invoice_number} refunded`);
}
