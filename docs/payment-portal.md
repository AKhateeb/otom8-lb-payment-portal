# Payment Portal Architecture

## Purpose

This portal is a focused Ejet Elkahraba app subscription payment flow. It collects the user account phone, reads the current plan table, and delegates account and payment validation to the Ejet backend.

## Stack

- Vue 3 Composition API
- Vite CSR
- Vue Router
- Pinia
- Axios
- Tailwind CSS v4
- Firebase Hosting
- Google invisible reCAPTCHA v2
- `libphonenumber-js`
- `canvas-confetti`

## Main Files

- `src/config/appConfig.js`: app identity, colors, backend URLs, token, plan/payment endpoints, carrier config, Firebase values.
- `src/stores/portalStore.js`: wizard state, phone validation, plan loading, payment orchestration, polling, success handling.
- `src/services/paymentService.js`: Directus/Ejet-compatible API calls.
- `src/views/PortalView.vue`: shell layout, progress, loading/error states, debug log.
- `src/views/steps/*`: focused wizard steps.

## Auth Model

There is no OTP auth in the portal. The configured shared token is used for payment operations. The frontend never queries `/users` by phone; it sends the account phone to `/pay` and relies on that endpoint to accept or reject the request without exposing a separate account-existence check.

Important: Vite exposes all `VITE_*` values in the built bundle. The backend token must remain tightly scoped.

## Bot Protection

Payment creation and promo-code validation execute invisible reCAPTCHA v2 in the browser and send the short-lived token to the Ejet backend. The backend verifies the token with Google, checks that its hostname is `pay.ejet-elkahraba.com`, and rejects payment creation when verification fails. The reCAPTCHA secret is stored only in the backend environment.

## Plans

The app reads `/items/plan?fields=id,current_value,previous_value,tr.name`. There are no credits or bundles in Ejet. The UI displays subscription periods based on the current plan value and Ejet month options.

## Payment Methods

Cash is intentionally excluded.

Wizard order:

1. Welcome and free-trial/subscription message.
2. Payment method selection.
3. Account phone resolution.
4. Plan selection for Whish and SMS units.
5. Payment phone for SMS units only; Whish collects the payer phone inside its gateway.
6. Optional summary controlled by `VITE_SHOW_PAYMENT_SUMMARY`.
7. Payment execution.
8. Success with `ejet://app` CTA.

Whish:

1. Show the inline Whish phone/OTP guide, with Next and Skip controls.
2. Create the payment through `POST /pay/whish` after the user finishes or skips the guide.
3. Read `payment_id` and `payment_link` from the create response.
4. Navigate the current page directly to `payment_link`; Whish sends `X-Frame-Options: SAMEORIGIN` and cannot be embedded cross-domain.
5. Let the Whish gateway own the payment fields, CTAs, and completion screens.

SMS units:

1. Detect Alfa/Touch from the account phone when `VITE_ENABLE_CARRIER_DETECTION=true`.
2. Create a draft payment through `POST /pay/sms-units` with `{ method, amount, user_phone, recaptcha_token }` when the payment screen opens.
3. On mobile, show one large Send Units button that opens the native SMS app with a `$3` chunk or the remaining amount.
4. On desktop, show the carrier SMS shortcode and exact message body in a clear two-step instruction card.
5. Show one I sent the units action to check backend progress on both mobile and desktop.
6. Keep the debug SMS webhook in the debug diagnostics panel, outside the production payment widget.
7. Show success after backend validation.

Promo code:

1. Check the code through `/promocode/check/` with the activation code and a reCAPTCHA token.
2. Consume with `{ promocode_id, user_phone, recaptcha_token }`.
3. Show success when the backend accepts it.

## Debugging

Debug mode shows API request/response details in the UI and can call `/sms-gateway/webhook` when `VITE_ENABLE_DEBUG_SMS_WEBHOOK=true`.

When `VITE_ENABLE_DEBUG_WHISH_SIMULATION=true`, the Whish flow pauses after reCAPTCHA verification and payment creation. For the configured test phone only, it shows:

1. **Simulate successful payment**, which calls the signed debug callback endpoint and then verifies the updated payment status.
2. **Open Whish payment page**, which continues to the real gateway.

Production builds keep `VITE_ENABLE_DEBUG_WHISH_SIMULATION=false` and redirect to Whish immediately after payment creation.
