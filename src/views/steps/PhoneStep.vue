<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.phoneTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.phoneSubtitle }}</p>
    </div>
    <PhoneInput
      v-model="phone"
      v-model:country="country"
      :label="store.t.phone"
      :placeholder="store.t.phonePlaceholder"
      :search-placeholder="store.t.countrySearch"
    />
    <AppButton type="submit" class="w-full" :loading="store.loading">{{ store.t.continue }}</AppButton>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const phone = ref(store.registeredPhone || '')
const country = ref('LB')

async function submit() {
  if (!(await store.validateRegisteredPhone(phone.value, country.value))) return
  store.nextAfterPhone()
}
</script>
