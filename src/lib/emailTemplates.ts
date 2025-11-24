import { Product } from '@/types';

// Conversion-focused email templates for visitor-to-customer campaigns

export interface ConversionEmailData {
  email: string;
  firstName?: string;
  discountCode?: string;
  discountPercent?: number;
  products?: Product[];
  siteUrl?: string;
  unsubscribeUrl?: string;
  trackingId?: string; // EmailTracking ID for tracking opens/clicks
  emailType?: 'welcome' | 'return' | 'urgent';
}

/**
 * Welcome/First Visit Email - High conversion focus
 */
export function generateWelcomeConversionEmail(data: ConversionEmailData): string {
  const firstName = data.firstName || 'there';
  const discount = data.discountPercent || 15;
  const code = data.discountCode || 'WELCOME15';
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to ShopEase! 🎉</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Premium Leather Goods & Accessories</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}!</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed you visited ShopEase! We're thrilled to have you here. 🛍️
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                As a special welcome gift, here's <strong style="color: #667eea;">${discount}% OFF</strong> your first order!
              </p>
              
              <!-- Discount Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Discount Code</p>
                    <p style="color: #667eea; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 3px;">${code}</p>
                    <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">Expires in 7 days</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${siteUrl}/products?discount=${code}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center;">Shop Now & Save ${discount}%</a>
                  </td>
                </tr>
              </table>
              
              <!-- Urgency Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; padding: 15px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">⏰ Limited Time Offer</p>
                    <p style="color: #856404; font-size: 13px; margin: 5px 0 0 0;">This discount code expires in 7 days. Don't miss out!</p>
                  </td>
                </tr>
              </table>
              
              <!-- Product Recommendations -->
              ${data.products && data.products.length > 0 ? `
              <h3 style="color: #333333; margin: 40px 0 20px 0; font-size: 20px;">Popular Products You Might Like</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${data.products.slice(0, 3).map(product => `
                <tr>
                  <td style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="100" style="padding-right: 15px;">
                          <img src="${product.image}" alt="${product.name}" width="100" height="100" style="border-radius: 4px; display: block;">
                        </td>
                        <td valign="top">
                          <h4 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">${product.name}</h4>
                          <p style="color: #667eea; font-size: 18px; font-weight: bold; margin: 5px 0;">$${product.price.toFixed(2)}</p>
                          <a href="${siteUrl}/products/${product.id || product._id}" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: bold;">View Product →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              
              <!-- Trust Signals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 20px 0;">
                <tr>
                  <td width="33%" align="center" style="padding: 10px;">
                    <p style="color: #333333; font-size: 14px; margin: 0; font-weight: bold;">🚚 Free Shipping</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 10px;">
                    <p style="color: #333333; font-size: 14px; margin: 0; font-weight: bold;">🔒 Secure Payment</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 10px;">
                    <p style="color: #333333; font-size: 14px; margin: 0; font-weight: bold;">↩️ Easy Returns</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">30-day policy</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: #667eea;">contact page</a>
              </p>
              ${data.unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${data.unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Return Visitor Email - Re-engagement with stronger offer
 */
export function generateReturnVisitorEmail(data: ConversionEmailData): string {
  const firstName = data.firstName || 'there';
  const discount = data.discountPercent || 20;
  const code = data.discountCode || 'RETURN20';
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">We Missed You! 💝</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}!</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed you visited ShopEase again! We're so glad you came back. 🎉
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Since you're a returning visitor, we want to make it worth your while. Here's an exclusive <strong style="color: #f5576c;">${discount}% OFF</strong> just for you!
              </p>
              
              <!-- Discount Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f7; border: 2px solid #f5576c; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Code</p>
                    <p style="color: #f5576c; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 3px;">${code}</p>
                    <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">Valid for 5 days only</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${siteUrl}/products?discount=${code}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center;">Claim Your ${discount}% Discount</a>
                  </td>
                </tr>
              </table>
              
              <!-- Urgency Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee; border-left: 4px solid #f5576c; border-radius: 4px; padding: 15px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="color: #c53030; font-size: 14px; margin: 0; font-weight: bold;">🔥 Limited Time - Act Fast!</p>
                    <p style="color: #c53030; font-size: 13px; margin: 5px 0 0 0;">This offer expires in 5 days. Don't let it slip away!</p>
                  </td>
                </tr>
              </table>
              
              ${data.products && data.products.length > 0 ? `
              <h3 style="color: #333333; margin: 40px 0 20px 0; font-size: 20px;">Trending Now</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${data.products.slice(0, 3).map(product => `
                <tr>
                  <td style="padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="100" style="padding-right: 15px;">
                          <img src="${product.image}" alt="${product.name}" width="100" height="100" style="border-radius: 4px; display: block;">
                        </td>
                        <td valign="top">
                          <h4 style="color: #333333; margin: 0 0 5px 0; font-size: 16px;">${product.name}</h4>
                          <p style="color: #f5576c; font-size: 18px; font-weight: bold; margin: 5px 0;">
                            $${product.price.toFixed(2)}
                            ${product.originalPrice && product.originalPrice > product.price ?
      `<span style="color: #999; text-decoration: line-through; font-size: 14px; margin-left: 10px;">$${product.originalPrice.toFixed(2)}</span>` : ''}
                          </p>
                          <a href="${siteUrl}/products/${product.id || product._id}" style="color: #f5576c; text-decoration: none; font-size: 14px; font-weight: bold;">Shop Now →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Need help? <a href="${siteUrl}/contact" style="color: #f5576c;">Contact us</a>
              </p>
              ${data.unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${data.unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Urgent Conversion Email - For visitors who haven't converted
 */
export function generateUrgentConversionEmail(data: ConversionEmailData): string {
  const firstName = data.firstName || 'there';
  const discount = data.discountPercent || 25;
  const code = data.discountCode || 'URGENT25';
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid #dc2626;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">⚡ Last Chance Offer!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Don't Miss Out on This Exclusive Deal</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}!</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We've noticed you've visited ShopEase multiple times but haven't made a purchase yet. We don't want you to miss out!
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                As a final gesture, we're offering you our <strong style="color: #dc2626;">BEST DISCOUNT: ${discount}% OFF</strong> your entire order. This is our highest discount - use it before it's gone!
              </p>
              
              <!-- Discount Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 3px solid #dc2626; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Your Exclusive Code</p>
                    <p style="color: #dc2626; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 4px;">${code}</p>
                    <p style="color: #dc2626; font-size: 13px; margin: 10px 0 0 0; font-weight: bold;">⏰ Expires in 48 hours!</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${siteUrl}/products?discount=${code}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 20px; font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">Claim ${discount}% OFF Now</a>
                  </td>
                </tr>
              </table>
              
              <!-- Urgency Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 15px; margin: 30px 0;">
                <tr>
                  <td>
                    <p style="color: #991b1b; font-size: 15px; margin: 0; font-weight: bold;">🚨 FINAL CHANCE - 48 HOURS ONLY</p>
                    <p style="color: #991b1b; font-size: 13px; margin: 5px 0 0 0;">This is our best offer. After 48 hours, this code will expire forever.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Social Proof -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <p style="color: #166534; font-size: 16px; margin: 0; font-weight: bold;">⭐ Join 10,000+ Happy Customers</p>
                    <p style="color: #166534; font-size: 14px; margin: 5px 0 0 0;">Free shipping • 30-day returns • Secure checkout</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Questions? <a href="${siteUrl}/contact" style="color: #dc2626;">We're here to help</a>
              </p>
              ${data.unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${data.unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Product Promotional Email Template
 */
export interface ProductPromoEmailData {
  productName: string;
  productDescription?: string;
  productPrice: number;
  productOriginalPrice?: number;
  productImage: string;
  productUrl: string;
  discountCode?: string;
  discountPercent?: number;
  customMessage?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
  template?: 'purple' | 'emerald' | 'minimal' | 'vibrant' | 'elegant';
}

export type EmailTemplate = 'purple' | 'emerald' | 'minimal' | 'vibrant' | 'elegant';

// Template color schemes
const templateColors = {
  purple: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#8b5cf6',
    text: '#333333',
    lightBg: '#f5f3ff',
    border: '#c4b5fd'
  },
  emerald: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    text: '#333333',
    lightBg: '#ecfdf5',
    border: '#6ee7b7'
  },
  minimal: {
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#4b5563',
    text: '#111827',
    lightBg: '#f9fafb',
    border: '#e5e7eb'
  },
  vibrant: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    text: '#333333',
    lightBg: '#fffbeb',
    border: '#fcd34d'
  },
  elegant: {
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#818cf8',
    text: '#1e293b',
    lightBg: '#eef2ff',
    border: '#a5b4fc'
  }
};

export function generateProductPromoEmail(data: ProductPromoEmailData): string {
  const template = data.template || 'purple';
  return generateProductPromoEmailWithTemplate(data, template);
}

function generateProductPromoEmailWithTemplate(data: ProductPromoEmailData, template: EmailTemplate): string {
  const {
    productName,
    productDescription,
    productPrice,
    productOriginalPrice,
    productImage,
    productUrl,
    discountCode,
    discountPercent,
    customMessage,
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    unsubscribeUrl
  } = data;

  const hasDiscount = discountCode && discountPercent;
  const savings = productOriginalPrice && productOriginalPrice > productPrice
    ? (productOriginalPrice - productPrice).toFixed(2)
    : null;

  const colors = templateColors[template];

  // Template-specific variations
  switch (template) {
    case 'purple':
      return generatePurpleTemplate(data, colors, hasDiscount, savings);
    case 'emerald':
      return generateEmeraldTemplate(data, colors, hasDiscount, savings);
    case 'minimal':
      return generateMinimalTemplate(data, colors, hasDiscount, savings);
    case 'vibrant':
      return generateVibrantTemplate(data, colors, hasDiscount, savings);
    case 'elegant':
      return generateElegantTemplate(data, colors, hasDiscount, savings);
    default:
      return generatePurpleTemplate(data, colors, hasDiscount, savings);
  }
}

function generatePurpleTemplate(
  data: ProductPromoEmailData,
  colors: typeof templateColors.purple,
  hasDiscount: boolean,
  savings: string | null
): string {
  const { productName, productDescription, productPrice, productOriginalPrice, productImage, productUrl, discountCode, discountPercent, customMessage, siteUrl, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Special Offer! 🎉</h1>
              ${hasDiscount ? `<p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${discountPercent}% OFF</p>` : ''}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${customMessage ? `
              <div style="background-color: ${colors.lightBg}; border-left: 4px solid ${colors.primary}; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0;">${customMessage}</p>
              </div>
              ` : ''}
              
              <h2 style="color: ${colors.text}; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">${productName}</h2>
              
              <!-- Product Image -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                  </td>
                </tr>
              </table>
              
              ${productDescription ? `
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">${productDescription}</p>
              ` : ''}
              
              <!-- Price Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center; border: 1px solid ${colors.border};">
                <tr>
                  <td>
                    ${productOriginalPrice && productOriginalPrice > productPrice ? `
                    <p style="color: #999999; font-size: 18px; margin: 0 0 5px 0; text-decoration: line-through;">$${productOriginalPrice.toFixed(2)}</p>
                    ` : ''}
                    <p style="color: ${colors.primary}; font-size: 36px; font-weight: bold; margin: 0;">$${productPrice.toFixed(2)}</p>
                    ${savings ? `
                    <p style="color: #10b981; font-size: 14px; margin: 10px 0 0 0; font-weight: bold;">Save $${savings}!</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              ${hasDiscount ? `
              <!-- Discount Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; border: 2px dashed ${colors.primary}; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Use Discount Code</p>
                    <p style="color: ${colors.primary}; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 4px;">${discountCode}</p>
                    <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">Apply at checkout</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 25px 0;">
                    <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 10px; font-size: 18px; font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">Shop Now</a>
                  </td>
                </tr>
              </table>
              
              <!-- Trust Signals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 20px 0;">
                <tr>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: bold;">🚚 Free Shipping</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: bold;">🔒 Secure Payment</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: bold;">↩️ Easy Returns</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">30-day policy</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: ${colors.primary}; text-decoration: none; font-weight: 600;">contact page</a>
              </p>
              ${unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateEmeraldTemplate(
  data: ProductPromoEmailData,
  colors: typeof templateColors.emerald,
  hasDiscount: boolean,
  savings: string | null
): string {
  const { productName, productDescription, productPrice, productOriginalPrice, productImage, productUrl, discountCode, discountPercent, customMessage, siteUrl, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 35px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: bold; letter-spacing: -0.5px;">Special Offer! 🎉</h1>
              ${hasDiscount ? `<p style="color: #ffffff; margin: 12px 0 0 0; font-size: 20px; font-weight: bold;">${discountPercent}% OFF</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 45px 35px;">
              ${customMessage ? `
              <div style="background-color: ${colors.lightBg}; border-left: 5px solid ${colors.primary}; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
                <p style="color: ${colors.text}; font-size: 16px; line-height: 1.7; margin: 0;">${customMessage}</p>
              </div>
              ` : ''}
              <h2 style="color: ${colors.text}; margin: 0 0 25px 0; font-size: 26px; font-weight: bold; line-height: 1.3;">${productName}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 6px 12px rgba(0,0,0,0.15);" />
                  </td>
                </tr>
              </table>
              ${productDescription ? `
              <p style="color: #555555; font-size: 16px; line-height: 1.7; margin: 0 0 35px 0;">${productDescription}</p>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 100%); border-radius: 12px; padding: 28px; margin: 30px 0; text-align: center; border: 2px solid ${colors.border};">
                <tr>
                  <td>
                    ${productOriginalPrice && productOriginalPrice > productPrice ? `
                    <p style="color: #999999; font-size: 20px; margin: 0 0 8px 0; text-decoration: line-through;">$${productOriginalPrice.toFixed(2)}</p>
                    ` : ''}
                    <p style="color: ${colors.primary}; font-size: 42px; font-weight: bold; margin: 0;">$${productPrice.toFixed(2)}</p>
                    ${savings ? `
                    <p style="color: ${colors.secondary}; font-size: 15px; margin: 12px 0 0 0; font-weight: bold;">Save $${savings}!</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ${hasDiscount ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; border: 3px dashed ${colors.primary}; border-radius: 12px; padding: 28px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: ${colors.secondary}; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Use Discount Code</p>
                    <p style="color: ${colors.primary}; font-size: 40px; font-weight: bold; margin: 0; letter-spacing: 5px;">${discountCode}</p>
                    <p style="color: #777777; font-size: 13px; margin: 12px 0 0 0;">Apply at checkout</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 28px 0;">
                    <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: #ffffff; text-decoration: none; padding: 20px 50px; border-radius: 10px; font-size: 19px; font-weight: bold; text-align: center; box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);">Shop Now</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 45px 0 25px 0; border-top: 2px dashed ${colors.border}; padding-top: 30px;">
                <tr>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 16px; margin: 0; font-weight: bold;">🚚 Free Shipping</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 16px; margin: 0; font-weight: bold;">🔒 Secure Payment</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 16px; margin: 0; font-weight: bold;">↩️ Easy Returns</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">30-day policy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: ${colors.primary}; text-decoration: none; font-weight: 600;">contact page</a>
              </p>
              ${unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateMinimalTemplate(
  data: ProductPromoEmailData,
  colors: typeof templateColors.minimal,
  hasDiscount: boolean,
  savings: string | null
): string {
  const { productName, productDescription, productPrice, productOriginalPrice, productImage, productUrl, discountCode, discountPercent, customMessage, siteUrl, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 30px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0;">
          <tr>
            <td style="background-color: ${colors.primary}; padding: 25px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.3px;">Special Offer</h1>
              ${hasDiscount ? `<p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">${discountPercent}% OFF</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px;">
              ${customMessage ? `
              <div style="background-color: ${colors.lightBg}; border-left: 3px solid ${colors.primary}; padding: 18px; margin-bottom: 35px;">
                <p style="color: ${colors.text}; font-size: 15px; line-height: 1.6; margin: 0;">${customMessage}</p>
              </div>
              ` : ''}
              <h2 style="color: ${colors.text}; margin: 0 0 25px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">${productName}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
              </table>
              ${productDescription ? `
              <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 35px 0;">${productDescription}</p>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; padding: 25px; margin: 35px 0; text-align: center; border: 1px solid ${colors.border};">
                <tr>
                  <td>
                    ${productOriginalPrice && productOriginalPrice > productPrice ? `
                    <p style="color: #9ca3af; font-size: 18px; margin: 0 0 6px 0; text-decoration: line-through;">$${productOriginalPrice.toFixed(2)}</p>
                    ` : ''}
                    <p style="color: ${colors.primary}; font-size: 38px; font-weight: 700; margin: 0;">$${productPrice.toFixed(2)}</p>
                    ${savings ? `
                    <p style="color: #6b7280; font-size: 13px; margin: 10px 0 0 0; font-weight: 500;">Save $${savings}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ${hasDiscount ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; border: 1px solid ${colors.border}; padding: 25px; margin: 35px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Use Discount Code</p>
                    <p style="color: ${colors.primary}; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 4px;">${discountCode}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">Apply at checkout</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${productUrl}" style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 16px 42px; font-size: 16px; font-weight: 600; text-align: center; letter-spacing: 0.3px;">Shop Now</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 45px 0 25px 0; border-top: 1px solid ${colors.border}; padding-top: 30px;">
                <tr>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 14px; margin: 0; font-weight: 600;">🚚 Free Shipping</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 14px; margin: 0; font-weight: 600;">🔒 Secure Payment</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 14px; margin: 0; font-weight: 600;">↩️ Easy Returns</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">30-day policy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: ${colors.primary}; text-decoration: none; font-weight: 500;">contact page</a>
              </p>
              ${unsubscribeUrl ? `
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #9ca3af; font-size: 11px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateVibrantTemplate(
  data: ProductPromoEmailData,
  colors: typeof templateColors.vibrant,
  hasDiscount: boolean,
  savings: string | null
): string {
  const { productName, productDescription, productPrice, productOriginalPrice, productImage, productUrl, discountCode, discountPercent, customMessage, siteUrl, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fff7ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 16px rgba(0,0,0,0.1); border: 3px solid ${colors.border};">
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 35px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🔥 Special Offer! 🎉</h1>
              ${hasDiscount ? `<p style="color: #ffffff; margin: 15px 0 0 0; font-size: 22px; font-weight: bold;">${discountPercent}% OFF</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 45px 35px;">
              ${customMessage ? `
              <div style="background: linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 100%); border: 2px solid ${colors.border}; padding: 20px; margin-bottom: 30px; border-radius: 10px;">
                <p style="color: ${colors.text}; font-size: 16px; line-height: 1.7; margin: 0; font-weight: 500;">${customMessage}</p>
              </div>
              ` : ''}
              <h2 style="color: ${colors.text}; margin: 0 0 25px 0; font-size: 28px; font-weight: bold;">${productName}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 16px; display: block; margin: 0 auto; box-shadow: 0 8px 16px rgba(0,0,0,0.2); border: 3px solid ${colors.border};" />
                  </td>
                </tr>
              </table>
              ${productDescription ? `
              <p style="color: #555555; font-size: 16px; line-height: 1.7; margin: 0 0 35px 0;">${productDescription}</p>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 100%); border-radius: 14px; padding: 30px; margin: 30px 0; text-align: center; border: 3px solid ${colors.border};">
                <tr>
                  <td>
                    ${productOriginalPrice && productOriginalPrice > productPrice ? `
                    <p style="color: #999999; font-size: 22px; margin: 0 0 8px 0; text-decoration: line-through;">$${productOriginalPrice.toFixed(2)}</p>
                    ` : ''}
                    <p style="color: ${colors.primary}; font-size: 46px; font-weight: bold; margin: 0;">$${productPrice.toFixed(2)}</p>
                    ${savings ? `
                    <p style="color: ${colors.secondary}; font-size: 16px; margin: 12px 0 0 0; font-weight: bold;">💰 Save $${savings}!</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ${hasDiscount ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 100%); border: 4px dashed ${colors.primary}; border-radius: 14px; padding: 30px; margin: 30px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: ${colors.secondary}; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Use Discount Code</p>
                    <p style="color: ${colors.primary}; font-size: 44px; font-weight: bold; margin: 0; letter-spacing: 6px;">${discountCode}</p>
                    <p style="color: #777777; font-size: 13px; margin: 12px 0 0 0; font-weight: 500;">Apply at checkout</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: #ffffff; text-decoration: none; padding: 22px 55px; border-radius: 12px; font-size: 20px; font-weight: bold; text-align: center; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 1px;">Shop Now</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 45px 0 25px 0; border-top: 3px dashed ${colors.border}; padding-top: 35px;">
                <tr>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 17px; margin: 0; font-weight: bold;">🚚 Free Shipping</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 17px; margin: 0; font-weight: bold;">🔒 Secure Payment</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 15px;">
                    <p style="color: ${colors.text}; font-size: 17px; margin: 0; font-weight: bold;">↩️ Easy Returns</p>
                    <p style="color: #666666; font-size: 13px; margin: 6px 0 0 0;">30-day policy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fff7ed; padding: 30px; text-align: center; border-top: 3px solid ${colors.border};">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: ${colors.primary}; text-decoration: none; font-weight: 700;">contact page</a>
              </p>
              ${unsubscribeUrl ? `
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateElegantTemplate(
  data: ProductPromoEmailData,
  colors: typeof templateColors.elegant,
  hasDiscount: boolean,
  savings: string | null
): string {
  const { productName, productDescription, productPrice, productOriginalPrice, productImage, productUrl, discountCode, discountPercent, customMessage, siteUrl, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 25px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Special Offer</h1>
              ${hasDiscount ? `<p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; font-weight: 400; letter-spacing: 1px;">${discountPercent}% OFF</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 45px;">
              ${customMessage ? `
              <div style="background-color: ${colors.lightBg}; border-left: 4px solid ${colors.primary}; padding: 22px; margin-bottom: 35px;">
                <p style="color: ${colors.text}; font-size: 16px; line-height: 1.8; margin: 0; font-style: italic;">${customMessage}</p>
              </div>
              ` : ''}
              <h2 style="color: ${colors.text}; margin: 0 0 30px 0; font-size: 26px; font-weight: 400; line-height: 1.4; letter-spacing: 0.5px;">${productName}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 auto; border: 1px solid #e2e8f0;" />
                  </td>
                </tr>
              </table>
              ${productDescription ? `
              <p style="color: #475569; font-size: 15px; line-height: 1.8; margin: 0 0 38px 0; font-style: normal;">${productDescription}</p>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; padding: 28px; margin: 35px 0; text-align: center; border: 1px solid ${colors.border};">
                <tr>
                  <td>
                    ${productOriginalPrice && productOriginalPrice > productPrice ? `
                    <p style="color: #94a3b8; font-size: 19px; margin: 0 0 8px 0; text-decoration: line-through; font-weight: 300;">$${productOriginalPrice.toFixed(2)}</p>
                    ` : ''}
                    <p style="color: ${colors.primary}; font-size: 40px; font-weight: 300; margin: 0; letter-spacing: 1px;">$${productPrice.toFixed(2)}</p>
                    ${savings ? `
                    <p style="color: ${colors.secondary}; font-size: 14px; margin: 12px 0 0 0; font-weight: 400;">Save $${savings}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ${hasDiscount ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.lightBg}; border: 2px dashed ${colors.primary}; padding: 28px; margin: 35px 0; text-align: center;">
                <tr>
                  <td>
                    <p style="color: ${colors.secondary}; font-size: 12px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 400;">Use Discount Code</p>
                    <p style="color: ${colors.primary}; font-size: 38px; font-weight: 300; margin: 0; letter-spacing: 5px;">${discountCode}</p>
                    <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0; font-weight: 300;">Apply at checkout</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${productUrl}" style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; padding: 18px 48px; font-size: 16px; font-weight: 400; text-align: center; letter-spacing: 1px; text-transform: uppercase;">Shop Now</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 45px 0 25px 0; border-top: 1px solid ${colors.border}; padding-top: 32px;">
                <tr>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: 400;">🚚 Free Shipping</p>
                    <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; font-weight: 300;">On orders $50+</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: 400;">🔒 Secure Payment</p>
                    <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; font-weight: 300;">100% secure</p>
                  </td>
                  <td width="33%" align="center" style="padding: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: 400;">↩️ Easy Returns</p>
                    <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; font-weight: 300;">30-day policy</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 32px 45px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 12px 0; font-weight: 300;">
                Questions? Reply to this email or visit our <a href="${siteUrl}/contact" style="color: ${colors.primary}; text-decoration: none; font-weight: 400;">contact page</a>
              </p>
              ${unsubscribeUrl ? `
              <p style="color: #94a3b8; font-size: 11px; margin: 12px 0 0 0; font-weight: 300;">
                <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : ''}
              <p style="color: #94a3b8; font-size: 11px; margin: 22px 0 0 0; font-weight: 300;">
                © ${new Date().getFullYear()} ShopEase. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate secure discount code using cryptographic randomness
 * @param type - Type of discount (welcome, return, urgent) - used for tracking only
 * @returns Secure random token (32 characters hex)
 */
export function generateDiscountCode(type: 'welcome' | 'return' | 'urgent' = 'welcome'): string {
  // Use crypto for secure random token generation
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(16);
  const token = randomBytes.toString('hex'); // 32 character hex string

  return token;
}

