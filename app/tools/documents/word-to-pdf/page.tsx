'use client'

import { useState } from 'react'

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile)
        setError('')
        setSuccess(false)
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
    setSuccess(false)

    try {
      const mammoth = await import('mammoth')
      const { jsPDF } = await import('jspdf')

      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })

      // Strip HTML tags for basic text extraction
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html

      const paragraphs = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, h4, li'))
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 40
      const maxWidth = pageWidth - margin * 2
      let y = margin

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      for (const el of paragraphs) {
        const tag = el.tagName.toLowerCase()
        const text = el.textContent?.trim() || ''
        if (!text) continue

        // Set font styles based on tag
        if (tag === 'h1') {
          pdf.setFontSize(20)
          pdf.setFont('helvetica', 'bold')
        } else if (tag === 'h2') {
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
        } else if (tag === 'h3' || tag === 'h4') {
          pdf.setFontSize(13)
          pdf.setFont('helvetica', 'bold')
        } else {
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
        }

        const lines = pdf.splitTextToSize(text, maxWidth)
        const lineHeight = pdf.getFontSize() * 1.5

        if (y + lines.length * lineHeight > pageHeight - margin) {
          pdf.addPage()
          y = margin
        }

        pdf.text(lines, margin, y)
        y += lines.length * lineHeight + 8
      }

      const fileName = file.name.replace(/\.(docx|doc)$/i, '.pdf')
      pdf.save(fileName)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError('Conversion failed. Please try again with a different file.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <a href="/tools/documents" className="text-purple-600 hover:text-purple-700 font-medium mb-4 inline-block">
            ← Back to Document Tools
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Word to PDF Converter</h1>
          <p className="text-gray-600">Convert your Word documents to PDF format instantly</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">Upload Word Document</h3>
            <p className="text-sm text-gray-600 mb-4">Supports .docx and .doc files</p>

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
                <p className="text-sm font-medium text-purple-900">Selected: {file.name}</p>
                <p className="text-xs text-purple-600">Size: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              ✅ PDF downloaded successfully!
            </div>
          )}

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

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="font-semibold mb-4">Features:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Preserves headings and paragraphs</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Fast client-side conversion</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span>No file size limits</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500">✓</span><span>100% secure - files never leave your device</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">How It Works</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3"><span className="font-bold text-blue-600">1.</span><span>Upload your Word document (.docx or .doc)</span></li>
            <li className="flex gap-3"><span className="font-bold text-blue-600">2.</span><span>Click "Convert to PDF"</span></li>
            <li className="flex gap-3"><span className="font-bold text-blue-600">3.</span><span>Your PDF downloads automatically</span></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
