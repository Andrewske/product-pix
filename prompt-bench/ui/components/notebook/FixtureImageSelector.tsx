import * as React from 'react';
import { ChevronDown, Check, Image as ImageIcon } from 'lucide-react';
import {
  Button,
  ShadcnCard,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Separator,
  cn,
} from '../primitives';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ScrollArea,
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
    <ShadcnCard className="mb-6">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Fixture Images
              </CardTitle>
              {!isExpanded && selectedIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({selectedIds.length} image{selectedIds.length !== 1 ? 's' : ''}{' '}
                  from {productCount} product{productCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {Object.keys(fixtures).length === 0 ? (
              <FixturesEmptyState />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mb-4',
                    'placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                />

                <div className="text-sm text-muted-foreground mb-4">
                  {selectedCount > 0 ? (
                    <>
                      Selected: <span className="font-medium text-foreground">{selectedCount}</span> images
                      from <span className="font-medium text-foreground">{productCount}</span> product
                      {productCount !== 1 ? 's' : ''} → Will create{' '}
                      <span className="font-medium text-foreground">{productCount}</span> test
                      {productCount !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'Click images to select. Same product = 1 test with multiple images.'
                  )}
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-6 pr-4">
                    {Object.entries(filteredFixtures).map(([product, images]) => (
                      <div key={product} className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-3 capitalize">
                          {product.replace(/-/g, ' ')}
                        </h3>
                        <div className="grid grid-cols-6 gap-2">
                          {images.map((img) => {
                            const isSelected = selectedIds.includes(img.id);
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => toggleImage(img.id)}
                                className={cn(
                                  'relative rounded-lg border-2 p-1 transition-all',
                                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground'
                                )}
                                aria-label={`Select ${img.filename}`}
                              >
                                <img
                                  src={img.r2_url}
                                  alt={`Fixture image: ${img.filename}`}
                                  className="w-full h-12 object-cover rounded"
                                />
                                <p className="text-xs mt-1 truncate text-center text-muted-foreground">
                                  {img.filename}
                                </p>
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
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
              </>
            )}
          </CardContent>

          {Object.keys(fixtures).length > 0 && (
            <CardFooter className="border-t pt-4">
              <div className="flex justify-end w-full">
                <Button
                  onClick={() => onSelect(selectedIds)}
                  disabled={selectedIds.length === 0}
                >
                  Use Selected Images
                </Button>
              </div>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </ShadcnCard>
  );
}
