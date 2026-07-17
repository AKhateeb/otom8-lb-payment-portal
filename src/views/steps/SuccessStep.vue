<template>
  <div class="grid min-h-96 place-items-center text-center">
    <div class="max-w-md">
      <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#31A13B] text-white">
        <Check class="h-10 w-10" />
      </div>
      <h2 class="text-3xl font-black">{{ store.t.successTitle }}</h2>
      <p class="mt-3 leading-7 text-[#6B6756]">{{ store.t.successBody }}</p>
      <section v-if="store.giftOffer" class="gift-claim-card relative mt-5 overflow-hidden rounded-xl border-2 border-[#202020] bg-[#FFF8D7] p-4 text-start shadow-lg shadow-yellow-950/10">
        <div v-if="!store.giftApplied" class="gift-attention-rows" aria-hidden="true">
          <span class="gift-attention-row" />
          <span class="gift-attention-row" />
          <span class="gift-attention-row" />
        </div>

        <div class="relative flex items-start gap-3">
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#202020] text-[#FACE0B]">
            <Gift class="h-6 w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-black uppercase tracking-wide text-[#766600]">{{ store.t.giftIncluded }}</p>
            <h3 class="mt-1 text-xl font-black text-[#202020]">{{ store.t.giftSuccessTitle(store.giftOffer.months) }}</h3>
          </div>
        </div>

        <div v-if="store.giftApplied" class="relative mt-4 rounded-lg border border-[#31A13B] bg-[#EFFAF0] p-3 text-[#202020]">
          <p class="font-black">{{ store.t.giftAppliedTitle }}</p>
          <p class="mt-1 text-sm leading-6 text-[#4F6A52]" dir="auto">
            {{ store.t.giftAppliedBody(store.giftResult?.phone || store.giftPhone, store.giftResult?.months || store.giftOffer.months) }}
          </p>
        </div>

        <form v-else class="relative mt-4 space-y-3" @submit.prevent="store.applyGiftRenewal()">
          <div class="gift-field-focus rounded-xl border border-[#E6D470] bg-white/90 p-3 shadow-sm">
            <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-[#202020] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#FACE0B]">
              <Sparkles class="h-3.5 w-3.5" />
              {{ store.t.giftClaimLabel }}
            </p>
            <PhoneInput
              v-model="store.giftPhone"
              v-model:country="store.giftCountry"
              :label="store.t.giftPhoneLabel"
              :placeholder="store.t.phonePlaceholder"
              :search-placeholder="store.t.countrySearch"
            />
          </div>
          <p v-if="store.giftError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            {{ store.giftError }}
          </p>
          <AppButton
            type="submit"
            class="w-full"
            :disabled="!store.giftPhone || store.loading"
            :loading="store.loadingAction === 'gift'"
          >
            {{ store.t.giftApplyCta }}
          </AppButton>
        </form>
      </section>
      <div v-if="!isMobileDevice" class="mt-5 rounded-xl border border-[#EFE6B8] bg-[#FFF8D7] p-4">
        <p class="font-black text-[#202020]">{{ store.t.openAppOnPhoneTitle }}</p>
        <p class="mt-1 text-sm leading-6 text-[#6B6756]">{{ store.t.openAppOnPhoneBody }}</p>
      </div>
      <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <AppButton v-if="isMobileDevice" @click="openApp">{{ store.t.openApp }}</AppButton>
        <AppButton variant="secondary" @click="store.reset()">{{ store.t.newPayment }}</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Check, Gift, Sparkles } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { appConfig } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

function openApp() {
  window.location.href = appConfig.identity.appDeepLink
}
</script>
