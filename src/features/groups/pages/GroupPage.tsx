import { useParams } from 'react-router-dom'

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Group Page</h1>
      <p className="text-muted-foreground">
        Group ID: <code className="bg-muted px-1 rounded">{groupId}</code>
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Phase 5 will implement the actual group page with posts and members tabs
      </p>
    </div>
  )
}