import axios from 'axios'
import { appConfig } from '@/config/appConfig'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 25000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${appConfig.paymentToken}`,
  },
})

export function describeApiError(error) {
  const status = error?.response?.status
  const responseData = error?.response?.data
  const backendCode =
    responseData?.data?.error ||
    responseData?.error ||
    responseData?.errors?.[0]?.extensions?.code
  const backendMessage =
    responseData?.data?.message ||
    responseData?.message ||
    responseData?.errors?.[0]?.message ||
    backendCode ||
    error?.message ||
    'Unknown error'

  return {
    status,
    method: error?.config?.method?.toUpperCase(),
    url: `${error?.config?.baseURL || ''}${error?.config?.url || ''}`,
    backendMessage,
    backendCode,
    responseBody: responseData,
    requestBody: error?.config?.data,
  }
}

export function logApiDebug(label, value) {
  if (!appConfig.isDebug) return
  console.info(`[PaymentPortal] ${label}`, value)
}

apiClient.interceptors.request.use((config) => {
  logApiDebug('request', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL || ''}${config.url || ''}`,
    data: config.data,
  })
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    logApiDebug('response', {
      status: response.status,
      url: `${response.config?.baseURL || ''}${response.config?.url || ''}`,
      data: response.data,
    })
    return response
  },
  (error) => {
    logApiDebug('error', describeApiError(error))
    return Promise.reject(error)
  },
)

export function userFriendlyError(error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 500, 502, 503].includes(status)) {
    return 'friendly'
  }

  const message =
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message

  return typeof message === 'string' && message.trim() ? message.trim() : 'friendly'
}
