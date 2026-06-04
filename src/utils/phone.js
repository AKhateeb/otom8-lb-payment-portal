import { parsePhoneNumberFromString } from 'libphonenumber-js'

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
