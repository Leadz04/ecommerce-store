import { NextRequest, NextResponse } from 'next/server';
import { EtsyPublicAPI } from '@/lib/etsy';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ listingId: string }> }
) {
    try {
        const params = await props.params;
        const listingId = params.listingId;

        if (!listingId) {
            return NextResponse.json(
                { error: 'Listing ID is required' },
                { status: 400 }
            );
        }

        // Fetch listing details from Etsy Public API
        const response = await EtsyPublicAPI.getListing(Number(listingId), { includes: 'Images' });

        // Handle Etsy API response structure (might be wrapped in results array)
        const listing = response.results && Array.isArray(response.results) && response.results.length > 0
            ? response.results[0]
            : response;

        if (!listing || (response.results && response.results.length === 0)) {
            return NextResponse.json(
                { error: 'Listing not found' },
                { status: 404 }
            );
        }

        // Normalize the listing data
        const priceAmount = listing.price?.amount ?? 0;
        const priceDivisor = listing.price?.divisor ?? 100;
        const priceCurrency = listing.price?.currency_code ?? 'USD';
        const priceValue = priceDivisor > 0 ? priceAmount / priceDivisor : 0;

        const normalizedListing = {
            listing_id: listing.listing_id,
            title: listing.title,
            description: listing.description,
            url: listing.url,
            price: priceValue,
            currency: priceCurrency,
            quantity: listing.quantity ?? 1,
            views: listing.views ?? null,
            num_favorers: listing.num_favorers ?? null,
            shop_id: listing.shop_id ?? null,
            shop_name: listing.shop?.shop_name ?? null,
            is_star_seller: listing.shop?.is_star_seller ?? false,
            taxonomy_id: listing.taxonomy_id ?? null,
            category_path: listing.category_path ?? [],
            tags: Array.isArray(listing.tags) ? listing.tags : [],
            materials: Array.isArray(listing.materials) ? listing.materials : [],
            images: Array.isArray(listing.images) ? listing.images : [],
            videos: Array.isArray(listing.videos) ? listing.videos : [],
            created_timestamp: listing.creation_timestamp ?? listing.created_timestamp ?? null,
            state: listing.state ?? 'active',
            who_made: listing.who_made ?? null,
            when_made: listing.when_made ?? null,
            is_supply: listing.is_supply ?? false,
            is_customizable: listing.is_customizable ?? false,
            is_digital: listing.is_digital ?? false,
            shipping_profile_id: listing.shipping_profile_id ?? null,
            return_policy_id: listing.return_policy_id ?? null,
            processing_min: listing.processing_min ?? null,
            processing_max: listing.processing_max ?? null,
        };

        return NextResponse.json({
            success: true,
            listing: normalizedListing,
        });
    } catch (error: any) {
        console.error('[Etsy Listing Details API] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch listing details' },
            { status: 500 }
        );
    }
}
