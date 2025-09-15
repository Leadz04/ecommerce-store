import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateContactEmailHTML, ContactFormData } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate email content
    const emailHTML = generateContactEmailHTML(data);
    
    // Send email to admin
    const emailSent = await sendEmail({
      to: 'testleadz04@gmail.com',
      subject: `Contact Form: ${data.subject}`,
      html: emailHTML,
      text: `New contact form submission from ${data.name} (${data.email})\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}`
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    const customerEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Thank You for Contacting Us
        </h2>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">We've received your message!</h3>
          <p style="color: #047857; margin: 0;">Thank you for reaching out to us. We'll get back to you within 24 hours.</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Your Message Details</h3>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0; line-height: 1.6; color: #374151;">${data.message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Need immediate assistance?</strong> Call us at +1 (555) 123-4567 or email support@shopease.com
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Thank you for contacting us - We\'ll be in touch soon!',
      html: customerEmailHTML,
      text: `Thank you for contacting us!\n\nWe've received your message about "${data.subject}" and will get back to you within 24 hours.\n\nYour message:\n${data.message}\n\nNeed immediate assistance? Call us at +1 (555) 123-4567 or email support@shopease.com`
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
