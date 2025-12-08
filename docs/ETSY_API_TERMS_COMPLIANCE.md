# Etsy API Terms of Use - Compliance Guide

This document outlines key requirements from Etsy's API Terms of Use that our integration must comply with.

## Critical Requirements

### 1. License and Usage Rights

- ✅ **Limited License**: We have a limited, non-sublicensable, non-transferable, non-exclusive, and revocable license to use the Etsy API
- ✅ **Application Purpose**: Our Application Purpose must be submitted and approved by Etsy before using the API
- ✅ **Ownership**: Etsy retains all rights to the Etsy API - we cannot claim ownership

### 2. Developer Account Requirements

- ✅ **Registration**: Must register for an Etsy developer account
- ✅ **Accurate Information**: Must provide accurate, true, and complete information
- ✅ **Account Security**: Responsible for maintaining API credentials security
- ⚠️ **Good Standing**: Must maintain account in good standing

### 3. API Rate Limits

**Default Limits**:
- Each API key has a default number of API Calls per day (specified in Etsy API documentation)
- Each API key may only be used for a single Application
- Each Application may only use its designated API key

**Enterprise Tier**:
- For more than 3 million API Calls per day, must qualify for Enterprise Tier
- Enterprise Tier has additional terms and requirements

**Our Implementation**:
- Current documentation mentions 10 requests/second and 10,000/day
- ⚠️ **ACTION REQUIRED**: Verify current rate limits against Etsy's latest documentation
- ⚠️ **ACTION REQUIRED**: Implement rate limit tracking and throttling

### 4. Data Display and Caching Requirements

**Critical Timelines**:
- ⚠️ **Listing Content**: Must not display listing content more than **6 hours** older than Etsy Site/Etsy Apps
- ⚠️ **Other Etsy Content**: Must not display any other Etsy content more than **24 hours** older than Etsy Site/Etsy Apps
- ⚠️ **Caching**: Must not cache or store Etsy content longer than reasonably necessary to provide service

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Implement timestamp tracking for all Etsy data
- ⚠️ **ACTION REQUIRED**: Implement automatic refresh logic (6 hours for listings, 24 hours for other content)
- ⚠️ **ACTION REQUIRED**: Ensure cached data is refreshed before display

### 5. Trademark Usage

**Requirements**:
- ⚠️ **No Endorsement**: Cannot use Etsy's trademarks in a way that suggests endorsement or affiliation
- ⚠️ **Branding Priority**: Etsy's trademarks must appear less prominently than our own branding
- ⚠️ **Required Statement**: Must prominently display: *"The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy."*

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Add required trademark disclaimer to our application
- ⚠️ **ACTION REQUIRED**: Review all Etsy trademark usage
- ✅ **Permitted Usage**: Can state "developed using the Etsy API" but cannot imply endorsement

### 6. Application Requirements

**Must Have**:
- ✅ **Application Purpose**: Must submit and get approval for Application Purpose
- ⚠️ **Service Support**: Must provide monitored email address for Etsy sellers to contact for support
- ⚠️ **Response Time**: Must respond to seller inquiries in a reasonable and timely manner
- ⚠️ **Application Terms**: Must have enforceable terms (privacy policy, terms of service) with users
- ⚠️ **Warranty Disclaimer**: Must include warranty disclaimer in Application Terms

**Required Warranty Disclaimer**:
```
DISCLAIMER: THIS APPLICATION IS SOLELY PROVIDED BY [DEVELOPER NAME] (THE "APPLICATION DEVELOPER"). 
YOU ACKNOWLEDGE THAT ETSY, INC. AND ITS AFFILIATES ARE NOT THE APPLICATION DEVELOPER, DO NOT 
PROVIDE THE APPLICATION SERVICE, AND MAKE NO WARRANTIES OF ANY KIND WITH RESPECT TO THE 
APPLICATION OR DATA ACCESSED THROUGH IT.
```

### 7. Prohibited Behaviors

**Critical Restrictions** (violation can result in immediate termination):

- ❌ **NO Mimicking Etsy**: Cannot replace or mimic Etsy's core functionalities
- ❌ **NO Checkout Bypass**: Cannot circumvent Etsy checkout process
- ❌ **NO Sales Diversion**: Cannot divert sales or migrate Etsy Members from Etsy
- ❌ **NO External Traffic**: Cannot drive traffic to external websites unrelated to Etsy
- ❌ **NO Etsy Lookalike**: Cannot copy, resemble, or mirror Etsy's look and feel
- ❌ **NO Misrepresentation**: Cannot misrepresent affiliation with Etsy
- ❌ **NO Data Collection**: Cannot use API to collect/scrape Etsy content for analytics, ML, AI training, licensing, or content removal (unless authorized)
- ❌ **NO Automated Scraping**: Cannot use automated systems or browser extensions to scrape Etsy (unless authorized)
- ❌ **NO Multiple Apps**: Cannot create multiple Applications offering substantially the same services
- ❌ **NO Key Sharing**: Cannot transfer or commercialize API access/credentials to third parties
- ❌ **NO Unauthorized Use**: Cannot use API for purposes unrelated to Etsy Member activity

**Our Implementation**:
- ✅ We integrate with Etsy (not replace it)
- ✅ We use OAuth for authentication (not scraping)
- ⚠️ **ACTION REQUIRED**: Review any automated systems or scraping tools
- ⚠️ **ACTION REQUIRED**: Ensure we're not bypassing Etsy checkout

### 8. Privacy and Data Protection

**Requirements**:
- ⚠️ **Privacy Policy**: Must have comprehensive privacy policy
- ⚠️ **Data Processing**: Must process Etsy Member personal information only to fulfill services under Application Terms
- ⚠️ **Transparency**: Must transparently inform Etsy sellers about:
  - Information collected by Application
  - How information is used, stored, secured, and disclosed
  - Controls sellers have over their information
- ⚠️ **Data Breach Notification**: Must notify Etsy at dpo@etsy.com and seller within **24 hours** of discovery

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Ensure privacy policy covers Etsy data processing
- ⚠️ **ACTION REQUIRED**: Implement data breach notification process
- ⚠️ **ACTION REQUIRED**: Document data processing practices

### 9. Application Discontinuation

**Requirements**:
- ⚠️ **Notice Period**: Must provide at least **30 days** prior written notice to Etsy and Etsy sellers before discontinuing
- ⚠️ **Support During Notice**: Must maintain Application and provide support during notice period
- ⚠️ **Transition Services**: Must provide transitional services to sellers

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Document discontinuation process
- ⚠️ **ACTION REQUIRED**: Plan for graceful shutdown with proper notice

### 10. Dormant Applications

- ⚠️ **Inactivity Rule**: If Application hasn't made successful API call for **6 consecutive months**, Etsy can suspend access
- ⚠️ **Our Implementation**: Ensure regular API usage or implement keep-alive mechanism

### 11. Quality Standards

Etsy can suspend/terminate if Application doesn't meet quality standards based on:
- Repeated complaints from Etsy Members
- Failure to operate as described
- Technical instability issues
- Violations of Terms

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Monitor application quality and user feedback
- ⚠️ **ACTION REQUIRED**: Implement error tracking and logging
- ⚠️ **ACTION REQUIRED**: Regular testing and quality assurance

### 12. Fees and Invoicing

- ✅ **Our Responsibility**: We are solely responsible for invoicing and collecting fees from Application users
- ✅ **Etsy Not Responsible**: Etsy bears no responsibility for charging fees or taxes

### 13. Indemnification and Liability

- ⚠️ **Indemnification**: We must defend and indemnify Etsy against claims arising from our Application
- ⚠️ **Release**: We waive claims against Etsy and Etsy Members related to API use
- ⚠️ **Our Implementation**: Review insurance coverage and legal protections

### 14. Feedback

- ✅ **Ownership**: Etsy exclusively owns all rights to Feedback we submit
- ✅ **Assignment**: We assign all rights to Feedback to Etsy
- ✅ **Non-Confidential**: All Feedback treated as non-confidential

## Implementation Checklist

### Immediate Actions Required

- [ ] Add required Etsy trademark disclaimer to application UI
- [ ] Implement data freshness tracking (6 hours for listings, 24 hours for other content)
- [ ] Add automatic data refresh logic
- [ ] Review and update privacy policy to cover Etsy data processing
- [ ] Document Application Purpose and submit for approval (if not already done)
- [ ] Verify API rate limits against current Etsy documentation
- [ ] Implement rate limit tracking and throttling
- [ ] Add monitored support email address
- [ ] Add required warranty disclaimer to Application Terms
- [ ] Implement data breach notification process
- [ ] Review all Etsy trademark usage
- [ ] Ensure no prohibited behaviors in implementation
- [ ] Document discontinuation process

### Ongoing Compliance

- [ ] Monitor API usage and rate limits
- [ ] Regularly update cached data per freshness requirements
- [ ] Maintain good standing with Etsy
- [ ] Respond to seller support inquiries promptly
- [ ] Monitor application quality and user feedback
- [ ] Keep Application Terms and privacy policy up to date
- [ ] Regular security audits
- [ ] Test application after Etsy API updates

## Key Contacts

- **Etsy Developer Support**: developer@etsy.com
- **Etsy Security**: security@etsy.com
- **Etsy Data Protection Officer**: dpo@etsy.com

## Reference Documents

- [Etsy API Terms of Use](https://www.etsy.com/legal/api-terms-of-use)
- [Etsy Developer Documentation](https://developers.etsy.com/)
- [Etsy Trademark Policy](https://www.etsy.com/legal/trademark)

## Last Updated

This compliance guide was created based on Etsy API Terms of Use last updated: June 16, 2025
