'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    fetchClients(user.id)
  }

  const fetchClients = async (userId: string) => {
    const { data } = await supabase
      .from('clients')
      .select('*, projects(count), invoices(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return
    await supabase.from('clients').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

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
                <Link href="/clients" className="text-blue-600">Clients</Link>
                <Link href="/projects" className="hover:text-blue-600">Projects</Link>
                <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">{clients.length} total clients</p>
          </div>
          <Link href="/clients/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            + New Client
          </Link>
        </div>

        <div className="mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-6">Add your first client to get started</p>
            <Link href="/clients/new" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Add Client
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Client', 'Email', 'Company', 'Portal', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.email || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.company || '—'}</td>
                    <td className="px-6 py-4">
                      {client.portal_enabled && (
                        <a href={`/client/${client.portal_token}`} target="_blank"
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200">
                          View Portal
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link href={`/clients/${client.id}`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                        <button onClick={() => deleteClient(client.id)} className="text-sm text-red-500 hover:underline">Delete</button>
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

