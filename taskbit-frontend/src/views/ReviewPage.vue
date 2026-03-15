<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const activeTab = ref('pending')
const searchQuery = ref('')
const approvingId = ref(null)
const rejectingId = ref(null)
const pointsInput = ref({})
const showMineInReview = ref(true)

onMounted(async () => {
  await store.loadContributions()
})

const allLoadedContributions = computed(() => store.visibleContributions.value || [])
const myContributions = computed(() => store.myContributions.value || [])

const contributionAccessMode = computed(() => store.contributionAccessMode.value || 'mine')
const totalLoadedCount = computed(() => allLoadedContributions.value.length)
const myLoadedCount = computed(() => myContributions.value.length)

const reviewSourceContributions = computed(() => {
  const allItems = allLoadedContributions.value || []
  const myAddress = String(store.account.value || '').toLowerCase()

  return allItems.filter((item) => {
    const studentAddress = String(item.student || '').toLowerCase()
    const isMine = studentAddress === myAddress

    if (showMineInReview.value) {
      return true
    }

    return !isMine
  })
})

const reviewableCount = computed(() => reviewSourceContributions.value.length)

const pendingCount = computed(() =>
  reviewSourceContributions.value.filter((item) => Number(item.status) === 0).length
)

const approvedCount = computed(() =>
  reviewSourceContributions.value.filter((item) => Number(item.status) === 1).length
)

const rejectedCount = computed(() =>
  reviewSourceContributions.value.filter((item) => Number(item.status) === 2).length
)

const filteredReviewContributions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return reviewSourceContributions.value.filter((item) => {
    const matchesTab =
      activeTab.value === 'all' ? true : getStatusKey(item.status) === activeTab.value

    if (!matchesTab) {
      return false
    }

    if (!query) {
      return true
    }

    const haystack = [
      item.title,
      item.description,
      item.student,
      item.categoryLabel,
      item.statusLabel
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const emptyStateTitle = computed(() => {
  if (filteredReviewContributions.value.length === 0 && totalLoadedCount.value > 0) {
    if (!showMineInReview.value && myLoadedCount.value > 0) {
      return 'Only your own contributions are loaded'
    }

    return 'No contributions found'
  }

  return 'No contributions to review'
})

const emptyStateMessage = computed(() => {
  if (filteredReviewContributions.value.length === 0 && totalLoadedCount.value > 0) {
    if (!showMineInReview.value && myLoadedCount.value > 0) {
      return 'Your loaded contribution belongs to the connected wallet. Turn on "Show my submissions" to display it here.'
    }

    return 'There are no contributions matching the current filter.'
  }

  return 'Once contributions are available, they will appear here for review.'
})

function getStatusKey(status) {
  const numeric = Number(status)

  if (numeric === 0) return 'pending'
  if (numeric === 1) return 'approved'
  if (numeric === 2) return 'rejected'
  return 'pending'
}

function formatDate(timestamp) {
  const value = Number(timestamp || 0)
  if (!value) return '—'
  return new Date(value * 1000).toLocaleDateString()
}

function shortenAddress(address) {
  const value = String(address || '')
  if (!value || value.length < 10) return value || '—'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function getPointsValue(id) {
  const raw = pointsInput.value[id]
  const numeric = Number(raw)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function isMine(item) {
  const myAddress = String(store.account.value || '').toLowerCase()
  const studentAddress = String(item.student || '').toLowerCase()
  return myAddress && studentAddress === myAddress
}

async function handleApprove(id) {
  approvingId.value = id
  try {
    await store.approveContribution(id, getPointsValue(id))
  } finally {
    approvingId.value = null
  }
}

async function handleReject(id) {
  rejectingId.value = id
  try {
    await store.rejectContribution(id)
  } finally {
    rejectingId.value = null
  }
}

function statusBadgeClass(status) {
  const key = getStatusKey(status)
  if (key === 'approved') return 'status-badge approved'
  if (key === 'rejected') return 'status-badge rejected'
  return 'status-badge pending'
}
</script>

<template>
  <section class="review-page">
    <div class="review-hero card">
      <div class="review-hero-copy">
        <p class="section-eyebrow">Review Center</p>
        <h1>Review academic contributions</h1>
        <p>
          Approve or reject student submissions, assign points, and track review activity.
        </p>
      </div>

      <div class="review-stats">
        <div class="mini-stat pending">
          <span>Pending</span>
          <strong>{{ pendingCount }}</strong>
        </div>

        <div class="mini-stat approved">
          <span>Approved</span>
          <strong>{{ approvedCount }}</strong>
        </div>

        <div class="mini-stat rejected">
          <span>Rejected</span>
          <strong>{{ rejectedCount }}</strong>
        </div>
      </div>
    </div>

    <div class="access-banner card" :class="{ warning: contributionAccessMode === 'mine' }">
      <div class="access-banner-left">
        <strong>
          Access mode:
          {{ contributionAccessMode === 'all' ? 'All contributions' : 'Mine only' }}
        </strong>
        <p>
          <template v-if="contributionAccessMode === 'all'">
            The contract returned global review data for this wallet.
          </template>
          <template v-else>
            The app is not currently receiving global review data from the contract.
          </template>
        </p>
      </div>

      <div class="access-banner-right">
        <div class="debug-pill">
          Loaded: <strong>{{ totalLoadedCount }}</strong>
        </div>
        <div class="debug-pill">
          Mine: <strong>{{ myLoadedCount }}</strong>
        </div>
        <div class="debug-pill">
          Review list: <strong>{{ reviewableCount }}</strong>
        </div>
      </div>
    </div>

    <div class="toolbar card">
      <div class="toolbar-left">
        <div class="tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            Pending
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'approved' }"
            @click="activeTab = 'approved'"
          >
            Approved
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'rejected' }"
            @click="activeTab = 'rejected'"
          >
            Rejected
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            All
          </button>
        </div>

        <label class="mine-toggle">
          <input v-model="showMineInReview" type="checkbox" />
          <span>Show my submissions</span>
        </label>
      </div>

      <div class="search-box">
        <label for="review-search">Search</label>
        <input
          id="review-search"
          v-model="searchQuery"
          type="text"
          placeholder="Search title, student address, category..."
        />
      </div>
    </div>

    <div v-if="filteredReviewContributions.length" class="review-list">
      <article
        v-for="item in filteredReviewContributions"
        :key="item.id"
        class="review-card card"
      >
        <div class="review-card-top">
          <div>
            <div class="review-card-meta">
              <span class="category-chip">{{ item.categoryLabel }}</span>
              <span :class="statusBadgeClass(item.status)">{{ item.statusLabel }}</span>
              <span v-if="isMine(item)" class="self-chip">Submitted by you</span>
            </div>

            <h2>{{ item.title }}</h2>
            <p class="review-description">{{ item.description }}</p>
          </div>
        </div>

        <div class="review-info-grid">
          <div class="info-item">
            <span>Student</span>
            <strong>{{ shortenAddress(item.student) }}</strong>
          </div>

          <div class="info-item">
            <span>Created</span>
            <strong>{{ formatDate(item.createdAt) }}</strong>
          </div>

          <div class="info-item">
            <span>Due Date</span>
            <strong>{{ formatDate(item.dueDate) }}</strong>
          </div>

          <div class="info-item">
            <span>Completed</span>
            <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
          </div>

          <div class="info-item" v-if="Number(item.status) !== 0">
            <span>Reviewed By</span>
            <strong>{{ shortenAddress(item.reviewedBy) }}</strong>
          </div>

          <div class="info-item" v-if="Number(item.status) !== 0">
            <span>Points</span>
            <strong>{{ item.pointsAwarded || 0 }}</strong>
          </div>
        </div>

        <div v-if="Number(item.status) === 0" class="review-actions">
          <div class="points-box">
            <label :for="`points-${item.id}`">Points</label>
            <input
              :id="`points-${item.id}`"
              v-model="pointsInput[item.id]"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              :disabled="isMine(item)"
            />
          </div>

          <div class="action-buttons">
            <button
              type="button"
              class="action-btn approve"
              :disabled="approvingId === item.id || isMine(item)"
              @click="handleApprove(item.id)"
            >
              {{
                approvingId === item.id
                  ? 'Approving...'
                  : isMine(item)
                    ? 'Cannot approve own'
                    : 'Approve'
              }}
            </button>

            <button
              type="button"
              class="action-btn reject"
              :disabled="rejectingId === item.id || isMine(item)"
              @click="handleReject(item.id)"
            >
              {{
                rejectingId === item.id
                  ? 'Rejecting...'
                  : isMine(item)
                    ? 'Cannot reject own'
                    : 'Reject'
              }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state card">
      <h2>{{ emptyStateTitle }}</h2>
      <p>{{ emptyStateMessage }}</p>

      <div class="empty-debug" v-if="store.canReview.value">
        <span>Access mode: {{ contributionAccessMode }}</span>
        <span>Total loaded: {{ totalLoadedCount }}</span>
        <span>Mine: {{ myLoadedCount }}</span>
        <span>Review list: {{ reviewableCount }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.review-page {
  display: grid;
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 28px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.review-hero {
  padding: 28px 26px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.review-hero-copy {
  max-width: 700px;
}

.section-eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  font-weight: 800;
  color: #4f46e5;
}

.review-hero h1 {
  margin: 0 0 12px;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.08;
  color: #0f172a;
}

.review-hero p {
  margin: 0;
  color: #475569;
  line-height: 1.65;
  font-size: 1.02rem;
}

.review-stats {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.mini-stat {
  min-width: 128px;
  padding: 16px 18px;
  border-radius: 20px;
}

.mini-stat span {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 0.96rem;
}

.mini-stat strong {
  font-size: 1.9rem;
  color: #0f172a;
}

.mini-stat.pending {
  background: #efe4b6;
}

.mini-stat.approved {
  background: #cfead7;
}

.mini-stat.rejected {
  background: #efd0d0;
}

.access-banner {
  padding: 20px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border-radius: 24px;
}

.access-banner.warning {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(255, 251, 235, 0.95);
}

.access-banner-left strong {
  display: block;
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1rem;
}

.access-banner-left p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.access-banner-right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.debug-pill {
  padding: 10px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.92rem;
  white-space: nowrap;
}

.toolbar {
  padding: 22px 26px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.toolbar-left {
  display: grid;
  gap: 14px;
}

.tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  background: #cfd8e3;
  color: #10223e;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.tab-btn:hover {
  transform: translateY(-1px);
}

.tab-btn.active {
  background: linear-gradient(135deg, #4f46e5, #5b4ff0);
  color: white;
}

.mine-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-weight: 700;
}

.mine-toggle input {
  width: 18px;
  height: 18px;
}

.search-box {
  display: grid;
  gap: 8px;
  min-width: min(360px, 100%);
}

.search-box label {
  font-weight: 700;
  color: #10223e;
}

.search-box input {
  width: 100%;
  border: 1px solid #c7d2e0;
  background: white;
  border-radius: 16px;
  padding: 14px 16px;
  font: inherit;
  color: #10223e;
  outline: none;
}

.search-box input:focus {
  border-color: #7c87ff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.review-list {
  display: grid;
  gap: 18px;
}

.review-card {
  padding: 24px;
  display: grid;
  gap: 18px;
}

.review-card-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.category-chip,
.status-badge,
.self-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.86rem;
  font-weight: 800;
}

.category-chip {
  background: #e0e7ff;
  color: #3730a3;
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

.self-chip {
  background: #ede9fe;
  color: #5b21b6;
}

.review-card h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.review-description {
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.65;
}

.review-info-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.info-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.info-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.82rem;
  color: #64748b;
}

.info-item strong {
  color: #0f172a;
  word-break: break-word;
}

.review-actions {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  flex-wrap: wrap;
}

.points-box {
  display: grid;
  gap: 8px;
  min-width: 150px;
}

.points-box label {
  font-weight: 700;
  color: #10223e;
}

.points-box input {
  border: 1px solid #c7d2e0;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  outline: none;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  border: 0;
  border-radius: 16px;
  padding: 13px 18px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.action-btn.approve {
  background: #16a34a;
  color: white;
}

.action-btn.reject {
  background: #dc2626;
  color: white;
}

.empty-state {
  padding: 42px 24px;
  text-align: center;
}

.empty-state h2 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #0f172a;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.empty-debug {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-debug span {
  background: #f1f5f9;
  color: #334155;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.88rem;
}

@media (max-width: 1180px) {
  .review-info-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .review-hero,
  .toolbar,
  .access-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .review-stats,
  .access-banner-right {
    justify-content: flex-start;
  }

  .search-box {
    min-width: 100%;
  }
}

@media (max-width: 720px) {
  .review-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    border-radius: 22px;
  }

  .review-hero,
  .toolbar,
  .review-card,
  .access-banner {
    padding: 20px;
  }
}

@media (max-width: 520px) {
  .review-info-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    width: 100%;
  }

  .action-btn {
    flex: 1 1 0;
  }
}
</style>