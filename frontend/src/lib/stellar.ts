import {
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Keypair,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk'

import {
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
  ATTESTATION_REGISTRY_ID,
  REPUTATION_SCORER_ID,
  FRIENDBOT_URL,
} from './constants'

export const rpc = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: false })

// ─── Friendbot ────────────────────────────────────────────────────────────────
export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`)
  if (!res.ok) throw new Error('Friendbot funding failed')
}

// ─── Build + submit a Soroban transaction ────────────────────────────────────
export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  keypair: Keypair
): Promise<unknown> {
  const account = await rpc.getAccount(keypair.publicKey())
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
  preparedTx.sign(keypair)

  const sendResult = await rpc.sendTransaction(preparedTx)
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
  attester: Keypair,
  subject: string,
  skill: string,
  level: number
): Promise<{ id: string; txHash: string }> {
  const args = [
    new Address(attester.publicKey()).toScVal(),
    new Address(subject).toScVal(),
    nativeToScVal(skill, { type: 'string' }),
    nativeToScVal(level, { type: 'u32' }),
  ]

  const res = await invokeContract(
    ATTESTATION_REGISTRY_ID,
    'attest',
    args,
    attester
  ) as { result: unknown, txHash: string }

  return { id: String(res.result), txHash: res.txHash }
}

export async function computeReputationScore(
  caller: Keypair,
  subject: string
): Promise<Record<string, unknown>> {
  const args = [new Address(subject).toScVal()]
  const res = await invokeContract(
    REPUTATION_SCORER_ID,
    'compute_score',
    args,
    caller
  ) as { result: unknown, txHash: string }
  return res.result as Record<string, unknown>
}
