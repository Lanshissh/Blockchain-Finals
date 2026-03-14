<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="nav-container">
        <div class="brand">
          <span class="brand-icon" aria-hidden="true">🎓</span>
          <div>
            <h1>TaskBit</h1>
            <p class="brand-subtitle">Blockchain Academic Contribution Tracker</p>
          </div>
        </div>

        <div class="nav-right">
          <span class="network-badge">Sepolia</span>
          <span class="network-detail">{{ status }}</span>
          <span class="network-detail">{{ contractStatus.replace("TaskBit", "TaskBit") }}</span>

          <RouterLink v-if="!account" to="/login" class="connect-btn">
            Connect MetaMask
          </RouterLink>

          <div v-else class="wallet-badge">
            <span class="wallet-dot" aria-hidden="true"></span>
            {{ `${account.slice(0, 6)}...${account.slice(-4)}` }}
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <h2>Academic Contributions, Verifiable Forever</h2>
        <p>Track your academic contributions - immutably on the blockchain</p>
      </section>

      <section class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Total Contributions</span>
          <strong class="stat-value">{{ tasks.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Completed</span>
          <strong class="stat-value">
            {{ tasks.filter((task) => task.completed).length }}
          </strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending</span>
          <strong class="stat-value">
            {{ tasks.filter((task) => !task.completed).length }}
          </strong>
        </div>
      </section>

      <section class="contribution-box">
        <h3>Submit a New Contribution</h3>
        <div class="contribution-form">
          <input
            v-model="newTask"
            type="text"
            placeholder="Describe your academic contribution (e.g., Published paper, Attended seminar...)"
          />
          <button class="submit-btn" @click="addTask">Submit Contribution</button>
        </div>

        <div
          v-if="txStatus.toLowerCase().includes('sending add task')"
          class="pending-note"
        >
          <span class="spinner" aria-hidden="true"></span>
          Submitting to blockchain...
        </div>
      </section>

      <section class="contribution-list">
        <h3>My Academic Contributions</h3>

        <div v-if="tasks.length === 0" class="empty-state">
          <div class="empty-illustration" aria-hidden="true">📚</div>
          <p>No contributions recorded yet. Submit your first one above.</p>
        </div>

        <ul v-else>
          <li
            v-for="task in tasks"
            :key="Number(task.id)"
            class="contribution-card"
            :class="{ completed: task.completed, pending: !task.completed }"
          >
            <div class="card-top">
              <p class="contribution-content">{{ task.content }}</p>
              <span
                class="status-badge"
                :class="task.completed ? 'status-complete' : 'status-pending'"
              >
                {{ task.completed ? "Completed" : "Pending" }}
              </span>
            </div>

            <p class="timestamp">
              {{
                new Date(Number(task.createdAt) * 1000).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }
                )
              }}
            </p>

            <div class="card-actions">
              <button class="action-btn" @click="toggleTask(task.id)">
                {{ task.completed ? "Undo" : "Mark Complete" }}
              </button>
              <button
                class="delete-btn"
                aria-label="Delete contribution"
                @click="removeTask(task.id)"
              >
                🗑
              </button>
            </div>
          </li>
        </ul>
      </section>
    </main>

    <div
      v-if="txStatus && txStatus !== 'No transaction yet'"
      class="tx-toast"
      :class="{
        success:
          !txStatus.toLowerCase().includes('sending') &&
          !txStatus.toLowerCase().includes('failed') &&
          !txStatus.toLowerCase().includes('cannot') &&
          !txStatus.toLowerCase().includes('connect wallet'),
        pending: txStatus.toLowerCase().includes('sending'),
        error:
          txStatus.toLowerCase().includes('failed') ||
          txStatus.toLowerCase().includes('cannot') ||
          txStatus.toLowerCase().includes('connect wallet')
      }"
    >
      <span>{{ txStatus }}</span>
      <button class="toast-close" @click="txStatus = 'No transaction yet'">x</button>
    </div>
  </div>
</template>

<script setup>
import "../app.css";
import { useAuctus } from "../app.js";

const {
  account,
  status,
  contractStatus,
  txStatus,
  newTask,
  tasks,
  addTask,
  toggleTask,
  removeTask
} = useAuctus();
</script>
