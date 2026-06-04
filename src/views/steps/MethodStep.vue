<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.methodTitle }}</h2>
      <p class="mt-2 text-sm text-[#60706b]">{{ store.registeredPhone }}</p>
    </div>
    <div class="grid gap-3">
      <button
        v-for="method in store.methods"
        :key="method.id"
        class="flex items-center gap-4 rounded-lg border p-4 text-start transition hover:border-[#21C063] hover:bg-[#f7fcf8]"
        :class="store.selectedMethod?.id === method.id ? 'border-[#21C063] bg-[#eff8f1]' : 'border-[#e1ece5] bg-white'"
        @click="select(method)"
      >
        <img :src="method.icon" :alt="method.title" class="h-12 w-12 rounded-md object-contain" />
        <span class="flex-1">
          <span class="block font-black">{{ method.title }}</span>
          <span class="mt-1 block text-sm text-[#60706b]">{{ method.subtitle }}</span>
        </span>
        <ChevronRight class="h-5 w-5 text-[#21C063]" />
      </button>
    </div>
    <div class="flex gap-3">
      <AppButton variant="secondary" @click="store.setStep('phone')">{{ store.t.back }}</AppButton>
    </div>
  </div>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()

async function select(method) {
  store.selectedMethod = method
  if (method.type === 'promo') {
    store.selectedBundle = null
    store.setStep('details')
    return
  }
  await store.loadBundles()
  store.setStep('bundle')
}
</script>
