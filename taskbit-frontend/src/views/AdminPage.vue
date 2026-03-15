<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const roleAddress = ref('')
const localMessage = ref('')

onMounted(() => {
  store.init()
})

const shortAccount = computed(() => {
  if (!store.account.value) return 'Not connected'
  const value = store.account.value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
})

const canManageProfessors = computed(() => store.isOwner.value || store.isAdmin.value)
const canManageAdmins = computed(() => store.isOwner.value)

function normalizeAddress() {
  roleAddress.value = roleAddress.value.trim()
  return roleAddress.value
}

function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

async function handleGrantProfessor() {
  const address = normalizeAddress()

  if (!isValidAddress(address)) {
    localMessage.value = 'Enter a valid wallet address.'
    return
  }

  localMessage.value = ''
  const ok = await store.assignProfessor(address)

  if (ok) {
    localMessage.value = 'Professor role granted successfully.'
    roleAddress.value = ''
  }
}

async function handleRemoveProfessor() {
  const address = normalizeAddress()

  if (!isValidAddress(address)) {
    localMessage.value = 'Enter a valid wallet address.'
    return
  }

  localMessage.value = ''
  const ok = await store.removeProfessor(address)

  if (ok) {
    localMessage.value = 'Professor role removed successfully.'
    roleAddress.value = ''
  }
}

async function handleGrantAdmin() {
  const address = normalizeAddress()

  if (!isValidAddress(address)) {
    localMessage.value = 'Enter a valid wallet address.'
    return
  }

  localMessage.value = ''
  const ok = await store.assignAdmin(address)

  if (ok) {
    localMessage.value = 'Admin role granted successfully.'
    roleAddress.value = ''
  }
}

async function handleRemoveAdmin() {
  const address = normalizeAddress()

  if (!isValidAddress(address)) {
    localMessage.value = 'Enter a valid wallet address.'
    return
  }

  localMessage.value = ''
  const ok = await store.removeAdmin(address)

  if (ok) {
    localMessage.value = 'Admin role removed successfully.'
    roleAddress.value = ''
  }
}
</script>

<template>
  <section class="page admin-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Admin Panel</p>
        <h1>Role management</h1>
        <p class="page-description">
          Manage professor and admin access for TaskBit users.
        </p>
      </div>
    </div>

    <div class="dashboard-grid">
      <article class="dashboard-card">
        <span class="dashboard-label">Connected Wallet</span>
        <strong class="dashboard-value">{{ shortAccount }}</strong>
        <p class="dashboard-help">{{ store.walletStatus.value }}</p>
      </article>

      <article class="dashboard-card">
        <span class="dashboard-label">Current Role</span>
        <strong class="dashboard-value">{{ store.roleLabel.value }}</strong>
        <p class="dashboard-help">{{ store.contractStatus.value }}</p>
      </article>

      <article class="dashboard-card">
        <span class="dashboard-label">Total Contributions</span>
        <strong class="dashboard-value">{{ store.contributionCount.value }}</strong>
        <p class="dashboard-help">Loaded from your connected contract account</p>
      </article>

      <article class="dashboard-card">
        <span class="dashboard-label">Reputation</span>
        <strong class="dashboard-value">{{ store.reputation.value }}</strong>
        <p class="dashboard-help">Current on-chain reputation score</p>
      </article>
    </div>

    <article class="panel-card">
      <div class="panel-card-header">
        <div>
          <h2>Assign roles</h2>
          <p>Paste a wallet address, then assign or remove a role.</p>
        </div>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Wallet address</span>
          <input
            v-model="roleAddress"
            type="text"
            placeholder="0x..."
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="role-sections">
        <div class="role-box">
          <h3>Professor access</h3>
          <p class="role-note">
            Owner or admin can grant or remove professor access.
          </p>

          <div class="button-row">
            <button
              class="button-primary"
              type="button"
              :disabled="!canManageProfessors"
              @click="handleGrantProfessor"
            >
              Make Professor
            </button>

            <button
              class="button-secondary"
              type="button"
              :disabled="!canManageProfessors"
              @click="handleRemoveProfessor"
            >
              Remove Professor
            </button>
          </div>
        </div>

        <div class="role-box">
          <h3>Admin access</h3>
          <p class="role-note">
            Only the contract owner can grant or remove admin access.
          </p>

          <div class="button-row">
            <button
              class="button-primary"
              type="button"
              :disabled="!canManageAdmins"
              @click="handleGrantAdmin"
            >
              Make Admin
            </button>

            <button
              class="button-secondary"
              type="button"
              :disabled="!canManageAdmins"
              @click="handleRemoveAdmin"
            >
              Remove Admin
            </button>
          </div>
        </div>
      </div>

      <p v-if="localMessage" class="status-note success-note">
        {{ localMessage }}
      </p>
      <p class="status-note">
        {{ store.txStatus.value }}
      </p>
    </article>

    <article class="panel-card">
      <div class="panel-card-header">
        <div>
          <h2>Access rules</h2>
          <p>How TaskBit decides whether a user is student, professor, or admin.</p>
        </div>
      </div>

      <ul class="role-rules">
        <li>Student is the default fallback role for connected wallets with no special role.</li>
        <li>Professor must be granted on-chain through <code>setProfessor(address, bool)</code>.</li>
        <li>Admin must be granted on-chain through <code>setAdmin(address, bool)</code>.</li>
        <li>Owner is the wallet that deployed the contract.</li>
      </ul>
    </article>
  </section>
</template>