import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top Nav */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-xl font-bold text-blue-600">WorkflowAI</span>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Sign In</Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            WorkflowAI Workspace
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
            Your Complete Business Toolkit
          </p>
          <p className="text-xl text-gray-600 mb-8">
            From invoices to document conversion to marketing tools
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

          {/* Client Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Client Management</h3>
            <p className="text-gray-600 mb-4 text-sm">AI-powered proposals, contracts, and invoicing with payment tracking</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Create Proposals</li>
              <li>• Generate Contracts</li>
              <li>• Send Invoices</li>
              <li>• Track Payments</li>
            </ul>
            <Link href="/dashboard" className="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold text-center block">
              Get Started
            </Link>
          </div>

          {/* Document Tools */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Document Tools</h3>
            <p className="text-gray-600 mb-4 text-sm">Convert, merge, compress, and edit documents instantly</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Word to PDF</li>
              <li>• PDF Merger</li>
              <li>• Image Compressor</li>
              <li>• Excel to CSV</li>
            </ul>
            <Link href="/tools/documents" className="mt-auto w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold text-center block">
              Convert Now
            </Link>
          </div>

          {/* Business Utilities */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">🧮</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Business Utilities</h3>
            <p className="text-gray-600 mb-4 text-sm">Calculators and tools to price and manage your business</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Tax Calculator</li>
              <li>• Profit Margins</li>
              <li>• Time Tracker</li>
              <li>• Currency Converter</li>
            </ul>
            <Link href="/tools/calculators" className="mt-auto w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold text-center block">
              Calculate
            </Link>
          </div>

          {/* Marketing Tools */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="text-4xl mb-4">📣</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Marketing Tools</h3>
            <p className="text-gray-600 mb-4 text-sm">Templates and generators for professional communication</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Email Templates</li>
              <li>• Social Media Posts</li>
              <li>• Business Cards</li>
              <li>• Meeting Scheduler</li>
            </ul>
            <Link href="/tools/calculators" className="mt-auto w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold text-center block">
              Create
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Why WorkflowAI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-3">⚡</div>
              <h3 className="font-bold mb-2 text-lg">Instant Results</h3>
              <p className="text-blue-100 text-sm">AI-powered tools deliver professional documents in seconds</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="font-bold mb-2 text-lg">Save Money</h3>
              <p className="text-blue-100 text-sm">No need to hire designers, accountants, or use multiple tools</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🌍</div>
              <h3 className="font-bold mb-2 text-lg">For Everyone</h3>
              <p className="text-blue-100 text-sm">Works for registered and non-registered businesses worldwide</p>
            </div>
          </div>
        </div>

        {/* Popular Tools Quick Access */}
        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Most Popular Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/invoices/new" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold text-sm text-gray-800">Create Invoice</div>
            </Link>
            <Link href="/tools/documents/word-to-pdf" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold text-sm text-gray-800">Word to PDF</div>
            </Link>
            <Link href="/tools/calculators/tax" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-semibold text-sm text-gray-800">Tax Calculator</div>
            </Link>
            <Link href="/proposals/new" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 block">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-sm text-gray-800">AI Proposal</div>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to streamline your business?</h2>
          <p className="text-gray-600 mb-8 text-lg">Start using our tools for free. No credit card required.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg">
              Start Free Trial
            </Link>
            <Link href="/tools/documents" className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-gray-300 text-lg">
              View Tools
            </Link>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p className="mb-2">System Status: All Services Operational</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {['InvoiceAI','ProposalAI','ContractAI','DocumentTools','PaymentAI'].map(s => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>{s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
