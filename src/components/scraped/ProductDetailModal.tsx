import { ScrapedProduct } from '@/types/scraped-product';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductDetailModalProps {
    product: ScrapedProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSelectedImageIndex(0);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const currentImage = images[selectedImageIndex] || product.image;

    // Aggregate specifications
    const specs = Object.entries(product).filter(([key]) => key.startsWith('specifications.'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-gray-50 flex flex-col relative min-h-[300px] md:min-h-full">
                    {/* Main Image */}
                    <div className="relative flex-1 min-h-[300px] md:min-h-0">
                        {currentImage ? (
                            <Image
                                src={currentImage}
                                alt={product.name}
                                fill
                                className="object-contain p-4"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="h-24 border-t border-gray-200 p-2 overflow-x-auto flex gap-2 no-scrollbar bg-white z-10">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-black ring-1 ring-black' : 'border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`Thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    {/* Brand & Category */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className="font-medium text-black uppercase tracking-wider">{product.brand}</span>
                        <span>•</span>
                        <span>{product.department} / {product.category}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h2>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="text-3xl font-bold text-gray-900">
                            Rs. {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-lg text-gray-500 line-through">
                                Rs. {product.originalPrice.toLocaleString()}
                            </span>
                        )}
                        {product.inStock ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                In Stock
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Out of Stock
                            </span>
                        )}
                    </div>

                    <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-lg hover:bg-gray-800 transition-all font-medium mb-8 focus:ring-4 focus:ring-gray-200"
                    >
                        Buy on {product.brand}
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Description */}
                    {product.description && (
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Description</h3>
                            <div
                                className="prose prose-sm text-gray-600 max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description }}
                            />
                        </div>
                    )}

                    {/* Specifications */}
                    {specs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Specifications</h3>
                            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                                {specs.map(([key, value]) => {
                                    const label = key.replace('specifications.', '');
                                    return (
                                        <div key={key}>
                                            <dt className="text-xs text-gray-500 uppercase">{label}</dt>
                                            <dd className="text-sm font-medium text-gray-900 mt-0.5 break-words">
                                                {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
