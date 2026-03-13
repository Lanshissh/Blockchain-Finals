import { ref } from "vue";
import { ethers } from "ethers";
import { TASKBIT_ADDRESS, TASKBIT_ABI } from "./contracts/taskbit";

let instance = null;

export function useAuctus() {
  if (instance) {
    return instance;
  }

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

  instance = {
    account,
    status,
    contractStatus,
    txStatus,
    newTask,
    tasks,
    connectWallet,
    addTask,
    toggleTask,
    removeTask,
    loadTasks
  };

  return instance;
}
