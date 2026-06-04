<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.detailsTitle }}</h2>
      <p class="mt-2 text-sm text-[#60706b]">{{ store.selectedMethod?.title }}</p>
    </div>

    <template v-if="store.selectedMethod?.type === 'sms'">
      <PhoneInput v-if="!store.payment?.id" v-model="sender" :label="store.t.paymentPhone" />
      <label v-if="!store.payment?.id" class="flex items-center gap-3 rounded-lg bg-[#f7fcf8] p-3 text-sm font-semibold">
        <input v-model="store.useSamePhone" type="checkbox" class="h-4 w-4 accent-[#21C063]" @change="samePhoneChanged" />
        {{ store.t.useSamePhone }}
      </label>

      <div class="rounded-lg border border-[#dcebe2] bg-white p-4">
        <p class="text-sm font-semibold text-[#60706b]">{{ store.t.smsInstruction }}</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg bg-[#f7fcf8] p-3">
            <p class="text-xs font-bold uppercase text-[#60706b]">To</p>
            <p class="mt-1 font-mono text-lg font-black">{{ store.selectedMethod.carrier.shortCode }}</p>
          </div>
          <div class="rounded-lg bg-[#f7fcf8] p-3">
            <p class="text-xs font-bold uppercase text-[#60706b]">Message</p>
            <p class="mt-1 font-mono text-lg font-black">{{ store.selectedMethod.carrier.receiver }}t{{ amount }}</p>
          </div>
        </div>
      </div>

      <button class="text-sm font-bold text-[#008069]" @click="howToOpen = true">{{ store.t.checkHow }}</button>
    </template>

    <template v-else-if="store.selectedMethod?.type === 'whish'">
      <div class="rounded-lg border border-[#dcebe2] bg-[#f7fcf8] p-4">
        <CreditCard class="mb-3 h-7 w-7 text-[#21C063]" />
        <p class="font-bold">{{ store.t.payWithWhish }}</p>
        <p class="mt-2 text-sm leading-6 text-[#60706b]">{{ store.t.payWithWhishHint }}</p>
      </div>
      <button class="text-sm font-bold text-[#008069]" @click="howToOpen = true">{{ store.t.checkHow }}</button>
      <div v-if="store.payment?.link" class="rounded-lg bg-[#eff8f1] p-3 text-sm">
        <a class="font-bold text-[#008069]" :href="store.payment.link" target="_blank" rel="noreferrer">{{ store.t.whishOpenAgain }}</a>
      </div>
    </template>

    <template v-else>
      <label class="block">
        <span class="mb-2 block text-sm font-semibold">{{ store.t.promoCode }}</span>
        <input v-model="store.promoCode" maxlength="32" class="min-h-12 w-full rounded-lg border border-[#d9e7dd] px-4 font-bold uppercase outline-none focus:border-[#21C063] focus:ring-4 focus:ring-[#21C063]/10" placeholder="SMARTADS" />
      </label>
    </template>

    <div v-if="store.payment?.id" class="rounded-lg border border-[#dcebe2] p-4">
      <p class="text-xs font-bold uppercase text-[#60706b]">Payment ID</p>
      <p class="mt-1 break-all font-mono text-sm">{{ store.payment.id }}</p>
    </div>

    <div class="flex flex-wrap gap-3">
      <AppButton variant="secondary" @click="goBack">{{ store.t.back }}</AppButton>
      <AppButton v-if="!store.payment?.id" class="flex-1" :disabled="!canContinue" @click="continueToSummary">{{ store.t.continue }}</AppButton>
      <AppButton v-if="store.payment?.smsHref" class="flex-1" @click="store.openSmsAppAgain()">{{ store.t.openSmsNow }}</AppButton>
      <AppButton v-if="store.payment?.id" variant="secondary" :loading="store.loading" @click="store.checkCurrentPayment()">{{ store.t.checkPayment }}</AppButton>
      <AppButton v-if="store.payment?.id && config.isDebug && store.selectedMethod?.type === 'sms'" :loading="store.loading" @click="store.sendSmsDebugWebhook()">
        Debug webhook
      </AppButton>
    </div>

    <HowToModal :open="howToOpen" :title="store.t.checkHow" :close-label="store.t.close" :steps="howToSteps" @close="howToOpen = false" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { CreditCard } from 'lucide-vue-next'
import AppButton from '@/components/AppButton.vue'
import HowToModal from '@/components/HowToModal.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { appConfig as config } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const sender = ref(store.senderPhone || store.registeredPhone)
const howToOpen = ref(false)
const amount = computed(() => Number(store.selectedBundle?.amount || config.payment.monthlyPrice))
const canContinue = computed(() => {
  if (store.selectedMethod?.type === 'promo') return store.promoCode.trim().length >= 3
  if (store.selectedMethod?.type === 'sms') return sender.value.trim().length >= 6
  return true
})

watch(
  () => store.useSamePhone,
  (same) => {
    if (same) sender.value = store.registeredPhone
  },
)

function samePhoneChanged() {
  if (store.useSamePhone) sender.value = store.registeredPhone
}

function continueToSummary() {
  if (store.selectedMethod?.type === 'sms' && !store.validateSenderPhone(sender.value)) return
  store.setStep('summary')
}

function goBack() {
  if (store.payment?.id) return store.setStep('summary')
  if (store.selectedMethod?.type === 'promo') store.setStep('method')
  else store.setStep('bundle')
}

const howToSteps = computed(() => {
  if (store.selectedMethod?.type === 'whish') {
    return [
      { image: '/assets/how-to/whish/step1.webp', title: 'Open Whish', body: 'Tap Confirm and we open the Whish payment page.' },
      { image: '/assets/how-to/whish/step2.webp', title: 'Enter Whish phone', body: 'Use the phone linked to your Whish account.' },
      { image: '/assets/how-to/whish/step3.webp', title: 'Enter OTP', body: 'Copy the OTP notification from the Whish app.' },
      { image: '/assets/how-to/whish/step4.webp', title: 'Return here', body: 'After payment, return here while we check the status.' },
    ]
  }
  return [
    { image: '/assets/how-to/units/step1.webp', title: 'Confirm here', body: 'Tap Confirm so we create the payment request.' },
    { image: '/assets/how-to/units/step2.webp', title: 'Send the SMS', body: 'Your SMS app opens with the shortcode and message filled.' },
    { image: '/assets/how-to/units/step3.webp', title: 'Come back', body: 'Return here and tap Check payment status.' },
  ]
})
</script>
