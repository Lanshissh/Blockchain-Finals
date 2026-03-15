<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const activeFilter = ref('all')
const searchTerm = ref('')

onMounted(async () => {
  await store.init()
  await store.loadContributions()
})

const filteredContributions = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return [...store.myContributions.value].filter((item) => {
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
      item.categoryLabel.toLowerCase().includes(keyword) ||
      item.statusLabel.toLowerCase().includes(keyword)

    return matchesFilter && matchesSearch
  })
})

const stats = computed(() => ({
  total: store.myContributions.value.length,
  pending: store.myContributions.value.filter((item) => Number(item.status) === 0).length,
  approved: store.myContributions.value.filter((item) => Number(item.status) === 1).length,
  rejected: store.myContributions.value.filter((item) => Number(item.status) === 2).length,
  completed: store.myContributions.value.filter((item) => item.completed).length,
  minted: store.myContributions.value.filter((item) => item.nftMinted).length
}))

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

function statusClass(status) {
  const value = Number(status)

  if (value === 1) return 'approved'
  if (value === 2) return 'rejected'
  return 'pending'
}

function canDelete(item) {
  return Number(item.status) === 0
}

function canToggle(item) {
  return Number(item.status) === 0
}

function canMint(item) {
  return item.completed && Number(item.status) === 1 && !item.nftMinted
}

async function handleSubmit() {
  await store.addContribution()
}

async function handleToggle(item) {
  await store.toggleContribution(item.id)
}

async function handleDelete(item) {
  await store.removeContribution(item.id)
}

async function handleMint(item) {
  await store.mintNft(item.id)
}
</script>

<template>
  <section class="contributions-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">My Contributions</p>
        <h1>Submit and manage academic work</h1>
        <p class="subtext">
          Add new academic contributions, track approval progress, and mint achievement NFTs
          once approved.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-badge primary">{{ store.roleLabel.value }}</span>
        <span class="hero-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card card">
        <span>Total</span>
        <strong>{{ stats.total }}</strong>
      </article>

      <article class="stat-card card pending">
        <span>Pending</span>
        <strong>{{ stats.pending }}</strong>
      </article>

      <article class="stat-card card approved">
        <span>Approved</span>
        <strong>{{ stats.approved }}</strong>
      </article>

      <article class="stat-card card rejected">
        <span>Rejected</span>
        <strong>{{ stats.rejected }}</strong>
      </article>

      <article class="stat-card card completed">
        <span>Completed</span>
        <strong>{{ stats.completed }}</strong>
      </article>

      <article class="stat-card card minted">
        <span>NFT Minted</span>
        <strong>{{ stats.minted }}</strong>
      </article>
    </div>

    <div class="content-grid">
      <article class="card submit-card">
        <div class="section-header">
          <div>
            <p class="section-label">Submit Contribution</p>
            <h2>Add a new academic contribution</h2>
          </div>
        </div>

        <div class="form-grid">
          <label class="field field-full">
            <span>Title</span>
            <input
              v-model="store.contributionForm.value.title"
              type="text"
              placeholder="Enter contribution title"
            />
          </label>

          <label class="field">
            <span>Category</span>
            <select v-model="store.contributionForm.value.category">
              <option
                v-for="option in store.categoryOptions.value"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Due Date</span>
            <input
              v-model="store.contributionForm.value.dueDate"
              type="date"
            />
          </label>

          <label class="field field-full">
            <span>Description</span>
            <textarea
              v-model="store.contributionForm.value.description"
              rows="5"
              placeholder="Describe the contribution, activity, or achievement"
            />
          </label>
        </div>

        <div class="submit-actions">
          <button type="button" class="action-btn subtle" @click="store.resetContributionForm">
            Reset
          </button>
          <button type="button" class="action-btn primary" @click="handleSubmit">
            Submit Contribution
          </button>
        </div>
      </article>

      <article class="card tips-card">
        <div class="section-header">
          <div>
            <p class="section-label">Guidelines</p>
            <h2>Before you submit</h2>
          </div>
        </div>

        <ul class="tips-list">
          <li>Use a clear title so reviewers can identify the work quickly.</li>
          <li>Choose the category that best matches the academic activity.</li>
          <li>Add enough detail in the description for review and scoring.</li>
          <li>Mark the contribution completed when the work is actually done.</li>
          <li>Mint the NFT only after the contribution is approved.</li>
        </ul>
      </article>
    </div>

    <article class="card list-card">
      <div class="list-toolbar">
        <div>
          <p class="section-label">Contribution History</p>
          <h2>Your submitted contributions</h2>
        </div>

        <div class="toolbar-controls">
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

          <label class="search-box">
            <span>Search</span>
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Search title, category, status..."
            />
          </label>
        </div>
      </div>

      <div v-if="store.isLoadingContributions.value" class="empty-state">
        <h3>Loading contributions…</h3>
        <p>Please wait while your contribution list is loaded from the contract.</p>
      </div>

      <div v-else-if="!filteredContributions.length" class="empty-state">
        <h3>No contributions found</h3>
        <p>You do not have any contributions matching the current filter.</p>
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in filteredContributions"
          :key="item.id"
          class="contribution-card"
        >
          <div class="contribution-header">
            <div>
              <div class="title-row">
                <h3>{{ item.title }}</h3>
                <span class="status-badge" :class="statusClass(item.status)">
                  {{ item.statusLabel }}
                </span>
              </div>

              <p class="meta-row">
                <span>{{ item.categoryLabel }}</span>
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
              <span class="detail-label">Completed</span>
              <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Points Awarded</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Reviewed By</span>
              <strong>
                {{
                  item.reviewedBy &&
                  item.reviewedBy !== '0x0000000000000000000000000000000000000000'
                    ? item.reviewedBy.slice(0, 6) + '...' + item.reviewedBy.slice(-4)
                    : '—'
                }}
              </strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">Reviewed At</span>
              <strong>{{ formatDateTime(item.reviewedAt) }}</strong>
            </div>

            <div class="detail-card">
              <span class="detail-label">NFT Minted</span>
              <strong>{{ item.nftMinted ? 'Yes' : 'No' }}</strong>
            </div>
          </div>

          <div class="card-actions">
            <button
              v-if="canToggle(item)"
              type="button"
              class="action-btn subtle"
              @click="handleToggle(item)"
            >
              {{ item.completed ? 'Mark as Incomplete' : 'Mark as Completed' }}
            </button>

            <button
              v-if="canDelete(item)"
              type="button"
              class="action-btn danger"
              @click="handleDelete(item)"
            >
              Delete
            </button>

            <button
              v-if="canMint(item)"
              type="button"
              class="action-btn primary"
              @click="handleMint(item)"
            >
              Mint NFT
            </button>

            <span
              v-if="item.nftMinted"
              class="minted-pill"
            >
              NFT already minted
            </span>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped>
.contributions-page {
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
.submit-card h2,
.tips-card h2,
.list-card h2 {
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
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

.stat-card.completed {
  background: #eff6ff;
}

.stat-card.minted {
  background: #faf5ff;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.submit-card,
.tips-card,
.list-card {
  display: grid;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-full {
  grid-column: 1 / -1;
}

.field span,
.search-box span {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.field input,
.field select,
.field textarea,
.search-box input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: white;
}

.field textarea {
  resize: vertical;
  min-height: 120px;
}

.submit-actions,
.card-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.action-btn.subtle {
  background: #e2e8f0;
  color: #334155;
}

.action-btn.danger {
  background: #fee2e2;
  color: #991b1b;
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  display: grid;
  gap: 10px;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
}

.toolbar-controls {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: end;
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
  min-width: 260px;
}

.contribution-list {
  display: grid;
  gap: 16px;
}

.contribution-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 22px;
  padding: 18px;
  background: #f8fafc;
  display: grid;
  gap: 14px;
}

.contribution-header {
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

.title-row h3 {
  margin: 0;
  font-size: 1.08rem;
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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.detail-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

.minted-pill {
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  background: #ede9fe;
  color: #5b21b6;
}

.empty-state {
  text-align: center;
  padding: 18px 12px;
}

.empty-state h3 {
  margin: 0 0 8px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero {
    flex-direction: column;
  }

  .hero-badges {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .card {
    padding: 18px;
    border-radius: 20px;
  }

  .stats-grid,
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .search-box {
    min-width: 100%;
  }

  .toolbar-controls {
    width: 100%;
  }
}
</style>