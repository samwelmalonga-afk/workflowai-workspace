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

interface ProposalRequest {
  project_id: string;
  context?: string;
  tone?: 'professional' | 'friendly' | 'technical';
  include_timeline?: boolean;
  include_pricing?: boolean;
}

/**
 * ProposalAI - Generate professional project proposals
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Fetch project + client data
 * 3. Check for custom prompt template
 * 4. Call Claude to generate proposal
 * 5. Save as document
 * 6. Update project status
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
    const body: ProposalRequest = JSON.parse(event.body || '{}');
    const {
      project_id,
      context = '',
      tone = 'professional',
      include_timeline = true,
      include_pricing = true,
    } = body;

    if (!project_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'project_id required' }),
      };
    }

    // 3. FETCH PROJECT DATA
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

    // Get user info
    const { data: userSettings } = await supabase
      .from('users')
      .select('full_name, company_name, email')
      .eq('id', user.id)
      .single();

    // Check for custom prompt template
    const { data: customPrompt } = await supabase
      .from('prompts')
      .select('prompt_template, variables')
      .eq('user_id', user.id)
      .eq('module', 'proposal')
      .eq('is_default', true)
      .maybeSingle();

    // 4. GENERATE PROPOSAL WITH RETRY
    let proposalContent = '';
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (!proposalContent && retryCount < MAX_RETRIES) {
      try {
        const prompt = buildProposalPrompt({
          project,
          client: project.clients,
          userSettings,
          customPrompt: customPrompt?.prompt_template,
          context,
          tone,
          include_timeline,
          include_pricing,
        });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.7, // Slightly higher for creative writing
          system: `You are an expert at writing compelling project proposals. 
Write in a ${tone} tone. 
Include clear sections: Introduction, Scope of Work, Deliverables, Timeline, Investment, Next Steps.
Format in markdown with headers and bullet points.
Be persuasive but honest. Focus on value, not just features.`,
          messages: [{ role: 'user', content: prompt }],
        });

        proposalContent = message.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('\n');

        if (!proposalContent || proposalContent.length < 100) {
          throw new Error('Generated proposal too short');
        }

        // Log AI usage
        await supabase.from('ai_usage').insert({
          user_id: user.id,
          module: 'proposal',
          model: 'claude-sonnet-4-20250514',
          prompt_tokens: message.usage.input_tokens,
          completion_tokens: message.usage.output_tokens,
          total_tokens: message.usage.input_tokens + message.usage.output_tokens,
          success: true,
          project_id,
        });

      } catch (error: any) {
        retryCount++;
        console.error(`Proposal generation attempt ${retryCount} failed:`, error.message);

        if (retryCount >= MAX_RETRIES) {
          await supabase.from('ai_usage').insert({
            user_id: user.id,
            module: 'proposal',
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
              error: 'Failed to generate proposal after 3 attempts',
              details: error.message,
            }),
          };
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // 5. SAVE DOCUMENT
    const title = `Proposal: ${project.name}`;
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        project_id,
        client_id: project.client_id,
        type: 'proposal',
        title,
        content: proposalContent,
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
        body: JSON.stringify({ error: 'Failed to save proposal' }),
      };
    }

    // 6. UPDATE PROJECT STATUS
    if (project.status === 'lead') {
      await supabase
        .from('projects')
        .update({ status: 'proposal_sent' })
        .eq('id', project_id);
    }

    // 7. LOG ACTIVITY
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'proposal.created',
      description: `Created proposal for ${project.name}`,
      metadata: {
        document_id: document.id,
        client_name: project.clients?.name,
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
        content: proposalContent,
      }),
    };

  } catch (error: any) {
    console.error('Proposal creation error:', error);
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

function buildProposalPrompt(data: any): string {
  const {
    project,
    client,
    userSettings,
    customPrompt,
    context,
    tone,
    include_timeline,
    include_pricing,
  } = data;

  // If custom template exists, use it with variable substitution
  if (customPrompt) {
    return customPrompt
      .replace(/\{\{project_name\}\}/g, project.name)
      .replace(/\{\{client_name\}\}/g, client?.name || '')
      .replace(/\{\{budget\}\}/g, project.budget_amount || '')
      .replace(/\{\{context\}\}/g, context);
  }

  // Default prompt structure
  let prompt = `Write a compelling project proposal for the following:

PROJECT DETAILS:
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
${project.budget_amount ? `- Budget: $${project.budget_amount} ${project.budget_currency}` : ''}
${project.billing_type ? `- Billing: ${project.billing_type}` : ''}
${project.start_date ? `- Start Date: ${project.start_date}` : ''}
${project.end_date ? `- End Date: ${project.end_date}` : ''}

CLIENT:
- Name: ${client?.name || 'Valued Client'}
${client?.company ? `- Company: ${client.company}` : ''}

YOUR COMPANY:
${userSettings?.company_name ? `- Company: ${userSettings.company_name}` : ''}
${userSettings?.full_name ? `- Contact: ${userSettings.full_name}` : ''}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}

REQUIREMENTS:
- Tone: ${tone}
${include_timeline ? '- Include a realistic project timeline' : ''}
${include_pricing ? '- Include pricing/investment section' : ''}

STRUCTURE:
1. **Introduction**: Hook the client, understand their needs
2. **Scope of Work**: What you'll deliver (be specific)
3. **Deliverables**: Tangible outputs
${include_timeline ? '4. **Timeline**: Phases and milestones' : ''}
${include_pricing ? '5. **Investment**: Clear pricing breakdown' : ''}
6. **Why Choose Us**: Unique value proposition
7. **Next Steps**: Clear call to action

Write in markdown format. Be persuasive but authentic.`;

  return prompt;
}
