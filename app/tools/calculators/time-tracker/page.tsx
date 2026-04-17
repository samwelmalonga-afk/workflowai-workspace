'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface TimeEntry {
  id: string
  project: string
  description: string
  duration: number
  date: string
}

export default function TimeTracker() {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [project, setProject] = useState('')
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [hourlyRate, setHourlyRate] = useState('50')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('time-entries')
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsed * 1000
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const stop = () => {
    setIsRunning(false)
    if (elapsed > 0) {
      const entry: TimeEntry = {
        id: Date.now().toString(),
        project: project || 'Untitled Project',
        description: description || 'No description',
        duration: elapsed,
        date: new Date().toLocaleDateString(),
      }
      const updated = [entry, ...entries]
      setEntries(updated)
      try { localStorage.setItem('time-entries', JSON.stringify(updated)) } catch {}
      setElapsed(0)
    }
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    try { localStorage.setItem('time-entries', JSON.stringify(updated)) } catch {}
  }

  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0)
  const totalHours = totalSeconds / 3600
  const totalEarnings = totalHours * parseFloat(hourlyRate || '0')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/tools/calculators" className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block">
            Back to Calculators
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Time Tracker</h1>
          <p className="text-gray-600">Track billable hours and calculate earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <div className="text-7xl font-mono font-bold text-gray-900 mb-6">{formatTime(elapsed)}</div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input type="text" value={project} onChange={e => setProject(e.target.value)}
              placeholder="Project name" disabled={isRunning}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50" />
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)" disabled={isRunning}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50" />
          </div>
          <div className="flex gap-4 justify-center">
            {!isRunning ? (
              <button onClick={() => setIsRunning(true)}
                className="px-12 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors">
                Start
              </button>
            ) : (
              <>
                <button onClick={() => setIsRunning(false)}
                  className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-bold text-lg hover:bg-yellow-600 transition-colors">
                  Pause
                </button>
                <button onClick={stop}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors">
                  Stop and Save
                </button>
              </>
            )}
          </div>
        </div>

        {entries.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-bold text-lg flex-1">Summary</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Hourly Rate $</label>
                  <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
                  <div className="text-xs text-gray-600">Sessions</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{totalHours.toFixed(2)}h</div>
                  <div className="text-xs text-gray-600">Total Hours</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">${totalEarnings.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">Total Earnings</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Time Entries</h3>
              <div className="space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{entry.project}</div>
                      <div className="text-xs text-gray-500">{entry.description} - {entry.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">{formatTime(entry.duration)}</div>
                      <div className="text-xs text-green-600">
                        ${((entry.duration / 3600) * parseFloat(hourlyRate || '0')).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 p-1">X</button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setEntries([]); try { localStorage.removeItem('time-entries') } catch {} }}
                className="mt-4 text-sm text-red-500 hover:text-red-700">
                Clear all entries
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
