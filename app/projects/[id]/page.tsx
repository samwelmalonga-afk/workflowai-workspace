
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [project, setProject] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { init() }, [id])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const [projRes, docsRes, invRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
    ])

    if (projRes.error || !projRes.data) { window.location.href = '/projects'; return }
    setProject(projRes.data)
    setForm({
      name: projRes.data.name,
      description: projRes.data.description || '',
      client_id: projRes.data.client_id || '',
      status: projRes.data.status,
      billing_type: projRes.data.billing_type || 'fixed',
      budget_amount: projRes.data.budget_amount || '',
      hourly_rate: projRes.data.hourly_rate || '',
      start_date: projRes.data.start_date || '',
      end_date: projRes.data.end_date || '',
    })
    setDocuments(docsRes.data || [])
    setInvoices(invRes.data || [])
    setClients(clientsRes.data || [])
    setLoading(false)
  }

  const set = (field: string, value: string) => setForm((prev: any) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error } = await supabase.from('projects').update({
      name: form.name,
      description: form.description || null,
      client_id: form.client_id || null,
      status: form.status,
      billing_type: form.billing_type,
      budget_amount: form.budget_amount ? parseFloat(form.budget_amount) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }).eq('id', id)
    if (error) setError(error.message)
    else setSuccess(true)
    setSaving(false)
  }

  const statusColor: Record<string, string> = {
    lead: 'bg-gray-100 text-gray-600', proposal_sent: 'bg-blue-100 text-blue-700',
    negotiating: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700', cancelled: 'bg-red-100 text-red-600',
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">WorkflowAI</Link>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/clients" className="hover:text-blue-600">Clients</Link>
              <Link href="/projects" className="text-blue-600">Projects</Link>
              <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/projects" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Projects</Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor[project.status] || statusColor.lead}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            {project.clients?.name && <p className="text-gray-500 mt-1">👤 {project.clients.name}</p>}
          </div>
          <div className="flex gap-3">
            <Link href="/proposals/new" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">
              AI Proposal
            </Link>
            <Link href="/invoices/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
              New Invoice
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-5">Project Details</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">✅ Saved!</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    {['lead','proposal_sent','negotiating','active','completed','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing</label>
                  <select value={form.billing_type} onChange={e => set('billing_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="fixed">Fixed</option>
                    <option value="hourly">Hourly</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.billing_type === 'hourly' ? 'Hourly Rate ($)' : 'Budget ($)'}
                  </label>
                  <input type="number" value={form.billing_type === 'hourly' ? form.hourly_rate : form.budget_amount}
                    onChange={e => set(form.billing_type === 'hourly' ? 'hourly_rate' : 'budget_amount', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Documents & Invoices */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Documents</h2>
                <Link href="/proposals/new" className="text-sm text-orange-600 hover:underline">+ AI Generate</Link>
              </div>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No documents yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{doc.title}</div>
                        <div className="text-xs text-gray-500">{doc.type} · {doc.status}</div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Invoices</h2>
                <Link href="/invoices/new" className="text-sm text-green-600 hover:underline">+ New</Link>
              </div>
              {invoices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <Link href={`/invoices/${inv.id}`} key={inv.id}
                      className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-sm font-medium">{inv.invoice_number}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">${Number(inv.total).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
