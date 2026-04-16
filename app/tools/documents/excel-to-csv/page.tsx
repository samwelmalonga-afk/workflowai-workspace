'use client'

import { useState } from 'react'
import ToolLayout from '../../../components/Toollayout'

export default function ExcelToCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [preview, setPreview] = useState<string[][]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')
    if (!isExcel) {
      alert('Please select an Excel file (.xlsx or .xls)')
      return
    }

    setFile(selectedFile)
    await generatePreview(selectedFile)
  }

  const generatePreview = async (file: File) => {
    try {
      const XLSX = await import('xlsx')
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to array
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
      
      // Show first 10 rows for preview
      setPreview(jsonData.slice(0, 10))
    } catch (error) {
      console.error('Preview error:', error)
      alert('Failed to preview file')
    }
  }

  const convertToCSV = async () => {
    if (!file) return

    setConverting(true)

    try {
      const XLSX = await import('xlsx')
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to CSV
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name.replace(/\.(xlsx|xls)$/i, '.csv')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('Conversion successful!')
    } catch (error) {
      console.error('Conversion error:', error)
      alert('Failed to convert file. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  return (
    <ToolLayout
      title="Excel to CSV Converter"
      description="Convert Excel spreadsheets to CSV format"
      backLink="/tools/documents"
      backText="Back to Document Tools"
    >
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
        <p className="text-sm text-gray-600 mb-4">
          Supports .xlsx and .xls formats
        </p>
        
        <label className="inline-block">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors cursor-pointer inline-block">
            Choose Excel File
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

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Preview (First 10 rows)</h4>
          <div className="border rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'bg-gray-50 font-medium' : ''}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length === 10 && (
            <p className="text-xs text-gray-500 mt-2">
              Showing first 10 rows. Full data will be converted.
            </p>
          )}
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={convertToCSV}
        disabled={!file || converting}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
          file && !converting
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {converting ? 'Converting...' : 'Convert to CSV'}
      </button>

      {/* Features */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="font-semibold mb-4">Features:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Converts first sheet to CSV</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Preview data before converting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Preserves data and formatting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Works with both .xlsx and .xls</span>
          </li>
        </ul>
      </div>

      {/* How It Works */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold mb-3">How It Works</h4>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <span>Upload your Excel file (.xlsx or .xls)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <span>Preview the first 10 rows to verify data</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <span>Click "Convert to CSV" to download</span>
          </li>
        </ol>
      </div>
    </ToolLayout>
  )
}
