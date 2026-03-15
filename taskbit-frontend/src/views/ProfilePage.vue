<script setup>
import { computed, onMounted } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

onMounted(async () => {
  await store.init()
  await store.loadContributions()
})

const profileStats = computed(() => {
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

const roleBadges = computed(() => {
  return [
    { label: 'Student', active: store.userRole.value === 'student' },
    { label: 'Reviewer', active: store.isReviewer.value },
    { label: 'Professor', active: store.isProfessor.value },
    { label: 'Admin', active: store.isAdmin.value || store.isOwner.value },
    { label: 'Owner', active: store.isOwner.value }
  ]
})

const recentActivity = computed(() =>
  [...store.myContributions.value]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)
)

function shortenAddress(address) {
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

function getStatusClass(status) {
  const value = Number(status)

  if (value === 1) return 'approved'
  if (value === 2) return 'rejected'
  return 'pending'
}
</script>

<template>
  <section class="profile-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">Profile</p>
        <h1>Your TaskBit account overview</h1>
        <p class="subtext">
          View your wallet identity, active roles, reputation, and academic contribution progress.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-badge primary">{{ store.roleLabel.value }}</span>
        <span class="hero-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div class="profile-layout">
      <article class="card identity-card">
        <div class="section-header">
          <div>
            <p class="section-label">Account Identity</p>
            <h2>Connected wallet details</h2>
          </div>
        </div>

        <div class="identity-grid">
          <div class="identity-item">
            <span class="identity-label">Wallet Address</span>
            <strong>{{ store.account.value || 'Not connected' }}</strong>
          </div>

          <div class="identity-item">
            <span class="identity-label">Short Address</span>
            <strong>{{ store.account.value ? shortenAddress(store.account.value) : '—' }}</strong>
          </div>

          <div class="identity-item">
            <span class="identity-label">Primary Role</span>
            <strong>{{ store.roleLabel.value }}</strong>
          </div>

          <div class="identity-item">
            <span class="identity-label">Network</span>
            <strong>{{ store.networkName }}</strong>
          </div>
        </div>

        <div class="role-section">
          <span class="identity-label">Role Access</span>

          <div class="role-badge-list">
            <span
              v-for="badge in roleBadges"
              :key="badge.label"
              class="role-pill"
              :class="{ active: badge.active }"
            >
              {{ badge.label }}
            </span>
          </div>
        </div>
      </article>

      <article class="card session-card">
        <div class="section-header">
          <div>
            <p class="section-label">Session Status</p>
            <h2>Current app connection</h2>
          </div>
        </div>

        <div class="session-list">
          <div class="session-item">
            <span>Wallet Status</span>
            <strong>{{ store.walletStatus.value }}</strong>
          </div>

          <div class="session-item">
            <span>Contract Status</span>
            <strong>{{ store.contractStatus.value }}</strong>
          </div>

          <div class="session-item">
            <span>Latest Transaction</span>
            <strong>{{ store.txStatus.value }}</strong>
          </div>

          <a
            v-if="store.latestTxUrl.value"
            :href="store.latestTxUrl.value"
            target="_blank"
            rel="noreferrer"
            class="tx-link"
          >
            View latest transaction
          </a>
        </div>
      </article>
    </div>

    <div class="stats-grid">
      <article class="stat-card card">
        <span>Total Contributions</span>
        <strong>{{ profileStats.total }}</strong>
      </article>

      <article class="stat-card card pending">
        <span>Pending</span>
        <strong>{{ profileStats.pending }}</strong>
      </article>

      <article class="stat-card card approved">
        <span>Approved</span>
        <strong>{{ profileStats.approved }}</strong>
      </article>

      <article class="stat-card card rejected">
        <span>Rejected</span>
        <strong>{{ profileStats.rejected }}</strong>
      </article>

      <article class="stat-card card completed">
        <span>Completed</span>
        <strong>{{ profileStats.completed }}</strong>
      </article>

      <article class="stat-card card minted">
        <span>NFT Minted</span>
        <strong>{{ profileStats.minted }}</strong>
      </article>
    </div>

    <article class="card activity-card">
      <div class="section-header">
        <div>
          <p class="section-label">Recent Activity</p>
          <h2>Latest contribution records</h2>
        </div>
      </div>

      <div v-if="store.isLoadingContributions.value" class="empty-state">
        <h3>Loading profile activity…</h3>
        <p>Please wait while your contribution data is loaded.</p>
      </div>

      <div v-else-if="!recentActivity.length" class="empty-state">
        <h3>No recent activity</h3>
        <p>Your contribution history will appear here once you submit entries.</p>
      </div>

      <div v-else class="activity-list">
        <article
          v-for="item in recentActivity"
          :key="item.id"
          class="activity-item"
        >
          <div class="activity-top">
            <div>
              <h3>{{ item.title }}</h3>
              <p class="meta-row">
                <span>{{ item.categoryLabel }}</span>
                <span>•</span>
                <span>Created: {{ formatDate(item.createdAt) }}</span>
                <span>•</span>
                <span>Due: {{ formatDate(item.dueDate) }}</span>
              </p>
            </div>

            <span class="status-badge" :class="getStatusClass(item.status)">
              {{ item.statusLabel }}
            </span>
          </div>

          <div class="activity-meta-grid">
            <div class="meta-card">
              <span>Completed</span>
              <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
            </div>

            <div class="meta-card">
              <span>Points Awarded</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>

            <div class="meta-card">
              <span>NFT</span>
              <strong>{{ item.nftMinted ? 'Minted' : 'Not minted' }}</strong>
            </div>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped>
.profile-page {
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
.identity-card h2,
.session-card h2,
.activity-card h2 {
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

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 16px;
}

.identity-card,
.session-card,
.activity-card {
  display: grid;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.identity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.identity-item,
.session-item,
.meta-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.identity-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.82rem;
  color: #64748b;
}

.identity-item strong,
.session-item strong,
.meta-card strong {
  word-break: break-word;
}

.role-section {
  display: grid;
  gap: 12px;
}

.role-badge-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.role-pill {
  padding: 9px 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #475569;
}

.role-pill.active {
  background: #4f46e5;
  color: white;
}

.session-list {
  display: grid;
  gap: 12px;
}

.session-item span,
.meta-card span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #64748b;
}

.tx-link {
  display: inline-block;
  text-decoration: none;
  font-weight: 700;
  color: #4f46e5;
}

.tx-link:hover {
  text-decoration: underline;
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

.activity-list {
  display: grid;
  gap: 14px;
}

.activity-item {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
  display: grid;
  gap: 14px;
}

.activity-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.activity-top h3 {
  margin: 0;
  font-size: 1.04rem;
}

.meta-row {
  margin: 8px 0 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 0.92rem;
}

.activity-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
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
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .identity-grid,
  .stats-grid,
  .activity-meta-grid {
    grid-template-columns: 1fr;
  }

  .activity-top {
    flex-direction: column;
  }
}
</style>