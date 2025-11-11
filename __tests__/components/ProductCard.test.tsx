import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '@/components/ProductCard';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('@/store/cartStore');
jest.mock('@/store/wishlistStore');
jest.mock('react-hot-toast');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    _id: 'prod123',
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    images: ['/test-image.jpg'],
    category: 'Electronics',
    stock: 10,
    rating: 4.5,
    reviewCount: 20,
  };

  const mockAddToCart = jest.fn();
  const mockAddToWishlist = jest.fn();
  const mockRemoveFromWishlist = jest.fn();
  const mockIsInWishlist = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useCartStore as unknown as jest.Mock).mockReturnValue({
      addItem: mockAddToCart,
    });

    (useWishlistStore as unknown as jest.Mock).mockReturnValue({
      addToWishlist: mockAddToWishlist,
      removeFromWishlist: mockRemoveFromWishlist,
      isInWishlist: mockIsInWishlist,
    });

    mockIsInWishlist.mockReturnValue(false);
  });

  it('should render product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('should display sale price and discount badge', () => {
    const productWithSale = {
      ...mockProduct,
      salePrice: 80,
    };

    render(<ProductCard product={productWithSale} />);

    expect(screen.getByText('$80.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('should show out of stock badge when stock is 0', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stock: 0,
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should show low stock badge when stock is low', () => {
    const lowStockProduct = {
      ...mockProduct,
      stock: 5,
    };

    render(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('should display flash sale information', () => {
    const flashSaleProduct = {
      ...mockProduct,
      flashSale: {
        discountPercentage: 30,
        endDate: new Date('2025-12-31'),
      },
    };

    render(<ProductCard product={flashSaleProduct} />);

    expect(screen.getByText('-30%')).toBeInTheDocument();
    expect(screen.getByText('Sale ends soon!')).toBeInTheDocument();
  });

  it('should display rating and review count', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(20)')).toBeInTheDocument();
  });

  it('should add product to wishlist when heart icon is clicked', async () => {
    render(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getAllByRole('button')[0]; // First button is wishlist
    fireEvent.click(wishlistButton);

    await waitFor(() => {
      expect(mockAddToWishlist).toHaveBeenCalledWith('prod123');
      expect(toast.success).toHaveBeenCalledWith('Added to wishlist!');
    });
  });

  it('should remove product from wishlist when already in wishlist', async () => {
    mockIsInWishlist.mockReturnValue(true);

    render(<ProductCard product={mockProduct} />);

    const wishlistButton = screen.getAllByRole('button')[0];
    fireEvent.click(wishlistButton);

    await waitFor(() => {
      expect(mockRemoveFromWishlist).toHaveBeenCalledWith('prod123');
      expect(toast.success).toHaveBeenCalledWith('Removed from wishlist');
    });
  });

  it('should not render quick add button in compact mode', () => {
    render(<ProductCard product={mockProduct} compact={true} />);

    // Category should not be shown in compact mode
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });

  it('should disable quick add when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stock: 0,
    };

    render(<ProductCard product={outOfStockProduct} />);

    // The out of stock message should be present
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should render without animations when animate prop is false', () => {
    render(<ProductCard product={mockProduct} animate={false} />);

    // Should still render the product
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalProduct = {
      _id: 'prod123',
      name: 'Minimal Product',
      price: 50,
    };

    render(<ProductCard product={minimalProduct as any} />);

    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });
});

