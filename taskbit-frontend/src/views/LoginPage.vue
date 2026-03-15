<template>
  <section class="login-page">
    <div class="login-shell">
      <article class="login-hero">
        <p class="login-eyebrow">Welcome to TaskBit</p>
        <h1>Blockchain Academic Contribution Tracker</h1>
        <p class="login-copy">
          Submit academic contributions, track approvals, build reputation,
          review records, and manage academic workflows with role-based access.
        </p>
      </article>

      <article class="login-panel">
        <div class="brand-mark">TB</div>
        <h2>Connect your wallet</h2>
        <p class="panel-copy">
          Use MetaMask to continue to your TaskBit workspace.
        </p>

        <div class="status-stack">
          <div class="status-card">
            <span class="status-label">Wallet</span>
            <strong>{{ walletStatus }}</strong>
          </div>
          <div class="status-card">
            <span class="status-label">Contract</span>
            <strong>{{ contractStatus }}</strong>
          </div>
          <div class="status-card">
            <span class="status-label">Role</span>
            <strong>{{ roleLabel }}</strong>
          </div>
        </div>

        <div class="login-actions">
          <button
            v-if="!isConnected"
            class="primary-btn full-width"
            :disabled="isConnecting"
            @click="handleConnect"
          >
            {{ isConnecting ? 'Connecting...' : 'Connect MetaMask' }}
          </button>

          <button
            v-else-if="isWrongNetwork"
            class="warning-btn full-width"
            @click="handleSwitchNetwork"
          >
            Switch to {{ networkName }}
          </button>

          <button
            v-else
            class="success-btn full-width"
            @click="goToApp"
          >
            Continue
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const router = useRouter()
const route = useRoute()
const store = useAuctusStore()

const {
  walletStatus,
  contractStatus,
  roleLabel,
  isAdmin,
  isOwner,
  isProfessor,
  isConnected,
  isWrongNetwork,
  isConnecting,
  connectWallet,
  switchNetwork,
  init,
  loadContributions,
  networkName
} = store

function getRedirectTarget() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  if (isAdmin.value || isOwner.value) return '/admin'
  if (isProfessor.value) return '/review'
  return '/dashboard'
}

async function goToApp() {
  await router.push(getRedirectTarget())
}

async function handleConnect() {
  const ok = await connectWallet()
  if (!ok) return
  await loadContributions()
  if (store.isWrongNetwork.value) return
  await goToApp()
}

async function handleSwitchNetwork() {
  const ok = await switchNetwork()
  if (!ok) return
  await loadContributions()
  if (store.isWrongNetwork.value) return
  await goToApp()
}

onMounted(async () => {
  await init()
  await loadContributions()

  if (isConnected.value && !isWrongNetwork.value) {
    await goToApp()
  }
})
</script>