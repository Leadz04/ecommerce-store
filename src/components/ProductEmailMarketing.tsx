'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Eye, X, Loader2, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
}

interface ProductEmailMarketingProps {
  product: Product | null;
  onClose?: () => void;
}

type EmailTemplate = 'purple' | 'emerald' | 'minimal' | 'vibrant' | 'elegant';

const templateOptions: { value: EmailTemplate; label: string; description: string; color: string }[] = [
  { value: 'purple', label: 'Purple', description: 'Classic purple gradient', color: '#667eea' },
  { value: 'emerald', label: 'Emerald', description: 'Fresh green theme', color: '#10b981' },
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple', color: '#1f2937' },
  { value: 'vibrant', label: 'Vibrant', description: 'Bold and energetic', color: '#f59e0b' },
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated design', color: '#6366f1' },
];

export default function ProductEmailMarketing({ product, onClose }: ProductEmailMarketingProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('purple');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{
    sent: string[];
    failed: { email: string; error: string }[];
    total: number;
  } | null>(null);

  // Load preview when product or settings change
  useEffect(() => {
    if (product && previewMode) {
      loadPreview();
    }
  }, [product, discountCode, discountPercent, customMessage, previewMode, selectedTemplate]);

  const loadPreview = async () => {
    if (!product) return;

    try {
      const params = new URLSearchParams();
      if (discountCode) params.append('discountCode', discountCode);
      if (discountPercent) params.append('discountPercent', discountPercent.toString());
      if (customMessage) params.append('customMessage', customMessage);
      params.append('template', selectedTemplate);

      const response = await fetch(`/api/products/${product._id}/send-promo-email?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPreviewHtml(data.preview.html);
        setPreviewSubject(data.preview.subject);
      } else {
        toast.error(data.error || 'Failed to load preview');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load email preview');
    }
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSend = async () => {
    if (!product) {
      toast.error('No product selected');
      return;
    }

    // Validate emails
    const validEmails = emails
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (validEmails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    setSending(true);
    setSendResults(null);

    try {
      const response = await fetch(`/api/products/${product._id}/send-promo-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: validEmails,
          discountCode: discountCode || undefined,
          discountPercent: discountPercent || undefined,
          customMessage: customMessage || undefined,
          subject: customSubject || undefined,
          template: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSendResults(data.results);
        toast.success(`Sent ${data.results.sent.length} of ${data.results.total} emails successfully`);
        
        // Reset form if all emails sent successfully
        if (data.results.failed.length === 0) {
          setEmails(['']);
          setDiscountCode('');
          setDiscountPercent('');
          setCustomMessage('');
          setCustomSubject('');
        }
      } else {
        toast.error(data.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  if (!product) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-gray-600">
        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Please select a product to send promotional emails</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Mail className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Send Promotional Email</h3>
            <p className="text-sm text-gray-600">{product.name}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
        <img
          src={product.image || '/placeholder-product.png'}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-xl"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600 mt-1">
            ${product.price.toFixed(2)}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="ml-2 text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Email Addresses */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Email Addresses *
        </label>
        <div className="space-y-2">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="customer@example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700"
              />
              {emails.length > 1 && (
                <button
                  onClick={() => handleRemoveEmail(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleAddEmail}
          className="mt-2 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add another email
        </button>
      </div>

      {/* Email Template Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Email Template
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {templateOptions.map((template) => (
            <button
              key={template.value}
              onClick={() => {
                setSelectedTemplate(template.value);
                if (previewMode) {
                  setTimeout(() => loadPreview(), 100);
                }
              }}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedTemplate === template.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className="w-full h-3 rounded mb-2"
                style={{ backgroundColor: template.color }}
              />
              <p className={`text-xs font-semibold mb-1 ${
                selectedTemplate === template.value ? 'text-emerald-700' : 'text-gray-700'
              }`}>
                {template.label}
              </p>
              <p className="text-xs text-gray-500">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Discount Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Discount Code (optional)
          </label>
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="SAVE20"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Discount % (optional)
          </label>
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="20"
            min="0"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700"
          />
        </div>
      </div>

      {/* Custom Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Custom Message (optional)
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Add a personalized message to your customers..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-gray-700"
        />
      </div>

      {/* Custom Subject */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Custom Subject Line (optional)
        </label>
        <input
          type="text"
          value={customSubject}
          onChange={(e) => setCustomSubject(e.target.value)}
          placeholder="Leave empty to use default subject"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700"
        />
      </div>

      {/* Preview & Send Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setPreviewMode(!previewMode);
            if (!previewMode) {
              loadPreview();
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <Eye className="h-4 w-4" />
          {previewMode ? 'Hide Preview' : 'Preview Email'}
        </button>
        <button
          onClick={handleSend}
          disabled={sending || emails.filter(e => e.trim()).length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Emails
            </>
          )}
        </button>
      </div>

      {/* Email Preview */}
      {previewMode && previewHtml && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Subject: {previewSubject}</p>
          </div>
          <div className="p-4 bg-white max-h-96 overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Send Results */}
      {sendResults && (
        <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Send Results</h4>
          
          {sendResults.sent.length > 0 && (
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Sent successfully ({sendResults.sent.length})
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                {sendResults.sent.map((email, idx) => (
                  <div key={idx}>{email}</div>
                ))}
              </div>
            </div>
          )}

          {sendResults.failed.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed ({sendResults.failed.length})
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                {sendResults.failed.map((item, idx) => (
                  <div key={idx}>
                    {item.email}: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

