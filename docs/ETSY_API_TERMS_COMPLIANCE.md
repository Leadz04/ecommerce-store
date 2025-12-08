# Etsy API Terms of Use - Compliance Guide

This document outlines key requirements from Etsy's API Terms of Use that our integration must comply with.

## Critical Requirements

### 1. License and Usage Rights

- ✅ **Limited License**: We have a limited, non-sublicensable, non-transferable, non-exclusive, and revocable license to use the Etsy API
- ✅ **Application Purpose**: Our Application Purpose must be submitted and approved by Etsy before using the API
- ✅ **Ownership**: Etsy retains all rights to the Etsy API - we cannot claim ownership

### 2. Developer Account Requirements

- ✅ **Registration**: Must register for Etsy developer account ("Developer Account")
- ✅ **Request Access**: Must request access to Etsy API as set out in Section 3
- ✅ **Use Type**: Must indicate whether using Etsy API for personal or commercial use
- ✅ **Accurate Information**: Must provide all required information in accurate, true and complete manner
- ✅ **Account Security**: Responsible for maintaining security of Etsy API credentials and Developer Account
- ⚠️ **Sole Use**: Developer Account is solely for our own use
- ⚠️ **Account Responsibility**: Responsible for all activities through account (if business entity, includes designated authorized users)
- ⚠️ **Rejection Right**: Etsy may reject request for Etsy API access for any reason, in Etsy's sole discretion
- ⚠️ **Communication**: Etsy will use email address associated with Developer Account ("Developer Email Address") as primary method of communication
- ⚠️ **Good Standing**: Must maintain account in good standing by:
  - Keeping Developer Account information accurate, true and complete (update as needed or contact developer@etsy.com)
  - Complying with requirements set out in Terms (including Enterprise Tier Terms where applicable) and Developer Tools
- ⚠️ **Additional Information**: Etsy may request additional information from us or about Application to ensure compliance - must provide in timely and accurate manner
- ⚠️ **Security Concerns**: If we discover security concerns or suspect account compromise, must immediately notify Etsy at security@etsy.com

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
- ✅ **Application Purpose**: Must submit and get approval for Application Purpose before using API
- ⚠️ **Fully Functional**: Application must be fully functional, tested for bugs and defects before making available to sellers
- ⚠️ **Consistency**: Application must be consistent with Application Purpose submitted to and approved by Etsy
- ⚠️ **Service Support**: Must provide monitored email address for Etsy sellers to contact for support
- ⚠️ **Response Time**: Must respond to seller inquiries in a reasonable and timely manner
- ⚠️ **Application Terms**: Must have enforceable terms (privacy policy, terms of service) with users that:
  - Are consistent with obligations under Terms
  - Grant necessary license or right to use Application
  - Are between you and user (not creating obligations for Etsy)
  - Require users to accept in legally enforceable manner (click-through or equivalent)
- ⚠️ **Warranty Disclaimer**: Must include warranty disclaimer in Application Terms
- ⚠️ **Compliance**: Must comply with all applicable Terms and Developer Tools
- ⚠️ **Technical Audits**: Must cooperate with Etsy's review, testing, and technical audits of Application
- ⚠️ **Modifications**: Must make required modifications within reasonable period if Etsy requests compliance changes

**Required Warranty Disclaimer**:
```
DISCLAIMER: THIS APPLICATION IS SOLELY PROVIDED BY [DEVELOPER NAME] (THE "APPLICATION DEVELOPER"). 
YOU ACKNOWLEDGE THAT ETSY, INC. AND ITS AFFILIATES ARE NOT THE APPLICATION DEVELOPER, DO NOT 
PROVIDE THE APPLICATION SERVICE, AND MAKE NO WARRANTIES OF ANY KIND WITH RESPECT TO THE 
APPLICATION OR DATA ACCESSED THROUGH IT.
```

**Application Listing**:
- Etsy may, at its sole discretion, list Applications on Etsy Apps page
- Etsy has sole discretion regarding location and form of display

### 7. Prohibited Behaviors

**Critical Restrictions** (violation can result in immediate termination):

- ❌ **NO Mimicking Etsy**: Cannot replace or mimic Etsy's core functionalities, or circumvent the Etsy checkout process
- ❌ **NO Sales Diversion**: Cannot divert sales or migrate Etsy Members from Etsy, or drive traffic to external websites or services unrelated to the Etsy platform
- ❌ **NO Etsy Lookalike**: Cannot copy, resemble, or mirror the look and feel of the Etsy Site, Etsy Services, or Etsy's trademarks, or otherwise misrepresent affiliation with Etsy
- ❌ **NO Harmful Practices**: Cannot engage in practices that disrupt or adversely affect Etsy's business, credibility, or reputation, or that could reasonably be expected to harm Etsy or Etsy Members
- ❌ **NO Policy Violations**: Cannot support, encourage or facilitate creation of listings or sale of products incompatible with Etsy's Creativity Standards and Prohibited Items Policy (including mass-produced items)
- ❌ **NO IP Infringement**: Cannot support, encourage, or facilitate unauthorized downloading, copying, reproduction, or use of Etsy Members' products, photos or designs, or infringement of intellectual property rights
- ❌ **NO Security Compromise**: Cannot compromise security or integrity of Etsy API or platform, including circumventing security features, exploiting technical limitations, distributing malicious code, or disrupting user experience
- ❌ **NO API Tampering**: Cannot modify, alter or tamper with the Etsy API, or use it in any manner that poses safety or security risks
- ❌ **NO Reverse Engineering**: Cannot reverse engineer, decompile, disassemble, or attempt to derive source code of Etsy API, or access internal or legacy Etsy APIs or data feeds
- ❌ **NO Excessive Burden**: Cannot excessively burden or impose unreasonable burden on Etsy API or platform
- ❌ **NO Duplicate Apps**: Cannot create multiple Applications that offer substantially the same services
- ❌ **NO Unrelated Code**: Cannot include code in Application that performs operations unrelated to services provided by the Application
- ❌ **NO Improper Data Handling**: Cannot improperly handle Etsy Member data, including processing without necessary authorization or beyond compliance with terms of service, privacy policy and Terms
- ❌ **NO Credential Storage**: Cannot upload, post, collect, store, or transmit Member ID and password combinations
- ❌ **NO Spam**: Cannot use Etsy API for transmitting spam or unsolicited marketing communications, or to connect with third-party advertising or marketing platforms
- ❌ **NO Unauthorized Order Tracking**: Cannot use Etsy API for sending order, delivery and tracking information to Etsy Members (via email, text or otherwise) unless expressly authorized in writing by Etsy
- ❌ **NO Excessive Data Requests**: Cannot request more than the minimum amount of data needed from Etsy API to provide intended Application services
- ❌ **NO Data Commercialization**: Cannot transfer or commercialize access to Etsy API, API credentials, or Etsy Member content or data to any third party
- ❌ **NO Internal System Access**: Cannot use Etsy API in manner unrelated to Etsy Member activity, such as to obtain information about Etsy's internal systems and processes
- ❌ **NO Fake Reviews**: Cannot solicit, incentivize, or encourage reviews of any Application that are fake, misleading, or inaccurate (whether by offering compensation or otherwise)
- ❌ **NO Metric Manipulation**: Cannot engage in practices that manipulate or artificially inflate any Etsy shop's statistics or engagement metrics (ratings, reviews, viewership)
- ❌ **NO Fee Charging for Free Features**: Cannot charge Etsy sellers a fee to use or access any part of Application that integrates with Etsy API and that Etsy provides to sellers free of charge
- ❌ **NO Policy Violations**: Cannot develop Application that violates Terms or any Etsy policies (Prohibited Items Policy, Intellectual Property Policy, Anti-Discrimination Policy)
- ❌ **NO Unauthorized Scraping**: Cannot use or promote automated systems or browser extensions to access, analyze, or scrape Etsy Site, Etsy API or any Etsy data (listings, shops, user profiles) unless expressly authorized in writing by Etsy
- ❌ **NO AI Training Data Collection**: Cannot use Etsy API to collect, scan, or request Etsy content for purposes of analytics, machine learning, training artificial intelligence models, licensing, or content removal, unless expressly authorized in writing by Etsy

**Our Implementation**:
- ✅ We integrate with Etsy (not replace it)
- ✅ We use OAuth for authentication (not scraping)
- ⚠️ **ACTION REQUIRED**: Review any automated systems or scraping tools
- ⚠️ **ACTION REQUIRED**: Ensure we're not bypassing Etsy checkout
- ⚠️ **ACTION REQUIRED**: Verify we're not collecting data for AI/ML training purposes
- ⚠️ **ACTION REQUIRED**: Ensure we're not sending order/delivery tracking info without authorization
- ⚠️ **ACTION REQUIRED**: Review all data requests to ensure we're only requesting minimum necessary data

### 8. Privacy and Data Protection

**Requirements**:
- ⚠️ **Service Provider Role**: With respect to Etsy Member personal information accessed via API, you act as service provider to applicable Etsy seller
- ⚠️ **Data Processing**: Must process Etsy Member personal information only to fulfill services under Application Terms between you and Etsy seller
- ⚠️ **Application Terms**: Must have executed Application Terms with each Etsy seller that comply with all applicable privacy laws
- ⚠️ **Privacy Law Compliance**: Must process Etsy Member personal information in accordance with Application Terms and all applicable privacy laws
- ⚠️ **Transparency**: Must transparently inform Etsy sellers about:
  - Information collected by Application
  - How information is used, stored, secured, and disclosed
  - Controls sellers have over use, sharing and access of their information
- ⚠️ **Data Breach Notification**: 
  - Must notify Etsy at **dpo@etsy.com** within **24 hours** of discovery
  - Must notify Etsy seller within **24 hours** of discovery
  - Applies to any compromise or suspected compromise of Etsy Member data accessed via API

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Ensure privacy policy covers Etsy data processing
- ⚠️ **ACTION REQUIRED**: Implement data breach notification process (24-hour requirement)
- ⚠️ **ACTION REQUIRED**: Document data processing practices
- ⚠️ **ACTION REQUIRED**: Ensure Application Terms with each seller comply with privacy laws

### 9. Application Discontinuation

**Requirements**:
- ⚠️ **Notice Period**: Must provide at least **30 days** prior written notice to Etsy and Etsy sellers using Application ("Withdrawal Notice Period") before discontinuing or withdrawing Application
- ⚠️ **Shorter Period**: Etsy may, at its sole discretion, agree to shorter Withdrawal Notice Period
- ⚠️ **Immediate Termination**: Etsy may determine that immediate suspension or termination of Application's access to Etsy API is necessary
- ⚠️ **Support During Notice**: During Withdrawal Notice Period, must:
  - Maintain Application
  - Provide support to Etsy sellers using Application
  - Provide transitional services to Etsy sellers
- ⚠️ **Access Termination**: Upon effective date of discontinuation or withdrawal, Etsy API access associated with Application will be terminated
- ⚠️ **Enterprise Applications**: If Application is Enterprise Application, discontinuation and withdrawal requirements governed by Enterprise Tier Terms

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Document discontinuation process
- ⚠️ **ACTION REQUIRED**: Plan for graceful shutdown with proper notice (minimum 30 days)
- ⚠️ **ACTION REQUIRED**: Plan for support and transition services during notice period

### 10. Dormant Applications

- ⚠️ **Inactivity Rule**: If Application has not made a successful call to Etsy API for **6 consecutive months**, Etsy reserves right to suspend Application's access and/or our access to Etsy API
- ⚠️ **Re-enable Request**: To request that access be re-enabled, may contact developer@etsy.com

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Ensure regular API usage (at least one successful call every 6 months)
- ⚠️ **ACTION REQUIRED**: Implement keep-alive mechanism if Application may have periods of inactivity
- ⚠️ **ACTION REQUIRED**: Monitor Application activity to prevent dormancy

### 11. Quality Standards

**App Quality Standards**:
Etsy reserves right to take action (including suspending or terminating access to Etsy API and off-boarding Application) if Etsy determines, in its sole discretion, that Application does not meet acceptable quality standards. Determination may be based on:

- **Repeated Complaints**: Repeated complaints from Etsy Members regarding:
  - Application's functionality
  - Performance
  - User experience
  - Security
  - Compliance with API Terms, Etsy Terms, Application Terms or Etsy policies
- **Failure to Operate**: Failure of Application to operate as described to Etsy or as advertised
- **Technical Issues**: Application causing technical or instability issues on Etsy platform or for Etsy Members
- **Prohibited Use**: Application's use is prohibited under Section 5 (Use of the Etsy API)

**Suspension and Termination Process**:
- ⚠️ **High-Quality Requirement**: Maintaining high-quality Application that provides positive experience for Etsy Members is continual requirement for access to Etsy API
- ⚠️ **Notification**: Etsy may, but is not obligated to, notify us of quality concerns and provide period to remediate
- ⚠️ **Severe Violations**: If violations or quality concerns are severe or pose immediate risk, Etsy may suspend or terminate immediately
- ⚠️ **Final Decision**: Etsy's decision regarding Application's quality and any resulting action is final and binding

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Monitor application quality and user feedback continuously
- ⚠️ **ACTION REQUIRED**: Implement error tracking and logging
- ⚠️ **ACTION REQUIRED**: Regular testing and quality assurance
- ⚠️ **ACTION REQUIRED**: Address user complaints promptly
- ⚠️ **ACTION REQUIRED**: Ensure Application operates as described
- ⚠️ **ACTION REQUIRED**: Monitor for technical issues affecting Etsy platform or Members

### 12. Fees and Invoicing

- ✅ **Our Responsibility**: We are solely responsible for invoicing and collecting fees from Application users
- ✅ **Etsy Not Responsible**: Etsy bears no responsibility for charging fees or taxes

### 13. Indemnification and Liability

**Indemnification Obligations**:
- ⚠️ **Defend and Indemnify**: If Etsy is sued or receives any claim, notice, inquiry, or demand arising from or relating to:
  - Our Developer Account
  - Our Application(s)
  - Our use of Etsy API (including use under Enterprise Tier)
  - Our violation of API Terms (including Enterprise Tier Terms where applicable)
- ⚠️ **Scope**: We agree to defend and indemnify Etsy against all resulting liability, damages, costs, expenses, and lawyers' fees
- ⚠️ **Full Scope**: Full scope of indemnification obligations detailed in Section 9 of Etsy Terms

**Release and Waiver**:
- ⚠️ **Waiver**: We waive any claims against Etsy and Etsy Members
- ⚠️ **Release**: We fully release Etsy and Etsy Members from any claims related to:
  - Intellectual property
  - Data breach
  - Security
  - Data protection
  - Arising from or related to Application's use of Etsy API
  - Including access to Enterprise Tier and interaction of Application with Etsy or Etsy Services

**Intellectual Property Claims**:
- ⚠️ **No Claims Against Etsy**: We agree not to bring or assist any third party in bringing any intellectual property infringement claim against Etsy or Etsy Members related to:
  - Our use of and access to Etsy API
  - Interaction of Application with Etsy or Etsy Services
- ⚠️ **Clarification**: This paragraph pertains solely to use of and access to Etsy API and does not extend to unrelated content within Application or any Etsy shop we may control

**Limitation of Liability**:
- ⚠️ **Etsy Terms Apply**: Limitations of liability set forth in Etsy Terms apply to our use of Etsy API
- ⚠️ **Reference**: See Section 8 (limitation of liability) and Section 11 (arbitration) of Etsy Terms

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Review insurance coverage and legal protections
- ⚠️ **ACTION REQUIRED**: Understand full scope of indemnification obligations
- ⚠️ **ACTION REQUIRED**: Review Etsy Terms Sections 8, 9, 11, and 12 for complete liability and dispute resolution terms

### 14. Feedback

- ✅ **Ownership**: Etsy exclusively owns all rights to Feedback we submit, including related intellectual property rights
- ✅ **Assignment**: We assign all right, title, or interest in Feedback to Etsy
- ✅ **Non-Confidential**: All Feedback treated as non-confidential and non-proprietary
- ⚠️ **No Confidential Feedback**: Must not provide Feedback that we consider confidential or proprietary

### 15. Rights Granted to Etsy

**License We Grant**:
- ⚠️ **Non-Exclusive License**: We grant Etsy a non-exclusive, worldwide, royalty-free, irrevocable, sub-licensable, perpetual license to:
  - Use, display, edit, modify, reproduce, publicly display and perform, distribute, store, and prepare derivative works
  - Of any data or information we provide or transmit to Etsy in connection with Etsy API
- ⚠️ **Purpose**: This allows Etsy to provide and improve Etsy API, display information to Etsy Members in connection with Application, and for Etsy's uses and purposes set forth in Privacy Policy

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Understand that any data we send to Etsy via API grants these rights to Etsy

### 16. Commercial Use

**Requirements**:
- ✅ **Permitted**: Etsy provides Etsy API to enable developers to create Applications that may have commercial uses
- ⚠️ **Etsy Discretion**: Etsy, in its sole discretion, may prohibit any commercial use it deems inappropriate or non-compliant
- ⚠️ **Uncertainty**: If uncertain whether intended commercial use is permitted, must contact developer@etsy.com

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: If using for commercial purposes, verify compliance and consider contacting Etsy if uncertain

### 17. Members' Content Ownership

**Important Clarification**:
- ✅ **Member Ownership**: Etsy Members, not Etsy, own the content they create
- ⚠️ **Respect IP Rights**: Must respect Etsy Members' intellectual property rights in their content

### 18. API Changes and Updates

**Requirements**:
- ⚠️ **Etsy's Right**: Etsy reserves right to change, update, suspend, or discontinue Etsy API, in whole or in part, at any time and for any reason, with or without notice
- ⚠️ **Changes May Include**: Modifying pricing, access, or usage; adding, removing or limiting access to specific API features; updating technical requirements
- ⚠️ **Our Responsibility**: 
  - Must implement and use most current version of Etsy API
  - May require installing or updating software to continue using Etsy API
  - Must make necessary changes to Application at our own cost
- ⚠️ **No Liability**: Etsy will not be liable for any impact changes may have on Application, including effects on revenue generation
- ⚠️ **Acceptance**: Continued use of Etsy API following update constitutes acceptance of update

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Monitor Etsy API updates and changes
- ⚠️ **ACTION REQUIRED**: Plan for API changes and version updates
- ⚠️ **ACTION REQUIRED**: Test Application after Etsy API updates

### 19. Non-Exclusive Relationship

**Important Clarification**:
- ✅ **Non-Exclusive**: All rights granted and obligations due under API Terms are non-exclusive
- ✅ **No Restriction**: Nothing in API Terms prohibits either party from engaging in or participating in business arrangements similar to or competitive with those described
- ✅ **No Agency**: Under API Terms, we are not Etsy's agent, representative or employee
- ✅ **No Partnership**: API Terms do not create or evidence any association, joint venture, partnership, or franchise between parties
- ✅ **No Franchise Obligations**: API Terms do not impose any partnership or franchisor obligation or liability on either party

### 20. Modifications to API Terms

**Requirements**:
- ⚠️ **Etsy's Right**: Etsy may update API Terms from time to time, including adding new terms and deleting existing terms
- ⚠️ **Material Changes**: If changes are material, Etsy will notify in advance via email or notice to Developer Account
- ⚠️ **Acceptance**: Use of Etsy API after effective date of changes constitutes acceptance of updated API Terms
- ⚠️ **Rejection**: If we do not agree with changes, must immediately stop using Etsy API and close Developer Account
- ⚠️ **Other Amendments**: No other amendment or modification is effective unless in writing and signed by both parties

**Our Implementation**:
- ⚠️ **ACTION REQUIRED**: Monitor email and Developer Account for API Terms updates
- ⚠️ **ACTION REQUIRED**: Review and accept updated terms or discontinue use if not acceptable

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

## Additional Legal Points

### Separate Written Agreements
- If Etsy and we enter into separate written agreement regarding Etsy API, terms of that agreement control solely to extent of any direct conflict with API Terms

### Severability
- If any part of API Terms is found invalid or unenforceable, that part will be limited to minimum extent necessary and severed so API Terms remain in full force and effect

### Waiver
- Etsy's failure to enforce any part of API Terms is not waiver of right to later enforce that or any other part

### Assignment
- Etsy may assign any of its rights and obligations under API Terms

### Arbitration and Dispute Resolution
- **Section 11 of Etsy Terms** (for North and South America): Contains binding arbitration agreement and class action waiver
- **Section 12 of Etsy Terms** (rest of world): Contains dispute resolution provisions
- By agreeing to Terms, we and Etsy agree to submit disputes exclusively to individual arbitration (not court), except in limited circumstances described in Section 11
- Please note: Section 11 explains how we may be able to opt out of arbitration

## Last Updated

This compliance guide was created based on Etsy API Terms of Use last updated: June 16, 2025

**Document Status**: Comprehensive review completed against full Etsy API Terms of Use document
