import * as fs from 'fs';
import * as path from 'path';

export interface OpenSpecEntry {
  name: string;
  type: 'change' | 'spec';
  path: string;            // absolute path to the entry directory
  files: string[];         // filenames present (e.g. ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml'])
}

export interface OpenSpecCache {
  entries: Map<string, OpenSpecEntry>;
  lastRefresh: number;     // Date.now() timestamp
}

export function buildCache(projectPath: string): OpenSpecCache {
  const cache: OpenSpecCache = {
    entries: new Map(),
    lastRefresh: Date.now()
  };
  refreshCache(cache, projectPath);
  return cache;
}

export function refreshCache(cache: OpenSpecCache, projectPath: string): void {
  cache.entries.clear();
  cache.lastRefresh = Date.now();

  const openspecDir = path.join(projectPath, 'openspec');
  if (!fs.existsSync(openspecDir)) {
    return;
  }

  const dirsToScan = [
    { type: 'change' as const, dirName: 'changes' },
    { type: 'spec' as const, dirName: 'specs' }
  ];

  for (const { type, dirName } of dirsToScan) {
    const dir = path.join(openspecDir, dirName);
    if (!fs.existsSync(dir)) continue;

    try {
      const subdirs = fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const name of subdirs) {
        const entryPath = path.join(dir, name);
        try {
          const files = fs.readdirSync(entryPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);

          cache.entries.set(name, {
            name,
            type,
            path: entryPath,
            files
          });
        } catch (err) {
          // Ignore unreadable dirs
        }
      }
    } catch (err) {
      // Ignore unreadable dirs
    }
  }
}

export function readSpecFile(cache: OpenSpecCache, projectPath: string, name: string, fileType: string): string | null {
  const entry = cache.entries.get(name);
  if (!entry) return null;
  if (!entry.files.includes(fileType)) return null;

  const filePath = path.join(entry.path, fileType);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
}
