'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ProfitMarginCalculator() {
  const [mode, setMode] = useState<'margin' | 'markup' | 'revenue'>('margin')
  const [cost, setCost] = useState('')
  const [revenue, setRevenue] = useState('')
  const [margin, setMargin] = useState('')
  const [result, setResult] = useState<any>(null)

  const calculate = () => {
    const costNum = parseFloat(cost)
    const revenueNum = parseFloat(revenue)
    const marginNum = parseFloat(margin)

    if (mode === 'margin') {
      if (isNaN(costNum) || isNaN(revenueNum)) return
      const profit = revenueNum - costNum
      const profitMargin = (profit / revenueNum) * 100
      const markup = (profit / costNum) * 100
      setResult({ profit, profitMargin, markup, revenue: revenueNum, cost: costNum })
    } else if (mode === 'markup') {
      if (isNaN(costNum) || isNaN(marginNum)) return
      const revenueCalc = costNum * (1 + marginNum / 100)
      const profit = revenueCalc - costNum
      const profitMargin = (profit / revenueCalc) * 100
      setResult({ profit, profitMargin, markup: marginNum, revenue: revenueCalc, cost: costNum })
    } else {
      if (isNaN(revenueNum) || isNaN(marginNum)) return
      const profit = revenueNum * (marginNum / 100)
      const costCalc = revenueNum - profit
      const markup = (profit / costCalc) * 100
      setResult({ profit, profitMargin: marginNum, markup, revenue: revenueNum, cost: costCalc })
    }
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/tools/calculators" className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block">← Back to Calculators</Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profit Margin Calculator</h1>
          <p className="text-gray-600">Calculate profit margins, markups, and revenue for your business</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'margin', label: 'Profit Margin' },
                { key: 'markup', label: 'Markup' },
                { key: 'revenue', label: 'Revenue' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key as any); setResult(null) }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${mode === m.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
              {(mode === 'margin' || mode === 'markup') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              )}
              {(mode === 'margin' || mode === 'revenue') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {mode === 'margin' ? 'Selling Price ($)' : 'Revenue ($)'}
                  </label>
                  <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              )}
              {(mode === 'markup' || mode === 'revenue') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {mode === 'markup' ? 'Markup (%)' : 'Profit Margin (%)'}
                  </label>
                  <input type="number" value={margin} onChange={e => setMargin(e.target.value)} placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              )}
            </div>

            <button onClick={calculate}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Calculate
            </button>
          </div>

          {/* Results */}
          {result ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Revenue</span>
                  <span className="text-xl font-bold">${fmt(result.revenue)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Cost</span>
                  <span className="text-xl font-bold text-red-600">-${fmt(result.cost)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Profit</span>
                  <span className="text-xl font-bold text-green-600">${fmt(result.profit)}</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Profit Margin</span>
                    <span className="text-lg font-bold text-green-600">{result.profitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Markup</span>
                    <span className="text-lg font-bold text-blue-600">{result.markup.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Profit per Unit</h4>
                  <div className="text-2xl font-bold text-green-600">${fmt(result.profit)}</div>
                  <div className="text-xs text-gray-500 mt-1">You keep ${fmt(result.profit)} for every ${fmt(result.revenue)} in revenue</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📈</div>
                <p>Enter values and click calculate</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">Understanding the Difference</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-1">Profit Margin</h4>
              <p>Profit as a % of <strong>revenue</strong>. Industry average: 10-20%</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Markup</h4>
              <p>Profit as a % of <strong>cost</strong>. Retail average: 50-100%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

