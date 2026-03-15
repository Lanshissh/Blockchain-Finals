# TaskBit

TaskBit is a blockchain-based academic contribution tracker built with **Vue 3**, **Vite**, **Ethers.js**, and **Solidity**.

It allows students to submit academic contributions, lets professors/admins review submissions, and enables approved contributions to be minted as **ERC-721 achievement NFTs**.

---

## Features

- Connect wallet using **MetaMask**
- Role-aware interface for:
  - Student
  - Professor
  - Admin
  - Contract Owner
- Submit academic contributions with:
  - title
  - category
  - description
  - due date
- Track contribution status:
  - Pending
  - Approved
  - Rejected
- Mark contributions as completed
- Delete pending contributions
- Review and score student contributions
- Mint approved contributions as NFTs
- View contribution deadlines in calendar view
- Monitor contribution progress in dashboard and profile pages

---

## Tech Stack

### Frontend
- Vue 3
- Vite
- Vue Router
- Ethers.js

### Smart Contract
- Solidity
- OpenZeppelin ERC-721
- Ownable access control

### Wallet / Blockchain
- MetaMask
- Sepolia test network

---

## Project Structure

```text
taskbit-frontend/
├── src/
│   ├── contracts/
│   │   ├── TaskBit.sol
│   │   └── taskbit.js
│   ├── composables/
│   │   └── useAuctusStore.js
│   ├── services/
│   │   ├── taskbit.js
│   │   └── wallet.js
│   ├── views/
│   │   ├── LoginPage.vue
│   │   ├── DashboardPage.vue
│   │   ├── CalendarPage.vue
│   │   ├── ContributionsPage.vue
│   │   ├── ReviewPage.vue
│   │   ├── AdminPage.vue
│   │   └── ProfilePage.vue
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   ├── main.js
│   └── app.css
├── package.json
└── README.md