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
          <p class="content-header-eyebrow">Workspace</p>
          <h2>Calendar Overview</h2>
          <p class="content-header-subtitle">
            View all academic contributions by due date and manage upcoming deadlines from one place.
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
            <h3>Calendar Actions</h3>
            <p class="section-subtitle">
              Add a new contribution or refresh your calendar data.
            </p>
          </div>

          <div class="hero-actions">
            <button class="submit-btn" @click="openCreateModal" :disabled="!account || isWrongNetwork || isBusy">
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

        <section class="calendar-section">
          <div class="section-header section-header-tight">
            <div>
              <h3>Task Calendar</h3>
              <p class="section-subtitle">Browse contributions in a monthly calendar view.</p>
            </div>
          </div>

          <div class="calendar-month-toolbar">
            <div class="calendar-toolbar-left">
              <button class="calendar-nav-btn" @click="goToPreviousMonth">← Previous</button>
              <button class="calendar-nav-btn calendar-today-btn" @click="goToToday">Today</button>
              <button class="calendar-nav-btn" @click="goToNextMonth">Next →</button>
            </div>

            <div class="calendar-month-title-block">
              <h4 class="calendar-month-title">{{ currentMonthLabel }}</h4>
              <p class="calendar-month-subtitle">
                {{ currentMonthContributionCount }} contribution(s) this month
              </p>
            </div>
          </div>

          <div class="calendar-weekdays">
            <div v-for="day in weekdayLabels" :key="day" class="calendar-weekday">
              {{ day }}
            </div>
          </div>

          <div class="calendar-month-grid">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              type="button"
              class="month-day-cell"
              :class="{
                'is-other-month': !day.isCurrentMonth,
                'is-today': day.isToday,
                'has-items': day.items.length > 0
              }"
              @click="openDayModal(day)"
            >
              <div class="month-day-top">
                <span class="month-day-number">{{ day.dayNumber }}</span>
                <span v-if="day.items.length" class="month-day-count">
                  {{ day.items.length }}
                </span>
              </div>

              <div class="month-day-items">
                <template v-if="day.items.length">
                  <div
                    v-for="item in day.items.slice(0, 2)"
                    :key="item.id"
                    class="month-day-item"
                    :class="deadlineClass(item)"
                  >
                    <div class="month-day-item-title">{{ item.title }}</div>
                    <div class="month-day-item-meta">
                      <span>{{ item.categoryLabel }}</span>
                      <span>{{ item.completed ? 'Done' : 'Pending' }}</span>
                    </div>
                  </div>

                  <div
                    v-if="day.items.length > 2"
                    class="month-day-more"
                  >
                    +{{ day.items.length - 2 }} more
                  </div>
                </template>

                <div v-else class="month-day-empty-state">
                  No tasks
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>

    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3>Submit a New Contribution</h3>
            <p class="section-subtitle">
              Add a contribution without leaving the calendar page.
            </p>
          </div>

          <button class="modal-close-btn" @click="closeCreateModal">×</button>
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

    <div v-if="showDayModal && selectedDay" class="modal-backdrop" @click.self="closeDayModal">
      <div class="modal-card day-modal-card">
        <div class="modal-header">
          <div>
            <h3>{{ selectedDayLabel }}</h3>
            <p class="section-subtitle">
              {{ selectedDay.items.length }}
              {{ selectedDay.items.length === 1 ? 'contribution' : 'contributions' }}
            </p>
          </div>

          <button class="modal-close-btn" @click="closeDayModal">×</button>
        </div>

        <div v-if="selectedDay.isToday" class="day-modal-chip-row">
          <span class="selected-day-chip">Today</span>
        </div>

        <div v-if="selectedDay.items.length === 0" class="selected-day-empty">
          No contributions scheduled for this day.
        </div>

        <div v-else class="selected-day-list">
          <div
            v-for="item in selectedDay.items"
            :key="item.id"
            class="selected-day-item"
          >
            <div class="selected-day-item-top">
              <h5>{{ item.title }}</h5>
              <span
                class="mini-status-badge"
                :class="item.completed ? 'status-complete' : 'status-pending'"
              >
                {{ item.completed ? 'Completed' : 'Pending' }}
              </span>
            </div>

            <div class="selected-day-meta">
              <span class="category-badge">{{ item.categoryLabel }}</span>
              <span class="deadline-badge" :class="deadlineClass(item)">
                {{ deadlineLabel(item) }}
              </span>
            </div>

            <p class="selected-day-description">
              {{ item.description || 'No description provided.' }}
            </p>
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
const showCreateModal = ref(false)
const showDayModal = ref(false)
const currentMonthDate = ref(startOfMonth(new Date()))
const selectedDayKey = ref(formatDateKey(new Date()))

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const today = new Date()
const todayStart = startOfDay(today)
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

const contributionsByDate = computed(() => {
  const grouped = {}

  for (const item of contributions.value) {
    if (!item.dueDate) continue
    const date = new Date(item.dueDate * 1000)
    const key = formatDateKey(date)

    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  Object.values(grouped).forEach((items) => {
    items.sort((a, b) => Number(a.completed) - Number(b.completed))
  })

  return grouped
})

const currentMonthLabel = computed(() =>
  currentMonthDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
)

const currentMonthContributionCount = computed(() => {
  const year = currentMonthDate.value.getFullYear()
  const month = currentMonthDate.value.getMonth()

  return contributions.value.filter((item) => {
    if (!item.dueDate) return false
    const due = new Date(item.dueDate * 1000)
    return due.getFullYear() === year && due.getMonth() === month
  }).length
})

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentMonthDate.value)
  const monthEnd = endOfMonth(currentMonthDate.value)

  const gridStart = new Date(monthStart)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const gridEnd = new Date(monthEnd)
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()))

  const days = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const key = formatDateKey(cursor)
    const items = contributionsByDate.value[key] || []

    days.push({
      key,
      date: new Date(cursor),
      dayNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === currentMonthDate.value.getMonth(),
      isToday: formatDateKey(cursor) === formatDateKey(today),
      items
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
})

const selectedDay = computed(() => {
  return calendarDays.value.find((day) => day.key === selectedDayKey.value) || null
})

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return selectedDay.value.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function isOverdue(contribution) {
  if (contribution.completed || !contribution.dueDate) return false
  const due = new Date(contribution.dueDate * 1000)
  const dueStart = startOfDay(due)
  return dueStart < todayStart
}

function isDueToday(contribution) {
  if (!contribution.dueDate) return false
  const due = new Date(contribution.dueDate * 1000)
  const dueStart = startOfDay(due)
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

function goToPreviousMonth() {
  currentMonthDate.value = new Date(
    currentMonthDate.value.getFullYear(),
    currentMonthDate.value.getMonth() - 1,
    1
  )
}

function goToNextMonth() {
  currentMonthDate.value = new Date(
    currentMonthDate.value.getFullYear(),
    currentMonthDate.value.getMonth() + 1,
    1
  )
}

function goToToday() {
  currentMonthDate.value = startOfMonth(new Date())
  selectedDayKey.value = formatDateKey(new Date())
}

function openCreateModal() {
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openDayModal(day) {
  selectedDayKey.value = day.key
  showDayModal.value = true
}

function closeDayModal() {
  showDayModal.value = false
}

async function handleRefresh() {
  try {
    isRefreshing.value = true
    await loadContributions()
  } finally {
    isRefreshing.value = false
  }
}

async function handleSwitchNetwork() {
  try {
    isSwitchingNetwork.value = true
    await switchNetwork()
  } finally {
    isSwitchingNetwork.value = false
  }
}

async function submitFromModal() {
  await addContribution()
  if (!loweredTxStatus.value.includes('failed') && !loweredTxStatus.value.includes('rejected')) {
    closeCreateModal()
  }
}

onMounted(async () => {
  await init()
  await loadContributions()
})
</script>