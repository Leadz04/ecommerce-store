import { NextRequest, NextResponse } from 'next/server';
import { EtsyPublicAPI } from '@/lib/etsy';

/**
 * GET /api/etsy/market-insights/[listingId]/image
 * Fetch only the first image for a listing (lightweight endpoint for thumbnails)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId is required' },
        { status: 400 }
      );
    }

    try {
      // Fetch only images (lighter than full details)
      const imagesResponse = await EtsyPublicAPI.getListingImages(listingId);
      const firstImage = imagesResponse?.results?.[0];
      
      if (firstImage) {
        return NextResponse.json({
          success: true,
          listing_id: parseInt(listingId, 10),
          image: {
            url: firstImage.url_fullxfull || firstImage.url_570xN || firstImage.url_75x75 || firstImage.url || '',
            rank: firstImage.rank ?? 0,
            listing_image_id: firstImage.listing_image_id,
          },
        });
      }

      return NextResponse.json({
        success: true,
        listing_id: parseInt(listingId, 10),
        image: null,
      });
    } catch (error: any) {
      console.error(`[Market Insights Image] Error fetching image for listing ${listingId}:`, error);
      return NextResponse.json(
        { 
          success: true,
          listing_id: parseInt(listingId, 10),
          image: null,
        },
        { status: 200 } // Return success even if no image to prevent UI errors
      );
    }
  } catch (error: any) {
    console.error('[Market Insights Image API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch listing image' },
      { status: 500 }
    );
  }
}
