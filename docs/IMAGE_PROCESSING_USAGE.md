# Image Processing Feature - Usage Guide

## Overview
The e-commerce store now includes automated image cropping and background removal features. These can be accessed directly from the product form when editing images.

## Features

### 1. Automated Cropping
- **Smart Crop**: Uses AI to automatically detect the most important part of the image
- **Aspect Ratio Options**: 
  - Free (no constraints)
  - 1:1 (Square)
  - 4:3 (Standard)
  - 16:9 (Widescreen)
- **Manual Crop Selection**: Drag to select the area you want to keep

### 2. Background Removal
- **AI-Powered Removal**: Automatically removes backgrounds from product images
- **Fine Edges Mode**: Preserves fine details like hair, fur, or transparent edges
- **Background Color Replacement**: Optionally replace removed background with a solid color

### 3. Processing Method

#### Client-Side Processing (Free)
- **100% Free**: No API costs or paid services
- **Privacy-Friendly**: All processing happens in your browser
- **No Setup Required**: Works immediately, no add-ons needed
- **Quality**: Excellent results for most product images
- **Performance**: 3-10 seconds per image depending on size and device

## How to Use

### Step 1: Open Product Form
1. Navigate to Admin Dashboard
2. Click "Add Product" or edit an existing product
3. Upload or enter image URLs

### Step 2: Edit an Image
1. Hover over any image (main or additional)
2. Click the "Edit" icon that appears
3. The Image Editor modal will open

### Step 3: Crop the Image
1. Drag the crop handles to select the desired area
2. Choose an aspect ratio from the buttons (optional)
3. The preview will update automatically

### Step 4: Remove Background (Optional)
1. Check "Remove background" checkbox
2. Optionally enable "Fine edges" for detailed images
3. Optionally choose a background color to replace with

### Step 5: Choose Processing Method
- Select "Cloudinary AI" for best quality (requires add-on)
- Select "Client-Side" for free processing

### Step 6: Apply Changes
1. Review the preview on the right
2. Click "Apply Changes"
3. Wait for processing to complete
4. The image URL will be updated automatically

## API Endpoints

### POST `/api/images/process`
Process an image with cropping and/or background removal.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",  // or use "file" for base64
  "file": "data:image/png;base64,...",  // base64 encoded image
  "crop": {
    "width": 800,
    "height": 800
  },
  "removeBackground": {
    "fineEdges": false,
    "backgroundColor": "#ffffff"
  },
  "method": "cloudinary",  // or "client-side"
  "productName": "Product Name",
  "folder": "EverStyleCrafts/product-name"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "product-name-processed-1234567890",
  "folder": "EverStyleCrafts/product-name",
  "transformations": {
    "width": 800,
    "height": 800,
    "format": "png"
  }
}
```

## Setup Requirements

### Cloudinary Account (Free Tier)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Get your `CLOUDINARY_URL` from the dashboard
3. Add to `.env` file:
```
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**Note**: 
- ✅ Cloudinary free tier includes 25 GB storage and bandwidth
- ❌ **Do NOT** enable any paid add-ons (not needed)
- ✅ We only use Cloudinary for storage, not paid processing

## Best Practices

### Image Processing Tips
- **For Best Results**: Use high-resolution images (at least 800x800px)
- **Performance**: Smaller images process faster (resize if > 5MB)
- **Quality**: Enable "Fine edges" for images with hair, fur, or transparency
- **Privacy**: All processing happens locally - images never leave your device until after processing

### Image Preparation Tips
1. **For Best Results**:
   - Use high-resolution images (at least 800x800px)
   - Ensure good contrast between subject and background
   - Use images with clear subject boundaries

2. **For Background Removal**:
   - Use images with solid or simple backgrounds
   - Enable "Fine edges" for images with hair, fur, or transparency
   - Test with preview before applying

3. **For Cropping**:
   - Select aspect ratio based on where image will be displayed
   - Ensure important parts of product are within crop area
   - Use 1:1 for product thumbnails

## Troubleshooting

### "Invalid or missing CLOUDINARY_URL"
- Check your `.env` file
- Ensure Cloudinary credentials are correct
- Restart your development server

### "Background removal failed"
- Ensure image is accessible (not blocked by CORS)
- Try a different image
- Check browser console for detailed errors

### "Processing timeout"
- Large images may take longer (normal for client-side processing)
- Try reducing image size before processing (resize to < 3MB)
- Processing time: 3-10 seconds is normal for medium-sized images

### Preview not updating
- Ensure crop area is selected
- Check browser console for errors
- Try refreshing the page

## Technical Details

### Libraries Used
- `@imgly/background-removal`: Client-side background removal
- `smartcrop`: Content-aware cropping
- `react-image-crop`: Crop UI component
- `cloudinary`: Server-side image processing

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Canvas API support
- Requires File/Blob API support

## Cost Considerations

### Total Cost: $0.00
- ✅ **Background Removal**: Free (client-side processing)
- ✅ **Cropping**: Free (client-side processing)
- ✅ **Storage**: Free tier available (25 GB storage + bandwidth)

### Cloudinary Free Tier
- 25 GB storage
- 25 GB monthly bandwidth
- CDN delivery included
- Unlimited transformations (for storage/CDN)

**Note**: We only use Cloudinary for storage/CDN, not for paid processing features.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Cloudinary documentation
3. Check browser console for errors
4. Verify environment variables are set correctly
