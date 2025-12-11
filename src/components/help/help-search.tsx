'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { searchHelp, type SearchableHelpItem } from '@/lib/help/search'

const DEBOUNCE_MS = 150
const MAX_RESULTS = 5

export function HelpSearch(): React.ReactElement {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchableHelpItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const searchResults = searchHelp(value, MAX_RESULTS)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
      setSelectedIndex(-1)
    }, DEBOUNCE_MS)
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          navigateToResult(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const navigateToResult = (item: SearchableHelpItem) => {
    router.push(item.href)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search help..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-8 h-9 bg-background"
          aria-label="Search help documentation"
          aria-expanded={isOpen}
          aria-controls="help-search-results"
          aria-activedescendant={
            selectedIndex >= 0 ? `help-search-result-${selectedIndex}` : undefined
          }
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="help-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          {results.map((item, index) => (
            <button
              key={item.href}
              id={`help-search-result-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => navigateToResult(item)}
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-accent/50',
                index === selectedIndex && 'bg-accent/50'
              )}
            >
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.section} · {item.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
