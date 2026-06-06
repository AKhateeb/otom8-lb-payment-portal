<template>
  <div class="grid min-h-96 place-items-center text-center">
    <div class="max-w-md">
      <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#31A13B] text-white">
        <Check class="h-10 w-10" />
      </div>
      <h2 class="text-3xl font-black">{{ store.t.successTitle }}</h2>
      <p class="mt-3 leading-7 text-[#6B6756]">{{ store.t.successBody }}</p>
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
import { Check } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { appConfig } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

function openApp() {
  window.location.href = appConfig.identity.appDeepLink
}
</script>
