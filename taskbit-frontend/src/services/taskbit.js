import { ethers } from 'ethers'
import {
  TASKBIT_ADDRESS,
  TASKBIT_ABI,
  CONTRIBUTION_CATEGORIES
} from '../contracts/taskbit'

export const APP_BRAND = 'Auctus'
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

function normalizeCategoryValue(category) {
  const numericCategory = Number(category)

  if (Number.isNaN(numericCategory)) {
    return 5
  }

  return numericCategory
}

function mapContractContribution(contribution) {
  const categoryValue = normalizeCategoryValue(contribution.category)

  return {
    id: Number(contribution.id),
    title: contribution.title,
    category: categoryValue,
    categoryLabel: getContributionCategoryLabel(categoryValue),
    description: contribution.description,
    completed: contribution.completed,
    createdAt: Number(contribution.createdAt),
    deleted: contribution.deleted
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
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function fetchMyContributionCount(contract) {
  const count = await contract.getMyContributionCount()
  return Number(count)
}

export async function createContribution(contract, payload) {
  const title = payload?.title?.trim?.() || ''
  const description = payload?.description?.trim?.() || ''
  const category = normalizeCategoryValue(payload?.category)

  const tx = await contract.addContribution(title, category, description)
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