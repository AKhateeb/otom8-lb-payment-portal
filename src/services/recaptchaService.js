import { appConfig } from '@/config/appConfig'

const SCRIPT_ID = 'google-recaptcha-script'
let widgetId = null
let widgetElement = null
let pendingChallenge = null

function loadRecaptcha() {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha)

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener('load', () => window.grecaptcha.ready(() => resolve(window.grecaptcha)), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('reCAPTCHA failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha))
    script.onerror = () => reject(new Error('reCAPTCHA failed to load'))
    document.head.appendChild(script)
  })
}

function rejectPending(message) {
  if (!pendingChallenge) return
  pendingChallenge.reject(new Error(message))
  pendingChallenge = null
}

async function getWidget() {
  const recaptcha = await loadRecaptcha()
  if (widgetId !== null) return { recaptcha, widgetId }

  widgetElement = document.createElement('div')
  widgetElement.setAttribute('aria-hidden', 'true')
  document.body.appendChild(widgetElement)
  widgetId = recaptcha.render(widgetElement, {
    sitekey: appConfig.recaptcha.siteKey,
    size: 'invisible',
    badge: 'bottomright',
    callback: (token) => {
      if (!pendingChallenge) return
      pendingChallenge.resolve(token)
      pendingChallenge = null
    },
    'expired-callback': () => rejectPending('reCAPTCHA expired. Please try again.'),
    'error-callback': () => rejectPending('reCAPTCHA could not verify this request.'),
  })
  return { recaptcha, widgetId }
}

export async function executeRecaptcha() {
  if (!appConfig.recaptcha.siteKey) throw new Error('Missing VITE_RECAPTCHA_SITE_KEY')
  if (pendingChallenge) throw new Error('A reCAPTCHA verification is already in progress.')

  const widget = await getWidget()
  widget.recaptcha.reset(widget.widgetId)
  const tokenPromise = new Promise((resolve, reject) => {
    pendingChallenge = { resolve, reject }
  })
  widget.recaptcha.execute(widget.widgetId)
  return tokenPromise
}
