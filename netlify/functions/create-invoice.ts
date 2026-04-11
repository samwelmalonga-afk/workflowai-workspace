import { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role for admin operations
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Types
interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoice_number: string;
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  due_date: string;
  notes?: string;
}

interface InvoiceRequest {
  project_id: string;
  client_id: string;
  payment_terms?: number; // days
  context?: string; // additional context for AI
  manual_items?: LineItem[]; // optional pre-defined items
}

/**
 * Create invoice with AI, Stripe payment link, and PDF
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Fetch project/client/contract data for context
 * 3. Call Claude to generate invoice JSON
 * 4. Create Stripe Payment Link
 * 5. Generate PDF and upload to Supabase Storage
 * 6. Insert invoice record
 * 7. Log activity
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 1. AUTHENTICATE USER
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid authentication token' }),
      };
    }

    // 2. PARSE REQUEST
    const body: InvoiceRequest = JSON.parse(event.body || '{}');
    const { project_id, client_id, payment_terms = 30, context, manual_items } = body;

    if (!project_id || !client_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: project_id, client_id' }),
      };
    }

    // 3. FETCH CONTEXT DATA
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Project not found' }),
      };
    }

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Client not found' }),
      };
    }

    // Get user settings
    const { data: userSettings } = await supabase
      .from('users')
      .select('full_name, company_name, default_currency')
      .eq('id', user.id)
      .single();

    // Get most recent contract for this project (for context)
    const { data: contract } = await supabase
      .from('documents')
      .select('content, title')
      .eq('project_id', project_id)
      .eq('type', 'contract')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get unbilled time logs if hourly project
    let unbilledTime: any[] = [];
    if (project.billing_type === 'hourly') {
      const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('*')
        .eq('project_id', project_id)
        .eq('billable', true)
        .eq('billed', false);
      
      unbilledTime = timeLogs || [];
    }

    // Generate next invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = lastInvoice 
      ? parseInt(lastInvoice.invoice_number.replace(/\D/g, '')) + 1 
      : 1001;
    const invoice_number = `INV-${nextNumber}`;

    // 4. CALL CLAUDE WITH RETRY LOGIC
    let invoiceData: InvoiceData | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (!invoiceData && retryCount < MAX_RETRIES) {
      try {
        const prompt = buildInvoicePrompt({
          project,
          client,
          userSettings,
          contract,
          unbilledTime,
          manual_items,
          context,
          invoice_number,
          payment_terms,
        });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.3,
          system: `You are an expert invoice generator. You MUST respond ONLY with valid JSON matching this exact structure:
{
  "invoice_number": "string",
  "line_items": [
    {"description": "string", "quantity": number, "rate": number, "amount": number}
  ],
  "subtotal": number,
  "tax_rate": number,
  "tax_amount": number,
  "total": number,
  "due_date": "YYYY-MM-DD",
  "notes": "optional string"
}

Do NOT include any markdown, explanations, or text outside the JSON object.
Calculate all amounts precisely. Ensure subtotal = sum of line item amounts.
Ensure total = subtotal + tax_amount.`,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Extract text content
        const rawContent = message.content
          .filter((block) => block.type === 'text')
          .map((block) => (block as any).text)
          .join('');

        // Clean and parse JSON
        const cleanedJson = rawContent
          .trim()
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        invoiceData = JSON.parse(cleanedJson);

        // Validate required fields
        if (
          !invoiceData?.invoice_number ||
          !invoiceData?.line_items ||
          !Array.isArray(invoiceData.line_items) ||
          invoiceData.line_items.length === 0 ||
          typeof invoiceData.subtotal !== 'number' ||
          typeof invoiceData.total !== 'number'
        ) {
          throw new Error('Invalid invoice structure returned from AI');
        }

        // Log successful AI usage
        await supabase.from('ai_usage').insert({
          user_id: user.id,
          module: 'invoice',
          model: 'claude-sonnet-4-20250514',
          prompt_tokens: message.usage.input_tokens,
          completion_tokens: message.usage.output_tokens,
          total_tokens: message.usage.input_tokens + message.usage.output_tokens,
          success: true,
          project_id,
        });

      } catch (parseError: any) {
        retryCount++;
        console.error(`Invoice generation attempt ${retryCount} failed:`, parseError.message);

        if (retryCount >= MAX_RETRIES) {
          // Log failed AI usage
          await supabase.from('ai_usage').insert({
            user_id: user.id,
            module: 'invoice',
            model: 'claude-sonnet-4-20250514',
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            success: false,
            error_message: parseError.message,
            retry_count: retryCount,
            project_id,
          });

          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Failed to generate invoice after 3 attempts',
              details: parseError.message,
            }),
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!invoiceData) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to generate invoice data' }),
      };
    }

    // 5. CREATE STRIPE PAYMENT LINK
    const stripeLineItems = invoiceData.line_items.map(item => ({
      price_data: {
        currency: userSettings?.default_currency?.toLowerCase() || 'usd',
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.rate * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add tax if applicable
    if (invoiceData.tax_amount > 0) {
      stripeLineItems.push({
        price_data: {
          currency: userSettings?.default_currency?.toLowerCase() || 'usd',
          product_data: {
            name: `Tax (${invoiceData.tax_rate}%)`,
          },
          unit_amount: Math.round(invoiceData.tax_amount * 100),
        },
        quantity: 1,
      });
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: stripeLineItems,
      metadata: {
        user_id: user.id,
        project_id,
        client_id,
        invoice_number: invoiceData.invoice_number,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.APP_URL}/invoices/success?invoice_number=${invoiceData.invoice_number}`,
        },
      },
    });

    // 6. GENERATE PDF (simplified - in production use @react-pdf/renderer)
    // For now, we'll create a simple HTML-to-PDF or store PDF URL as placeholder
    const pdf_storage_path = `invoices/${user.id}/${invoice_number}.pdf`;
    const pdf_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents-pdf/${pdf_storage_path}`;

    // TODO: Generate actual PDF using @react-pdf/renderer and upload to Supabase Storage
    // const pdfBlob = await generateInvoicePDF(invoiceData, client, userSettings);
    // await supabase.storage.from('documents-pdf').upload(pdf_storage_path, pdfBlob);

    // 7. INSERT INVOICE RECORD
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        project_id,
        client_id,
        invoice_number: invoiceData.invoice_number,
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.tax_rate || 0,
        tax_amount: invoiceData.tax_amount || 0,
        total: invoiceData.total,
        currency: userSettings?.default_currency || 'USD',
        line_items: invoiceData.line_items,
        payment_terms,
        due_date: invoiceData.due_date,
        notes: invoiceData.notes,
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Invoice insert error:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save invoice', details: insertError.message }),
      };
    }

    // 8. MARK TIME LOGS AS BILLED
    if (unbilledTime.length > 0) {
      await supabase
        .from('time_logs')
        .update({ billed: true, invoice_id: invoice.id })
        .in('id', unbilledTime.map(t => t.id));
    }

    // 9. LOG ACTIVITY
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'invoice.created',
      description: `Created invoice ${invoiceData.invoice_number} for ${client.name}`,
      metadata: {
        invoice_id: invoice.id,
        total: invoiceData.total,
        currency: userSettings?.default_currency || 'USD',
      },
      project_id,
      client_id,
      invoice_id: invoice.id,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        invoice,
        payment_link_url: paymentLink.url,
      }),
    };

  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// Helper function to build Claude prompt
function buildInvoicePrompt(data: any): string {
  const {
    project,
    client,
    userSettings,
    contract,
    unbilledTime,
    manual_items,
    context,
    invoice_number,
    payment_terms,
  } = data;

  let prompt = `Generate an invoice with the following details:

INVOICE NUMBER: ${invoice_number}

CLIENT:
- Name: ${client.name}
- Company: ${client.company || 'N/A'}
- Email: ${client.email}

PROJECT:
- Name: ${project.name}
- Description: ${project.description || 'N/A'}
- Billing Type: ${project.billing_type}
${project.hourly_rate ? `- Hourly Rate: $${project.hourly_rate}` : ''}
${project.budget_amount ? `- Budget: $${project.budget_amount}` : ''}

PAYMENT TERMS: Net ${payment_terms} days
DUE DATE: Calculate as today + ${payment_terms} days in YYYY-MM-DD format

`;

  if (contract) {
    prompt += `\nCONTRACT CONTEXT:\n${contract.title}\n${contract.content}\n`;
  }

  if (manual_items && manual_items.length > 0) {
    prompt += `\nPRE-DEFINED LINE ITEMS:\n`;
    manual_items.forEach((item: LineItem) => {
      prompt += `- ${item.description}: ${item.quantity} x $${item.rate} = $${item.amount}\n`;
    });
  }

  if (unbilledTime.length > 0) {
    prompt += `\nUNBILLED TIME LOGS (hourly project):\n`;
    unbilledTime.forEach((log: any) => {
      const hours = (log.duration_minutes || 0) / 60;
      const rate = log.hourly_rate || project.hourly_rate || 0;
      prompt += `- ${log.description}: ${hours} hours @ $${rate}/hr\n`;
    });
  }

  if (context) {
    prompt += `\nADDITIONAL CONTEXT:\n${context}\n`;
  }

  prompt += `\nGENERATE:
1. Line items with clear descriptions, quantities, rates, and amounts
2. Subtotal (sum of all line items)
3. Tax rate and tax amount (use 0 if not applicable)
4. Total amount (subtotal + tax)
5. Professional notes for payment instructions

Return ONLY valid JSON, no markdown or explanations.`;

  return prompt;
}
