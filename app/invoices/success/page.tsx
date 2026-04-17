import Link from 'next/link'

export default function InvoiceSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h2>
        <p className="text-gray-600 mb-8">Thank you for your payment. Your invoice has been marked as paid.</p>
        <Link href="/invoices"
          className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mb-3">
          View Invoices
        </Link>
        <Link href="/dashboard"
          className="block w-full border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

