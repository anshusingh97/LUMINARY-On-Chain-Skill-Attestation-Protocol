#!/usr/bin/env bash
# =============================================================================
# Luminary — Deploy to Stellar Testnet
# Usage: ./scripts/deploy.sh
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${CYAN}[LUMINARY]${NC} $*"; }
ok()    { echo -e "${GREEN}[  OK   ]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ WARN  ]${NC} $*"; }
error() { echo -e "${RED}[ ERROR ]${NC} $*"; exit 1; }

log "Starting Luminary deployment to Stellar Testnet"
echo "================================================"

# ── Prerequisites ──────────────────────────────────────────────────────────────
command -v soroban >/dev/null 2>&1 || error "soroban CLI not found. Run: cargo install soroban-cli --features opt"
command -v cargo   >/dev/null 2>&1 || error "cargo not found. Install Rust: https://rustup.rs"
command -v jq      >/dev/null 2>&1 || error "jq not found. Install: brew install jq / apt install jq"

# ── Network setup ─────────────────────────────────────────────────────────────
log "Configuring testnet..."
soroban network add \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  testnet 2>/dev/null || warn "testnet already configured"

# ── Keypair ───────────────────────────────────────────────────────────────────
log "Setting up deployer keypair..."
soroban keys generate luminary-deployer --network testnet 2>/dev/null || warn "Key already exists"
DEPLOYER_ADDR=$(soroban keys address luminary-deployer)
ok "Deployer: $DEPLOYER_ADDR"

# ── Fund via Friendbot ────────────────────────────────────────────────────────
log "Funding via Friendbot..."
FUND_RESULT=$(curl -sf "https://friendbot.stellar.org?addr=$DEPLOYER_ADDR" 2>&1) || true
ok "Account funded"

# ── Build contracts ───────────────────────────────────────────────────────────
log "Building Soroban contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release \
  -p attestation-registry \
  -p reputation-scorer
ok "Build complete"

# ── Optimize ──────────────────────────────────────────────────────────────────
log "Optimizing WASM..."
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/attestation_registry.wasm \
  --wasm-out target/wasm32-unknown-unknown/release/attestation_registry.optimized.wasm

soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/reputation_scorer.wasm \
  --wasm-out target/wasm32-unknown-unknown/release/reputation_scorer.optimized.wasm
ok "Optimization complete"

# ── Deploy AttestationRegistry ────────────────────────────────────────────────
log "Deploying AttestationRegistry..."
REGISTRY_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/attestation_registry.optimized.wasm \
  --source luminary-deployer \
  --network testnet)
ok "AttestationRegistry: $REGISTRY_ID"

# ── Deploy ReputationScorer ───────────────────────────────────────────────────
log "Deploying ReputationScorer..."
SCORER_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reputation_scorer.optimized.wasm \
  --source luminary-deployer \
  --network testnet)
ok "ReputationScorer: $SCORER_ID"

# ── Initialize ────────────────────────────────────────────────────────────────
log "Initializing AttestationRegistry..."
INIT_REGISTRY_TX=$(soroban contract invoke \
  --id "$REGISTRY_ID" \
  --source luminary-deployer \
  --network testnet \
  -- initialize \
  --admin "$DEPLOYER_ADDR" \
  --scorer_address "$SCORER_ID")
ok "Registry initialized (tx: ${INIT_REGISTRY_TX:0:16}...)"

log "Initializing ReputationScorer..."
INIT_SCORER_TX=$(soroban contract invoke \
  --id "$SCORER_ID" \
  --source luminary-deployer \
  --network testnet \
  -- initialize \
  --admin "$DEPLOYER_ADDR" \
  --registry_address "$REGISTRY_ID")
ok "Scorer initialized (tx: ${INIT_SCORER_TX:0:16}...)"

# ── Write .env ────────────────────────────────────────────────────────────────
cd ..
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat > frontend/.env.local << EOF
VITE_ATTESTATION_REGISTRY_ID=$REGISTRY_ID
VITE_REPUTATION_SCORER_ID=$SCORER_ID
EOF

cat > deployment/testnet.json << EOF
{
  "network": "testnet",
  "deployed_at": "$TIMESTAMP",
  "deployer": "$DEPLOYER_ADDR",
  "attestation_registry": "$REGISTRY_ID",
  "reputation_scorer": "$SCORER_ID",
  "registry_init_tx": "$INIT_REGISTRY_TX",
  "scorer_init_tx": "$INIT_SCORER_TX"
}
EOF

echo ""
echo "================================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "================================================"
echo ""
echo "  AttestationRegistry : $REGISTRY_ID"
echo "  ReputationScorer    : $SCORER_ID"
echo ""
echo "  Explorer (Registry) : https://stellar.expert/explorer/testnet/contract/$REGISTRY_ID"
echo "  Explorer (Scorer)   : https://stellar.expert/explorer/testnet/contract/$SCORER_ID"
echo ""
echo "  Frontend .env.local has been updated."
echo "  Run: cd frontend && npm run dev"
echo ""
