import fs from 'fs';
import path from 'path';

function getKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            keys.push(fullKey);
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                // Don't recurse too deep into raw or massive objects if not needed, 
                // but user asked for schema diff. Let's go 1 level deep for standard fields, 
                // maybe ignore specific deep nesting like 'raw.variants'.
                if (key !== 'raw' && key !== 'variants' && key !== 'images') {
                    keys = keys.concat(getKeys(obj[key], fullKey));
                }
                // For 'raw', just show it exists, don't list all shopify internals
            }
        }
    }
    return keys.sort();
}

async function main() {
    const scrapedDir = path.join(process.cwd(), 'scraped');
    if (!fs.existsSync(scrapedDir)) {
        console.error('Scraped directory not found');
        return;
    }

    const files = fs.readdirSync(scrapedDir).filter(f => f.endsWith('.json'));
    const schemas: Record<string, string[]> = {};
    const allKeys = new Set<string>();

    let report = '';
    const log = (msg: string) => {
        console.log(msg);
        report += msg + '\n';
    };

    log('Analyzing schemas for files: ' + JSON.stringify(files, null, 2));

    for (const file of files) {
        const content = JSON.parse(fs.readFileSync(path.join(scrapedDir, file), 'utf-8'));
        // Checks if the file has 'products' array or is the array itself (our structure is { ..., products: [] })
        const products = Array.isArray(content) ? content : content.products;

        if (!products || products.length === 0) {
            log(`\n⚠️  ${file}: No products found`);
            continue;
        }

        const sample = products[0];
        const keys = getKeys(sample);
        schemas[file] = keys;
        keys.forEach(k => allKeys.add(k));
    }

    const commonKeys: string[] = [];
    const uniqueKeys: Record<string, string[]> = {};

    // Determine common keys
    for (const key of allKeys) {
        let isCommon = true;
        for (const file in schemas) {
            if (!schemas[file].includes(key)) {
                isCommon = false;
                break;
            }
        }
        if (isCommon) {
            commonKeys.push(key);
        }
    }

    // Determine unique/missing keys
    for (const file in schemas) {
        uniqueKeys[file] = schemas[file].filter(k => !commonKeys.includes(k));
    }

    log('\n==================================================');
    log('COMMON SCHEMA (Present in ALL files)');
    log('==================================================');
    log(commonKeys.join(', '));

    log('\n==================================================');
    log('DIFFERENCES BY FILE');
    log('==================================================');

    for (const file in schemas) {
        log(`\n📄 ${file}`);
        const unique = uniqueKeys[file];

        if (unique.length > 0) {
            log(`   ➕ Unique/Extra Keys: ${unique.join(', ')}`);
        } else {
            log(`   ✅ No unique keys`);
        }

        // Keys that are in 'allKeys' but not in this file (excluding common ones obviously, which are everywhere)
        const missingFromThis = Array.from(allKeys).filter(k => !schemas[file].includes(k) && !commonKeys.includes(k) && false);
        // Wait, showing missing keys relative to UNION of all keys is noisy if every file has completely different raw data. 
        // Let's just show unique keys.
    }

    fs.writeFileSync('schema_report.txt', report, 'utf-8');
    console.log('Report written to schema_report.txt');
}

main();
