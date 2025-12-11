const axios = require('axios');

async function inspect999() {
    console.log('Fetching one page of 999pk...');
    try {
        const response = await axios.get('https://999.com.pk/products.json?page=1&limit=5', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const products = response.data.products;

        if (products.length > 0) {
            const p = products[0];
            console.log('First Product Title:', p.title);
            console.log('Images Array:', JSON.stringify(p.images, null, 2));
        } else {
            console.log('No products found.');
        }
    } catch (e) {
        console.error(e.message);
    }
}

inspect999();
