<template>
  <div class="shell">
    <aside class="sidenav" :class="{ open: sidebarOpen }">
      <div class="sidenav-top">
        <div class="brand">
          <div class="brand-logo">TB</div>
          <div class="brand-copy">
            <h1>TaskBit</h1>
            <p>Academic Web3 Tracker</p>
          </div>
        </div>

        <button class="mobile-close" @click="toggleSidebar" aria-label="Close sidebar">
          ✕
        </button>
      </div>

      <div class="role-box">
        <span class="role-label">Role</span>
        <strong>{{ roleLabel }}</strong>
        <small>{{ shortAccount }}</small>
      </div>

      <nav class="nav-group">
        <p class="nav-title">Main</p>

        <RouterLink to="/dashboard" class="nav-link" @click="closeSidebarOnMobile">
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/calendar" class="nav-link" @click="closeSidebarOnMobile">
          <span>Calendar</span>
        </RouterLink>

        <RouterLink to="/contributions" class="nav-link" @click="closeSidebarOnMobile">
          <span>{{ contributionLabel }}</span>
        </RouterLink>

        <RouterLink to="/profile" class="nav-link" @click="closeSidebarOnMobile">
          <span>Profile</span>
        </RouterLink>
      </nav>

      <nav v-if="isProfessor || isAdmin || isOwner" class="nav-group">
        <p class="nav-title">Professor</p>

        <RouterLink to="/review" class="nav-link" @click="closeSidebarOnMobile">
          <span>Review Queue</span>
        </RouterLink>
      </nav>

      <nav v-if="isAdmin || isOwner" class="nav-group">
        <p class="nav-title">Admin</p>

        <RouterLink to="/admin" class="nav-link" @click="closeSidebarOnMobile">
          <span>Admin Panel</span>
        </RouterLink>
      </nav>

      <div class="sidenav-bottom">
        <div class="network-box" :class="{ warning: isWrongNetwork }">
          <span class="role-label">Network</span>
          <strong>{{ networkName }}</strong>
          <small>{{ walletStatus }}</small>
        </div>

        <button
          v-if="!isConnected"
          class="sidebar-btn primary"
          :disabled="isConnecting"
          @click="connectWallet"
        >
          {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
        </button>

        <button
          v-else-if="isWrongNetwork"
          class="sidebar-btn warning"
          @click="switchNetwork"
        >
          Switch Network
        </button>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="toggleSidebar" />

    <div class="content-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" @click="toggleSidebar" aria-label="Open sidebar">
            ☰
          </button>

          <div>
            <p class="page-kicker">TaskBit</p>
            <h2>{{ pageTitle }}</h2>
          </div>
        </div>

        <div class="topbar-right">
          <div class="top-pill" :class="{ warning: isWrongNetwork }">
            {{ networkName }}
          </div>

          <div class="top-pill role">
            {{ roleLabel }}
          </div>

          <div class="top-pill account">
            {{ shortAccount }}
          </div>
        </div>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuctusStore } from './composables/useAuctusStore'

const store = useAuctusStore()
const route = useRoute()
const sidebarOpen = ref(false)

const {
  account,
  walletStatus,
  roleLabel,
  isReviewer,
  isProfessor,
  isAdmin,
  isOwner,
  isConnected,
  isWrongNetwork,
  isConnecting,
  connectWallet,
  switchNetwork,
  init,
  networkName
} = store

const pageTitle = computed(() => {
  const routeTitles = {
    '/dashboard': 'Dashboard',
    '/calendar': 'Calendar',
    '/contributions': 'Contributions',
    '/profile': 'Profile',
    '/review': 'Review',
    '/admin': 'Admin',
    '/login': 'Login'
  }

  return routeTitles[route.path] || 'TaskBit'
})

const shortAccount = computed(() => {
  if (!account.value) return 'Not connected'
  return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
})

const contributionLabel = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Manage Contributions'
  if (isProfessor.value) return 'Review Contributions'
  if (isReviewer.value) return 'Reviewer Panel'
  return 'My Contributions'
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (typeof window !== 'undefined' && window.innerWidth <= 960) {
    sidebarOpen.value = false
  }
}

onMounted(async () => {
  await init()

  if (typeof window !== 'undefined' && window.innerWidth > 960) {
    sidebarOpen.value = true
  }
})
</script>