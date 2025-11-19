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
 * Generate discount code
 */
export function generateDiscountCode(type: 'welcome' | 'return' | 'urgent' = 'welcome'): string {
  const codes = {
    welcome: 'WELCOME15',
    return: 'RETURN20',
    urgent: 'URGENT25'
  };
  
  const base = codes[type];
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${base}${random}`;
}

