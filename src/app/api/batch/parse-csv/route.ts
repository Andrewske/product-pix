// src/app/api/batch/parse-csv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const batchItemSchema = z.object({
  product_name: z.string().optional(),
  prompt: z.string().min(1),
  source_image_url: z.string().url().optional(),
  aspect_ratio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
  resolution: z.enum(['1k', '2k', '4k']).default('1k'),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Check max items (header + 100 items)
    if (lines.length > 101) {
      return NextResponse.json(
        { error: 'Maximum 100 items allowed per batch' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''));

    const items: Array<z.infer<typeof batchItemSchema> & { sequence: number }> = [];
    const errors: Array<{ line: number; errors: z.ZodIssue[] }> = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted values)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Create object from headers and values
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.replace(/^"|"$/g, '') || '';
      });

      // Validate with Zod
      const result = batchItemSchema.safeParse(row);
      if (result.success) {
        items.push({ ...result.data, sequence: i });
      } else {
        errors.push({ line: i + 1, errors: result.error.issues });
      }
    }

    return NextResponse.json({ items, errors });
  } catch (error) {
    console.error('CSV parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse CSV file' },
      { status: 500 }
    );
  }
}

