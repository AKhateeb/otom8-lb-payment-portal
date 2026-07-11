import { appConfig } from '@/config/appConfig'
import { apiClient } from './apiClient'
import { executeRecaptcha } from './recaptchaService'

const unwrapData = (body) => body?.data?.data || body?.data || body || {}
const listData = (body) => {
  const data = body?.data?.data ?? body?.data
  return Array.isArray(data) ? data : []
}

const formatMoney = (value) => Number.parseFloat(Number(value || 0).toFixed(2))

function planDuration(days, lang) {
  const isArabic = lang === 'ar'
  if (days >= 365) return isArabic ? 'سنة واحدة' : '1 year'
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30
    if (isArabic) return months === 1 ? 'شهر واحد' : `${months} أشهر`
    return months === 1 ? '1 month' : `${months} months`
  }
  return isArabic ? `${days} يوم` : `${days} days`
}

function basePlanName(name, lang) {
  const fallback = lang === 'ar' ? 'الباقة الأساسية' : 'Basic Plan'
  return String(name || fallback).replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export async function getPlans(lang = 'en') {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US'
  const response = await apiClient.get(appConfig.payment.endpoints.plans(locale))
  const rows = listData(response)
  return rows
    .map((row) => {
      const currentValue = Number(row.current_value || 0)
      const previousValue = Number(row.previous_value || 0)
      const translatedName = Array.isArray(row.tr) ? row.tr[0]?.name : ''
      const renewInDays = Number(row.renew_in_days || 0)

      return {
        id: String(row.id),
        planId: row.id,
        name: basePlanName(translatedName, lang),
        renewInDays,
        durationLabel: planDuration(renewInDays, lang),
        months: renewInDays >= 365 ? 12 : Math.max(1, Math.round(renewInDays / 30)),
        amount: formatMoney(currentValue),
        oldAmount: previousValue > currentValue ? formatMoney(previousValue) : 0,
      }
    })
    .filter((plan) => Number(plan.amount) > 0)
}

export async function createDraftPayment({ amount, method, registeredPhone, senderPhone }) {
  const recaptchaToken = await executeRecaptcha()
  const response = await apiClient.post('/pay/sms-units', {
    method,
    amount,
    user_phone: registeredPhone,
    sender_phone: senderPhone || registeredPhone,
    recaptcha_token: recaptchaToken,
  })
  const data = unwrapData(response)
  return { ...data, id: data.payment_id || data.id }
}

export async function createWhishPayment({ amount, registeredPhone }) {
  const recaptchaToken = await executeRecaptcha()
  const response = await apiClient.post(appConfig.payment.endpoints.createWhish, {
    amount: formatMoney(amount),
    currency: appConfig.payment.currency,
    user_phone: registeredPhone,
    recaptcha_token: recaptchaToken,
    debug_mode: appConfig.isDebug && appConfig.debugWhishSimulationEnabled,
  })
  const data = unwrapData(response)
  return data.payment_id || data.paymentId || data.id ? data : { id: data }
}

export async function simulateWhishSuccess(paymentId, simulationToken) {
  const response = await apiClient.post(appConfig.payment.endpoints.debugWhishSuccess(paymentId), {
    simulation_token: simulationToken,
  })
  return unwrapData(response)
}

export async function getPaymentStatus(paymentId) {
  const response = await apiClient.get(appConfig.payment.endpoints.paymentDetails(paymentId), {
    params: { _t: Date.now() },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  })
  const data = unwrapData(response)
  return Array.isArray(data) ? data[0] || {} : data
}

export async function confirmPayment(paymentId) {
  const response = await apiClient.patch(appConfig.payment.endpoints.confirmPayment(paymentId), {
    status: 'confirmed',
  })
  return unwrapData(response)
}

export async function checkPromoCode(code) {
  const recaptchaToken = await executeRecaptcha()
  const response = await apiClient.post(appConfig.payment.endpoints.promoCheck, {
    promocode: code.trim().toUpperCase(),
    recaptcha_token: recaptchaToken,
  })
  return unwrapData(response)
}

export async function consumePromoCode(promoCodeId, registeredPhone, consumeProof) {
  const payload = {
    promocode_id: promoCodeId,
    user_phone: registeredPhone,
  }
  if (consumeProof) {
    payload.consume_proof = consumeProof
  } else {
    payload.recaptcha_token = await executeRecaptcha()
  }
  const response = await apiClient.post(appConfig.payment.endpoints.promoConsume, payload)
  return unwrapData(response)
}

export async function postDebugSmsWebhook({ carrier, amount, senderPhone }) {
  const normalizedAmount = Number.parseFloat(Number(amount || 0).toFixed(2))
  const formattedAmount = normalizedAmount.toFixed(1)
  const reference = `debug-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const response = await apiClient.post(
    appConfig.payment.endpoints.smsWebhook,
    {
      date_sms_received: new Date().toISOString(),
      mobile_operator: carrier.operator,
      amount: normalizedAmount,
      phone_number: senderPhone,
      raw_text: `Dear customer, $${formattedAmount} were transferred to your balance from the mobile number ${senderPhone}.`,
      reference,
    },
    { headers: { Authorization: `Bearer ${appConfig.payment.smsWebhookToken}` } },
  )
  return unwrapData(response)
}

export function isSuccessStatus(status) {
  return ['validated', 'completed', 'paid', 'success', 'succeeded', 'confirmed'].includes(String(status || '').toLowerCase())
}

export function isFailedStatus(status) {
  return ['failed', 'failure', 'declined', 'cancelled', 'canceled', 'rejected', 'expired', 'void'].includes(String(status || '').toLowerCase())
}
