import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'testleadz04@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.APP_PASSWORD, // Use App Password for Gmail
  },
});

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
    const mailOptions = {
      from: process.env.EMAIL_USER || 'testleadz04@gmail.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
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
