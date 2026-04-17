import Link from 'next/link'

export default function CalculatorsIndex() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block">← Back to Home</Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Calculators</h1>
          <p className="text-gray-600">Tools to help you price, plan, and manage your business finances</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link href="/tools/calculators/tax" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-green-600 block group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🧾</div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Tax Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">Estimate income tax for US and UK freelancers and businesses</p>
            <div className="text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">Use Tool →</div>
          </Link>

          <Link href="/tools/calculators/profit-margin" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-green-600 block group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📈</div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Profit Margin Calculator</h3>
            <p className="text-gray-600 text-sm mb-4">Calculate profit margins, markups, and revenue targets</p>
            <div className="text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">Use Tool →</div>
          </Link>

          <Link href="/tools/calculators/currency" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-green-600 block group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">💱</div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Currency Converter</h3>
            <p className="text-gray-600 text-sm mb-4">Convert between 15 major world currencies instantly</p>
            <div className="text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">Use Tool →</div>
          </Link>

          <Link href="/tools/calculators/time-tracker" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-green-600 block group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">⏱️</div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Time Tracker</h3>
            <p className="text-gray-600 text-sm mb-4">Track billable hours and calculate client earnings</p>
            <div className="text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">Use Tool →</div>
          </Link>

        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Why Use Our Calculators?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div><div className="text-3xl mb-2">🎯</div><h3 className="font-bold mb-2">Built for Freelancers</h3><p className="text-sm text-gray-600">Designed specifically for freelancers and small business owners.</p></div>
            <div><div className="text-3xl mb-2">⚡</div><h3 className="font-bold mb-2">Instant Results</h3><p className="text-sm text-gray-600">Get answers in seconds with no sign-up required.</p></div>
            <div><div className="text-3xl mb-2">🔒</div><h3 className="font-bold mb-2">Private & Secure</h3><p className="text-sm text-gray-600">All calculations happen in your browser. No data stored.</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

