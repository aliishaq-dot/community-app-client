export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-center">
      <div>
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground mt-4">Page not found</p>
        <p className="text-sm text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    </div>
  )
}