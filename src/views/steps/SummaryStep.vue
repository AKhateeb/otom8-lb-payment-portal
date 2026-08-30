<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black" dir="auto">{{ store.t.summaryTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]" dir="auto">{{ store.t.summarySubtitle }}</p>
    </div>
    <dl class="divide-y divide-[#EFE6B8] rounded-lg border border-[#EFE6B8] bg-white">
      <div class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.registeredPhone }}</dt>
        <dd class="font-bold" dir="ltr">{{ store.registeredPhone }}</dd>
      </div>
      <div class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.method }}</dt>
        <dd class="text-end font-bold" dir="auto">{{ store.selectedMethod?.title }}</dd>
      </div>
      <div v-if="store.selectedPlan" class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.plan }}</dt>
        <dd class="text-end font-bold" dir="auto">{{ store.selectedPlan.months }} {{ store.t.months }} · ${{ formatAmount(store.selectedPlan.amount) }}</dd>
      </div>
      <div v-if="store.giftOffer" class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.giftIncluded }}</dt>
        <dd class="text-end font-bold" dir="auto">{{ store.t.giftSummaryBody(store.giftOffer.months) }}</dd>
      </div>
      <div v-if="store.selectedMethod?.type === 'sms'" class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.paymentPhone }}</dt>
        <dd class="font-bold" dir="ltr">{{ store.senderPhone }}</dd>
      </div>
      <div v-if="store.selectedMethod?.type === 'promo'" class="flex justify-between gap-4 p-4">
        <dt class="text-[#6B6756]" dir="auto">{{ store.t.promoCode }}</dt>
        <dd class="text-end font-bold" dir="auto">{{ store.promoCode.toUpperCase() }}</dd>
      </div>
    </dl>
    <AppButton class="w-full" :loading="store.loading" @click="store.goToPayment()">{{ store.t.confirmPayment }}</AppButton>
  </div>
</template>

<script setup>
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const formatAmount = (amount) => (Number(amount) % 1 === 0 ? Number(amount).toFixed(0) : Number(amount).toFixed(2))
</script>
