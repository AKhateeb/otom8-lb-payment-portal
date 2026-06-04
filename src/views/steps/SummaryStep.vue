<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.summaryTitle }}</h2>
      <p class="mt-2 text-sm text-[#60706b]">
        {{ store.selectedMethod?.type === 'sms' ? store.t.openingSms : store.lang === 'ar' ? 'تأكد من التفاصيل ثم تابع.' : 'Check the details, then continue.' }}
      </p>
    </div>
    <dl class="divide-y divide-[#e1ece5] rounded-lg border border-[#e1ece5] bg-white">
      <div class="flex justify-between gap-4 p-4">
        <dt class="text-[#60706b]">{{ store.t.registeredPhone }}</dt>
        <dd class="font-bold">{{ store.registeredPhone }}</dd>
      </div>
      <div class="flex justify-between gap-4 p-4">
        <dt class="text-[#60706b]">{{ store.t.method }}</dt>
        <dd class="font-bold">{{ store.selectedMethod?.title }}</dd>
      </div>
      <div v-if="store.selectedBundle" class="flex justify-between gap-4 p-4">
        <dt class="text-[#60706b]">{{ store.t.amount }}</dt>
        <dd class="font-bold">${{ Number(store.selectedBundle.amount).toFixed(Number(store.selectedBundle.amount) % 1 ? 2 : 0) }}</dd>
      </div>
      <div v-if="store.selectedMethod?.type === 'sms'" class="flex justify-between gap-4 p-4">
        <dt class="text-[#60706b]">{{ store.t.paymentPhone }}</dt>
        <dd class="font-bold">{{ store.senderPhone }}</dd>
      </div>
      <div v-if="store.selectedMethod?.type === 'promo'" class="flex justify-between gap-4 p-4">
        <dt class="text-[#60706b]">{{ store.t.promoCode }}</dt>
        <dd class="font-bold">{{ store.promoCode.toUpperCase() }}</dd>
      </div>
    </dl>
    <div class="flex gap-3">
      <AppButton variant="secondary" @click="store.setStep('details')">{{ store.t.back }}</AppButton>
      <AppButton class="flex-1" :loading="store.loading" @click="store.submitSummary()">{{ store.t.confirmPayment }}</AppButton>
    </div>
  </div>
</template>

<script setup>
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
</script>
