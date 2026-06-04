<template>
  <div class="grid min-h-96 place-items-center text-center">
    <div class="max-w-md">
      <div class="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#21C063] text-white">
        <Check class="h-10 w-10" />
      </div>
      <h2 class="text-3xl font-black">{{ store.t.successTitle }}</h2>
      <p class="mt-3 leading-7 text-[#60706b]">{{ store.t.successBody }}</p>
      <AppButton class="mt-7" @click="store.reset()">{{ store.lang === 'ar' ? 'دفع جديد' : 'New payment' }}</AppButton>
    </div>
  </div>
</template>

<script setup>
import { Check } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
</script>
