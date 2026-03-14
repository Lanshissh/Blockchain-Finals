import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import LoginPage from '../views/LoginPage.vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App,
      beforeEnter: async () => {
        const { init, account } = useAuctusStore()
        await init()

        if (!account.value) {
          return '/login'
        }

        return true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      beforeEnter: async () => {
        const { init, account } = useAuctusStore()
        await init()

        if (account.value) {
          return '/'
        }

        return true
      }
    }
  ]
})

export default router