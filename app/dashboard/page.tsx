'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    setUser(user)
    await fetchData(user.id)
  }

  const fetchData = async (userId: string) => {
    const [clientsRes, projectsRes, invoicesRes, activitiesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('projects').select('*, clients(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*, clients(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ])
    setClients(clientsRes.data || [])
    setProjects(projectsRes.data || [])
    setInvoices(invoicesRes.data || [])
    setActivities(activitiesRes.data || [])
    setLoading(false)
  }

  const totalRevenue = invoices.filter(i => i.paid_at).reduce((sum, i) => sum + Number(i.total), 0)
  const outstanding = invoices.filter(i => !i.paid_at && i.status !== 'draft').reduce((sum, i) => sum + Number(i.total), 0)
  const activeProjects = projects.filter(p => p.status === 'active').length
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading your workspace...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">WorkflowAI</Link>
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <Link href="/dashboard" className="text-blue-600">Dashboard</Link>
                <Link href="/clients" className="hover:text-blue-600">Clients</Link>
                <Link href="/projects" className="hover:text-blue-600">Projects</Link>
                <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
                <Link href="/tools/documents" className="hover:text-blue-600">Tools</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
                className="text-sm text-red-500 hover:text-red-700">Sign out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-green-50 text-green-600' },
            { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: '⏳', color: overdueInvoices > 0 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600' },
            { label: 'Active Projects', value: activeProjects, icon: '🚀', color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Clients', value: clients.length, icon: '👥', color: 'bg-purple-50 text-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} text-xl mb-3`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/clients/new" className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
              <span className="text-2xl">👤</span>
              <span className="text-sm font-semibold text-blue-700">New Client</span>
            </Link>
            <Link href="/projects/new" className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
              <span className="text-2xl">📁</span>
              <span className="text-sm font-semibold text-purple-700">New Project</span>
            </Link>
            <Link href="/invoices/new" className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
              <span className="text-2xl">📝</span>
              <span className="text-sm font-semibold text-green-700">New Invoice</span>
            </Link>
            <Link href="/proposals/new" className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
              <span className="text-2xl">🤖</span>
              <span className="text-sm font-semibold text-orange-700">AI Proposal</span>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Recent Projects</h2>
              <Link href="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm">No projects yet</p>
                <Link href="/projects/new" className="text-blue-600 text-sm hover:underline">Create your first project</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => (
                  <Link href={`/projects/${project.id}`} key={project.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.clients?.name}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{project.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Recent Invoices</h2>
              <Link href="/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">No invoices yet</p>
                <Link href="/invoices/new" className="text-blue-600 text-sm hover:underline">Create your first invoice</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <Link href={`/invoices/${invoice.id}`} key={invoice.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <div className="font-medium text-sm">{invoice.invoice_number}</div>
                      <div className="text-xs text-gray-500">{invoice.clients?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">${Number(invoice.total).toLocaleString()}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{invoice.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-8">
            <h2 className="font-bold text-lg mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    {activity.type.startsWith('invoice') ? '💰' :
                     activity.type.startsWith('proposal') ? '📋' :
                     activity.type.startsWith('contract') ? '📜' : '📌'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{activity.description}</div>
                    <div className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

