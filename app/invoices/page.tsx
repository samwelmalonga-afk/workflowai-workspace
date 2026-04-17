'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name, email), projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  const totalRevenue = invoices.filter(i => i.paid_at).reduce((sum, i) => sum + Number(i.total), 0)
  const totalOutstanding = invoices.filter(i => !i.paid_at && i.status !== 'draft').reduce((sum, i) => sum + Number(i.total), 0)
  const overdue = invoices.filter(i => i.status === 'overdue').length

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">WorkflowAI</Link>
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <Link href="/clients" className="hover:text-blue-600">Clients</Link>
                <Link href="/projects" className="hover:text-blue-600">Projects</Link>
                <Link href="/invoices" className="text-blue-600">Invoices</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">{invoices.length} total invoices</p>
          </div>
          <Link href="/invoices/new"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            + New Invoice
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Outstanding</div>
            <div className="text-2xl font-bold text-yellow-600">${totalOutstanding.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Overdue</div>
            <div className={`text-2xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdue}</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' ? 'Create your first invoice to get paid faster' : `No ${filter} invoices`}
            </p>
            {filter === 'all' && (
              <Link href="/invoices/new" className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700">
                Create Invoice
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Invoice', 'Client', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
                      <div className="text-xs text-gray-500">{invoice.projects?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{invoice.clients?.name}</td>
                    <td className="px-6 py-4 font-semibold">${Number(invoice.total).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[invoice.status] || statusColor.draft}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <Link href={`/invoices/${invoice.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
                        {invoice.stripe_payment_link_url && !invoice.paid_at && (
                          <a href={invoice.stripe_payment_link_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">
                            Pay Link
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

