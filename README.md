# Ejet Payment Portal

Vue 3 CSR payment portal for Ejet Elkahraba subscriptions.

## Quick Start

```bash
npm install
npm run dev
npm run build
```

Local URL:

```text
http://127.0.0.1:5173/
```

## Configuration

Edit `.env` for sandbox and `.env.production` for live deploys.

- `VITE_DIRECTUS_API_URL`: Ejet Directus/API base URL.
- `VITE_PAYMENT_API_TOKEN`: shared payment token used by this portal.
- `VITE_APP_ENV`: `debug` or `production`.
- `VITE_ENABLE_DEBUG_SMS_WEBHOOK`: enables local SMS webhook testing in debug.
- `VITE_ENABLE_DEBUG_WHISH_SIMULATION`: pauses after Whish payment creation and shows debug-only gateway/success simulation actions.
- `VITE_ENABLE_CARRIER_DETECTION`: `true` filters SMS units to the detected carrier; `false` shows Alfa and Touch.
- `VITE_SHOW_PAYMENT_SUMMARY`: `true` shows the review step; `false` goes straight to payment.
- `VITE_RECAPTCHA_SITE_KEY`: Google invisible reCAPTCHA v2 site key. The secret key belongs only in the backend.

This portal has no OTP auth and does not query Directus users by phone. It submits the entered account phone to the payment endpoint, which validates whether payment can proceed.

## Payment Flow

- Plans are read from `/items/plan`.
- Whish creates a payment and opens the returned `payment_link` as a full-page handoff because Whish blocks cross-domain iframe embedding.
- SMS units create a draft payment using the entered account phone and open the native `sms:` app in `$3` chunks.
- Promo codes are checked, then consumed through the backend.

Detailed notes live in [docs/payment-portal.md](docs/payment-portal.md).
