import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card } from '../primitives';
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
  onSelect
}: FixtureImageSelectorProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedFixtureIds);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleImage = (imageId: string) => {
    setSelectedIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const filteredFixtures = Object.entries(fixtures).reduce((acc, [product, images]) => {
    const filtered = images.filter(img =>
      img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) acc[product] = filtered;
    return acc;
  }, {} as Record<string, FixtureImage[]>);

  const selectedCount = selectedIds.length;
  const productCount = new Set(
    selectedIds.map(id => {
      for (const [product, images] of Object.entries(fixtures)) {
        if (images.some(img => img.id === id)) return product;
      }
      return '';
    }).filter(Boolean)
  ).size;

  const handleImageClick = (imageId: string) => {
    toggleImage(imageId);
  };

  const handleImageKeyDown = (event: React.KeyboardEvent, imageId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleImage(imageId);
    }
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Fixture Images</h2>
          {!isExpanded && selectedIds.length > 0 && (
            <span className="text-sm text-gray-600">
              ({selectedIds.length} image{selectedIds.length !== 1 ? 's' : ''} from {productCount} product{productCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-2 hover:bg-gray-100 rounded transition"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          {Object.keys(fixtures).length === 0 ? (
            <FixturesEmptyState />
          ) : (
            <>
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-2 mb-4 w-full"
              />
              <div className="text-sm text-gray-600 mb-4">
                {selectedCount > 0 ? (
                  `Selected: ${selectedCount} images from ${productCount} product${productCount !== 1 ? 's' : ''} → Will create ${productCount} test${productCount !== 1 ? 's' : ''}`
                ) : (
                  'Click images to select. Same product = 1 test with multiple images.'
                )}
              </div>
              <div className="max-h-96 overflow-y-auto space-y-6">
                {Object.entries(filteredFixtures).map(([product, images]) => (
                  <div key={product} className="border rounded p-4">
                    <h3 className="font-semibold mb-3 capitalize">{product.replace(/-/g, ' ')}</h3>
                    <div className="grid grid-cols-6 gap-2">
                      {images.map(img => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => handleImageClick(img.id)}
                          className={`relative border-2 rounded p-1 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            selectedIds.includes(img.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          aria-label={`Select ${img.filename}`}
                        >
                          <img
                            src={img.r2_url}
                            alt={`Fixture image: ${img.filename}`}
                            className="w-full h-12 object-cover rounded"
                          />
                          <p className="text-xs mt-1 truncate text-center">{img.filename}</p>
                          {selectedIds.includes(img.id) && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              ✓
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <Button
                  variant="primary"
                  onClick={() => onSelect(selectedIds)}
                  disabled={selectedIds.length === 0}
                >
                  Use Selected Images
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
