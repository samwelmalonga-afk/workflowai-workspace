'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewProposalPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [context, setContext] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'technical'>('professional')
  const [includeTimeline, setIncludeTimeline] = useState(true)
  const [includePricing, setIncludePricing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    setSession(session)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('projects').select('*, clients(name)').eq('user_id', user.id).order('created_at', { ascending: false })
    setProjects(data || [])
  }

  const generate = async () => {
    if (!projectId) { setError('Please select a project'); return }
    setLoading(true)
    setError('')
    setResult('')

    try {
      const res = await fetch('/.netlify/functions/create-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          context,
          tone,
          include_timeline: includeTimeline,
          include_pricing: includePricing,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data.content)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
    alert('Copied to clipboard!')
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
              <Link href="/projects" className="hover:text-blue-600">Projects</Link>
              <Link href="/invoices" className="hover:text-blue-600">Invoices</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">AI Proposal Generator</h1>
          <p className="text-gray-600">Generate a professional proposal using Claude AI</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Config */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-5">Proposal Settings</h2>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.clients?.name}</option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    <Link href="/projects/new" className="underline">Create a project</Link> first
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <div className="flex gap-2">
                  {(['professional', 'friendly', 'technical'] as const).map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tone === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeTimeline} onChange={e => setIncludeTimeline(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Include Timeline</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includePricing} onChange={e => setIncludePricing(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Include Pricing</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context (optional)</label>
                <textarea value={context} onChange={e => setContext(e.target.value)}
                  placeholder="Any specific requirements, competitor context, or special instructions..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <button onClick={generate} disabled={loading || !projectId}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Generating with AI...
                  </>
                ) : '🤖 Generate Proposal'}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Generated Proposal</h2>
              {result && (
                <button onClick={copyToClipboard}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  📋 Copy
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-bounce">🤖</div>
                  <p className="text-gray-600">Claude is writing your proposal...</p>
                  <p className="text-xs text-gray-400 mt-1">This usually takes 15-30 seconds</p>
                </div>
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">{result}</pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">📋</div>
                  <p>Your proposal will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

