# File 2/5: Dashboard
# Creates: app\dashboard\page.tsx

Write-Host "[2/5] Creating app\dashboard\page.tsx..." -ForegroundColor Cyan

$content = @'
'use client'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Access all your business tools in one place</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <a href="/tools/documents/word-to-pdf" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-purple-600">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📄</div>
              <div>
                <h3 className="font-bold text-lg">Word to PDF</h3>
                <p className="text-sm text-gray-600">Convert documents instantly</p>
              </div>
            </div>
          </a>

          <a href="/tools/calculators/tax" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-green-600">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💰</div>
              <div>
                <h3 className="font-bold text-lg">Tax Calculator</h3>
                <p className="text-sm text-gray-600">Estimate your taxes</p>
              </div>
            </div>
          </a>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-300 opacity-60">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📝</div>
              <div>
                <h3 className="font-bold text-lg">Create Invoice</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Categories */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Document Tools */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📄</span> Document Tools
            </h2>
            <ul className="space-y-3">
              <li>
                <a href="/tools/documents/word-to-pdf" className="flex items-center justify-between p-3 rounded hover:bg-gray-50 transition-colors">
                  <span className="font-medium">Word to PDF Converter</span>
                  <span className="text-purple-600">→</span>
                </a>
              </li>
              <li className="flex items-center justify-between p-3 rounded bg-gray-50 opacity-60">
                <span className="font-medium text-gray-500">PDF Merger</span>
                <span className="text-xs text-gray-400">Coming soon</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded bg-gray-50 opacity-60">
                <span className="font-medium text-gray-500">Image Compressor</span>
                <span className="text-xs text-gray-400">Coming soon</span>
              </li>
            </ul>
          </div>

          {/* Business Calculators */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🧮</span> Business Calculators
            </h2>
            <ul className="space-y-3">
              <li>
                <a href="/tools/calculators/tax" className="flex items-center justify-between p-3 rounded hover:bg-gray-50 transition-colors">
                  <span className="font-medium">Tax Calculator</span>
                  <span className="text-green-600">→</span>
                </a>
              </li>
              <li className="flex items-center justify-between p-3 rounded bg-gray-50 opacity-60">
                <span className="font-medium text-gray-500">Profit Margin Calculator</span>
                <span className="text-xs text-gray-400">Coming soon</span>
              </li>
              <li className="flex items-center justify-between p-3 rounded bg-gray-50 opacity-60">
                <span className="font-medium text-gray-500">Currency Converter</span>
                <span className="text-xs text-gray-400">Coming soon</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
'@

$content | Out-File -FilePath "app\dashboard\page.tsx" -Encoding UTF8 -NoNewline

Write-Host "  ✓ Created app\dashboard\page.tsx" -ForegroundColor Green
