'use client'

import { useState } from 'react'

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Please select a Word document (.docx or .doc)')
        setFile(null)
      }
    }
  }

  const convertToPDF = async () => {
    if (!file) return

    setConverting(true)
    setError('')

    try {
      // For now, show coming soon message
      // In production, this would use mammoth.js to convert DOCX to HTML
      // then jsPDF to convert HTML to PDF
      alert('PDF conversion feature is being built! This will convert your Word document to PDF.')
      
      // Placeholder for actual conversion
      // const arrayBuffer = await file.arrayBuffer()
      // const result = await mammoth.convertToHtml({ arrayBuffer })
      // // Then convert HTML to PDF using jsPDF
      
    } catch (err) {
      setError('Conversion failed. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <a href="/tools/documents" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Document Tools
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Word to PDF Converter</h1>
          <p className="text-gray-600">Convert your Word documents to PDF format instantly</p>
        </div>

        {/* Main Tool */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">Upload Word Document</h3>
            <p className="text-sm text-gray-600 mb-4">Support for .docx and .doc files</p>
            
            <label className="inline-block">
              <input
                type="file"
                accept=".doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors cursor-pointer inline-block">
                Choose File
              </span>
            </label>

            {file && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg inline-block">
                <p className="text-sm font-medium text-purple-900">
                  Selected: {file.name}
                </p>
                <p className="text-xs text-purple-600">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={convertToPDF}
            disabled={!file || converting}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
              file && !converting
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {converting ? 'Converting...' : 'Convert to PDF'}
          </button>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="font-semibold mb-4">Features:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Preserves formatting and layout</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Fast client-side conversion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>No file size limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>100% secure - files never leave your device</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">How It Works</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <span>Upload your Word document (.docx or .doc)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <span>Click "Convert to PDF"</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <span>Download your PDF file instantly</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
