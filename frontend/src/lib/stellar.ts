import {
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk'
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api'

import {
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
  ATTESTATION_REGISTRY_ID,
  REPUTATION_SCORER_ID,
  FRIENDBOT_URL,
} from './constants'

export const rpc = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: false })

// ─── Friendbot ────────────────────────────────────────────────────────────────
export async function fetchBalance(publicKey: string): Promise<string> {
  try {
    const account = await rpc.getAccount(publicKey)
    // For testnet, returning native XLM balance (approximate if native logic used, but Soroban doesn't expose classic balances via getAccount directly)
    // So we usually rely on Horizon. Let's use simple Horizon fetch for balance.
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`)
    if (!res.ok) return '0.00'
    const data = await res.json()
    const native = data.balances.find((b: any) => b.asset_type === 'native')
    return native ? parseFloat(native.balance).toFixed(2) : '0.00'
  } catch {
    return '0.00'
  }
}

export async function connectFreighter(): Promise<{ pubKey: string; balance: string } | null> {
  const connected = await isConnected()
  if (!connected) {
    throw new Error('Freighter is not installed or connected.')
  }
  const pubKey = await getPublicKey()
  if (!pubKey) return null
  const balance = await fetchBalance(pubKey)
  return { pubKey, balance }
}

// ─── Build + submit a Soroban transaction ────────────────────────────────────
export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourcePublicKey: string
): Promise<unknown> {
  const account = await rpc.getAccount(sourcePublicKey)
  const contract = new Contract(contractId)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const sim = await rpc.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`)
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, sim).build()

  // Sign with Freighter
  const signedXdr = await signTransaction(preparedTx.toXDR(), {
    network: 'TESTNET',
  })
  
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)

  const sendResult = await rpc.sendTransaction(signedTx as any)
  if (sendResult.status === 'ERROR') {
    throw new Error(`Send failed: ${sendResult.errorResult}`)
  }

  // Poll for completion
  let getResponse = await rpc.getTransaction(sendResult.hash)
  while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise(r => setTimeout(r, 1000))
    getResponse = await rpc.getTransaction(sendResult.hash)
  }

  if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    return {
      result: getResponse.returnValue ? scValToNative(getResponse.returnValue) : null,
      txHash: sendResult.hash,
    }
  }

  throw new Error(`Transaction failed: ${getResponse.status}`)
}

// ─── Read-only simulation (no signing needed) ─────────────────────────────────
export async function simulateContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourcePublicKey: string
): Promise<unknown> {
  const account = await rpc.getAccount(sourcePublicKey).catch(() => null)
  if (!account) throw new Error('Source account not found on testnet')

  const contract = new Contract(contractId)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const sim = await rpc.simulateTransaction(tx)
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`)
  }

  const result = (sim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result
  return result ? scValToNative(result.retval) : null
}

// ─── Contract-specific helpers ────────────────────────────────────────────────

export async function getSubjectAttestations(subject: string, sourceKey: string) {
  try {
    const result = await simulateContractCall(
      ATTESTATION_REGISTRY_ID,
      'get_active_attestations',
      [new Address(subject).toScVal()],
      sourceKey
    )
    return Array.isArray(result) ? result : []
  } catch {
    return []
  }
}

export async function getReputationScore(subject: string, sourceKey: string) {
  try {
    const result = await simulateContractCall(
      REPUTATION_SCORER_ID,
      'get_score',
      [new Address(subject).toScVal()],
      sourceKey
    )
    return result as Record<string, unknown>
  } catch {
    return null
  }
}

export async function issueAttestation(
  attesterPubKey: string,
  subject: string,
  skill: string,
  level: number
): Promise<{ id: string; txHash: string }> {
  const args = [
    new Address(attesterPubKey).toScVal(),
    new Address(subject).toScVal(),
    nativeToScVal(skill, { type: 'string' }),
    nativeToScVal(level, { type: 'u32' }),
  ]

  const res = await invokeContract(
    ATTESTATION_REGISTRY_ID,
    'attest',
    args,
    attesterPubKey
  ) as { result: unknown, txHash: string }

  return { id: String(res.result), txHash: res.txHash }
}

export async function computeReputationScore(
  callerPubKey: string,
  subject: string
): Promise<Record<string, unknown>> {
  const args = [new Address(subject).toScVal()]
  const res = await invokeContract(
    REPUTATION_SCORER_ID,
    'compute_score',
    args,
    callerPubKey
  ) as { result: unknown, txHash: string }
  return res.result as Record<string, unknown>
}
