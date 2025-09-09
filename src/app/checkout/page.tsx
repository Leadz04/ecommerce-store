'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { usePaymentStore } from '@/store/paymentStore';
import { CreditCard, Lock, ArrowLeft, CheckCircle, AlertCircle, Package, Truck, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StripePaymentForm from '@/components/StripePaymentForm';
import PaymentConfirmation from '@/components/PaymentConfirmation';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { createOrder, isLoading: isOrderLoading } = useOrderStore();
  const { createPaymentIntent, isLoading: isPaymentLoading } = usePaymentStore();
  
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
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');

  // Check authentication and pre-fill user data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else if (user) {
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateShippingForm = () => {
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    return true;
  };

  const calculateTotals = () => {
    const subtotal = getTotalPrice();
    const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateShippingForm()) {
      return;
    }
    
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsProcessing(true);
      
      // Validate all product IDs before creating order
      for (const item of items) {
        if (!item.product._id && !item.product.id) {
          throw new Error(`Invalid product ID for ${item.product.name}`);
        }
      }
      
      // Create order with payment confirmation
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
        subtotal,
        shipping,
        tax,
        total,
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
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id
      };

      const order = await createOrder(orderData);
      setCreatedOrder(order);
      setOrderSuccess(true);
      setCurrentStep('confirmation');
      clearCart();
      
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
  };

  const handleCreatePaymentIntent = async () => {
    try {
      let orderToUse = createdOrder;

      if (!orderToUse) {
        // Validate all product IDs before creating order
        for (const item of items) {
          if (!item.product._id && !item.product.id) {
            throw new Error(`Invalid product ID for ${item.product.name}`);
          }
        }

        // Create order first
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
          subtotal,
          shipping,
          tax,
          total,
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

        console.log('Creating order with data:', orderData);
        const order = await createOrder(orderData);
        console.log('Order created:', order);
        console.log('Order _id:', order?._id);
        console.log('Order type:', typeof order);
        
        if (!order || !order._id) {
          console.error('Order creation failed - order:', order);
          throw new Error('Failed to create order - no order ID returned');
        }
        
        setCreatedOrder(order);
        orderToUse = order;
      }

      // Ensure we have a valid order ID
      if (!orderToUse || !orderToUse._id) {
        throw new Error('No valid order found');
      }

      // Create payment intent
      console.log('Creating payment intent for order:', orderToUse._id);
      const secret = await createPaymentIntent(orderToUse._id);
      console.log('Payment intent created, client secret:', secret);
      setClientSecret(secret);
      
    } catch (error) {
      console.error('Payment intent creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (orderSuccess && createdOrder) {
    return <PaymentConfirmation order={createdOrder} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/cart" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
                <p className="text-slate-600">Complete your purchase securely</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Lock className="h-4 w-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${currentStep === 'shipping' ? 'text-blue-600' : currentStep === 'payment' || currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'shipping' ? 'bg-blue-600 text-white' : currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Shipping</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200">
                  <div className={`h-full ${currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`flex items-center space-x-2 ${currentStep === 'payment' ? 'text-blue-600' : currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-blue-600 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Payment</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200">
                  <div className={`h-full ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`flex items-center space-x-2 ${currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Shipping Form */}
            {currentStep === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-6">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Country *</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                        required
                      >
                        <option value="United States" className="text-slate-900">United States</option>
                        <option value="Canada" className="text-slate-900">Canada</option>
                        <option value="United Kingdom" className="text-slate-900">United Kingdom</option>
                        <option value="Australia" className="text-slate-900">Australia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {/* Payment Form */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                {!clientSecret ? (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Information</h2>
                    <p className="text-slate-600 mb-6">Click the button below to initialize secure payment processing.</p>
                    <button
                      onClick={handleCreatePaymentIntent}
                      disabled={isPaymentLoading}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isPaymentLoading ? 'Initializing...' : 'Initialize Payment'}
                    </button>
                  </div>
                ) : (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isLoading={isProcessing}
                  />
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">{item.product.name}</h3>
                      <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                      {item.size && <p className="text-sm text-slate-600">Size: {item.size}</p>}
                      {item.color && <p className="text-sm text-slate-600">Color: {item.color}</p>}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-900">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="text-slate-900">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-slate-200 pt-3">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping === 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">Free shipping on orders over $100!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}