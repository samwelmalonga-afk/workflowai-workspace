'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', address: '', notes: '' })
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [portalToken, setPortalToken] = useState('')

  useEffect(() => { init() }, [id])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const [clientRes, projectsRes, invoicesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ])

    if (clientRes.error || !clientRes.data) { window.location.href = '/clients'; return }

    const c = clientRes.data
    setForm({ name: c.name, email: c.email || '', company: c.company || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' })
    setPortalToken(c.portal_token)
    setProjects(projectsRes.data || [])
    setInvoices(invoicesRes.data || [])
    setLoading(false)
  }

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('clients').update({
      name: form.name, email: form.email || null, company: form.company || null,
      phone: form.phone || null, address: form.address || null, notes: form.notes || null,
    }).eq('id', id)
    if (error) setError(error.message)
    else setSuccess(true)
    setSaving(false)
  }

  const totalRevenue = invoices.filter(i => i.paid_at).reduce((sum, i) => sum + Number(i.total), 0)
  const outstanding = invoices.filter(i => !i.paid_at && i.status !== 'draft').reduce((sum, i) => sum + Number(i.total), 0)

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">WorkflowAI</Link>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/clients" className="text-blue-600">Clients</Link>
              <Link href="/projects" className="hover:text-blue-600">Projects</Link>
              <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/clients" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Clients</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{form.name}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-yellow-600">${outstanding.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Outstanding</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-5">Client Details</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">✅ Saved successfully!</div>}
            <div className="space-y-4">
              {[
                { label: 'Name *', field: 'name', type: 'text', placeholder: 'Jane Smith' },
                { label: 'Email', field: 'email', type: 'email', placeholder: 'jane@example.com' },
                { label: 'Company', field: 'company', type: 'text', placeholder: 'Acme Corp' },
                { label: 'Phone', field: 'phone', type: 'tel', placeholder: '+1 555 000 0000' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.field]} onChange={e => set(f.field, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Portal Link */}
            {portalToken && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-sm mb-2">Client Portal Link</h3>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">/client/{portalToken}</span>
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/client/${portalToken}`)}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex-shrink-0">
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Projects & Invoices */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Projects</h2>
                <Link href={`/projects/new`} className="text-sm text-blue-600 hover:underline">+ New</Link>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => (
                    <Link href={`/projects/${p.id}`} key={p.id}
                      className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Invoices</h2>
                <Link href="/invoices/new" className="text-sm text-blue-600 hover:underline">+ New</Link>
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
                        <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
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

