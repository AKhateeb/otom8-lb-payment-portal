<template>
  <main :dir="store.isRtl ? 'rtl' : 'ltr'" class="min-h-svh text-[#202020]">
    <LiveBackground />
    <div class="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-4 sm:px-6">
      <header class="flex items-center justify-between gap-4">
        <div class="flex items-center">
          <img :src="config.identity.splashLogo" :alt="config.identity.appName" class="h-20 w-20 object-contain sm:h-24 sm:w-24" />
        </div>
        <div class="flex items-center gap-2">
          <span v-if="config.isDebug" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{{ store.t.debugMode }}</span>
          <button class="rounded-full border border-[#EFE6B8] bg-white px-3 py-1 text-sm font-bold" @click="store.lang = store.lang === 'ar' ? 'en' : 'ar'">
            {{ store.lang === 'ar' ? 'English' : 'العربية' }}
          </button>
        </div>
      </header>

      <section class="flex flex-1 flex-col justify-center gap-5 py-6">
        <section class="rounded-xl border border-white/80 bg-white/94 p-4 shadow-2xl shadow-yellow-950/10 backdrop-blur sm:p-6">
          <div v-if="showBackButton" class="mb-4 flex">
            <button
              class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#E5D98E] bg-[#FFF8D7] px-4 text-sm font-black text-[#202020] transition hover:border-[#202020] hover:bg-[#FACE0B] focus:outline-none focus:ring-2 focus:ring-[#FACE0B] focus:ring-offset-2 disabled:opacity-50"
              :disabled="store.loading"
              @click="goBack"
            >
              <ArrowLeft v-if="!store.isRtl" class="h-4 w-4" />
              <ArrowRight v-else class="h-4 w-4" />
              {{ store.t.back }}
            </button>
          </div>

          <div class="mb-5">
            <div class="h-2 overflow-hidden rounded-full bg-[#F6F0CC] shadow-inner">
              <div class="h-full rounded-full bg-[#FACE0B] transition-all duration-500" :style="{ width: `${store.progress}%` }" />
            </div>
          </div>

          <div v-if="store.loading" class="mb-4 flex items-center gap-3 rounded-lg border border-[#EFE6B8] bg-[#FFF8D7] p-3 text-sm font-semibold text-[#202020]">
            <LoaderCircle class="h-5 w-5 animate-spin text-[#202020]" />
            {{ store.loadingMessage || store.t.loading }}
          </div>
          <div v-if="store.error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {{ store.error === 'friendly' ? store.t.friendlyError : store.error }}
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
            <summary class="cursor-pointer font-black">{{ store.t.debugDetails }}</summary>
            <div class="mt-3 space-y-2">
              <pre v-for="event in store.debugEvents" :key="event.id" class="max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2">{{ event.at }} - {{ event.label }}
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
              <p class="text-xs font-black uppercase tracking-wider text-amber-700">{{ store.t.debugOnly }}</p>
              <h2 class="mt-1 font-black">{{ store.t.debugSmsTitle }}</h2>
              <p class="mt-1 text-sm">{{ store.t.debugSmsBody }}</p>
            </div>
            <button
              class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-amber-900 px-5 text-sm font-black text-amber-50 hover:bg-amber-950 disabled:opacity-50"
              :disabled="store.loading || store.smsAwaitingConfirmation"
              @click="store.sendSmsDebugWebhook()"
            >
              {{ store.t.debugWebhook }}
            </button>
          </div>
        </aside>
      </section>

      <footer class="flex flex-wrap items-center justify-center gap-3 pb-4">
        <a
          :href="config.identity.websiteUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#EFE6B8] bg-white px-3 text-sm font-bold text-[#202020] hover:border-[#202020]"
        >
          <Globe class="h-4 w-4" />
          {{ store.t.websiteLink }}
        </a>
        <a
          :href="config.identity.whatsappUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#EFE6B8] bg-white px-3 text-sm font-bold text-[#202020] hover:border-[#25D366] hover:bg-[#25D366]/5"
        >
          <img src="/assets/payment/whatsapp.svg" alt="" class="h-5 w-5 shrink-0" />
          {{ store.t.contactUs }}
        </a>
        <a
          :href="legalUrl('terms-of-use')"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#EFE6B8] bg-white px-3 text-sm font-bold text-[#202020] hover:border-[#202020]"
        >
          <FileText class="h-4 w-4" />
          {{ store.t.termsOfUse }}
        </a>
        <a
          :href="legalUrl('privacy-policy')"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#EFE6B8] bg-white px-3 text-sm font-bold text-[#202020] hover:border-[#202020]"
        >
          <ShieldCheck class="h-4 w-4" />
          {{ store.t.privacyPolicy }}
        </a>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, ArrowRight, FileText, Globe, LoaderCircle, ShieldCheck } from 'lucide-vue-next'
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
const showSmsDebugPanel = computed(
  () =>
    config.isDebug &&
    config.debugSmsWebhookEnabled &&
    store.currentStep === 'payment' &&
    store.selectedMethod?.type === 'sms' &&
    Boolean(store.payment?.id),
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
  if (!store.hasDirtyInput || store.currentStep === 'success' || store.leavingForPayment) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
