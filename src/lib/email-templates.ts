/**
 * Email template generators for various email types
 */

export interface CartAbandonmentEmailData {
  userName: string;
  userEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image: string;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  total: number;
  cartUrl: string;
  siteUrl?: string;
}

/**
 * Generate cart abandonment recovery email HTML
 */
export function generateCartAbandonmentEmailHTML(data: CartAbandonmentEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const itemsHTML = data.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${item.image}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
          <div>
            <p style="margin: 0; font-weight: 600; color: #111827;">${item.productName}</p>
            ${item.size || item.color ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${[item.size, item.color].filter(Boolean).join(', ')}</p>` : ''}
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
        </div>
      </td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: #111827;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Purchase</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🛒 You Left Items in Your Cart!</h1>
                  <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Complete your purchase and get your items delivered</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi ${data.userName},
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We noticed you left some items in your cart. Don't miss out on these great products! Complete your purchase now and get your items delivered to your door.
                  </p>
                  
                  <!-- Cart Items -->
                  <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Your Cart Items</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background: #f3f4f6;">
                          <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; font-size: 14px;">Item</th>
                          <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; font-size: 14px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" style="padding: 12px; border-top: 2px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                              <span style="font-weight: 600; color: #111827;">Subtotal:</span>
                              <span style="font-weight: 600; color: #111827;">$${data.subtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                              <span style="font-weight: 700; font-size: 18px; color: #111827;">Total:</span>
                              <span style="font-weight: 700; font-size: 18px; color: #667eea;">$${data.total.toFixed(2)}</span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${data.cartUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Complete Your Purchase →
                    </a>
                  </div>
                  
                  <!-- Benefits -->
                  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0;">Why complete your purchase?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 1.8;">
                      <li>Fast and secure checkout</li>
                      <li>Free shipping on orders over $100</li>
                      <li>Easy returns and exchanges</li>
                      <li>24/7 customer support</li>
                    </ul>
                  </div>
                  
                  <!-- Footer Note -->
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                    This email was sent because you added items to your cart. If you've already completed your purchase, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #1f2937; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
                    <strong style="color: #ffffff;">ShopEase</strong> - Your Trusted Shopping Partner
                  </p>
                  <p style="color: #6b7280; margin: 0; font-size: 12px;">
                    This is an automated email. Please do not reply to this message.
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

