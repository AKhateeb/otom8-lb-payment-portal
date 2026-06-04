import confetti from 'canvas-confetti'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { appConfig } from '@/config/appConfig'
import { describeApiError } from '@/services/apiClient'
import * as payments from '@/services/paymentService'
import { dictionary, detectLanguage } from '@/utils/i18n'
import { digitsOnly, isLebanesePhone, normalizePhone } from '@/utils/phone'

const fallbackBundles = [
  { id: '3_1', amount: 3, credits: 1 },
  { id: '9_3', amount: 9, credits: 3 },
  { id: '18_6', amount: 18, credits: 6 },
]

const savedSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem('payment_portal_session') || '{}')
  } catch {
    return {}
  }
}

function buildSmsHref({ shortCode, receiver, amount }) {
  const body = `${digitsOnly(receiver)}t${Number(amount).toFixed(0)}`
  return `sms:${digitsOnly(shortCode)}?body=${encodeURIComponent(body)}`
}

export const usePortalStore = defineStore('portal', () => {
  const lang = ref(detectLanguage())
  const session = ref(savedSession())
  const currentStep = ref(session.value.currentStep || 'welcome')
  const registeredPhone = ref(session.value.registeredPhone || '')
  const senderPhone = ref(session.value.senderPhone || '')
  const useSamePhone = ref(true)
  const selectedMethod = ref(null)
  const selectedBundle = ref(null)
  const promoCode = ref('')
  const bundles = ref([])
  const payment = ref(null)
  const loading = ref(false)
  const loadingMessage = ref('')
  const error = ref('')
  const debugEvents = ref([])
  const success = ref(false)

  const hasDirtyInput = computed(() => Boolean(registeredPhone.value || selectedMethod.value || selectedBundle.value || promoCode.value))
  const isRtl = computed(() => lang.value === 'ar')
  const t = computed(() => dictionary[lang.value] || dictionary.en)

  const steps = ['welcome', 'phone', 'method', 'bundle', 'details', 'summary', 'success']
  const progress = computed(() => Math.max(6, ((steps.indexOf(currentStep.value) + 1) / steps.length) * 100))

  const methods = computed(() => [
    {
      id: 'whish',
      type: 'whish',
      title: lang.value === 'ar' ? 'Whish' : 'Whish Pay',
      subtitle: lang.value === 'ar' ? 'افتح صفحة Whish وأكمل الدفع بالـ OTP.' : 'Open Whish and complete payment with OTP.',
      icon: '/assets/payment/whish.webp',
    },
    {
      id: 'alfa',
      type: 'sms',
      carrier: appConfig.payment.carriers.alfa,
      title: appConfig.payment.carriers.alfa[lang.value === 'ar' ? 'titleAr' : 'title'],
      subtitle: lang.value === 'ar' ? 'افتح الرسائل وأرسل رصيد ألفا.' : 'Open SMS and send Alfa credit.',
      icon: '/assets/payment/alfa.webp',
    },
    {
      id: 'touch',
      type: 'sms',
      carrier: appConfig.payment.carriers.touch,
      title: appConfig.payment.carriers.touch[lang.value === 'ar' ? 'titleAr' : 'title'],
      subtitle: lang.value === 'ar' ? 'افتح الرسائل وأرسل وحدات تاتش.' : 'Open SMS and send Touch units.',
      icon: '/assets/payment/touch.webp',
    },
    {
      id: 'promocode',
      type: 'promo',
      title: lang.value === 'ar' ? 'كود تفعيل' : 'Activation code',
      subtitle: lang.value === 'ar' ? 'أدخل الكود ثم فعّل الحساب.' : 'Enter the code and activate the account.',
      icon: '/assets/payment/coupon.webp',
    },
  ])

  function persist() {
    sessionStorage.setItem(
      'payment_portal_session',
      JSON.stringify({
        currentStep: currentStep.value,
        registeredPhone: registeredPhone.value,
      }),
    )
  }

  function pushDebug(label, detail = {}) {
    if (!appConfig.isDebug) return
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toLocaleTimeString(),
      label,
      detail,
    }
    debugEvents.value.unshift(entry)
    debugEvents.value = debugEvents.value.slice(0, 8)
    console.info(`[PaymentPortal] ${label}`, detail)
  }

  function setLoading(value, message = '') {
    loading.value = value
    loadingMessage.value = value ? message : ''
  }

  function setStep(step) {
    currentStep.value = step
    persist()
  }

  function setApiError(label, apiError, fallbackMessage = t.value.friendlyError) {
    const details = describeApiError(apiError)
    pushDebug(label, details)
    if (details.status === 403 && label.toLowerCase().includes('status')) {
      error.value = t.value.statusForbidden
      return
    }
    error.value = `${fallbackMessage}${appConfig.isDebug && details.status ? ` (${details.status}: ${details.backendMessage})` : ''}`
  }

  function validateRegisteredPhone(input) {
    const normalized = normalizePhone(input)
    if (!normalized.valid) {
      error.value = t.value.invalidPhone
      return false
    }
    registeredPhone.value = normalized.e164
    if (useSamePhone.value) senderPhone.value = normalized.e164
    error.value = ''
    persist()
    return true
  }

  function validateSenderPhone(input) {
    const normalized = normalizePhone(input)
    if (!normalized.valid) {
      error.value = t.value.invalidPhone
      return false
    }
    if (selectedMethod.value?.type === 'sms' && !isLebanesePhone(normalized.e164) && !appConfig.isDebug) {
      error.value = t.value.lebaneseOnly
      return false
    }
    senderPhone.value = normalized.e164
    error.value = ''
    return true
  }

  async function loadBundles() {
    if (bundles.value.length) return
    setLoading(true, t.value.loadingBundles)
    error.value = ''
    try {
      bundles.value = await payments.getBundles()
      pushDebug('bundles.loaded', { count: bundles.value.length })
      if (!bundles.value.length) bundles.value = fallbackBundles
    } catch (apiError) {
      bundles.value = fallbackBundles
      setApiError('bundles.failed_using_fallback', apiError, 'Could not read backend bundles. Showing default Smart Ads amounts.')
    } finally {
      setLoading(false)
    }
  }

  async function submitSummary() {
    error.value = ''
    if (selectedMethod.value.type === 'promo') {
      await submitPromo()
      return
    }
    if (selectedMethod.value.type === 'whish') {
      await submitWhish()
      return
    }
    await submitSmsUnits()
  }

  async function submitPromo() {
    setLoading(true, t.value.creatingPayment)
    try {
      await payments.consumePromoCode({ code: promoCode.value, registeredPhone: registeredPhone.value })
      completeSuccess()
    } catch (apiError) {
      setApiError('promo.consume.failed', apiError, t.value.codeInvalid)
    } finally {
      setLoading(false)
    }
  }

  async function submitWhish() {
    setLoading(true, t.value.openingWhish)
    try {
      const amount = Number(selectedBundle.value?.amount || appConfig.payment.monthlyPrice)
      const draft = await payments.createWhishPayment({ amount, registeredPhone: registeredPhone.value, bundleId: selectedBundle.value?.id })
      const paymentId = draft.payment_id || draft.paymentId || draft.id
      if (!paymentId) throw new Error('Whish did not return payment_id')

      const link = draft.payment_link || draft.payment_url || (await payments.getWhishPaymentLink(paymentId))
      payment.value = { id: paymentId, status: 'pending', link }
      pushDebug('whish.created', { paymentId, link })
      if (link) window.open(link, '_blank', 'noopener,noreferrer')
      setStep('details')
      pollPayment(paymentId)
    } catch (apiError) {
      setApiError('whish.create.failed', apiError, 'Could not create the Whish payment.')
    } finally {
      setLoading(false)
    }
  }

  async function submitSmsUnits() {
    setLoading(true, t.value.creatingPayment)
    try {
      const amount = Number(selectedBundle.value?.amount || appConfig.payment.monthlyPrice)
      const draft = await payments.createDraftPayment({
        amount,
        method: selectedMethod.value.carrier.method,
        registeredPhone: registeredPhone.value,
        senderPhone: senderPhone.value,
        bundleId: selectedBundle.value?.id,
      })
      const href = buildSmsHref({
        shortCode: selectedMethod.value.carrier.shortCode,
        receiver: selectedMethod.value.carrier.receiver,
        amount,
      })
      payment.value = { ...draft, id: draft.id, smsHref: href, status: draft.status || 'draft' }
      pushDebug('sms.draft.created', { paymentId: draft.id, smsHref: href })
      setStep('details')
      window.location.href = href
    } catch (apiError) {
      setApiError('sms.draft.failed', apiError, 'Could not create the SMS payment request.')
    } finally {
      setLoading(false)
    }
  }

  function openSmsAppAgain() {
    if (!payment.value?.smsHref) return
    pushDebug('sms.open_again', { smsHref: payment.value.smsHref })
    window.location.href = payment.value.smsHref
  }

  async function sendSmsDebugWebhook() {
    if (!appConfig.debugSmsWebhookEnabled || !selectedMethod.value?.carrier) return
    setLoading(true, 'Sending debug SMS webhook...')
    try {
      await payments.postDebugSmsWebhook({
        carrier: selectedMethod.value.carrier,
        amount: Number(selectedBundle.value?.amount || appConfig.payment.monthlyPrice),
        senderPhone: senderPhone.value,
      })
      pushDebug('sms.webhook.sent', { senderPhone: senderPhone.value })
    } catch (apiError) {
      setApiError('sms.webhook.failed', apiError, 'Debug webhook failed.')
    } finally {
      setLoading(false)
    }
  }

  async function checkCurrentPayment() {
    if (!payment.value?.id) {
      error.value = t.value.paymentPending
      return
    }
    setLoading(true, t.value.checkingPayment)
    try {
      const latest = await payments.getPaymentStatus(payment.value.id)
      payment.value = { ...payment.value, ...latest }
      pushDebug('payment.status', latest)
      if (payments.isSuccessStatus(latest.status)) {
        await payments.confirmPayment(latest.id).catch((apiError) => pushDebug('payment.confirm.failed', describeApiError(apiError)))
        completeSuccess()
      } else if (payments.isFailedStatus(latest.status)) {
        error.value = t.value.friendlyError
      } else {
        error.value = t.value.paymentPending
      }
    } catch (apiError) {
      setApiError('payment.status.failed', apiError, t.value.paymentPending)
    } finally {
      setLoading(false)
    }
  }

  function pollPayment(paymentId) {
    if (!paymentId) return
    let count = 0
    const timer = window.setInterval(async () => {
      count += 1
      try {
        const latest = await payments.getPaymentStatus(paymentId)
        payment.value = { ...payment.value, ...latest }
        if (payments.isSuccessStatus(latest.status)) {
          window.clearInterval(timer)
          await payments.confirmPayment(latest.id).catch((apiError) => pushDebug('payment.confirm.failed', describeApiError(apiError)))
          completeSuccess()
        }
        if (payments.isFailedStatus(latest.status) || count > appConfig.payment.maxWhishPolls) {
          window.clearInterval(timer)
        }
      } catch (apiError) {
        pushDebug('payment.poll.failed', describeApiError(apiError))
        if (count > appConfig.payment.maxWhishPolls) window.clearInterval(timer)
      }
    }, appConfig.payment.whishPollMs)
  }

  function completeSuccess() {
    success.value = true
    setStep('success')
    sessionStorage.removeItem('payment_portal_session')
    confetti({ particleCount: 140, spread: 78, origin: { y: 0.62 } })
  }

  function reset() {
    sessionStorage.removeItem('payment_portal_session')
    currentStep.value = 'welcome'
    registeredPhone.value = ''
    senderPhone.value = ''
    selectedMethod.value = null
    selectedBundle.value = null
    promoCode.value = ''
    payment.value = null
    error.value = ''
    debugEvents.value = []
    success.value = false
  }

  return {
    lang,
    isRtl,
    t,
    currentStep,
    progress,
    registeredPhone,
    senderPhone,
    useSamePhone,
    selectedMethod,
    selectedBundle,
    promoCode,
    bundles,
    methods,
    payment,
    loading,
    loadingMessage,
    error,
    debugEvents,
    success,
    hasDirtyInput,
    setStep,
    validateRegisteredPhone,
    validateSenderPhone,
    loadBundles,
    submitSummary,
    openSmsAppAgain,
    sendSmsDebugWebhook,
    checkCurrentPayment,
    completeSuccess,
    reset,
  }
})
