'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Crop, ImageOff, Download, Loader2, Check, RotateCw, Paintbrush } from 'lucide-react';
import clsx from 'clsx';
import ReactCrop, { Crop as CropType, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { processImageClientSide, generateCloudinaryTransformUrl } from '@/lib/imageProcessing';
import toast from 'react-hot-toast';

interface ImageEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (processedUrl: string) => void;
  productName?: string;
  folder?: string;
}

export default function ImageEditor({
  imageUrl,
  isOpen,
  onClose,
  onSave,
  productName,
  folder,
}: ImageEditorProps) {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1);
  const [removeBg, setRemoveBg] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fineEdges, setFineEdges] = useState(false);
  const [bgPreset, setBgPreset] = useState<string | null>(null);
  const [colorFillMode, setColorFillMode] = useState(false);
  const [fillColor, setFillColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(20);
  const colorFillCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  
  // Studio background presets
  const studioBackgrounds = [
    { name: 'White', color: '#ffffff', label: 'Pure White' },
    { name: 'Light Gray', color: '#f5f5f5', label: 'Light Gray' },
    { name: 'Gray', color: '#e5e5e5', label: 'Medium Gray' },
    { name: 'Dark Gray', color: '#4a4a4a', label: 'Dark Gray' },
    { name: 'Black', color: '#000000', label: 'Pure Black' },
    { name: 'Cream', color: '#faf8f3', label: 'Cream' },
    { name: 'Beige', color: '#f5f5dc', label: 'Beige' },
    { name: 'Light Blue', color: '#e6f3ff', label: 'Light Blue' },
    { name: 'Light Pink', color: '#fff0f5', label: 'Light Pink' },
    { name: 'Light Green', color: '#f0fff4', label: 'Light Green' },
    { name: 'Warm White', color: '#fffef7', label: 'Warm White' },
    { name: 'Cool White', color: '#f8f9fa', label: 'Cool White' },
  ];
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Client-side processing only (free, no paid APIs)
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Load image when component opens
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImage(img);
        // Initialize crop to center
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 90,
            },
            1,
            img.width,
            img.height
          ),
          img.width,
          img.height
        );
        setCrop(crop);
      };
      img.onerror = () => {
        toast.error('Failed to load image');
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  const generatePreview = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    // Apply color fills if any
    if (colorFillCanvasRef.current && colorFillMode) {
      const fillCanvas = colorFillCanvasRef.current;
      const fillCtx = fillCanvas.getContext('2d');
      if (fillCtx) {
        // The fill canvas is at natural image dimensions
        // Draw the cropped portion of the fill canvas onto the main canvas
        const fillCropX = cropX;
        const fillCropY = cropY;
        const fillCropWidth = crop.width * scaleX;
        const fillCropHeight = crop.height * scaleY;
        
        // Draw the color fills on top of the image
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(
          fillCanvas,
          fillCropX,
          fillCropY,
          fillCropWidth,
          fillCropHeight,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY
        );
      }
    }

    // Convert canvas to blob for preview
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    }, 'image/png');
  }, [completedCrop, colorFillMode]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio || 1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [aspectRatio]);

  // Generate preview when crop or settings change
  useEffect(() => {
    if (originalImage && completedCrop && imgRef.current) {
      generatePreview();
    }
  }, [completedCrop, removeBg, bgColor, fineEdges, colorFillMode, generatePreview, originalImage]);

  const handleProcess = async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error('Please select a crop area');
      return;
    }

    setProcessing(true);
    setProcessingStage('Preparing image...');

    try {
      // Regenerate preview to ensure color fills are included
      await generatePreview();
      
      // Use client-side processing (free, no paid APIs)
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      // Convert canvas to blob
      setProcessingStage('Cropping image...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert canvas to blob'));
        }, 'image/png');
      });

      // Process image (with background removal if requested)
      if (removeBg) {
        setProcessingStage(fineEdges 
          ? 'Removing background (high quality mode)...' 
          : 'Removing background (fast mode)...');
      } else {
        setProcessingStage('Processing image...');
      }

      const processedBlob = await processImageClientSide(blob, {
        removeBackground: removeBg ? {
          fineEdges,
          backgroundColor: removeBg && bgColor ? bgColor : undefined,
        } : false,
        method: 'client-side',
      });

      // Upload processed blob to Cloudinary (storage only, no paid processing)
      setProcessingStage('Uploading to Cloudinary...');
      const formData = new FormData();
      formData.append('file', processedBlob);
      formData.append('product_name', productName || 'product');
      if (folder) formData.append('folder', folder);

      const uploadResponse = await fetch('/api/uploads/cloudinary', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      const finalUrl = uploadData.url;

      toast.success('Image processed successfully!');
      onSave(finalUrl);
      onClose();
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  // Initialize color fill canvas when image loads
  const initializeCanvases = useCallback(() => {
    if (imgRef.current && colorFillCanvasRef.current && previewCanvasRef.current) {
      const image = imgRef.current;
      if (image.complete && image.naturalWidth > 0) {
        const rect = image.getBoundingClientRect();
        
        // Set canvas internal dimensions to natural image size
        colorFillCanvasRef.current.width = image.naturalWidth;
        colorFillCanvasRef.current.height = image.naturalHeight;
        previewCanvasRef.current.width = image.naturalWidth;
        previewCanvasRef.current.height = image.naturalHeight;
        
        // Set canvas display size to match displayed image
        colorFillCanvasRef.current.style.width = `${rect.width}px`;
        colorFillCanvasRef.current.style.height = `${rect.height}px`;
        previewCanvasRef.current.style.width = `${rect.width}px`;
        previewCanvasRef.current.style.height = `${rect.height}px`;
        
        // Clear canvases
        const fillCtx = colorFillCanvasRef.current.getContext('2d');
        const previewCtx = previewCanvasRef.current.getContext('2d');
        if (fillCtx) {
          fillCtx.clearRect(0, 0, colorFillCanvasRef.current.width, colorFillCanvasRef.current.height);
        }
        if (previewCtx) {
          previewCtx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
        }
      }
    }
  }, []);

  // Initialize canvases when image loads or when color fill mode is enabled
  useEffect(() => {
    if (imgRef.current?.complete) {
      initializeCanvases();
    }
  }, [originalImage, colorFillMode, initializeCanvases]);

  // Also initialize when image loads
  useEffect(() => {
    const image = imgRef.current;
    if (image) {
      if (image.complete) {
        initializeCanvases();
      } else {
        image.addEventListener('load', initializeCanvases);
        return () => image.removeEventListener('load', initializeCanvases);
      }
    }
  }, [initializeCanvases]);

  // Draw preview circle on preview canvas
  const drawPreview = useCallback((x: number, y: number) => {
    if (!previewCanvasRef.current || !imgRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = imgRef.current;
    const rect = image.getBoundingClientRect();
    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;
    const brushSizeScaled = brushSize * scaleX;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, brushSizeScaled / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }, [fillColor, brushSize]);

  // Handle mouse events for color fill
  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!colorFillMode || !imgRef.current) return;

    const image = imgRef.current;
    const rect = image.getBoundingClientRect();
    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Show preview
    drawPreview(x, y);

    // If dragging, apply color
    if (isDrawingRef.current && colorFillCanvasRef.current) {
      const canvas = colorFillCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const brushSizeScaled = brushSize * scaleX;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(x, y, brushSizeScaled / 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (completedCrop) {
          generatePreview();
        }
      }
    }
  }, [colorFillMode, fillColor, brushSize, completedCrop, drawPreview, generatePreview]);

  const handleImageMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!colorFillMode || !imgRef.current || !colorFillCanvasRef.current) return;
    e.preventDefault();
    
    isDrawingRef.current = true;
    
    const image = imgRef.current;
    const rect = image.getBoundingClientRect();
    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const canvas = colorFillCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const brushSizeScaled = brushSize * scaleX;

    // Apply color at click position
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSizeScaled / 2, 0, Math.PI * 2);
    ctx.fill();
    
    if (completedCrop) {
      generatePreview();
    }
  }, [colorFillMode, fillColor, brushSize, completedCrop, generatePreview]);

  const handleImageMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleImageMouseLeave = useCallback(() => {
    // Clear preview when mouse leaves
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
    }
    isDrawingRef.current = false;
  }, []);

  const clearColorFills = () => {
    if (colorFillCanvasRef.current) {
      const ctx = colorFillCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, colorFillCanvasRef.current.width, colorFillCanvasRef.current.height);
        if (completedCrop) {
          generatePreview();
        }
      }
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRemoveBg(false);
    setColorFillMode(false);
    setProcessing(false);
    setProcessingStage('');
    if (colorFillCanvasRef.current) {
      const ctx = colorFillCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, colorFillCanvasRef.current.width, colorFillCanvasRef.current.height);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Edit Image</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Editor Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Crop Tool */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Crop className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Crop Image</h3>
                </div>
                
                {originalImage && (
                  <div 
                    ref={imageContainerRef}
                    className="relative"
                    onMouseMove={handleImageMouseMove}
                    onMouseDown={handleImageMouseDown}
                    onMouseUp={handleImageMouseUp}
                    onMouseLeave={handleImageMouseLeave}
                    style={{ cursor: colorFillMode ? 'crosshair' : 'default' }}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      minWidth={100}
                      minHeight={100}
                      disabled={colorFillMode}
                    >
                      <div className="relative">
                        <img
                          ref={imgRef}
                          src={imageUrl}
                          alt="Crop"
                          style={{ maxWidth: '100%', maxHeight: '60vh', pointerEvents: colorFillMode ? 'none' : 'auto' }}
                          onLoad={onImageLoad}
                          crossOrigin="anonymous"
                        />
                        {colorFillMode && (
                          <>
                            <canvas
                              ref={colorFillCanvasRef}
                              className="absolute top-0 left-0 pointer-events-none"
                              style={{ 
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%', 
                                maxHeight: '60vh',
                                mixBlendMode: 'normal',
                                zIndex: 2
                              }}
                            />
                            <canvas
                              ref={previewCanvasRef}
                              className="absolute top-0 left-0 pointer-events-none"
                              style={{ 
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%', 
                                maxHeight: '60vh',
                                mixBlendMode: 'normal',
                                zIndex: 3
                              }}
                            />
                          </>
                        )}
                      </div>
                    </ReactCrop>
                  </div>
                )}

                {/* Aspect Ratio Controls */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Aspect Ratio:</span>
                  <button
                    onClick={() => setAspectRatio(undefined)}
                    className={`px-3 py-1 text-sm rounded ${
                      aspectRatio === undefined
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setAspectRatio(1)}
                    className={`px-3 py-1 text-sm rounded ${
                      aspectRatio === 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setAspectRatio(4 / 3)}
                    className={`px-3 py-1 text-sm rounded ${
                      aspectRatio === 4 / 3
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    4:3
                  </button>
                  <button
                    onClick={() => setAspectRatio(16 / 9)}
                    className={`px-3 py-1 text-sm rounded ${
                      aspectRatio === 16 / 9
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    16:9
                  </button>
                </div>
              </div>

              {/* Color Fill Tool */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Paintbrush className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Color Fill</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colorFillMode}
                      onChange={(e) => setColorFillMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable color fill tool</span>
                  </label>

                  {colorFillMode && (
                    <div className="pl-6 space-y-3 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Fill Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
                            placeholder="#ff0000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">
                          Brush Size: {brushSize}px
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={clearColorFills}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Clear All Fills
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        💡 <strong>Tip:</strong> Hover over the image to see a preview, then click to apply the color.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Removal */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ImageOff className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Background</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeBg}
                      onChange={(e) => setRemoveBg(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remove background</span>
                  </label>

                  {removeBg && (
                    <div className="pl-6 space-y-3 border-l-2 border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fineEdges}
                          onChange={(e) => setFineEdges(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">Fine edges (for detailed images)</span>
                          <span className="text-xs text-amber-600 ml-2">⚠️ Slower (2-3x)</span>
                        </div>
                      </label>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Studio Backgrounds</label>
                          <div className="grid grid-cols-4 gap-2">
                            {studioBackgrounds.map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setBgPreset(preset.name);
                                  setBgColor(preset.color);
                                }}
                                className={clsx(
                                  'relative h-10 rounded border-2 transition-all hover:scale-110',
                                  bgPreset === preset.name
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-300 hover:border-gray-400'
                                )}
                                style={{ backgroundColor: preset.color }}
                                title={preset.label}
                              >
                                {bgPreset === preset.name && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-blue-600 bg-white rounded-full p-0.5" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-700">Custom color:</label>
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => {
                              setBgColor(e.target.value);
                              setBgPreset(null);
                            }}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => {
                              setBgColor(e.target.value);
                              setBgPreset(null);
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Method - Client-Side Only (Free) */}
              <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-gray-900 mb-2">Processing Method</h3>
                <p className="text-sm text-gray-600 mb-2">
                  ✓ <strong>Client-Side Processing</strong> (Free, runs in your browser)
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  All image processing happens locally in your browser. No API costs or paid services required.
                </p>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>⚡ Speed Tips:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Images are automatically resized to max 1200px for faster processing</li>
                    <li>Disable "Fine edges" for faster background removal (2-3x faster)</li>
                    <li>Processing time: 3-8 seconds (without fine edges) or 8-15 seconds (with fine edges)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm text-center p-4">
                        Crop area to see preview
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleProcess}
                    disabled={processing || !completedCrop}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Apply Changes
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
