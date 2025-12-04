const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
const ENV_PATH = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(ENV_PATH)) {
    require('dotenv').config({ path: ENV_PATH });
} else {
    require('dotenv').config();
}

async function main() {
    console.log('🔍 Checking for products with non-Cloudinary images...');

    const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
    if (!uri) {
        console.error('❌ Missing MONGODB_URI in environment');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Define a minimal schema to query
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');

        // Query for products that have images NOT from Cloudinary
        // 1. image field does not contain 'cloudinary.com'
        // 2. OR images array has at least one element that does not contain 'cloudinary.com'
        const query = {
            $or: [
                { image: { $not: /cloudinary\.com/ } },
                { images: { $elemMatch: { $not: /cloudinary\.com/ } } }
            ]
        };

        const count = await Product.countDocuments(query);

        console.log(`📊 Found ${count} products that need image organization.`);

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

        if (count > 0) {
            console.log('🚀 Starting organization script...');

            const scriptPath = path.join(__dirname, 'organize-images-cloudinary.js');
            const child = spawn('node', [scriptPath, '--db'], {
                stdio: 'inherit', // Pipe output directly to console
                shell: true
            });

            child.on('close', (code) => {
                console.log(`\n🏁 Organization script finished with code ${code}`);
                process.exit(code);
            });
        } else {
            console.log('✨ All products are already organized on Cloudinary!');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
