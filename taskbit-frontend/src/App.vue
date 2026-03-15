<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuctusStore } from './composables/useAuctusStore'

const store = useAuctusStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  store.init()
})

const isAuthenticated = computed(() => store.isConnected.value)
const isAdmin = computed(() => store.isAdmin.value || store.isOwner.value)
const canReview = computed(
  () =>
    store.isReviewer.value ||
    store.isProfessor.value ||
    store.isAdmin.value ||
    store.isOwner.value
)

const isLoginPage = computed(() => route.path === '/login')

const navigationItems = computed(() => {
  if (!isAuthenticated.value) {
    return []
  }

  const items = [
    {
      label: 'Calendar',
      to: '/calendar',
      icon: 'calendar'
    },
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Contributions',
      to: '/contributions',
      icon: 'contributions'
    },
    {
      label: 'Profile',
      to: '/profile',
      icon: 'profile'
    }
  ]

  if (canReview.value) {
    items.push({
      label: 'Review',
      to: '/review',
      icon: 'review'
    })
  }

  if (isAdmin.value) {
    items.push({
      label: 'Admin',
      to: '/admin',
      icon: 'admin'
    })
  }

  return items
})

const pageTitle = computed(() => {
  return String(route.meta?.title || 'TaskBit')
})

const walletChipClass = computed(() => {
  if (!isAuthenticated.value) return 'muted'
  if (store.isWrongNetwork.value) return 'warning'
  return 'success'
})

const roleChipClass = computed(() => {
  if (isAdmin.value) return 'primary'
  if (canReview.value) return 'warning'
  return 'success'
})

function shortenAddress(address) {
  const value = String(address || '')
  if (value.length < 10) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function handleLogout() {
  store.disconnectWallet()
  router.replace('/login')
}

function iconPath(icon) {
  switch (icon) {
    case 'calendar':
      return 'M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'
    case 'dashboard':
      return 'M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z'
    case 'contributions':
      return 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
    case 'profile':
      return 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 1 1 14 0'
    case 'review':
      return 'm9 12 2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z'
    case 'admin':
      return 'M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4Z'
    default:
      return 'M4 12h16'
  }
}
</script>

<template>
  <RouterView v-if="isLoginPage" />

  <div v-else class="app-shell">
    <aside v-if="isAuthenticated" class="app-sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge logo-badge">
          <img src="/logo.png" alt="TaskBit logo" class="brand-logo" />
        </div>
        <div class="brand-copy">
          <h1>TaskBit</h1>
          <p>Academic contribution tracker</p>
        </div>
      </div>

      <div class="sidebar-section">
        <p class="sidebar-label">Navigation</p>

        <nav class="sidebar-nav">
          <RouterLink
            v-for="item in navigationItems"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="{ active: route.path === item.to }"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path :d="iconPath(item.icon)" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-status">
        <div class="status-card">
          <p class="status-label">Role</p>
          <strong>{{ store.roleLabel.value }}</strong>
        </div>

        <div class="status-card">
          <p class="status-label">My Contributions</p>
          <strong>{{ store.contributionCount.value }}</strong>
        </div>

        <div class="status-card">
          <p class="status-label">Reputation</p>
          <strong>{{ store.reputation.value }}</strong>
        </div>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-header">
        <div class="header-copy">
          <p class="eyebrow">TaskBit</p>
          <h2>{{ pageTitle }}</h2>
        </div>

        <div class="header-actions">
          <button
            v-if="!isAuthenticated"
            class="header-button primary"
            type="button"
            @click="store.connectWallet"
            :disabled="store.isConnecting.value"
          >
            {{ store.isConnecting.value ? 'Connecting...' : 'Connect Wallet' }}
          </button>

          <button
            v-else-if="store.isWrongNetwork.value"
            class="header-button warning"
            type="button"
            @click="store.switchNetwork"
          >
            Switch Network
          </button>

          <div v-if="isAuthenticated" class="header-chips">
            <span class="header-chip" :class="walletChipClass">
              {{ shortenAddress(store.account.value) }}
            </span>
            <span class="header-chip" :class="roleChipClass">
              {{ store.roleLabel.value }}
            </span>
          </div>

          <button
            v-if="isAuthenticated"
            class="header-button danger"
            type="button"
            @click="handleLogout"
          >
            Log out
          </button>
        </div>
      </header>

      <section class="top-status-grid">
        <div class="top-status-card">
          <p class="top-status-label">Wallet</p>
          <strong>{{ store.walletStatus.value }}</strong>
        </div>

        <div class="top-status-card">
          <p class="top-status-label">Contract</p>
          <strong>{{ store.contractStatus.value }}</strong>
        </div>

        <div class="top-status-card">
          <p class="top-status-label">Transaction</p>
          <strong>{{ store.txStatus.value }}</strong>
          <a
            v-if="store.latestTxUrl.value"
            :href="store.latestTxUrl.value"
            target="_blank"
            rel="noreferrer"
            class="tx-link"
          >
            View on explorer
          </a>
        </div>
      </section>

      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 28%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.1), transparent 24%),
    #f6f8fc;
  color: #0f172a;
}

.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px 18px;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 14px 30px rgba(79, 70, 229, 0.25);
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.1;
}

.brand-copy p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  color: #334155;
  text-decoration: none;
  transition: all 0.2s ease;
}

.sidebar-link svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.sidebar-link:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #312e81;
}

.sidebar-link.active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.14), rgba(124, 58, 237, 0.12));
  color: #312e81;
  font-weight: 700;
}

.sidebar-status {
  margin-top: auto;
  display: grid;
  gap: 12px;
}

.status-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.status-card strong {
  display: block;
  margin-top: 6px;
  font-size: 1rem;
}

.status-label {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.app-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
}

.header-copy h2 {
  margin: 4px 0 0;
  font-size: clamp(1.4rem, 2vw, 2rem);
  line-height: 1.1;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6366f1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.header-button {
  appearance: none;
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.header-button:hover {
  transform: translateY(-1px);
}

.header-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.header-button.primary {
  color: white;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

.header-button.warning {
  color: #7c2d12;
  background: #fed7aa;
}

.header-button.danger {
  color: white;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.header-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.header-chip {
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.header-chip.success {
  color: #166534;
  background: #dcfce7;
}

.header-chip.warning {
  color: #92400e;
  background: #fef3c7;
}

.header-chip.primary {
  color: #312e81;
  background: #e0e7ff;
}

.header-chip.muted {
  color: #475569;
  background: #e2e8f0;
}

.top-status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.top-status-card {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05);
}

.top-status-card strong {
  display: block;
  margin-top: 6px;
  line-height: 1.45;
  word-break: break-word;
}

.top-status-label {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.tx-link {
  display: inline-block;
  margin-top: 10px;
  color: #4f46e5;
  text-decoration: none;
  font-weight: 700;
}

.tx-link:hover {
  text-decoration: underline;
}

.app-content {
  min-width: 0;
  min-height: 0;
}

@media (max-width: 1080px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .sidebar-status {
    margin-top: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .app-main {
    padding: 16px;
  }

  .app-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .top-status-grid,
  .sidebar-status {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .app-sidebar {
    padding: 16px;
  }

  .sidebar-nav {
    gap: 6px;
  }

  .sidebar-link {
    padding: 11px 12px;
  }

  .app-header,
  .top-status-card,
  .status-card {
    border-radius: 18px;
  }
}
</style>