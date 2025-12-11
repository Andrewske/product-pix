import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { HelpSidebar } from '@/components/help'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Help Center | ProductPix',
  description: 'Learn how to use ProductPix to create professional product photos with AI.',
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <SidebarProvider defaultOpen>
      <HelpSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 md:hidden">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-6" />
          <span className="font-semibold">Help Center</span>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-6 py-8 md:px-8 md:py-12">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
