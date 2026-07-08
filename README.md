# ✸ LUMINARY — On-Chain Skill Attestation Protocol

> **Decentralized reputation, built on Stellar Soroban.**  
> Peer-verified skill credentials that are immutable, portable, and provably yours.

[![CI/CD](https://github.com/yourusername/luminary/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/luminary/actions)
[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-7C3AED?logo=stellar)](https://stellar.expert/explorer/testnet)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌌 What is Luminary?

Luminary is a **fully on-chain reputation and skill attestation protocol** deployed on Stellar Soroban. Instead of trusting centralized platforms like LinkedIn or GitHub to vouch for your skills, Luminary lets your peers issue cryptographically-signed, tamper-proof attestations directly on the blockchain.

**The problem it solves:** Credentials today are centralized and revocable. Your reputation lives on platforms that can delete, modify, or hide your history at will. Luminary makes reputation *sovereign* — owned by your wallet, readable by anyone.

### Key differentiators vs. common hackathon projects:
| Feature | Luminary | Typical Stellar Vault |
|---|---|---|
| Use case | Real-world professional utility | Token storage |
| Inter-contract calls | ✅ Scorer ↔ Registry | ❌ |
| On-chain scoring algorithm | ✅ Algorithmic tiers | ❌ |
| Event streaming | ✅ ATTESTED / TIER_UP | ❌ |
| Social mechanics | ✅ Endorsements | ❌ |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   LUMINARY PROTOCOL                      │
│                                                          │
│  ┌──────────────────────┐    inter-contract call        │
│  │  AttestationRegistry │ ◄────────────────────────┐    │
│  │  (Soroban Contract)  │                          │    │
│  │                      │   get_active_attestations│    │
│  │  • attest()          │                          │    │
│  │  • revoke()          │                          │    │
│  │  • endorse()         │    ┌────────────────────┐│    │
│  │  • get_attestations()│    │  ReputationScorer  ││    │
│  └──────────────────────┘    │  (Soroban Contract)││    │
│                              │                    ││    │
│                              │  • compute_score() ││    │
│                              │  • get_score()     ││    │
│                              │  • tier ranking    ││    │
│                              └────────────────────┘│    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           React 18 + TypeScript Frontend          │   │
│  │                                                   │   │
│  │  Explore │ Attest │ Profile │ Leaderboard         │   │
│  │  Stellar SDK · Zustand · Framer Motion            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Smart Contracts

#### `attestation-registry` (Rust / Soroban)
The core contract for issuing and managing skill attestations.

| Function | Description |
|---|---|
| `initialize(admin, scorer)` | One-time setup with admin and scorer contract address |
| `attest(attester, subject, skill, level)` | Issue a skill attestation (level 1–5) |
| `revoke(attester, id)` | Revoke your own attestation |
| `endorse(endorser, id)` | Add an endorsement to an attestation |
| `get_active_attestations(subject)` | Fetch all non-revoked attestations for an address |
| `get_attestation_count(subject)` | Count of total attestations |

#### `reputation-scorer` (Rust / Soroban)
Calls the AttestationRegistry via **inter-contract communication** to compute an algorithmic reputation score.

| Function | Description |
|---|---|
| `compute_score(subject)` | Cross-contract call → score + store + emit events |
| `get_score(subject)` | Read cached score and tier |

**Scoring Algorithm:**
```
Score = Σ attestations {
  50          (base per attestation)
  + (level-1) × 30    (proficiency bonus, 0–120)
  + min(endorsements, 10) × 15  (social signal, capped)
} + min(unique_skills, 8) × 25   (diversity bonus)
```

**Reputation Tiers:**
| Tier | Score | Symbol |
|---|---|---|
| Unranked | 0 | ○ |
| Apprentice | 1–199 | ◈ |
| Practitioner | 200–499 | ◆ |
| Expert | 500–799 | ✦ |
| Master | 800–999 | ★ |
| Luminary | 1000+ | ✸ |

---

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Node.js 20+](https://nodejs.org/)

```bash
# Install Rust wasm target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install soroban-cli --features opt

# Install Node dependencies
cd frontend && npm install
```

### Run Frontend Locally

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### Deploy Contracts to Testnet

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This will:
1. Generate a deployer keypair and fund via Friendbot
2. Build and optimize both WASM contracts
3. Deploy both contracts to Stellar Testnet
4. Initialize with cross-contract addresses
5. Write contract IDs to `frontend/.env.local`

### Run Tests

```bash
# Smart contract tests (Rust)
cd contracts
cargo test --features testutils -- --nocapture

# Frontend unit tests (Vitest)
cd frontend
npm test
```

---

## 📁 Project Structure

```
luminary/
├── .github/
│   └── workflows/
│       └── ci.yml              # Full CI/CD pipeline
├── contracts/
│   ├── Cargo.toml              # Workspace manifest
│   ├── attestation-registry/
│   │   └── src/
│   │       ├── lib.rs          # Contract implementation
│   │       └── test.rs         # 9 unit tests
│   └── reputation-scorer/
│       └── src/
│           ├── lib.rs          # Inter-contract scoring
│           └── test.rs         # 8 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/         # StarField, TierBadge, LevelPips, Navigation
│   │   ├── pages/              # Explore, Attest, Profile, Leaderboard
│   │   ├── lib/                # Stellar SDK, Zustand store, constants
│   │   ├── styles/             # Tailwind + custom CSS
│   │   └── test/               # 20+ Vitest test cases
│   ├── vercel.json
│   └── vite.config.ts
├── scripts/
│   └── deploy.sh               # One-command testnet deployment
├── deployment/
│   └── testnet.json            # Deployment addresses (auto-generated)
└── README.md
```

---

## 🧪 Test Coverage

### Smart Contract Tests (Rust)

**`attestation-registry`** — 9 tests:
- `test_initialize` — admin set correctly
- `test_issue_attestation` — fields stored correctly
- `test_multiple_attestations_for_subject` — list management
- `test_revoke_attestation` — revocation and active filtering
- `test_endorse_attestation` — endorsement count increments
- `test_multiple_endorsements` — multiple endorsers
- `test_self_attest_fails` — panic guard
- `test_invalid_level_fails` — panic guard
- `test_active_vs_total_attestations` — revoked filtered from active

**`reputation-scorer`** — 8 tests:
- `test_initialize_scorer`
- `test_score_tier_unranked`
- `test_tier_boundaries` — all 6 tier thresholds
- `test_score_calculation_single_attestation`
- `test_score_calculation_with_endorsements`
- `test_endorsement_cap` — cap at 10
- `test_diversity_bonus_capped_at_8_skills`
- `test_get_total_scored_increments`

### Frontend Tests (Vitest) — 20+ cases
- Utility functions (`truncateAddress`, `tierToEmoji`)
- Mock data integrity
- `TierBadge` component rendering
- `LevelPips` filled/empty pip counts
- Scoring algorithm (JS mirror of Rust logic)
- Tier boundary cases

---

## 🔗 Deployed Contracts

| Contract | Testnet Address |
|---|---|
| AttestationRegistry | `See deployment/testnet.json after running deploy.sh` |
| ReputationScorer | `See deployment/testnet.json after running deploy.sh` |

View on [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)

---

## 🎨 Design System

Luminary uses a **celestial / constellation** dark aesthetic:

| Token | Value | Usage |
|---|---|---|
| `void` | `#07080F` | Page background |
| `nebula` | `#0D1021` | Card backgrounds |
| `star` | `#E8D9A0` | Primary text |
| `pulsar` | `#A78BFA` | Accent / purple |
| `nova` | `#60A5FA` | Secondary / blue |
| `quasar` | `#34D399` | Success / green |
| `flare` | `#F472B6` | Warning / pink |
| `dim` | `#4B5580` | Muted text |

Animated star field rendered via `<canvas>` with twinkling and constellation line effects.

---

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push:

```
push to main
    │
    ├── 🦀 contract-tests
    │       ├── cargo fmt --check
    │       ├── cargo clippy
    │       ├── cargo test (attestation-registry)
    │       ├── cargo test (reputation-scorer)
    │       └── wasm build + optimize
    │
    ├── ⚡ frontend-tests
    │       ├── eslint
    │       ├── vitest (20+ tests)
    │       └── vite build
    │
    └── 🚀 deploy (main branch only)
            ├── soroban deploy attestation-registry
            ├── soroban deploy reputation-scorer
            ├── initialize both contracts
            └── vercel --prod
```

---

## 📄 License

MIT © 2024 Luminary Protocol

---

*Built for the Stellar Hackathon — Level 3 Orange Belt submission.*  
*"Your reputation, on-chain, forever."*
