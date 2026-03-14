import { createRouter, createWebHistory } from 'vue-router'
import CalendarPage from '../views/CalendarPage.vue'
import ContributionsPage from '../views/ContributionsPage.vue'
import LoginPage from '../views/LoginPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/calendar'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage
  },
  {
    path: '/contributions',
    name: 'contributions',
    component: ContributionsPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router