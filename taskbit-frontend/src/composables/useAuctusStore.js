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
  fetchAllContributions,
  fetchBestAvailableContributions,
  fetchPendingContributions,
  fetchMyContributionCount,
  fetchMyReputation,
  checkReviewerRole,
  createContribution,
  updateContributionStatus,
  deleteContributionById,
  approveContributionById,
  rejectContributionById,
  mintContributionNft,
  fetchMyCertificates,
  setProfessorRole,
  setAdminRole,
  getReadableBlockchainError,
  formatTxSummary,
  isUnauthorizedReadError
} from '../services/taskbit'
import {
  CONTRIBUTION_CATEGORIES,
  CONTRIBUTION_STATUSES
} from '../contracts/taskbit'

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
  const contributionAccessMode = ref('mine')
  const reviewAccessError = ref('')
  const certificates = ref([])

  const contributionForm = ref({
    title: '',
    category: 0,
    description: '',
    dueDate: ''
  })

  const contributions = ref([])
  const contributionCount = ref(0)
  const reputation = ref(0)
  const certificateCount = computed(() => certificates.value.length)

  const isReviewer = ref(false)
  const isProfessor = ref(false)
  const isAdmin = ref(false)
  const isOwner = ref(false)

  const isConnecting = ref(false)
  const isLoadingContributions = ref(false)
  const isInitialized = ref(false)

  let provider = null
  let signer = null
  let contract = null
  let removeAccountsListener = null
  let removeChainListener = null

  const logoutStorageKey = 'taskbit_logged_out'

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

  const statusOptions = computed(() =>
    CONTRIBUTION_STATUSES.map((label, value) => ({
      label,
      value
    }))
  )

  const visibleContributions = computed(() =>
    contributions.value.filter((item) => !item.deleted)
  )

  const myContributions = computed(() =>
    visibleContributions.value.filter(
      (item) => normalizeAddress(item.student) === normalizeAddress(account.value)
    )
  )

  const reviewContributions = computed(() =>
    visibleContributions.value.filter(
      (item) => normalizeAddress(item.student) !== normalizeAddress(account.value)
    )
  )

  const pendingContributions = computed(() =>
    visibleContributions.value.filter((item) => Number(item.status) === 0)
  )

  const pendingReviewContributions = computed(() =>
    reviewContributions.value.filter((item) => Number(item.status) === 0)
  )

  const approvedContributions = computed(() =>
    visibleContributions.value.filter((item) => Number(item.status) === 1)
  )

  const rejectedContributions = computed(() =>
    visibleContributions.value.filter((item) => Number(item.status) === 2)
  )

  const completedContributions = computed(() =>
    visibleContributions.value.filter((item) => item.completed)
  )

  const canReview = computed(
    () => isReviewer.value || isProfessor.value || isAdmin.value || isOwner.value
  )

  const canViewAllContributions = computed(() => contributionAccessMode.value === 'all')

  const userRole = computed(() => {
    if (!isConnected.value) return 'guest'
    if (isOwner.value || isAdmin.value) return 'admin'
    if (isProfessor.value) return 'professor'
    if (isReviewer.value) return 'reviewer'
    return 'student'
  })

  const roleLabel = computed(() => {
    switch (userRole.value) {
      case 'admin':
        return 'Admin'
      case 'professor':
        return 'Professor'
      case 'reviewer':
        return 'Reviewer'
      case 'student':
        return 'Student'
      default:
        return 'Guest'
    }
  })

  function normalizeAddress(value) {
    return String(value || '').trim().toLowerCase()
  }

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

  function resetRoles() {
    isReviewer.value = false
    isProfessor.value = false
    isAdmin.value = false
    isOwner.value = false
  }

  function setLoggedOutFlag() {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(logoutStorageKey, '1')
  }

  function clearLoggedOutFlag() {
    if (typeof window === 'undefined') return
    window.sessionStorage.removeItem(logoutStorageKey)
  }

  function hasLoggedOutFlag() {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(logoutStorageKey) === '1'
  }

  function clearSession(message = 'Wallet disconnected') {
    account.value = ''
    provider = null
    signer = null
    contract = null
    contributions.value = []
    contributionCount.value = 0
    reputation.value = 0
    certificates.value = []
    contributionAccessMode.value = 'mine'
    reviewAccessError.value = ''
    resetRoles()
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
        reputation.value = 0
      certificates.value = []
        contributionAccessMode.value = 'mine'
        resetRoles()
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

  async function loadRoleState() {
    if (!contract || !account.value) {
      resetRoles()
      return
    }

    const connectedAddress = normalizeAddress(account.value)

    isReviewer.value = false
    isProfessor.value = false
    isAdmin.value = false
    isOwner.value = false

    try {
      const ownerAddress = await contract.owner()
      isOwner.value = normalizeAddress(ownerAddress) === connectedAddress
    } catch (error) {
      console.error('Failed to read owner state:', error)
    }

    try {
      const adminRole = await contract.admins(account.value)
      isAdmin.value = Boolean(adminRole)
    } catch (error) {
      console.error('Failed to read admin state:', error)
    }

    try {
      const professorRole = await contract.professors(account.value)
      isProfessor.value = Boolean(professorRole)
    } catch (error) {
      console.error('Failed to read professor state:', error)
    }

    try {
      const reviewerRole = await checkReviewerRole(contract, account.value)
      isReviewer.value = Boolean(reviewerRole)
    } catch (error) {
      console.error('Failed to read reviewer state:', error)
    }

    if (isOwner.value) {
      isAdmin.value = true
      isReviewer.value = true
    }
  }

  async function applyContributionSnapshot(contributionResult) {
    contributions.value = contributionResult.contributions
    contributionAccessMode.value = contributionResult.source

    if (contributionResult.source === 'all') {
      contributionCount.value = myContributions.value.length
      reviewAccessError.value = ''
      return
    }

    contributionCount.value = await fetchMyContributionCount(contract)

    if (contributionResult.usedFallback) {
      reviewAccessError.value =
        contributionResult.fallbackReason ||
        'The deployed contract rejected getAllContributions() for this wallet.'
    } else {
      reviewAccessError.value = ''
    }
  }

  async function loadContributions() {
    if (!contract) {
      contributions.value = []
      contributionCount.value = 0
      reputation.value = 0
      certificates.value = []
      contributionAccessMode.value = 'mine'
      reviewAccessError.value = ''
      resetRoles()
      return
    }

    isLoadingContributions.value = true

    try {
      await loadRoleState()

      const [contributionResult, reputationValue] = await Promise.all([
        fetchBestAvailableContributions(contract, { preferAll: canReview.value }),
        fetchMyReputation(contract)
      ])

      reputation.value = Number(reputationValue || 0)
      await applyContributionSnapshot(contributionResult)
      await loadCertificates()

      if (contributionResult.usedFallback) {
        txStatus.value =
          'This wallet can access the app, but the deployed contract rejected getAllContributions(). Showing only your contributions for now.'
      }
    } catch (error) {
      console.error('Failed to load contributions:', error)
      contributions.value = []
      contributionCount.value = 0
      reputation.value = 0
      certificates.value = []
      contributionAccessMode.value = 'mine'
      reviewAccessError.value = ''

      if (isUnauthorizedReadError(error)) {
        txStatus.value =
          'The deployed contract rejected this contribution read. Check TaskBit.sol access rules for getAllContributions().'
      } else {
        txStatus.value = 'Failed to load contributions.'
      }
    } finally {
      isLoadingContributions.value = false
    }
  }

  async function loadCertificates() {
    if (!contract) {
      certificates.value = []
      return []
    }

    try {
      certificates.value = await fetchMyCertificates(contract, myContributions.value)
      return certificates.value
    } catch (error) {
      console.error('Failed to load certificates:', error)
      certificates.value = []
      return []
    }
  }

  async function loadReviewContributions() {
    if (!contract) {
      contributions.value = []
      contributionCount.value = 0
      reputation.value = 0
      certificates.value = []
      contributionAccessMode.value = 'mine'
      reviewAccessError.value = ''
      resetRoles()
      return
    }

    isLoadingContributions.value = true

    try {
      await loadRoleState()
      const reputationValue = await fetchMyReputation(contract)
      reputation.value = Number(reputationValue || 0)

      try {
        const allContributions = await fetchAllContributions(contract)

        await applyContributionSnapshot({
          contributions: allContributions,
          source: 'all',
          usedFallback: false,
          fallbackReason: ''
        })

        await loadCertificates()
      } catch (error) {
        if (!isUnauthorizedReadError(error)) {
          throw error
        }

        const mineOnly = await fetchMyContributions(contract)

        await applyContributionSnapshot({
          contributions: mineOnly,
          source: 'mine',
          usedFallback: true,
          fallbackReason: error?.reason || error?.shortMessage || error?.message || ''
        })

        await loadCertificates()

        txStatus.value =
          'This wallet cannot read getAllContributions() from the deployed contract yet. Review page is showing only your own submissions.'
      }
    } catch (error) {
      console.error('Failed to load review contributions:', error)
      contributions.value = []
      contributionCount.value = 0
      reputation.value = 0
      certificates.value = []
      contributionAccessMode.value = 'mine'
      reviewAccessError.value = ''

      if (isUnauthorizedReadError(error)) {
        txStatus.value =
          'The deployed contract rejected getAllContributions(). Confirm this wallet is a professor/admin and that the frontend ABI/address matches the latest deployment.'
      } else {
        txStatus.value = 'Failed to load review contributions.'
      }
    } finally {
      isLoadingContributions.value = false
    }
  }

  async function refreshPendingReviewList() {
    if (!contract || !canReview.value || !canViewAllContributions.value) {
      return
    }

    try {
      const pendingList = await fetchPendingContributions(contract)
      const existingNonPending = visibleContributions.value.filter(
        (item) => Number(item.status) !== 0
      )

      contributions.value = [...pendingList, ...existingNonPending].sort((a, b) => {
        if (a.status !== b.status) return a.status - b.status
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        if (a.dueDate !== b.dueDate) return a.dueDate - b.dueDate
        return b.createdAt - a.createdAt
      })
    } catch (error) {
      console.error('Failed to refresh pending review list:', error)
    }
  }

  async function connectWallet() {
    if (!hasEthereum()) {
      walletStatus.value = 'MetaMask is not installed'
      txStatus.value = 'Install MetaMask to continue.'
      return false
    }

    isConnecting.value = true
    clearLoggedOutFlag()

    try {
      const ready = await syncSession({ requestAccess: true })

      if (ready) {
        await loadRoleState()
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

  function disconnectWallet() {
    setLoggedOutFlag()
    clearSession('Wallet disconnected')
    txStatus.value = 'You have been logged out.'
  }

  async function restoreWalletSession() {
    if (hasLoggedOutFlag()) {
      clearSession('Wallet disconnected')
      return false
    }

    const ready = await syncSession({ requestAccess: false })

    if (ready) {
      await loadRoleState()
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
        await loadRoleState()
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
        category: Number(contributionForm.value.category),
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

  async function approveContribution(contributionId, points = 0) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending contribution approval transaction...'
      const txResult = await approveContributionById(contract, contributionId, points)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Contribution approved', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Approve contribution failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  async function rejectContribution(contributionId) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending contribution rejection transaction...'
      const txResult = await rejectContributionById(contract, contributionId)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Contribution rejected', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Reject contribution failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  async function mintNft(contributionId) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending NFT mint transaction...'
      const txResult = await mintContributionNft(contract, contributionId)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('NFT minted', txResult)
      await loadContributions()
    } catch (error) {
      console.error('Mint NFT failed:', error)
      txStatus.value = getReadableBlockchainError(error)
    }
  }

  async function assignProfessor(targetAccount) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return false
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending professor role transaction...'
      const txResult = await setProfessorRole(contract, targetAccount, true)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Professor role granted', txResult)
      await loadRoleState()
      await loadContributions()
      return true
    } catch (error) {
      console.error('Assign professor failed:', error)
      txStatus.value = getReadableBlockchainError(error)
      return false
    }
  }

  async function removeProfessor(targetAccount) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return false
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending professor role removal transaction...'
      const txResult = await setProfessorRole(contract, targetAccount, false)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Professor role removed', txResult)
      await loadRoleState()
      await loadContributions()
      return true
    } catch (error) {
      console.error('Remove professor failed:', error)
      txStatus.value = getReadableBlockchainError(error)
      return false
    }
  }

  async function assignAdmin(targetAccount) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return false
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending admin role transaction...'
      const txResult = await setAdminRole(contract, targetAccount, true)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Admin role granted', txResult)
      await loadRoleState()
      await loadContributions()
      return true
    } catch (error) {
      console.error('Assign admin failed:', error)
      txStatus.value = getReadableBlockchainError(error)
      return false
    }
  }

  async function removeAdmin(targetAccount) {
    if (!contract) {
      txStatus.value = 'Connect wallet first.'
      return false
    }

    try {
      clearLatestTransaction()
      txStatus.value = 'Sending admin role removal transaction...'
      const txResult = await setAdminRole(contract, targetAccount, false)
      setLatestTransaction(txResult)
      txStatus.value = formatTxSummary('Admin role removed', txResult)
      await loadRoleState()
      await loadContributions()
      return true
    } catch (error) {
      console.error('Remove admin failed:', error)
      txStatus.value = getReadableBlockchainError(error)
      return false
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
          setLoggedOutFlag()
          clearSession('Wallet disconnected')
          txStatus.value = 'Wallet disconnected.'
          return
        }

        clearLoggedOutFlag()
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
    visibleContributions,
    myContributions,
    reviewContributions,
    pendingContributions,
    pendingReviewContributions,
    approvedContributions,
    rejectedContributions,
    completedContributions,
    contributionCount,
    reputation,
    certificates,
    certificateCount,
    contributionAccessMode,
    reviewAccessError,
    canViewAllContributions,
    isReviewer,
    isProfessor,
    isAdmin,
    isOwner,
    canReview,
    userRole,
    roleLabel,
    categoryOptions,
    statusOptions,
    isConnected,
    isWrongNetwork,
    isConnecting,
    isLoadingContributions,
    connectWallet,
    disconnectWallet,
    restoreWalletSession,
    switchNetwork,
    loadContributions,
    loadCertificates,
    loadReviewContributions,
    refreshPendingReviewList,
    addContribution,
    toggleContribution,
    removeContribution,
    approveContribution,
    rejectContribution,
    mintNft,
    assignProfessor,
    removeProfessor,
    assignAdmin,
    removeAdmin,
    resetContributionForm,
    resetTxStatus,
    init,
    appBrand: APP_BRAND,
    contractBrand: CONTRACT_BRAND,
    networkName: APP_NETWORK.name
  }

  return instance
}