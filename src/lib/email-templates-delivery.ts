/**
 * Delivery confirmation email template
 */

export interface DeliveryConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  siteUrl?: string;
}

/**
 * Generate delivery confirmation email HTML
 */
export function generateDeliveryConfirmationEmailHTML(data: DeliveryConfirmationEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const itemsHTML = data.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />` : ''}
          <div>
            <p style="margin: 0; font-weight: 600; color: #111827;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Quantity: ${item.quantity}</p>
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
      <title>Your Order Has Been Delivered</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Your Order Has Been Delivered!</h1>
                  <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Order #${data.orderNumber}</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi ${data.customerName},
                  </p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Great news! Your order has been successfully delivered. We hope you love your purchase!
                  </p>
                  
                  <!-- Delivery Details -->
                  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; font-size: 18px; margin: 0 0 15px 0;">Delivery Details</h3>
                    <p style="color: #047857; margin: 5px 0;"><strong>Delivered to:</strong></p>
                    <p style="color: #065f46; line-height: 1.6; margin: 5px 0;">
                      ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                      ${data.shippingAddress.address1}<br>
                      ${data.shippingAddress.address2 ? `${data.shippingAddress.address2}<br>` : ''}
                      ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                      ${data.shippingAddress.country}
                    </p>
                    ${data.trackingNumber ? `
                      <p style="color: #047857; margin: 15px 0 5px 0;"><strong>Tracking Number:</strong></p>
                      <p style="color: #065f46; font-family: monospace; font-size: 14px; margin: 5px 0;">${data.trackingNumber}</p>
                    ` : ''}
                  </div>
                  
                  <!-- Order Items -->
                  <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Delivered Items</h3>
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
                    </table>
                  </div>
                  
                  <!-- Next Steps -->
                  <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                    <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; line-height: 1.8;">
                      <li>Check your items to ensure everything arrived in perfect condition</li>
                      <li>Leave a review to help other customers</li>
                      <li>Contact us if you have any questions or concerns</li>
                    </ul>
                  </div>
                  
                  <!-- CTA Buttons -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${siteUrl}/orders" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); margin-right: 10px;">
                      View Order Details
                    </a>
                    <a href="${siteUrl}/products" 
                       style="display: inline-block; background: #ffffff; color: #10b981; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; border: 2px solid #10b981; margin-left: 10px;">
                      Shop Again
                    </a>
                  </div>
                  
                  <!-- Footer Note -->
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                    If you have any questions about your delivery, please don't hesitate to contact our support team.
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

