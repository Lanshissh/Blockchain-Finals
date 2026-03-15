<template>
  <section class="page-layout">
    <header class="hero-card">
      <div>
        <p class="content-header-eyebrow">Academic Records</p>
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
          <span class="stat-label">Total</span>
          <strong>{{ contributionCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending</span>
          <strong>{{ pendingContributions.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Approved</span>
          <strong>{{ approvedContributions.length }}</strong>
        </div>
      </div>
    </header>

    <section v-if="isWrongNetwork" class="info-card">
      <h3>Wrong Network</h3>
      <p>
        Your wallet is connected to the wrong network. Switch to
        {{ networkName }} before managing contributions.
      </p>
      <div class="action-row">
        <button class="warning-btn" @click="switchNetwork">Switch Network</button>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>{{ formTitle }}</h3>
            <p>{{ formDescription }}</p>
          </div>
          <button class="ghost-btn" @click="resetContributionForm">Reset</button>
        </div>

        <form class="contribution-form" @submit.prevent="addContribution">
          <label class="field">
            <span>Title</span>
            <input
              v-model="contributionForm.title"
              type="text"
              placeholder="Enter contribution title"
              :disabled="!canSubmit"
            />
          </label>

          <label class="field">
            <span>Category</span>
            <select v-model="contributionForm.category" :disabled="!canSubmit">
              <option
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Description</span>
            <textarea
              v-model="contributionForm.description"
              rows="5"
              placeholder="Describe the contribution"
              :disabled="!canSubmit"
            />
          </label>

          <label class="field">
            <span>Due Date</span>
            <input
              v-model="contributionForm.dueDate"
              type="date"
              :disabled="!canSubmit"
            />
          </label>

          <button
            class="primary-btn full-width"
            type="submit"
            :disabled="!canSubmit"
          >
            {{ canSubmit ? 'Submit Contribution' : 'Student submission only' }}
          </button>
        </form>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <div>
            <h3>{{ sideSummaryTitle }}</h3>
            <p>{{ sideSummaryDescription }}</p>
          </div>
          <button class="ghost-btn" @click="loadContributions">Refresh</button>
        </div>

        <div class="overview-grid">
          <div class="mini-stat">
            <span>Wallet</span>
            <strong>{{ shortAccount }}</strong>
          </div>
          <div class="mini-stat">
            <span>Role</span>
            <strong>{{ roleLabel }}</strong>
          </div>
          <div class="mini-stat">
            <span>Completed</span>
            <strong>{{ completedContributions.length }}</strong>
          </div>
          <div class="mini-stat">
            <span>Rejected</span>
            <strong>{{ rejectedContributions.length }}</strong>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <span class="detail-label">Wallet Status</span>
            <strong>{{ walletStatus }}</strong>
          </div>
          <div>
            <span class="detail-label">Contract</span>
            <strong>{{ contractStatus }}</strong>
          </div>
          <div>
            <span class="detail-label">Transaction</span>
            <strong>{{ txStatus }}</strong>
          </div>
          <div>
            <span class="detail-label">Explorer</span>
            <strong>
              <a
                v-if="latestTxUrl"
                :href="latestTxUrl"
                target="_blank"
                rel="noreferrer"
              >
                {{ shortTxHash }}
              </a>
              <template v-else>—</template>
            </strong>
          </div>
        </div>
      </article>
    </section>

    <section v-if="showReviewerPanel" class="panel-card">
      <div class="panel-header">
        <div>
          <h3>{{ reviewQueueTitle }}</h3>
          <p>{{ reviewQueueDescription }}</p>
        </div>
      </div>

      <div v-if="!reviewQueue.length" class="empty-state">
        No pending contributions to review.
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in reviewQueue"
          :key="`review-${item.id}`"
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
              <span class="detail-label">Student</span>
              <strong>{{ shortenAddress(item.student) }}</strong>
            </div>
            <div>
              <span class="detail-label">Points</span>
              <strong>{{ item.pointsAwarded }}</strong>
            </div>
          </div>

          <div class="reviewer-panel">
            <div class="reviewer-points">
              <label :for="`points-${item.id}`">Points</label>
              <input
                :id="`points-${item.id}`"
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

    <section class="panel-card">
      <div class="panel-header">
        <div>
          <h3>{{ listTitle }}</h3>
          <p>{{ listDescription }}</p>
        </div>
      </div>

      <div v-if="isLoadingContributions" class="empty-state">
        Loading contributions...
      </div>

      <div v-else-if="!visibleContributions.length" class="empty-state">
        No contributions yet.
      </div>

      <div v-else class="contribution-list">
        <article
          v-for="item in visibleContributions"
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

          <div
            v-if="item.reviewedBy && item.reviewedBy !== zeroAddress"
            class="review-box"
          >
            <span>Reviewed by:</span>
            <strong>{{ shortenAddress(item.reviewedBy) }}</strong>
            <span>· {{ formatDate(item.reviewedAt) }}</span>
          </div>

          <div class="action-row">
            <button
              v-if="canStudentManage(item)"
              class="secondary-btn"
              :disabled="item.status === 2"
              @click="toggleContribution(item.id)"
            >
              {{ item.completed ? 'Mark Incomplete' : 'Mark Complete' }}
            </button>

            <button
              v-if="canStudentDelete(item)"
              class="danger-btn"
              :disabled="item.status !== 0"
              @click="removeContribution(item.id)"
            >
              Delete
            </button>

            <button
              v-if="canStudentMint(item)"
              class="success-btn"
              :disabled="!canMint(item)"
              @click="mintNft(item.id)"
            >
              {{ item.nftMinted ? 'NFT Minted' : 'Mint NFT' }}
            </button>

            <span v-if="showReadOnlyNote(item)" class="inline-note">
              {{ readOnlyNote(item) }}
            </span>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const zeroAddress = '0x0000000000000000000000000000000000000000'

const store = useAuctusStore()
const reviewPoints = reactive({})

const {
  account,
  walletStatus,
  contractStatus,
  txStatus,
  latestTxHash,
  latestTxUrl,
  contributionForm,
  visibleContributions,
  pendingContributions,
  approvedContributions,
  rejectedContributions,
  completedContributions,
  contributionCount,
  isReviewer,
  isProfessor,
  isAdmin,
  isOwner,
  roleLabel,
  userRole,
  categoryOptions,
  isWrongNetwork,
  isLoadingContributions,
  switchNetwork,
  loadContributions,
  addContribution,
  toggleContribution,
  removeContribution,
  approveContribution,
  rejectContribution,
  mintNft,
  resetContributionForm,
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

const canSubmit = computed(() => userRole.value === 'student')
const showReviewerPanel = computed(() => isProfessor.value || isAdmin.value || isOwner.value)

const reviewQueue = computed(() =>
  pendingContributions.value
    .slice()
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
)

const heroTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Contribution Management'
  if (isProfessor.value) return 'Contribution Review'
  return 'My Contributions'
})

const heroDescription = computed(() => {
  if (isAdmin.value || isOwner.value) {
    return 'Review contribution records, monitor approval status, and manage academic workflow activity.'
  }
  if (isProfessor.value) {
    return 'Review student submissions, assign points, and approve or reject academic contributions.'
  }
  return 'Submit, complete, and mint NFT certificates for your academic contributions on-chain.'
})

const formTitle = computed(() => {
  if (canSubmit.value) return 'Submit Contribution'
  return 'Submission Access'
})

const formDescription = computed(() => {
  if (canSubmit.value) return 'Create a new blockchain contribution record.'
  return 'Contribution submission is currently available to student accounts.'
})

const sideSummaryTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Admin Summary'
  if (isProfessor.value) return 'Review Summary'
  return 'Status'
})

const sideSummaryDescription = computed(() => {
  if (isAdmin.value || isOwner.value) return 'System-facing overview of contribution activity.'
  if (isProfessor.value) return 'Review-focused contribution summary.'
  return 'Current wallet and contract activity.'
})

const reviewQueueTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Admin Review Queue'
  return 'Professor Review Queue'
})

const reviewQueueDescription = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Pending contributions waiting for administrative review.'
  return 'Pending contributions waiting for professor review.'
})

const listTitle = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Visible Contributions'
  if (isProfessor.value) return 'Contribution Records'
  return 'My Contributions'
})

const listDescription = computed(() => {
  if (isAdmin.value || isOwner.value) return 'Contribution records currently available in your dashboard view.'
  if (isProfessor.value) return 'View contribution status and student submission progress.'
  return 'Manage your submissions, completion state, and NFT minting.'
})

function shortenAddress(value) {
  if (!value) return '—'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
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

function statusClass(status) {
  const numeric = Number(status)
  if (numeric === 1) return 'approved'
  if (numeric === 2) return 'rejected'
  return 'pending'
}

function canMint(item) {
  return (
    item.completed &&
    Number(item.status) === 1 &&
    !item.nftMinted &&
    !item.deleted
  )
}

function canStudentManage(item) {
  return userRole.value === 'student' && !item.deleted
}

function canStudentDelete(item) {
  return userRole.value === 'student' && !item.deleted
}

function canStudentMint(item) {
  return userRole.value === 'student' && !item.deleted
}

function showReadOnlyNote(item) {
  if (userRole.value === 'student') return false
  return !item.deleted
}

function readOnlyNote(item) {
  if (isAdmin.value || isOwner.value) {
    if (Number(item.status) === 0) return 'Use the review queue above to approve or reject this contribution.'
    return 'Admin view: status already finalized.'
  }

  if (isProfessor.value) {
    if (Number(item.status) === 0) return 'Use the review queue above to approve or reject this contribution.'
    return 'Professor view: status already finalized.'
  }

  return 'Read-only view.'
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

.inline-note {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  font-size: 0.9rem;
}

@media (max-width: 760px) {
  .inline-note {
    width: 100%;
  }
}
</style>