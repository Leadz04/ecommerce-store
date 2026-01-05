'use client';

import { useState } from 'react';
import { 
  X, 
  Download, 
  User, 
  MapPin, 
  CreditCard, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import SelectField from '@/components/SelectField';

interface OrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteOrder,
  onDownloadInvoice
}: OrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  if (!isOpen || !order) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order._id, newStatus);
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      onDeleteOrder(order._id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              {getStatusIcon(order.status)}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Order #{order.orderNumber}</h2>
                <p className="text-xs sm:text-sm text-blue-100 truncate">Order ID: {order._id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onDownloadInvoice(order._id)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Order Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Status</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="w-full sm:w-auto sm:min-w-[180px]">
                    <SelectField
                      label=""
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'shipped', label: 'Shipped' },
                        { value: 'delivered', label: 'Delivered' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ]}
                      value={order.status}
                      isOpen={statusSelectOpen}
                      onOpenChange={setStatusSelectOpen}
                      onSelect={(value) => {
                        handleStatusUpdate(value);
                        setStatusSelectOpen(false);
                      }}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                {order.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-700 break-words">
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Items</h3>
                <div className="space-y-3 sm:space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.product?.image || item.image || '/placeholder-product.jpg'}
                        alt={item.product?.name || item.name || 'Product'}
                        className="w-full sm:w-16 h-32 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 w-full sm:w-auto min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product?.name || item.name || 'Unknown Product'}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Price: ${(item.price || 0).toFixed(2)} each</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto shrink-0">
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{order.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{order.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base flex items-center break-all">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
                      <span className="min-w-0">{order.user?.email || 'N/A'}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base flex items-center break-words">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
                      <span>{order.shippingAddress?.phone || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Shipping Address
                </h3>
                <div className="text-xs sm:text-sm text-gray-700 break-words">
                  <p className="font-medium">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                  <p>{order.shippingAddress?.address1}</p>
                  {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Billing Address
                </h3>
                <div className="text-xs sm:text-sm text-gray-700 break-words">
                  <p className="font-medium">{order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
                  <p>{order.billingAddress?.address1}</p>
                  {order.billingAddress?.address2 && <p>{order.billingAddress.address2}</p>}
                  <p>{order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}</p>
                  <p>{order.billingAddress?.country}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${order.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">${order.shipping?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${order.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-base sm:text-lg">
                    <span>Total</span>
                    <span>${order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Order Dates */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Order Timeline
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-medium text-left sm:text-right break-words">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium text-left sm:text-right break-words">
                      {new Date(order.updatedAt).toLocaleDateString()} at {new Date(order.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-3 sm:mb-4">Admin Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
