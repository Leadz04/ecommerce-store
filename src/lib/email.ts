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
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; color: #374151;">${item.name}</td>
      <td style="padding: 12px; text-align: center; color: #374151;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; color: #374151;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
        Order Confirmation - #${data.orderNumber}
      </h2>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0;">Thank you for your order!</h3>
        <p style="color: #047857; margin: 0;">Your order has been received and is being processed.</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> #${data.orderNumber}</p>
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Email:</strong> ${data.customerEmail}</p>
        <p><strong>Total Amount:</strong> $${data.orderTotal.toFixed(2)}</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Item</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
              <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">Shipping Address</h3>
        <p style="color: #374151; line-height: 1.6;">
          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
          ${data.shippingAddress.address1}<br>
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
          ${data.shippingAddress.country}
        </p>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          <strong>Next Steps:</strong> You will receive a shipping confirmation email once your order is dispatched.
        </p>
      </div>
    </div>
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