'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Debug: Check if Stripe key is loaded
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
}

interface StripePaymentFormProps {
  clientSecret: string;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  isLoading?: boolean;
}

function PaymentForm({ clientSecret, onPaymentSuccess, onPaymentError, isLoading }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        onPaymentError(error.message || 'Payment failed');
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
        toast.success('Payment successful!');
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setPaymentError(errorMessage);
      onPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Payment Information</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Card Details
            </label>
            <div className="p-4 border-2 border-slate-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {paymentError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{paymentError}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Complete Payment</span>
          </div>
        )}
      </button>
    </form>
  );
}

export default function StripePaymentForm({ clientSecret, onPaymentSuccess, onPaymentError, isLoading }: StripePaymentFormProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Stripe configuration error. Please check your environment variables.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600">Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        isLoading={isLoading}
      />
    </Elements>
  );
}
