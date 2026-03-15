import { ethers } from 'ethers'

export const APP_NETWORK = {
  chainId: 11155111n,
  chainHex: '0xaa36a7',
  name: 'Sepolia',
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18
  }
}

export function hasEthereum() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}

export function getEthereum() {
  if (!hasEthereum()) {
    throw new Error('METAMASK_NOT_INSTALLED')
  }

  return window.ethereum
}

export async function createBrowserProvider() {
  const ethereum = getEthereum()
  return new ethers.BrowserProvider(ethereum)
}

export async function requestAccounts() {
  const provider = await createBrowserProvider()
  const accounts = await provider.send('eth_requestAccounts', [])
  return { provider, accounts: normalizeAccounts(accounts) }
}

export async function getAuthorizedAccounts() {
  const provider = await createBrowserProvider()
  const accounts = await provider.send('eth_accounts', [])
  return { provider, accounts: normalizeAccounts(accounts) }
}

export async function getCurrentNetwork(provider) {
  const activeProvider = provider || (await createBrowserProvider())
  return await activeProvider.getNetwork()
}

export async function isOnAppNetwork(provider) {
  const network = await getCurrentNetwork(provider)
  return network.chainId === APP_NETWORK.chainId
}

export async function switchToAppNetwork() {
  const ethereum = getEthereum()

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: APP_NETWORK.chainHex }]
    })
  } catch (error) {
    if (error?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: APP_NETWORK.chainHex,
            chainName: APP_NETWORK.name,
            rpcUrls: APP_NETWORK.rpcUrls,
            blockExplorerUrls: APP_NETWORK.blockExplorerUrls,
            nativeCurrency: APP_NETWORK.nativeCurrency
          }
        ]
      })
      return true
    }

    throw error
  }

  return true
}

export async function getWalletSession({ requestAccess = false } = {}) {
  const { provider, accounts } = requestAccess
    ? await requestAccounts()
    : await getAuthorizedAccounts()

  const network = await provider.getNetwork()
  const isCorrectNetwork = network.chainId === APP_NETWORK.chainId
  const account = String(accounts[0] || '')

  if (!account) {
    return {
      provider,
      signer: null,
      account: '',
      accounts: [],
      network,
      isCorrectNetwork,
      isConnected: false
    }
  }

  const signer = await provider.getSigner(account)

  return {
    provider,
    signer,
    account,
    accounts,
    network,
    isCorrectNetwork,
    isConnected: true
  }
}

export function onAccountsChanged(handler) {
  if (!hasEthereum()) {
    return () => {}
  }

  const ethereum = getEthereum()
  const wrappedHandler = (accounts) => {
    handler(normalizeAccounts(accounts))
  }

  ethereum.on('accountsChanged', wrappedHandler)

  return () => {
    ethereum.removeListener('accountsChanged', wrappedHandler)
  }
}

export function onChainChanged(handler) {
  if (!hasEthereum()) {
    return () => {}
  }

  const ethereum = getEthereum()
  ethereum.on('chainChanged', handler)

  return () => {
    ethereum.removeListener('chainChanged', handler)
  }
}

function normalizeAccounts(accounts) {
  if (!Array.isArray(accounts)) {
    return []
  }

  return accounts
    .map((account) => String(account || '').trim())
    .filter(Boolean)
}