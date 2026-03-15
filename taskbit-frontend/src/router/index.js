import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '../views/DashboardPage.vue'
import CalendarPage from '../views/CalendarPage.vue'
import ContributionsPage from '../views/ContributionsPage.vue'
import LoginPage from '../views/LoginPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import ReviewPage from '../views/ReviewPage.vue'
import AdminPage from '../views/AdminPage.vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const routes = [
  {
    path: '/',
    name: 'root',
    redirect: () => {
      const store = useAuctusStore()
      return store.account.value ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      guestOnly: true,
      title: 'Login'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage,
    meta: {
      requiresAuth: true,
      title: 'Calendar'
    }
  },
  {
    path: '/contributions',
    name: 'contributions',
    component: ContributionsPage,
    meta: {
      requiresAuth: true,
      title: 'Contributions'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: {
      requiresAuth: true,
      title: 'Profile'
    }
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewPage,
    meta: {
      requiresAuth: true,
      requiresProfessor: true,
      title: 'Review'
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Admin'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: () => {
      const store = useAuctusStore()
      return store.account.value ? '/dashboard' : '/login'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const store = useAuctusStore()
  await store.init()
  await store.loadContributions()

  const isAuthenticated = Boolean(store.account.value)
  const isReviewer = Boolean(store.isReviewer.value)
  const isProfessor = Boolean(store.isProfessor.value)
  const isAdmin = Boolean(store.isAdmin.value)
  const isOwner = Boolean(store.isOwner.value)

  if (typeof document !== 'undefined') {
    const pageTitle = to.meta?.title ? `${to.meta.title} | TaskBit` : 'TaskBit'
    document.title = pageTitle
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return '/dashboard'
  }

  if (to.meta.requiresReviewer && !isReviewer) {
    return '/dashboard'
  }

  if (to.meta.requiresProfessor && !isProfessor && !isAdmin && !isOwner) {
    return '/dashboard'
  }

  if (to.meta.requiresAdmin && !isAdmin && !isOwner) {
    return '/dashboard'
  }

  return true
})

export default router