import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { appConfig } from '@/config/appConfig'

export function normalizePhone(raw, defaultCountry = 'LB') {
  const cleaned = String(raw || '').replace(/[^\d+]/g, '').slice(0, 18)
  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry)

  if (!parsed || !parsed.isValid()) {
    return { valid: false, input: cleaned, e164: '', country: '', national: '' }
  }

  return {
    valid: true,
    input: cleaned,
    e164: parsed.number,
    country: parsed.country || '',
    national: parsed.nationalNumber || '',
  }
}

export function isLebanesePhone(e164) {
  return String(e164 || '').startsWith('+961')
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export function phoneLookupDigits(e164) {
  const digits = digitsOnly(e164)
  return digits.startsWith('961') ? digits.slice(3) : digits
}

export function carrierForPhone(e164, configuredCarriers = appConfig.payment.carriers) {
  const candidates = [String(e164 || ''), digitsOnly(e164), phoneLookupDigits(e164)]
  const carriers = Object.values(configuredCarriers || {})
  return carriers.find((carrier) => candidates.some((candidate) => carrier.pattern?.test(candidate))) || null
}
