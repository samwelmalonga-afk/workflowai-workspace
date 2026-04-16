# File 1/5: Enhanced Landing Page
# Creates: app\page.tsx

Write-Host "[1/5] Creating app\page.tsx..." -ForegroundColor Cyan

# Create backup if file exists
if (Test-Path "app\page.tsx") {
    Copy-Item "app\page.tsx" "app\page.tsx.backup" -Force
    Write-Host "  Backup created: app\page.tsx.backup" -ForegroundColor Yellow
}

# The landing page code
$content = @'
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            WorkflowAI Workspace
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
            Your Complete Business Toolkit
          </p>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered tools for freelancers, agencies, and businesses of all sizes
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-500">
            <span className="bg-blue-50 px-4 py-2 rounded-full">✓ For Freelancers</span>
            <span className="bg-purple-50 px-4 py-2 rounded-full">✓ For Small Businesses</span>
            <span className="bg-green-50 px-4 py-2 rounded-full">✓ For Agencies</span>
            <span className="bg-orange-50 px-4 py-2 rounded-full">✓ Official & Non-Official</span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <a href="/dashboard" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 block group">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Client Management</h3>
            <p className="text-gray-600 text-sm mb-4">AI-powered proposals, contracts, and invoicing</p>
            <div className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">View Tools →</div>
          </a>

          <a href="/tools/documents" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 block group">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Document Tools</h3>
            <p className="text-gray-600 text-sm mb-4">Convert, merge, and compress files instantly</p>
            <div className="text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">Convert Now →</div>
          </a>

          <a href="/tools/calculators/tax" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 block group">
            <div className="text-4xl mb-4">🧮</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Business Calculators</h3>
            <p className="text-gray-600 text-sm mb-4">Tax, profit, currency, and rate calculators</p>
            <div className="text-green-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">Calculate →</div>
          </a>

          <a href="/dashboard" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 block group">
            <div className="text-4xl mb-4">📣</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Marketing Tools</h3>
            <p className="text-gray-600 text-sm mb-4">AI templates and content generators</p>
            <div className="text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">Coming Soon →</div>
          </a>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Why WorkflowAI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-3">⚡</div>
              <h3 className="font-bold mb-2 text-lg">Instant Results</h3>
              <p className="text-blue-100 text-sm">AI-powered tools deliver professional results in seconds</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="font-bold mb-2 text-lg">Save Money</h3>
              <p className="text-blue-100 text-sm">Replace multiple subscriptions with one complete toolkit</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🌍</div>
              <h3 className="font-bold mb-2 text-lg">For Everyone</h3>
              <p className="text-blue-100 text-sm">Perfect for official and non-official businesses worldwide</p>
            </div>
          </div>
        </div>

        {/* Popular Tools */}
        <div className="bg-gray-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Most Popular Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/dashboard" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-sm text-gray-800">Create Invoice</div>
            </a>
            <a href="/tools/documents/word-to-pdf" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold text-sm text-gray-800">Word to PDF</div>
            </a>
            <a href="/tools/calculators/tax" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold text-sm text-gray-800">Tax Calculator</div>
            </a>
            <a href="/dashboard" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">✉️</div>
              <div className="font-semibold text-sm text-gray-800">Email Template</div>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to streamline your business?</h2>
          <p className="text-gray-600 mb-8 text-lg">Start using our tools for free. No credit card required.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/dashboard" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg inline-block">
              Open Dashboard
            </a>
            <a href="/tools/documents" className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-gray-300 text-lg inline-block">
              Try Tools Free
            </a>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p className="mb-2">System Status: All Services Operational</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>InvoiceAI
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>ProposalAI
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>ContractAI
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>DocumentTools
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>Calculators
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
'@

# Write file
$content | Out-File -FilePath "app\page.tsx" -Encoding UTF8 -NoNewline

Write-Host "  ✓ Created app\page.tsx" -ForegroundColor Green
