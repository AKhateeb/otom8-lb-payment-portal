<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#21C063] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
    :class="variant === 'secondary' ? 'border border-[#d8e6dc] bg-white text-[#182326] hover:border-[#21C063]' : 'bg-[#182326] text-white shadow-lg shadow-emerald-900/10 hover:bg-[#0d1719]'"
  >
    <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
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
