<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const pointsByContribution = ref({})
const activeFilter = ref('pending')
const searchTerm = ref('')

onMounted(async () => {
  await store.init()
  await store.loadContributions()
})

const canReview = computed(
  () =>
    store.isReviewer.value ||
    store.isProfessor.value ||
    store.isAdmin.value ||
    store.isOwner.value
)

const allReviewItems = computed(() => {
  return [...store.reviewContributions.value].sort((a, b) => {
    if (a.status !== b.status) return a.status - b.status
    if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate
    return b.createdAt - a.createdAt
  })
})

const filteredItems = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return allReviewItems.value.filter((item) => {
    const matchesFilter =
      activeFilter.value === 'all'
        ? true
        : activeFilter.value === 'pending'
          ? Number(item.status) === 0
          : activeFilter.value === 'approved'
            ? Number(item.status) === 1
            : Number(item.status) === 2

    const matchesSearch =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.student.toLowerCase().includes(keyword) ||
      item.categoryLabel.toLowerCase().includes(keyword)

    return matchesFilter && matchesSearch && !item.deleted
  })
})

const pendingCount = computed(
  () => allReviewItems.value.filter((item) => Number(item.status) === 0).length
)

const approvedCount = computed(
  () => allReviewItems.value.filter((item) => Number(item.status) === 1).length
)

const rejectedCount = computed(
  () => allReviewItems.value.filter((item) => Number(item.status) === 2).length
)

function formatAddress(address) {
  const value = String(address || '')
  if (value.length < 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
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

function formatDateTime(unixSeconds) {
  const value = Number(unixSeconds || 0)
  if (!value) return '—'

  return new Date(value * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getPointsValue(contributionId) {
  return Number(pointsByContribution.value[contributionId] || 0)
}

function setPointsValue(contributionId, value) {
  pointsByContribution.value = {
    ...pointsByContribution.value,
    [contributionId]: Math.max(0, Number(value) || 0)
  }
}

async function handleApprove(contributionId) {
  await store.approveContribution(contributionId, getPointsValue(contributionId))
}

async function handleReject(contributionId) {
  await store.rejectContribution(contributionId)
}

function statusClass(status) {
  const value = Number(status)

  if (value === 1) return 'approved'
  if (value === 2) return 'rejected'
  return 'pending'
}
</script>

<template>
  <section class="review-page">
    <div class="review-hero card">
      <div>
        <p class="eyebrow">Review Center</p>
        <h1>Review academic contributions</h1>
        <p class="subtext">
          Approve or reject student submissions, assign points, and track review activity.
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-pill pending">
          <span>Pending</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div class="stat-pill approved">
          <span>Approved</span>
          <strong>{{ approvedCount }}</strong>
        </div>
        <div class="stat-pill rejected">
          <span>Rejected</span>
          <strong>{{ rejectedCount }}</strong>
        </div>
      </div>
    </div>

    <div v-if="!canReview" class="empty-state card">
      <h2>Access restricted</h2>
      <p>Only reviewers, professors, admins, or the contract owner can access this page.</p>
    </div>

    <template v-else>
      <div class="review-toolbar card">
        <div class="filter-group">
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
          <button
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            All
          </button>
        </div>

        <label class="search-box">
          <span>Search</span>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Search title, student address, category..."
          />
        </label>
      </div>

      <div v-if="store.isLoadingContributions.value" class="empty-state card">
        <h2>Loading review queue…</h2>
        <p>Please wait while contributions are being loaded from the contract.</p>
      </div>

      <div v-else-if="!filteredItems.length" class="empty-state card">
        <h2>No contributions found</h2>
        <p>There are no contributions matching the current filter.</p>
      </div>

      <div v-else class="review-list">
        <article
          v-for="item in filteredItems"
          :key="item.id"
          class="review-card card"
        >
          <div class="review-card-header">
            <div>
              <div class="title-row">
                <h2>{{ item.title }}</h2>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.statusLabel }}
                </span>
              </div>

              <p class="meta-row">
                <span>{{ item.categoryLabel }}</span>
                <span>•</span>
                <span>Student: {{ formatAddress(item.student) }}</span>
                <span>•</span>
                <span>Created: {{ formatDate(item.createdAt) }}</span>
                <span>•</span>
                <span>Due: {{ formatDate(item.dueDate) }}</span>
              </p>
            </div>
          </div>

          <p class="description">{{ item.description }}</p>

          <div class="detail-grid">
            <div class="detail-card">
              <span class="detail-label">Completion</span>
              <strong>{{ item.completed ? 'Completed' : 'Not completed' }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Points</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Reviewed By</span>
              <strong>{{ item.reviewedBy && item.reviewedBy !== '0x0000000000000000000000000000000000000000' ? formatAddress(item.reviewedBy) : '—' }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Reviewed At</span>
              <strong>{{ formatDateTime(item.reviewedAt) }}</strong>
            </div>
          </div>

          <div v-if="Number(item.status) === 0" class="review-actions">
            <label class="points-input">
              <span>Points to award</span>
              <input
                type="number"
                min="0"
                :value="getPointsValue(item.id)"
                @input="setPointsValue(item.id, $event.target.value)"
              />
            </label>

            <div class="action-buttons">
              <button
                type="button"
                class="action-button approve"
                @click="handleApprove(item.id)"
              >
                Approve
              </button>

              <button
                type="button"
                class="action-button reject"
                @click="handleReject(item.id)"
              >
                Reject
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.review-page {
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

.review-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 800;
  color: #6366f1;
}

.review-hero h1 {
  margin: 0;
  font-size: clamp(1.4rem, 2vw, 2rem);
}

.subtext {
  margin: 10px 0 0;
  color: #64748b;
  max-width: 680px;
}

.hero-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-pill {
  min-width: 110px;
  padding: 14px 16px;
  border-radius: 18px;
  display: grid;
  gap: 4px;
}

.stat-pill span {
  font-size: 0.82rem;
  color: #475569;
}

.stat-pill strong {
  font-size: 1.2rem;
}

.stat-pill.pending {
  background: #fef3c7;
}

.stat-pill.approved {
  background: #dcfce7;
}

.stat-pill.rejected {
  background: #fee2e2;
}

.review-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
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

.search-box {
  display: grid;
  gap: 8px;
  min-width: 280px;
}

.search-box span {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.search-box input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: white;
}

.review-list {
  display: grid;
  gap: 16px;
}

.review-card {
  display: grid;
  gap: 16px;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-row h2 {
  margin: 0;
  font-size: 1.15rem;
}

.status-badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.meta-row {
  margin: 8px 0 0;
  color: #64748b;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.92rem;
}

.description {
  margin: 0;
  color: #1e293b;
  line-height: 1.7;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
  padding-top: 4px;
}

.points-input {
  display: grid;
  gap: 8px;
  min-width: 220px;
}

.points-input span {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.points-input input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: white;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-button {
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.action-button.approve {
  background: #16a34a;
  color: white;
}

.action-button.reject {
  background: #dc2626;
  color: white;
}

.empty-state {
  text-align: center;
}

.empty-state h2 {
  margin-top: 0;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

@media (max-width: 960px) {
  .review-hero {
    flex-direction: column;
  }

  .hero-stats {
    justify-content: flex-start;
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .card {
    padding: 18px;
    border-radius: 20px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .review-actions {
    align-items: stretch;
  }

  .action-buttons {
    width: 100%;
  }

  .action-button {
    flex: 1;
  }

  .search-box {
    min-width: 100%;
  }
}
</style>