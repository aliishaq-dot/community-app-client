import { useParams } from 'react-router-dom'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm text-center">
        <h1 className="text-2xl font-semibold mb-4">Join Group</h1>
        <p className="text-muted-foreground">
          Join page for code: <code className="bg-muted px-1 rounded">{code}</code>
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Phase 4 will implement the actual join logic
        </p>
      </div>
    </div>
  )
}