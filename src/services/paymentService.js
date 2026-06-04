import { appConfig } from '@/config/appConfig'
import { apiClient } from './apiClient'

const unwrapData = (body) => body?.data?.data || body?.data || body || {}
const listData = (body) => {
  const data = body?.data?.data ?? body?.data
  return Array.isArray(data) ? data : []
}

export async function getBundles() {
  const response = await apiClient.get(appConfig.payment.endpoints.bundles)
  return listData(response).filter((bundle) => Number(bundle.amount) > 0 && Number(bundle.credits) > 0)
}

export async function createDraftPayment({ amount, method, registeredPhone, senderPhone, bundleId }) {
  const response = await apiClient.post(appConfig.payment.endpoints.draftPayment, {
    method,
    amount,
    currency: appConfig.payment.currency,
    user_phone: registeredPhone,
    phone_number: registeredPhone,
    sender_phone: senderPhone || registeredPhone,
    bundle: bundleId || null,
    source: appConfig.payment.promoSource,
    status: 'draft',
  })
  return unwrapData(response)
}

export async function createWhishPayment({ amount, registeredPhone, bundleId }) {
  const response = await apiClient.post(appConfig.payment.endpoints.createWhish, {
    amount,
    currency: appConfig.payment.currency,
    user_phone: registeredPhone,
    phone_number: registeredPhone,
    bundle: bundleId || null,
    source: appConfig.payment.promoSource,
  })
  const data = unwrapData(response)
  return data.payment_id || data.paymentId || data.id ? data : { id: data }
}

export async function getWhishPaymentLink(paymentId) {
  const response = await apiClient.get(appConfig.payment.endpoints.whishLink(paymentId))
  const data = unwrapData(response)
  return data.payment_link || data.payment_url || data.url || data.link || `${appConfig.whishBaseUrl}/pay/whish?payment_id=${encodeURIComponent(paymentId)}`
}

export async function getPaymentStatus(paymentId) {
  const response = await apiClient.get(appConfig.payment.endpoints.paymentDetails(paymentId))
  return unwrapData(response)
}

export async function confirmPayment(paymentId) {
  const response = await apiClient.patch(
    `/items/payment/${encodeURIComponent(paymentId)}?fields=id,status,confirmed_at,validated_at,amount,amount_collected`,
    { status: 'confirmed' },
  )
  return unwrapData(response)
}

export async function checkPromoCode(code) {
  const response = await apiClient.post('/promocode/check/', { promocode: code.trim().toUpperCase() })
  return unwrapData(response)
}

export async function consumePromoCode({ code, registeredPhone }) {
  const cleaned = code.trim().toUpperCase()
  const response = await apiClient.post(appConfig.payment.endpoints.promoConsume, {
    code: cleaned,
    promocode_id: cleaned,
    promo_code: cleaned,
    promocode: cleaned,
    source: appConfig.payment.promoSource,
    used_for: appConfig.payment.promoUsedFor,
    user_phone: registeredPhone,
    phone_number: registeredPhone,
  })
  return unwrapData(response)
}

export async function postDebugSmsWebhook({ carrier, amount, senderPhone }) {
  const response = await apiClient.post(
    appConfig.payment.endpoints.smsWebhook,
    {
      date_sms_received: new Date().toISOString(),
      mobile_operator: carrier.operator,
      amount,
      phone_number: senderPhone,
      raw_text: `Dear customer, $${Number(amount).toFixed(1)} were transferred to your balance from the mobile number ${senderPhone}.`,
      reference: `${Date.now()}`,
    },
    { headers: { Authorization: `Bearer ${appConfig.payment.smsWebhookToken}` } },
  )
  return unwrapData(response)
}

export function isSuccessStatus(status) {
  return ['validated', 'completed', 'paid', 'success', 'succeeded', 'confirmed'].includes(String(status || '').toLowerCase())
}

export function isFailedStatus(status) {
  return ['failed', 'failure', 'declined', 'cancelled', 'canceled', 'expired'].includes(String(status || '').toLowerCase())
}
