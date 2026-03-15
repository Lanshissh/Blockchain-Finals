<template>
  <section class="page-layout">
    <header class="hero-card">
      <div>
        <p class="content-header-eyebrow">Profile</p>
        <h2>My Profile</h2>
        <p>
          View your wallet identity, academic contribution summary, reputation,
          and NFT progress.
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">Role</span>
          <strong>{{ roleLabel }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total</span>
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

    <section class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Wallet Information</h3>
            <p>Your connected blockchain identity.</p>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <span class="detail-label">Address</span>
            <strong>{{ account || 'Not connected' }}</strong>
          </div>
          <div>
            <span class="detail-label">Short Address</span>
            <strong>{{ shortAccount }}</strong>
          </div>
          <div>
            <span class="detail-label">Role</span>
            <strong>{{ roleLabel }}</strong>
          </div>
          <div>
            <span class="detail-label">Network</span>
            <strong>{{ networkName }}</strong>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>Academic Summary</h3>
            <p>Your current academic contribution progress.</p>
          </div>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Pending</span>
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
            <span>Completed</span>
            <strong>{{ completedContributions.length }}</strong>
          </div>
        </div>
      </article>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h3>Recent Contributions</h3>
          <p>Your latest academic records.</p>
        </div>
      </div>

      <div v-if="!recentContributions.length" class="empty-state">
        No contribution records yet.
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
            </div>
          </div>

          <div class="details-grid">
            <div>
              <span class="detail-label">Due Date</span>
              <strong>{{ formatDate(item.dueDate) }}</strong>
            </div>
            <div>
              <span class="detail-label">Points</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>
            <div>
              <span class="detail-label">NFT</span>
              <strong>{{ item.nftMinted ? 'Minted' : 'Not Minted' }}</strong>
            </div>
            <div>
              <span class="detail-label">Completed</span>
              <strong>{{ item.completed ? 'Yes' : 'No' }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const {
  account,
  roleLabel,
  networkName,
  contributionCount,
  reputation,
  pendingContributions,
  approvedContributions,
  rejectedContributions,
  completedContributions,
  visibleContributions,
  init,
  loadContributions
} = store

const shortAccount = computed(() => {
  if (!account.value) return 'Not connected'
  return `${account.value.slice(0, 6)}...${account.value.slice(-4)}`
})

const recentContributions = computed(() =>
  [...visibleContributions.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
)

function formatDate(unixValue) {
  const value = Number(unixValue)
  if (!value) return '—'
  return new Date(value * 1000).toLocaleDateString()
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
</style>