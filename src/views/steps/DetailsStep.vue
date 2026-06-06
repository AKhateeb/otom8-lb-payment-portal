<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.detailsTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.detailsSubtitle }}</p>
    </div>

    <PhoneInput
      ref="phoneInputRef"
      v-model="sender"
      v-model:country="country"
      :label="store.t.paymentPhone"
      :lock-country="store.selectedMethod?.type === 'sms'"
      :placeholder="store.t.phonePlaceholder"
      :search-placeholder="store.t.countrySearch"
    />
    <label class="flex items-center gap-3 rounded-lg bg-[#FFF8D7] p-3 text-sm font-semibold" :class="{ 'opacity-55': !accountPhoneCanSendUnits }">
      <input
        v-model="store.useSamePhone"
        type="checkbox"
        class="h-4 w-4 accent-[#FACE0B]"
        :disabled="!accountPhoneCanSendUnits"
        @change="samePhoneChanged"
      />
      {{ store.t.useSamePhone }}
    </label>

    <AppButton type="submit" class="w-full">{{ store.t.continue }}</AppButton>
  </form>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { usePortalStore } from '@/stores/portalStore'
import { isLebanesePhone } from '@/utils/phone'

const store = usePortalStore()
const accountPhoneCanSendUnits = computed(() => isLebanesePhone(store.registeredPhone))
const sender = ref(store.senderPhone || (accountPhoneCanSendUnits.value ? store.registeredPhone : ''))
const country = ref('LB')
const phoneInputRef = ref(null)

async function samePhoneChanged() {
  if (store.useSamePhone) {
    if (!accountPhoneCanSendUnits.value) {
      store.useSamePhone = false
      return
    }
    sender.value = store.registeredPhone
    return
  }

  sender.value = ''
  await nextTick()
  phoneInputRef.value?.focus()
}

function submit() {
  if (!store.validateSenderPhone(sender.value, country.value)) return
  store.nextAfterDetails()
}

onMounted(async () => {
  if (sender.value) return
  await nextTick()
  phoneInputRef.value?.focus()
})
</script>
