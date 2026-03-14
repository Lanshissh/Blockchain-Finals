<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="nav-container">
        <div class="brand">
          <img src="/logo.png" class="brand-logo" alt="TaskBit Logo" />
          <div>
            <h1>{{ appBrand }}</h1>
            <p class="brand-subtitle">Blockchain Academic Contribution Tracker</p>
          </div>
        </div>

        <nav class="page-nav">
          <RouterLink to="/calendar" class="page-nav-link" active-class="page-nav-link-active">
            Calendar
          </RouterLink>
          <RouterLink
            to="/contributions"
            class="page-nav-link"
            active-class="page-nav-link-active"
          >
            Academic Contributions
          </RouterLink>
        </nav>

        <div class="nav-right">
          <span class="network-badge" :class="{ 'network-badge-warning': isWrongNetwork }">
            {{ networkName }}
          </span>

          <span class="network-detail">{{ walletStatus }}</span>
          <span class="network-detail">{{ contractStatus }}</span>

          <div v-if="account" class="wallet-badge">
            <span class="wallet-dot" aria-hidden="true"></span>
            {{ `${account.slice(0, 6)}...${account.slice(-4)}` }}
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero hero-row">
        <div>
          <h2>Calendar Overview</h2>
          <p>
            View all academic contributions by due date. This is the first page shown after login.
          </p>
        </div>

        <div class="hero-actions">
          <button class="submit-btn" @click="openModal" :disabled="!account || isWrongNetwork || isBusy">
            + Submit New Contribution
          </button>
          <button class="refresh-btn" @click="handleRefresh" :disabled="isBusy || isWrongNetwork">
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </section>

      <section v-if="isWrongNetwork" class="network-warning-card">
        <div class="network-warning-copy">
          <h3>Wrong Network Detected</h3>
          <p>
            Your wallet is connected, but not on <strong>{{ networkName }}</strong>.
            Switch MetaMask to {{ networkName }} to continue.
          </p>
        </div>

        <div class="network-warning-actions">
          <button
            class="switch-network-btn"
            @click="handleSwitchNetwork"
            :disabled="isSwitchingNetwork || isBusy"
          >
            {{ isSwitchingNetwork ? `Switching to ${networkName}...` : `Switch to ${networkName}` }}
          </button>
        </div>
      </section>

      <section class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Visible Contributions</span>
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

      <section class="calendar-section">
        <div class="section-header">
          <div>
            <h3>Task Calendar</h3>
            <p class="section-subtitle">Contributions grouped by due date.</p>
          </div>
        </div>

        <div v-if="calendarGroups.length === 0 && !isLoadingContributions" class="empty-state">
          <div class="empty-illustration" aria-hidden="true">🗓️</div>
          <p>No calendar items yet. Add your first contribution.</p>
        </div>

        <div v-else class="calendar-grid">
          <div
            v-for="group in calendarGroups"
            :key="group.key"
            class="calendar-day-card"
          >
            <div class="calendar-day-header">
              <strong>{{ group.label }}</strong>
              <span>{{ group.items.length }} item(s)</span>
            </div>

            <ul class="calendar-day-list">
              <li
                v-for="item in group.items"
                :key="item.id"
                class="calendar-day-item"
              >
                <div class="calendar-day-title-row">
                  <span class="calendar-day-title">{{ item.title }}</span>
                  <span
                    class="mini-status-badge"
                    :class="item.completed ? 'status-complete' : 'status-pending'"
                  >
                    {{ item.completed ? 'Done' : 'Pending' }}
                  </span>
                </div>

                <div class="calendar-item-meta">
                  <small>{{ item.categoryLabel }}</small>
                  <span class="deadline-badge" :class="deadlineClass(item)">
                    {{ deadlineLabel(item) }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>Submit a New Contribution</h3>
            <p class="section-subtitle">
              Add a contribution without leaving the calendar page.
            </p>
          </div>

          <button class="modal-close-btn" @click="closeModal">×</button>
        </div>

        <div class="contribution-form contribution-form-stacked">
          <input
            v-model="contributionForm.title"
            type="text"
            placeholder="Contribution title"
            :disabled="!canEditContributions"
          />

          <select
            v-model.number="contributionForm.category"
            class="contribution-select"
            :disabled="!canEditContributions"
          >
            <option
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <input
            v-model="contributionForm.dueDate"
            type="date"
            class="contribution-date"
            :min="todayString"
            :disabled="!canEditContributions"
          />

          <textarea
            v-model="contributionForm.description"
            class="contribution-textarea"
            rows="4"
            placeholder="Describe the contribution"
            :disabled="!canEditContributions"
          ></textarea>

          <div class="form-actions">
            <button
              class="submit-btn"
              @click="submitFromModal"
              :disabled="!canSubmitContribution"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Contribution' }}
            </button>

            <button
              class="refresh-btn secondary-btn"
              @click="resetContributionForm"
              :disabled="isBusy"
            >
              Clear Form
            </button>
          </div>
        </div>
      </div>
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
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const {
  account,
  walletStatus,
  contractStatus,
  txStatus,
  latestTxHash,
  latestTxUrl,
  contributionForm,
  contributions,
  contributionCount,
  categoryOptions,
  isWrongNetwork,
  isLoadingContributions,
  addContribution,
  resetContributionForm,
  resetTxStatus,
  init,
  loadContributions,
  switchNetwork,
  appBrand,
  networkName
} = useAuctusStore()

const isRefreshing = ref(false)
const isSwitchingNetwork = ref(false)
const showModal = ref(false)

const today = new Date()
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate()
).padStart(2, '0')}`

const loweredTxStatus = computed(() => txStatus.value.toLowerCase())
const isSubmitting = computed(() => loweredTxStatus.value.includes('sending'))

const isBusy = computed(() => {
  return (
    isLoadingContributions.value ||
    isSubmitting.value ||
    isRefreshing.value ||
    isSwitchingNetwork.value
  )
})

const completedCount = computed(() =>
  contributions.value.filter((item) => item.completed).length
)

const pendingCount = computed(() =>
  contributions.value.filter((item) => !item.completed).length
)

const overdueCount = computed(() =>
  contributions.value.filter((item) => isOverdue(item)).length
)

const canEditContributions = computed(() => {
  return Boolean(account.value) && !isWrongNetwork.value && !isBusy.value
})

const canSubmitContribution = computed(() => {
  return (
    canEditContributions.value &&
    Boolean(contributionForm.value.title?.trim()) &&
    Boolean(contributionForm.value.description?.trim()) &&
    Boolean(contributionForm.value.dueDate)
  )
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

const calendarGroups = computed(() => {
  const grouped = contributions.value.reduce((acc, item) => {
    if (!item.dueDate) return acc

    const key = new Date(item.dueDate * 1000).toISOString().slice(0, 10)

    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({
      key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      items
    }))
})

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

function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitFromModal() {
  await addContribution()

  const status = txStatus.value.toLowerCase()
  if (
    !status.includes('failed') &&
    !status.includes('rejected') &&
    !status.includes('wrong network') &&
    !status.includes('reverted')
  ) {
    showModal.value = false
  }
}

async function handleRefresh() {
  if (isWrongNetwork.value || isRefreshing.value) return
  isRefreshing.value = true
  try {
    await loadContributions()
  } finally {
    isRefreshing.value = false
  }
}

async function handleSwitchNetwork() {
  if (isSwitchingNetwork.value) return
  isSwitchingNetwork.value = true
  try {
    await switchNetwork()
  } finally {
    isSwitchingNetwork.value = false
  }
}

onMounted(() => {
  init()
})
</script>