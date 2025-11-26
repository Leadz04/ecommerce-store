'use client';

import { Facebook, Twitter, Linkedin, Mail, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface SocialShareButtonsProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  productDescription?: string;
}

export default function SocialShareButtons({
  productName,
  productUrl,
  productImage,
  productDescription
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = productDescription 
    ? `${productName} - ${productDescription.substring(0, 100)}...`
    : `Check out ${productName}`;

  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${productUrl}`
    : productUrl;

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (err) {
          toast.error('Failed to copy link');
          return;
        }
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: productName,
              text: shareText,
              url: fullUrl,
            });
            return;
          } catch (err) {
            // User cancelled or error occurred
            if ((err as Error).name !== 'AbortError') {
              console.error('Error sharing:', err);
            }
            return;
          }
        } else {
          // Fallback to copy if native share is not available
          handleShare('copy');
          return;
        }
      default:
        return;
    }

    // Open share URL in a new window
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700 mr-1">Share:</span>
      
      {/* Native Share Button (Mobile) */}
      {typeof window !== 'undefined' && navigator.share && (
        <button
          onClick={() => handleShare('native')}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          aria-label="Share"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}

      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className="p-2 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>

      {/* Twitter */}
      <button
        onClick={() => handleShare('twitter')}
        className="p-2 rounded-lg bg-[#1DA1F2] text-white hover:bg-[#1A91DA] transition-colors"
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </button>

      {/* LinkedIn */}
      <button
        onClick={() => handleShare('linkedin')}
        className="p-2 rounded-lg bg-[#0077B5] text-white hover:bg-[#006399] transition-colors"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>

      {/* Email */}
      <button
        onClick={() => handleShare('email')}
        className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
        aria-label="Share via Email"
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </button>

      {/* Copy Link */}
      <button
        onClick={() => handleShare('copy')}
        className={`p-2 rounded-lg transition-colors ${
          copied
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

