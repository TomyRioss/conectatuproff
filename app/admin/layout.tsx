export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-cream-light">
      {children}
    </main>
  )
}
