import React from 'react';
import { Card, Table, Badge } from '../primitives';

interface TestResult {
  batchLabel: string;
  stats: {
    count: number;
    meanScore: number;
    totalCost: number;
  };
  tests: Array<{
    id: string;
    image_url?: string;
    prompt_evaluations?: Array<{
      score_overall: number;
      details?: Record<string, unknown>;
    }>;
  }>;
}

interface ComparisonViewProps {
  data: TestResult;
  onClose: () => void;
}

export function ComparisonView({ data, onClose }: ComparisonViewProps): React.ReactElement {
  // Group tests by collection (if applicable)
  const images = data.tests
    .filter(t => t.image_url)
    .map(t => ({
      url: t.image_url!,
      score: t.prompt_evaluations?.[0]?.score_overall || 0,
      details: t.prompt_evaluations?.[0]?.details
    }));

  // Calculate aggregate metrics
  const scores = data.tests
    .map(t => t.prompt_evaluations?.[0]?.score_overall)
    .filter(s => s !== undefined) as number[];

  const avgConsistency = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + ((t.prompt_evaluations?.[0]?.details as any)?.consistency || 0), 0) / data.tests.length
    : 0;

  const avgVariety = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + ((t.prompt_evaluations?.[0]?.details as any)?.variety || 0), 0) / data.tests.length
    : 0;

  const avgPlausibility = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + ((t.prompt_evaluations?.[0]?.details as any)?.physicalPlausibility || 0), 0) / data.tests.length
    : 0;

  return (
    <div className="p-4 border-t space-y-4">
      {/* Metrics table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Collection Metrics</h3>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Consistency</td>
                <td className="py-2 text-sm text-gray-900">{avgConsistency > 0 ? avgConsistency.toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Variety</td>
                <td className="py-2 text-sm text-gray-900">{avgVariety > 0 ? avgVariety.toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Physical Plausibility</td>
                <td className="py-2 text-sm text-gray-900">{avgPlausibility > 0 ? avgPlausibility.toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Mean Score</td>
                <td className="py-2 text-sm text-gray-900">{data.stats.meanScore.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Summary</h3>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Total Tests</td>
                <td className="py-2 text-sm text-gray-900">{data.stats.count}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Total Cost</td>
                <td className="py-2 text-sm text-gray-900">${data.stats.totalCost.toFixed(4)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-700">Avg Cost per Test</td>
                <td className="py-2 text-sm text-gray-900">${(data.stats.totalCost / data.stats.count).toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Image grid */}
      <div>
        <h3 className="font-semibold mb-2">Generated Images</h3>
        {images.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            {images.map((img, idx) => (
              <div key={img.url} className="relative aspect-square rounded overflow-hidden cursor-pointer hover:opacity-90">
                <img
                  src={img.url}
                  alt={`Generated result ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.score && (
                  <div className="absolute top-2 right-2">
                    <Badge variant={img.score >= 8 ? 'success' : 'warning'}>
                      {img.score.toFixed(1)}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images available</p>
        )}
      </div>
    </div>
  );
}