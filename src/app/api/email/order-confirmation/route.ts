import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateOrderConfirmationHTML, generateOrderConfirmationText, OrderEmailData } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data: OrderEmailData = await request.json();
    
    // Validate required fields
    if (!data.orderNumber || !data.customerName || !data.customerEmail || !data.items || !data.shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate email content
    const emailHTML = generateOrderConfirmationHTML(data);
    const emailText = generateOrderConfirmationText(data);
    
    // Send confirmation email to customer
    const customerEmailSent = await sendEmail({
      to: data.customerEmail,
      subject: `Order Confirmation - #${data.orderNumber}`,
      html: emailHTML,
      text: emailText
    });

    if (!customerEmailSent) {
      return NextResponse.json(
        { error: 'Failed to send customer confirmation email' },
        { status: 500 }
      );
    }

    // Send notification email to admin
    const adminEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          New Order Received - #${data.orderNumber}
        </h2>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">New Order Alert!</h3>
          <p style="color: #047857; margin: 0;">A new order has been placed and requires processing.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Order Summary</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Total Amount:</strong> $${data.orderTotal.toFixed(2)}</p>
          <p><strong>Items Count:</strong> ${data.items.length}</p>
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
              ${data.items.map(item => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #374151;">${item.name}</td>
                  <td style="padding: 12px; text-align: center; color: #374151;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; color: #374151;">$${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
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
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Action Required:</strong> Process this order and update the customer with shipping information.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: 'testleadz04@gmail.com',
      subject: `New Order #${data.orderNumber} - ${data.customerName}`,
      html: adminEmailHTML,
      text: `New Order Received!\n\nOrder #${data.orderNumber}\nCustomer: ${data.customerName} (${data.customerEmail})\nTotal: $${data.orderTotal.toFixed(2)}\nItems: ${data.items.length}\n\nAction Required: Process this order and update the customer with shipping information.`
    });

    return NextResponse.json(
      { message: 'Order confirmation emails sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Order confirmation email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
