<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#FACE0B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
    :class="variant === 'secondary' ? 'border border-[#EFE6B8] bg-white text-[#202020] hover:border-[#202020]' : 'bg-[#202020] text-[#FACE0B] shadow-lg shadow-yellow-900/10 hover:bg-[#0f0f0f]'"
  >
    <LoaderCircle v-if="loading" class="h-5 w-5 shrink-0 animate-spin" />
    <slot />
  </button>
</template>

<script setup>
import { LoaderCircle } from 'lucide-vue-next'

defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>
