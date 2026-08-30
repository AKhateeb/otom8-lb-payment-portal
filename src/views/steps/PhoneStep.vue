<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <h2 class="text-2xl font-black" dir="auto">{{ store.t.phoneTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]" dir="auto">{{ store.t.phoneSubtitle }}</p>
    </div>
    <aside class="flex gap-3 rounded-xl border-2 border-[#202020] bg-[#FFF3A6] p-4 text-[#202020] shadow-sm" role="note">
      <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#202020] text-[#FACE0B]">
        <UserRound class="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p class="font-black leading-6" dir="auto">{{ store.t.accountPhoneNoticeTitle }}</p>
        <p class="mt-1 text-sm font-semibold leading-6" dir="auto">{{ store.t.accountPhoneNoticeBody }}</p>
      </div>
    </aside>
    <PhoneInput
      v-model="phone"
      v-model:country="country"
      :label="store.t.accountPhoneLabel"
      :placeholder="store.t.accountPhonePlaceholder"
      :search-placeholder="store.t.countrySearch"
    />
    <AppButton type="submit" class="w-full" :loading="store.loading">{{ store.t.continue }}</AppButton>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { UserRound } from 'lucide-vue-next'
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
