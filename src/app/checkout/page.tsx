'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { usePaymentStore } from '@/store/paymentStore';
import { CreditCard, Lock, ArrowLeft, CheckCircle, AlertCircle, Package, Truck, MapPin, Calendar, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import StripePaymentForm from '@/components/StripePaymentForm';
import PaymentConfirmation from '@/components/PaymentConfirmation';
import SelectField from '@/components/SelectField';
import PromoCodeInput from '@/components/PromoCodeInput';
import { formatDeliveryDate, getDeliveryDateRange } from '@/lib/delivery-date';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    getTotalPrice,
    clearCart,
    promoCode,
    applyPromoCode,
    removePromoCode,
    getDiscountAmount,
  } = useCartStore();
  const enforceStockLimits = useCartStore((state) => state.enforceStockLimits);
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
    // Billing address (separate from shipping)
    billingSameAsShipping: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'United States',
    billingPhone: '',
    // Additional fields
    orderNotes: '',
    deliveryInstructions: '',
    estimatedDeliveryDate: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [openSelect, setOpenSelect] = useState<'country' | 'billingCountry' | null>(null);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [useSavedPayment, setUseSavedPayment] = useState(false);
  const hasInitializedPaymentRef = useRef(false);

  // Pre-fill user data if authenticated (guest checkout allowed)
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email || '',
        firstName: user.name?.split(' ')[0] || prev.firstName || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || prev.lastName || '',
        phone: user.phone || prev.phone || '',
        address: user.address?.address1 || prev.address || '',
        city: user.address?.city || prev.city || '',
        state: user.address?.state || prev.state || '',
        zipCode: user.address?.zipCode || prev.zipCode || '',
        country: user.address?.country || prev.country || 'United States'
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const adjustments = enforceStockLimits();
    adjustments.forEach((adj) => {
      if (adj.removed) {
        toast.error(`${adj.name} was removed from your cart because it is out of stock.`);
      } else {
        toast.error(
          `${adj.name}: Only ${adj.availableStock} left. Quantity updated to ${adj.newQuantity}.`
        );
      }
    });
  }, [enforceStockLimits]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateShippingForm = () => {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Validate billing address if different from shipping
    if (!formData.billingSameAsShipping) {
      const billingRequiredFields = ['billingFirstName', 'billingLastName', 'billingAddress', 'billingCity', 'billingState', 'billingZipCode', 'billingPhone'];
      for (const field of billingRequiredFields) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in billing ${field.replace('billing', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
    }
    
    return true;
  };

  const calculateTotals = () => {
    const subtotal = getTotalPrice();
    const discount = Math.min(getDiscountAmount(), subtotal);
    const discountedSubtotal = Math.max(subtotal - discount, 0);
    const shipping = discountedSubtotal > 100 ? 0 : 9.99; // Free shipping over $100
    const tax = discountedSubtotal * 0.08; // 8% tax
    const total = discountedSubtotal + shipping + tax;
    
    return { subtotal, discount, shipping, tax, total };
  };

  const { subtotal, discount, shipping, tax, total } = calculateTotals();

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent continuing if cart is empty
    if (!items || items.length === 0) {
      toast.error('Your cart is empty. Please add items before continuing to checkout.');
      router.push('/cart');
      return;
    }
    
    if (!validateShippingForm()) {
      return;
    }
    
    setCurrentStep('payment');
    // Fire checkout_start when entering payment step
    try {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checkout_start' })
      });
    } catch {}
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsProcessing(true);
      
      // Update the existing order with payment confirmation
      if (!createdOrder || !createdOrder._id) {
        throw new Error('No order found to update');
      }

      // Update the existing order with payment information
      const { updateOrder } = useOrderStore.getState();
      await updateOrder(createdOrder._id, {
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        status: 'processing'
      });

      // Update the local order state
      const updatedOrder = {
        ...createdOrder,
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        status: 'processing'
      };
      
      setCreatedOrder(updatedOrder);
      setOrderSuccess(true);
      setCurrentStep('confirmation');
      clearCart();
      
      // Pass guest email to confirmation component
      if (!isAuthenticated && formData.email) {
        updatedOrder.guestEmail = formData.email;
      }

      // Send order confirmation email
      try {
        const emailData = {
          orderNumber: updatedOrder.orderNumber || updatedOrder._id,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          orderTotal: updatedOrder.total,
          items: updatedOrder.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        };

        const emailResponse = await fetch('/api/email/order-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });
        
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({ error: 'Failed to send email' }));
          console.error('Email API error:', errorData);
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }
      
    } catch (error) {
      console.error('Order update error:', error);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
  };

  const handleCreatePaymentIntent = useCallback(async () => {
    try {
      // Prevent creating an order if cart is empty
      if (!items || items.length === 0) {
        toast.error('Your cart is empty. Please add items before checking out.');
        router.push('/cart');
        return;
      }

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
          items: items.map(item => {
            const productId = item.product._id || item.product.id;
            const normalizedProductId = productId?.toString();
            const normalizedPromoProductId = promoCode?.productId?.toString();
            const promoMatchesProduct = normalizedPromoProductId
              ? normalizedPromoProductId === normalizedProductId
              : Boolean(promoCode);

            // Get the base/original price for calculations
            const basePrice = item.product.emailPromo?.originalPrice 
              || item.product.originalPrice 
              || item.product.price;

            const appliedPromo = promoMatchesProduct && promoCode
              ? {
                  promoToken: promoCode.token,
                  promoPercent: promoCode.discountPercent,
                  promoOriginalPrice: basePrice,
                }
              : item.product.emailPromo
                ? {
                    promoToken: item.product.emailPromo.token,
                    promoPercent: item.product.emailPromo.discountPercent,
                    promoOriginalPrice: item.product.emailPromo.originalPrice || basePrice,
                  }
                : {};

            return {
              productId,
              name: item.product.name,
              price: basePrice, // Send original price, order API will calculate discount
              quantity: item.quantity,
              image: item.product.image,
              size: item.size,
              color: item.color,
              ...appliedPromo,
            };
          }),
          subtotal,
          discount,
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
          billingAddress: formData.billingSameAsShipping ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
            phone: formData.phone
          } : {
            firstName: formData.billingFirstName,
            lastName: formData.billingLastName,
            address1: formData.billingAddress,
            city: formData.billingCity,
            state: formData.billingState,
            zipCode: formData.billingZipCode,
            country: formData.billingCountry,
            phone: formData.billingPhone
          },
          notes: formData.orderNotes || undefined,
          deliveryInstructions: formData.deliveryInstructions || undefined,
          estimatedDeliveryDate: formData.estimatedDeliveryDate ? new Date(formData.estimatedDeliveryDate) : undefined,
          paymentMethod: 'card',
          paymentStatus: 'pending' as const,
          guestEmail: !isAuthenticated ? formData.email : undefined // Include guest email
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

      // Create payment intent (with saved payment method if selected)
      console.log('Creating payment intent for order:', orderToUse._id);
      const secret = await createPaymentIntent(
        orderToUse._id,
        useSavedPayment && selectedPaymentMethod ? selectedPaymentMethod : undefined
      );
      console.log('Payment intent created, client secret:', secret);
      setClientSecret(secret);
      // Ensure checkout_start is tracked if not already
      try {
        fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'checkout_start', orderId: orderToUse._id })
        });
      } catch {}
      
    } catch (error) {
      console.error('Payment intent creation error:', error);

      const message =
        error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';

      if (message.toLowerCase().includes('insufficient stock')) {
        // Friendlier message for customers, instead of a raw technical error
        toast.error(
          'One or more items in your cart are out of stock. Please update your cart and try again.'
        );
      } else {
        toast.error(message);
      }
    }
  }, [
    createdOrder,
    items,
    subtotal,
    discount,
    shipping,
    tax,
    formData,
    promoCode,
    isAuthenticated,
    createOrder,
    createPaymentIntent,
    useSavedPayment,
    selectedPaymentMethod
  ]);

  // Automatically create order + payment intent when entering the payment step
  // so the customer goes straight to card details without an extra "Initialize" click.
  useEffect(() => {
    if (
      currentStep === 'payment' &&
      !clientSecret &&
      !hasInitializedPaymentRef.current
    ) {
      hasInitializedPaymentRef.current = true;
      handleCreatePaymentIntent();
    }
  }, [currentStep, clientSecret, handleCreatePaymentIntent]);

  // Guest checkout is now allowed, so we don't need to check authentication

  if (orderSuccess && createdOrder) {
    return <PaymentConfirmation order={createdOrder} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Checkout</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Complete your purchase securely</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-slate-600 shrink-0">
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto pb-2">
                <div className={`flex items-center space-x-1 sm:space-x-2 shrink-0 ${currentStep === 'shipping' ? 'text-blue-600' : currentStep === 'payment' || currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'shipping' ? 'bg-blue-600 text-white' : currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base">Shipping</span>
                </div>
                <div className="flex-1 min-w-[20px] sm:min-w-[40px] h-0.5 bg-slate-200">
                  <div className={`h-full ${currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`flex items-center space-x-1 sm:space-x-2 shrink-0 ${currentStep === 'payment' ? 'text-blue-600' : currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-blue-600 text-white' : currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base">Payment</span>
                </div>
                <div className="flex-1 min-w-[20px] sm:min-w-[40px] h-0.5 bg-slate-200">
                  <div className={`h-full ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-slate-200'}`}></div>
                </div>
                <div className={`flex items-center space-x-1 sm:space-x-2 shrink-0 ${currentStep === 'confirmation' ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${currentStep === 'confirmation' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="font-medium text-xs sm:text-sm md:text-base">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Shipping Form */}
            {currentStep === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6">Shipping Information</h2>
                  
                  {!isAuthenticated && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Guest Checkout:</strong> You can complete your purchase without creating an account. 
                        We'll send order updates to your email.
                      </p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">We'll send your order confirmation here</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <SelectField
                        label="Country"
                        options={[
                          { value: 'United States', label: 'United States' },
                          { value: 'Canada', label: 'Canada' },
                          { value: 'United Kingdom', label: 'United Kingdom' },
                          { value: 'Australia', label: 'Australia' },
                        ]}
                        value={formData.country}
                        isOpen={openSelect === 'country'}
                        onOpenChange={(open) => setOpenSelect(open ? 'country' : null)}
                        onSelect={(value) => setFormData(prev => ({ ...prev, country: value }))}
                        required
                      />
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

                  {/* Delivery Instructions */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                      placeholder="e.g., Leave at front door, Ring doorbell, etc."
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-slate-500">{formData.deliveryInstructions.length}/500 characters</p>
                  </div>

                  {/* Estimated Delivery Date Selection */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Preferred Delivery Date (Optional)
                    </label>
                    <select
                      name="estimatedDeliveryDate"
                      value={formData.estimatedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                    >
                      <option value="">Select preferred date (or leave for earliest delivery)</option>
                      {(() => {
                        const options = [];
                        const today = new Date();
                        for (let i = 0; i < 14; i++) {
                          const date = new Date(today);
                          date.setDate(today.getDate() + i);
                          // Skip weekends
                          if (date.getDay() === 0 || date.getDay() === 6) continue;
                          const dateStr = date.toISOString().split('T')[0];
                          const formatted = formatDeliveryDate(date);
                          options.push(
                            <option key={dateStr} value={dateStr}>
                              {formatted}
                            </option>
                          );
                        }
                        return options;
                      })()}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Default: {(() => {
                        const deliveryRange = getDeliveryDateRange({
                          shippingMethod: 'standard',
                          processingDays: 1,
                          businessDaysOnly: true,
                        });
                        return deliveryRange.formatted;
                      })()}
                    </p>
                  </div>

                  {/* Order Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Order Notes/Comments (Optional)
                    </label>
                    <textarea
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-500"
                      placeholder="Any special instructions or notes for your order..."
                      maxLength={1000}
                    />
                    <p className="mt-1 text-xs text-slate-500">{formData.orderNotes.length}/1000 characters</p>
                  </div>

                  {/* Billing Address Section */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Billing Address
                    </h3>
                    
                    <div className="mb-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.billingSameAsShipping}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              billingSameAsShipping: e.target.checked,
                              billingFirstName: e.target.checked ? prev.firstName : prev.billingFirstName,
                              billingLastName: e.target.checked ? prev.lastName : prev.billingLastName,
                              billingAddress: e.target.checked ? prev.address : prev.billingAddress,
                              billingCity: e.target.checked ? prev.city : prev.billingCity,
                              billingState: e.target.checked ? prev.state : prev.billingState,
                              billingZipCode: e.target.checked ? prev.zipCode : prev.billingZipCode,
                              billingCountry: e.target.checked ? prev.country : prev.billingCountry,
                              billingPhone: e.target.checked ? prev.phone : prev.billingPhone,
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Same as shipping address</span>
                      </label>
                    </div>

                    {!formData.billingSameAsShipping && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                            <input
                              type="text"
                              name="billingFirstName"
                              value={formData.billingFirstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingFirstName: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                            <input
                              type="text"
                              name="billingLastName"
                              value={formData.billingLastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingLastName: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
                          <input
                            type="text"
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                            required={!formData.billingSameAsShipping}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                            <input
                              type="text"
                              name="billingCity"
                              value={formData.billingCity}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingCity: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                            <input
                              type="text"
                              name="billingState"
                              value={formData.billingState}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingState: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code *</label>
                            <input
                              type="text"
                              name="billingZipCode"
                              value={formData.billingZipCode}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingZipCode: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <SelectField
                              label="Country"
                              options={[
                                { value: 'United States', label: 'United States' },
                                { value: 'Canada', label: 'Canada' },
                                { value: 'United Kingdom', label: 'United Kingdom' },
                                { value: 'Australia', label: 'Australia' },
                              ]}
                              value={formData.billingCountry}
                              isOpen={openSelect === 'billingCountry'}
                              onOpenChange={(open) => setOpenSelect(open ? 'billingCountry' : null)}
                              onSelect={(value) => setFormData(prev => ({ ...prev, billingCountry: value }))}
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                            <input
                              type="tel"
                              name="billingPhone"
                              value={formData.billingPhone}
                              onChange={(e) => setFormData(prev => ({ ...prev, billingPhone: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                              required={!formData.billingSameAsShipping}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 sm:mt-6 bg-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {/* Payment Form */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                {/* Saved Payment Methods */}
                {isAuthenticated && savedPaymentMethods.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Saved Payment Methods
                    </h2>
                    <div className="space-y-3 mb-4">
                      {savedPaymentMethods.map((method) => (
                        <label
                          key={method._id}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedPaymentMethod === method.paymentMethodId
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.paymentMethodId}
                            checked={selectedPaymentMethod === method.paymentMethodId}
                            onChange={() => {
                              setSelectedPaymentMethod(method.paymentMethodId);
                              setUseSavedPayment(true);
                            }}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {method.card.brand.toUpperCase()} •••• {method.card.last4}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Expires {method.card.expMonth}/{method.card.expYear}
                                  {method.isDefault && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSavedPayment(false);
                        setSelectedPaymentMethod(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Use a different payment method
                    </button>
                  </div>
                )}

                {!clientSecret ? (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Information</h2>
                    <p className="text-slate-600 mb-2">
                      Preparing secure payment form...
                    </p>
                    <p className="text-xs text-slate-500">
                      This usually takes only a moment. If it does not load, please refresh the page.
                    </p>
                  </div>
                ) : !useSavedPayment ? (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Information</h2>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      isLoading={isProcessing}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4 sm:p-6 sticky top-4 sm:top-8">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6">Order Summary</h2>
              
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

              <div className="mb-6">
                <PromoCodeInput
                  onApply={applyPromoCode}
                  onRemove={removePromoCode}
                  currentPromo={promoCode}
                  discountAmount={discount}
                />
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo savings</span>
                    <span>- ${discount.toFixed(2)}</span>
                  </div>
                )}
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