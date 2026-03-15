<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

const professorAddress = ref('')
const adminAddress = ref('')
const searchTerm = ref('')

onMounted(async () => {
  await store.init()
  await store.loadContributions()
})

const canManageAdmin = computed(() => store.isAdmin.value || store.isOwner.value)

const filteredContributions = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return [...store.visibleContributions.value]
    .filter((item) => {
      if (!keyword) return true

      return (
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.student.toLowerCase().includes(keyword) ||
        item.categoryLabel.toLowerCase().includes(keyword) ||
        item.statusLabel.toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status
      if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate
      return b.createdAt - a.createdAt
    })
})

const stats = computed(() => ({
  total: store.visibleContributions.value.length,
  pending: store.pendingContributions.value.length,
  approved: store.approvedContributions.value.length,
  rejected: store.rejectedContributions.value.length,
  completed: store.completedContributions.value.length
}))

function normalizeAddress(value) {
  return String(value || '').trim()
}

function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(normalizeAddress(value))
}

function formatAddress(address) {
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

async function handleAssignProfessor() {
  const target = normalizeAddress(professorAddress.value)

  if (!isValidAddress(target)) {
    store.txStatus.value = 'Enter a valid wallet address for professor role.'
    return
  }

  const success = await store.assignProfessor(target)

  if (success) {
    professorAddress.value = ''
  }
}

async function handleRemoveProfessor() {
  const target = normalizeAddress(professorAddress.value)

  if (!isValidAddress(target)) {
    store.txStatus.value = 'Enter a valid wallet address to remove professor role.'
    return
  }

  const success = await store.removeProfessor(target)

  if (success) {
    professorAddress.value = ''
  }
}

async function handleAssignAdmin() {
  const target = normalizeAddress(adminAddress.value)

  if (!isValidAddress(target)) {
    store.txStatus.value = 'Enter a valid wallet address for admin role.'
    return
  }

  const success = await store.assignAdmin(target)

  if (success) {
    adminAddress.value = ''
  }
}

async function handleRemoveAdmin() {
  const target = normalizeAddress(adminAddress.value)

  if (!isValidAddress(target)) {
    store.txStatus.value = 'Enter a valid wallet address to remove admin role.'
    return
  }

  const success = await store.removeAdmin(target)

  if (success) {
    adminAddress.value = ''
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Manage roles and monitor activity</h1>
        <p class="subtext">
          Assign reviewer roles, monitor contribution status, and oversee platform activity from one place.
        </p>
      </div>

      <div class="hero-badges">
        <span class="role-badge primary">{{ store.roleLabel.value }}</span>
        <span class="role-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div v-if="!canManageAdmin" class="empty-state card">
      <h2>Access restricted</h2>
      <p>Only the contract owner or an admin can access this page.</p>
    </div>

    <template v-else>
      <div class="stats-grid">
        <article class="stat-card card">
          <span>Total Contributions</span>
          <strong>{{ stats.total }}</strong>
        </article>

        <article class="stat-card card pending">
          <span>Pending</span>
          <strong>{{ stats.pending }}</strong>
        </article>

        <article class="stat-card card approved">
          <span>Approved</span>
          <strong>{{ stats.approved }}</strong>
        </article>

        <article class="stat-card card rejected">
          <span>Rejected</span>
          <strong>{{ stats.rejected }}</strong>
        </article>

        <article class="stat-card card completed">
          <span>Completed</span>
          <strong>{{ stats.completed }}</strong>
        </article>
      </div>

      <div class="management-grid">
        <article class="card role-card">
          <div class="card-header">
            <div>
              <p class="section-label">Professor Management</p>
              <h2>Grant or remove professor role</h2>
            </div>
          </div>

          <label class="field">
            <span>Wallet Address</span>
            <input
              v-model="professorAddress"
              type="text"
              placeholder="0x..."
              autocomplete="off"
              spellcheck="false"
            />
          </label>

          <div class="action-row">
            <button type="button" class="action-btn primary" @click="handleAssignProfessor">
              Grant Professor
            </button>
            <button type="button" class="action-btn subtle" @click="handleRemoveProfessor">
              Remove Professor
            </button>
          </div>
        </article>

        <article class="card role-card">
          <div class="card-header">
            <div>
              <p class="section-label">Admin Management</p>
              <h2>Grant or remove admin role</h2>
            </div>
          </div>

          <label class="field">
            <span>Wallet Address</span>
            <input
              v-model="adminAddress"
              type="text"
              placeholder="0x..."
              autocomplete="off"
              spellcheck="false"
            />
          </label>

          <div class="action-row">
            <button type="button" class="action-btn primary" @click="handleAssignAdmin">
              Grant Admin
            </button>
            <button type="button" class="action-btn subtle" @click="handleRemoveAdmin">
              Remove Admin
            </button>
          </div>
        </article>
      </div>

      <article class="card activity-card">
        <div class="activity-header">
          <div>
            <p class="section-label">Contribution Activity</p>
            <h2>System-wide contribution overview</h2>
          </div>

          <label class="search-field">
            <span>Search</span>
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Search title, address, category, status..."
            />
          </label>
        </div>

        <div v-if="store.isLoadingContributions.value" class="empty-state inner-empty">
          <h3>Loading contributions…</h3>
          <p>Please wait while the latest activity is loaded from the contract.</p>
        </div>

        <div v-else-if="!filteredContributions.length" class="empty-state inner-empty">
          <h3>No contributions found</h3>
          <p>There are no contributions matching your search.</p>
        </div>

        <div v-else class="table-wrap">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Student</th>
                <th>Category</th>
                <th>Status</th>
                <th>Completed</th>
                <th>Points</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredContributions" :key="item.id">
                <td>
                  <div class="title-cell">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.description }}</small>
                  </div>
                </td>
                <td>{{ formatAddress(item.student) }}</td>
                <td>{{ item.categoryLabel }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ item.statusLabel }}
                  </span>
                </td>
                <td>{{ item.completed ? 'Yes' : 'No' }}</td>
                <td>{{ item.pointsAwarded }}</td>
                <td>{{ formatDate(item.dueDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </template>
  </section>
</template>

<style scoped>
.admin-page {
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
.role-card h2,
.activity-card h2 {
  margin: 0;
}

.subtext {
  margin: 10px 0 0;
  color: #64748b;
  max-width: 720px;
}

.hero-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.role-badge {
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 800;
}

.role-badge.primary {
  background: #e0e7ff;
  color: #312e81;
}

.role-badge.neutral {
  background: #e2e8f0;
  color: #334155;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  font-size: 1.5rem;
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

.management-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.role-card {
  display: grid;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.field input,
.search-field input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: white;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.action-btn.subtle {
  background: #e2e8f0;
  color: #334155;
}

.activity-card {
  display: grid;
  gap: 16px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
}

.search-field {
  display: grid;
  gap: 8px;
  min-width: 300px;
}

.search-field span {
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;
}

.table-wrap {
  overflow-x: auto;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th,
.activity-table td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  vertical-align: top;
}

.activity-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.title-cell {
  display: grid;
  gap: 4px;
  min-width: 220px;
}

.title-cell small {
  color: #64748b;
  line-height: 1.5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
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
}

.empty-state h2,
.empty-state h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

.inner-empty {
  padding: 28px 12px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .management-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
  }

  .hero-badges {
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .card {
    padding: 18px;
    border-radius: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    min-width: 100%;
  }

  .action-row {
    flex-direction: column;
  }
}
</style>