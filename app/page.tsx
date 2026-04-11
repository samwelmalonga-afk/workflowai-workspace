export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          WorkflowAI Workspace
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered workspace for freelancers and agencies
        </p>
        <p className="text-gray-500 mb-8">
          Generate proposals, contracts, and invoices with AI. Accept payments. Automate your workflow.
        </p>
        <div className="flex gap-4 justify-center">
          
            href="/dashboard"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
          
            href="/client/demo"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Client Portal Demo
          </a>
        </div>
        <div className="mt-12 text-sm text-gray-400">
          <p>Status: Backend Operational</p>
          <p className="mt-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            InvoiceAI • ProposalAI • ContractAI • PaymentAI
          </p>
        </div>
      </div>
    </main>
  )
}