<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-end bg-[#202020]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" @click.self="$emit('close')">
    <section ref="panelRef" class="max-h-[92svh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-bold text-[#202020]">{{ title }}</h2>
        <button class="rounded-full p-2 text-[#6B6756] hover:bg-[#FFF8D7]" @click="$emit('close')" :aria-label="closeLabel">
          <X class="h-5 w-5" />
        </button>
      </div>

      <article class="rounded-lg border border-[#EFE6B8] bg-white p-4">
        <div class="mb-4 flex items-start gap-3">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#202020] text-2xl font-black text-[#FACE0B]">
            {{ activeIndex + 1 }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wide text-[#9B8D45]">{{ progressLabel(activeIndex + 1, steps.length) }}</p>
            <h3 class="text-xl font-black text-[#202020]">{{ activeStep.title }}</h3>
            <p class="mt-1 text-base leading-7 text-[#6B6756]">{{ activeStep.body }}</p>
          </div>
        </div>

        <div class="overflow-hidden rounded-lg border border-[#EFE6B8] bg-white p-2">
          <img :src="activeStep.image" :alt="activeStep.title" class="h-[48svh] max-h-[430px] min-h-64 w-full bg-white object-contain" />
        </div>
      </article>

      <div class="mt-4 flex items-center justify-between gap-3">
        <button class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#EFE6B8] px-4 text-sm font-bold disabled:opacity-40" :disabled="activeIndex === 0" @click="previous">
          <ChevronLeft class="h-4 w-4" />
          {{ previousLabel }}
        </button>
        <div class="flex items-center gap-2">
          <button
            v-for="(_, index) in steps"
            :key="index"
            class="h-2.5 rounded-full transition-all"
            :class="index === activeIndex ? 'w-8 bg-[#202020]' : 'w-2.5 bg-[#E8D66A]'"
            :aria-label="goToStepLabel(index + 1)"
            @click="goTo(index)"
          />
        </div>
        <button class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#202020] px-4 text-sm font-bold text-[#FACE0B]" @click="next">
          {{ isLastStep ? closeLabel : nextLabel }}
          <X v-if="isLastStep" class="h-4 w-4" />
          <ChevronRight v-else class="h-4 w-4" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  closeLabel: { type: String, default: 'Close' },
  nextLabel: { type: String, default: 'Next' },
  previousLabel: { type: String, default: 'Previous' },
  progressLabel: { type: Function, default: (current, total) => `Step ${current} of ${total}` },
  goToStepLabel: { type: Function, default: (step) => `Go to step ${step}` },
  steps: { type: Array, required: true },
})

const emit = defineEmits(['close'])

const activeIndex = ref(0)
const panelRef = ref(null)
const activeStep = computed(() => props.steps[activeIndex.value] || props.steps[0] || {})
const isLastStep = computed(() => activeIndex.value >= props.steps.length - 1)

function scrollTop() {
  nextTick(() => panelRef.value?.scrollTo({ top: 0, behavior: 'smooth' }))
}

function goTo(index) {
  activeIndex.value = Math.min(Math.max(index, 0), props.steps.length - 1)
  scrollTop()
}

function previous() {
  goTo(activeIndex.value - 1)
}

function next() {
  if (isLastStep.value) {
    emit('close')
    return
  }
  goTo(activeIndex.value + 1)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      activeIndex.value = 0
      scrollTop()
    }
  },
)
</script>
