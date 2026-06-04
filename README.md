# Smart Ads Payment Portal

Vue 3 CSR payment-collection portal for Smart Ads, built with Vite, Pinia, Vue Router, Axios, Tailwind CSS, and Firebase Hosting.

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

Copy `.env.example` to `.env`, create `.env.production` for live deploys, and edit `src/config/appConfig.js`.

Important values:

- `VITE_DIRECTUS_API_URL`: payment/backend API base URL.
- `VITE_PAYMENT_API_TOKEN`: shared payment token used by this portal.
- `VITE_APP_ENV`: `debug` or `production`.
- `VITE_ENABLE_DEBUG_SMS_WEBHOOK`: enables local SMS webhook testing only in debug.
- `src/config/appConfig.js`: logo, names, colors, carrier shortcodes, Whish settings, and fallback pricing.

Because this is a CSR app, every `VITE_*` value is public in the built bundle. Keep the payment token tightly scoped on the backend.

## Payment Flow

The app does not use OTP auth. The user enters the phone registered in Smart Ads, chooses a payment method, confirms a summary, and the portal sends the registered phone in payment payloads. Whish opens the hosted payment page and polls payment status. SMS unit payments create a draft and can be checked manually. Promo codes are consumed through the backend.

Detailed architecture notes live in [docs/payment-portal.md](docs/payment-portal.md).
