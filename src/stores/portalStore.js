import confetti from 'canvas-confetti'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { appConfig } from '@/config/appConfig'
import { describeApiError } from '@/services/apiClient'
import * as payments from '@/services/paymentService'
import * as portalSettings from '@/services/settingsService'
import { dictionary, detectLanguage } from '@/utils/i18n'
import { carrierForPhone, digitsOnly, isLebanesePhone, normalizePhone } from '@/utils/phone'

const SMS_METHOD_KEYS = {
  alfa: 'alfa_units',
  touch: 'touch_units',
}

function normalizePaymentMethods(value) {
  let methods = value
  if (typeof methods === 'string') {
    try {
      methods = JSON.parse(methods)
    } catch {
      methods = methods.split(',')
    }
  }

  if (!Array.isArray(methods)) return []

  const normalized = methods
    .map((method) => String(method || '').trim())
    .filter(Boolean)

  return normalized
}

function settingValue(value, fallback) {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function buildEffectiveCarriers(settings, paymentMethods) {
  const patches = {
    alfa: {
      shortCode: settings?.alfa_units_target_code,
      receiver: settings?.alfa_units_target_phone,
    },
    touch: {
      shortCode: settings?.touch_units_target_code,
      receiver: settings?.touch_units_phone,
    },
  }

  return Object.fromEntries(
    Object.entries(appConfig.payment.carriers)
      .filter(([carrierId]) => paymentMethods.includes(SMS_METHOD_KEYS[carrierId]))
      .map(([carrierId, carrier]) => [
        carrierId,
        {
          ...carrier,
          shortCode: settingValue(patches[carrierId]?.shortCode, carrier.shortCode),
          receiver: settingValue(patches[carrierId]?.receiver, carrier.receiver),
        },
      ]),
  )
}

function fallbackPlans(lang) {
  const isArabic = lang === 'ar'
  const name = isArabic ? 'الباقة الأساسية' : 'Basic Plan'
  return [
    { id: 'fallback_1', planId: 'fallback_1', name, renewInDays: 30, durationLabel: isArabic ? 'شهر واحد' : '1 month', months: 1, amount: 3, oldAmount: 6 },
    { id: 'fallback_3', planId: 'fallback_3', name, renewInDays: 90, durationLabel: isArabic ? '3 أشهر' : '3 months', months: 3, amount: 7, oldAmount: 18 },
    { id: 'fallback_6', planId: 'fallback_6', name, renewInDays: 180, durationLabel: isArabic ? '6 أشهر' : '6 months', months: 6, amount: 13, oldAmount: 18 },
    { id: 'fallback_12', planId: 'fallback_12', name, renewInDays: 365, durationLabel: isArabic ? 'سنة واحدة' : '1 year', months: 12, amount: 24, oldAmount: 72 },
  ]
}

const savedSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem('payment_portal_session') || '{}')
  } catch {
    return {}
  }
}

function restoreSelectedMethod(method) {
  if (!method) return null
  if (method.type !== 'sms') return method

  const carrierId = method.carrier?.id || method.id
  const carrier = appConfig.payment.carriers[carrierId] || method.carrier
  if (!carrier) return method

  return {
    ...method,
    id: carrier.id,
    carrier,
    title: method.title || carrier.title,
    icon: method.icon || carrier.icon,
  }
}

function buildSmsHref({ shortCode, receiver, amount }) {
  const body = `${digitsOnly(receiver)}t${Number(amount).toFixed(0)}`
  return `sms:${digitsOnly(shortCode)}?body=${encodeURIComponent(body)}`
}

const SMS_STATUS_CHECK_ATTEMPTS = 45
const SMS_STATUS_CHECK_INTERVAL_MS = 1500

export const usePortalStore = defineStore('portal', () => {
  const lang = ref(detectLanguage())
  const settings = ref(null)
  const settingsLoaded = ref(false)
  const settingsError = ref('')
  const settingsLoadStarted = ref(false)
  const session = ref(savedSession())
  const currentStep = ref(session.value.currentStep || 'welcome')
  const registeredPhone = ref(session.value.registeredPhone || '')
  const senderPhone = ref(session.value.senderPhone || '')
  const useSamePhone = ref(Boolean(registeredPhone.value && isLebanesePhone(registeredPhone.value)))
  const selectedMethod = ref(restoreSelectedMethod(session.value.selectedMethod))
  const selectedPlan = ref(session.value.selectedPlan || null)
  const promoCode = ref('')
  const giftPhone = ref('')
  const giftCountry = ref('LB')
  const giftApplied = ref(false)
  const giftResult = ref(null)
  const giftError = ref('')
  const plans = ref([])
  const plansLanguage = ref('')
  const payment = ref(session.value.payment || null)
  const paymentStarted = ref(false)
  const leavingForPayment = ref(false)
  const openingExternalApp = ref(false)
  const smsUnitsSent = ref(Number(session.value.smsUnitsSent || 0))
  const smsLastCollected = ref(Number(session.value.smsLastCollected || 0))
  const smsCheckResult = ref(session.value.smsCheckResult || '')
  const smsAwaitingConfirmation = ref(Boolean(session.value.smsAwaitingConfirmation))
  const loading = ref(false)
  const loadingMessage = ref('')
  const loadingAction = ref('')
  const error = ref('')
  const captchaRetryAvailable = ref(false)
  const debugEvents = ref([])
  const success = ref(false)
  let captchaRetryAction = null

  const isRtl = computed(() => lang.value === 'ar')
  const t = computed(() => dictionary[lang.value] || dictionary.en)
  const settingsLoading = computed(() => settingsLoadStarted.value && !settingsLoaded.value && !settingsError.value)
  const paymentMethods = computed(() => (settingsLoaded.value ? normalizePaymentMethods(settings.value?.payment_methods) : []))
  const effectiveCarriers = computed(() => buildEffectiveCarriers(settings.value, paymentMethods.value))
  const availableSmsCarriers = computed(() => Object.values(effectiveCarriers.value))
  const selectedAmount = computed(() => Number(selectedPlan.value?.amount || 0))
  const selectedMonths = computed(() => Number(selectedPlan.value?.months || 0))
  const selectedCarrier = computed(() => carrierForPhone(senderPhone.value, effectiveCarriers.value))
  const needsPlan = computed(() => ['whish', 'sms'].includes(selectedMethod.value?.type))
  const needsSenderPhone = computed(() => selectedMethod.value?.type === 'sms')
  const giftOffer = computed(() => giftOfferForPlan(selectedPlan.value))
  const smsRemaining = computed(() => Math.max(0, selectedAmount.value - smsLastCollected.value))
  const nextSmsChunk = computed(() => Math.min(3, smsRemaining.value || selectedAmount.value || 3))
  const canSendMoreSms = computed(() => selectedMethod.value?.type === 'sms' && smsRemaining.value > 0)
  const hasDirtyInput = computed(() => Boolean(registeredPhone.value || selectedMethod.value || selectedPlan.value || promoCode.value || payment.value))

  const activeSteps = computed(() => {
    const base = ['welcome', 'method', 'phone']
    if (needsPlan.value) base.push('plan')
    if (needsSenderPhone.value) base.push('details')
    if (appConfig.showSummaryStep) base.push('summary')
    base.push('payment', 'success')
    return base
  })

  const progress = computed(() => {
    const index = activeSteps.value.indexOf(currentStep.value)
    return Math.max(6, (((index < 0 ? 0 : index) + 1) / activeSteps.value.length) * 100)
  })

  const progressHint = computed(() => {
    const hints = t.value.progressHints || {}
    return hints[currentStep.value] || hints.default || ''
  })

  const staticMethodsFallback = computed(() => {
    const items = [
      {
        id: 'whish-pay',
        type: 'whish',
        title: 'Whish Pay',
        subtitle: lang.value === 'ar' ? 'ادفع بأمان عبر Whish.' : 'Pay securely with Whish.',
        icon: '/assets/payment/whish.png',
      },
    ]

    if (appConfig.enableCarrierDetection) {
      items.push({
        id: 'sms-units',
        type: 'sms',
        title: lang.value === 'ar' ? 'وحدات الهاتف' : 'Phone units',
        subtitle: lang.value === 'ar' ? 'أرسل وحدات من خط Alfa أو Touch.' : 'Send units from an Alfa or Touch line.',
        icons: [
          appConfig.payment.carriers.alfa.icon,
          appConfig.payment.carriers.touch.icon,
        ],
      })
    } else {
      Object.values(appConfig.payment.carriers).forEach((carrier) => {
        items.push({
          id: carrier.id,
          type: 'sms',
          carrier,
          title: carrier[lang.value === 'ar' ? 'titleAr' : 'title'],
          subtitle: lang.value === 'ar' ? 'أرسل الوحدات برسالة جاهزة.' : 'Send units with a prepared SMS.',
          icon: carrier.icon,
        })
      })
    }

    items.push({
      id: 'promocode',
      type: 'promo',
      title: lang.value === 'ar' ? 'كود تفعيل' : 'Activation code',
      subtitle: lang.value === 'ar' ? 'أدخل الكود ونفعل الاشتراك.' : 'Enter the code and we activate the subscription.',
      icon: '/assets/payment/coupon.png',
    })

    return items
  })

  const methods = computed(() => {
    const items = []
    let smsAdded = false

    const addSmsMethod = () => {
      if (smsAdded || !availableSmsCarriers.value.length) return
      smsAdded = true

      if (appConfig.enableCarrierDetection) {
        items.push({
          id: 'sms-units',
          type: 'sms',
          title: lang.value === 'ar' ? 'وحدات الهاتف' : 'Phone units',
          subtitle: lang.value === 'ar' ? 'أرسل وحدات من خط Alfa أو Touch.' : 'Send units from an Alfa or Touch line.',
          icons: availableSmsCarriers.value.map((carrier) => carrier.icon),
        })
        return
      }

      availableSmsCarriers.value.forEach((carrier) => {
        items.push({
          id: carrier.id,
          type: 'sms',
          carrier,
          title: carrier[lang.value === 'ar' ? 'titleAr' : 'title'],
          subtitle: lang.value === 'ar' ? 'أرسل الوحدات برسالة جاهزة.' : 'Send units with a prepared SMS.',
          icon: carrier.icon,
        })
      })
    }

    paymentMethods.value.forEach((method) => {
      if (method === 'whish') {
        items.push({
          id: 'whish-pay',
          type: 'whish',
          title: 'Whish Pay',
          subtitle: lang.value === 'ar' ? 'ادفع بأمان عبر Whish.' : 'Pay securely with Whish.',
          icon: '/assets/payment/whish.png',
        })
        return
      }

      if (method === 'touch_units' || method === 'alfa_units') {
        addSmsMethod()
        return
      }

      if (method === 'promocode') {
        items.push({
          id: 'promocode',
          type: 'promo',
          title: lang.value === 'ar' ? 'كود تفعيل' : 'Activation code',
          subtitle: lang.value === 'ar' ? 'أدخل الكود ونفعل الاشتراك.' : 'Enter the code and we activate the subscription.',
          icon: '/assets/payment/coupon.png',
        })
      }
    })

    return items
  })

  function persist() {
    sessionStorage.setItem(
      'payment_portal_session',
      JSON.stringify({
        currentStep: currentStep.value,
        registeredPhone: registeredPhone.value,
        senderPhone: senderPhone.value,
        selectedMethod: selectedMethod.value,
        selectedPlan: selectedPlan.value,
        payment: payment.value,
        smsUnitsSent: smsUnitsSent.value,
        smsLastCollected: smsLastCollected.value,
        smsCheckResult: smsCheckResult.value,
        smsAwaitingConfirmation: smsAwaitingConfirmation.value,
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
    debugEvents.value = debugEvents.value.slice(0, 12)
    console.info(`[PaymentPortal] ${label}`, detail)
  }

  function selectedMethodIsAllowed(method) {
    if (!method) return true
    if (method.type === 'whish') return paymentMethods.value.includes('whish')
    if (method.type === 'promo') return paymentMethods.value.includes('promocode')
    if (method.type === 'sms') {
      if (!availableSmsCarriers.value.length) return false
      const carrierId = method.carrier?.id || method.id
      return method.id === 'sms-units' || Boolean(effectiveCarriers.value[carrierId])
    }
    return false
  }

  function syncSelectedMethodWithSettings() {
    if (!selectedMethod.value) return

    if (!selectedMethodIsAllowed(selectedMethod.value)) {
      selectedMethod.value = null
      resetPaymentState()
      error.value = ''
      if (!['welcome', 'method', 'success'].includes(currentStep.value)) currentStep.value = 'method'
      persist()
      return
    }

    if (selectedMethod.value.type !== 'sms') return

    const carrierId = selectedMethod.value.carrier?.id || selectedMethod.value.id
    const carrier = effectiveCarriers.value[carrierId]
    if (!carrier) return

    selectedMethod.value = {
      ...selectedMethod.value,
      id: appConfig.enableCarrierDetection ? selectedMethod.value.id : carrier.id,
      carrier,
      title: carrier[lang.value === 'ar' ? 'titleAr' : 'title'],
      icon: carrier.icon,
    }
    persist()
  }

  async function loadSettingsInBackground(force = false) {
    if (settingsLoadStarted.value && !force) return
    settingsLoadStarted.value = true
    if (force) settingsLoaded.value = false
    settingsError.value = ''

    try {
      const result = await portalSettings.getPaymentPortalSettings()
      settings.value = result || {}
      settingsLoaded.value = true
      syncSelectedMethodWithSettings()
      pushDebug('settings.loaded', settings.value)
    } catch (apiError) {
      const details = describeApiError(apiError)
      settingsError.value = details.backendMessage || apiError?.message || 'Settings could not be loaded'
      pushDebug('settings.failed', details)
    }
  }

  function setLoading(value, message = '', action = '') {
    loading.value = value
    loadingMessage.value = value ? message : ''
    loadingAction.value = value ? action : ''
  }

  function setStep(step) {
    currentStep.value = step
    persist()
  }

  function resetPaymentState() {
    selectedPlan.value = null
    promoCode.value = ''
    giftPhone.value = ''
    giftCountry.value = 'LB'
    giftApplied.value = false
    giftResult.value = null
    giftError.value = ''
    payment.value = null
    paymentStarted.value = false
    leavingForPayment.value = false
    openingExternalApp.value = false
    smsUnitsSent.value = 0
    smsLastCollected.value = 0
    smsCheckResult.value = ''
    smsAwaitingConfirmation.value = false
  }

  function clearCaptchaRetry() {
    captchaRetryAction = null
    captchaRetryAvailable.value = false
  }

  function isCaptchaError(apiError, details) {
    const errorText = [
      apiError?.message,
      details.backendCode,
      details.backendMessage,
      JSON.stringify(details.responseBody || {}),
    ]
      .filter(Boolean)
      .join(' ')

    return /(?:re)?captcha/i.test(errorText) && !/missing VITE_RECAPTCHA_SITE_KEY/i.test(errorText)
  }

  function setApiError(label, apiError, fallbackMessage = t.value.friendlyError, retryAction = null) {
    const details = describeApiError(apiError)
    pushDebug(label, details)
    clearCaptchaRetry()
    if (details.status === 400 && /user not found/i.test(details.backendMessage || '')) {
      error.value = t.value.accountNotFound
      return
    }
    if (retryAction && isCaptchaError(apiError, details)) {
      error.value = t.value.captchaError
      captchaRetryAction = retryAction
      captchaRetryAvailable.value = true
      return
    }
    if (details.status === 403 && label.toLowerCase().includes('status')) {
      error.value = t.value.statusForbidden
      return
    }
    error.value = `${fallbackMessage}${appConfig.isDebug && (details.status || details.backendMessage) ? ` (${details.status || 'local'}: ${details.backendMessage})` : ''}`
  }

  async function retryCaptcha() {
    if (!captchaRetryAction || loading.value) return
    const retryAction = captchaRetryAction
    clearCaptchaRetry()
    error.value = ''
    await retryAction()
  }

  function selectMethod(method) {
    selectedMethod.value = method
    resetPaymentState()
    clearCaptchaRetry()
    error.value = ''
    persist()
    setStep('phone')
  }

  function giftOfferForPlan(plan = selectedPlan.value) {
    if (!['whish', 'sms'].includes(selectedMethod.value?.type)) return null
    const months = Number(plan?.months || 0)
    if (months >= 12) return { code: 'YEAR3M', months: 3 }
    if (months === 6) return { code: '6MON1M', months: 1 }
    return null
  }

  async function validateRegisteredPhone(input, country = 'LB') {
    const normalized = normalizePhone(input, country)
    if (!normalized.valid) {
      error.value = t.value.invalidPhone
      return false
    }

    error.value = ''
    registeredPhone.value = normalized.e164
    useSamePhone.value = isLebanesePhone(normalized.e164)
    senderPhone.value = useSamePhone.value ? normalized.e164 : ''
    pushDebug('phone.validated', { phone: normalized.e164, country: normalized.country })
    persist()
    return true
  }

  function validateSenderPhone(input, country = 'LB') {
    const normalized = normalizePhone(input, country)
    if (!normalized.valid) {
      error.value = t.value.invalidPhone
      return false
    }
    if (selectedMethod.value?.type === 'sms') {
      const detectedCarrier = carrierForPhone(normalized.e164, effectiveCarriers.value)
      if (!isLebanesePhone(normalized.e164) || (appConfig.enableCarrierDetection && !detectedCarrier)) {
        error.value = t.value.lebaneseOnly
        return false
      }
      if (appConfig.enableCarrierDetection) {
        selectedMethod.value = {
          ...selectedMethod.value,
          id: detectedCarrier.id,
          carrier: detectedCarrier,
          title: detectedCarrier[lang.value === 'ar' ? 'titleAr' : 'title'],
          icon: detectedCarrier.icon,
        }
      }
    }
    senderPhone.value = normalized.e164
    error.value = ''
    persist()
    return true
  }

  async function loadPlans(force = false) {
    if (!force && plans.value.length && plansLanguage.value === lang.value) return
    setLoading(true, t.value.loadingPlans, 'loadPlans')
    error.value = ''
    const selectedPlanId = selectedPlan.value?.planId
    try {
      const rows = await payments.getPlans(lang.value)
      const defaults = fallbackPlans(lang.value)
      plans.value = rows.length ? rows : defaults
      plansLanguage.value = lang.value
      selectedPlan.value = plans.value.find((plan) => plan.planId === selectedPlanId) || plans.value[0]
      persist()
      pushDebug('plans.loaded', { count: plans.value.length, plans: plans.value })
    } catch (apiError) {
      const defaults = fallbackPlans(lang.value)
      plans.value = defaults
      plansLanguage.value = lang.value
      selectedPlan.value = defaults.find((plan) => plan.planId === selectedPlanId) || defaults[0]
      persist()
      setApiError('plans.failed_using_fallback', apiError, t.value.plansFallbackError)
    } finally {
      setLoading(false)
    }
  }

  function nextAfterPhone() {
    if (selectedMethod.value?.type === 'promo') {
      setStep('payment')
      return
    }
    loadPlans()
    setStep('plan')
  }

  function nextAfterPlan() {
    if (needsSenderPhone.value) {
      setStep('details')
      return
    }
    if (appConfig.showSummaryStep) {
      setStep('summary')
      return
    }
    setStep('payment')
  }

  function nextAfterDetails() {
    if (appConfig.showSummaryStep) {
      setStep('summary')
      return
    }
    setStep('payment')
  }

  function goToPayment() {
    setStep('payment')
  }

  async function submitPromo() {
    setLoading(true, t.value.creatingPayment, 'promo')
    try {
      let checked
      try {
        checked = await payments.checkPromoCode(promoCode.value)
        pushDebug('promo.check.success', checked)
      } catch (apiError) {
        setApiError('promo.check.failed', apiError, t.value.codeInvalid, startPayment)
        return
      }

      const promoCodeId =
        checked.id ||
        checked.promocode_id ||
        checked.promocodeId ||
        checked.promocode?.id ||
        checked.data?.id
      if (!promoCodeId) throw new Error('Promocode check did not return an id')
      const consumeProof =
        checked.consume_proof ||
        checked.consumeProof ||
        checked.data?.consume_proof

      try {
        const result = await payments.consumePromoCode(promoCodeId, registeredPhone.value, consumeProof)
        pushDebug('promo.consume.success', result)
        completeSuccess()
      } catch (apiError) {
        setApiError('promo.consume.failed', apiError, t.value.codeInvalid, startPayment)
      }
    } catch (promoError) {
      pushDebug('promo.response.invalid', { message: promoError.message, checked })
      error.value = t.value.codeInvalid
    } finally {
      if (!success.value) paymentStarted.value = false
      setLoading(false)
    }
  }

  async function applyGiftRenewal(input = giftPhone.value, country = giftCountry.value) {
    const offer = giftOffer.value
    if (!offer || loading.value || giftApplied.value) return

    const normalized = normalizePhone(input, country)
    if (!normalized.valid) {
      giftError.value = t.value.invalidPhone
      return
    }
    if (normalized.e164 === registeredPhone.value) {
      giftError.value = t.value.giftSamePhoneError
      return
    }

    setLoading(true, t.value.giftApplying, 'gift')
    giftError.value = ''
    giftPhone.value = normalized.e164
    giftCountry.value = normalized.country || country || 'LB'

    try {
      let checked
      try {
        checked = await payments.checkPromoCode(offer.code)
        pushDebug('gift.check.success', { code: offer.code, checked })
      } catch (apiError) {
        pushDebug('gift.check.failed', describeApiError(apiError))
        giftError.value = t.value.giftCodeError
        return
      }

      const promoCodeId =
        checked.id ||
        checked.promocode_id ||
        checked.promocodeId ||
        checked.promocode?.id ||
        checked.data?.id
      if (!promoCodeId) throw new Error('Gift promocode check did not return an id')

      const consumeProof =
        checked.consume_proof ||
        checked.consumeProof ||
        checked.data?.consume_proof

      const result = await payments.consumePromoCode(promoCodeId, normalized.e164, consumeProof)
      giftApplied.value = true
      giftResult.value = { phone: normalized.e164, code: offer.code, months: offer.months, result }
      pushDebug('gift.consume.success', giftResult.value)
    } catch (apiError) {
      pushDebug('gift.consume.failed', describeApiError(apiError))
      giftError.value = t.value.giftCodeError
    } finally {
      setLoading(false)
    }
  }

  async function startPayment() {
    if (paymentStarted.value) return
    paymentStarted.value = true
    clearCaptchaRetry()
    error.value = ''

    if (selectedMethod.value?.type === 'promo') {
      await submitPromo()
      return
    }
    if (!selectedPlan.value) {
      error.value = t.value.planTitle
      paymentStarted.value = false
      return
    }
    if (selectedMethod.value?.type === 'whish') {
      await submitWhish()
      return
    }
    if (selectedMethod.value?.type === 'sms') {
      await sendNextSms()
    }
  }

  async function submitWhish() {
    setLoading(true, t.value.waitingWhishLink, 'whish')
    try {
      const draft = await payments.createWhishPayment({
        amount: selectedAmount.value,
        registeredPhone: registeredPhone.value,
      })
      const paymentId = draft.payment_id || draft.paymentId || draft.id
      if (!paymentId) throw new Error('Whish did not return payment_id')

      payment.value = { id: paymentId, status: 'pending' }
      pushDebug('whish.created', { paymentId })
      const link = draft.payment_link
      if (!link) {
        error.value = t.value.whishLinkNotReady
        paymentStarted.value = false
        return
      }
      payment.value = { ...payment.value, link, whishLinkReady: true }
      persist()
      if (appConfig.isDebug && appConfig.debugWhishSimulationEnabled && draft.debug_simulation_token) {
        payment.value = { ...payment.value, debugSimulationToken: draft.debug_simulation_token }
        paymentStarted.value = false
        pushDebug('whish.debug.ready', { paymentId })
        return
      }
      leavingForPayment.value = true
      window.location.assign(link)
    } catch (apiError) {
      paymentStarted.value = false
      setApiError('whish.create.failed', apiError, t.value.whishCreateError, submitWhish)
    } finally {
      setLoading(false)
    }
  }

  function openWhishPayment() {
    if (!payment.value?.link) return
    leavingForPayment.value = true
    window.location.assign(payment.value.link)
  }

  async function simulateWhishPayment() {
    if (!appConfig.isDebug || !appConfig.debugWhishSimulationEnabled || !payment.value?.debugSimulationToken) return
    setLoading(true, t.value.debugWhishSimulating, 'debugWhish')
    error.value = ''
    try {
      const result = await payments.simulateWhishSuccess(payment.value.id, payment.value.debugSimulationToken)
      pushDebug('whish.debug.simulated', result)
      await checkCurrentPayment()
    } catch (apiError) {
      setApiError('whish.debug.failed', apiError, t.value.debugFailed)
    } finally {
      setLoading(false)
    }
  }

  async function sendNextSms() {
    if (!selectedMethod.value?.carrier) {
      error.value = t.value.lebaneseOnly
      paymentStarted.value = false
      return
    }
    if (smsRemaining.value <= 0 && payment.value?.id) {
      error.value = t.value.allUnitsSent
      await checkCurrentPayment()
      return
    }

    setLoading(true, t.value.creatingPayment, 'sendSms')
    error.value = ''
    try {
      if (!(await prepareSmsPayment())) return

      const chunk = Math.min(3, smsRemaining.value || selectedAmount.value)
      const href = buildSmsHref({
        shortCode: selectedMethod.value.carrier.shortCode,
        receiver: selectedMethod.value.carrier.receiver,
        amount: chunk,
      })
      payment.value = { ...payment.value, smsHref: href, lastChunk: chunk }
      smsUnitsSent.value = Math.min(selectedAmount.value, smsUnitsSent.value + chunk)
      pushDebug('sms.open', { paymentId: payment.value.id, href, chunk, sent: smsUnitsSent.value, remaining: smsRemaining.value })
      openingExternalApp.value = true
      persist()
      window.location.href = href
      window.setTimeout(() => {
        openingExternalApp.value = false
      }, 1500)
      pollPayment(payment.value.id, 'sms')
    } catch (apiError) {
      paymentStarted.value = false
      setApiError('sms.draft.failed', apiError, t.value.smsCreateError, prepareSmsPayment)
    } finally {
      setLoading(false)
    }
  }

  async function prepareSmsPayment() {
    if (payment.value?.id) return true
    if (!selectedMethod.value?.carrier) {
      error.value = t.value.lebaneseOnly
      return false
    }
    setLoading(true, t.value.creatingPayment, 'prepareSms')
    error.value = ''
    try {
      const draft = await payments.createDraftPayment({
        amount: selectedAmount.value,
        method: selectedMethod.value.carrier.method,
        registeredPhone: registeredPhone.value,
        senderPhone: senderPhone.value || registeredPhone.value,
      })
      payment.value = { ...draft, id: draft.id, status: draft.status || 'draft' }
      pushDebug('sms.draft.created', { draft, selectedAmount: selectedAmount.value })
      persist()
      return Boolean(payment.value.id)
    } catch (apiError) {
      paymentStarted.value = false
      setApiError('sms.draft.failed', apiError, t.value.smsCreateError, prepareSmsPayment)
      return false
    } finally {
      setLoading(false)
    }
  }

  function openSmsAppAgain() {
    if (!payment.value?.smsHref) return
    pushDebug('sms.open_again', { smsHref: payment.value.smsHref })
    openingExternalApp.value = true
    window.location.href = payment.value.smsHref
    window.setTimeout(() => {
      openingExternalApp.value = false
    }, 1500)
  }

  async function sendSmsDebugWebhook() {
    if (!appConfig.debugSmsWebhookEnabled || !selectedMethod.value?.carrier) return
    setLoading(true, t.value.debugSending, 'debugWebhook')
    error.value = ''
    try {
      const latestBeforeWebhook = await payments.getPaymentStatus(payment.value.id)
      updatePaymentFromStatus(latestBeforeWebhook)

      if (payments.isSuccessfulPayment(latestBeforeWebhook)) {
        smsAwaitingConfirmation.value = false
        persist()
        await completeValidatedPayment(payment.value.id)
        return
      }

      if (smsRemaining.value <= 0) {
        smsAwaitingConfirmation.value = true
        void waitForSmsWebhookUpdate({
          sentAmount: 0,
          expectedCollected: selectedAmount.value,
        })
        return
      }

      const amount = Number(Math.min(3, smsRemaining.value).toFixed(2))
      const collectedBeforeWebhook = smsLastCollected.value
      const result = await payments.postDebugSmsWebhook({
        carrier: selectedMethod.value.carrier,
        amount,
        senderPhone: senderPhone.value,
      })
      if (result?.success === false || result?.parsed === false) {
        throw new Error('Debug SMS webhook was not accepted')
      }
      pushDebug('sms.webhook.sent', {
        senderPhone: senderPhone.value,
        amount,
        remainingBeforeWebhook: smsRemaining.value,
        result,
      })

      const expectedCollected = Math.min(selectedAmount.value, collectedBeforeWebhook + amount)
      smsLastCollected.value = expectedCollected
      smsUnitsSent.value = Math.max(smsUnitsSent.value, expectedCollected)
      smsCheckResult.value = expectedCollected < selectedAmount.value ? 'partial' : ''
      smsAwaitingConfirmation.value = expectedCollected >= selectedAmount.value
      persist()

      void waitForSmsWebhookUpdate({ sentAmount: amount, expectedCollected })
    } catch (apiError) {
      setApiError('sms.webhook.failed', apiError, t.value.debugFailed)
    } finally {
      setLoading(false)
    }
  }

  async function waitForSmsWebhookUpdate({ sentAmount = 0, expectedCollected = selectedAmount.value } = {}) {
    for (let attempt = 1; attempt <= SMS_STATUS_CHECK_ATTEMPTS; attempt += 1) {
      if (attempt > 1) {
        await new Promise((resolve) => window.setTimeout(resolve, SMS_STATUS_CHECK_INTERVAL_MS))
      }

      try {
        const latest = await payments.getPaymentStatus(payment.value.id)
        const backendCollected = Number(latest.amount_collected || 0)
        updatePaymentFromStatus(latest)
        pushDebug('sms.webhook.status', { attempt, sentAmount, latest })

        if (payments.isSuccessfulPayment(latest)) {
          smsAwaitingConfirmation.value = false
          await completeValidatedPayment(payment.value.id)
          return
        }

        if (expectedCollected < selectedAmount.value && backendCollected >= expectedCollected) {
          smsCheckResult.value = smsRemaining.value > 0 ? 'partial' : ''
          return
        }
      } catch (apiError) {
        pushDebug('sms.webhook.status.failed', { attempt, ...describeApiError(apiError) })
      }
    }

    smsCheckResult.value = smsLastCollected.value > 0 ? 'partial' : 'pending'
    smsAwaitingConfirmation.value = smsRemaining.value <= 0
    persist()
  }

  function updatePaymentFromStatus(latest) {
    payment.value = { ...payment.value, ...latest }
    const collected = Number(latest.amount_collected || 0)
    const boundedCollected = Math.max(0, Math.min(selectedAmount.value || collected, collected))
    smsLastCollected.value =
      selectedMethod.value?.type === 'sms'
        ? Math.max(smsLastCollected.value, boundedCollected)
        : boundedCollected
    smsUnitsSent.value = Math.max(smsUnitsSent.value, smsLastCollected.value)
    persist()
  }

  async function checkCurrentPayment() {
    if (!payment.value?.id) {
      error.value = t.value.paymentPending
      return
    }
    error.value = ''
    smsCheckResult.value = ''
    setLoading(true, t.value.checkingPayment, 'checkPayment')
    try {
      const latest = await payments.getPaymentStatus(payment.value.id)
      updatePaymentFromStatus(latest)
      pushDebug('payment.status', latest)
      if (payments.isSuccessfulPayment(latest)) {
        await completeValidatedPayment(payment.value.id)
      } else if (payments.isFailedStatus(latest.status)) {
        error.value = t.value.friendlyError
      } else {
        if (selectedMethod.value?.type === 'sms') {
          smsAwaitingConfirmation.value = smsRemaining.value <= 0
          if (smsAwaitingConfirmation.value) {
            await waitForSmsWebhookUpdate()
            return
          }
          smsCheckResult.value = smsAwaitingConfirmation.value
            ? ''
            : smsLastCollected.value > 0
              ? 'partial'
              : 'pending'
        } else {
          error.value = t.value.paymentPending
        }
      }
    } catch (apiError) {
      setApiError('payment.status.failed', apiError, t.value.paymentPending)
    } finally {
      setLoading(false)
    }
  }

  async function syncCurrentPayment() {
    if (!payment.value?.id || success.value) return
    try {
      const latest = await payments.getPaymentStatus(payment.value.id)
      updatePaymentFromStatus(latest)
      pushDebug('payment.sync.status', latest)

      if (payments.isSuccessfulPayment(latest)) {
        await completeValidatedPayment(payment.value.id)
        return
      }

      if (selectedMethod.value?.type === 'sms') {
        smsAwaitingConfirmation.value = smsRemaining.value <= 0
        smsCheckResult.value = smsAwaitingConfirmation.value
          ? ''
          : smsLastCollected.value > 0
            ? 'partial'
            : smsCheckResult.value
      }
    } catch (apiError) {
      pushDebug('payment.sync.failed', describeApiError(apiError))
    }
  }

  function pollPayment(paymentId, source) {
    if (!paymentId) return
    let count = 0
    const maxPolls = source === 'whish' ? appConfig.payment.maxWhishPolls : Math.ceil(appConfig.payment.whishVerifyTimeoutMs / appConfig.payment.statusPollMs)
    const intervalMs = source === 'whish' ? appConfig.payment.whishVerifyPollMs : appConfig.payment.statusPollMs
    const timer = window.setInterval(async () => {
      count += 1
      try {
        const latest = await payments.getPaymentStatus(paymentId)
        updatePaymentFromStatus(latest)
        pushDebug(`${source}.poll.status`, latest)
        if (payments.isSuccessfulPayment(latest)) {
          window.clearInterval(timer)
          await completeValidatedPayment(paymentId)
        }
        if (payments.isFailedStatus(latest.status) || count > maxPolls) {
          window.clearInterval(timer)
        }
      } catch (apiError) {
        pushDebug(`${source}.poll.failed`, describeApiError(apiError))
        if (count > maxPolls) window.clearInterval(timer)
      }
    }, intervalMs)
  }

  function completeSuccess() {
    if (success.value) return
    success.value = true
    setStep('success')
    sessionStorage.removeItem('payment_portal_session')
    confetti({ particleCount: 220, spread: 110, startVelocity: 42, origin: { y: 0.65 } })
    window.setTimeout(() => confetti({ particleCount: 160, spread: 90, origin: { x: 0.15, y: 0.55 } }), 280)
    window.setTimeout(() => confetti({ particleCount: 160, spread: 90, origin: { x: 0.85, y: 0.55 } }), 520)
  }

  async function completeValidatedPayment(paymentId = payment.value?.id) {
    completeSuccess()
    if (!paymentId) return

    try {
      const confirmed = await payments.confirmPayment(paymentId)
      payment.value = { ...payment.value, ...confirmed }
      pushDebug('payment.confirmed', confirmed)
    } catch (apiError) {
      pushDebug('payment.confirm.failed', describeApiError(apiError))
    }
  }

  function reset() {
    sessionStorage.removeItem('payment_portal_session')
    currentStep.value = 'welcome'
    registeredPhone.value = ''
    senderPhone.value = ''
    useSamePhone.value = false
    selectedMethod.value = null
    selectedPlan.value = null
    plansLanguage.value = ''
    promoCode.value = ''
    giftPhone.value = ''
    giftCountry.value = 'LB'
    giftApplied.value = false
    giftResult.value = null
    giftError.value = ''
    payment.value = null
    paymentStarted.value = false
    leavingForPayment.value = false
    openingExternalApp.value = false
    smsUnitsSent.value = 0
    smsLastCollected.value = 0
    smsCheckResult.value = ''
    smsAwaitingConfirmation.value = false
    clearCaptchaRetry()
    error.value = ''
    debugEvents.value = []
    success.value = false
  }

  watch(lang, () => {
    if (currentStep.value === 'plan' && plans.value.length) loadPlans(true)
  })

  return {
    lang,
    isRtl,
    t,
    currentStep,
    progress,
    progressHint,
    registeredPhone,
    senderPhone,
    useSamePhone,
    selectedMethod,
    selectedPlan,
    promoCode,
    plans,
    methods,
    payment,
    paymentStarted,
    leavingForPayment,
    openingExternalApp,
    smsUnitsSent,
    smsLastCollected,
    smsCheckResult,
    smsAwaitingConfirmation,
    smsRemaining,
    nextSmsChunk,
    canSendMoreSms,
    selectedAmount,
    selectedMonths,
    giftOffer,
    giftPhone,
    giftCountry,
    giftApplied,
    giftResult,
    giftError,
    settingsLoading,
    settingsLoaded,
    settingsError,
    loading,
    loadingMessage,
    loadingAction,
    error,
    captchaRetryAvailable,
    debugEvents,
    success,
    hasDirtyInput,
    selectedCarrier,
    needsPlan,
    needsSenderPhone,
    setStep,
    selectMethod,
    loadSettingsInBackground,
    validateRegisteredPhone,
    validateSenderPhone,
    giftOfferForPlan,
    applyGiftRenewal,
    loadPlans,
    nextAfterPhone,
    nextAfterPlan,
    nextAfterDetails,
    goToPayment,
    startPayment,
    prepareSmsPayment,
    sendNextSms,
    openSmsAppAgain,
    openWhishPayment,
    simulateWhishPayment,
    sendSmsDebugWebhook,
    checkCurrentPayment,
    syncCurrentPayment,
    retryCaptcha,
    completeSuccess,
    reset,
  }
})
