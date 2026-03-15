import { ethers } from 'ethers'
import {
  TASKBIT_ADDRESS,
  TASKBIT_ABI,
  CONTRIBUTION_CATEGORIES,
  CONTRIBUTION_STATUSES
} from '../contracts/taskbit'

export const APP_BRAND = 'TaskBit'
export const CONTRACT_BRAND = 'TaskBit'
export const CONTRACT_LABEL = `${CONTRACT_BRAND} smart contract`
export const BLOCK_EXPLORER_TX_BASE_URL = 'https://sepolia.etherscan.io/tx/'

export function getTaskBitContract(signerOrProvider) {
  if (!TASKBIT_ADDRESS) {
    throw new Error('TaskBit contract address is not configured. Set VITE_TASKBIT_ADDRESS in your .env file.')
  }

  return new ethers.Contract(TASKBIT_ADDRESS, TASKBIT_ABI, signerOrProvider)
}

export function getContributionCategoryLabel(categoryValue) {
  const index = Number(categoryValue)

  if (Number.isNaN(index) || index < 0 || index >= CONTRIBUTION_CATEGORIES.length) {
    return 'Other'
  }

  return CONTRIBUTION_CATEGORIES[index]
}

export function getContributionStatusLabel(statusValue) {
  const index = Number(statusValue)

  if (Number.isNaN(index) || index < 0 || index >= CONTRIBUTION_STATUSES.length) {
    return 'Pending'
  }

  return CONTRIBUTION_STATUSES[index]
}

function normalizeCategoryValue(category) {
  const numericCategory = Number(category)
  return Number.isNaN(numericCategory) ? 5 : numericCategory
}

function normalizeDueDateToUnix(dueDate) {
  if (!dueDate || typeof dueDate !== 'string') {
    return 0
  }

  const parts = dueDate.split('-').map(Number)

  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return 0
  }

  const [year, month, day] = parts
  const parsed = new Date(year, month - 1, day, 23, 59, 59)

  return Number.isNaN(parsed.getTime()) ? 0 : Math.floor(parsed.getTime() / 1000)
}

function toNumber(value, fallback = 0) {
  try {
    return Number(value ?? fallback)
  } catch {
    return fallback
  }
}

function normalizeAddress(value) {
  return String(value || '').trim().toLowerCase()
}

function formatUnixDate(unixSeconds) {
  const value = Number(unixSeconds || 0)
  if (!value) return '—'

  return new Date(value * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function decodeBase64Unicode(input) {
  try {
    if (typeof atob === 'function') {
      return decodeURIComponent(
        Array.from(atob(input), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
      )
    }
  } catch {
    return ''
  }

  return ''
}

function parseDataUriJson(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') {
    return null
  }

  const prefix = 'data:application/json;base64,'

  if (!dataUri.startsWith(prefix)) {
    return null
  }

  const decoded = decodeBase64Unicode(dataUri.slice(prefix.length))

  if (!decoded) {
    return null
  }

  try {
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function mapContractContribution(contribution) {
  const categoryValue = normalizeCategoryValue(contribution.category)
  const statusValue = toNumber(contribution.status, 0)
  const dueDate = toNumber(contribution.dueDate, 0)

  return {
    id: toNumber(contribution.id),
    student: contribution.student,
    title: contribution.title,
    category: categoryValue,
    categoryLabel: getContributionCategoryLabel(categoryValue),
    description: contribution.description,
    completed: Boolean(contribution.completed),
    createdAt: toNumber(contribution.createdAt, 0),
    dueDate,
    deleted: Boolean(contribution.deleted),
    nftMinted: Boolean(contribution.nftMinted),
    status: statusValue,
    statusLabel: getContributionStatusLabel(statusValue),
    pointsAwarded: toNumber(contribution.pointsAwarded, 0),
    reviewedBy: contribution.reviewedBy,
    reviewedAt: toNumber(contribution.reviewedAt, 0)
  }
}

function sortContributions(list) {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status - b.status
    }

    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    if (a.dueDate !== b.dueDate) {
      return a.dueDate - b.dueDate
    }

    return b.createdAt - a.createdAt
  })
}

function buildExplorerUrl(txHash) {
  if (!txHash) {
    return ''
  }

  return `${BLOCK_EXPLORER_TX_BASE_URL}${txHash}`
}

async function finalizeTransaction(tx) {
  const receipt = await tx.wait()

  return {
    hash: tx.hash,
    explorerUrl: buildExplorerUrl(tx.hash),
    receipt,
    tx
  }
}

function normalizeContributionList(contributions) {
  return sortContributions(
    contributions
      .map(mapContractContribution)
      .filter((contribution) => !contribution.deleted)
  )
}

function extractRevertReason(error) {
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.error?.message ||
    error?.message ||
    ''
  )
}

export function isUnauthorizedReadError(error) {
  const rawMessage = extractRevertReason(error)
  const message = String(rawMessage).toLowerCase()

  return (
    error?.code === 'CALL_EXCEPTION' ||
    message.includes('execution reverted') ||
    message.includes('require(false)') ||
    message.includes('reverted') ||
    message.includes('ownableunauthorizedaccount') ||
    message.includes('no_reviewer') ||
    message.includes('no_admin') ||
    message.includes('not authorized') ||
    message.includes('permission')
  )
}

export async function fetchMyContributions(contract) {
  const contributions = await contract.getMyContributions()
  return normalizeContributionList(contributions)
}

export async function fetchAllContributions(contract) {
  const contributions = await contract.getAllContributions()
  return normalizeContributionList(contributions)
}

export async function fetchBestAvailableContributions(contract, options = {}) {
  const preferAll = Boolean(options.preferAll)

  if (!preferAll) {
    const contributions = await fetchMyContributions(contract)

    return {
      contributions,
      source: 'mine',
      usedFallback: false,
      fallbackReason: ''
    }
  }

  try {
    const contributions = await fetchAllContributions(contract)

    return {
      contributions,
      source: 'all',
      usedFallback: false,
      fallbackReason: ''
    }
  } catch (error) {
    if (!isUnauthorizedReadError(error)) {
      throw error
    }

    const contributions = await fetchMyContributions(contract)

    return {
      contributions,
      source: 'mine',
      usedFallback: true,
      fallbackReason: extractRevertReason(error)
    }
  }
}

export async function fetchPendingContributions(contract) {
  const contributions = await fetchAllContributions(contract)

  return contributions.filter(
    (contribution) => !contribution.deleted && contribution.status === 0
  )
}

export async function fetchMyContributionCount(contract) {
  const contributions = await contract.getMyContributions()
  return contributions.filter((contribution) => !contribution.deleted).length
}

export async function fetchMyReputation(contract) {
  const value = await contract.getMyReputation()
  return toNumber(value, 0)
}

export async function fetchContributionTokenId(contract, contributionId) {
  const tokenId = await contract.contributionToTokenId(contributionId)
  return toNumber(tokenId, 0)
}

export async function fetchCertificateByContribution(contract, contribution) {
  const tokenId = await fetchContributionTokenId(contract, contribution.id)

  if (!tokenId) {
    return null
  }

  const tokenUri = await contract.tokenURI(tokenId)
  const metadata = parseDataUriJson(tokenUri)

  return {
    tokenId,
    contributionId: contribution.id,
    title: contribution.title,
    categoryLabel: contribution.categoryLabel,
    description: contribution.description,
    student: contribution.student,
    pointsAwarded: contribution.pointsAwarded,
    createdAt: contribution.createdAt,
    reviewedAt: contribution.reviewedAt,
    tokenUri,
    metadata,
    image: metadata?.image || '',
    statusLabel: contribution.statusLabel,
    issuedDateLabel: formatUnixDate(contribution.reviewedAt || contribution.createdAt)
  }
}

export async function fetchMyCertificates(contract, contributions) {
  const minted = contributions.filter((item) => item.nftMinted)

  const certificates = await Promise.all(
    minted.map(async (contribution) => {
      try {
        return await fetchCertificateByContribution(contract, contribution)
      } catch {
        return {
          tokenId: 0,
          contributionId: contribution.id,
          title: contribution.title,
          categoryLabel: contribution.categoryLabel,
          description: contribution.description,
          student: contribution.student,
          pointsAwarded: contribution.pointsAwarded,
          createdAt: contribution.createdAt,
          reviewedAt: contribution.reviewedAt,
          tokenUri: '',
          metadata: null,
          image: '',
          statusLabel: contribution.statusLabel,
          issuedDateLabel: formatUnixDate(contribution.reviewedAt || contribution.createdAt)
        }
      }
    })
  )

  return certificates
    .filter(Boolean)
    .sort((a, b) => (b.reviewedAt || b.createdAt || 0) - (a.reviewedAt || a.createdAt || 0))
}

export async function checkReviewerRole(contract, account) {
  if (!account) {
    return false
  }

  return await contract.isReviewer(account)
}

export async function createContribution(contract, payload) {
  const title = payload?.title?.trim?.() || ''
  const description = payload?.description?.trim?.() || ''
  const category = normalizeCategoryValue(payload?.category)
  const dueDate = normalizeDueDateToUnix(payload?.dueDate)

  const tx = await contract.addContribution(title, category, description, dueDate)
  return finalizeTransaction(tx)
}

export async function updateContributionStatus(contract, contributionId) {
  const tx = await contract.toggleContribution(contributionId)
  return finalizeTransaction(tx)
}

export async function deleteContributionById(contract, contributionId) {
  const tx = await contract.deleteContribution(contributionId)
  return finalizeTransaction(tx)
}

export async function approveContributionById(contract, contributionId, points = 0) {
  const tx = await contract.approveContribution(contributionId, Number(points) || 0)
  return finalizeTransaction(tx)
}

export async function rejectContributionById(contract, contributionId) {
  const tx = await contract.rejectContribution(contributionId)
  return finalizeTransaction(tx)
}

export async function mintContributionNft(contract, contributionId) {
  const tx = await contract.mintContributionNFT(contributionId)
  return finalizeTransaction(tx)
}

export async function setProfessorRole(contract, account, isActive) {
  const tx = await contract.setProfessor(account, Boolean(isActive))
  return finalizeTransaction(tx)
}

export async function setAdminRole(contract, account, isActive) {
  const tx = await contract.setAdmin(account, Boolean(isActive))
  return finalizeTransaction(tx)
}

export function getReadableBlockchainError(error) {
  const rawMessage = extractRevertReason(error)
  const message = String(rawMessage).toLowerCase()

  if (error?.code === 4001 || message.includes('user rejected')) {
    return 'Transaction rejected by user.'
  }

  if (error?.code === 'INSUFFICIENT_FUNDS' || message.includes('insufficient funds')) {
    return 'Insufficient gas funds in wallet.'
  }

  if (
    message.includes('wrong network') ||
    message.includes('unsupported chain') ||
    message.includes('chain changed') ||
    message.includes('sepolia')
  ) {
    return 'Wrong network. Please switch MetaMask to Sepolia.'
  }

  if (message.includes('contract address is not configured')) {
    return 'TaskBit contract address is missing. Set VITE_TASKBIT_ADDRESS in your .env file.'
  }

  if (message.includes('no_title')) {
    return 'Contribution title cannot be empty.'
  }

  if (message.includes('no_desc')) {
    return 'Contribution description cannot be empty.'
  }

  if (message.includes('bad_due')) {
    return 'Please select a future due date.'
  }

  if (message.includes('bad_addr')) {
    return 'Invalid wallet address.'
  }

  if (message.includes('no_admin') || message.includes('ownableunauthorizedaccount')) {
    return 'Only the owner or an admin can perform this action.'
  }

  if (message.includes('no_reviewer')) {
    return 'Only the owner, admin, or professor can perform this action.'
  }

  if (message.includes('no_contrib')) {
    return 'Contribution does not exist.'
  }

  if (message.includes('not_owner')) {
    return 'You can only manage your own contributions.'
  }

  if (message.includes('deleted')) {
    return 'This contribution is already deleted.'
  }

  if (message.includes('not_pending')) {
    return 'Only pending contributions can be deleted.'
  }

  if (message.includes('reviewed')) {
    return 'This contribution has already been reviewed.'
  }

  if (message.includes('not_done')) {
    return 'Mark the contribution as completed first.'
  }

  if (message.includes('not_approved')) {
    return 'Contribution must be approved before the certificate NFT can be minted.'
  }

  if (message.includes('rejected')) {
    return 'Rejected contributions cannot be completed or minted.'
  }

  if (message.includes('minted')) {
    return 'An NFT certificate already exists for this contribution.'
  }

  if (
    error?.code === 'CALL_EXCEPTION' &&
    (message.includes('require(false)') || !rawMessage)
  ) {
    return 'The deployed contract rejected this read or write call. This usually means the contract or ABI does not match the frontend.'
  }

  if (
    error?.code === 'CALL_EXCEPTION' ||
    message.includes('execution reverted') ||
    message.includes('reverted')
  ) {
    return rawMessage
      ? `Contract reverted: ${rawMessage}`
      : 'Contract reverted the transaction.'
  }

  return 'Transaction failed. Please try again.'
}

export function formatTxSummary(actionLabel, txResult) {
  if (!txResult?.hash) {
    return `${actionLabel} succeeded.`
  }

  const shortHash = `${txResult.hash.slice(0, 10)}...${txResult.hash.slice(-8)}`
  return `${actionLabel} succeeded. Tx: ${shortHash}`
}

export function isContributionOwnedByUser(contribution, account) {
  return normalizeAddress(contribution?.student) === normalizeAddress(account)
}
