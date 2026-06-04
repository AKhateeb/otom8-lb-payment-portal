<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f7fbf8]">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(33,192,99,.16),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(0,128,105,.12),transparent_30%),linear-gradient(135deg,#ffffff,#eff8f1_48%,#f8fbff)]" />
    <div class="payment-grid absolute inset-0 opacity-[0.18]" />
    <div class="float-band absolute -left-1/4 top-1/4 h-24 w-[150%] rotate-[-8deg] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    <div class="float-band-delayed absolute -left-1/4 bottom-1/4 h-20 w-[150%] rotate-[7deg] bg-gradient-to-r from-transparent via-[#21C063]/10 to-transparent" />
    <div class="pulse-line absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-[#21C063] to-transparent opacity-50" />
  </div>
</template>
