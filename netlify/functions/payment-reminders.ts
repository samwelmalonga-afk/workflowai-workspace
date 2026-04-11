import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * PaymentAI - Automated Payment Reminders
 * 
 * Scheduled via Supabase Cron: Daily at 9am UTC
 * 
 * Flow:
 * 1. Find overdue invoices (due_date passed, not paid)
 * 2. Check last reminder timestamp (max 1 reminder per 7 days)
 * 3. Call EmailAI function to send reminder
 * 4. Update reminder_count and last_reminder_sent_at
 * 5. Log activity
 * 
 * Triggered by:
 * - Supabase Cron job hits this endpoint daily
 * - Manual trigger from admin dashboard (optional)
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    console.log('Starting PaymentAI reminder check...');

    // Calculate date 7 days ago (for reminder throttling)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. FIND OVERDUE INVOICES
    const { data: overdueInvoices, error: findError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company
        ),
        projects (
          id,
          name
        ),
        users (
          id,
          full_name,
          company_name,
          email
        )
      `)
      .eq('status', 'overdue')
      .is('paid_at', null)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${sevenDaysAgo.toISOString()}`);

    if (findError) {
      console.error('Error finding overdue invoices:', findError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch overdue invoices' }),
      };
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      console.log('No overdue invoices requiring reminders');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No reminders needed',
          processed: 0,
        }),
      };
    }

    console.log(`Found ${overdueInvoices.length} overdue invoices`);

    // 2. PROCESS EACH INVOICE
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const invoice of overdueInvoices) {
      try {
        // Skip if client has no email
        if (!invoice.clients?.email) {
          console.log(`Skipping invoice ${invoice.invoice_number}: Client has no email`);
          results.failed++;
          continue;
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // 3. SEND REMINDER EMAIL (via EmailAI)
        const emailResult = await sendPaymentReminder({
          invoice,
          client: invoice.clients,
          project: invoice.projects,
          user: invoice.users,
          daysOverdue,
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Email send failed');
        }

        // 4. UPDATE INVOICE
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            reminder_count: (invoice.reminder_count || 0) + 1,
          })
          .eq('id', invoice.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        // 5. LOG ACTIVITY
        await supabase.from('activities').insert({
          user_id: invoice.user_id,
          type: 'reminder.sent',
          description: `Payment reminder sent for invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`,
          metadata: {
            invoice_number: invoice.invoice_number,
            days_overdue: daysOverdue,
            reminder_count: (invoice.reminder_count || 0) + 1,
            total_amount: invoice.total,
            currency: invoice.currency,
          },
          project_id: invoice.project_id,
          client_id: invoice.client_id,
          invoice_id: invoice.id,
        });

        console.log(`Reminder sent for invoice ${invoice.invoice_number}`);
        results.success++;

      } catch (error: any) {
        console.error(`Failed to process invoice ${invoice.invoice_number}:`, error);
        results.failed++;
        results.errors.push({
          invoice_number: invoice.invoice_number,
          error: error.message,
        });
      }
    }

    // 6. RETURN SUMMARY
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed: overdueInvoices.length,
        sent: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      }),
    };

  } catch (error: any) {
    console.error('PaymentAI cron error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal error',
        message: error.message,
      }),
    };
  }
};

/**
 * Send payment reminder email via EmailAI/Resend
 */
async function sendPaymentReminder(data: {
  invoice: any;
  client: any;
  project: any;
  user: any;
  daysOverdue: number;
}): Promise<{ success: boolean; error?: string }> {
  const { invoice, client, project, user, daysOverdue } = data;

  // In production, this would call the EmailAI function or Resend directly
  // For now, we'll simulate the email send
  
  console.log('Sending reminder email:', {
    to: client.email,
    from: process.env.EMAIL_FROM || 'hello@yourdomain.com',
    subject: `Payment Reminder: Invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`,
    invoice_number: invoice.invoice_number,
    amount: invoice.total,
    days_overdue: daysOverdue,
  });

  // TODO: Implement actual email sending via Resend
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailContent = `
    <h2>Payment Reminder</h2>
    <p>Hi ${client.name},</p>
    <p>This is a friendly reminder that invoice ${invoice.invoice_number} for ${project?.name || 'your project'} is now ${daysOverdue} days overdue.</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
      <p><strong>Amount Due:</strong> ${formatCurrency(invoice.total, invoice.currency)}</p>
      <p><strong>Original Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
      <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
    </div>

    <p>
      <a href="${invoice.stripe_payment_link_url}" style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Pay Now
      </a>
    </p>

    <p>If you have any questions or concerns, please don't hesitate to reach out.</p>
    
    <p>Best regards,<br>${user.full_name || user.company_name || 'Your Team'}</p>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: client.email,
      subject: `Payment Reminder: Invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`,
      html: emailContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
  */

  // Temporary: Return success for demo purposes
  return { success: true };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
