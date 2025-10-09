/*
  Deduplicate SourcedProduct documents by case-insensitive title.
  - Keeps the newest document (highest createdAt) for each normalized title
  - Merges missing fields (price/description/images/specs/categoryGroup/sourceUrl) from older docs when reasonable
  - Deletes the rest
*/

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const MONGODB_SCRAPED_URI = process.env.MONGODB_SCRAPED_URI || process.env.MONGODB_URI;
  if (!MONGODB_SCRAPED_URI) {
    console.error('Missing MONGODB_SCRAPED_URI or MONGODB_URI in environment');
    process.exit(1);
  }

  // Use a separate connection because SourcedProduct uses a separate connection in app
  const conn = await mongoose.createConnection(MONGODB_SCRAPED_URI, { bufferCommands: false }).asPromise();

  const SourcedSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const Sourced = conn.models.SourcedProduct || conn.model('SourcedProduct', SourcedSchema, 'sourcedproducts');

  console.log('Scanning for duplicate titles...');

  // Group by lowercased trimmed title
  const pipeline = [
    {
      $project: {
        title: 1,
        createdAt: 1,
        price: 1,
        description: 1,
        images: 1,
        specs: 1,
        sourceUrl: 1,
        categoryGroup: 1,
        _normTitle: { $toLower: { $trim: { input: '$title' } } }
      }
    },
    { $group: { _id: '$_normTitle', ids: { $push: '$_id' }, docs: { $push: '$$ROOT' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ];

  const groups = await Sourced.aggregate(pipeline);
  console.log(`Found ${groups.length} duplicate title group(s).`);

  let deleted = 0;
  let updated = 0;

  for (const g of groups) {
    // Keep the newest doc
    const sorted = g.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const keep = sorted[0];
    const remove = sorted.slice(1);

    // Build merged update for the keeper (fill any empty fields)
    const merged = { ...keep };
    for (const r of remove) {
      if (merged.price == null && r.price != null) merged.price = r.price;
      if (!merged.description && r.description) merged.description = r.description;
      if ((!Array.isArray(merged.images) || merged.images.length === 0) && Array.isArray(r.images) && r.images.length > 0) merged.images = r.images;
      if ((!merged.specs || Object.keys(merged.specs).length === 0) && r.specs && Object.keys(r.specs).length > 0) merged.specs = r.specs;
      if (!merged.categoryGroup && r.categoryGroup) merged.categoryGroup = r.categoryGroup;
      if (!merged.sourceUrl && r.sourceUrl) merged.sourceUrl = r.sourceUrl;
    }

    const update = {
      price: merged.price,
      description: merged.description,
      images: merged.images || [],
      specs: merged.specs || {},
      categoryGroup: merged.categoryGroup || 'Unknown',
      sourceUrl: merged.sourceUrl || keep.sourceUrl
    };

    await Sourced.updateOne({ _id: keep._id }, { $set: update });
    updated++;

    const removeIds = remove.map(d => d._id);
    if (removeIds.length) {
      const res = await Sourced.deleteMany({ _id: { $in: removeIds } });
      deleted += res.deletedCount || 0;
    }
  }

  console.log(`Done. Updated keepers: ${updated}, deleted duplicates: ${deleted}`);
  await conn.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


