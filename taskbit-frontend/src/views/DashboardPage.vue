<template>
  <section class="page-layout">
    <header class="hero-card">
      <div>
        <p class="content-header-eyebrow">Overview</p>
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
          <span class="stat-label">Total Contributions</span>
          <strong>{{ contributionCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Approved</span>
          <strong>{{ approvedContributions.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Reputation</span>
          <strong>{{ reputation }}</strong>
        </div>
      </div>
    </header>

    <section class="status-grid">
      <article class="info-card">
        <h3>Wallet</h3>
        <p>{{ walletStatus }}</p>
        <div class="dashboard-meta">
          <span class="detail-label">Account</span>
          <strong>{{ shortAccount }}</strong>
        </div>
      </article>

      <article class="info-card">
        <h3>Contract</h3>
        <p>{{ contractStatus }}</p>
        <div class="dashboard-meta">
          <span class="detail-label">Network</span>
          <strong>{{ networkName }}</strong>
        </div>
      </article>

      <article class="info-card">
        <h3>Role Access</h3>
        <p>{{ roleAccessText }}</p>
        <div class="dashboard-meta">
          <span class="detail-label">Mode</span>
          <strong>{{ roleLabel }}</strong>
        </div>
      </article>

      <article class="info-card">
        <h3>Latest Transaction</h3>
        <p>{{ txStatus }}</p>
        <div v-if="latestTxHash" class="tx-links">
          <span class="tx-hash">{{ shortTxHash }}</span>
          <a :href="latestTxUrl" target="_blank" rel="noreferrer">View on explorer</a>
        </div>
      </article>
    </section>

    <section v-if="isWrongNetwork" class="info-card">
      <h3>Wrong Network</h3>
      <p>
        Please switch MetaMask to {{ networkName }} to continue using TaskBit.
      </p>
      <div class="action-row">
        <button class="warning-btn" @click="switchNetwork">Switch Network</button>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>{{ summaryTitle }}</h3>
            <p>{{ summaryDescription }}</p>
          </div>
          <button class="ghost-btn" @click="loadContributions">Refresh</button>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Visible</span>
            <strong>{{ visibleContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Completed</span>
            <strong>{{ completedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Pending</span>
            <strong>{{ pendingContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Rejected</span>
            <strong>{{ rejectedContributions.length }}</strong>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Quick Actions</h3>
            <p>Jump into your most important workflows.</p>
          </div>
        </div>

        <div class="action-grid">
          <RouterLink class="ghost-btn nav-action" to="/contributions">
            {{ contributionsActionLabel }}
          </RouterLink>

          <RouterLink class="ghost-btn nav-action" to="/calendar">
            Open Calendar
          </RouterLink>

          <button class="secondary-btn nav-action" @click="loadContributions">
            Refresh Dashboard
          </button>

          <button
            v-if="isWrongNetwork"
            class="warning-btn nav-action"
            @click="switchNetwork"
          >
            Fix Network
          </button>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h3>{{ recentSectionTitle }}</h3>
          <p>{{ recentSectionDescription }}</p>
        </div>
        <RouterLink class="ghost-btn" to="/contributions">
          Manage All
        </RouterLink>
      </div>

      <div v-if="isLoadingContributions" class="empty-state">
        Loading dashboard data...
      </div>

      <div v-else-if="!recentContributions.length" class="empty-state">
        No contributions yet. Go to the Contributions page to submit your first one.
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in recentContributions"
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
              <span
                class="badge"
                :class="item.completed ? 'complete' : 'incomplete'"
              >
                {{ item.completed ? 'Completed' : 'Pending Work' }}
              </span>
            </div>
          </div>

          <p class="description">{{ item.description }}</p>

          <div class="details-grid">
            <div>
              <span class="detail-label">Due Date</span>
              <strong>{{ formatDate(item.dueDate) }}</strong>
            </div>
            <div>
              <span class="detail-label">Created</span>
              <strong>{{ formatDate(item.createdAt) }}</strong>
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

    <section class="role-panels">
      <article v-if="userRole === 'student'" class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Student Insights</h3>
            <p>Your personal academic progress on-chain.</p>
          </div>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Pending Review</span>
            <strong>{{ pendingContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Approved Work</span>
            <strong>{{ approvedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Completed Work</span>
            <strong>{{ completedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Reputation</span>
            <strong>{{ reputation }}</strong>
          </div>
        </div>
      </article>

      <article v-if="isProfessor" class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Professor Review Snapshot</h3>
            <p>Review-focused overview for contribution validation.</p>
          </div>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Pending Queue</span>
            <strong>{{ pendingContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Approved</span>
            <strong>{{ approvedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Rejected</span>
            <strong>{{ rejectedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Reviewer Access</span>
            <strong>{{ isReviewer ? 'Enabled' : 'Off' }}</strong>
          </div>
        </div>
      </article>

      <article v-if="isAdmin || isOwner" class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Admin Snapshot</h3>
            <p>Administrative view of academic contribution activity.</p>
          </div>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Total Records</span>
            <strong>{{ contributionCount }}</strong>
          </div>
          <div class="mini-stat">
            <span>Approved</span>
            <strong>{{ approvedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Rejected</span>
            <strong>{{ rejectedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Admin Access</span>
            <strong>Enabled</strong>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const {
  account,
  walletStatus,
  contractStatus,
  txStatus,
  latestTxHash,
  latestTxUrl,
  visibleContributions,
  pendingContributions,
  approvedContributions,
  rejectedContributions,
  completedContributions,
  contributionCount,
  reputation,
  isReviewer,
  isProfessor,
  isAdmin,
  isOwner,
  userRole,
  roleLabel,
  isWrongNetwork,
  isLoadingContributions,
  switchNetwork,
  loadContributions,
  init,
  networkName
} = store

const shortAccount = computed(() =>
  account.value ? `${account.value.slice(0, 6)}...${account.value.slice(-4)}` : 'Not connected'
)

const shortTxHash = computed(() =>
  latestTxHash.value
    ? `${latestTxHash.value.slice(0, 10)}...${latestTxHash.value.slice(-8)}`
    : ''
)

const recentContributions = computed(() =>
  [...visibleContributions.value]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
)

const heroTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Admin Dashboard'
  if (isProfessor.value) return 'Professor Dashboard'
  return 'Student Dashboard'
})

const heroDescription = computed(() => {
  if (isAdmin.value || isOwner.value) {
    return 'Monitor contribution activity, review system progress, and manage academic workflows from one place.'
  }
  if (isProfessor.value) {
    return 'Review student contributions, track approvals, and oversee academic validation on-chain.'
  }
  return 'Track your academic contribution activity, approval progress, reputation, and NFT-ready achievements in one place.'
})

const roleAccessText = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Admin access enabled.'
  if (isProfessor.value) return 'Professor review access enabled.'
  if (isReviewer.value) return 'Reviewer access enabled.'
  return 'Student access enabled.'
})

const summaryTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'System Summary'
  if (isProfessor.value) return 'Review Summary'
  return 'Contribution Summary'
})

const summaryDescription = computed(() => {
  if (isAdmin.value || isOwner.value) return 'High-level contribution activity across your current dashboard data.'
  if (isProfessor.value) return 'Review-oriented summary for pending and completed records.'
  return 'Quick view of your academic progress.'
})

const contributionsActionLabel = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Manage Contributions'
  if (isProfessor.value) return 'Review Contributions'
  return 'Go to Contributions'
})

const recentSectionTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Recent Contribution Activity'
  if (isProfessor.value) return 'Recent Review Items'
  return 'Recent Contributions'
})

const recentSectionDescription = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Latest contribution records visible in your dashboard.'
  if (isProfessor.value) return 'Recent records that may need professor review.'
  return 'Your latest blockchain-recorded academic submissions.'
})

function formatDate(unixValue) {
  const value = Number(unixValue)
  if (!value) return '—'

  return new Date(value * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
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

.dashboard-meta {
  margin-top: 12px;
  display: grid;
  gap: 6px;
}

.action-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.nav-action {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.role-panels {
  display: grid;
  gap: 20px;
}

@media (max-width: 760px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>