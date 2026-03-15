import { ethers } from 'ethers'

export const APP_NETWORK = {
  chainId: 11155111n,
  chainHex: '0xaa36a7',
  name: 'Sepolia',
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
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
  return { provider, accounts }
}

export async function getAuthorizedAccounts() {
  const provider = await createBrowserProvider()
  const accounts = await provider.send('eth_accounts', [])
  return { provider, accounts }
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
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'SEP',
              decimals: 18
            }
          }
        ]
      })
      return
    }

    throw error
  }
}

export async function getWalletSession({ requestAccess = false } = {}) {
  const { provider, accounts } = requestAccess
    ? await requestAccounts()
    : await getAuthorizedAccounts()

  const network = await provider.getNetwork()
  const isCorrectNetwork = network.chainId === APP_NETWORK.chainId

  if (!accounts.length) {
    return {
      provider,
      signer: null,
      account: '',
      network,
      isCorrectNetwork,
      isConnected: false
    }
  }

  const signer = await provider.getSigner()
  const account = String(accounts[0] || '')

  return {
    provider,
    signer,
    account,
    network,
    isCorrectNetwork,
    isConnected: Boolean(account)
  }
}

export function onAccountsChanged(handler) {
  if (!hasEthereum()) {
    return () => {}
  }

  const ethereum = getEthereum()
  ethereum.on('accountsChanged', handler)

  return () => {
    ethereum.removeListener('accountsChanged', handler)
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