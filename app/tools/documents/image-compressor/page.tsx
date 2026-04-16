'use client'

import { useState } from 'react'
import ToolLayout from '../../../components/ToolLayout'

export default function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [compressedPreview, setCompressedPreview] = useState<string>('')
  const [quality, setQuality] = useState(80)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [processing, setProcessing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setOriginalImage(file)
    setOriginalSize(file.size)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string)
      compressImage(e.target?.result as string, quality)
    }
    reader.readAsDataURL(file)
  }

  const compressImage = async (imageSrc: string, compressionQuality: number) => {
    setProcessing(true)

    try {
      const img = new Image()
      img.src = imageSrc

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCompressedSize(blob.size)
            const url = URL.createObjectURL(blob)
            setCompressedPreview(url)
          }
          setProcessing(false)
        },
        'image/jpeg',
        compressionQuality / 100
      )
    } catch (error) {
      console.error('Compression error:', error)
      setProcessing(false)
    }
  }

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality)
    if (originalPreview) {
      compressImage(originalPreview, newQuality)
    }
  }

  const downloadCompressed = () => {
    if (!compressedPreview) return

    const a = document.createElement('a')
    a.href = compressedPreview
    a.download = `compressed_${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const savingsPercent = originalSize > 0 
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  return (
    <ToolLayout
      title="Image Compressor"
      description="Reduce image file sizes while maintaining quality"
      backLink="/tools/documents"
      backText="Back to Document Tools"
    >
      {/* Upload Area */}
      {!originalImage && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
          <p className="text-sm text-gray-600 mb-4">
            Supports JPG, PNG, WEBP formats
          </p>
          
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors cursor-pointer inline-block">
              Choose Image
            </span>
          </label>
        </div>
      )}

      {/* Compression Interface */}
      {originalImage && (
        <div>
          {/* Quality Slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Compression Quality: {quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Original */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">Original</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img src={originalPreview} alt="Original" className="w-full rounded" />
                <div className="mt-2 text-sm text-gray-600">
                  Size: {(originalSize / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>

            {/* Compressed */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">Compressed</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {compressedPreview ? (
                  <>
                    <img src={compressedPreview} alt="Compressed" className="w-full rounded" />
                    <div className="mt-2 text-sm text-gray-600">
                      Size: {(compressedSize / 1024).toFixed(2)} KB
                      <span className="ml-2 text-green-600 font-semibold">
                        (-{savingsPercent}%)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-400">
                    Processing...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {(originalSize / 1024).toFixed(0)} KB
                </div>
                <div className="text-xs text-gray-600">Original Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {(compressedSize / 1024).toFixed(0)} KB
                </div>
                <div className="text-xs text-gray-600">Compressed Size</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {savingsPercent}%
                </div>
                <div className="text-xs text-gray-600">Space Saved</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={downloadCompressed}
              disabled={!compressedPreview}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Download Compressed Image
            </button>
            <button
              onClick={() => {
                setOriginalImage(null)
                setOriginalPreview('')
                setCompressedPreview('')
                setOriginalSize(0)
                setCompressedSize(0)
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="font-semibold mb-4">Features:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Adjustable compression quality</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Real-time preview and comparison</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Client-side processing - 100% private</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>Typically reduces file size by 40-80%</span>
          </li>
        </ul>
      </div>
    </ToolLayout>
  )
}
