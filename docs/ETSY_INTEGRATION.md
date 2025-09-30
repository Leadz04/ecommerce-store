# Etsy Integration Guide

This document explains how to set up and use the Etsy integration with your e-commerce store.

## Overview

The Etsy integration allows you to:
- Connect your Etsy shop to your store
- Sync products between your store and Etsy
- Import orders from Etsy
- Manage inventory across both platforms
- Automatically sync data on a schedule

## Setup

### 1. Etsy Developer Account

1. Go to [Etsy Developers](https://www.etsy.com/developers/)
2. Create a new application
3. Note down your `Client ID` and `Client Secret`
4. Set your redirect URI to: `http://localhost:3000/api/etsy/auth` (or your domain)

### 2. Environment Variables

Add these to your `.env.local` file:

```env
ETSY_CLIENT_ID=your-etsy-client-id
ETSY_CLIENT_SECRET=your-etsy-client-secret
ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/auth
```

### 3. Database Models

The integration uses three main models:
- `EtsyShop`: Stores shop connection details
- `EtsyListing`: Maps Etsy listings to your products
- `EtsyOrder`: Stores Etsy orders

## Features

### 1. Shop Connection

- OAuth-based authentication with Etsy
- Secure token storage and refresh
- Multiple shop support

### 2. Product Synchronization

**Store → Etsy:**
- Create new Etsy listings from your products
- Update existing listings
- Delete listings from Etsy

**Etsy → Store:**
- Import products from Etsy
- Map Etsy listings to your products
- Sync product details and images

### 3. Order Management

- Import orders from Etsy
- Track order status across platforms
- Sync shipping and payment information

### 4. Inventory Management

- Bidirectional inventory sync
- Real-time stock updates
- Automatic low-stock alerts

### 5. Automated Scheduling

- Configurable sync intervals
- Background processing
- Error handling and retry logic

## API Endpoints

### Authentication
- `GET /api/etsy/auth` - Initiate OAuth flow
- `POST /api/etsy/auth` - Handle OAuth callback

### Synchronization
- `POST /api/etsy/sync` - Manual sync trigger
- `POST /api/etsy/products/sync-to-etsy` - Sync specific product
- `POST /api/etsy/inventory/sync` - Inventory sync

### Settings
- `GET /api/etsy/settings` - Get shop settings
- `PUT /api/etsy/settings` - Update sync settings

## Usage

### 1. Connect Your Shop

1. Go to Admin Dashboard → Etsy Integration
2. Click "Connect Etsy Shop"
3. Authorize the application on Etsy
4. Your shop will be connected automatically

### 2. Sync Products

**To Etsy:**
1. Select a product from your store
2. Choose action (Create/Update/Delete)
3. Click "Sync to Etsy"

**From Etsy:**
1. Go to Sync Controls
2. Click "Sync Listings"
3. Products will be imported automatically

### 3. Manage Orders

1. Click "Sync Orders" in Sync Controls
2. Orders will be imported with full details
3. Track status in the Orders section

### 4. Inventory Sync

1. Use "Sync Inventory" for stock updates
2. Set up automatic sync in settings
3. Monitor sync status in the dashboard

## Configuration

### Sync Settings

Each shop has configurable sync settings:

```javascript
{
  autoSyncProducts: true,    // Auto-sync products
  autoSyncOrders: true,     // Auto-sync orders
  autoSyncInventory: true,  // Auto-sync inventory
  syncInterval: 60          // Sync interval in minutes
}
```

### Automated Scheduling

The system includes an automated scheduler that:
- Runs every 5 minutes
- Checks each shop's sync interval
- Performs background synchronization
- Handles errors gracefully

## Error Handling

The integration includes comprehensive error handling:
- API rate limiting
- Token refresh
- Retry logic
- Detailed logging

## Security

- OAuth 2.0 authentication
- Secure token storage
- Encrypted communication
- Access control

## Monitoring

Monitor your integration through:
- Admin dashboard status cards
- Sync logs and errors
- Performance metrics
- Order tracking

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check your Etsy credentials
   - Verify redirect URI
   - Ensure app is approved

2. **Sync Errors**
   - Check API rate limits
   - Verify product data
   - Review error logs

3. **Inventory Mismatch**
   - Run manual inventory sync
   - Check product mappings
   - Verify stock levels

### Support

For technical support:
- Check the logs in your admin dashboard
- Review the Etsy API documentation
- Contact your development team

## Best Practices

1. **Regular Syncs**: Set up automatic sync for real-time updates
2. **Monitor Status**: Check sync status regularly
3. **Handle Errors**: Address sync errors promptly
4. **Backup Data**: Keep backups of your product data
5. **Test Changes**: Test integration changes in development first

## API Limits

Etsy has API rate limits:
- 10 requests per second
- 10,000 requests per day
- The integration respects these limits automatically

## Future Enhancements

Planned features:
- Bulk product operations
- Advanced filtering
- Custom field mapping
- Analytics integration
- Multi-language support
