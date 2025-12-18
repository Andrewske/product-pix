#!/usr/bin/env bun
import { build } from 'bun';
import { watch } from 'node:fs';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';

const UI_DIR = resolve(process.cwd(), 'prompt-bench/ui');
const DIST_DIR = join(UI_DIR, 'dist');

// Debounce helper for watch mode
function debounce(func: () => void, wait: number): () => void {
  let timeout: Timer | null = null;
  return () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

// Ensure dist directory exists
function ensureDistDir(): void {
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }
}

// Build experiment bundle (ExperimentRunner + ResultsBrowser)
async function buildExperimentBundle(production = false): Promise<void> {
  const entrypoint = join(UI_DIR, 'experiment.tsx');

  console.log(`Building experiment bundle (${production ? 'production' : 'development'})...`);

  try {
    const result = await build({
      entrypoints: [entrypoint],
      outdir: DIST_DIR,
      target: 'browser',
      format: 'iife',
      globalName: 'ExperimentApp',
      minify: production,
      sourcemap: production ? 'none' : 'inline',
      define: {
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      },
    });

    if (result.success) {
      console.log(`✅ Experiment bundle built successfully`);
    } else {
      console.error('❌ Experiment bundle build failed:', result.logs);
    }
  } catch (error) {
    console.error('❌ Experiment bundle build error:', error);
  }
}

// Build notebook bundle (NotebookView)
async function buildNotebookBundle(production = false): Promise<void> {
  const entrypoint = join(UI_DIR, 'notebook.tsx');

  console.log(`Building notebook bundle (${production ? 'production' : 'development'})...`);

  try {
    const result = await build({
      entrypoints: [entrypoint],
      outdir: DIST_DIR,
      target: 'browser',
      format: 'iife',
      globalName: 'NotebookApp',
      minify: production,
      sourcemap: production ? 'none' : 'inline',
      define: {
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      },
    });

    if (result.success) {
      console.log(`✅ Notebook bundle built successfully`);
    } else {
      console.error('❌ Notebook bundle build failed:', result.logs);
    }
  } catch (error) {
    console.error('❌ Notebook bundle build error:', error);
  }
}

// Build all bundles
async function buildAll(production = false): Promise<void> {
  ensureDistDir();
  await Promise.all([
    buildExperimentBundle(production),
    buildNotebookBundle(production),
  ]);
}

// Watch mode
function startWatchMode(): void {
  console.log('🚀 Starting watch mode...');

  // Start the UI server
  const serverProcess = spawn('bun', ['run', 'prompt-bench/ui/server.ts'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start UI server:', error);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ UI server exited with code ${code}`);
    }
  });

  let rebuildTimeout: Timer | null = null;

  const watcher = watch(UI_DIR, { recursive: true }, async (eventType: string, filename: string | null) => {
    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
      // Debounce rebuilds
      if (rebuildTimeout) clearTimeout(rebuildTimeout);
      rebuildTimeout = setTimeout(async () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] File changed: ${filename}, rebuilding...`);
        await buildAll(false);
      }, 300);
    }
  });

  console.log('👀 Watching for changes in prompt-bench/ui/');
  console.log('🌐 UI server running at http://localhost:8181');
  console.log('Press Ctrl+C to stop');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping watch mode...');
    watcher.close();
    serverProcess.kill();
    process.exit(0);
  });
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'experiment':
    await buildExperimentBundle(process.argv[3] === '--prod');
    break;
  case 'notebook':
    await buildNotebookBundle(process.argv[3] === '--prod');
    break;
  case 'all':
    await buildAll(process.argv[3] === '--prod');
    break;
  case 'watch':
    startWatchMode();
    break;
  default:
    console.log('Usage:');
    console.log('  bun run build.ts experiment [--prod]  # Build experiment bundle');
    console.log('  bun run build.ts notebook [--prod]    # Build notebook bundle');
    console.log('  bun run build.ts all [--prod]         # Build all bundles');
    console.log('  bun run build.ts watch                 # Start watch mode');
    process.exit(1);
}