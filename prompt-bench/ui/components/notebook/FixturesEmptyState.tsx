import { Card } from '../primitives';

export function FixturesEmptyState(): React.JSX.Element {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <div className="text-center py-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          No Fixture Images Found
        </h3>
        <p className="text-sm text-yellow-800 mb-4">
          Fixture images must be synced from the filesystem before you can use the notebook.
        </p>
        <div className="bg-white border border-yellow-200 rounded p-3 mb-4">
          <code className="text-sm text-gray-800">bun bench sync</code>
        </div>
        <p className="text-xs text-yellow-700">
          This command uploads images from <code>prompt-bench/fixtures/images/</code> to R2 and saves references to the database.
        </p>
      </div>
    </Card>
  );
}
