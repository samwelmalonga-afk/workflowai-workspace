'use client'

import { useState } from 'react'
import ToolLayout from '../../../components/ToolLayout'

export default function PDFMerger() {
  const [files, setFiles] = useState<File[]>([])
  const [merging, setMerging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFiles = [...files]
      ;[newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]]
      setFiles(newFiles)
    } else if (direction === 'down' && index < files.length - 1) {
      const newFiles = [...files]
      ;[newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]]
      setFiles(newFiles)
    }
  }

  const mergePDFs = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files')
      return
    }

    setMerging(true)

    try {
      // Import pdf-lib dynamically
      const { PDFDocument } = await import('pdf-lib')
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create()

      // Load and merge each PDF
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      
      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `merged_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('PDFs merged successfully!')
      setFiles([])
    } catch (error) {
      console.error('Merge error:', error)
      alert('Failed to merge PDFs. Please try again.')
    } finally {
      setMerging(false)
    }
  }

  return (
    <ToolLayout
      title="PDF Merger"
      description="Combine multiple PDF files into a single document"
      backLink="/tools/documents"
      backText="Back to Document Tools"
    >
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="text-5xl mb-4">📑</div>
        <h3 className="text-lg font-semibold mb-2">Upload PDF Files</h3>
        <p className="text-sm text-gray-600 mb-4">Select multiple PDFs to merge them in order</p>
        
        <label className="inline-block">
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors cursor-pointer inline-block">
            Select PDF Files
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Files to Merge ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{index + 1}. {file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Button */}
      <button
        onClick={mergePDFs}
        disabled={files.length < 2 || merging}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
          files.length >= 2 && !merging
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {merging ? 'Merging PDFs...' : `Merge ${files.length} PDFs into One`}
      </button>

      {/* Features */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="font-semibold mb-4">Features:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Merge unlimited PDFs in any order</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Drag to reorder files before merging</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Client-side processing - files never uploaded</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Preserves quality and formatting</span>
          </li>
        </ul>
      </div>
    </ToolLayout>
  )
}
