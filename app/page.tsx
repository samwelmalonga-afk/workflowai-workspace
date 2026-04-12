export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-6">
          WorkflowAI Workspace
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          AI-powered workspace for freelancers and agencies
        </p>
        
        <p className="text-gray-500 mb-8">
          Generate proposals, contracts, and invoices with AI.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold">
            Dashboard
          </button>
          
          <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold">
            Client Portal
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-400">
          <p>Backend Operational</p>
        </div>
      </div>
    </main>
  )
}
