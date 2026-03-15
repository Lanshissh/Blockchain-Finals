<template>
  <section class="page-layout">
    <header class="hero-card">
      <div>
        <p class="content-header-eyebrow">Schedule</p>
        <h2>{{ heroTitle }}</h2>
        <p>
          {{ heroDescription }}
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">Role</span>
          <strong>{{ roleLabel }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">This Month</span>
          <strong>{{ currentMonthLabel }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Upcoming</span>
          <strong>{{ upcomingContributions.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Today</span>
          <strong>{{ todayItems.length }}</strong>
        </div>
      </div>
    </header>

    <section v-if="isWrongNetwork" class="info-card">
      <h3>Wrong Network</h3>
      <p>
        Your wallet is connected to the wrong network. Switch to
        {{ networkName }} before viewing contribution deadlines.
      </p>
      <div class="action-row">
        <button class="warning-btn" @click="switchNetwork">Switch Network</button>
      </div>
    </section>

    <section class="calendar-layout">
      <article class="panel-card calendar-panel">
        <div class="panel-header">
          <div>
            <h3>{{ calendarTitle }}</h3>
            <p>{{ calendarDescription }}</p>
          </div>

          <div class="calendar-nav">
            <button class="ghost-btn nav-btn" @click="goToPreviousMonth">
              Prev
            </button>
            <button class="ghost-btn nav-btn" @click="goToToday">
              Today
            </button>
            <button class="ghost-btn nav-btn" @click="goToNextMonth">
              Next
            </button>
          </div>
        </div>

        <div class="month-heading">
          <h4>{{ currentMonthLabel }}</h4>
        </div>

        <div class="weekday-row">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>

        <div class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-cell"
            :class="{
              muted: !day.inCurrentMonth,
              today: day.isToday,
              selected: day.isSelected,
              'has-items': day.items.length > 0
            }"
            @click="selectDay(day.date)"
          >
            <div class="cell-top">
              <span class="day-number">{{ day.dayNumber }}</span>
              <span v-if="day.items.length" class="item-count">
                {{ day.items.length }}
              </span>
            </div>

            <div class="cell-items">
              <div
                v-for="item in day.items.slice(0, 2)"
                :key="item.id"
                class="cell-pill"
                :class="statusClass(item.status)"
              >
                {{ item.title }}
              </div>

              <div v-if="day.items.length > 2" class="cell-more">
                +{{ day.items.length - 2 }} more
              </div>
            </div>
          </button>
        </div>
      </article>

      <article class="panel-card sidebar-panel">
        <div class="panel-header">
          <div>
            <h3>{{ selectedDayLabel }}</h3>
            <p>{{ selectedDescription }}</p>
          </div>
          <button class="ghost-btn" @click="loadContributions">Refresh</button>
        </div>

        <div class="sidebar-stats">
          <div class="mini-stat">
            <span>Selected Day</span>
            <strong>{{ selectedDayItems.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Approved</span>
            <strong>{{ selectedApprovedCount }}</strong>
          </div>
          <div class="mini-stat">
            <span>Pending</span>
            <strong>{{ selectedPendingCount }}</strong>
          </div>
          <div class="mini-stat">
            <span>Completed</span>
            <strong>{{ selectedCompletedCount }}</strong>
          </div>
        </div>

        <div v-if="isLoadingContributions" class="empty-state">
          Loading calendar data...
        </div>

        <div v-else-if="!selectedDayItems.length" class="empty-state">
          No contribution deadlines on this day.
        </div>

        <div v-else class="agenda-list">
          <article
            v-for="item in selectedDayItems"
            :key="item.id"
            class="agenda-card"
          >
            <div class="agenda-top">
              <div>
                <h4>{{ item.title }}</h4>
                <p class="contribution-meta">
                  #{{ item.id }} · {{ item.categoryLabel }}
                </p>
              </div>

              <div class="badge-group">
                <span class="badge category">{{ item.categoryLabel }}</span>
                <span class="badge" :class="statusClass(item.status)">
                  {{ item.statusLabel }}
                </span>
              </div>
            </div>

            <p class="description">{{ item.description }}</p>

            <div class="details-grid">
              <div>
                <span class="detail-label">Due</span>
                <strong>{{ formatDate(item.dueDate) }}</strong>
              </div>
              <div>
                <span class="detail-label">Points</span>
                <strong>{{ item.pointsAwarded }}</strong>
              </div>
              <div>
                <span class="detail-label">Completed</span>
                <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
              </div>
              <div>
                <span class="detail-label">NFT</span>
                <strong>{{ item.nftMinted ? 'Minted' : 'Not Minted' }}</strong>
              </div>
            </div>

            <div
              v-if="item.student && (isProfessor || isAdmin || isOwner)"
              class="review-box"
            >
              <span>Student:</span>
              <strong>{{ shortenAddress(item.student) }}</strong>
            </div>
          </article>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h3>{{ upcomingTitle }}</h3>
          <p>{{ upcomingDescription }}</p>
        </div>
      </div>

      <div v-if="!upcomingContributions.length" class="empty-state">
        No upcoming contribution deadlines found.
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in upcomingContributions.slice(0, 6)"
          :key="item.id"
          class="contribution-card"
        >
          <div class="contribution-top">
            <div>
              <h4>{{ item.title }}</h4>
              <p class="contribution-meta">
                #{{ item.id }} · {{ item.categoryLabel }}
              </p>
            </div>

            <div class="badge-group">
              <span class="badge category">{{ item.categoryLabel }}</span>
              <span class="badge" :class="statusClass(item.status)">
                {{ item.statusLabel }}
              </span>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <span class="detail-label">Due Date</span>
              <strong>{{ formatDate(item.dueDate) }}</strong>
            </div>
            <div>
              <span class="detail-label">Completed</span>
              <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
            </div>
            <div>
              <span class="detail-label">Points</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>
            <div>
              <span class="detail-label">NFT</span>
              <strong>{{ item.nftMinted ? 'Minted' : 'Not Minted' }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const {
  visibleContributions,
  roleLabel,
  isProfessor,
  isAdmin,
  isOwner,
  isWrongNetwork,
  isLoadingContributions,
  switchNetwork,
  loadContributions,
  init,
  networkName
} = store

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(startOfDay(today))

const userMode = computed(() => {
  if (isAdmin.value || isOwner.value) return 'admin'
  if (isProfessor.value) return 'professor'
  return 'student'
})

const heroTitle = computed(() => {
  if (userMode.value === 'admin') return 'Admin Calendar'
  if (userMode.value === 'professor') return 'Professor Calendar'
  return 'Student Calendar'
})

const heroDescription = computed(() => {
  if (userMode.value === 'admin') {
    return 'Monitor deadline activity, review upcoming records, and track academic workflow timing across the dashboard.'
  }
  if (userMode.value === 'professor') {
    return 'Track due contributions, review schedules, and monitor upcoming student work.'
  }
  return 'Track contribution deadlines, review your upcoming work, and manage your academic schedule.'
})

const calendarTitle = computed(() => {
  if (userMode.value === 'admin') return 'System Deadline Calendar'
  if (userMode.value === 'professor') return 'Review Calendar'
  return 'Monthly Calendar'
})

const calendarDescription = computed(() => {
  if (userMode.value === 'admin') return 'Contribution due dates shown in an admin monitoring view.'
  if (userMode.value === 'professor') return 'Contribution due dates shown for professor review timing.'
  return 'Contribution due dates are shown on their scheduled day.'
})

const selectedDescription = computed(() => {
  if (userMode.value === 'admin') return 'Contribution records scheduled on the selected date.'
  if (userMode.value === 'professor') return 'Student work due on the selected date.'
  return 'Your contribution records due on the selected date.'
})

const upcomingTitle = computed(() => {
  if (userMode.value === 'admin') return 'Upcoming Deadline Activity'
  if (userMode.value === 'professor') return 'Upcoming Review Items'
  return 'Upcoming Contributions'
})

const upcomingDescription = computed(() => {
  if (userMode.value === 'admin') return 'Nearest due dates from today onward in the current dashboard view.'
  if (userMode.value === 'professor') return 'Upcoming due work that may require review.'
  return 'Nearest due dates from today onward.'
})

const currentMonthLabel = computed(() =>
  currentMonth.value.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long'
  })
)

const selectedDayLabel = computed(() =>
  selectedDate.value.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
)

const calendarDays = computed(() => {
  const monthStart = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    1
  )
  const monthEnd = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    0
  )

  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())

  const gridEnd = new Date(monthEnd)
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))

  const days = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const dayDate = startOfDay(cursor)
    const items = getItemsForDate(dayDate)

    days.push({
      key: dayDate.toISOString(),
      date: new Date(dayDate),
      dayNumber: dayDate.getDate(),
      inCurrentMonth: dayDate.getMonth() === currentMonth.value.getMonth(),
      isToday: isSameDate(dayDate, today),
      isSelected: isSameDate(dayDate, selectedDate.value),
      items
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
})

const selectedDayItems = computed(() =>
  getItemsForDate(selectedDate.value).sort((a, b) => a.dueDate - b.dueDate)
)

const todayItems = computed(() => getItemsForDate(today))

const upcomingContributions = computed(() => {
  const now = startOfDay(today).getTime() / 1000

  return [...visibleContributions.value]
    .filter((item) => Number(item.dueDate) >= now)
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
})

const selectedApprovedCount = computed(
  () => selectedDayItems.value.filter((item) => Number(item.status) === 1).length
)

const selectedPendingCount = computed(
  () => selectedDayItems.value.filter((item) => Number(item.status) === 0).length
)

const selectedCompletedCount = computed(
  () => selectedDayItems.value.filter((item) => item.completed).length
)

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function fromUnixToDate(unixValue) {
  const value = Number(unixValue)
  if (!value) return null
  return new Date(value * 1000)
}

function getItemsForDate(date) {
  return visibleContributions.value.filter((item) => {
    const due = fromUnixToDate(item.dueDate)
    if (!due) return false
    return isSameDate(startOfDay(due), startOfDay(date))
  })
}

function selectDay(date) {
  selectedDate.value = startOfDay(date)
}

function goToPreviousMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  )
}

function goToNextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  )
}

function goToToday() {
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDate.value = startOfDay(today)
}

function formatDate(unixValue) {
  const value = Number(unixValue)
  if (!value) return '—'

  return new Date(value * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function shortenAddress(value) {
  if (!value) return '—'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function statusClass(status) {
  const numeric = Number(status)
  if (numeric === 1) return 'approved'
  if (numeric === 2) return 'rejected'
  return 'pending'
}

onMounted(async () => {
  await init()
  await loadContributions()
})
</script>

<style scoped>
.content-header-eyebrow {
  margin: 0 0 8px;
  color: #fbbf24;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.calendar-panel,
.sidebar-panel {
  min-height: 100%;
}

.calendar-nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-btn {
  min-width: 84px;
}

.month-heading {
  margin-bottom: 14px;
}

.month-heading h4 {
  margin: 0;
  font-size: 1.05rem;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.weekday-row span {
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 700;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.calendar-cell {
  min-height: 116px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  padding: 10px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.calendar-cell:hover {
  transform: translateY(-1px);
  border-color: rgba(251, 191, 36, 0.3);
}

.calendar-cell.muted {
  opacity: 0.45;
}

.calendar-cell.today {
  border-color: rgba(251, 191, 36, 0.55);
  box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.18);
}

.calendar-cell.selected {
  background: rgba(251, 191, 36, 0.08);
  border-color: rgba(251, 191, 36, 0.45);
}

.calendar-cell.has-items .day-number {
  color: #fbbf24;
}

.cell-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.day-number {
  font-weight: 800;
  font-size: 0.95rem;
}

.item-count {
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: rgba(59, 130, 246, 0.18);
  color: #bfdbfe;
  font-size: 0.75rem;
  font-weight: 800;
}

.cell-items {
  display: grid;
  gap: 6px;
}

.cell-pill,
.cell-more {
  font-size: 0.72rem;
  line-height: 1.2;
  border-radius: 999px;
  padding: 6px 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cell-pill.pending {
  background: rgba(245, 158, 11, 0.18);
  color: #fde68a;
}

.cell-pill.approved {
  background: rgba(34, 197, 94, 0.16);
  color: #bbf7d0;
}

.cell-pill.rejected {
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
}

.cell-more {
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
}

.sidebar-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.agenda-list {
  display: grid;
  gap: 14px;
}

.agenda-card {
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.agenda-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.agenda-top h4 {
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 1080px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .calendar-nav {
    width: 100%;
  }

  .calendar-nav > * {
    flex: 1 1 0;
  }

  .weekday-row,
  .calendar-grid {
    gap: 6px;
  }

  .calendar-cell {
    min-height: 92px;
    padding: 8px;
  }

  .sidebar-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .weekday-row span {
    font-size: 0.72rem;
  }

  .day-number {
    font-size: 0.86rem;
  }

  .cell-pill,
  .cell-more {
    font-size: 0.66rem;
    padding: 5px 6px;
  }
}
</style>