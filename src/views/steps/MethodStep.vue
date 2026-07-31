<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.methodTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.methodSubtitle }}</p>
    </div>
    <div v-if="store.settingsLoading" class="flex min-h-28 items-center gap-3 rounded-xl border border-[#EFE6B8] bg-[#FFF8D7] p-4 text-sm font-bold text-[#202020]">
      <LoaderCircle class="h-5 w-5 animate-spin" />
      {{ store.lang === 'ar' ? 'جاري تحميل طرق الدفع...' : 'Loading payment methods...' }}
    </div>
    <div v-else-if="store.settingsError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
      <div class="flex items-start gap-3">
        <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
        <p>{{ store.lang === 'ar' ? 'تعذر تحميل طرق الدفع المتاحة.' : 'Could not load available payment methods.' }}</p>
      </div>
      <button
        class="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-800 px-4 text-sm font-black text-white transition hover:bg-red-900"
        @click="store.loadSettingsInBackground(true)"
      >
        <RefreshCw class="h-4 w-4" />
        {{ store.lang === 'ar' ? 'إعادة المحاولة' : 'Retry' }}
      </button>
    </div>
    <div v-else-if="!store.methods.length" class="rounded-xl border border-[#EFE6B8] bg-[#FFF8D7] p-4 text-sm font-bold text-[#202020]">
      {{ store.lang === 'ar' ? 'لا توجد طرق دفع متاحة حاليا.' : 'No payment methods are available right now.' }}
    </div>
    <div v-else class="grid gap-3">
      <button
        v-for="method in store.methods"
        :key="method.id"
        class="flex min-h-20 items-center gap-3 rounded-xl border p-3.5 text-start transition hover:border-[#FACE0B] hover:bg-[#FFF8D7] sm:gap-4 sm:p-4"
        :class="store.selectedMethod?.id === method.id ? 'border-[#202020] bg-[#FFF8D7]' : 'border-[#EFE6B8] bg-white'"
        @click="store.selectMethod(method)"
      >
        <span
          v-if="method.icons?.length"
          class="relative block h-12 w-14 shrink-0"
          role="img"
          :aria-label="method.title"
        >
          <img
            v-for="(icon, index) in method.icons"
            :key="icon"
            alt=""
            :src="icon"
            class="absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg object-contain ring-2 ring-white"
            :class="index === 0 ? 'start-0' : 'end-0'"
          />
        </span>
        <img v-else :src="method.icon" :alt="method.title" class="h-12 w-12 shrink-0 rounded-md object-contain" />
        <span class="min-w-0 flex-1">
          <span class="block font-black">{{ method.title }}</span>
        </span>
        <ChevronRight class="h-5 w-5 shrink-0 text-[#202020]" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangle, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
</script>
