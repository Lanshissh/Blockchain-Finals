<template>
  <section class="page-layout">
    <header class="hero-card">
      <div>
        <p class="content-header-eyebrow">Review</p>
        <h2>Review Queue</h2>
        <p>
          Approve or reject pending academic contributions and assign points.
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">Role</span>
          <strong>{{ roleLabel }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending Queue</span>
          <strong>{{ reviewQueue.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Approved</span>
          <strong>{{ approvedContributions.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Rejected</span>
          <strong>{{ rejectedContributions.length }}</strong>
        </div>
      </div>
    </header>

    <section v-if="!canAccess" class="info-card">
      <h3>Access Restricted</h3>
      <p>This page is only for professor and admin accounts.</p>
    </section>

    <section v-else class="panel-card">
      <div class="panel-header">
        <div>
          <h3>Pending Contributions</h3>
          <p>Review and assign points to each contribution.</p>
        </div>
      </div>

      <div v-if="!reviewQueue.length" class="empty-state">
        No pending contributions to review.
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in reviewQueue"
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
              <span class="badge pending">Pending</span>
            </div>
          </div>

          <p class="description">{{ item.description }}</p>

          <div class="details-grid">
            <div>
              <span class="detail-label">Student</span>
              <strong>{{ shortenAddress(item.student) }}</strong>
            </div>
            <div>
              <span class="detail-label">Due</span>
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
          </div>

          <div class="reviewer-panel">
            <div class="reviewer-points">
              <label :for="`review-points-${item.id}`">Points</label>
              <input
                :id="`review-points-${item.id}`"
                v-model.number="reviewPoints[item.id]"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>

            <div class="reviewer-actions">
              <button
                class="success-btn"
                @click="approveContribution(item.id, reviewPoints[item.id] || 0)"
              >
                Approve
              </button>
              <button class="danger-btn" @click="rejectContribution(item.id)">
                Reject
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()
const reviewPoints = reactive({})

const {
  roleLabel,
  isProfessor,
  isAdmin,
  isOwner,
  pendingContributions,
  approvedContributions,
  rejectedContributions,
  approveContribution,
  rejectContribution,
  init,
  loadContributions
} = store

const canAccess = computed(() => isProfessor.value || isAdmin.value || isOwner.value)

const reviewQueue = computed(() =>
  [...pendingContributions.value].sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
)

function shortenAddress(value) {
  if (!value) return '—'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatDate(unixValue) {
  const value = Number(unixValue)
  if (!value) return '—'
  return new Date(value * 1000).toLocaleDateString()
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