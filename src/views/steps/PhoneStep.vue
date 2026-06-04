<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.phoneTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#60706b]">{{ store.t.phoneSubtitle }}</p>
    </div>
    <PhoneInput v-model="phone" :label="store.t.phone" />
    <div class="flex gap-3">
      <AppButton variant="secondary" @click="store.setStep('welcome')">{{ store.t.back }}</AppButton>
      <AppButton type="submit" class="flex-1">{{ store.t.continue }}</AppButton>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const phone = ref(store.registeredPhone || '')

function submit() {
  if (!store.validateRegisteredPhone(phone.value)) return
  store.setStep('method')
}
</script>
