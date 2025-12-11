'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, HelpCircle, CreditCard, Settings, ImageIcon, Layers } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { helpNavigation, type HelpNavSection } from '@/lib/help'
import { HelpSearch } from './help-search'

const sectionIcons: Record<string, React.ElementType> = {
  'Getting Started': BookOpen,
  'Creating Images': ImageIcon,
  'Billing': CreditCard,
  'Account': Settings,
}

const itemIcons: Record<string, React.ElementType> = {
  'Introduction': BookOpen,
  'Single Image Generation': ImageIcon,
  'Batch Processing': Layers,
  'Credits & Pricing': CreditCard,
  'Account Management': Settings,
  'FAQ': HelpCircle,
}

export function HelpSidebar(): React.ReactElement {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-3 space-y-3">
        <Link href="/help" className="flex items-center gap-2 font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-accent" />
          <span>Help Center</span>
        </Link>
        <HelpSearch />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        {helpNavigation.map((section: HelpNavSection) => {
          const SectionIcon = sectionIcons[section.title] ?? BookOpen
          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel className="flex items-center gap-2 text-muted-foreground">
                <SectionIcon className="h-4 w-4" />
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    const ItemIcon = itemIcons[item.title] ?? BookOpen
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <ItemIcon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
