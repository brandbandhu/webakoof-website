# Privyr CRM Lead Routing Setup

## 1) Get your Privyr webhook URL
1. In Privyr, go to `Account -> Integrations`.
2. Open the integration you want to receive website leads from.
3. Copy the webhook URL.

Expected format:

`https://www.privyr.com/api/v1/incoming-leads/<string_1>/<string_2>`

## 2) Configure it in your landing page
1. Open `march-offer-pune.html`.
2. Find `<body ... data-privyr-webhook="PASTE_PRIVYR_WEBHOOK_URL_HERE">`.
3. Replace `PASTE_PRIVYR_WEBHOOK_URL_HERE` with your real webhook URL.

## 3) Test end-to-end
1. Open `march-offer-pune.html` in browser.
2. Fill a form with valid high-intent answers.
3. Submit and confirm the success message.
4. Verify new lead appears in Privyr.

## 4) Payload your site sends
The forms submit as JSON with these top-level fields:
- `name` (required)
- `email`
- `phone`
- `display_name`
- `other_fields` (custom metadata like budget, timeline, intent score, source page)

## 5) Recommended production hardening
Direct webhook posting works fastest, but your URL is exposed in frontend source. For stronger security:
1. Create a backend endpoint (`/api/lead`) in a serverless function.
2. Store Privyr webhook URL as server-side secret.
3. Forward validated submissions from backend to Privyr.
4. Add bot checks (honeypot + rate limit + server-side validation).

---

Official Privyr references:
- https://www.privyr.com/help-center/webhook-api
- https://documenter.getpostman.com/view/7718817/2s93RXsW9Z
