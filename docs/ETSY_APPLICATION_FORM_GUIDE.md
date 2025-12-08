# Etsy API Application Form - Quick Fill Guide

## Form Fields - What to Enter

### App Overview

**Name** *(required)*
```
EverStyleCrafts Store Manager
```

**Describe your application** *(required, 500 chars max)*
```
Personal e-commerce store management application for my own Etsy shop. Integrates with Etsy API to synchronize product listings, manage inventory levels, and import orders between my independent store and Etsy. Features: bidirectional product sync (create/update/delete listings), real-time inventory management, order import/tracking, automated scheduled sync, OAuth 2.0 authentication. Personal-use only - I am the sole user accessing only my own shop data. Built with Next.js on Vercel. Compliant with Etsy API Terms including data freshness requirements (6h/24h) and rate limiting.
```

**Website URL** *(required)*
```
https://ecommerce-store-mvcciyzlr-testleadz04s-projects.vercel.app/
```

### App Details

**What type of application are you building?**
- ✅ **Seller Tools** (check this one)
- ❌ Buyer Tools (don't check)
- ❌ Mobile (don't check)

**Who will be the users of this application?** *(required)*
- ✅ **Just myself or colleagues** (select this)
- ❌ A small group of users
- ❌ The general public

**Is your application commercial?** *(required)*
- ❌ Yes
- ✅ **No** (select this - it's personal use)

**Will your app do any of the following?** *(can check multiple)*
- ✅ **Upload or edit listings** (check - for syncing products)
- ✅ **Read sales data** (check - for importing orders)
- ❌ Send email (don't check - you're not using this)

---

## Step-by-Step Instructions

1. **Go to**: https://www.etsy.com/developers/your-apps
2. **Click**: "Create a new app"
3. **Fill in the form** using the values above
4. **Review** all information before submitting
5. **Submit** the application
6. **Wait for approval** (usually takes a few days)

---

## After Submission

### What Happens Next

1. **Etsy Reviews Your Application**
   - They'll review your description
   - Usually takes 2-5 business days
   - You'll receive an email notification

2. **If Approved**
   - You'll receive:
     - Client ID
     - Client Secret
   - You can then configure your app

3. **If Rejected**
   - You'll receive feedback
   - You can revise and resubmit

### After Approval - Next Steps

1. **Add to Environment Variables**
   ```env
   ETSY_CLIENT_ID=your-client-id-here
   ETSY_CLIENT_SECRET=your-client-secret-here
   ETSY_REDIRECT_URI=https://ecommerce-store-mvcciyzlr-testleadz04s-projects.vercel.app/api/etsy/auth
   ```

2. **Set Redirect URI in Etsy App Settings**
   - Go to your app settings in Etsy Developer Portal
   - Add redirect URI: `https://ecommerce-store-mvcciyzlr-testleadz04s-projects.vercel.app/api/etsy/auth`

3. **Test the Integration**
   - Start with OAuth flow
   - Test product sync
   - Verify inventory sync

---

## Important Notes

### ✅ Good to Know

- **Personal Use is Fine**: Etsy allows personal-use applications
- **Vercel Subdomain is OK**: Your Vercel URL is acceptable
- **You Can Update Later**: You can modify app details after approval
- **No Rush**: Take your time filling out the form accurately

### ⚠️ Important Reminders

- **Be Honest**: Describe what your app actually does
- **Be Specific**: Mention key features (sync, inventory, orders)
- **Emphasize Personal Use**: Make it clear it's only for you
- **Don't Exaggerate**: Keep it accurate and professional

### ❌ Don't Do This

- Don't claim it's for "general public" if it's personal use
- Don't say it's commercial if it's not
- Don't check features you're not using
- Don't use misleading descriptions

---

## Troubleshooting

### If Form Rejects Your Description

- Check character count (must be ≤ 500)
- Remove any special characters that might cause issues
- Use the shorter alternative version if needed

### If You Need to Update Later

- You can edit app details after approval
- Go to "Manage your apps" in developer portal
- Click on your app to edit

---

## Support

If you have questions:
- **Etsy Developer Support**: developer@etsy.com
- **Etsy Developer Docs**: https://developers.etsy.com/

---

## Checklist Before Submitting

- [ ] App name entered
- [ ] Description is accurate and ≤ 500 characters
- [ ] Website URL is correct
- [ ] "Seller Tools" is checked
- [ ] "Just myself or colleagues" is selected
- [ ] "No" is selected for commercial
- [ ] "Upload or edit listings" is checked
- [ ] "Read sales data" is checked
- [ ] "Send email" is NOT checked
- [ ] All information is accurate
- [ ] Ready to submit!

---

**Good luck with your application!** 🚀
