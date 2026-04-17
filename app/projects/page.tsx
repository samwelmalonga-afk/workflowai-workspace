'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const statusColor: Record<string, string> = {
    lead: 'bg-gray-100 text-gray-600',
    proposal_sent: 'bg-blue-100 text-blue-700',
    negotiating: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-600',
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
                <Link href="/projects" className="text-blue-600">Projects</Link>
                <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">{projects.length} total projects</p>
          </div>
          <div className="flex gap-3">
            <Link href="/proposals/new"
              className="bg-orange-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
              AI Proposal
            </Link>
            <Link href="/projects/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              + New Project
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'lead', 'active', 'proposal_sent', 'negotiating', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' ? 'Create your first project to get started' : `No ${filter.replace('_', ' ')} projects`}
            </p>
            {filter === 'all' && (
              <Link href="/projects/new" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
                Create Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <Link href={`/projects/${project.id}`} key={project.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 block">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${statusColor[project.status] || statusColor.lead}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {project.clients?.name && (
                  <p className="text-sm text-gray-500 mb-3">👤 {project.clients.name}</p>
                )}

                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center justify-between text-sm mt-auto">
                  <span className="text-gray-500 capitalize">{project.billing_type}</span>
                  {project.budget_amount && (
                    <span className="font-semibold text-gray-900">
                      ${Number(project.budget_amount).toLocaleString()}
                    </span>
                  )}
                  {project.hourly_rate && (
                    <span className="font-semibold text-gray-900">
                      ${project.hourly_rate}/hr
                    </span>
                  )}
                </div>

                {(project.start_date || project.end_date) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    {project.start_date && <span>{new Date(project.start_date).toLocaleDateString()}</span>}
                    {project.start_date && project.end_date && <span> → </span>}
                    {project.end_date && <span>{new Date(project.end_date).toLocaleDateString()}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

