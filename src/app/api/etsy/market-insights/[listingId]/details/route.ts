import { NextRequest, NextResponse } from 'next/server';
import { EtsyPublicAPI } from '@/lib/etsy';

/**
 * GET /api/etsy/market-insights/[listingId]/details
 * Fetch detailed information for a single listing (images, videos, description)
 * Called on-demand when user expands a row in the marketplace insights table
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

    let images: any[] = [];
    let videos: any[] = [];
    let description = '';

    try {
      // Fetch images
      const imagesResponse = await EtsyPublicAPI.getListingImages(listingId);
      if (imagesResponse?.results) {
        images = imagesResponse.results.map((img: any) => ({
          url: img.url_fullxfull || img.url_570xN || img.url_75x75 || img.url || '',
          rank: img.rank ?? 0,
          listing_image_id: img.listing_image_id,
        })).filter((img: any) => img.url);
      }

      // Fetch videos
      try {
        const videosResponse = await EtsyPublicAPI.getListingVideos(listingId);
        if (videosResponse?.results) {
          videos = videosResponse.results.map((vid: any) => ({
            url: vid.url || '',
            video_id: vid.video_id,
            width: vid.width,
            height: vid.height,
          })).filter((vid: any) => vid.url);
        }
      } catch (videoError) {
        // Videos might not be available for all listings
        console.warn(`No videos for listing ${listingId}`);
      }

      // Fetch full listing details for description
      try {
        const listingDetails = await EtsyPublicAPI.getListing(listingId);
        description = listingDetails?.description || '';
      } catch (descError) {
        console.warn(`Could not fetch description for listing ${listingId}`);
      }

      return NextResponse.json({
        success: true,
        listing_id: parseInt(listingId, 10),
        images,
        videos,
        description,
      });
    } catch (error: any) {
      console.error(`[Market Insights Details] Error fetching details for listing ${listingId}:`, error);
      return NextResponse.json(
        { 
          success: false,
          error: error?.message || 'Failed to fetch listing details',
          listing_id: parseInt(listingId, 10),
          images: [],
          videos: [],
          description: '',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Market Insights Details API] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch listing details' },
      { status: 500 }
    );
  }
}
