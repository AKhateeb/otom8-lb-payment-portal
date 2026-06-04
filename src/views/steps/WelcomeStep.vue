<template>
  <div class="space-y-6">
    <div class="rounded-xl bg-[#eff8f1] p-5">
      <Sparkles class="mb-4 h-8 w-8 text-[#21C063]" />
      <h2 class="text-2xl font-black text-[#14201d]">{{ store.lang === 'ar' ? 'ادفع وجدّد حسابك' : 'Pay and renew your account' }}</h2>
      <p class="mt-2 leading-7 text-[#60706b]">
        {{ store.lang === 'ar' ? 'أدخل رقم حسابك، اختر Whish أو رصيد الهاتف أو كود التفعيل، ثم أكمل الدفع.' : 'Enter your account phone, choose Whish, phone credit, or activation code, then complete payment.' }}
      </p>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <div v-for="item in items" :key="item.title" class="rounded-lg border border-[#e1ece5] p-4">
        <component :is="item.icon" class="mb-3 h-5 w-5 text-[#008069]" />
        <p class="text-sm font-bold">{{ item.title }}</p>
      </div>
    </div>
    <AppButton class="w-full" @click="store.setStep('phone')">
      <ArrowRight class="h-4 w-4" />
      {{ store.t.start }}
    </AppButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, BadgeCheck, Clock, ShieldCheck, Sparkles } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const items = computed(() => [
  { icon: ShieldCheck, title: store.lang === 'ar' ? 'ربط برقم الحساب' : 'Linked to account phone' },
  { icon: Clock, title: store.lang === 'ar' ? 'تحقق تلقائي عند النجاح' : 'Automatic success check' },
  { icon: BadgeCheck, title: store.lang === 'ar' ? 'ملخص قبل الدفع' : 'Review before payment' },
])
</script>
