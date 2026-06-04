<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.bundleTitle }}</h2>
      <p class="mt-2 text-sm text-[#60706b]">{{ store.t.loadingBundles }}</p>
    </div>
    <div v-if="store.loading" class="grid min-h-40 place-items-center rounded-lg bg-[#f7fcf8]">
      <LoaderCircle class="h-8 w-8 animate-spin text-[#21C063]" />
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-3">
      <button
        v-for="bundle in visibleBundles"
        :key="bundle.id"
        class="rounded-lg border p-4 text-start transition hover:border-[#21C063]"
        :class="store.selectedBundle?.id === bundle.id ? 'border-[#21C063] bg-[#eff8f1]' : 'border-[#e1ece5] bg-white'"
        @click="store.selectedBundle = bundle"
      >
        <p class="text-2xl font-black">${{ formatAmount(bundle.amount) }}</p>
        <p class="mt-2 text-sm font-bold text-[#60706b]">{{ bundle.credits }} {{ store.lang === 'ar' ? 'نقاط' : 'credits' }}</p>
      </button>
    </div>
    <div class="flex gap-3">
      <AppButton variant="secondary" @click="store.setStep('method')">{{ store.t.back }}</AppButton>
      <AppButton class="flex-1" :disabled="!store.selectedBundle" @click="store.setStep('details')">{{ store.t.continue }}</AppButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const visibleBundles = computed(() => (store.selectedMethod?.type === 'sms' ? store.bundles.filter((b) => Number(b.amount) <= 3) : store.bundles))
const formatAmount = (amount) => (Number(amount) % 1 === 0 ? Number(amount).toFixed(0) : Number(amount).toFixed(2))
</script>
