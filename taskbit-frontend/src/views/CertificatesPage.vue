<script setup>
import { computed, onMounted } from 'vue'
import { useAuctusStore } from '../composables/useAuctusStore'

const store = useAuctusStore()

onMounted(async () => {
  await store.init()
  await store.loadContributions()
  await store.loadCertificates()
})

const certificateStats = computed(() => ({
  total: store.certificates.value.length,
  papers: store.certificates.value.filter((item) => item.categoryLabel === 'Paper').length,
  research: store.certificates.value.filter((item) => item.categoryLabel === 'Research').length,
  points: store.certificates.value.reduce((total, item) => total + Number(item.pointsAwarded || 0), 0)
}))

function shortenAddress(address) {
  const value = String(address || '')
  if (value.length < 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}
</script>

<template>
  <section class="certificates-page">
    <div class="hero card">
      <div>
        <p class="eyebrow">Certificates</p>
        <h1>Your blockchain academic certificates</h1>
        <p class="subtext">
          Every approved and completed contribution can become a verifiable ERC721 certificate
          NFT with on-chain metadata.
        </p>
      </div>

      <div class="hero-badges">
        <span class="hero-badge primary">{{ store.certificateCount.value }} NFTs</span>
        <span class="hero-badge neutral">Reputation: {{ store.reputation.value }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card card">
        <span>Total Certificates</span>
        <strong>{{ certificateStats.total }}</strong>
      </article>

      <article class="stat-card card approved">
        <span>Research</span>
        <strong>{{ certificateStats.research }}</strong>
      </article>

      <article class="stat-card card minted">
        <span>Papers</span>
        <strong>{{ certificateStats.papers }}</strong>
      </article>

      <article class="stat-card card completed">
        <span>Total Points</span>
        <strong>{{ certificateStats.points }}</strong>
      </article>
    </div>

    <article class="card tips-card">
      <div class="section-header">
        <div>
          <p class="section-label">How it works</p>
          <h2>Automatic NFT certificate flow</h2>
        </div>
      </div>

      <ul class="tips-list">
        <li>Student submits an academic contribution.</li>
        <li>Student marks it completed.</li>
        <li>Professor or admin approves it and awards points.</li>
        <li>TaskBit mints an ERC721 certificate automatically once both conditions are met.</li>
      </ul>
    </article>

    <div v-if="store.certificates.value.length" class="certificate-grid">
      <article v-for="certificate in store.certificates.value" :key="certificate.contributionId" class="card certificate-card">
        <div class="certificate-preview" v-if="certificate.image">
          <img :src="certificate.image" :alt="`${certificate.title} certificate`" />
        </div>

        <div class="certificate-content">
          <div class="certificate-header">
            <div>
              <p class="section-label">Token #{{ certificate.tokenId || 'Pending' }}</p>
              <h2>{{ certificate.title }}</h2>
            </div>
            <span class="hero-badge minted">{{ certificate.categoryLabel }}</span>
          </div>

          <p class="certificate-description">
            {{ certificate.description }}
          </p>

          <dl class="certificate-meta">
            <div>
              <dt>Contribution ID</dt>
              <dd>#{{ certificate.contributionId }}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{{ shortenAddress(certificate.student) }}</dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>{{ certificate.issuedDateLabel }}</dd>
            </div>
            <div>
              <dt>Points</dt>
              <dd>{{ certificate.pointsAwarded }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>

    <article v-else class="card empty-state">
      <p class="section-label">No certificates yet</p>
      <h2>Your NFT certificates will appear here</h2>
      <p>
        Submit a contribution, mark it complete, and get it approved to mint your first academic certificate.
      </p>
    </article>
  </section>
</template>
