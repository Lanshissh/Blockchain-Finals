<template>
  <div class="app-shell dashboard-shell">
    <aside class="sidebar-shell">
      <div class="sidebar-panel">
        <div class="brand sidebar-brand">
          <img src="/logo.png" class="brand-logo" alt="TaskBit Logo" />
          <div>
            <h1>{{ appBrand }}</h1>
            <p class="brand-subtitle">Blockchain Academic Contribution Tracker</p>
          </div>
        </div>

        <div class="sidebar-section-label">Navigation</div>
        <nav class="page-nav sidebar-nav">
          <RouterLink
            to="/dashboard"
            class="page-nav-link sidebar-nav-link"
            active-class="page-nav-link-active"
          >
            <span class="nav-link-icon">🏠</span>
            <span>Dashboard</span>
          </RouterLink>

          <RouterLink
            to="/calendar"
            class="page-nav-link sidebar-nav-link"
            active-class="page-nav-link-active"
          >
            <span class="nav-link-icon">📅</span>
            <span>Calendar</span>
          </RouterLink>

          <RouterLink
            to="/contributions"
            class="page-nav-link sidebar-nav-link"
            active-class="page-nav-link-active"
          >
            <span class="nav-link-icon">📚</span>
            <span>Academic Contributions</span>
          </RouterLink>
        </nav>

        <div class="sidebar-section-label">Connection</div>
        <div class="sidebar-status-stack">
          <span class="network-badge sidebar-chip" :class="{ 'network-badge-warning': isWrongNetwork }">
            {{ networkName }}
          </span>

          <span class="network-detail sidebar-chip">
            {{ walletStatus }}
          </span>

          <span class="network-detail sidebar-chip">
            {{ contractStatus }}
          </span>

          <div v-if="account" class="wallet-badge sidebar-wallet-badge">
            <span class="wallet-dot" aria-hidden="true"></span>
            {{ `${account.slice(0, 6)}...${account.slice(-4)}` }}
          </div>
        </div>
      </div>
    </aside>

    <div class="dashboard-main">
      <header class="content-header">
        <div class="content-header-copy">
          <p class="content-header-eyebrow">Overview</p>
          <h2>Dashboard</h2>
          <p class="content-header-subtitle">
            View your academic contribution summary, deadlines, and quick actions in one place.
          </p>
        </div>

        <div class="content-header-status">
          <span class="network-badge" :class="{ 'network-badge-warning': isWrongNetwork }">
            {{ networkName }}
          </span>

          <div v-if="account" class="wallet-badge header-wallet-badge">
            <span class="wallet-dot" aria-hidden="true"></span>
            {{ `${account.slice(0, 6)}...${account.slice(-4)}` }}
          </div>
        </div>
      </header>

      <main class="main-content">
        <section class="toolbar-card">
          <div class="toolbar-copy">
            <h3>Quick Actions</h3>
            <p class="section-subtitle">
              Jump directly to the pages you use most.
            </p>
          </div>

          <div class="hero-actions">
            <RouterLink to="/calendar" class="submit-btn">Open Calendar</RouterLink>
            <RouterLink to="/contributions" class="refresh-btn">Manage Contributions</RouterLink>
          </div>
        </section>

        <section class="stats-bar">
          <div class="stat-card">
            <span class="stat-label">Total Contributions</span>
            <strong class="stat-value">{{ contributions.length }}</strong>
          </div>

          <div class="stat-card">
            <span class="stat-label">On-chain Count</span>
            <strong class="stat-value">{{ contributionCount }}</strong>
          </div>

          <div class="stat-card">
            <span class="stat-label">Completed</span>
            <strong class="stat-value">{{ completedCount }}</strong>
          </div>

          <div class="stat-card">
            <span class="stat-label">Pending</span>
            <strong class="stat-value">{{ pendingCount }}</strong>
          </div>

          <div class="stat-card">
            <span class="stat-label">Overdue</span>
            <strong class="stat-value">{{ overdueCount }}</strong>
          </div>
        </section>

        <section class="contribution-list">
          <div class="section-header section-header-tight">
            <div>
              <h3>Upcoming Deadlines</h3>
              <p class="section-subtitle">
                Your nearest scheduled academic contributions.
              </p>
            </div>
          </div>

          <div v-if="upcomingContributions.length === 0" class="empty-state">
            <div class="empty-illustration" aria-hidden="true">📌</div>
            <p>No upcoming contributions found.</p>
          </div>

          <ul v-else>
            <li
              v-for="contribution in upcomingContributions"
              :key="contribution.id"
              class="contribution-card"
              :class="{ completed: contribution.completed, pending: !contribution.completed }"
            >
              <div class="card-top">
                <div class="card-copy">
                  <div class="card-heading-row">
                    <h4 class="contribution-title">{{ contribution.title }}</h4>

                    <span
                      class="status-badge"
                      :class="contribution.completed ? 'status-complete' : 'status-pending'"
                    >
                      {{ contribution.completed ? 'Completed' : 'Pending' }}
                    </span>
                  </div>

                  <div class="meta-row meta-row-wrap">
                    <span class="category-badge">{{ contribution.categoryLabel }}</span>

                    <span v-if="contribution.dueDate" class="due-date-badge">
                      Due: {{ formatDate(contribution.dueDate) }}
                    </span>

                    <span
                      v-if="contribution.dueDate"
                      class="deadline-badge"
                      :class="deadlineClass(contribution)"
                    >
                      {{ deadlineLabel(contribution) }}
                    </span>
                  </div>

                  <p class="contribution-description">
                    {{ contribution.description || 'No description provided.' }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const {
  account,
  walletStatus,
  contractStatus,
  contributions,
  contributionCount,
  isWrongNetwork,
  init,
  loadContributions,
  appBrand,
  networkName
} = useAuctusStore()

const today = new Date()
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

const completedCount = computed(() =>
  contributions.value.filter((item) => item.completed).length
)

const pendingCount = computed(() =>
  contributions.value.filter((item) => !item.completed).length
)

const overdueCount = computed(() =>
  contributions.value.filter((item) => isOverdue(item)).length
)

const upcomingContributions = computed(() => {
  return [...contributions.value]
    .filter((item) => item.dueDate)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5)
})

function formatDate(unixValue) {
  if (!unixValue) return 'No date'
  return new Date(unixValue * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function isOverdue(contribution) {
  if (contribution.completed || !contribution.dueDate) return false
  const due = new Date(contribution.dueDate * 1000)
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return dueStart < todayStart
}

function isDueToday(contribution) {
  if (!contribution.dueDate) return false
  const due = new Date(contribution.dueDate * 1000)
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return dueStart.getTime() === todayStart.getTime()
}

function deadlineLabel(contribution) {
  if (contribution.completed) return 'Completed'
  if (isOverdue(contribution)) return 'Overdue'
  if (isDueToday(contribution)) return 'Due Today'
  return 'Upcoming'
}

function deadlineClass(contribution) {
  if (contribution.completed) return 'deadline-complete'
  if (isOverdue(contribution)) return 'deadline-overdue'
  if (isDueToday(contribution)) return 'deadline-today'
  return 'deadline-upcoming'
}

onMounted(async () => {
  await init()
  await loadContributions()
})
</script>