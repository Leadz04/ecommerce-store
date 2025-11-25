/**
 * Scan the repository for legacy brand mentions (e.g., "Wolveyes").
 *
 * Usage:
 *   node scripts/audit-brand-mentions.js
 *   node scripts/audit-brand-mentions.js EverStyleCrafts   # custom keyword(s)
 *
 * This helps confirm that page content (privacy policy, FAQs, contact, etc.)
 * references the correct brand after migrations.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_KEYWORDS = ['wolveyes', 'wolv-eyes', 'wolveyes.com'];
const KEYWORDS = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_KEYWORDS).map((k) =>
  k.toLowerCase()
);

const ROOT_DIR = process.cwd();
const SCAN_ROOTS = [path.join(ROOT_DIR, 'src', 'app')];
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', '.turbo', '.vercel', 'terminals']);
const SKIP_EXTENSIONS = new Set([
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.pdf',
  '.zip',
  '.gz',
  '.mp4',
  '.mp3',
  '.wav',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2'
]);

async function walk(dir, visitor) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, visitor);
    } else if (entry.isFile()) {
      if (SKIP_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      await visitor(fullPath);
    }
  }
}

async function scanFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lower = content.toLowerCase();
    const matches = KEYWORDS.filter((keyword) => lower.includes(keyword));
    if (!matches.length) return [];

    const lines = content.split(/\r?\n/);
    const findings = [];
    lines.forEach((line, index) => {
      const normalized = line.toLowerCase();
      for (const keyword of matches) {
        if (normalized.includes(keyword)) {
          findings.push({
            filePath,
            line: index + 1,
            keyword,
            snippet: line.trim().slice(0, 200)
          });
          break;
        }
      }
    });
    return findings;
  } catch (error) {
    console.warn(`⚠️  Could not read ${filePath}:`, error.message);
    return [];
  }
}

async function run() {
  console.log(`🔎 Scanning for legacy brand mentions: ${KEYWORDS.join(', ')}`);
  console.log(`📁 Scope: ${SCAN_ROOTS.join(', ')}`);
  const findings = [];
  for (const root of SCAN_ROOTS) {
    if (!fs.existsSync(root)) continue;
    await walk(root, async (filePath) => {
      const hits = await scanFile(filePath);
      findings.push(...hits);
    });
  }

  if (!findings.length) {
    console.log('✅ No legacy brand mentions found.');
    return;
  }

  console.log(`⚠️  Found ${findings.length} potential mention(s):`);
  findings.forEach((finding) => {
    console.log(`  • ${finding.filePath}:${finding.line} → ${finding.snippet}`);
  });
  process.exitCode = 1;
}

run();


