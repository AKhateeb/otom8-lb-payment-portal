<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black" dir="auto">{{ store.t.planTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]" dir="auto">{{ store.t.planSubtitle }}</p>
    </div>
    <div v-if="store.loading" class="grid min-h-40 place-items-center rounded-lg bg-[#FFF8D7]">
      <LoaderCircle class="h-8 w-8 animate-spin text-[#202020]" />
    </div>
    <div v-else class="grid grid-cols-2 gap-2 sm:gap-3">
      <button
        v-for="plan in store.plans"
        :key="plan.id"
        class="min-w-0 rounded-lg border p-3 text-start transition hover:border-[#FACE0B] sm:px-4 sm:py-3"
        :class="store.selectedPlan?.id === plan.id ? 'border-[#202020] bg-[#FFF8D7]' : 'border-[#EFE6B8] bg-white'"
        @click="store.selectedPlan = plan"
      >
        <p v-if="plan.oldAmount" class="text-xs font-bold text-[#9B8D45] line-through sm:text-sm" dir="ltr">${{ formatAmount(plan.oldAmount) }}</p>
        <p class="mt-0.5 text-2xl font-black text-[#202020] sm:text-3xl" dir="ltr">${{ formatAmount(plan.amount) }}</p>
        <!-- Plan name hidden for now to keep subscription cards compact. -->
        <!-- <p class="mt-3 text-xs font-semibold text-[#6B6756]">{{ plan.name }}</p> -->
        <p class="mt-1 text-sm font-black text-[#202020] sm:text-base" dir="auto">{{ plan.durationLabel }}</p>
        <div
          v-if="store.giftOfferForPlan(plan)"
          class="mt-2 rounded-lg border border-[#E6D470] bg-[#FFFBDF] p-2 sm:mt-3 sm:p-3"
        >
          <div class="flex items-center gap-1.5 sm:items-start sm:gap-2.5">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FACE0B] text-[#202020] sm:h-8 sm:w-8">
              <Gift class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <span class="min-w-0">
              <span class="block text-xs font-extrabold leading-4 text-[#202020] sm:text-sm sm:leading-5" dir="auto">
                {{ store.t.giftPlanBadge(store.giftOfferForPlan(plan).months) }}
              </span>
              <span class="mt-0.5 hidden text-xs font-semibold leading-5 text-[#6B6756] sm:block" dir="auto">
                {{ store.t.giftPlanHint }}
              </span>
            </span>
          </div>
        </div>
      </button>
    </div>
    <AppButton class="w-full" :disabled="!store.selectedPlan" @click="store.nextAfterPlan()">{{ store.t.continue }}</AppButton>
  </div>
</template>

<script setup>
import { Gift, LoaderCircle } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const formatAmount = (amount) => (Number(amount) % 1 === 0 ? Number(amount).toFixed(0) : Number(amount).toFixed(2))
</script>
