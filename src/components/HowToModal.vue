<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-end bg-[#10201c]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" @click.self="$emit('close')">
    <section ref="panelRef" class="max-h-[92svh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-bold text-[#182326]">{{ title }}</h2>
        <button class="rounded-full p-2 text-[#60706b] hover:bg-[#eff8f1]" @click="$emit('close')" :aria-label="closeLabel">
          <X class="h-5 w-5" />
        </button>
      </div>

      <article class="rounded-xl border border-[#e1ece5] bg-[#fbfdfb] p-4">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#182326] text-2xl font-black text-white">
            {{ activeIndex + 1 }}
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-[#21C063]">Step {{ activeIndex + 1 }} of {{ steps.length }}</p>
            <h3 class="text-xl font-black text-[#182326]">{{ activeStep.title }}</h3>
          </div>
        </div>

        <img :src="activeStep.image" :alt="activeStep.title" class="h-[48svh] max-h-[430px] min-h-64 w-full rounded-lg bg-white object-contain p-2" />
        <p class="mt-4 text-base leading-7 text-[#60706b]">{{ activeStep.body }}</p>
      </article>

      <div class="mt-4 flex items-center justify-between gap-3">
        <button class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d9e7dd] px-4 text-sm font-bold disabled:opacity-40" :disabled="activeIndex === 0" @click="previous">
          <ChevronLeft class="h-4 w-4" />
          Previous
        </button>
        <div class="flex items-center gap-2">
          <button
            v-for="(_, index) in steps"
            :key="index"
            class="h-2.5 rounded-full transition-all"
            :class="index === activeIndex ? 'w-8 bg-[#21C063]' : 'w-2.5 bg-[#cfe2d6]'"
            :aria-label="`Go to step ${index + 1}`"
            @click="goTo(index)"
          />
        </div>
        <button class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#182326] px-4 text-sm font-bold text-white disabled:opacity-40" :disabled="activeIndex === steps.length - 1" @click="next">
          Next
          <ChevronRight class="h-4 w-4" />
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
  steps: { type: Array, required: true },
})

defineEmits(['close'])

const activeIndex = ref(0)
const panelRef = ref(null)
const activeStep = computed(() => props.steps[activeIndex.value] || props.steps[0] || {})

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
