/*
  Seed five draft blog posts into MongoDB.
  Usage: MONGODB_URI="mongodb+srv://..." node scripts/seed-blogs.js
*/

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable');
  process.exit(1);
}

const todayIso = new Date().toISOString();

const posts = [
  {
    title: 'Ultimate Gift Guide 2025: Thoughtful Picks for Every Budget',
    slug: 'ultimate-gift-guide-2025',
    description: 'Discover 25+ gift ideas for every budget—curated from Men, Women, Accessories, and Gifting collections.',
    tags: ['gifting','gift ideas','accessories','men','women','budget'],
    status: 'draft',
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Ultimate Gift Guide 2025: Thoughtful Picks for Every Budget</h1>
<p>Looking for the perfect present? This guide curates our favorite gifts across <a href="/categories">categories</a>—from practical everyday accessories to premium showstoppers.</p>
<h2>Under $25: Small Gifts, Big Smiles</h2>
<ul>
  <li>Essential travel organizers for weekend getaways (<a href="/collections/office-travel">Office &amp; Travel</a>)</li>
  <li>Minimalist keychains and cable ties (<a href="/categories/accessories">Accessories</a>)</li>
  <li>Warm socks and caps for colder days (<a href="/categories/men">Men</a> / <a href="/categories/women">Women</a>)</li>
  </ul>
<h2>$25–$75: Everyday Upgrades</h2>
<ul>
  <li>Crossbody pouches and belt bags—hands-free convenience</li>
  <li>Wireless charging stands for tidy desks (<a href="/categories/office-travel">Office &amp; Travel</a>)</li>
  <li>Layer-ready scarves and beanies (<a href="/categories/women">Women</a>)</li>
</ul>
<h2>$75–$150: Statement Gifts</h2>
<ul>
  <li>Weather-ready backpacks for commuters</li>
  <li>Weekend duffels with separate shoe compartments</li>
  <li>Premium leather wallets and watch bands</li>
</ul>
<h2>Gifts by Recipient</h2>
<ul>
  <li><strong>For Travelers:</strong> Packing cubes, TSA-ready kits, compact power banks</li>
  <li><strong>For Minimalists:</strong> Slim wallet, neutral-toned beanies, clean totes</li>
  <li><strong>For Remote Workers:</strong> Laptop sleeves, desk mats, cable organizers</li>
</ul>
<p>Browse our latest picks in <a href="/categories/gifting">Gifting</a>, <a href="/categories/accessories">Accessories</a>, and <a href="/categories/office-travel">Office &amp; Travel</a>.</p>`
  },
  {
    title: 'Men’s Travel Essentials: Pack Smarter for Weekend Getaways',
    slug: 'mens-travel-essentials-weekend-getaways',
    description: 'A smart packing list for men—bags, tech, and organization to travel light without sacrificing style.',
    tags: ['men','travel','packing list','office & travel','backpacks'],
    status: 'draft',
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Men’s Travel Essentials: Pack Smarter for Weekend Getaways</h1>
<p>Travel light and stay organized with this efficient packing checklist.</p>
<h2>The Bag Setup</h2>
<ul>
  <li><strong>Weekender Duffel:</strong> Separate shoe pocket and water-resistant base</li>
  <li><strong>Carry Backpack:</strong> Padded laptop sleeve + quick-access pocket (<a href="/categories/office-travel">Office &amp; Travel</a>)</li>
</ul>
<h2>Organization</h2>
<ul>
  <li>Packing cubes: tops, bottoms, underwear/socks</li>
  <li>Tech pouch: cables, power bank, charger, earbuds</li>
  <li>Toiletry kit: TSA-approved bottles + travel-size sunscreen</li>
</ul>`
  },
  {
    title: 'Women’s Capsule Accessories: 12 Pieces to Elevate Every Outfit',
    slug: 'womens-capsule-accessories-12-pieces',
    description: 'Build a capsule accessories wardrobe—12 essentials for effortless outfits all year.',
    tags: ['women','capsule','accessories','style','wardrobe'],
    status: 'draft',
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Women’s Capsule Accessories: 12 Pieces to Elevate Every Outfit</h1>
<p>These timeless accessories pair with everything—work, weekends, and travel.</p>
<h2>The Core 12</h2>
<ol>
  <li>Structured tote</li>
  <li>Crossbody bag</li>
  <li>Silk-like scarf</li>
  <li>Minimalist belt</li>
  <li>Hoop earrings</li>
  <li>Everyday necklace</li>
  <li>Classic sunglasses</li>
  <li>Beanie + light scarf (seasonal)</li>
  <li>Compact wallet</li>
  <li>Watch band (quick release)</li>
  <li>Hair claw + scrunchies</li>
  <li>Travel jewelry case</li>
</ol>`
  },
  {
    title: 'Office & Travel Organization Hacks: Setups that Save Time',
    slug: 'office-travel-organization-hacks',
    description: 'Desk and travel setups that keep cables tidy, bags clean, and mornings stress-free.',
    tags: ['office','travel','organization','productivity','packing'],
    status: 'draft',
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Office &amp; Travel Organization Hacks: Setups that Save Time</h1>
<p>Small upgrades create big productivity wins. Here are our favorite organization hacks.</p>
<h2>Desk Setup</h2>
<ul>
  <li>Desk mat zones: laptop, writing, charging</li>
  <li>Cable management: velcro ties + under-desk clips</li>
  <li>Charging tray for phone + earbuds</li>
</ul>`
  },
  {
    title: 'How to Choose the Perfect Gift by Occasion',
    slug: 'choose-perfect-gift-by-occasion',
    description: 'Use this 5-step framework to choose gifts for birthdays, anniversaries, and beyond.',
    tags: ['gifting','occasions','gift guide','birthdays','anniversaries'],
    status: 'draft',
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>How to Choose the Perfect Gift by Occasion</h1>
<p>Use this simple framework to match gifts to occasions and personalities—every time.</p>`
  }
];

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const blogs = db.collection('blogs');

    for (const p of posts) {
      const exists = await blogs.findOne({ slug: p.slug });
      if (exists) {
        console.log(`Skip (exists): ${p.slug}`);
        continue;
      }
      const doc = {
        ...p,
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await blogs.insertOne(doc);
      console.log(`Inserted: ${p.slug}`);
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();


