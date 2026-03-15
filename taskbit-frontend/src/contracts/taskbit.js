export const TASKBIT_ADDRESS = (import.meta.env.VITE_TASKBIT_ADDRESS || '').trim()

export const CONTRIBUTION_CATEGORIES = ['Paper', 'Seminar', 'Research', 'Competition', 'Extension', 'Other']

export const CONTRIBUTION_STATUSES = ['Pending', 'Approved', 'Rejected']

export const TASKBIT_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'isActive', type: 'bool' }
    ],
    name: 'AdminUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'contributionId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'student', type: 'address' },
      { indexed: true, internalType: 'address', name: 'reviewer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'pointsAwarded', type: 'uint256' }
    ],
    name: 'ContributionApproved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'contributionId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'student', type: 'address' },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
      { indexed: false, internalType: 'uint8', name: 'category', type: 'uint8' },
      { indexed: false, internalType: 'string', name: 'description', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'dueDate', type: 'uint256' }
    ],
    name: 'ContributionCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'student', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'contributionId', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'ContributionNFTMinted',
    type: 'event'
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'uint8', name: 'category', type: 'uint8' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'uint256', name: 'dueDate', type: 'uint256' }
    ],
    name: 'addContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'contributionId', type: 'uint256' },
      { internalType: 'uint256', name: 'points', type: 'uint256' }
    ],
    name: 'approveContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'admins',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'contributionToTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'contributionId', type: 'uint256' }],
    name: 'deleteContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAllContributions',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'student', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'uint8', name: 'category', type: 'uint8' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'dueDate', type: 'uint256' },
          { internalType: 'bool', name: 'deleted', type: 'bool' },
          { internalType: 'bool', name: 'nftMinted', type: 'bool' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'pointsAwarded', type: 'uint256' },
          { internalType: 'address', name: 'reviewedBy', type: 'address' },
          { internalType: 'uint256', name: 'reviewedAt', type: 'uint256' }
        ],
        internalType: 'struct TaskBit.Contribution[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'contributionId', type: 'uint256' }],
    name: 'getContribution',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'student', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'uint8', name: 'category', type: 'uint8' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'dueDate', type: 'uint256' },
          { internalType: 'bool', name: 'deleted', type: 'bool' },
          { internalType: 'bool', name: 'nftMinted', type: 'bool' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'pointsAwarded', type: 'uint256' },
          { internalType: 'address', name: 'reviewedBy', type: 'address' },
          { internalType: 'uint256', name: 'reviewedAt', type: 'uint256' }
        ],
        internalType: 'struct TaskBit.Contribution',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMyCertificateTokenIds',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMyContributions',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'student', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'uint8', name: 'category', type: 'uint8' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'dueDate', type: 'uint256' },
          { internalType: 'bool', name: 'deleted', type: 'bool' },
          { internalType: 'bool', name: 'nftMinted', type: 'bool' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'pointsAwarded', type: 'uint256' },
          { internalType: 'address', name: 'reviewedBy', type: 'address' },
          { internalType: 'uint256', name: 'reviewedAt', type: 'uint256' }
        ],
        internalType: 'struct TaskBit.Contribution[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMyReputation',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'isReviewer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'contributionId', type: 'uint256' }],
    name: 'mintContributionNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'professors',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'reputation',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'contributionId', type: 'uint256' }],
    name: 'rejectContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bool', name: 'isActive', type: 'bool' }
    ],
    name: 'setAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'bool', name: 'isActive', type: 'bool' }
    ],
    name: 'setProfessor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenToContributionId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'contributionId', type: 'uint256' }],
    name: 'toggleContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
