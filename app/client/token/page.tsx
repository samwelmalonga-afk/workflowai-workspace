import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, DollarSign, Clock, Download, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface PageProps {
  params: {
    token: string;
  };
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { token } = params;
  const supabase = createServerComponentClient({ cookies });

  // 1. FETCH CLIENT BY PORTAL TOKEN (PUBLIC ACCESS)
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('portal_token', token)
    .eq('portal_enabled', true)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // 2. FETCH PROJECTS FOR THIS CLIENT
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  // 3. FETCH DOCUMENTS
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', client.id)
    .in('status', ['sent', 'viewed', 'accepted'])
    .order('created_at', { ascending: false });

  // 4. FETCH INVOICES
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  // Calculate totals
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
  const totalPaid = invoices?.filter(inv => inv.paid_at).reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
  const totalOutstanding = totalInvoiced - totalPaid;

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const pendingDocuments = documents?.filter(d => d.status === 'sent') || [];
  const overdueInvoices = invoices?.filter(inv => 
    !inv.paid_at && inv.status === 'overdue'
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {client.name}
              </h1>
              {client.company && (
                <p className="text-slate-600 mt-1">{client.company}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Projects"
            value={activeProjects.length}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(totalInvoiced, invoices?.[0]?.currency)}
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
            bgColor="bg-green-50"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(totalOutstanding, invoices?.[0]?.currency)}
            icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
            bgColor="bg-amber-50"
            highlight={overdueInvoices.length > 0}
          />
          <StatCard
            title="Documents"
            value={pendingDocuments.length}
            subtitle="awaiting review"
            icon={<FileText className="w-5 h-5 text-purple-600" />}
            bgColor="bg-purple-50"
          />
        </div>

        {/* Alerts */}
        {overdueInvoices.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Overdue Invoices</h3>
              <p className="text-red-700 text-sm mt-1">
                You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} totaling{' '}
                {formatCurrency(
                  overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
                  overdueInvoices[0]?.currency
                )}
                . Please review and pay below.
              </p>
            </div>
          </div>
        )}

        {/* Invoices Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Invoices
          </h2>
          {invoices && invoices.length > 0 ? (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{invoice.invoice_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <InvoiceStatusBadge status={invoice.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {invoice.stripe_payment_link_url && !invoice.paid_at && (
                              <a
                                href={invoice.stripe_payment_link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Pay Now
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {invoice.paid_at && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState message="No invoices yet" />
          )}
        </section>

        {/* Projects Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Projects
          </h2>
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState message="No projects yet" />
          )}
        </section>

        {/* Documents Section */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents
          </h2>
          {documents && documents.length > 0 ? (
            <div className="bg-white rounded-lg border shadow-sm divide-y">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <EmptyState message="No documents yet" />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>Questions? Contact your account manager at {client.email || 'support@example.com'}</p>
          <p className="mt-2 text-xs text-slate-500">
            This is a secure client portal. Do not share this link.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ========================================
// COMPONENTS
// ========================================

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  bgColor, 
  highlight 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode; 
  bgColor: string; 
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg border ${highlight ? 'border-amber-300 ring-2 ring-amber-200' : ''} p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className={`${bgColor} p-2 rounded-lg`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const statusColors: Record<string, string> = {
    lead: 'bg-slate-100 text-slate-700',
    proposal_sent: 'bg-blue-100 text-blue-700',
    negotiating: 'bg-purple-100 text-purple-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{project.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || statusColors.lead}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>
      {project.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        {project.start_date && (
          <div className="text-slate-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            {new Date(project.start_date).toLocaleDateString()}
          </div>
        )}
        {project.budget_amount && (
          <div className="font-semibold text-slate-900">
            {formatCurrency(project.budget_amount, project.budget_currency)}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ document }: { document: any }) {
  const typeIcons: Record<string, React.ReactNode> = {
    proposal: <FileText className="w-5 h-5 text-blue-600" />,
    contract: <FileText className="w-5 h-5 text-purple-600" />,
    invoice: <DollarSign className="w-5 h-5 text-green-600" />,
    other: <FileText className="w-5 h-5 text-slate-600" />,
  };

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {typeIcons[document.type] || typeIcons.other}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 truncate">{document.title}</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              {document.type} • {new Date(document.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        {document.pdf_url && (
          <a
            href={document.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
    sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
    viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-700' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-700' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-lg border border-dashed p-12 text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}

// ========================================
// UTILITIES
// ========================================

function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}
