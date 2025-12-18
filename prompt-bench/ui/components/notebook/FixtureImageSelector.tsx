import * as React from 'react';
import { ChevronDown, Check, Image as ImageIcon, Search } from 'lucide-react';
import {
  Button,
  ShadcnCard,
  CardContent,
  CardFooter,
  CardHeader,
  cn,
} from '../primitives';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ScrollArea,
  Badge,
} from '../../shadcn';
import { FixturesEmptyState } from './FixturesEmptyState';

interface FixtureImage {
  id: string;
  product_name: string;
  filename: string;
  r2_url: string;
}

interface FixtureImageSelectorProps {
  fixtures: Record<string, FixtureImage[]>;
  selectedFixtureIds: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: (selectedIds: string[]) => void;
}

export function FixtureImageSelector({
  fixtures,
  selectedFixtureIds,
  isExpanded,
  onToggleExpand,
  onSelect,
}: FixtureImageSelectorProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(selectedFixtureIds);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Sync internal state when props change (e.g. from parent clearing)
  React.useEffect(() => {
    setSelectedIds(selectedFixtureIds);
  }, [selectedFixtureIds]);

  const toggleImage = (imageId: string) => {
    setSelectedIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const filteredFixtures = Object.entries(fixtures).reduce(
    (acc, [product, images]) => {
      const filtered = images.filter(
        (img) =>
          img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) acc[product] = filtered;
      return acc;
    },
    {} as Record<string, FixtureImage[]>
  );

  const selectedCount = selectedIds.length;
  const productCount = new Set(
    selectedIds
      .map((id) => {
        for (const [product, images] of Object.entries(fixtures)) {
          if (images.some((img) => img.id === id)) return product;
        }
        return '';
      })
      .filter(Boolean)
  ).size;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Fixture Images</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} images selected from ${productCount} products`
                : 'Select product images to analyze'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="gap-2"
        >
          {isExpanded ? 'Hide Images' : 'Show Images'}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </Button>
      </div>

      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleContent>
          <ShadcnCard className="mt-4 border-muted/50 shadow-sm">
             <CardHeader className="pb-4 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search products or filenames..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors',
                      'placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                    )}
                  />
                </div>
             </CardHeader>
            <CardContent className="p-0">
              {Object.keys(fixtures).length === 0 ? (
                <div className="p-6">
                  <FixturesEmptyState />
                </div>
              ) : (
                <ScrollArea className="h-[500px] p-6">
                  <div className="space-y-8">
                    {Object.entries(filteredFixtures).map(([product, images]) => (
                      <div key={product}>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-medium text-sm text-foreground/80 capitalize">
                            {product.replace(/-/g, ' ')}
                          </h3>
                          <div className="h-px flex-1 bg-border/50" />
                          <Badge variant="secondary" className="text-xs font-normal">
                            {images.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                          {images.map((img) => {
                            const isSelected = selectedIds.includes(img.id);
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => toggleImage(img.id)}
                                className={cn(
                                  'group relative aspect-square rounded-xl overflow-hidden border transition-all duration-200',
                                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  isSelected
                                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-background'
                                    : 'border-border hover:border-[var(--accent)]/50'
                                )}
                                aria-label={`Select ${img.filename}`}
                              >
                                <img
                                  src={img.r2_url}
                                  alt={img.filename}
                                  className={cn(
                                    "w-full h-full object-cover transition-transform duration-300",
                                    isSelected ? "scale-105" : "group-hover:scale-105"
                                  )}
                                />
                                <div className={cn(
                                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 transition-opacity",
                                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                  <p className="text-[10px] text-white font-medium truncate">
                                    {img.filename}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2 bg-[var(--accent)] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>

            {Object.keys(fixtures).length > 0 && (
              <CardFooter className="border-t border-border/50 bg-muted/20 p-4 flex justify-between items-center">
                 <div className="text-sm text-muted-foreground">
                    {selectedCount > 0 ? (
                      <span>
                        Creating <span className="font-medium text-foreground">{productCount}</span> test{productCount !== 1 ? 's' : ''} from selection
                      </span>
                    ) : (
                      <span>Select images to proceed</span>
                    )}
                 </div>
                <Button
                  onClick={() => onSelect(selectedIds)}
                  disabled={selectedIds.length === 0}
                  className="px-8 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
                >
                  Use {selectedCount} Selected Image{selectedCount !== 1 ? 's' : ''}
                </Button>
              </CardFooter>
            )}
          </ShadcnCard>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
