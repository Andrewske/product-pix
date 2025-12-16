'use client'

import { useRouter } from 'next/navigation'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { buildSearchIndex, type SearchableHelpItem } from '@/lib/help/search'

export function HelpSearch(): React.ReactElement {
  const router = useRouter()
  const allHelpItems = buildSearchIndex()

  const navigateToResult = (item: SearchableHelpItem) => {
    router.push(item.href)
  }

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search help..." className="h-9" />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Help Articles">
          {allHelpItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.title} ${item.section} ${item.description}`}
              onSelect={() => navigateToResult(item)}
              className="flex flex-col items-start gap-0.5 px-3 py-2"
            >
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.section} · {item.description}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
