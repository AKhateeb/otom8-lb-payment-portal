<template>
  <main :dir="store.isRtl ? 'rtl' : 'ltr'" class="min-h-svh overflow-x-hidden text-[#202020]">
    <LiveBackground />
    <div class="portal-shell mx-auto flex min-h-svh w-full max-w-2xl flex-col px-3 pb-3 pt-2 sm:px-6 sm:py-4">
      <header class="grid min-h-16 grid-cols-3 items-center gap-2 px-1 py-1 sm:min-h-24 sm:gap-4 sm:px-2 sm:py-2">
        <div class="flex min-w-0 items-center justify-start">
          <img :src="config.identity.splashLogo" :alt="config.identity.appName" class="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
        </div>
        <div class="min-w-0 px-1 text-center sm:px-3">
          <p class="text-xs font-black leading-tight text-[#202020] sm:text-base lg:text-lg" dir="auto">
            {{ store.lang === 'ar' ? config.identity.titleAr : config.identity.portalName }}
          </p>
        </div>
        <div class="flex min-w-0 items-center justify-end gap-2">
          <span v-if="config.isDebug" class="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 xs:inline-flex sm:inline-flex" dir="auto">{{ store.t.debugMode }}</span>
          <button class="min-h-9 rounded-full bg-white/85 px-2.5 text-xs font-bold shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white sm:min-h-10 sm:px-3 sm:text-sm" @click="store.lang = store.lang === 'ar' ? 'en' : 'ar'">
            <span dir="auto">{{ store.lang === 'ar' ? 'English' : 'العربية' }}</span>
          </button>
        </div>
      </header>

      <section class="flex flex-1 flex-col justify-center gap-4 py-3 sm:gap-5 sm:py-6">
        <section class="portal-card rounded-2xl bg-white/95 p-4 shadow-xl shadow-yellow-950/10 backdrop-blur-md sm:border sm:border-white/80 sm:p-6 sm:shadow-2xl">
          <div v-if="showBackButton" class="mb-4 flex">
            <button
              class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#E5D98E] bg-[#FFF8D7] px-4 text-sm font-black text-[#202020] transition hover:border-[#202020] hover:bg-[#FACE0B] focus:outline-none focus:ring-2 focus:ring-[#FACE0B] focus:ring-offset-2 disabled:opacity-50"
              :disabled="store.loading"
              @click="goBack"
            >
              <ArrowLeft v-if="!store.isRtl" class="h-4 w-4" />
              <ArrowRight v-else class="h-4 w-4" />
              <span dir="auto">{{ store.t.back }}</span>
            </button>
          </div>

          <div class="mb-5">
            <div class="h-2 overflow-hidden rounded-full bg-[#F6F0CC] shadow-inner">
              <div class="h-full rounded-full bg-[#FACE0B] transition-all duration-500" :style="{ width: `${store.progress}%` }" />
            </div>
          </div>

          <div v-if="store.loading" class="mb-4 flex items-center gap-3 rounded-lg border border-[#EFE6B8] bg-[#FFF8D7] p-3 text-sm font-semibold text-[#202020]">
            <LoaderCircle class="h-5 w-5 animate-spin text-[#202020]" />
            <span dir="auto">{{ store.loadingMessage || store.t.loading }}</span>
          </div>
          <div v-if="store.error && !showPaymentInlineError" class="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <span dir="auto">{{ store.error === 'friendly' ? store.t.friendlyError : store.error }}</span>
            <button
              v-if="store.captchaRetryAvailable"
              class="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-800 px-4 font-black text-white transition hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="store.loading"
              @click="store.retryCaptcha()"
            >
              <RefreshCw class="h-4 w-4" />
              <span dir="auto">{{ store.t.retryCaptcha }}</span>
            </button>
          </div>

          <WelcomeStep v-if="store.currentStep === 'welcome'" />
          <MethodStep v-else-if="store.currentStep === 'method'" />
          <PhoneStep v-else-if="store.currentStep === 'phone'" />
          <BundleStep v-else-if="store.currentStep === 'plan'" />
          <DetailsStep v-else-if="store.currentStep === 'details'" />
          <SummaryStep v-else-if="store.currentStep === 'summary'" />
          <PaymentStep v-else-if="store.currentStep === 'payment'" />
          <SuccessStep v-else />

          <details v-if="config.isDebug && store.debugEvents.length" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <summary class="cursor-pointer font-black" dir="auto">{{ store.t.debugDetails }}</summary>
            <div class="mt-3 space-y-2">
              <pre v-for="event in store.debugEvents" :key="event.id" class="max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2" dir="auto">{{ event.at }} - {{ event.label }}
{{ JSON.stringify(event.detail, null, 2) }}</pre>
            </div>
          </details>
        </section>

        <aside
          v-if="showSmsDebugPanel"
          class="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-amber-950 shadow-lg shadow-amber-950/5"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-wider text-amber-700" dir="auto">{{ store.t.debugOnly }}</p>
              <h2 class="mt-1 font-black" dir="auto">{{ store.t.debugSmsTitle }}</h2>
              <p class="mt-1 text-sm" dir="auto">{{ store.t.debugSmsBody }}</p>
            </div>
            <button
              class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-amber-900 px-5 text-sm font-black text-amber-50 hover:bg-amber-950 disabled:opacity-50"
              :disabled="store.loading || store.smsAwaitingConfirmation"
              @click="store.sendSmsDebugWebhook()"
            >
              <span dir="auto">{{ store.t.debugWebhook }}</span>
            </button>
          </div>
        </aside>
      </section>

      <footer class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-1 pb-2 pt-2 text-[#5f5b4c] sm:pb-4">
        <a
          :href="config.identity.websiteUrl"
          target="_blank"
          rel="noreferrer"
          class="footer-link"
        >
          <Globe class="h-3.5 w-3.5" />
          <span dir="auto">{{ store.t.websiteLink }}</span>
        </a>
        <a
          :href="config.identity.whatsappUrl"
          target="_blank"
          rel="noreferrer"
          class="footer-link"
        >
          <img src="/assets/payment/whatsapp.svg" alt="" class="h-4 w-4 shrink-0" />
          <span dir="auto">{{ store.t.contactUs }}</span>
        </a>
        <a
          :href="legalUrl('terms-of-use')"
          target="_blank"
          rel="noreferrer"
          class="footer-link"
        >
          <FileText class="h-3.5 w-3.5" />
          <span dir="auto">{{ store.t.termsOfUse }}</span>
        </a>
        <a
          :href="legalUrl('privacy-policy')"
          target="_blank"
          rel="noreferrer"
          class="footer-link"
        >
          <ShieldCheck class="h-3.5 w-3.5" />
          <span dir="auto">{{ store.t.privacyPolicy }}</span>
        </a>
        <p class="mt-1 w-full text-center text-[11px] leading-5 text-[#77715d]">
          <span dir="auto">{{ store.lang === 'ar' ? 'هذا الموقع محمي بواسطة reCAPTCHA وتطبق سياسة الخصوصية وشروط الخدمة من Google.' : 'This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.' }}</span>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" class="font-bold underline">Privacy</a>
          <span aria-hidden="true"> · </span>
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" class="font-bold underline">Terms</a>
        </p>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { ArrowLeft, ArrowRight, FileText, Globe, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-vue-next'
import LiveBackground from '@/components/LiveBackground.vue'
import { appConfig as config } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'
import WelcomeStep from './steps/WelcomeStep.vue'
import PhoneStep from './steps/PhoneStep.vue'
import MethodStep from './steps/MethodStep.vue'
import BundleStep from './steps/BundleStep.vue'
import DetailsStep from './steps/DetailsStep.vue'
import PaymentStep from './steps/PaymentStep.vue'
import SummaryStep from './steps/SummaryStep.vue'
import SuccessStep from './steps/SuccessStep.vue'

const store = usePortalStore()
const showBackButton = computed(() => !['welcome', 'success'].includes(store.currentStep))
const showPaymentInlineError = computed(
  () =>
    store.currentStep === 'payment' &&
    store.selectedMethod?.type === 'sms' &&
    Boolean(store.error) &&
    !store.payment?.id &&
    !store.captchaRetryAvailable,
)
const showSmsDebugPanel = computed(
  () =>
    config.isDebug &&
    config.debugSmsWebhookEnabled &&
    store.currentStep === 'payment' &&
    store.selectedMethod?.type === 'sms' &&
    Boolean(store.payment?.id),
)

watch(
  () => store.lang,
  (lang) => {
    document.documentElement.lang = lang === 'ar' ? 'ar-LB' : 'en-LB'
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = lang === 'ar'
      ? 'إجت باي | تجديد اشتراك تطبيق إجت الكهربا'
      : 'Ejet Elkahraba - Payment Portal | Renew the Ejet Elkahraba App in Lebanon'
  },
  { immediate: true },
)

function goBack() {
  const defaultBackSteps = {
    method: 'welcome',
    phone: 'method',
    plan: 'phone',
    details: 'plan',
  }

  if (store.currentStep === 'summary') {
    store.setStep(store.selectedMethod?.type === 'sms' ? 'details' : store.selectedMethod?.type === 'promo' ? 'phone' : 'plan')
    return
  }

  if (store.currentStep === 'payment') {
    if (store.selectedMethod?.type === 'promo') {
      store.setStep('phone')
      return
    }
    if (store.selectedMethod?.type === 'sms') {
      store.setStep('details')
      return
    }
    store.setStep(config.showSummaryStep ? 'summary' : 'plan')
    return
  }

  store.setStep(defaultBackSteps[store.currentStep] || 'welcome')
}

function legalUrl(slug) {
  const langPrefix = store.lang === 'ar' ? '/ar' : ''
  return `https://ejet-elkahraba.com${langPrefix}/${slug}/`
}

function beforeUnload(event) {
  if (!store.hasDirtyInput || store.currentStep === 'success' || store.leavingForPayment || store.openingExternalApp) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  store.loadSettingsInBackground()
  window.addEventListener('beforeunload', beforeUnload)
})
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
