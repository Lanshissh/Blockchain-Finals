<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="nav-container">
        <div class="brand">
          <span class="brand-icon" aria-hidden="true">🎓</span>
          <div>
            <h1>{{ appBrand }}</h1>
            <p class="brand-subtitle">Blockchain Academic Contribution Tracker</p>
          </div>
        </div>

        <div class="nav-right">
          <span class="network-badge" :class="{ 'network-badge-warning': isWrongNetwork }">
            {{ networkName }}
          </span>

          <span class="network-detail">{{ walletStatus }}</span>
          <span class="network-detail">{{ contractStatus }}</span>

          <div v-if="account" class="wallet-badge">
            <span class="wallet-dot" aria-hidden="true"></span>
            {{ `${account.slice(0, 6)}...${account.slice(-4)}` }}
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <h2>Academic Contributions, Verifiable Forever</h2>
        <p>
          Record papers, seminars, research milestones, competitions, and extension
          activities on-chain through {{ contractBrand }}.
        </p>
      </section>

      <section v-if="isWrongNetwork" class="network-warning-card">
        <div class="network-warning-copy">
          <h3>Wrong Network Detected</h3>
          <p>
            Your wallet is connected, but not on <strong>{{ networkName }}</strong>.
            Switch MetaMask to {{ networkName }} to submit, update, or delete contributions.
          </p>
        </div>

        <div class="network-warning-actions">
          <button
            class="switch-network-btn"
            @click="handleSwitchNetwork"
            :disabled="isSwitchingNetwork || isBusy"
          >
            {{ isSwitchingNetwork ? `Switching to ${networkName}...` : `Switch to ${networkName}` }}
          </button>
        </div>
      </section>

      <section class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Visible Contributions</span>
          <strong class="stat-value">{{ contributions.length }}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-label">On-chain Count</span>
          <strong class="stat-value">{{ contributionCount }}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-label">Completed</span>
          <strong class="stat-value">{{ completedCount }}</strong>
        </div>

        <div class="stat-card">
          <span class="stat-label">Pending</span>
          <strong class="stat-value">{{ pendingCount }}</strong>
        </div>
      </section>

      <section class="contribution-box">
        <div class="section-header">
          <div>
            <h3>Submit a New Contribution</h3>
            <p class="section-subtitle">
              Create a structured academic record with title, category, and description.
            </p>
          </div>

          <button
            class="refresh-btn"
            @click="handleRefresh"
            :disabled="isBusy || isWrongNetwork"
          >
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div class="contribution-form contribution-form-stacked">
          <input
            v-model="contributionForm.title"
            type="text"
            placeholder="Contribution title (e.g., Research Paper on Blockchain Voting)"
            :disabled="!canEditContributions"
          />

          <select
            v-model.number="contributionForm.category"
            class="contribution-select"
            :disabled="!canEditContributions"
          >
            <option
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <textarea
            v-model="contributionForm.description"
            class="contribution-textarea"
            rows="4"
            placeholder="Describe the contribution, outcome, venue, or academic significance."
            :disabled="!canEditContributions"
          ></textarea>

          <div class="form-actions">
            <button
              class="submit-btn"
              @click="addContribution"
              :disabled="!canSubmitContribution"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Contribution' }}
            </button>

            <button
              class="refresh-btn secondary-btn"
              @click="resetContributionForm"
              :disabled="isBusy"
            >
              Clear Form
            </button>
          </div>
        </div>

        <div v-if="isLoadingContributions" class="pending-note">
          <span class="spinner" aria-hidden="true"></span>
          Loading contributions...
        </div>

        <div v-else-if="isSubmitting" class="pending-note">
          <span class="spinner" aria-hidden="true"></span>
          Processing blockchain transaction...
        </div>

        <div v-else-if="isWrongNetwork" class="pending-note warning-note">
          Switch to {{ networkName }} before submitting a new contribution.
        </div>
      </section>

      <section class="contribution-list">
        <div class="section-header">
          <div>
            <h3>My Academic Contributions</h3>
            <p class="section-subtitle">
              Your records are loaded from the {{ contractBrand }} smart contract and grouped as academic contributions.
            </p>
          </div>
        </div>

        <div v-if="contributions.length === 0 && !isLoadingContributions" class="empty-state">
          <div class="empty-illustration" aria-hidden="true">📚</div>
          <p>No contributions recorded yet. Submit your first academic contribution above.</p>
        </div>

        <ul v-else>
          <li
            v-for="contribution in contributions"
            :key="contribution.id"
            class="contribution-card"
            :class="{ completed: contribution.completed, pending: !contribution.completed }"
          >
            <div class="card-top">
              <div class="card-copy">
                <div class="card-heading-row">
                  <h4 class="contribution-title">{{ contribution.title }}</h4>

                  <span
                    class="status-badge"
                    :class="contribution.completed ? 'status-complete' : 'status-pending'"
                  >
                    {{ contribution.completed ? 'Completed' : 'Pending' }}
                  </span>
                </div>

                <div class="meta-row">
                  <span class="category-badge">{{ contribution.categoryLabel }}</span>
                  <span class="timestamp">
                    {{
                      new Date(contribution.createdAt * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }}
                  </span>
                </div>

                <p class="contribution-description">
                  {{ contribution.description }}
                </p>
              </div>
            </div>

            <div class="card-actions">
              <button
                class="action-btn"
                @click="toggleContribution(contribution.id)"
                :disabled="!canEditContributions"
              >
                {{ contribution.completed ? 'Undo' : 'Mark Complete' }}
              </button>

              <button
                class="delete-btn"
                aria-label="Delete contribution"
                @click="removeContribution(contribution.id)"
                :disabled="!canEditContributions"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </section>
    </main>

    <div
      v-if="txStatus && txStatus !== 'No transaction yet'"
      class="tx-toast"
      :class="toastClass"
    >
      <div class="toast-content">
        <span class="toast-message">{{ txStatus }}</span>

        <a
          v-if="latestTxUrl"
          class="toast-link"
          :href="latestTxUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan
        </a>

        <span v-if="latestTxHash" class="toast-hash">
          {{ shortTxHash }}
        </span>
      </div>

      <button class="toast-close" @click="resetTxStatus">x</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import './app.css'
import { useAuctusStore } from './composables/useAuctusStore'

const {
  account,
  walletStatus,
  contractStatus,
  txStatus,
  latestTxHash,
  latestTxUrl,
  contributionForm,
  contributions,
  contributionCount,
  categoryOptions,
  isWrongNetwork,
  isLoadingContributions,
  addContribution,
  toggleContribution,
  removeContribution,
  resetContributionForm,
  resetTxStatus,
  init,
  loadContributions,
  switchNetwork,
  appBrand,
  contractBrand,
  networkName
} = useAuctusStore()

const isRefreshing = ref(false)
const isSwitchingNetwork = ref(false)

const loweredTxStatus = computed(() => txStatus.value.toLowerCase())

const isSubmitting = computed(() => loweredTxStatus.value.includes('sending'))

const isBusy = computed(() => {
  return (
    isLoadingContributions.value ||
    isSubmitting.value ||
    isRefreshing.value ||
    isSwitchingNetwork.value
  )
})

const completedCount = computed(() =>
  contributions.value.filter((item) => item.completed).length
)

const pendingCount = computed(() =>
  contributions.value.filter((item) => !item.completed).length
)

const canEditContributions = computed(() => {
  return Boolean(account.value) && !isWrongNetwork.value && !isBusy.value
})

const canSubmitContribution = computed(() => {
  return (
    canEditContributions.value &&
    Boolean(contributionForm.value.title.trim()) &&
    Boolean(contributionForm.value.description.trim())
  )
})

const shortTxHash = computed(() => {
  if (!latestTxHash.value) {
    return ''
  }

  return `${latestTxHash.value.slice(0, 10)}...${latestTxHash.value.slice(-8)}`
})

const toastClass = computed(() => ({
  success:
    !loweredTxStatus.value.includes('sending') &&
    !loweredTxStatus.value.includes('rejected') &&
    !loweredTxStatus.value.includes('wrong network') &&
    !loweredTxStatus.value.includes('failed') &&
    !loweredTxStatus.value.includes('reverted') &&
    !loweredTxStatus.value.includes('insufficient') &&
    !loweredTxStatus.value.includes('connect wallet'),
  pending: loweredTxStatus.value.includes('sending'),
  error:
    loweredTxStatus.value.includes('rejected') ||
    loweredTxStatus.value.includes('wrong network') ||
    loweredTxStatus.value.includes('failed') ||
    loweredTxStatus.value.includes('reverted') ||
    loweredTxStatus.value.includes('insufficient') ||
    loweredTxStatus.value.includes('connect wallet')
}))

async function handleRefresh() {
  if (isWrongNetwork.value || isRefreshing.value) {
    return
  }

  isRefreshing.value = true

  try {
    await loadContributions()
  } finally {
    isRefreshing.value = false
  }
}

async function handleSwitchNetwork() {
  if (isSwitchingNetwork.value) {
    return
  }

  isSwitchingNetwork.value = true

  try {
    await switchNetwork()
  } finally {
    isSwitchingNetwork.value = false
  }
}

onMounted(() => {
  init()
})
</script>