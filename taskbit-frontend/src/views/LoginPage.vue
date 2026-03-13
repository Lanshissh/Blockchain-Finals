<template>
  <div class="login-page">
    <div class="login-card">
      <img
        class="metamask-logo"
        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
        alt="MetaMask logo"
        @error="showFoxFallback = true"
        v-if="!showFoxFallback"
      />
      <div v-else class="fox-fallback" aria-hidden="true">🦊</div>

      <h1>Connect to Auctus</h1>
      <p class="subtitle">
        Connect your MetaMask wallet to track your academic contributions on the
        blockchain.
      </p>

      <ul class="permissions">
        <li>✅ View your wallet address</li>
        <li>✅ Read your contributions from the blockchain</li>
        <li>✅ Submit transactions on your behalf</li>
      </ul>

      <button class="connect-action" :disabled="isConnecting" @click="handleConnect">
        <span v-if="isConnecting" class="mini-spinner" aria-hidden="true"></span>
        {{ isConnecting ? "Connecting..." : "Connect" }}
      </button>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <RouterLink class="cancel-link" to="/">Cancel</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuctus } from "../app.js";

const router = useRouter();
const { account, status, connectWallet } = useAuctus();

const isConnecting = ref(false);
const errorMessage = ref("");
const showFoxFallback = ref(false);

onMounted(() => {
  if (account.value) {
    router.replace("/");
  }
});

const handleConnect = async () => {
  isConnecting.value = true;
  errorMessage.value = "";

  try {
    await connectWallet();

    if (account.value) {
      router.push("/");
      return;
    }

    errorMessage.value =
      status.value || "Connection was not completed. Please try again.";
  } catch (error) {
    errorMessage.value = status.value || "Connection failed. Please try again.";
  } finally {
    isConnecting.value = false;
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap");

.login-page {
  min-height: 100vh;
  background: #0a1628;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.metamask-logo {
  width: 70px;
  height: 70px;
}

.fox-fallback {
  font-size: 3rem;
}

h1 {
  margin: 12px 0 8px;
  font-family: "Playfair Display", serif;
}

.subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.45;
}

.permissions {
  margin: 18px 0;
  padding: 0;
  list-style: none;
  text-align: left;
  display: grid;
  gap: 8px;
  color: rgba(255, 255, 255, 0.95);
}

.connect-action {
  width: 100%;
  border: none;
  border-radius: 10px;
  min-height: 46px;
  font-weight: 700;
  color: #0a1628;
  background: #f59e0b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.connect-action:disabled {
  opacity: 0.7;
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

.error-message {
  margin: 12px 0 0;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.55);
  color: #fecaca;
  padding: 10px;
  font-size: 0.9rem;
}

.cancel-link {
  display: inline-block;
  margin-top: 14px;
  color: #fcd34d;
  text-decoration: none;
}
</style>
