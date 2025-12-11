import Link from 'next/link';
import Image from 'next/image';
import { ScrapedProduct } from '@/types/scraped-product';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
    product: ScrapedProduct;
    onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const { addItem } = useCartStore();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Adapting ScrapedProduct to Product type for cart
        const cartProduct: any = {
            ...product,
            _id: product._id || (product as any).id,
            description: product.description || '',
            inStock: true, // Assuming scraped products are in stock since they are listed
            stockCount: 99, // Dummy stock for external products
        };

        addItem(cartProduct, 1);
        toast.success('Added to cart');
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
        >
            <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}

                {/* Brand Badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {product.brand}
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em] mb-1" title={product.name}>
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        Rs. {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                            Rs. {product.originalPrice.toLocaleString()}
                        </span>
                    )}
                </div>

                <div className="mt-auto pt-4 flex gap-2">
                    <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-black text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                    </button>
                    <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="View on Source Site"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
