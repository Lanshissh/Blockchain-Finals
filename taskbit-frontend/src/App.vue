<template>
  <div class="app">
    <h1>TaskBit</h1>
    <p>Blockchain-Based Task Manager</p>

    <button @click="connectWallet">Connect MetaMask</button>

    <p><strong>Status:</strong> {{ status }}</p>
    <p><strong>Account:</strong> {{ account || "No wallet connected" }}</p>
    <p><strong>Contract:</strong> {{ contractStatus }}</p>

    <div class="task-box">
      <input
        v-model="newTask"
        type="text"
        placeholder="Enter a new task"
      />
      <button @click="addTask">Add Task</button>
    </div>

    <p><strong>Transaction:</strong> {{ txStatus }}</p>

    <div class="task-list">
      <h2>Your Tasks</h2>

      <div v-if="tasks.length === 0">
        No tasks yet
      </div>

      <ul v-else>
        <li v-for="task in tasks" :key="Number(task.id)" class="task-item">
          <span :class="{ completed: task.completed }">
            {{ task.content }}
          </span>

          <div class="task-actions">
            <button @click="toggleTask(task.id)">
              {{ task.completed ? "Undo" : "Complete" }}
            </button>
            <button @click="removeTask(task.id)">Delete</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ethers } from "ethers";
import { TASKBIT_ADDRESS, TASKBIT_ABI } from "./contracts/taskbit";

const account = ref("");
const status = ref("Not connected");
const contractStatus = ref("Not connected");
const txStatus = ref("No transaction yet");
const newTask = ref("");
const tasks = ref([]);

let provider = null;
let signer = null;
let contract = null;

const loadTasks = async () => {
  try {
    if (!contract) return;

    const taskList = await contract.getMyTasks();
    tasks.value = taskList.filter((task) => !task.deleted);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    txStatus.value = "Failed to load tasks";
  }
};

const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      status.value = "MetaMask is not installed";
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
      status.value = "Please switch MetaMask to Sepolia";
      return;
    }

    signer = await provider.getSigner();
    contract = new ethers.Contract(TASKBIT_ADDRESS, TASKBIT_ABI, signer);

    if (accounts.length > 0) {
      account.value = accounts[0];
      status.value = "Wallet connected";
      contractStatus.value = "TaskBit contract connected";
      await loadTasks();
    }
  } catch (error) {
    console.error(error);
    status.value = "Connection failed";
    contractStatus.value = "Contract connection failed";
  }
};

const addTask = async () => {
  try {
    if (!contract) {
      txStatus.value = "Connect wallet first";
      return;
    }

    if (!newTask.value.trim()) {
      txStatus.value = "Task cannot be empty";
      return;
    }

    txStatus.value = "Sending add task transaction...";

    const tx = await contract.addTask(newTask.value);
    await tx.wait();

    txStatus.value = "Task added successfully";
    newTask.value = "";
    await loadTasks();
  } catch (error) {
    console.error(error);
    txStatus.value = "Failed to add task";
  }
};

const toggleTask = async (taskId) => {
  try {
    if (!contract) {
      txStatus.value = "Connect wallet first";
      return;
    }

    txStatus.value = "Sending toggle transaction...";

    const tx = await contract.toggleTask(taskId);
    await tx.wait();

    txStatus.value = "Task updated successfully";
    await loadTasks();
  } catch (error) {
    console.error(error);
    txStatus.value = "Failed to update task";
  }
};

const removeTask = async (taskId) => {
  try {
    if (!contract) {
      txStatus.value = "Connect wallet first";
      return;
    }

    txStatus.value = "Sending delete transaction...";

    const tx = await contract.deleteTask(taskId);
    await tx.wait();

    txStatus.value = "Task deleted successfully";
    await loadTasks();
  } catch (error) {
    console.error(error);
    txStatus.value = "Failed to delete task";
  }
};
</script>

<style>
.app {
  text-align: center;
  padding: 50px;
  font-family: Arial, sans-serif;
}

button {
  padding: 12px 20px;
  font-size: 16px;
  margin-top: 20px;
  cursor: pointer;
  margin-left: 8px;
}

p {
  font-size: 18px;
  margin-top: 20px;
}

.task-box {
  margin-top: 30px;
}

input {
  padding: 12px;
  width: 280px;
  font-size: 16px;
}

.task-list {
  margin-top: 40px;
}

ul {
  list-style: none;
  padding: 0;
  max-width: 700px;
  margin: 0 auto;
}

li {
  margin: 12px 0;
  font-size: 18px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a1a;
  padding: 14px 18px;
  border-radius: 8px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.completed {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>