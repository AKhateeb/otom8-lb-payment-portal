import { apiClient } from './apiClient'

const SETTINGS_FIELDS = [
  'touch_units_target_code',
  'alfa_units_target_code',
  'touch_units_phone',
  'alfa_units_target_phone',
  'payment_methods',
]

const unwrapData = (body) => body?.data?.data || body?.data || body || {}

export async function getPaymentPortalSettings() {
  const response = await apiClient.get('/items/settings', {
    params: {
      fields: SETTINGS_FIELDS.join(','),
      _t: Date.now(),
    },
  })
  return unwrapData(response)
}
