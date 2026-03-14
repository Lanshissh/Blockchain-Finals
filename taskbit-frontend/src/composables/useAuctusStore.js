import { computed, ref } from 'vue'
import {
  APP_NETWORK,
  hasEthereum,
  getWalletSession,
  switchToAppNetwork,
  onAccountsChanged,
  onChainChanged
} from '../services/wallet'
import {
  APP_BRAND,
  CONTRACT_BRAND,
  getTaskBitContract,
  fetchMyContributions,
  fetchMyContributionCount,
  createContribution,
  updateContributionStatus,
  deleteContributionById,
  getReadableBlockchainError,
  formatTxSummary
} from '../services/taskbit'
import { CONTRIBUTION_CATEGORIES } from '../contracts/taskbit'

let instance = null

export function useAuctusStore() {
  if (instance) {
    return instance
  }

  const account = ref('')
  const walletStatus = ref('Not connected')
  const contractStatus = ref(`${CONTRACT_BRAND} contract not connected`)
  const txStatus = ref('No transaction yet')
  const latestTxHash = ref('')
  const latestTxUrl = ref('')

  const contributionForm = ref({
    title: '',
    category: 0,
    description: '',
    dueDate: ''
  })

  const contributions = ref([])
  const contributionCount = ref(0)

  const isConnecting = ref(false)
  const isLoadingContributions = ref(false)
  const isInitialized = ref(false)

  let provider = null
  let signer = null
  let contract = null
  let removeAccountsListener = null
  let removeChainListener = null

  const isConnected = computed(() => Boolean(account.value))

  const isWrongNetwork = computed(() => {
    const status = walletStatus.value.toLowerCase()
    return status.includes('wrong network') || status.includes('switch metamask')
  })

  const categoryOptions = computed(() =>
    CONTRIBUTION_CATEGORIES.map((label, value) => ({
      label,
      value
    }))
  )

  function getTodayString() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`
  }

  function resetContributionForm() {
    contributionForm.value = {
      title: '',
      category: 0,
      description: '',
      dueDate: getTodayString()
    }
  }

  function setLatestTransaction(txResult = null) {
    latestTxHash.value = txResult?.hash || ''
    latestTxUrl.value = txResult?.explorerUrl || ''
  }

  function clearLatestTransaction() {
    latestTxHash.value = ''
    latestTxUrl.value = ''
  }

  function clearSession(message = 'Wallet disconnected') {
    account.value = ''
    provider = null
    signer = null
    contract = null
    contributions.value = []
    contributionCount.value = 0
    walletStatus.value = message
    contractStatus.value = `${CONTRACT_BRAND} contract not connected`
    clearLatestTransaction()
  }

  async function syncSession({ requestAccess = false } = {}) {
    if (!hasEthereum()) {
      clearSession('MetaMask is not installed')
      return false
    }

    try {
      const session = await getWalletSession({ requestAccess })

      provider = session.provider

      if (!session.isConnected) {
        clearSession('Wallet not connected')
        return false
      }

      account.value = session.account

      if (!session.isCorrectNetwork) {
        signer = session.signer
        contract = null
        contributions.value = []
        contributionCount.value = 0
        walletStatus.value = `Wrong network. Please switch MetaMask to ${APP_NETWORK.name}.`
        contractStatus.value = `${CONTRACT_BRAND} contract unavailable on current network`
        return false
      }

      signer = session.signer
      contract = getTaskBitContract(signer)
      walletStatus.value = 'Wallet connected'
      contractStatus.value = `${CONTRACT_BRAND} contract connected`
      return true
    } catch (error) {
      console.error('Failed to sync wallet session:', error)
      clearSession('Connection failed')
      return false
    }
  }

  async function loadContributions() {
    if (!contract) {
      contributions.value = []
      contributionCount.value = 0
      return
    }

    isLoadingContributions.value = true

    try {
      const [contributionList, count] = await Promise.all([
        fetchMyContributions(contract),
        fetchMyContributionCount(contract)
      ])

      contributions.value = contributionList
      contributionCount.value = count
    } catch (error) {
      console.error('Failed to load contributions:', error)
      txStatus.value = 'Failed to load contributions.'
    } finally {
      isLoadingContributions.value = false
    }
  }

  async function connectWallet() {
    if (!hasEthereum()) {
      walletStatus.value = 'MetaMask is not installed'
      txStatus.value = 'Install MetaMask to continue.'
      return false
    }

    isConnecting.value = true

    try {
      const ready = await syncSession({ requestAccess: true })

      if (ready) {
        await loadContributions()
        return true
      }

      return false
    } catch (error) {
      console.error('Wallet connection failed:', error)
      walletStatus.value = 'Connection failed'
      contractStatus.value = `${CONTRACT_BRAND} contract connection failed`
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function restoreWalletSession() {
    const ready = await syncSession({ requestAccess: false })

    if (ready) {
      await loadContributions()
    }

    return ready
  }

  async function switchNetwork() {
    if (!hasEthereum()) {
      txStatus.value = 'MetaMask is not installed.'
      return false
    }

    try {
      txStatus.value = `Requesting network switch to ${APP_NETWORK.name}...`
      await switchToAppNetwork()
      const ready = await syncSession({ requestAccess: false })

      if (ready) {
        await loadContributions()
        txStatus.value = `${APP_BRAND} is now connected to ${APP_NETWORK.name}.`
        return true
      }

      txStatus.value = `Wrong network. Please switch MetaMask to ${APP_NETWORK.name}.`
      return false
    } catch (error) {
      console.error('Network switch failed:', error)
      txStatus.value = getReadableBlockchainError(error)
      return false
    }
  }

  async function addContribution() {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    const title = contributionForm.value.title.trim()
    const description = contributionForm.value.description.trim()
    const dueDate = contributionForm.value.dueDate

    if (!title) {
      txStatus.value = 'Contribution title cannot be empty.'
      return
    }

    if (!description) {
      txStatus.value = 'Contribution description cannot be empty.'
      return
    }

    if (!dueDate) {
      txStatus.value = 'Please select a due date.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending contribution transaction...'

      const txResult = await createContribution(contract, {
        title,
        category: contributionForm.value.category,
        description,
        dueDate
      })

      setLatestTransaction(txResult)
      resetContributionForm()
      txStatus.value = formatTxSummary('Contribution added', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Add contribution failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  async function toggleContribution(contributionId) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending contribution status update...'
      const txResult = await updateContributionStatus(contract, contributionId)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Contribution updated', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Update contribution failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  async function removeContribution(contributionId) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending contribution delete transaction...'
      const txResult = await deleteContributionById(contract, contributionId)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Contribution deleted', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Delete contribution failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  function resetTxStatus() {
    txStatus.value = 'No transaction yet'
    clearLatestTransaction()
  }

  function attachWalletListeners() {
    if (!hasEthereum()) {
      return
    }

    if (!removeAccountsListener) {
      removeAccountsListener = onAccountsChanged(async (accounts) => {
        if (!accounts.length) {
          clearSession('Wallet disconnected')
          txStatus.value = 'Wallet disconnected.'
          return
        }

        await restoreWalletSession()
        txStatus.value = 'Wallet account changed.'
      })
    }

    if (!removeChainListener) {
      removeChainListener = onChainChanged(async () => {
        await restoreWalletSession()

        if (contract) {
          txStatus.value = `Network changed. ${APP_BRAND} refreshed on ${APP_NETWORK.name}.`
        } else {
          txStatus.value = `Wrong network. Please switch MetaMask to ${APP_NETWORK.name}.`
        }
      })
    }
  }

  async function init() {
    if (isInitialized.value) {
      return
    }

    isInitialized.value = true
    resetContributionForm()
    attachWalletListeners()
    await restoreWalletSession()
  }

  instance = {
    account,
    walletStatus,
    contractStatus,
    txStatus,
    latestTxHash,
    latestTxUrl,
    contributionForm,
    contributions,
    contributionCount,
    categoryOptions,
    isConnected,
    isWrongNetwork,
    isConnecting,
    isLoadingContributions,
    connectWallet,
    restoreWalletSession,
    switchNetwork,
    loadContributions,
    addContribution,
    toggleContribution,
    removeContribution,
    resetContributionForm,
    resetTxStatus,
    init,
    appBrand: APP_BRAND,
    contractBrand: CONTRACT_BRAND,
    networkName: APP_NETWORK.name
  }

  return instance
}