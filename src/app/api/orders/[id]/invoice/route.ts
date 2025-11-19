import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT token and get user info
async function verifyToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const userId = await verifyToken(request);
    const { id } = await context.params;
    
    // Get user info to check if admin
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is admin or if order belongs to user
    const isAdmin = user.role?.name === 'ADMIN' || user.role?.name === 'SUPER_ADMIN';
    
    // Get order details - admin can access any order, regular users only their own
    const orderQuery = isAdmin ? { _id: id } : { _id: id, userId };
    const order = await Order.findOne(orderQuery).populate('userId', 'name email');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHTML(order);
    
    // Return as PDF-ready HTML
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.html"`
      }
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(order: any): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${order.orderNumber}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background-color: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 16px;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
        }
        .invoice-title {
            font-size: 18px;
            color: #374151;
            margin-bottom: 8px;
        }
        .invoice-number {
            font-size: 14px;
            color: #6b7280;
            word-break: break-all;
        }
        .invoice-details {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-bottom: 24px;
        }
        .detail-section {
            flex: 1;
        }
        .detail-section h3 {
            color: #374151;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        .detail-section p {
            margin: 4px 0;
            color: #6b7280;
            font-size: 13px;
            word-break: break-word;
        }
        .items-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin-bottom: 24px;
        }
        .items-table {
            width: 100%;
            min-width: 600px;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        .items-table th,
        .items-table td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
            font-size: 13px;
        }
        .items-table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
            white-space: nowrap;
        }
        .items-table td {
            color: #6b7280;
            word-break: break-word;
        }
        .items-table td:first-child {
            font-weight: 500;
            color: #374151;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 4px 0;
            font-size: 14px;
        }
        .total-row.final {
            border-top: 2px solid #e5e5e5;
            padding-top: 12px;
            margin-top: 12px;
            font-weight: bold;
            font-size: 18px;
            color: #374151;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-processing {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-shipped {
            background-color: #e0e7ff;
            color: #3730a3;
        }
        .status-delivered {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .footer {
            margin-top: 32px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e5e5;
            padding-top: 16px;
        }
        .footer p {
            margin: 4px 0;
        }
        @media (min-width: 640px) {
            body {
                padding: 20px;
            }
            .invoice-container {
                padding: 32px;
            }
            .company-name {
                font-size: 28px;
            }
            .invoice-title {
                font-size: 24px;
            }
            .invoice-number {
                font-size: 18px;
            }
            .invoice-details {
                flex-direction: row;
                gap: 40px;
            }
            .detail-section h3 {
                font-size: 16px;
            }
            .detail-section p {
                font-size: 14px;
            }
            .items-table th,
            .items-table td {
                padding: 12px;
                font-size: 14px;
            }
            .total-row {
                font-size: 15px;
            }
            .footer {
                font-size: 14px;
            }
        }
        @media print {
            body { 
                background-color: white;
                padding: 0;
            }
            .invoice-container { 
                box-shadow: none;
                padding: 20px;
            }
            .items-table-wrapper {
                overflow: visible;
            }
            .items-table {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-name">ShopEase</div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${order.orderNumber}</div>
        </div>

        <div class="invoice-details">
            <div class="detail-section">
                <h3>Bill To:</h3>
                <p><strong>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</strong></p>
                <p>${order.shippingAddress.address1}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                <p>${order.shippingAddress.country}</p>
                ${order.shippingAddress.phone ? `<p>Phone: ${order.shippingAddress.phone}</p>` : ''}
                ${order.userId?.email ? `<p>Email: ${order.userId.email}</p>` : ''}
            </div>
            <div class="detail-section">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice Date:</strong> ${orderDate}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </p>
            </div>
        </div>

        <div class="items-table-wrapper">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item: any) => `
                        <tr>
                            <td>${item.name || 'N/A'}</td>
                            <td>
                                ${item.size ? `Size: ${item.size}` : ''}
                                ${item.size && item.color ? ' | ' : ''}
                                ${item.color ? `Color: ${item.color}` : ''}
                                ${!item.size && !item.color ? '—' : ''}
                            </td>
                            <td>${item.quantity || 1}</td>
                            <td>$${(item.price || 0).toFixed(2)}</td>
                            <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>$${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Shipping:</span>
                <span>$${(order.shipping || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Tax:</span>
                <span>$${(order.tax || 0).toFixed(2)}</span>
            </div>
            <div class="total-row final">
                <span>Total:</span>
                <span>$${(order.total || 0).toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>For questions about this invoice, please contact us at support@shopease.com</p>
        </div>
    </div>
</body>
</html>
  `;
}
