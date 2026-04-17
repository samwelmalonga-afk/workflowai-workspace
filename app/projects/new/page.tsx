'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewProjectPage() {
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', description: '', client_id: '', status: 'lead',
    billing_type: 'fixed', budget_amount: '', hourly_rate: '',
    start_date: '', end_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase.from('clients').select('id, name').eq('user_id', user.id).order('name')
    setClients(data || [])
  }

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name) { setError('Project name is required'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: form.name,
      description: form.description || null,
      client_id: form.client_id || null,
      status: form.status,
      billing_type: form.billing_type,
      budget_amount: form.budget_amount ? parseFloat(form.budget_amount) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }).select().single()

    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = `/projects/${data.id}`
  }

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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/projects" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Projects</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">New Project</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Website Redesign"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">No client assigned</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="What does this project involve?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="lead">Lead</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                <select value={form.billing_type} onChange={e => set('billing_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly</option>
                  <option value="retainer">Retainer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {form.billing_type === 'fixed' || form.billing_type === 'retainer' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                  <input type="number" value={form.budget_amount} onChange={e => set('budget_amount', e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Project'}
            </button>
            <Link href="/projects" className="px-8 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 text-center">
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

