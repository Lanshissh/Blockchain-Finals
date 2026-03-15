<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDayKey = ref('')
const activeFilter = ref('all')

onMounted(async () => {
  await store.init()
  await store.loadContributions()

  const todayKey = buildDateKeyFromDate(new Date())
  selectedDayKey.value = todayKey
})

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(new Date(currentYear.value, currentMonth.value, 1))
})

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay()

  const cells = []

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({
      key: `empty-start-${i}`,
      isEmpty: true
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(currentYear.value, currentMonth.value, day)
    const key = buildDateKeyFromDate(date)
    const items = getContributionsForDateKey(key)

    cells.push({
      key,
      isEmpty: false,
      day,
      date,
      isToday: key === buildDateKeyFromDate(new Date()),
      isSelected: key === selectedDayKey.value,
      items,
      hasItems: items.length > 0
    })
  }

  return cells
})

const monthContributions = computed(() => {
  const filtered = applyContributionFilter(store.visibleContributions.value)

  return [...filtered]
    .filter((item) => {
      if (!item.dueDate) return false
      const dueDate = new Date(Number(item.dueDate) * 1000)
      return (
        dueDate.getFullYear() === currentYear.value &&
        dueDate.getMonth() === currentMonth.value
      )
    })
    .sort((a, b) => a.dueDate - b.dueDate)
})

const selectedDayItems = computed(() => {
  if (!selectedDayKey.value) {
    return []
  }

  return getContributionsForDateKey(selectedDayKey.value)
})

const upcomingItems = computed(() => {
  const nowUnix = Math.floor(Date.now() / 1000)
  const filtered = applyContributionFilter(store.visibleContributions.value)

  return [...filtered]
    .filter((item) => Number(item.dueDate) >= nowUnix)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 6)
})

const calendarStats = computed(() => {
  const items = monthContributions.value

  return {
    total: items.length,
    pending: items.filter((item) => Number(item.status) === 0).length,
    approved: items.filter((item) => Number(item.status) === 1).length,
    rejected: items.filter((item) => Number(item.status) === 2).length
  }
})

function applyContributionFilter(items) {
  if (activeFilter.value === 'all') return [...items]
  if (activeFilter.value === 'pending') {
    return items.filter((item) => Number(item.status) === 0)
  }
  if (activeFilter.value === 'approved') {
    return items.filter((item) => Number(item.status) === 1)
  }
  return items.filter((item) => Number(item.status) === 2)
}

function buildDateKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function buildDateKeyFromUnix(unixSeconds) {
  const value = Number(unixSeconds || 0)
  if (!value) return ''
  return buildDateKeyFromDate(new Date(value * 1000))
}

function getContributionsForDateKey(dateKey) {
  const filtered = applyContributionFilter(store.visibleContributions.value)

  return [...filtered]
    .filter((item) => buildDateKeyFromUnix(item.dueDate) === dateKey)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status
      return a.dueDate - b.dueDate
    })
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }

  selectedDayKey.value = ''
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }

  selectedDayKey.value = ''
}

function selectDay(dayKey) {
  selectedDayKey.value = dayKey
}

function formatDate(unixSeconds) {
  const value = Number(unixSeconds || 0)
  if (!value) return '—'

  return new Date(value * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatAddress(address) {
  const value = String(address || '')
  if (value.length < 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function statusClass(status) {
  const value = Number(status)

  if (value === 1) return 'approved'
  if (value === 2) return 'rejected'
  return 'pending'
}

function countLabel(count) {
  if (count === 1) return '1 item'
  return `${count} items`
}
</script>

<template>
  <section class="calendar-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">Calendar Overview</p>
        <h1>Track contribution deadlines by month</h1>
        <p class="subtext">
          Browse upcoming due dates, review what is scheduled this month, and jump to your
          contributions page to update entries.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-badge primary">{{ store.roleLabel.value }}</span>
        <span class="hero-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card card">
        <span>This Month</span>
        <strong>{{ calendarStats.total }}</strong>
      </article>

      <article class="stat-card card pending">
        <span>Pending</span>
        <strong>{{ calendarStats.pending }}</strong>
      </article>

      <article class="stat-card card approved">
        <span>Approved</span>
        <strong>{{ calendarStats.approved }}</strong>
      </article>

      <article class="stat-card card rejected">
        <span>Rejected</span>
        <strong>{{ calendarStats.rejected }}</strong>
      </article>
    </div>

    <div class="calendar-layout">
      <article class="card calendar-card">
        <div class="calendar-toolbar">
          <div>
            <p class="section-label">Month View</p>
            <h2>{{ monthLabel }}</h2>
          </div>

          <div class="calendar-actions">
            <div class="filter-group">
              <button
                type="button"
                class="filter-chip"
                :class="{ active: activeFilter === 'all' }"
                @click="activeFilter = 'all'"
              >
                All
              </button>
              <button
                type="button"
                class="filter-chip"
                :class="{ active: activeFilter === 'pending' }"
                @click="activeFilter = 'pending'"
              >
                Pending
              </button>
              <button
                type="button"
                class="filter-chip"
                :class="{ active: activeFilter === 'approved' }"
                @click="activeFilter = 'approved'"
              >
                Approved
              </button>
              <button
                type="button"
                class="filter-chip"
                :class="{ active: activeFilter === 'rejected' }"
                @click="activeFilter = 'rejected'"
              >
                Rejected
              </button>
            </div>

            <div class="month-nav">
              <button type="button" class="nav-btn" @click="previousMonth">Prev</button>
              <button type="button" class="nav-btn" @click="nextMonth">Next</button>
            </div>
          </div>
        </div>

        <div class="weekday-row">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div v-if="store.isLoadingContributions.value" class="calendar-loading">
          <h3>Loading calendar…</h3>
          <p>Please wait while contribution deadlines are loaded.</p>
        </div>

        <div v-else class="calendar-grid">
          <button
            v-for="cell in calendarDays"
            :key="cell.key"
            type="button"
            class="day-cell"
            :class="{
              empty: cell.isEmpty,
              today: cell.isToday,
              selected: cell.isSelected,
              hasItems: cell.hasItems
            }"
            :disabled="cell.isEmpty"
            @click="!cell.isEmpty && selectDay(cell.key)"
          >
            <template v-if="!cell.isEmpty">
              <div class="day-number-row">
                <span class="day-number">{{ cell.day }}</span>
                <span v-if="cell.items.length" class="day-count">
                  {{ cell.items.length }}
                </span>
              </div>

              <div class="day-preview">
                <span
                  v-for="item in cell.items.slice(0, 2)"
                  :key="item.id"
                  class="preview-pill"
                  :class="statusClass(item.status)"
                >
                  {{ item.title }}
                </span>

                <span v-if="cell.items.length > 2" class="preview-more">
                  +{{ cell.items.length - 2 }} more
                </span>
              </div>
            </template>
          </button>
        </div>
      </article>

      <div class="side-panel">
        <article class="card panel-card">
          <div class="panel-header">
            <div>
              <p class="section-label">Selected Day</p>
              <h2>
                {{ selectedDayKey || 'No day selected' }}
              </h2>
            </div>
          </div>

          <div v-if="!selectedDayKey" class="empty-state">
            <h3>Select a date</h3>
            <p>Choose a calendar day to see contribution deadlines for that date.</p>
          </div>

          <div v-else-if="!selectedDayItems.length" class="empty-state">
            <h3>No deadlines</h3>
            <p>There are no contributions due on this date for the current filter.</p>
          </div>

          <div v-else class="day-list">
            <article
              v-for="item in selectedDayItems"
              :key="item.id"
              class="deadline-card"
            >
              <div class="deadline-top">
                <div>
                  <h3>{{ item.title }}</h3>
                  <p class="meta-row">
                    <span>{{ item.categoryLabel }}</span>
                    <span>•</span>
                    <span>{{ item.statusLabel }}</span>
                  </p>
                </div>

                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.statusLabel }}
                </span>
              </div>

              <p class="description">{{ item.description }}</p>

              <div class="deadline-details">
                <div class="detail-item">
                  <span>Due</span>
                  <strong>{{ formatDate(item.dueDate) }}</strong>
                </div>
                <div class="detail-item">
                  <span>Student</span>
                  <strong>{{ formatAddress(item.student) }}</strong>
                </div>
                <div class="detail-item">
                  <span>Completed</span>
                  <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
                </div>
              </div>
            </article>
          </div>
        </article>

        <article class="card panel-card">
          <div class="panel-header">
            <div>
              <p class="section-label">Upcoming Deadlines</p>
              <h2>Next scheduled contributions</h2>
            </div>

            <RouterLink to="/contributions" class="panel-link">
              Open contributions
            </RouterLink>
          </div>

          <div v-if="!upcomingItems.length" class="empty-state">
            <h3>No upcoming items</h3>
            <p>Add a contribution to start building your calendar schedule.</p>
          </div>

          <div v-else class="upcoming-list">
            <article
              v-for="item in upcomingItems"
              :key="item.id"
              class="upcoming-item"
            >
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.categoryLabel }} • {{ formatDate(item.dueDate) }}</p>
              </div>

              <span class="upcoming-tag" :class="statusClass(item.status)">
                {{ item.statusLabel }}
              </span>
            </article>
          </div>
        </article>

        <article class="card panel-card">
          <div class="panel-header">
            <div>
              <p class="section-label">Month Summary</p>
              <h2>What is scheduled now</h2>
            </div>
          </div>

          <div class="summary-list">
            <div class="summary-item">
              <span>Total this month</span>
              <strong>{{ countLabel(calendarStats.total) }}</strong>
            </div>
            <div class="summary-item">
              <span>Pending</span>
              <strong>{{ countLabel(calendarStats.pending) }}</strong>
            </div>
            <div class="summary-item">
              <span>Approved</span>
              <strong>{{ countLabel(calendarStats.approved) }}</strong>
            </div>
            <div class="summary-item">
              <span>Rejected</span>
              <strong>{{ countLabel(calendarStats.rejected) }}</strong>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.calendar-page {
  display: grid;
  gap: 18px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.eyebrow,
.section-label {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 800;
  color: #6366f1;
}

.hero h1,
.calendar-card h2,
.panel-card h2 {
  margin: 0;
}

.subtext {
  margin: 10px 0 0;
  color: #64748b;
  max-width: 760px;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-badge {
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 800;
}

.hero-badge.primary {
  background: #e0e7ff;
  color: #312e81;
}

.hero-badge.neutral {
  background: #e2e8f0;
  color: #334155;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: grid;
  gap: 6px;
}

.stat-card span {
  color: #64748b;
  font-size: 0.85rem;
}

.stat-card strong {
  font-size: 1.45rem;
}

.stat-card.pending {
  background: #fffbeb;
}

.stat-card.approved {
  background: #f0fdf4;
}

.stat-card.rejected {
  background: #fef2f2;
}

.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 16px;
}

.calendar-card,
.panel-card {
  display: grid;
  gap: 16px;
}

.calendar-toolbar,
.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.calendar-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-chip {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font: inherit;
  font-weight: 700;
  background: #e2e8f0;
  color: #334155;
  cursor: pointer;
}

.filter-chip.active {
  background: #4f46e5;
  color: white;
}

.month-nav {
  display: flex;
  gap: 10px;
}

.nav-btn {
  border: 0;
  border-radius: 14px;
  padding: 10px 14px;
  font: inherit;
  font-weight: 700;
  background: #eef2ff;
  color: #3730a3;
  cursor: pointer;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 700;
}

.weekday-row span {
  text-align: center;
  padding: 4px 0;
}

.calendar-loading,
.empty-state {
  text-align: center;
  padding: 18px 12px;
}

.calendar-loading h3,
.empty-state h3 {
  margin: 0 0 8px;
}

.calendar-loading p,
.empty-state p {
  margin: 0;
  color: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.day-cell {
  min-height: 128px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 18px;
  padding: 10px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.day-cell:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
}

.day-cell.empty {
  background: transparent;
  border-style: dashed;
  cursor: default;
}

.day-cell.today {
  border-color: rgba(99, 102, 241, 0.45);
}

.day-cell.selected {
  border-color: #4f46e5;
  background: #eef2ff;
}

.day-cell.hasItems {
  background: #fcfdff;
}

.day-number-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-number {
  font-weight: 800;
  color: #0f172a;
}

.day-count {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #4f46e5;
  color: white;
  font-size: 0.76rem;
  font-weight: 800;
}

.day-preview {
  display: grid;
  gap: 6px;
}

.preview-pill,
.preview-more {
  display: block;
  padding: 6px 8px;
  border-radius: 12px;
  font-size: 0.74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-pill.pending {
  background: #fef3c7;
  color: #92400e;
}

.preview-pill.approved {
  background: #dcfce7;
  color: #166534;
}

.preview-pill.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.preview-more {
  background: #e2e8f0;
  color: #475569;
  font-weight: 700;
}

.side-panel {
  display: grid;
  gap: 16px;
}

.day-list,
.upcoming-list,
.summary-list {
  display: grid;
  gap: 12px;
}

.deadline-card,
.upcoming-item,
.summary-item {
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.deadline-card {
  display: grid;
  gap: 12px;
}

.deadline-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.deadline-top h3 {
  margin: 0;
  font-size: 1rem;
}

.meta-row {
  margin: 8px 0 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.9rem;
}

.description {
  margin: 0;
  color: #334155;
  line-height: 1.65;
}

.deadline-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.detail-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

.upcoming-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.upcoming-item p {
  margin: 6px 0 0;
  color: #64748b;
}

.upcoming-tag,
.status-badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.upcoming-tag.pending,
.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.upcoming-tag.approved,
.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.upcoming-tag.rejected,
.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.summary-item span {
  color: #64748b;
}

.panel-link {
  text-decoration: none;
  font-weight: 700;
  color: #4f46e5;
}

.panel-link:hover {
  text-decoration: underline;
}

@media (max-width: 1280px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .calendar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weekday-row {
    display: none;
  }
}

@media (max-width: 720px) {
  .card {
    padding: 18px;
    border-radius: 20px;
  }

  .hero,
  .calendar-toolbar,
  .panel-header,
  .deadline-top,
  .upcoming-item {
    flex-direction: column;
  }

  .hero-badges,
  .calendar-actions {
    justify-content: flex-start;
  }

  .stats-grid,
  .deadline-details,
  .calendar-grid {
    grid-template-columns: 1fr;
  }
}
</style>