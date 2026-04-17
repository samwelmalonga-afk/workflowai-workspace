'use client'

import { useState } from 'react'
import Link from 'next/link'

const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, CAD: 1.36,
  AUD: 1.53, CHF: 0.89, CNY: 7.24, INR: 83.12, MXN: 17.15,
  BRL: 4.97, ZAR: 18.63, NGN: 1540, KES: 129, GHS: 12.5,
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan', INR: 'Indian Rupee', MXN: 'Mexican Peso',
  BRL: 'Brazilian Real', ZAR: 'South African Rand', NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling', GHS: 'Ghanaian Cedi',
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [result, setResult] = useState<number | null>(null)

  const convert = () => {
    const amt = parseFloat(amount)
    if (isNaN(amt)) return
    const inUSD = amt / RATES[from]
    const converted = inUSD * RATES[to]
    setResult(converted)
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
    setResult(null)
  }

  const allPairs = Object.keys(RATES).filter(c => c !== from).map(c => {
    const inUSD = 1 / RATES[from]
    return { currency: c, rate: inUSD * RATES[c] }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/tools/calculators" className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block">← Back to Calculators</Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Currency Converter</h1>
          <p className="text-gray-600">Convert between 15 major world currencies</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select value={from} onChange={e => { setFrom(e.target.value); setResult(null) }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                {Object.keys(RATES).map(c => <option key={c} value={c}>{c} - {CURRENCY_NAMES[c]}</option>)}
              </select>
            </div>
            <div className="flex justify-center">
              <button onClick={swap}
                className="w-12 h-12 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center text-green-600 font-bold text-xl transition-colors">
                ⇄
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select value={to} onChange={e => { setTo(e.target.value); setResult(null) }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                {Object.keys(RATES).map(c => <option key={c} value={c}>{c} - {CURRENCY_NAMES[c]}</option>)}
              </select>
            </div>
          </div>

          <button onClick={convert}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors">
            Convert
          </button>

          {result !== null && (
            <div className="mt-6 bg-green-50 rounded-lg p-6 text-center">
              <div className="text-sm text-gray-600 mb-1">{amount} {from} =</div>
              <div className="text-4xl font-bold text-green-600">
                {result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {to}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                1 {from} = {(RATES[to] / RATES[from]).toFixed(4)} {to}
              </div>
            </div>
          )}
        </div>

        {/* Exchange Rate Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">1 {from} in other currencies</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allPairs.map(({ currency, rate }) => (
              <div key={currency} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <span className="font-semibold text-gray-700">{currency}</span>
                <span className="text-gray-600">{rate.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">* Rates are approximate and for reference only. Use a financial service for actual transactions.</p>
        </div>
      </div>
    </div>
  )
}

