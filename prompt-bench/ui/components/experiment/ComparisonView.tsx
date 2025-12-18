import * as React from 'react';
import {
  Badge,
  ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
  cn,
} from '../primitives';
import { AspectRatio } from '../../shadcn';
import { ImageIcon } from 'lucide-react';

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

export function ComparisonView({
  data,
  onClose,
}: ComparisonViewProps): React.ReactElement {
  // Group tests by collection (if applicable)
  const images = data.tests
    .filter((t) => t.image_url)
    .map((t) => ({
      url: t.image_url!,
      score: t.prompt_evaluations?.[0]?.score_overall || 0,
      details: t.prompt_evaluations?.[0]?.details,
    }));

  // Calculate aggregate metrics
  const scores = data.tests
    .map((t) => t.prompt_evaluations?.[0]?.score_overall)
    .filter((s) => s !== undefined) as number[];

  const avgConsistency =
    scores.length > 0
      ? data.tests.reduce(
          (sum, t) =>
            sum +
            ((t.prompt_evaluations?.[0]?.details as Record<string, number>)
              ?.consistency || 0),
          0
        ) / data.tests.length
      : 0;

  const avgVariety =
    scores.length > 0
      ? data.tests.reduce(
          (sum, t) =>
            sum +
            ((t.prompt_evaluations?.[0]?.details as Record<string, number>)
              ?.variety || 0),
          0
        ) / data.tests.length
      : 0;

  const avgPlausibility =
    scores.length > 0
      ? data.tests.reduce(
          (sum, t) =>
            sum +
            ((t.prompt_evaluations?.[0]?.details as Record<string, number>)
              ?.physicalPlausibility || 0),
          0
        ) / data.tests.length
      : 0;

  return (
    <div className="p-4 bg-card rounded-lg border space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Collection Metrics
          </h3>
          <div className="rounded-md border">
            <ShadcnTable>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Consistency</TableCell>
                  <TableCell className="text-right">
                    {avgConsistency > 0 ? avgConsistency.toFixed(2) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Variety</TableCell>
                  <TableCell className="text-right">
                    {avgVariety > 0 ? avgVariety.toFixed(2) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Physical Plausibility
                  </TableCell>
                  <TableCell className="text-right">
                    {avgPlausibility > 0 ? avgPlausibility.toFixed(2) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Mean Score</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {data.stats.meanScore.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </ShadcnTable>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Summary
          </h3>
          <div className="rounded-md border">
            <ShadcnTable>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Tests</TableCell>
                  <TableCell className="text-right">{data.stats.count}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Cost</TableCell>
                  <TableCell className="text-right">
                    ${data.stats.totalCost.toFixed(4)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Avg Cost per Test</TableCell>
                  <TableCell className="text-right">
                    ${(data.stats.totalCost / data.stats.count).toFixed(4)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </ShadcnTable>
          </div>
        </div>
      </div>

      <Separator />

      {/* Image grid */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          Generated Images
        </h3>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.url}
                className="relative group rounded-lg overflow-hidden border bg-muted"
              >
                <AspectRatio ratio={1}>
                  <img
                    src={img.url}
                    alt={`Generated result ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </AspectRatio>
                {img.score > 0 && (
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
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-4" />
            <p>No images available</p>
          </div>
        )}
      </div>
    </div>
  );
}
