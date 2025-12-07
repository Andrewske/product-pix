import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const REPORTS_DIR = join(process.cwd(), 'reports');

const isHtmlReport = (name: string): boolean => name.endsWith('.html');

const toReportFile = async (name: string): Promise<{ path: string; mtime: number }> => {
  const fullPath = join(REPORTS_DIR, name);
  const stats = await stat(fullPath);
  return { path: fullPath, mtime: stats.mtimeMs };
};

const findLatestReportFile = async (): Promise<string | null> => {
  try {
    const entries = await readdir(REPORTS_DIR);
    const htmlFiles = entries.filter(isHtmlReport);
    if (htmlFiles.length === 0) return null;
    const reports = await Promise.all(htmlFiles.map(toReportFile));
    const latest = reports.reduce((a, b) => (b.mtime > a.mtime ? b : a));
    return latest.path;
  } catch {
    return null;
  }
};

const openFileWithDefaultApp = (filePath: string): void => {
  const platform = process.platform;

  if (platform === 'darwin') {
    spawn('open', [filePath], { stdio: 'ignore', detached: true }).unref();
    return;
  }

  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', filePath], { stdio: 'ignore', detached: true }).unref();
    return;
  }

  spawn('xdg-open', [filePath], { stdio: 'ignore', detached: true }).unref();
};

export const openLastReportCommand = async (): Promise<void> => {
  const latest = await findLatestReportFile();

  if (!latest) {
    console.log('No report files found in reports/.');
    return;
  }

  console.log(`Opening latest report: ${latest}`);
  openFileWithDefaultApp(latest);
};
