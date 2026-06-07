<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.methodTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.methodSubtitle }}</p>
    </div>
    <div class="grid gap-3">
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
            :src="method.icons[0]"
            alt=""
            class="absolute start-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg object-contain ring-2 ring-white"
          />
          <img
            :src="method.icons[1]"
            alt=""
            class="absolute end-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg object-contain ring-2 ring-white"
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
import { ChevronRight } from 'lucide-vue-next'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
</script>
