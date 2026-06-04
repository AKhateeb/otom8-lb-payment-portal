<template>
  <main :dir="store.isRtl ? 'rtl' : 'ltr'" class="min-h-svh text-[#182326]">
    <LiveBackground />
    <div class="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-xl bg-[#182326] p-2 shadow-lg shadow-emerald-950/15">
            <img :src="config.identity.logo" :alt="config.identity.appName" class="h-full w-full object-contain" />
          </div>
          <div>
            <p class="text-sm font-bold text-[#182326]">{{ config.identity.portalName }}</p>
            <p class="text-xs text-[#60706b]">{{ config.identity.domainHint }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="config.isDebug" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Debug</span>
          <button class="rounded-full border border-[#d9e7dd] bg-white px-3 py-1 text-sm font-bold" @click="store.lang = store.lang === 'ar' ? 'en' : 'ar'">
            {{ store.lang === 'ar' ? 'EN' : 'AR' }}
          </button>
        </div>
      </header>

      <section class="grid flex-1 items-center gap-7 py-8 lg:grid-cols-[0.92fr_1.08fr]">
        <aside class="space-y-6">
          <div>
            <div class="mb-5 grid h-24 w-24 place-items-center rounded-2xl bg-[#182326] p-3 shadow-xl shadow-emerald-950/15">
              <img :src="config.identity.splashLogo" :alt="config.identity.appName" class="h-full w-full object-contain" />
            </div>
            <h1 class="max-w-xl text-4xl font-black leading-tight text-[#14201d] sm:text-5xl">
              {{ store.lang === 'ar' ? config.identity.titleAr : config.identity.title }}
            </h1>
            <p class="mt-4 max-w-lg text-base leading-7 text-[#60706b]">
              {{ store.lang === 'ar' ? config.identity.subtitleAr : config.identity.subtitle }}
            </p>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-white shadow-inner">
            <div class="h-full rounded-full bg-[#21C063] transition-all duration-500" :style="{ width: `${store.progress}%` }" />
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs font-bold text-[#60706b]">
            <span>{{ store.t.registeredPhone }}</span>
            <span>{{ store.t.method }}</span>
            <span>{{ store.t.confirmPayment }}</span>
          </div>
        </aside>

        <section class="rounded-2xl border border-white/80 bg-white/92 p-4 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-6">
          <div v-if="store.loading" class="mb-4 flex items-center gap-3 rounded-lg border border-[#d9e7dd] bg-[#f7fcf8] p-3 text-sm font-semibold text-[#182326]">
            <LoaderCircle class="h-5 w-5 animate-spin text-[#21C063]" />
            {{ store.loadingMessage || 'Loading...' }}
          </div>
          <div v-if="store.error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {{ store.error === 'friendly' ? store.t.friendlyError : store.error }}
          </div>

          <WelcomeStep v-if="store.currentStep === 'welcome'" />
          <PhoneStep v-else-if="store.currentStep === 'phone'" />
          <MethodStep v-else-if="store.currentStep === 'method'" />
          <BundleStep v-else-if="store.currentStep === 'bundle'" />
          <DetailsStep v-else-if="store.currentStep === 'details'" />
          <SummaryStep v-else-if="store.currentStep === 'summary'" />
          <SuccessStep v-else />

          <details v-if="config.isDebug && store.debugEvents.length" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <summary class="cursor-pointer font-black">{{ store.t.debugDetails }}</summary>
            <div class="mt-3 space-y-2">
              <pre v-for="event in store.debugEvents" :key="event.id" class="max-h-44 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2">{{ event.at }} - {{ event.label }}
{{ JSON.stringify(event.detail, null, 2) }}</pre>
            </div>
          </details>
        </section>
      </section>
    </div>
  </main>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import LiveBackground from '@/components/LiveBackground.vue'
import { appConfig as config } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'
import WelcomeStep from './steps/WelcomeStep.vue'
import PhoneStep from './steps/PhoneStep.vue'
import MethodStep from './steps/MethodStep.vue'
import BundleStep from './steps/BundleStep.vue'
import DetailsStep from './steps/DetailsStep.vue'
import SummaryStep from './steps/SummaryStep.vue'
import SuccessStep from './steps/SuccessStep.vue'

const store = usePortalStore()

function beforeUnload(event) {
  if (!store.hasDirtyInput || store.currentStep === 'success') return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
