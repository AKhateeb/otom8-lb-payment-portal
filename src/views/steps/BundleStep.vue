<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.planTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.planSubtitle }}</p>
    </div>
    <div v-if="store.loading" class="grid min-h-40 place-items-center rounded-lg bg-[#FFF8D7]">
      <LoaderCircle class="h-8 w-8 animate-spin text-[#202020]" />
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-2">
      <button
        v-for="plan in store.plans"
        :key="plan.id"
        class="rounded-lg border px-4 py-3 text-start transition hover:border-[#FACE0B]"
        :class="store.selectedPlan?.id === plan.id ? 'border-[#202020] bg-[#FFF8D7]' : 'border-[#EFE6B8] bg-white'"
        @click="store.selectedPlan = plan"
      >
        <p v-if="plan.oldAmount" class="text-sm font-bold text-[#9B8D45] line-through">${{ formatAmount(plan.oldAmount) }}</p>
        <p class="mt-0.5 text-3xl font-black text-[#202020]">${{ formatAmount(plan.amount) }}</p>
        <!-- Plan name hidden for now to keep subscription cards compact. -->
        <!-- <p class="mt-3 text-xs font-semibold text-[#6B6756]">{{ plan.name }}</p> -->
        <p class="mt-1 text-base font-black text-[#202020]">{{ plan.durationLabel }}</p>
        <div
          v-if="store.giftOfferForPlan(plan)"
          class="mt-3 rounded-lg border border-[#E6D470] bg-[#FFFBDF] p-3"
        >
          <div class="flex items-start gap-2.5">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FACE0B] text-[#202020]">
              <Gift class="h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-extrabold leading-5 text-[#202020]">
                {{ store.t.giftPlanBadge(store.giftOfferForPlan(plan).months) }}
              </span>
              <span class="mt-0.5 block text-xs font-semibold leading-5 text-[#6B6756]">
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
