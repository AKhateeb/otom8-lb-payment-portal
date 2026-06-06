<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f2f2f2]">
    <div class="absolute inset-0 bg-[linear-gradient(135deg,#ffffff,#FFF8D7_48%,#f2f2f2)]" />
    <div class="payment-grid absolute inset-0 opacity-[0.22]" />
    <div class="float-band absolute -left-1/4 top-1/4 h-20 w-[150%] rotate-[-8deg] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    <div class="float-band-delayed absolute -left-1/4 bottom-1/4 h-16 w-[150%] rotate-[7deg] bg-gradient-to-r from-transparent via-[#FACE0B]/20 to-transparent" />
    <div class="pulse-line absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-[#202020] to-transparent opacity-40" />
  </div>
</template>
