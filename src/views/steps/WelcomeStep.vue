<template>
  <div class="space-y-5">
    <div>
      <img
        :src="store.lang === 'ar' ? '/assets/brand/welcome-ar.webp' : '/assets/brand/welcome-en.webp'"
        :alt="store.lang === 'ar' ? 'تطبيق إجت الكهربا' : 'Ejet Elkahraba app'"
        class="mx-auto mb-3 h-auto max-h-52 w-auto max-w-full object-contain sm:mb-4 sm:max-h-72"
      />
      <h1 class="text-[1.7rem] font-black leading-tight text-[#202020] sm:text-3xl" dir="auto">{{ store.t.welcomeTitle }}</h1>
      <p class="mt-3 text-[15px] leading-7 text-[#6B6756]" dir="auto">{{ store.t.welcomeBody }}</p>
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
