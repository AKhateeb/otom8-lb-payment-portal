# Payment Portal Architecture

## Purpose

This portal is a focused client-side payment flow intended to be deployed on Firebase Hosting, usually under `pay.smartads-lb.com`. It collects enough information to associate a payment with a Smart Ads user phone and then delegates validation to the backend payment endpoints.

## Stack

- Vue 3 Composition API
- Vite CSR
- Vue Router
- Pinia
- Axios
- Tailwind CSS v4
- Firebase Hosting
- `libphonenumber-js` for international phone parsing
- `canvas-confetti` for the success state

## Main Files

- `src/config/appConfig.js`: single source for app identity, colors, backend URLs, token, debug flags, SMS carrier config, and Firebase values.
- `src/stores/portalStore.js`: wizard state, validation, payment orchestration, polling, success handling, and session persistence.
- `src/services/paymentService.js`: Directus/Ejet-compatible payment API calls.
- `src/views/PortalView.vue`: shell layout, progress, language direction, and route-level unsaved-data warning.
- `src/views/steps/*`: focused wizard steps.

## Auth Model

There is no OTP login in this portal. The portal uses a configured backend token for payment operations and sends the user-entered registered phone as payload metadata:

- `user_phone`
- `phone_number`
- `sender_phone` for SMS unit transfers

The route guard prevents direct wizard access without a captured phone in session state, but it is not user authentication.

Important: in a Vite CSR app, `VITE_*` values are visible to browser users. The payment token must be limited server-side to only the actions this portal needs.

## Payment Methods

Cash agents are intentionally excluded.

Whish:

1. Create Whish payment through `POST /pay/whish`.
2. Resolve hosted link from response or payment record.
3. Open link in a new tab.
4. Poll `/items/payment/:id`.
5. On success, patch payment status to confirmed and show success.

SMS units:

1. Validate registered and sender phones.
2. Production requires Lebanese sender numbers.
3. Create draft payment in `/items/payment`.
4. Show SMS shortcode/message instructions.
5. Allow manual payment checks through `/items/payment/:id`.
6. Debug mode can call `/sms-gateway/webhook` with the provided token.

Promo code:

1. Capture and sanitize code.
2. Consume through `/promocode/consume/`.
3. Show success when the backend accepts it.

## Error Handling

The Axios layer maps raw backend status codes such as 400, 401, 403, 404, 500, 502, and 503 into friendly UI messages. Step-level validation shows clear inline alerts in the portal card.

## Localization

The app detects `navigator.language`. Arabic browsers get Arabic and RTL direction; all other browser languages fall back to English. Users can toggle EN/AR manually from the header.

## Deployment

Firebase Hosting serves `dist` and rewrites all routes to `index.html`.

```bash
npm run build
firebase deploy
```
