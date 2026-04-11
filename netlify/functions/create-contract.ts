import { Handler, HandlerEvent } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ContractRequest {
  project_id: string;
  contract_type?: 'service_agreement' | 'nda' | 'sow' | 'retainer';
  context?: string;
  disclaimer_accepted?: boolean; // Must be true for first contract
}

const LEGAL_DISCLAIMER = `
⚠️ IMPORTANT LEGAL DISCLAIMER ⚠️

This AI-generated contract is provided as a STARTING POINT ONLY and is NOT legal advice.

By using this tool, you acknowledge:
1. This contract template may not be suitable for your specific situation
2. Laws vary by jurisdiction and change over time
3. You should have ALL contracts reviewed by a qualified attorney before use
4. Anthropic and WorkflowAI are not responsible for any legal issues arising from use
5. This tool does not create an attorney-client relationship

We STRONGLY recommend consulting with a licensed attorney in your jurisdiction 
before using any AI-generated contract.

✓ I understand and accept this disclaimer
`;

/**
 * ContractAI - Generate legal contracts from proposals
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Check legal disclaimer acceptance (required for first use)
 * 3. Fetch project + proposal data for context
 * 4. Call Claude to generate contract
 * 5. Prepend legal disclaimer to contract
 * 6. Save as document
 * 7. Log activity
 */
export const handler: Handler = async (event: HandlerEvent) => {
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
    // 1. AUTHENTICATE
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing authorization' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    // 2. PARSE REQUEST
    const body: ContractRequest = JSON.parse(event.body || '{}');
    const {
      project_id,
      contract_type = 'service_agreement',
      context = '',
      disclaimer_accepted = false,
    } = body;

    if (!project_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'project_id required' }),
      };
    }

    // 3. CHECK LEGAL DISCLAIMER ACCEPTANCE
    const { data: userSettings } = await supabase
      .from('users')
      .select('contract_disclaimer_accepted_at, full_name, company_name, email')
      .eq('id', user.id)
      .single();

    // If never accepted, require acceptance
    if (!userSettings?.contract_disclaimer_accepted_at && !disclaimer_accepted) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Legal disclaimer must be accepted',
          disclaimer: LEGAL_DISCLAIMER,
          requires_acceptance: true,
        }),
      };
    }

    // If accepted now for first time, record it
    if (!userSettings?.contract_disclaimer_accepted_at && disclaimer_accepted) {
      await supabase
        .from('users')
        .update({ contract_disclaimer_accepted_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    // 4. FETCH PROJECT + PROPOSAL DATA
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        clients (*)
      `)
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

    // Get most recent proposal for context
    const { data: proposal } = await supabase
      .from('documents')
      .select('content, title')
      .eq('project_id', project_id)
      .eq('type', 'proposal')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check for custom contract template
    const { data: customPrompt } = await supabase
      .from('prompts')
      .select('prompt_template')
      .eq('user_id', user.id)
      .eq('module', 'contract')
      .eq('is_default', true)
      .maybeSingle();

    // 5. GENERATE CONTRACT WITH RETRY
    let contractContent = '';
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (!contractContent && retryCount < MAX_RETRIES) {
      try {
        const prompt = buildContractPrompt({
          project,
          client: project.clients,
          userSettings,
          proposal,
          contract_type,
          context,
          customPrompt: customPrompt?.prompt_template,
        });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          temperature: 0.3, // Lower for legal documents (precision matters)
          system: `You are a legal contract drafting assistant. 
Generate a ${contract_type.replace('_', ' ')} contract.
Use clear, professional legal language.
Include standard clauses: definitions, scope, payment terms, termination, confidentiality, liability.
Format in markdown with clear sections.
IMPORTANT: This is a TEMPLATE that must be reviewed by an attorney.
Include placeholder text like [CLIENT LEGAL NAME] and [YOUR LEGAL ENTITY] where specifics are needed.`,
          messages: [{ role: 'user', content: prompt }],
        });

        contractContent = message.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('\n');

        if (!contractContent || contractContent.length < 500) {
          throw new Error('Generated contract too short');
        }

        // Log AI usage
        await supabase.from('ai_usage').insert({
          user_id: user.id,
          module: 'contract',
          model: 'claude-sonnet-4-20250514',
          prompt_tokens: message.usage.input_tokens,
          completion_tokens: message.usage.output_tokens,
          total_tokens: message.usage.input_tokens + message.usage.output_tokens,
          success: true,
          project_id,
        });

      } catch (error: any) {
        retryCount++;
        console.error(`Contract generation attempt ${retryCount} failed:`, error.message);

        if (retryCount >= MAX_RETRIES) {
          await supabase.from('ai_usage').insert({
            user_id: user.id,
            module: 'contract',
            model: 'claude-sonnet-4-20250514',
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            success: false,
            error_message: error.message,
            retry_count: retryCount,
            project_id,
          });

          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: 'Failed to generate contract after 3 attempts',
              details: error.message,
            }),
          };
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // 6. PREPEND LEGAL DISCLAIMER
    const finalContract = `${LEGAL_DISCLAIMER}\n\n---\n\n${contractContent}`;

    // 7. SAVE DOCUMENT
    const title = `${contract_type.replace('_', ' ').toUpperCase()}: ${project.name}`;
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        project_id,
        client_id: project.client_id,
        type: 'contract',
        title,
        content: finalContract,
        status: 'draft',
        ai_model: 'claude-sonnet-4-20250514',
      })
      .select()
      .single();

    if (docError) {
      console.error('Document save error:', docError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save contract' }),
      };
    }

    // 8. UPDATE PROJECT STATUS
    if (project.status === 'proposal_sent') {
      await supabase
        .from('projects')
        .update({ status: 'negotiating' })
        .eq('id', project_id);
    }

    // 9. LOG ACTIVITY
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'contract.created',
      description: `Created ${contract_type} for ${project.name}`,
      metadata: {
        document_id: document.id,
        contract_type,
        disclaimer_shown: true,
      },
      project_id,
      client_id: project.client_id,
      document_id: document.id,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        document,
        content: finalContract,
        disclaimer_included: true,
      }),
    };

  } catch (error: any) {
    console.error('Contract creation error:', error);
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

function buildContractPrompt(data: any): string {
  const {
    project,
    client,
    userSettings,
    proposal,
    contract_type,
    context,
    customPrompt,
  } = data;

  if (customPrompt) {
    return customPrompt
      .replace(/\{\{project_name\}\}/g, project.name)
      .replace(/\{\{client_name\}\}/g, client?.name || '[CLIENT NAME]')
      .replace(/\{\{context\}\}/g, context);
  }

  let prompt = `Generate a ${contract_type.replace('_', ' ')} contract with the following details:

CONTRACT TYPE: ${contract_type.toUpperCase()}

PARTIES:
Provider (you): ${userSettings?.company_name || userSettings?.full_name || '[YOUR LEGAL ENTITY]'}
Client: ${client?.company || client?.name || '[CLIENT LEGAL NAME]'}
${client?.address ? `Client Address: ${client.address}` : ''}

PROJECT DETAILS:
- Name: ${project.name}
- Description: ${project.description || 'As specified in proposal'}
${project.budget_amount ? `- Total Value: $${project.budget_amount} ${project.budget_currency}` : ''}
${project.billing_type ? `- Billing Type: ${project.billing_type}` : ''}
${project.hourly_rate ? `- Hourly Rate: $${project.hourly_rate}` : ''}
${project.start_date ? `- Start Date: ${project.start_date}` : ''}
${project.end_date ? `- End Date: ${project.end_date}` : ''}

${proposal ? `PROPOSAL CONTEXT (use for scope of work):\n${proposal.content.substring(0, 2000)}\n` : ''}

${context ? `ADDITIONAL REQUIREMENTS:\n${context}\n` : ''}

REQUIRED SECTIONS:
1. **Parties**: Define both parties clearly
2. **Scope of Work**: Detailed deliverables (pull from proposal if available)
3. **Payment Terms**: Amount, schedule, late fees
4. **Timeline**: Start date, milestones, completion
5. **Intellectual Property**: Who owns what after completion
6. **Confidentiality**: Protect sensitive information
7. **Termination**: Conditions for ending agreement
8. **Liability**: Limit liability for both parties
9. **Dispute Resolution**: Arbitration/mediation clause
10. **General Provisions**: Governing law, amendments, signatures

Use placeholders like [GOVERNING STATE/COUNTRY] for jurisdiction-specific details.
Include signature blocks at the end.
Write in plain legal English, avoid overly complex jargon.
Format in clean markdown.`;

  return prompt;
}
