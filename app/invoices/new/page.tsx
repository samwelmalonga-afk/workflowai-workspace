'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function NewInvoicePage() {
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('30')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

  // Manual mode
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    setSession(session)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [c, p] = await Promise.all([
      supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('projects').select('id, name, client_id').eq('user_id', user.id).order('name'),
    ])
    setClients(c.data || [])
    setProjects(p.data || [])
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate
    }
    setLineItems(updated)
  }

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }])
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i))

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (parseFloat(taxRate) / 100)
  const total = subtotal + taxAmount

  const generateWithAI = async () => {
    if (!projectId || !clientId) { setError('Please select both a project and client'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ project_id: projectId, client_id: clientId, payment_terms: parseInt(paymentTerms), context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSuccess(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveManual = async () => {
    if (!clientId) { setError('Please select a client'); return }
    if (lineItems.some(i => !i.description)) { setError('All line items need a description'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: last } = await supabase.from('invoices').select('invoice_number').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const nextNum = last ? parseInt(last.invoice_number.replace(/\D/g, '')) + 1 : 1001
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + parseInt(paymentTerms))

    const { data, error } = await supabase.from('invoices').insert({
      user_id: user.id,
      client_id: clientId,
      project_id: projectId || null,
      invoice_number: `INV-${nextNum}`,
      line_items: lineItems,
      subtotal,
      tax_rate: parseFloat(taxRate),
      tax_amount: taxAmount,
      total,
      currency: 'USD',
      payment_terms: parseInt(paymentTerms),
      due_date: dueDate.toISOString().split('T')[0],
      notes: notes || null,
      status: 'draft',
    }).select().single()

    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = `/invoices/${data.id}`
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Created!</h2>
        <p className="text-gray-600 mb-6">Your invoice has been generated with a Stripe payment link.</p>
        {success.payment_link_url && (
          <a href={success.payment_link_url} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mb-3">
            View Payment Link
          </a>
        )}
        <Link href="/invoices" className="block w-full border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50">
          View All Invoices
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">WorkflowAI</Link>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/clients" className="hover:text-blue-600">Clients</Link>
              <Link href="/projects" className="hover:text-blue-600">Projects</Link>
              <Link href="/invoices" className="text-blue-600">Invoices</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/invoices" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Invoices</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">New Invoice</h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('ai')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${mode === 'ai' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            🤖 AI Generate
          </button>
          <button onClick={() => setMode('manual')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            ✏️ Manual
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="7">Net 7</option>
                <option value="14">Net 14</option>
                <option value="30">Net 30</option>
                <option value="60">Net 60</option>
              </select>
            </div>

            {mode === 'ai' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context (optional)</label>
                  <textarea value={context} onChange={e => setContext(e.target.value)}
                    placeholder="e.g. This is the final invoice for the website project, include hosting setup fee..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <button onClick={generateWithAI} disabled={loading || !clientId || !projectId}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating...</>
                  ) : '🤖 Generate Invoice with AI'}
                </button>
              </>
            )}

            {mode === 'manual' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Line Items</label>
                    <button onClick={addLineItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Item</button>
                  </div>
                  <div className="space-y-3">
                    {lineItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                          placeholder="Description" className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        <input type="number" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value))}
                          placeholder="Qty" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        <input type="number" value={item.rate} onChange={e => updateLineItem(i, 'rate', parseFloat(e.target.value))}
                          placeholder="Rate" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        <div className="col-span-2 px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium">${item.amount.toFixed(2)}</div>
                        <button onClick={() => removeLineItem(i)} className="col-span-1 text-red-400 hover:text-red-600 text-center">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Tax Rate (%)</span>
                    <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right" />
                  </div>
                  <div className="flex justify-between text-sm"><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Payment instructions, bank details, thank you message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                <button onClick={saveManual} disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Invoice'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

