export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {children}
    </div>
  )
}
