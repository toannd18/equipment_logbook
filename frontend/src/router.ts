import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/EquipmentDashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/logbook',
    name: 'SystemLogbook',
    component: () => import('@/pages/SystemLogbook.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/tickets',
    name: 'Tickets',
    component: () => import('@/pages/Tickets.vue'),
    meta: { requiresAuth: true },
  },
]

let router = createRouter({
  history: createWebHistory('/equipment'),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch('/api/method/frappe.auth.get_logged_user')
      const data = await res.json()
      if (!data.message || data.message === 'Guest') {
        window.location.href = '/login'
        return
      }
    } catch {
      window.location.href = '/login'
      return
    }
  }
  next()
})

export default router
