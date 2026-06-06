<template>
  <div class="space-y-5">
    <div>
      <img
        :src="store.lang === 'ar' ? '/assets/brand/welcome-ar.webp' : '/assets/brand/welcome-en.webp'"
        :alt="store.lang === 'ar' ? 'تطبيق إيجت الكهرباء' : 'Ejet Elkahraba app'"
        class="mx-auto mb-4 h-auto max-h-64 w-auto max-w-full object-contain sm:max-h-72"
      />
      <h2 class="text-2xl font-black text-[#202020]">{{ store.t.welcomeTitle }}</h2>
      <p class="mt-3 text-sm leading-6 text-[#6B6756]">{{ store.t.welcomeBody }}</p>
    </div>
    <AppButton class="w-full" @click="store.setStep('method')">
      <ArrowRight class="h-4 w-4" />
      {{ store.t.start }}
    </AppButton>
  </div>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
</script>
