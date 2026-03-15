<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const router = useRouter()
const route = useRoute()
const store = useAuctusStore()

onMounted(async () => {
  await store.init()

  if (store.isConnected.value) {
    redirectAfterLogin()
  }
})

const isConnecting = computed(() => store.isConnecting.value)
const walletStatus = computed(() => store.walletStatus.value)
const contractStatus = computed(() => store.contractStatus.value)
const txStatus = computed(() => store.txStatus.value)
const isWrongNetwork = computed(() => store.isWrongNetwork.value)

async function handleConnectWallet() {
  const connected = await store.connectWallet()

  if (connected) {
    redirectAfterLogin()
  }
}

async function handleSwitchNetwork() {
  const switched = await store.switchNetwork()

  if (switched && store.isConnected.value) {
    redirectAfterLogin()
  }
}

function redirectAfterLogin() {
  const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (redirectTarget && redirectTarget !== '/login') {
    router.replace(redirectTarget)
    return
  }

  if (store.isAdmin.value || store.isOwner.value) {
    router.replace('/admin')
    return
  }

  if (store.isProfessor.value || store.isReviewer.value) {
    router.replace('/review')
    return
  }

  router.replace('/calendar')
}
</script>

<template>
  <section class="login-page">
    <div class="login-shell">
      <div class="login-hero">
        <p class="eyebrow">TaskBit</p>
        <h1>Academic contribution tracker on blockchain</h1>
        <p class="subtext">
          Connect your wallet to manage academic contributions, review submissions, and mint
          achievement NFTs.
        </p>

        <div class="feature-list">
          <div class="feature-card">
            <strong>Track Contributions</strong>
            <p>Submit academic work and keep all records in one place.</p>
          </div>

          <div class="feature-card">
            <strong>Reviewer Workflow</strong>
            <p>Professors and admins can approve or reject student submissions.</p>
          </div>

          <div class="feature-card">
            <strong>NFT Achievements</strong>
            <p>Mint approved contributions as on-chain academic achievements.</p>
          </div>
        </div>
      </div>

      <div class="login-card">
        <div class="login-card-header">
          <p class="section-label">Wallet Access</p>
          <h2>Sign in with MetaMask</h2>
          <p>
            Use your connected wallet to access your TaskBit dashboard based on your assigned role.
          </p>
        </div>

        <div class="status-stack">
          <div class="status-item">
            <span>Wallet</span>
            <strong>{{ walletStatus }}</strong>
          </div>

          <div class="status-item">
            <span>Contract</span>
            <strong>{{ contractStatus }}</strong>
          </div>

          <div class="status-item">
            <span>Latest Status</span>
            <strong>{{ txStatus }}</strong>
          </div>
        </div>

        <div class="login-actions">
          <button
            type="button"
            class="action-btn primary"
            :disabled="isConnecting"
            @click="handleConnectWallet"
          >
            {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
          </button>

          <button
            v-if="isWrongNetwork"
            type="button"
            class="action-btn warning"
            @click="handleSwitchNetwork"
          >
            Switch to Correct Network
          </button>
        </div>

        <div class="login-note">
          <p>
            Make sure MetaMask is installed and connected to the network required by your deployed
            contract.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 28%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.12), transparent 24%),
    #f6f8fc;
}

.login-shell {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 24px;
  align-items: stretch;
}

.login-hero,
.login-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.login-hero {
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow,
.section-label {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 800;
  color: #6366f1;
}

.login-hero h1,
.login-card h2 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 3rem);
  line-height: 1.05;
  color: #0f172a;
}

.login-card h2 {
  font-size: 1.6rem;
}

.subtext,
.login-card-header p {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.feature-list {
  display: grid;
  gap: 14px;
}

.feature-card {
  padding: 18px 20px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.feature-card strong {
  display: block;
  margin-bottom: 6px;
  color: #0f172a;
}

.feature-card p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.login-card {
  padding: 30px;
  display: grid;
  gap: 20px;
}

.login-card-header {
  display: grid;
  gap: 4px;
}

.status-stack {
  display: grid;
  gap: 12px;
}

.status-item {
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.status-item span {
  display: block;
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 6px;
}

.status-item strong {
  color: #0f172a;
  line-height: 1.5;
  word-break: break-word;
}

.login-actions {
  display: grid;
  gap: 12px;
}

.action-btn {
  border: 0;
  border-radius: 16px;
  padding: 14px 16px;
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

.action-btn.primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.action-btn.warning {
  background: #fed7aa;
  color: #7c2d12;
}

.login-note {
  padding: 16px 18px;
  border-radius: 18px;
  background: #eef2ff;
  color: #3730a3;
}

.login-note p {
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 920px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-hero,
  .login-card {
    border-radius: 24px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .login-hero,
  .login-card {
    padding: 22px;
    border-radius: 20px;
  }
}
</style>