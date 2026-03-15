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

  if (Number.isNaN(numericCategory)) {
    return 5
  }

  return numericCategory
}

function normalizeDueDateToUnix(dueDate) {
  if (!dueDate) {
    return 0
  }

  const parsed = new Date(`${dueDate}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? 0 : Math.floor(parsed.getTime() / 1000)
}

function mapContractContribution(contribution) {
  const categoryValue = normalizeCategoryValue(contribution.category)
  const statusValue = Number(contribution.status || 0)
  const dueDate = Number(contribution.dueDate || 0)

  return {
    id: Number(contribution.id),
    student: contribution.student,
    title: contribution.title,
    category: categoryValue,
    categoryLabel: getContributionCategoryLabel(categoryValue),
    description: contribution.description,
    completed: Boolean(contribution.completed),
    createdAt: Number(contribution.createdAt || 0),
    dueDate,
    deleted: Boolean(contribution.deleted),
    nftMinted: Boolean(contribution.nftMinted),
    status: statusValue,
    statusLabel: getContributionStatusLabel(statusValue),
    pointsAwarded: Number(contribution.pointsAwarded || 0),
    reviewedBy: contribution.reviewedBy,
    reviewedAt: Number(contribution.reviewedAt || 0)
  }
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

export async function fetchMyContributions(contract) {
  const contributions = await contract.getMyContributions()

  return contributions
    .filter((contribution) => !contribution.deleted)
    .map(mapContractContribution)
    .sort((a, b) => {
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

export async function fetchMyContributionCount(contract) {
  const count = await contract.getMyContributionCount()
  return Number(count)
}

export async function fetchMyReputation(contract) {
  const value = await contract.getMyReputation()
  return Number(value)
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

export function getReadableBlockchainError(error) {
  const rawMessage = extractRevertReason(error)
  const message = String(rawMessage).toLowerCase()

  if (error?.code === 4001 || message.includes('user rejected')) {
    return 'Transaction rejected by user.'
  }

  if (
    error?.code === 'INSUFFICIENT_FUNDS' ||
    message.includes('insufficient funds')
  ) {
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

  if (message.includes('title cannot be empty')) {
    return 'Contribution title cannot be empty.'
  }

  if (message.includes('description cannot be empty')) {
    return 'Contribution description cannot be empty.'
  }

  if (message.includes('due date cannot be in the past')) {
    return 'Due date cannot be in the past.'
  }

  if (message.includes('due date is required')) {
    return 'Please select a due date.'
  }

  if (
    message.includes('only owner can call this function') ||
    message.includes('caller is not the owner') ||
    message.includes('ownableunauthorizedaccount')
  ) {
    return 'Only the contract owner can perform this action.'
  }

  if (
    message.includes('only admin or owner') ||
    message.includes('not admin or owner') ||
    message.includes('not authorized')
  ) {
    return 'Only the owner or an admin can perform this action.'
  }

  if (message.includes('not authorized reviewer')) {
    return 'Only the owner, admin, or professor can review contributions.'
  }

  if (message.includes('contribution already reviewed')) {
    return 'This contribution has already been reviewed.'
  }

  if (message.includes('only pending contributions can be deleted')) {
    return 'Only pending contributions can be deleted.'
  }

  if (message.includes('rejected contribution cannot be toggled')) {
    return 'Rejected contributions cannot be updated.'
  }

  if (message.includes('contribution must be completed first')) {
    return 'Complete the contribution first before minting the NFT.'
  }

  if (message.includes('contribution must be approved first')) {
    return 'Contribution must be approved before minting the NFT.'
  }

  if (message.includes('nft already minted for this contribution')) {
    return 'NFT has already been minted for this contribution.'
  }

  if (message.includes('not your contribution')) {
    return 'You can only manage your own contributions.'
  }

  if (!rawMessage && error?.code === 'CALL_EXCEPTION') {
    return 'Transaction failed. You may not have permission for this action on the contract.'
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