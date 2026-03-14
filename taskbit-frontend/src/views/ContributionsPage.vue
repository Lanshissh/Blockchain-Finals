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
          <p class="content-header-eyebrow">Workspace</p>
          <h2>Academic Contributions</h2>
          <p class="content-header-subtitle">
            Review, complete, and delete your recorded academic contributions.
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
            <h3>Contribution Actions</h3>
            <p class="section-subtitle">
              Refresh your list and manage contribution status below.
            </p>
          </div>

          <div class="hero-actions">
            <button class="refresh-btn" @click="loadContributions" :disabled="isLoadingContributions">
              {{ isLoadingContributions ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </section>

        <section class="contribution-list">
          <div class="section-header section-header-tight">
            <div>
              <h3>My Academic Contributions</h3>
              <p class="section-subtitle">
                Your records are loaded from the blockchain and organized here.
              </p>
            </div>
          </div>

          <div v-if="contributions.length === 0 && !isLoadingContributions" class="empty-state">
            <div class="empty-illustration" aria-hidden="true">📚</div>
            <p>No contributions recorded yet.</p>
          </div>

          <ul v-else>
            <li
              v-for="contribution in contributions"
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
                    <span class="timestamp">Created: {{ formatDate(contribution.createdAt) }}</span>

                    <span v-if="contribution.dueDate" class="due-date-badge">
                      Due: {{ formatDate(contribution.dueDate) }}
                    </span>

                    <span v-if="contribution.dueDate" class="deadline-badge" :class="deadlineClass(contribution)">
                      {{ deadlineLabel(contribution) }}
                    </span>
                  </div>

                  <p class="contribution-description">
                    {{ contribution.description }}
                  </p>
                </div>
              </div>

              <div class="card-actions">
                <button
                  class="action-btn"
                  @click="toggleContribution(contribution.id)"
                  :disabled="!canEditContributions"
                >
                  {{ contribution.completed ? 'Undo' : 'Mark Complete' }}
                </button>

                <button
                  class="delete-btn"
                  @click="removeContribution(contribution.id)"
                  :disabled="!canEditContributions"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>
        </section>
      </main>
    </div>

    <div
      v-if="txStatus && txStatus !== 'No transaction yet'"
      class="tx-toast"
      :class="toastClass"
    >
      <div class="toast-content">
        <span class="toast-message">{{ txStatus }}</span>

        <a
          v-if="latestTxUrl"
          class="toast-link"
          :href="latestTxUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan
        </a>

        <span v-if="latestTxHash" class="toast-hash">
          {{ shortTxHash }}
        </span>
      </div>

      <button class="toast-close" @click="resetTxStatus">x</button>
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
  txStatus,
  latestTxHash,
  latestTxUrl,
  contributions,
  isWrongNetwork,
  isLoadingContributions,
  toggleContribution,
  removeContribution,
  resetTxStatus,
  init,
  loadContributions,
  appBrand,
  networkName
} = useAuctusStore()

const loweredTxStatus = computed(() => txStatus.value.toLowerCase())

const canEditContributions = computed(() => {
  return Boolean(account.value) && !isWrongNetwork.value && !isLoadingContributions.value
})

const shortTxHash = computed(() => {
  if (!latestTxHash.value) return ''
  return `${latestTxHash.value.slice(0, 10)}...${latestTxHash.value.slice(-8)}`
})

const toastClass = computed(() => ({
  success:
    !loweredTxStatus.value.includes('sending') &&
    !loweredTxStatus.value.includes('rejected') &&
    !loweredTxStatus.value.includes('wrong network') &&
    !loweredTxStatus.value.includes('failed') &&
    !loweredTxStatus.value.includes('reverted') &&
    !loweredTxStatus.value.includes('insufficient') &&
    !loweredTxStatus.value.includes('connect wallet'),
  pending: loweredTxStatus.value.includes('sending'),
  error:
    loweredTxStatus.value.includes('rejected') ||
    loweredTxStatus.value.includes('wrong network') ||
    loweredTxStatus.value.includes('failed') ||
    loweredTxStatus.value.includes('reverted') ||
    loweredTxStatus.value.includes('insufficient') ||
    loweredTxStatus.value.includes('connect wallet')
}))

const today = new Date()
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

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

onMounted(() => {
  init()
})
</script>