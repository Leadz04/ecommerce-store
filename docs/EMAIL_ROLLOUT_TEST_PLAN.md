# Email Rollout Regression Test Plan

Use the checklist below to confirm every page and workflow reflects the restored support mailbox `testleadz04@gmail.com` while retaining the updated EverStyleCrafts branding and phone number.

---

## 1. Environment Setup
1. Ensure `.env.local` contains valid credentials for `EMAIL_USER` / `EMAIL_FROM` pointing to `testleadz04@gmail.com` (or the proxy service that relays to it).
2. Install dependencies if needed: `npm install`.
3. Start the dev server: `npm run dev`.
4. Clear browser cache to avoid stale HTML fragments.

---

## 2. Visual Spot Checks (Desktop + Mobile)
### Header / Footer
1. Navigate to `/`.
2. Confirm the header logo still reads “EverStyleCrafts”.
3. Open the mobile menu and scroll to the “Need help?” block — the email must be `testleadz04@gmail.com` and the phone `+923042158396`.
4. Scroll to the footer and verify the same contact information plus the Sialkot postal address.

### Marketing & Support Pages
For each page below, confirm both the hero copy and contact cards reference the EverStyleCrafts brand while the actionable email hyperlinks point to `testleadz04@gmail.com`.
| Page | URL | Section(s) to verify |
| --- | --- | --- |
| About | `/about` | Hero tagline + CTA |
| Contact | `/contact` | Quick-contact cards, Business Inquiries block, map section |
| FAQ | `/faq` | Header subtitle + “Still have questions?” CTA |
| Shipping | `/shipping` | Hero, free-shipping banner, final support CTA |
| Refund | `/refund` | “Quick Summary” alert + contact info section |
| Privacy | `/privacy` | Intro paragraph + contact panel near the bottom |
| Terms | `/terms` | Header blurb + contact panel |
| Cookies | `/cookies` | Intro paragraph + “Questions About Cookies?” CTA |
| Signup | `/signup` | Header (“Join EverStyleCrafts”) |

Record screenshots if any section still shows the old Wolveyes/ShopEase wording or email.

---

## 3. Functional Tests
### Contact Form End-to-End
1. Open `/contact`.
2. Fill out the form with a test subject/message and submit.
3. Expected results:
   - Success toast appears.
   - Inbound email arrives at `testleadz04@gmail.com` with subject prefix `Contact Form`.
   - Auto-responder sent to the form submitter references `testleadz04@gmail.com` in the “Need immediate assistance?” clause.

### Invoice Export
1. Authenticate with an account that can access `/api/orders/{orderId}/invoice`.
2. Download an invoice (or hit the API directly) and inspect the footer — it should say “For questions … contact us at testleadz04@gmail.com”.

### API + Template Smoke Test
Run the following commands (or hit the endpoints through the app) and inspect the resulting emails in the `testleadz04@gmail.com` inbox:
1. **Password reset** – trigger “Forgot password” and confirm the email copy still renders but uses the new brand name + correct reply-to.
2. **Registration welcome** – create a throwaway account and verify the welcome email subject/body no longer mentions ShopEase (pending template update) and is delivered to the new inbox if applicable.
3. **Newsletter subscribe** – submit the newsletter form and ensure admin notifications arrive at `testleadz04@gmail.com`.

*(If any template still references ShopEase, file a follow-up task to update `src/lib/emailTemplates.ts` before launch.)*

---

## 4. Configuration Audit
1. Open `src/data/companyInfo.ts` and confirm it lists:
   - `email: 'testleadz04@gmail.com'`
   - `phone: '+923042158396'`
   - Current address & shipping thresholds.
2. Grep the repository: `rg -n "abdulrehman67846@gmail.com" src` and `rg -n "ShopEase" src`.
   - Expect **zero** matches for the old mailbox.
   - Investigate any lingering “ShopEase” hits (mostly email templates) and log separate cleanup tickets if they should change.

---

## 5. Acceptance Criteria
- [ ] Every public-facing page displays the new support contact info.
- [ ] Contact form submissions and automated replies are delivered via `testleadz04@gmail.com`.
- [ ] Invoice PDFs and transactional copy no longer mention the retired email.
- [ ] Repository search shows no references to `abdulrehman67846@gmail.com`.
- [ ] QA sign-off captured with screenshots/logs in the deployment ticket.

Once all boxes are checked, the release is ready for production verification. Save this file as evidence in the deployment notes. 


