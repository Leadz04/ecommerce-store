'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { CreditCard, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, updateQuantity, removeItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { createOrder, isLoading: isOrderLoading, error: orderError } = useOrderStore();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Check authentication and pre-fill user data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else if (user) {
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || '',
        address: user.address?.address1 || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || 'United States'
      }));
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
    }
    
    // Format CVV (only numbers, max 4 digits)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    // Format phone number
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').replace(/(.{3})(.{3})(.{4})/, '($1) $2-$3');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const validateForm = () => {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'nameOnCard', 'cardNumber', 'expiryDate', 'cvv'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    // Basic card number validation (should be 16 digits)
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.product._id || item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          size: item.size,
          color: item.color
        })),
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone
        },
        paymentMethod: 'card',
        paymentStatus: 'pending'
      };

      // Debug: Log the order data being sent
      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));
      
      // Create the order
      const order = await createOrder(orderData);
      
      // Clear cart
      clearCart();
      
      // Set success state
      setCreatedOrder(order);
      setOrderSuccess(true);
      
      // Show success toast
      toast.success('Order placed successfully!');
      
      // Redirect to orders page after a delay
      setTimeout(() => {
        router.push('/orders');
      }, 3000);
      
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Show success state
  if (orderSuccess && createdOrder) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <CheckCircle className="h-24 w-24 mx-auto mb-6 text-green-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Order Placed Successfully!</h1>
            <p className="text-xl text-green-100 mb-8">
              Your order #{createdOrder.orderNumber} has been confirmed.
            </p>
            <div className="space-x-4">
              <Link
                href="/orders"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Orders
              </Link>
              <Link
                href="/products"
                className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-xl text-blue-100 mb-8">Add some items to your cart before checking out.</p>
            <Link
              href="/products"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/products"
              className="flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Checkout</h1>
        </div>
      </section>

      {/* Checkout Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div>
              {/* Error Display */}
              {orderError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-red-700">{orderError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="ZIP code"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="mt-4">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="nameOnCard"
                  placeholder="Name on card"
                  value={formData.nameOnCard}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  maxLength={19}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    maxLength={5}
                    required
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                  <input
                    type="text"
                    name="cvv"
                    placeholder="CVV"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    maxLength={4}
                    required
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isProcessing || isOrderLoading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {(isProcessing || isOrderLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isOrderLoading ? 'Creating Order...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Place Order - ${total.toFixed(2)}
                </>
              )}
            </button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 border rounded text-xs">-</button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 border rounded text-xs">+</button>
                      <button onClick={() => removeItem(item.id)} className="ml-3 text-red-600 hover:text-red-700 text-xs">Remove</button>
                    </div>
                    {item.size && <p className="text-gray-500 text-sm">Size: {item.size}</p>}
                    {item.color && <p className="text-gray-500 text-sm">Color: {item.color}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

                {/* Security Notice */}
                <div className="mt-6 flex items-center text-sm text-gray-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
