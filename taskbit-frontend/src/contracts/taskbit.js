export const TASKBIT_ADDRESS =
  import.meta.env.VITE_TASKBIT_ADDRESS || '0x570881C070CCA9b1821E45A06a68E7865182E7b0'

export const CONTRIBUTION_CATEGORIES = [
  'Paper',
  'Seminar',
  'Research',
  'Competition',
  'Extension',
  'Other'
]

export const TASKBIT_ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_title',
        type: 'string'
      },
      {
        internalType: 'enum TaskBit.ContributionCategory',
        name: '_category',
        type: 'uint8'
      },
      {
        internalType: 'string',
        name: '_description',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: '_dueDate',
        type: 'uint256'
      }
    ],
    name: 'addContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_contributionId',
        type: 'uint256'
      }
    ],
    name: 'deleteContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contributionId',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'title',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'enum TaskBit.ContributionCategory',
        name: 'category',
        type: 'uint8'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'createdAt',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'dueDate',
        type: 'uint256'
      }
    ],
    name: 'ContributionCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contributionId',
        type: 'uint256'
      }
    ],
    name: 'ContributionDeleted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contributionId',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'completed',
        type: 'bool'
      }
    ],
    name: 'ContributionUpdated',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_contributionId',
        type: 'uint256'
      }
    ],
    name: 'toggleContribution',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_contributionId',
        type: 'uint256'
      }
    ],
    name: 'getMyContribution',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'enum TaskBit.ContributionCategory', name: 'category', type: 'uint8' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'dueDate', type: 'uint256' },
          { internalType: 'bool', name: 'deleted', type: 'bool' }
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
    name: 'getMyContributionCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
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
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'enum TaskBit.ContributionCategory', name: 'category', type: 'uint8' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bool', name: 'completed', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'dueDate', type: 'uint256' },
          { internalType: 'bool', name: 'deleted', type: 'bool' }
        ],
        internalType: 'struct TaskBit.Contribution[]',
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]