# 🛍️ E-Commerce Store

A modern, full-stack e-commerce application built with Next.js 15, MongoDB, and Stripe. Features include user authentication, product management, shopping cart, order processing, and an intelligent auto-migration system.

## 🚀 Features

- **🛒 Complete E-Commerce Functionality**
  - Product catalog with categories and filters
  - Shopping cart and wishlist
  - User authentication and profiles
  - Order management and tracking
  - Payment processing with Stripe

- **🤖 Intelligent Auto-Migration System**
  - Automatic schema change detection
  - Auto-generated migration files
  - Database version control
  - Safe rollback capabilities

- **👥 Admin Dashboard**
  - User management
  - Product management
  - Order tracking
  - Role-based permissions

- **🎨 Modern UI/UX**
  - Responsive design
  - Dark/light theme support
  - Smooth animations
  - Mobile-first approach

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Payments**: Stripe
- **State Management**: Zustand
- **Database**: MongoDB with auto-migrations

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database
- Stripe account (for payments)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ecommerce-store
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce-store
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. Database Setup

#### Option A: Auto-Migration (Recommended)
```bash
# Create initial schema snapshot
npm run migrate:snapshot

# Run all migrations
npm run migrate:up
```

#### Option B: Manual Setup
```bash
# Seed the database with sample data
npm run migrate:up
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🗄️ Database Migrations

This project includes a powerful auto-migration system that automatically detects schema changes and generates migration files.

### **Quick Start with Auto-Migrations**

```bash
# 1. Make changes to your model files in src/models/
# 2. Generate migration for detected changes
npm run migrate:generate

# 3. Run the migration
npm run migrate:up

# Or do both steps at once
npm run migrate:auto
```

### **Available Migration Commands**

| Command | Description |
|---------|-------------|
| `npm run migrate:snapshot` | Create initial schema snapshot |
| `npm run migrate:diff` | Show schema differences |
| `npm run migrate:generate` | Generate migration file for changes |
| `npm run migrate:auto` | Generate and run migration automatically |
| `npm run migrate:up` | Run pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate:status` | Show migration status |

### **How Auto-Migrations Work**

1. **Make Schema Changes**: Edit your model files in `src/models/`
2. **Detect Changes**: Run `npm run migrate:diff` to see what changed
3. **Generate Migration**: Run `npm run migrate:generate` to create migration file
4. **Apply Changes**: Run `npm run migrate:up` to update database
5. **Or Use Auto**: Run `npm run migrate:auto` to do steps 2-4 automatically

### **What It Detects**
- ➕ **New fields** - Automatically adds with default values
- ➖ **Removed fields** - Safely removes from database  
- 🔄 **Modified fields** - Updates field properties
- ➕ **New indexes** - Creates performance indexes
- ➖ **Removed indexes** - Drops unused indexes
- ➕ **New models** - Handles new collections
- ➖ **Removed models** - Drops old collections

## 📁 Project Structure

```
ecommerce-store/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── products/       # Product pages
│   │   └── ...
│   ├── components/         # React components
│   ├── lib/               # Utilities and configurations
│   │   ├── autoMigrate.js     # Auto-migration system
│   │   ├── migrationRunner.js # Migration execution
│   │   └── simpleSchemaAnalyzer.js # Schema analysis
│   ├── models/            # Mongoose models
│   ├── store/             # Zustand state management
│   └── types/             # TypeScript type definitions
├── migrations/            # Database migrations
│   ├── snapshots/         # Schema snapshots
│   └── *.js              # Migration files
├── scripts/              # Utility scripts
│   └── migrate.js        # Migration CLI
└── ...
```

## 🔧 Development

### **Adding New Features**

1. **Create/Update Models**: Edit files in `src/models/`
2. **Generate Migration**: Run `npm run migrate:auto`
3. **Create API Routes**: Add endpoints in `src/app/api/`
4. **Build Components**: Create UI components in `src/components/`
5. **Update Types**: Add TypeScript types in `src/types/`

### **Database Changes**

When you modify a model schema:

```bash
# The system will automatically detect changes
npm run migrate:diff

# Generate migration file
npm run migrate:generate

# Review the generated migration file
# Then run it
npm run migrate:up
```

### **Admin Access**

- Navigate to `/admin` for the admin dashboard
- Default admin credentials are created during database seeding
- Use the admin panel to manage users, products, and orders

## 🚀 Deployment

### **Environment Variables for Production**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-nextauth-secret
```

### **Deploy to Vercel**

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### **Database Migrations in Production**

```bash
# Run migrations before deployment
npm run migrate:up

# Check migration status
npm run migrate:status
```

## 📚 Documentation

- [Migration System Guide](./MIGRATIONS.md) - Complete migration documentation
- [Auto-Migration Guide](./AUTO_MIGRATIONS.md) - Auto-migration system details
- [API Documentation](./docs/api.md) - API endpoints reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run migrations if needed: `npm run migrate:auto`
5. Test your changes
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Migration System Guide](./MIGRATIONS.md)
2. Review the [Auto-Migration Guide](./AUTO_MIGRATIONS.md)
3. Check migration status: `npm run migrate:status`
4. Create an issue in the repository

---

**Happy coding! 🎉**


<!-- 

I can see the issue! The Stripe CLI is trying to forward webhooks to `localhost:4242/webhook`, but your Next.js application is running on `localhost:3000`. The webhook endpoint should be `localhost:3000/api/payments/webhook`.

Let me help you fix this:

## **�� Fix the Stripe Webhook Configuration**

You need to update the Stripe CLI command to point to the correct webhook endpoint:

**Stop the current Stripe CLI process** (Ctrl+C) and run this instead:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## **🔑 Update Your Environment Variables**

You also need to add the webhook signing secret to your `.env.local` file. From the console output, I can see your webhook signing secret is:

```
whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
```

Add this to your `.env.local` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
```

## **📋 Complete Steps:**

1. **Stop the current Stripe CLI** (Ctrl+C in the terminal)

2. **Update your `.env.local` file** with the webhook secret:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
   ```

3. **Restart your Next.js development server** (if it's not running):
   ```bash
   npm run dev
   ```

4. **Start Stripe CLI with the correct endpoint**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

## **✅ What This Fixes:**

- **Webhook Delivery**: Stripe will now successfully deliver webhooks to your application
- **Payment Processing**: Payment confirmations will be properly handled
- **Order Updates**: Orders will be automatically updated when payments succeed
- **Error Resolution**: The "connection refused" errors will disappear

The webhook endpoint at `/api/payments/webhook` is already implemented in your codebase and will handle the payment events properly once the Stripe CLI is configured correctly.
 -->