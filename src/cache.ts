import * as fs from 'fs';
import * as path from 'path';

export interface OpenSpecEntry {
  name: string;
  type: 'change' | 'spec';
  path: string;            // absolute path to the entry directory
  files: string[];         // filenames present (e.g. ['proposal.md', 'design.md', 'tasks.md', '.openspec.yaml'])
}

export interface OpenSpecCache {
  entries: Map<string, OpenSpecEntry>;  // keyed as "change:name" or "spec:name"
  lastRefresh: number;     // Date.now() timestamp
}

/** Build a composite cache key to avoid collisions between changes and specs with the same name */
export function cacheKey(type: 'change' | 'spec', name: string): string {
  return `${type}:${name}`;
}

/** Look up a cache entry by name, with optional type filter. If type is omitted, prefers changes over specs. */
export function lookupEntry(cache: OpenSpecCache, name: string, type?: 'change' | 'spec'): OpenSpecEntry | undefined {
  if (type) {
    return cache.entries.get(cacheKey(type, name));
  }
  // Default: prefer change, fall back to spec
  return cache.entries.get(cacheKey('change', name)) ?? cache.entries.get(cacheKey('spec', name));
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

          cache.entries.set(cacheKey(type, name), {
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

export function readSpecFile(cache: OpenSpecCache, projectPath: string, name: string, fileType: string, type?: 'change' | 'spec'): string | null {
  const entry = lookupEntry(cache, name, type);
  if (!entry) return null;
  if (!entry.files.includes(fileType)) return null;

  const filePath = path.join(entry.path, fileType);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
}
