# Fine Edges Option - Image Editor

## What is "Fine Edges"?

The **Fine Edges** option in the image editor is designed to improve background removal quality for images with intricate details around the edges of the subject.

## When to Use Fine Edges

Enable "Fine edges" when your product image has:

### ✅ Good Candidates for Fine Edges:
- **Hair or Fur**: Products with models wearing items with hair, fur, or fuzzy textures
- **Transparent/Translucent Items**: Glass, plastic, or fabric that shows through
- **Fine Details**: Jewelry, lace, mesh, or intricate patterns
- **Soft Edges**: Products with soft, blurred, or feathered edges
- **Complex Outlines**: Items with irregular or complex shapes

### ❌ Not Needed For:
- **Solid Objects**: Products with clear, hard edges (electronics, boxes, etc.)
- **Simple Shapes**: Items with straightforward outlines
- **High Contrast**: Images where subject clearly stands out from background

## How It Works

### Current Implementation (Client-Side)
The `@imgly/background-removal` library uses an AI model that automatically detects and preserves fine details. When "Fine edges" is enabled:

1. **Better Edge Detection**: The algorithm pays more attention to edge details
2. **Preserves Transparency**: Better handling of semi-transparent areas
3. **Smoother Edges**: Reduces jagged edges and artifacts
4. **Detail Preservation**: Maintains fine textures like hair, fur, or fabric details

### Technical Details

**Note**: The `@imgly/background-removal` library doesn't have a direct "fineEdges" parameter. The current implementation:
- Passes the `fineEdges` flag for future use
- The library's default model already handles fine edges well
- Future updates may use different model configurations based on this flag

## Performance Impact

- **Processing Time**: Fine edges mode may take slightly longer (1-2 seconds more)
- **Quality**: Better edge quality, especially for complex images
- **File Size**: May result in slightly larger output files due to better detail preservation

## Best Practices

1. **Test First**: Try without fine edges first, then enable if edges look jagged
2. **Use for Complex Images**: Enable for products with hair, fur, or intricate details
3. **Not Always Needed**: Simple products with clear edges don't need this option
4. **Preview Before Applying**: Always check the preview before finalizing

## Example Use Cases

### ✅ Enable Fine Edges:
- Clothing with models (hair, fabric details)
- Jewelry (intricate patterns, reflections)
- Accessories with fur or feathers
- Products with transparent elements
- Items with soft, blurred backgrounds

### ❌ Don't Need Fine Edges:
- Electronics (clear, hard edges)
- Books or boxes (simple shapes)
- Solid color products
- Items with high contrast backgrounds

## UI Location

In the Image Editor:
1. Check "Remove background"
2. Under background removal options, you'll see:
   - ☑️ **Fine edges (for detailed images)**
3. Enable this checkbox for better edge quality

## Future Improvements

Potential enhancements:
- Use different AI models based on fineEdges flag
- Adjust processing parameters for better edge detection
- Add edge refinement post-processing
- Custom edge smoothing algorithms
