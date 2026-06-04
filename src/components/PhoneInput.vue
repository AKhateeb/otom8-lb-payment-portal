<template>
  <label class="block">
    <span class="mb-2 block text-sm font-semibold text-[#243332]">{{ label }}</span>
    <div class="grid grid-cols-[108px_1fr] rounded-lg border border-[#d9e7dd] bg-white shadow-sm focus-within:border-[#21C063] focus-within:ring-4 focus-within:ring-[#21C063]/10">
      <select v-model="country" class="rounded-l-lg border-0 bg-[#f4faf6] px-3 text-sm font-semibold text-[#243332] outline-none">
        <option value="LB">LB +961</option>
        <option value="AE">AE +971</option>
        <option value="SA">SA +966</option>
        <option value="US">US +1</option>
        <option value="FR">FR +33</option>
      </select>
      <input
        :value="modelValue"
        inputmode="tel"
        autocomplete="tel"
        maxlength="18"
        class="min-h-12 rounded-r-lg border-0 px-4 text-base text-[#182326] outline-none"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  </label>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '+961 70 902 894' },
})

defineEmits(['update:modelValue'])
const country = ref('LB')
</script>
