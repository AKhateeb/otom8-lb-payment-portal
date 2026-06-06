import { createRouter, createWebHistory } from 'vue-router'
import PortalView from '@/views/PortalView.vue'
import { usePortalStore } from '@/stores/portalStore'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'portal', component: PortalView },
    { path: '/pay', redirect: '/' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(() => {
  const store = usePortalStore()
  if (!store.selectedMethod && !['welcome', 'method'].includes(store.currentStep)) {
    store.setStep('method')
  }
  if (!store.registeredPhone && !['welcome', 'method', 'phone'].includes(store.currentStep)) {
    store.setStep('phone')
  }
})
