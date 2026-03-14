import { createRouter, createWebHistory } from 'vue-router'
import CalendarPage from '../views/CalendarPage.vue'
import ContributionsPage from '../views/ContributionsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const routes = [
  {
    path: '/',
    redirect: '/calendar'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/contributions',
    name: 'contributions',
    component: ContributionsPage,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const store = useAuctusStore()
  await store.init()

  const isAuthenticated = Boolean(store.account.value)

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    const redirectTarget =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : '/calendar'

    return redirectTarget
  }

  return true
})

export default router
