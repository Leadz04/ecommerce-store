import nodemailer from 'nodemailer';

// Get email configuration from environment variables
const getEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER || process.env.EMAIL_FROM || 'testleadz04@gmail.com';
  // Try EMAIL_PASS first, then APP_PASSWORD, then fallback
  const emailPass = process.env.EMAIL_PASS || process.env.APP_PASSWORD || '';
  
  if (!emailPass) {
    console.warn('⚠️  Email password not configured. EMAIL_PASS or APP_PASSWORD environment variable is missing.');
  }
  
  return {
    user: emailUser,
    pass: emailPass
  };
};

// Email configuration - create transporter with current env vars
const createTransporter = () => {
  const config = getEmailConfig();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

// Create transporter instance
const transporter = createTransporter();

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const config = getEmailConfig();
    
    // Verify email configuration
    if (!config.pass) {
      console.error('❌ Email sending failed: Email password (EMAIL_PASS or APP_PASSWORD) is not configured in environment variables.');
      return false;
    }
    
    const mailOptions = {
      from: config.user,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    // Recreate transporter to ensure latest env vars are used
    const currentTransporter = createTransporter();
    await currentTransporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${emailData.to} from ${config.user}`);
    return true;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error?.message || error);
    // Log more details for debugging
    if (error?.code === 'EAUTH') {
      console.error('   Authentication failed. Please check:');
      console.error('   1. EMAIL_USER is correct');
      console.error('   2. EMAIL_PASS or APP_PASSWORD is correct (use Gmail App Password, not regular password)');
      console.error('   3. 2-Step Verification is enabled on Gmail account');
    }
    return false;
  }
}

export function generateContactEmailHTML(data: ContactFormData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        New Contact Form Submission
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Contact Details</h3>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #1e40af; margin-top: 0;">Message</h3>
        <p style="line-height: 1.6; color: #374151;">${data.message.replace(/\n/g, '<br>')}</p>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
        </p>
      </div>
    </div>
  `;
}

export function generateOrderConfirmationHTML(data: OrderEmailData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="color: #111827; font-size: 14px; font-weight: 600; line-height: 1.4;">${item.name}</div>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: top; width: 60px;">
        <div style="color: #374151; font-size: 14px; font-weight: 500;">${item.quantity}</div>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; width: 100px;">
        <div style="color: #111827; font-size: 14px; font-weight: 700;">$${item.price.toFixed(2)}</div>
      </td>
    </tr>
  `).join('');

  const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = data.orderTotal - subtotal;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - #${data.orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 30px 20px;">
            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              
              <!-- Compact Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%); padding: 30px 30px 20px; text-align: center;">
                  <div style="background-color: rgba(255, 255, 255, 0.25); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; display: inline-block; line-height: 60px; font-size: 32px;">
                    ✓
                  </div>
                  <h1 style="margin: 0 0 6px; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                    Order Confirmed!
                  </h1>
                  <p style="margin: 0; color: rgba(255, 255, 255, 0.95); font-size: 14px; font-weight: 500;">
                    Order #${data.orderNumber} • Thank you for your purchase
                  </p>
                </td>
              </tr>

              <!-- Compact Success Message -->
              <tr>
                <td style="padding: 16px 30px;">
                  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 3px solid #10b981; border-radius: 8px; padding: 12px 16px;">
                    <p style="margin: 0; color: #065f46; font-size: 13px; font-weight: 600; line-height: 1.5;">
                      🎉 Your order is being processed. Shipping confirmation with tracking will be sent once dispatched.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Order Items Section -->
              <tr>
                <td style="padding: 20px 30px;">
                  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                    <div style="color: #111827; font-size: 14px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Order Items</div>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                      <thead>
                        <tr>
                          <th style="padding: 6px 0; text-align: left; color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Item</th>
                          <th style="padding: 6px 0; text-align: center; color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; width: 50px;">Qty</th>
                          <th style="padding: 6px 0; text-align: right; color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; width: 80px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Compact Order Details & Shipping -->
              <tr>
                <td style="padding: 0 30px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="width: 50%; padding-right: 10px; vertical-align: top;">
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 14px;">
                          <div style="color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Order Details</div>
                          <div style="color: #111827; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${data.customerName}</div>
                          <div style="color: #6b7280; font-size: 12px;">${data.customerEmail}</div>
                        </div>
                      </td>
                      <td style="width: 50%; padding-left: 10px; vertical-align: top;">
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 14px;">
                          <div style="color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Shipping To</div>
                          <div style="color: #111827; font-size: 12px; font-weight: 600; line-height: 1.4;">
                            ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                            <span style="font-weight: 400; color: #6b7280; font-size: 11px;">${data.shippingAddress.address1}</span><br>
                            <span style="font-weight: 400; color: #6b7280; font-size: 11px;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}</span><br>
                            <span style="font-weight: 400; color: #6b7280; font-size: 11px;">${data.shippingAddress.country}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Total Amount Section -->
              <tr>
                <td style="padding: 0 30px 20px;">
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 18px 20px; text-align: right;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      ${tax > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">Subtotal</td>
                        <td style="padding: 4px 0; text-align: right; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">Tax</td>
                        <td style="padding: 4px 0; text-align: right; color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500;">$${tax.toFixed(2)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0 0; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</td>
                        <td style="padding: 8px 0 0; text-align: right; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">$${data.orderTotal.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Compact Next Steps -->
              <tr>
                <td style="padding: 0 30px 20px;">
                  <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 3px solid #3b82f6; border-radius: 8px; padding: 12px 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: 600; line-height: 1.5;">
                      📦 <strong>Next:</strong> Shipping confirmation with tracking (3-5 business days delivery)
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Compact Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                    Questions? Reply to this email or contact support.
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

export function generateOrderConfirmationText(data: OrderEmailData): string {
  return `
Order Confirmation - #${data.orderNumber}

Thank you for your order!

Order Details:
- Order Number: #${data.orderNumber}
- Customer: ${data.customerName}
- Email: ${data.customerEmail}
- Total Amount: $${data.orderTotal.toFixed(2)}

Order Items:
${data.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Shipping Address:
${data.shippingAddress.firstName} ${data.shippingAddress.lastName}
${data.shippingAddress.address1}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}
${data.shippingAddress.country}

Next Steps: You will receive a shipping confirmation email once your order is dispatched.
  `;
}

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetUrl: string;
}

export function generatePasswordResetHTML(data: PasswordResetEmailData): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header with Gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          🔐 Reset Your Password
        </h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
          ShopEase Account Security
        </p>
      </div>
      
      <!-- Main Content -->
      <div style="padding: 40px 30px; background: #ffffff;">
        <!-- Greeting Card -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #3b82f6;">
          <p style="color: #1e40af; line-height: 1.8; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
            Hello ${data.name}! 👋
          </p>
          <p style="color: #1e3a8a; line-height: 1.8; margin: 0; font-size: 15px;">
            We received a request to reset your password for your ShopEase account. Click the button below to create a new password:
          </p>
        </div>
        
        <!-- Reset Button -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="${data.resetUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
            🔑 Reset Password
          </a>
        </div>
        
        <!-- Alternative Link Section -->
        <div style="background: #f8fafc; padding: 20px; border: 2px dashed #cbd5e1; border-radius: 10px; margin: 30px 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #f59e0b;">
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">
            📋 Alternative Method:
          </p>
          <p style="color: #78350f; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #f59e0b;">
            <p style="color: #3b82f6; font-size: 11px; word-break: break-all; margin: 0; font-family: 'Courier New', monospace;">
              ${data.resetUrl}
            </p>
          </div>
        </div>
        
        <!-- Security Notice -->
        <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; border-left: 5px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
          <div style="display: flex; align-items: start;">
            <div style="font-size: 24px; margin-right: 12px; line-height: 1;">⚠️</div>
            <div>
              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: 700;">
                Security Notice
              </p>
              <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.7;">
                This link will expire in <strong style="color: #dc2626;">1 hour</strong>. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Help Section -->
        <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 10px; border-left: 5px solid #10b981;">
          <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
            <strong style="color: #047857;">💡 Need Help?</strong> If you're having trouble resetting your password, please contact our support team.
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 25px 30px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
          <strong style="color: #ffffff;">ShopEase</strong> - Your Trusted Shopping Partner
        </p>
        <p style="color: #6b7280; margin: 0; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
}

export function generatePasswordResetText(data: PasswordResetEmailData): string {
  return `
Reset Your Password

Hello ${data.name},

We received a request to reset your password for your ShopEase account. Click the link below to reset your password:

${data.resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Thank you,
ShopEase Team
  `;
}

// Admin email constant
export const ADMIN_EMAIL = 'testleadz04@gmail.com';

// Welcome Email Template
export interface WelcomeEmailData {
  name: string;
  email: string;
  siteUrl?: string;
}

export function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
        Welcome to ShopEase! 🎉
      </h2>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0;">Thank you for joining us!</h3>
        <p style="color: #047857; margin: 0;">Your account has been successfully created. We're excited to have you as part of our community!</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Get Started</h3>
        <p style="color: #374151; line-height: 1.6;">
          Start exploring our amazing products and enjoy a seamless shopping experience. Browse our catalog, add items to your cart, and checkout with ease.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${siteUrl}/products" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Shopping</a>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          <strong>Need help?</strong> Visit our <a href="${siteUrl}/contact" style="color: #3b82f6;">contact page</a> or reply to this email.
        </p>
      </div>
    </div>
  `;
}

// Order Status Change Email Template
export interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  previousStatus?: string;
  trackingNumber?: string;
  notes?: string;
  siteUrl?: string;
}

export function generateOrderStatusEmailHTML(data: OrderStatusEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    'processing': { title: 'Order Processing', message: 'Your order is being prepared for shipment.', color: '#3b82f6' },
    'shipped': { title: 'Order Shipped!', message: 'Your order has been shipped and is on its way to you.', color: '#10b981' },
    'delivered': { title: 'Order Delivered', message: 'Your order has been delivered successfully.', color: '#10b981' },
    'cancelled': { title: 'Order Cancelled', message: 'Your order has been cancelled.', color: '#ef4444' },
    'refunded': { title: 'Order Refunded', message: 'Your order has been refunded.', color: '#f59e0b' },
  };
  
  const statusInfo = statusMessages[data.status] || { title: 'Order Updated', message: 'Your order status has been updated.', color: '#6b7280' };
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid ${statusInfo.color}; padding-bottom: 10px;">
        ${statusInfo.title} - Order #${data.orderNumber}
      </h2>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
        <h3 style="color: #065f46; margin-top: 0;">${statusInfo.title}</h3>
        <p style="color: #047857; margin: 0;">${statusInfo.message}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> #${data.orderNumber}</p>
        <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
        ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${siteUrl}/orders" style="display: inline-block; background: ${statusInfo.color}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order</a>
      </div>
    </div>
  `;
}

// Review Submission Admin Notification
export interface ReviewSubmissionAdminEmailData {
  reviewId: string;
  productName: string;
  productId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  siteUrl?: string;
}

export function generateReviewSubmissionAdminEmailHTML(data: ReviewSubmissionAdminEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
        New Review Submission - Requires Approval
      </h2>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin-top: 0;">Action Required</h3>
        <p style="color: #78350f; margin: 0;">A new product review has been submitted and requires your approval.</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Review Details</h3>
        <p><strong>Product:</strong> ${data.productName}</p>
        <p><strong>Reviewer:</strong> ${data.userName} (${data.userEmail})</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(data.rating)} ${data.rating}/5</p>
        ${data.title ? `<p><strong>Title:</strong> ${data.title}</p>` : ''}
        <p><strong>Comment:</strong></p>
        <div style="background: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; margin-top: 10px;">
          <p style="margin: 0; line-height: 1.6; color: #374151;">${data.comment.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${siteUrl}/admin/reviews" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Review & Approve</a>
      </div>
    </div>
  `;
}

// Review Approval/Rejection Customer Notification
export interface ReviewStatusEmailData {
  userName: string;
  productName: string;
  status: 'approved' | 'rejected';
  adminMessage?: string;
  siteUrl?: string;
}

export function generateReviewStatusEmailHTML(data: ReviewStatusEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isApproved = data.status === 'approved';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid ${isApproved ? '#10b981' : '#ef4444'}; padding-bottom: 10px;">
        Review ${isApproved ? 'Approved' : 'Status Update'}
      </h2>
      
      <div style="background: ${isApproved ? '#f0fdf4' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'};">
        <h3 style="color: ${isApproved ? '#065f46' : '#991b1b'}; margin-top: 0;">${isApproved ? 'Your Review Has Been Published!' : 'Review Status Update'}</h3>
        <p style="color: ${isApproved ? '#047857' : '#dc2626'}; margin: 0;">
          ${isApproved 
            ? `Thank you for your review of ${data.productName}! It has been approved and is now visible to other customers.` 
            : `We're sorry, but your review for ${data.productName} could not be published at this time.`}
        </p>
      </div>
      
      ${data.adminMessage ? `
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Admin Message</h3>
        <p style="color: #374151; line-height: 1.6;">${data.adminMessage}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${siteUrl}/products" style="display: inline-block; background: ${isApproved ? '#10b981' : '#6b7280'}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Continue Shopping</a>
      </div>
    </div>
  `;
}

// Admin User Creation Notification
export interface AdminUserCreatedEmailData {
  userName: string;
  userEmail: string;
  roleName: string;
  createdBy: string;
  siteUrl?: string;
}

export function generateAdminUserCreatedEmailHTML(data: AdminUserCreatedEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
        Your ShopEase Account Has Been Created
      </h2>
      
      <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <h3 style="color: #4338ca; margin-top: 0;">Welcome to ShopEase Admin!</h3>
        <p style="color: #4f46e5; margin: 0;">An administrator account has been created for you with ${data.roleName} role.</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Account Details</h3>
        <p><strong>Name:</strong> ${data.userName}</p>
        <p><strong>Email:</strong> ${data.userEmail}</p>
        <p><strong>Role:</strong> ${data.roleName}</p>
        <p><strong>Created By:</strong> ${data.createdBy}</p>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="${siteUrl}/login" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Login to Your Account</a>
      </div>
    </div>
  `;
}

// Payment Notification Templates
export interface PaymentNotificationEmailData {
  orderNumber: string;
  customerName: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'disputed' | 'canceled';
  failureReason?: string;
  siteUrl?: string;
}

export function generatePaymentNotificationEmailHTML(data: PaymentNotificationEmailData): string {
  const siteUrl = data.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const statusInfo: Record<string, { title: string; message: string; color: string }> = {
    'succeeded': { title: 'Payment Successful', message: 'Your payment has been processed successfully.', color: '#10b981' },
    'failed': { title: 'Payment Failed', message: 'Unfortunately, your payment could not be processed.', color: '#ef4444' },
    'disputed': { title: 'Payment Disputed', message: 'A dispute has been filed for this payment.', color: '#f59e0b' },
    'canceled': { title: 'Payment Canceled', message: 'Your payment has been canceled.', color: '#6b7280' },
  };
  
  const info = statusInfo[data.status] || statusInfo['failed'];
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid ${info.color}; padding-bottom: 10px;">
        ${info.title} - Order #${data.orderNumber}
      </h2>
      
      <div style="background: ${info.color === '#10b981' ? '#f0fdf4' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${info.color};">
        <h3 style="color: ${info.color === '#10b981' ? '#065f46' : '#991b1b'}; margin-top: 0;">${info.title}</h3>
        <p style="color: ${info.color === '#10b981' ? '#047857' : '#dc2626'}; margin: 0;">${info.message}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Payment Details</h3>
        <p><strong>Order Number:</strong> #${data.orderNumber}</p>
        <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
        ${data.failureReason ? `<p><strong>Reason:</strong> ${data.failureReason}</p>` : ''}
      </div>
      
      ${data.status === 'succeeded' ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${siteUrl}/orders" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order</a>
      </div>
      ` : ''}
    </div>
  `;
}
