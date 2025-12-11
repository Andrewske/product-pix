import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | ProductPix',
  description: 'Contact ProductPix'
}

export default function ContactPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground">Coming Soon</p>
      </section>
    </main>
  );
}