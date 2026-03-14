<template>
  <div class="login-page">
    <div class="login-card">
      <img
        v-if="!showFoxFallback"
        class="metamask-logo"
        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
        alt="MetaMask logo"
        @error="showFoxFallback = true"
      />

      <div v-else class="fox-fallback" aria-hidden="true">🦊</div>

      <h1>Connect to {{ appBrand }}</h1>

      <p class="subtitle">
        Connect your MetaMask wallet to access your academic contribution dashboard.
      </p>

      <ul class="permissions">
        <li>✅ View your wallet address</li>
        <li>✅ Read your on-chain contributions</li>
        <li>✅ Submit blockchain transactions from your wallet</li>
      </ul>

      <button
        class="connect-action"
        :disabled="isConnecting"
        @click="handleConnect"
      >
        <span v-if="isConnecting" class="mini-spinner" aria-hidden="true"></span>
        {{ isConnecting ? 'Connecting...' : 'Connect MetaMask' }}
      </button>

      <p v-if="walletStatus && !errorMessage" class="status-message">
        {{ walletStatus }}
      </p>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuctusStore } from '../composables/useAuctusStore'

const router = useRouter()

const {
  account,
  walletStatus,
  connectWallet,
  init,
  appBrand
} = useAuctusStore()

const isConnecting = ref(false)
const errorMessage = ref('')
const showFoxFallback = ref(false)

onMounted(async () => {
  await init()

  if (account.value) {
    router.replace('/')
  }
})

async function handleConnect() {
  isConnecting.value = true
  errorMessage.value = ''

  try {
    const connected = await connectWallet()

    if (connected && account.value) {
      router.replace('/')
      return
    }

    errorMessage.value =
      walletStatus.value || 'Connection was not completed. Please try again.'
  } catch {
    errorMessage.value =
      walletStatus.value || 'Connection failed. Please try again.'
  } finally {
    isConnecting.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(245, 158, 11, 0.18), transparent 30%),
    linear-gradient(180deg, #09111f 0%, #0a1628 100%);
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.metamask-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.fox-fallback {
  font-size: 3rem;
  line-height: 1;
}

h1 {
  margin: 14px 0 8px;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  line-height: 1.1;
}

.subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.5;
  font-size: 0.98rem;
}

.permissions {
  margin: 22px 0;
  padding: 0;
  list-style: none;
  text-align: left;
  display: grid;
  gap: 10px;
  color: rgba(255, 255, 255, 0.94);
  font-size: 0.96rem;
}

.connect-action {
  width: 100%;
  border: none;
  border-radius: 12px;
  min-height: 48px;
  font-weight: 700;
  font-size: 0.98rem;
  color: #0a1628;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.connect-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(245, 158, 11, 0.3);
}

.connect-action:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(10, 22, 40, 0.3);
  border-top-color: #0a1628;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-message {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.92rem;
}

.error-message {
  margin: 14px 0 0;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.18);
  border: 1px solid rgba(248, 113, 113, 0.5);
  color: #fecaca;
  padding: 10px 12px;
  font-size: 0.92rem;
  line-height: 1.4;
}
</style>