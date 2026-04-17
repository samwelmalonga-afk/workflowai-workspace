
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { init() }, [id])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(name, email, company, address), projects(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (error || !data) { window.location.href = '/invoices'; return }
    setInvoice(data)
    setLoading(false)
  }

  const markAsSent = async () => {
    setUpdating(true)
    await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    setInvoice((prev: any) => ({ ...prev, status: 'sent' }))
    setUpdating(false)
  }

  const markAsPaid = async () => {
    setUpdating(true)
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    setInvoice((prev: any) => ({ ...prev, status: 'paid', paid_at: new Date().toISOString() }))
    setUpdating(false)
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700', paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>

  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : []

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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/invoices" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Invoices</Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor[invoice.status] || statusColor.draft}`}>
                {invoice.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {invoice.status === 'draft' && (
              <button onClick={markAsSent} disabled={updating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                Mark as Sent
              </button>
            )}
            {!invoice.paid_at && invoice.status !== 'draft' && (
              <button onClick={markAsPaid} disabled={updating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                Mark as Paid
              </button>
            )}
            {invoice.stripe_payment_link_url && !invoice.paid_at && (
              <a href={invoice.stripe_payment_link_url} target="_blank" rel="noopener noreferrer"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">
                Payment Link
              </a>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <div className="text-gray-500 mt-1">{invoice.invoice_number}</div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div><strong>Date:</strong> {new Date(invoice.created_at).toLocaleDateString()}</div>
              <div><strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString()}</div>
              {invoice.paid_at && <div className="text-green-600 font-semibold">Paid: {new Date(invoice.paid_at).toLocaleDateString()}</div>}
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</div>
            <div className="font-semibold">{invoice.clients?.name}</div>
            {invoice.clients?.company && <div className="text-sm text-gray-600">{invoice.clients.company}</div>}
            {invoice.clients?.email && <div className="text-sm text-gray-600">{invoice.clients.email}</div>}
            {invoice.clients?.address && <div className="text-sm text-gray-600">{invoice.clients.address}</div>}
            {invoice.projects?.name && <div className="text-sm text-gray-500 mt-1">Project: {invoice.projects.name}</div>}
          </div>

          {/* Line Items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Qty</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Rate</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="py-3 text-sm text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-right">${Number(item.rate).toFixed(2)}</td>
                  <td className="py-3 text-sm text-right font-medium">${Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.tax_rate}%)</span>
                  <span>${Number(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${Number(invoice.total).toFixed(2)} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</div>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
