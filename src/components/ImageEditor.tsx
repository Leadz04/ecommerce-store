'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Crop, ImageOff, Download, Loader2, Check, RotateCw } from 'lucide-react';
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
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Client-side processing only (free, no paid APIs)
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Generate preview when crop or settings change
  useEffect(() => {
    if (originalImage && completedCrop && imgRef.current) {
      generatePreview();
    }
  }, [completedCrop, removeBg, bgColor, fineEdges]);

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

  const generatePreview = async () => {
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

    // Convert canvas to blob for preview
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    }, 'image/png');
  };

  const handleProcess = async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error('Please select a crop area');
      return;
    }

    setProcessing(true);

    try {
      // Use client-side processing (free, no paid APIs)
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert canvas to blob'));
        }, 'image/png');
      });

      const processedBlob = await processImageClientSide(blob, {
        removeBackground: removeBg ? {
          fineEdges,
          backgroundColor: removeBg && bgColor ? bgColor : undefined,
        } : false,
        method: 'client-side',
      });

      // Upload processed blob to Cloudinary (storage only, no paid processing)
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
    setProcessing(false);
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
                  <div className="relative">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      minWidth={100}
                      minHeight={100}
                    >
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Crop"
                        style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        onLoad={onImageLoad}
                        crossOrigin="anonymous"
                      />
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
                        <span className="text-sm text-gray-700">Fine edges (for detailed images)</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700">Background color:</label>
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
                          placeholder="#ffffff"
                        />
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
                <p className="text-xs text-gray-500">
                  All image processing happens locally in your browser. No API costs or paid services required.
                </p>
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
