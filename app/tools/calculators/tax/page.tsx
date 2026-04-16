'use client'

import { useState } from 'react'

export default function TaxCalculator() {
  const [income, setIncome] = useState('')
  const [country, setCountry] = useState('US')
  const [result, setResult] = useState<{
    income: number
    tax: number
    netIncome: number
    effectiveRate: number
  } | null>(null)

  const calculateTax = () => {
    const incomeNum = parseFloat(income)
    if (isNaN(incomeNum) || incomeNum <= 0) {
      alert('Please enter a valid income amount')
      return
    }

    let tax = 0

    // Simple tax calculation (US example)
    if (country === 'US') {
      if (incomeNum <= 10275) {
        tax = incomeNum * 0.10
      } else if (incomeNum <= 41775) {
        tax = 1027.50 + (incomeNum - 10275) * 0.12
      } else if (incomeNum <= 89075) {
        tax = 4807.50 + (incomeNum - 41775) * 0.22
      } else if (incomeNum <= 170050) {
        tax = 15213.50 + (incomeNum - 89075) * 0.24
      } else if (incomeNum <= 215950) {
        tax = 34647.50 + (incomeNum - 170050) * 0.32
      } else if (incomeNum <= 539900) {
        tax = 49335.50 + (incomeNum - 215950) * 0.35
      } else {
        tax = 162718 + (incomeNum - 539900) * 0.37
      }
    } else if (country === 'UK') {
      // UK tax calculation (simplified)
      if (incomeNum <= 12570) {
        tax = 0
      } else if (incomeNum <= 50270) {
        tax = (incomeNum - 12570) * 0.20
      } else if (incomeNum <= 150000) {
        tax = 7540 + (incomeNum - 50270) * 0.40
      } else {
        tax = 47432 + (incomeNum - 150000) * 0.45
      }
    }

    const netIncome = incomeNum - tax
    const effectiveRate = (tax / incomeNum) * 100

    setResult({
      income: incomeNum,
      tax: tax,
      netIncome: netIncome,
      effectiveRate: effectiveRate
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/dashboard" className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tax Calculator</h1>
          <p className="text-gray-600">Estimate your income tax for freelancers and small businesses</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">Calculate Your Tax</h3>
            
            {/* Country Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>

            {/* Income Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {country === 'US' ? '$' : '£'}
                </span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateTax}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Calculate Tax
            </button>

            {/* Disclaimer */}
            <p className="mt-4 text-xs text-gray-500">
              * This is an estimate for single filers. Actual tax may vary based on deductions, credits, and other factors. Consult a tax professional for accurate advice.
            </p>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Your Tax Estimate</h3>
              
              <div className="space-y-4">
                {/* Gross Income */}
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Gross Income</span>
                  <span className="text-xl font-bold">
                    {country === 'US' ? '$' : '£'}
                    {result.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Estimated Tax</span>
                  <span className="text-xl font-bold text-red-600">
                    -{country === 'US' ? '$' : '£'}
                    {result.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Net Income */}
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Net Income</span>
                  <span className="text-2xl font-bold text-green-600">
                    {country === 'US' ? '$' : '£'}
                    {result.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Effective Rate */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Effective Tax Rate</span>
                    <span className="text-lg font-bold text-blue-600">
                      {result.effectiveRate.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-sm mb-2">Monthly Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross</span>
                      <span>{country === 'US' ? '$' : '£'}{(result.income / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>{country === 'US' ? '$' : '£'}{(result.tax / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Net</span>
                      <span className="text-green-600">{country === 'US' ? '$' : '£'}{(result.netIncome / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!result && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">🧮</div>
                <p>Enter your income and click calculate to see your tax estimate</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">About This Calculator</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>•</span>
              <span>Based on {country === 'US' ? '2024 US federal' : '2024/25 UK'} tax rates</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Does not include state/local taxes or national insurance</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Assumes standard deduction for single filers</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>For informational purposes only - consult a tax professional</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
