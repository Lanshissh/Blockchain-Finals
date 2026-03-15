<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

onMounted(async () => {
  await store.init()
  await store.loadContributions()
})

const isAdmin = computed(() => store.isAdmin.value || store.isOwner.value)
const canReview = computed(
  () =>
    store.isReviewer.value ||
    store.isProfessor.value ||
    store.isAdmin.value ||
    store.isOwner.value
)

const myStats = computed(() => {
  const items = store.myContributions.value

  return {
    total: items.length,
    pending: items.filter((item) => Number(item.status) === 0).length,
    approved: items.filter((item) => Number(item.status) === 1).length,
    rejected: items.filter((item) => Number(item.status) === 2).length,
    completed: items.filter((item) => item.completed).length,
    minted: items.filter((item) => item.nftMinted).length
  }
})

const reviewStats = computed(() => ({
  pending: store.pendingReviewContributions.value.length,
  total: store.reviewContributions.value.length,
  approved: store.reviewContributions.value.filter((item) => Number(item.status) === 1).length,
  rejected: store.reviewContributions.value.filter((item) => Number(item.status) === 2).length
}))

const recentMyContributions = computed(() =>
  [...store.myContributions.value]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
)

const recentReviewItems = computed(() =>
  [...store.reviewContributions.value]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status
      return b.createdAt - a.createdAt
    })
    .slice(0, 5)
)

const quickLinks = computed(() => {
  const links = [
    {
      title: 'Open Calendar',
      description: 'See deadlines and upcoming contribution schedules.',
      to: '/calendar'
    },
    {
      title: 'Manage Contributions',
      description: 'Submit new work and update your current entries.',
      to: '/contributions'
    },
    {
      title: 'View Profile',
      description: 'Check your wallet role, reputation, and account details.',
      to: '/profile'
    }
  ]

  if (canReview.value) {
    links.push({
      title: 'Open Review Queue',
      description: 'Approve or reject pending student contributions.',
      to: '/review'
    })
  }

  if (isAdmin.value) {
    links.push({
      title: 'Go to Admin',
      description: 'Manage professor/admin roles and system activity.',
      to: '/admin'
    })
  }

  return links
})

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

function getStatusClass(status) {
  const value = Number(status)

  if (value === 1) return 'approved'
  if (value === 2) return 'rejected'
  return 'pending'
}
</script>

<template>
  <section class="dashboard-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">Overview</p>
        <h1>Welcome to your TaskBit dashboard</h1>
        <p class="subtext">
          Track contribution progress, review workload, and your academic activity in one place.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-badge primary">{{ store.roleLabel.value }}</span>
        <span class="hero-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card card">
        <span>My Contributions</span>
        <strong>{{ myStats.total }}</strong>
      </article>

      <article class="stat-card card pending">
        <span>Pending</span>
        <strong>{{ myStats.pending }}</strong>
      </article>

      <article class="stat-card card approved">
        <span>Approved</span>
        <strong>{{ myStats.approved }}</strong>
      </article>

      <article class="stat-card card rejected">
        <span>Rejected</span>
        <strong>{{ myStats.rejected }}</strong>
      </article>

      <article class="stat-card card completed">
        <span>Completed</span>
        <strong>{{ myStats.completed }}</strong>
      </article>

      <article class="stat-card card minted">
        <span>NFT Minted</span>
        <strong>{{ myStats.minted }}</strong>
      </article>
    </div>

    <div v-if="canReview" class="review-stats-grid">
      <article class="stat-card card review">
        <span>Review Queue</span>
        <strong>{{ reviewStats.pending }}</strong>
        <small>Pending reviews</small>
      </article>

      <article class="stat-card card review">
        <span>Total Review Items</span>
        <strong>{{ reviewStats.total }}</strong>
        <small>Other users' submissions</small>
      </article>

      <article class="stat-card card review approved">
        <span>Reviewed Approved</span>
        <strong>{{ reviewStats.approved }}</strong>
        <small>Approved submissions</small>
      </article>

      <article class="stat-card card review rejected">
        <span>Reviewed Rejected</span>
        <strong>{{ reviewStats.rejected }}</strong>
        <small>Rejected submissions</small>
      </article>
    </div>

    <div class="content-grid">
      <article class="card panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Quick Actions</p>
            <h2>Jump to important pages</h2>
          </div>
        </div>

        <div class="quick-links">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="quick-link"
          >
            <div>
              <strong>{{ link.title }}</strong>
              <p>{{ link.description }}</p>
            </div>
            <span>Open</span>
          </RouterLink>
        </div>
      </article>

      <article class="card panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Account Summary</p>
            <h2>Current wallet session</h2>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Wallet</span>
            <strong>{{ store.account.value ? formatAddress(store.account.value) : 'Not connected' }}</strong>
          </div>

          <div class="summary-item">
            <span class="summary-label">Role</span>
            <strong>{{ store.roleLabel.value }}</strong>
          </div>

          <div class="summary-item">
            <span class="summary-label">Wallet Status</span>
            <strong>{{ store.walletStatus.value }}</strong>
          </div>

          <div class="summary-item">
            <span class="summary-label">Contract Status</span>
            <strong>{{ store.contractStatus.value }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="content-grid">
      <article class="card panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Recent Contributions</p>
            <h2>Your latest submissions</h2>
          </div>

          <RouterLink to="/contributions" class="panel-link">View all</RouterLink>
        </div>

        <div v-if="store.isLoadingContributions.value" class="empty-state">
          <h3>Loading contributions…</h3>
          <p>Please wait while your dashboard data is loaded.</p>
        </div>

        <div v-else-if="!recentMyContributions.length" class="empty-state">
          <h3>No contributions yet</h3>
          <p>Create your first academic contribution from the Contributions page.</p>
        </div>

        <div v-else class="item-list">
          <article
            v-for="item in recentMyContributions"
            :key="item.id"
            class="item-card"
          >
            <div class="item-top">
              <div>
                <h3>{{ item.title }}</h3>
                <p class="meta-row">
                  <span>{{ item.categoryLabel }}</span>
                  <span>•</span>
                  <span>Due: {{ formatDate(item.dueDate) }}</span>
                </p>
              </div>

              <span class="status-badge" :class="getStatusClass(item.status)">
                {{ item.statusLabel }}
              </span>
            </div>

            <div class="mini-grid">
              <div class="mini-item">
                <span>Completed</span>
                <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
              </div>

              <div class="mini-item">
                <span>Points</span>
                <strong>{{ item.pointsAwarded }}</strong>
              </div>

              <div class="mini-item">
                <span>NFT</span>
                <strong>{{ item.nftMinted ? 'Minted' : 'Not minted' }}</strong>
              </div>
            </div>
          </article>
        </div>
      </article>

      <article v-if="canReview" class="card panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Review Snapshot</p>
            <h2>Latest reviewable submissions</h2>
          </div>

          <RouterLink to="/review" class="panel-link">Open review</RouterLink>
        </div>

        <div v-if="store.isLoadingContributions.value" class="empty-state">
          <h3>Loading review queue…</h3>
          <p>Please wait while reviewer data is loaded.</p>
        </div>

        <div v-else-if="!recentReviewItems.length" class="empty-state">
          <h3>No review items</h3>
          <p>There are no student submissions available for review right now.</p>
        </div>

        <div v-else class="item-list">
          <article
            v-for="item in recentReviewItems"
            :key="item.id"
            class="item-card"
          >
            <div class="item-top">
              <div>
                <h3>{{ item.title }}</h3>
                <p class="meta-row">
                  <span>{{ item.categoryLabel }}</span>
                  <span>•</span>
                  <span>{{ formatAddress(item.student) }}</span>
                </p>
              </div>

              <span class="status-badge" :class="getStatusClass(item.status)">
                {{ item.statusLabel }}
              </span>
            </div>

            <div class="mini-grid">
              <div class="mini-item">
                <span>Due</span>
                <strong>{{ formatDate(item.dueDate) }}</strong>
              </div>

              <div class="mini-item">
                <span>Completed</span>
                <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
              </div>

              <div class="mini-item">
                <span>Points</span>
                <strong>{{ item.pointsAwarded }}</strong>
              </div>
            </div>
          </article>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
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
.panel h2 {
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

.stats-grid,
.review-stats-grid {
  display: grid;
  gap: 14px;
}

.stats-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.review-stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.stat-card small {
  color: #94a3b8;
  font-size: 0.78rem;
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

.stat-card.review {
  background: #f8fafc;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  display: grid;
  gap: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.panel-link {
  text-decoration: none;
  font-weight: 700;
  color: #4f46e5;
}

.panel-link:hover {
  text-decoration: underline;
}

.quick-links {
  display: grid;
  gap: 12px;
}

.quick-link {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
  border-radius: 18px;
  text-decoration: none;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.quick-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.quick-link strong {
  display: block;
  margin-bottom: 4px;
}

.quick-link p {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
}

.quick-link span {
  font-size: 0.88rem;
  font-weight: 800;
  color: #4f46e5;
}

.summary-grid {
  display: grid;
  gap: 12px;
}

.summary-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.summary-label {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.8rem;
}

.item-list {
  display: grid;
  gap: 14px;
}

.item-card {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
  display: grid;
  gap: 14px;
}

.item-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.item-top h3 {
  margin: 0;
  font-size: 1.02rem;
}

.meta-row {
  margin: 8px 0 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.92rem;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mini-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.mini-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.78rem;
  color: #64748b;
}

.status-badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
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

.empty-state {
  text-align: center;
  padding: 20px 12px;
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

  .review-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
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
  .review-stats-grid,
  .mini-grid {
    grid-template-columns: 1fr;
  }

  .item-top,
  .panel-header {
    flex-direction: column;
  }
}
</style>