export default function DocumentTools() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Home
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Tools</h1>
          <p className="text-gray-600">Convert, merge, and optimize your documents</p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Word to PDF - ACTIVE */}
          <a href="/tools/documents/word-to-pdf" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-purple-600 block group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📄</div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                Active
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Word to PDF</h3>
            <p className="text-gray-600 text-sm mb-4">
              Convert Word documents (.docx, .doc) to PDF format instantly
            </p>
            <div className="text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">
              Use Tool →
            </div>
          </a>

          {/* PDF Merger - COMING SOON */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-300 opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🔗</div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                Coming Soon
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-700">PDF Merger</h3>
            <p className="text-gray-500 text-sm mb-4">
              Combine multiple PDF files into a single document
            </p>
            <div className="text-gray-400 font-semibold text-sm">
              Available Soon
            </div>
          </div>

          {/* Image Compressor - COMING SOON */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-300 opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🖼️</div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                Coming Soon
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-700">Image Compressor</h3>
            <p className="text-gray-500 text-sm mb-4">
              Reduce image file sizes while maintaining quality
            </p>
            <div className="text-gray-400 font-semibold text-sm">
              Available Soon
            </div>
          </div>

          {/* Excel to CSV - COMING SOON */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-gray-300 opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📊</div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                Coming Soon
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-700">Excel to CSV</h3>
            <p className="text-gray-500 text-sm mb-4">
              Convert Excel spreadsheets to CSV format
            </p>
            <div className="text-gray-400 font-semibold text-sm">
              Available Soon
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Why Use Our Document Tools?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600">
                All conversions happen in your browser. Files never leave your device.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                Client-side processing means instant results with no upload wait times.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">♾️</div>
              <h3 className="font-bold mb-2">No Limits</h3>
              <p className="text-sm text-gray-600">
                Convert as many files as you need. No file size or quantity restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a href="/dashboard" className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            View All Tools
          </a>
        </div>
      </div>
    </div>
  )
}
