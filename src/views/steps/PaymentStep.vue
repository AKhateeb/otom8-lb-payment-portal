<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-2xl font-black">{{ store.t.paymentTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[#6B6756]">{{ store.t.paymentSubtitle }}</p>
    </div>

    <template v-if="store.selectedMethod?.type === 'promo'">
      <label class="block">
        <span class="mb-2 block text-sm font-semibold">{{ store.t.promoCode }}</span>
        <input
          v-model="store.promoCode"
          maxlength="32"
          class="min-h-12 w-full rounded-lg border border-[#EFE6B8] px-4 font-bold uppercase outline-none focus:border-[#202020] focus:ring-4 focus:ring-[#FACE0B]/25"
          placeholder="EJETCODE"
        />
      </label>
      <AppButton
        class="w-full"
        :disabled="store.promoCode.trim().length < 3 || store.loading"
        :loading="store.loadingAction === 'promo'"
        @click="store.startPayment()"
      >
        {{ store.t.applyCode }}
      </AppButton>
    </template>

    <template v-else-if="store.selectedMethod?.type === 'whish'">
      <section
        v-if="config.isDebug && store.payment?.debugSimulationToken"
        class="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-5 text-amber-950"
      >
        <p class="text-xs font-black uppercase tracking-wider text-amber-700">{{ store.t.debugOnly }}</p>
        <h3 class="mt-1 text-xl font-black">{{ store.t.debugWhishTitle }}</h3>
        <p class="mt-2 text-sm leading-6">{{ store.t.debugWhishBody }}</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <AppButton
            :disabled="store.loading"
            :loading="store.loadingAction === 'debugWhish'"
            @click="store.simulateWhishPayment()"
          >
            {{ store.t.debugWhishSimulate }}
          </AppButton>
          <AppButton variant="secondary" :disabled="store.loading" @click="store.openWhishPayment()">
            {{ store.t.debugWhishOpenGateway }}
          </AppButton>
        </div>
      </section>

      <section v-if="!store.payment?.debugSimulationToken" class="overflow-hidden rounded-lg border border-[#EFE6B8] bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-[#EFE6B8] bg-[#FFFCED] px-4 py-3">
          <p class="text-sm font-black text-[#202020]">{{ store.t.whishGuideTitle }}</p>
          <button
            class="rounded-lg px-3 py-2 text-sm font-bold text-[#6B6756] hover:bg-white hover:text-[#202020] disabled:opacity-50"
            :disabled="store.loading"
            @click="openWhish"
          >
            {{ store.t.skip }}
          </button>
        </div>

        <Transition name="whish-step" mode="out-in">
          <article :key="activeWhishSlide" class="p-4 sm:p-5">
            <div class="mb-4 flex items-start gap-3">
              <div class="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#202020] text-2xl font-black text-[#FACE0B]">
                {{ activeWhishSlide + 1 }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-black uppercase tracking-wide text-[#9B8D45]">
                  {{ store.t.stepProgress(activeWhishSlide + 1, whishSlides.length) }}
                </p>
                <h3 class="text-xl font-black text-[#202020]">{{ currentWhishSlide.title }}</h3>
                <p class="mt-1 text-sm leading-6 text-[#6B6756]">{{ currentWhishSlide.body }}</p>
              </div>
            </div>

            <div class="overflow-hidden rounded-lg border border-[#EFE6B8] bg-white p-3">
              <img
                :src="currentWhishSlide.image"
                :alt="currentWhishSlide.title"
                class="h-[34svh] max-h-[340px] min-h-52 w-full bg-white object-contain"
              />
            </div>
          </article>
        </Transition>

        <div class="flex items-center justify-between gap-3 border-t border-[#EFE6B8] bg-[#FFFCED] p-3">
          <button
            class="rounded-lg border border-[#EFE6B8] bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
            :disabled="activeWhishSlide === 0 || store.loading"
            @click="activeWhishSlide -= 1"
          >
            {{ store.t.previous }}
          </button>

          <div class="flex items-center gap-2">
            <button
              v-for="(_, index) in whishSlides"
              :key="index"
              class="h-2.5 rounded-full transition-all"
              :class="index === activeWhishSlide ? 'w-8 bg-[#202020]' : 'w-2.5 bg-[#E8D66A]'"
              :aria-label="store.t.goToStep(index + 1)"
              @click="activeWhishSlide = index"
            />
          </div>

          <button
            class="min-h-12 min-w-32 rounded-lg bg-[#202020] px-6 py-3 text-base font-black text-[#FACE0B] shadow-lg shadow-yellow-900/10 transition hover:bg-[#0f0f0f] disabled:opacity-50"
            :disabled="store.loading"
            @click="advanceWhish"
          >
            {{ isLastWhishSlide ? store.t.continueToWhish : store.t.next }}
          </button>
        </div>
      </section>

      <aside class="flex flex-col gap-3 rounded-lg border border-[#EFE6B8] bg-[#FFFCED] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-black text-[#202020]">{{ store.t.needPaymentHelp }}</p>
          <p class="mt-1 text-sm leading-5 text-[#6B6756]">{{ store.t.paymentHelpBody }}</p>
        </div>
        <a
          :href="config.identity.whatsappUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#25D366] bg-white px-4 text-sm font-bold text-[#202020] transition hover:bg-[#25D366]/10"
        >
          <img src="/assets/payment/whatsapp.svg" alt="" class="h-5 w-5 shrink-0" />
          {{ store.t.contactSupport }}
        </a>
      </aside>

    </template>

    <template v-else>
      <div class="rounded-lg border border-[#EFE6B8] bg-[#FFFCED] p-5 text-center">
        <img
          v-if="store.selectedMethod?.carrier?.icon"
          :src="store.selectedMethod.carrier.icon"
          :alt="store.selectedMethod.title"
          class="mx-auto mb-3 h-12 w-12 rounded-lg object-contain"
        />
        <template v-if="isMobileDevice">
          <h3 class="text-xl font-black text-[#202020]">{{ store.t.smsSimpleTitle }}</h3>
          <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6B6756]">{{ store.t.smsSimpleBody }}</p>
        </template>
        <p v-else class="mx-auto max-w-lg text-sm font-bold leading-6 text-[#202020]">{{ store.t.smsDesktopInstruction }}</p>
      </div>

      <section v-if="!isMobileDevice" class="rounded-lg border border-[#EFE6B8] bg-white p-4 sm:p-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border-2 p-4 text-center sm:p-5" :style="smsInstructionCardStyle">
            <p class="text-xs font-black uppercase tracking-wider sm:text-sm" :style="{ color: smsCarrierColor }">{{ store.t.smsSendTo }}</p>
            <p class="mt-2 break-all font-mono text-4xl font-black text-[#202020]" dir="ltr">{{ smsShortCode }}</p>
          </div>

          <div class="rounded-xl border-2 p-4 text-center sm:p-5" :style="smsInstructionCardStyle">
            <p class="text-xs font-black uppercase tracking-wider sm:text-sm" :style="{ color: smsCarrierColor }">{{ store.t.smsBodyLabel }}</p>
            <p class="mt-2 break-all font-mono text-2xl font-black text-[#202020] sm:text-3xl" dir="ltr">{{ smsMessageBody }}</p>
          </div>
        </div>

        <p class="mx-auto mt-4 max-w-lg text-center text-sm leading-6 text-[#6B6756]">
          {{ store.t.smsDesktopAmountHint(smsTransferAmount, store.selectedMethod?.title) }}
        </p>
      </section>

      <section
        v-if="store.smsCheckResult || store.smsAwaitingConfirmation"
        class="rounded-xl border-2 p-5"
        :class="
          store.smsAwaitingConfirmation
            ? 'border-[#31A13B] bg-[#EFFAF0]'
            : store.smsCheckResult === 'partial'
              ? 'border-[#D99400] bg-[#FFF8D7]'
              : 'border-[#8AB4D8] bg-[#EEF7FF]'
        "
      >
        <h3 class="text-xl font-black text-[#202020]">
          {{
            store.smsAwaitingConfirmation
              ? store.t.smsConfirmingTitle
              : store.smsCheckResult === 'partial'
                ? store.t.smsPartialTitle
                : store.t.smsPendingTitle
          }}
        </h3>
        <p class="mt-2 text-sm leading-6 text-[#6B6756]">
          {{
            store.smsAwaitingConfirmation
              ? store.t.smsConfirmingBody
              : store.smsCheckResult === 'partial'
                ? store.t.smsPartialBody
                : store.t.smsPendingBody
          }}
        </p>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-white p-3">
            <p class="text-xs font-bold uppercase text-[#6B6756]">{{ store.t.collectedSoFar }}</p>
            <p class="mt-1 text-2xl font-black text-[#202020]">${{ store.smsLastCollected }}</p>
          </div>
          <div class="rounded-lg bg-white p-3">
            <p class="text-xs font-bold uppercase text-[#6B6756]">{{ store.t.remaining }}</p>
            <p class="mt-1 text-2xl font-black text-[#202020]">${{ store.smsRemaining }}</p>
          </div>
        </div>

        <div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            class="h-full rounded-full bg-[#FACE0B] transition-all duration-500"
            :style="{ width: `${smsCollectedProgress}%` }"
          />
        </div>
      </section>

      <div class="grid gap-3">
        <button
          v-if="isMobileDevice"
          class="inline-flex min-h-16 w-full items-center justify-center rounded-xl bg-[#202020] px-6 text-lg font-black text-[#FACE0B] shadow-lg shadow-yellow-900/10 transition hover:bg-[#0f0f0f] disabled:opacity-50"
          :disabled="store.loading"
          @click="store.sendNextSms()"
        >
          {{ store.t.sendUnits }}
        </button>
      </div>

      <aside class="flex flex-col gap-3 rounded-lg border border-[#EFE6B8] bg-[#FFFCED] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-black text-[#202020]">{{ store.t.needPaymentHelp }}</p>
          <p class="mt-1 text-sm leading-5 text-[#6B6756]">{{ store.t.paymentHelpBody }}</p>
        </div>
        <a
          :href="config.identity.whatsappUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#25D366] bg-white px-4 text-sm font-bold text-[#202020] transition hover:bg-[#25D366]/10"
        >
          <img src="/assets/payment/whatsapp.svg" alt="" class="h-5 w-5 shrink-0" />
          {{ store.t.contactSupport }}
        </a>
      </aside>

      <div>
        <AppButton
          class="w-full"
          :variant="isMobileDevice ? 'secondary' : 'primary'"
          :disabled="store.loading"
          :loading="store.loadingAction === 'checkPayment'"
          @click="store.checkCurrentPayment()"
        >
          {{ store.t.sentUnitsCta }}
        </AppButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import { appConfig as config } from '@/config/appConfig'
import { usePortalStore } from '@/stores/portalStore'

const store = usePortalStore()
const activeWhishSlide = ref(0)
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

const whishSlides = computed(() => [
  {
    image: '/assets/how-to/whish/step2.png',
    title: store.t.whishPhoneTitle,
    body: store.t.whishPhoneBody,
  },
  {
    image: '/assets/how-to/whish/step3.png',
    title: store.t.whishOtpTitle,
    body: store.t.whishOtpBody,
  },
  {
    image: '/assets/how-to/whish/step4.png',
    title: store.t.whishCompleteTitle,
    body: store.t.whishCompleteBody,
  },
])

const currentWhishSlide = computed(() => whishSlides.value[activeWhishSlide.value])
const isLastWhishSlide = computed(() => activeWhishSlide.value === whishSlides.value.length - 1)
const smsShortCode = computed(() => store.selectedMethod?.carrier?.shortCode || '')
const smsTransferAmount = computed(() => Number(store.nextSmsChunk || 3))
const smsMessageBody = computed(
  () => `${store.selectedMethod?.carrier?.receiver || ''}t${smsTransferAmount.value.toFixed(0)}`,
)
const smsCarrierColor = computed(() => store.selectedMethod?.carrier?.brandColor || '#202020')
const smsInstructionCardStyle = computed(() => ({
  backgroundColor: store.selectedMethod?.carrier?.brandSoft || '#FFF8D7',
  borderColor: smsCarrierColor.value,
}))
const smsCollectedProgress = computed(() => {
  if (!store.selectedAmount) return 0
  return Math.min(100, (store.smsLastCollected / store.selectedAmount) * 100)
})

function openWhish() {
  store.startPayment()
}

function advanceWhish() {
  if (isLastWhishSlide.value) {
    openWhish()
    return
  }
  activeWhishSlide.value += 1
}

onMounted(() => {
  if (store.selectedMethod?.type === 'sms') store.prepareSmsPayment()
})
</script>
