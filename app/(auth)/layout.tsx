export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-cream-light flex items-center justify-center">
      {children}
    </main>
  )
}
