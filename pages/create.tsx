import type { NextPage } from 'next'
import { FormEvent } from 'react'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import {
  TxRaw,
  BaseAccount,
  TxRestClient,
  ChainRestAuthApi,
  createTransaction,
  CosmosTxV1Beta1Tx,
  BroadcastModeKeplr,
  ChainRestTendermintApi,
} from '@injectivelabs/sdk-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { getStdFee, DEFAULT_BLOCK_TIMEOUT_HEIGHT } from '@injectivelabs/utils'
import { TransactionException } from '@injectivelabs/exceptions'
import useExecuteTx from 'hooks/useExecuteTx'
import { instantiateMultisigTx } from 'util/tx'
import { InstantiateMsg, Voter } from 'types/injective-cw3'

declare global {
  interface Window {
    keplr: any
  }
}

interface Msgs {
  type: string
  message: InstantiateMsg
  // ... other properties
}

const MULTISIG_CODE_ID =
  parseInt(process.env.NEXT_PUBLIC_MULTISIG_CODE_ID as string) || 4

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1'

const REST_ENDPOINT =
  process.env.NEXT_PUBLIC_REST_ENDPOINT ||
  'https://sentry.lcd.injective.network'

const getKeplr = async (chainId: string) => {
  await window.keplr.enable(chainId)

  const offlineSigner = window.keplr.getOfflineSigner(chainId)
  const accounts = await offlineSigner.getAccounts()
  const key = await window.keplr.getKey(chainId)
  console.log('getKeplr', offlineSigner, accounts, key)

  return { offlineSigner, accounts, key }
}

const broadcastTx = async (chainId: string, txRaw: TxRaw) => {
  const keplr = await getKeplr(chainId)
  const result = await keplr.offlineSigner.sendTx(
    chainId,
    CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
    BroadcastModeKeplr.Sync
  )

  console.log('broadcastTx', result)

  if (!result || result.length === 0) {
    throw new TransactionException(
      new Error('Transaction failed to be broadcasted'),
      { contextModule: 'Keplr' }
    )
  }

  return Buffer.from(result).toString('hex')
}

function AddressRow({ idx, readOnly }: { idx: number; readOnly: boolean }) {
  return (
    <tr key={idx}>
      <td className="pr-2 pb-2">
        <input
          className="block box-border m-0 w-full rounded input input-bordered focus:input-primary font-mono"
          type="text"
          name={`address_${idx}`}
          placeholder="wallet address..."
          size={45}
          readOnly={readOnly}
        />
      </td>
      <td className="pb-2">
        <input
          type="number"
          className="block box-border m-0 w-full rounded input input-bordered focus:input-primary font-mono"
          name={`weight_${idx}`}
          defaultValue="1"
          min={1}
          max={999}
          readOnly={readOnly}
        />
      </td>
    </tr>
  )
}

function validateNonEmpty(msg: InstantiateMsg, label: string) {
  const { threshold, max_voting_period, voters } = msg
  if (isNaN(threshold.absolute_count.weight) || isNaN(max_voting_period.time)) {
    return false
  }
  if (label.length === 0) {
    return false
  }
  if (
    voters.some(({ addr, weight }: Voter) => addr.length === 0 || isNaN(weight))
  ) {
    return false
  }
  return true
}

interface FormElements extends HTMLFormControlsCollection {
  duration: HTMLInputElement
  threshold: HTMLInputElement
  label: HTMLInputElement
  [key: string]: any
}

interface MultisigFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

const CreateMultisig: NextPage = () => {
  const executeTx = useExecuteTx()
  const router = useRouter()
  const [count, setCount] = useState(2)
  const [contractAddress, setContractAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { walletAddress, connectWallet, disconnect } = useSigningClient()

  const handleSubmit = async (event: FormEvent<MultisigFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formEl = event.currentTarget as MultisigFormElement

    const voters = [...Array(count)].map((_item, index) => ({
      addr: formEl[`address_${index}`]?.value?.trim(),
      weight: parseInt(formEl[`weight_${index}`]?.value?.trim()),
    }))
    const required_weight = parseInt(formEl.threshold.value?.trim())
    const max_voting_period = {
      time: parseInt(formEl.duration.value?.trim()),
    }

    /** Account Details **/
    const keplr = await getKeplr(CHAIN_ID)
    const chainRestAuthApi = new ChainRestAuthApi(REST_ENDPOINT)
    const accountDetailsResponse = await chainRestAuthApi.fetchAccount(
      walletAddress
    )
    const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse)

    /** Block Details */
    const chainRestTendermintApi = new ChainRestTendermintApi(REST_ENDPOINT)
    const latestBlock = await chainRestTendermintApi.fetchLatestBlock()
    const latestHeight = latestBlock.header.height
    const timeoutHeight = new BigNumberInBase(latestHeight).plus(
      DEFAULT_BLOCK_TIMEOUT_HEIGHT
    )
    const label = formEl.label.value.trim()

    /** Preparing the transaction */
    const instantiateMsg: InstantiateMsg = {
      max_voting_period: max_voting_period,
      threshold: { absolute_count: { weight: required_weight } },
      voters: voters,
    }

    // @ebaker TODO: add more validation
    if (!validateNonEmpty(instantiateMsg as InstantiateMsg, label)) {
      setLoading(false)
      setError('All fields are required.')
      return
    }

    const key = await window.keplr.getKey(CHAIN_ID)
    const pubKey = key.publicKey

    console.log('pubKey', pubKey)

    try {
      const response = await instantiateMultisigTx(
        walletAddress,
        MULTISIG_CODE_ID,
        CHAIN_ID,
        pubKey,
        label,
        instantiateMsg,
        executeTx
      )
      console.log('response', response)
    } catch (e) {
      console.log('error', e)
    }

    /** Prepare the Transaction * */
    /* const { txRaw } = createTransaction({
      pubKey: pubKey,
      chainId: CHAIN_ID,
      fee: getStdFee({}),
      message: instantiateMsg,
      sequence: baseAccount.sequence,
      timeoutHeight: timeoutHeight.toNumber(),
      accountNumber: baseAccount.accountNumber,
    }) */

    // Sign the transaction
    const { offlineSigner } = await getKeplr(CHAIN_ID)
    console.log('offlineSigner', offlineSigner)
    const directSignResponse = await offlineSigner.signDirect(walletAddress)
    console.log('directSignResponse', directSignResponse)

    // Broadcast the transaction
    const txHash = await broadcastTx(CHAIN_ID, directSignResponse)
    console.log('txHash', txHash)
    const txRestClient = new TxRestClient(REST_ENDPOINT)
    const response = await txRestClient.fetchTxPoll(txHash)

    console.log('response', response)

    // Handle response
    /* if (response.contractAddress.length > 0) {
      setContractAddress(response.contractAddress);
    } */
    setLoading(false)
  }

  console.log('contractAddress', contractAddress)
  const complete = contractAddress.length > 0

  return (
    <WalletLoader>
      <div className="text-center container mx-auto max-w-lg">
        <h1 className="text-5xl font-bold mb-8">New Multisig</h1>
        <form
          className="container mx-auto max-w-lg mb-8"
          onSubmit={handleSubmit}
        >
          <table className="w-full mb-8">
            <thead>
              <tr>
                <th className="text-left pb-2">Address</th>
                <th className="text-left pb-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(count)].map((_item, index) => (
                <AddressRow key={index} idx={index} readOnly={complete} />
              ))}
              <tr>
                <td
                  colSpan={2}
                  className="w-full flex justify-end gap-2 p-2 text-right"
                >
                  <button
                    className="btn btn-outline btn-primary btn-sm text-md rounded-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      setCount(count + 1)
                    }}
                  >
                    + address
                  </button>
                  <button
                    className="btn btn-outline btn-primary btn-sm text-md rounded-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      setCount(count - 1)
                    }}
                  >
                    - Address
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full my-4">
            <thead>
              <tr>
                <th className="text-left pb-2">Threshold</th>
                <th className="text-left box-border px-2 text-sm pb-2">
                  Max Voting Period (seconds)
                </th>
                <th className="text-left pb-2">Label</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    className="block box-border m-0 w-full rounded input input-bordered focus:input-primary"
                    name="threshold"
                    type="number"
                    defaultValue={count}
                    min={1}
                    max={999}
                    readOnly={complete}
                  />
                </td>
                <td className="box-border px-2">
                  <input
                    className="block box-border m-0 w-full rounded input input-bordered focus:input-primary"
                    name="duration"
                    type="number"
                    placeholder="duration in seconds"
                    min={1}
                    max={2147483647}
                    defaultValue={604800}
                    readOnly={complete}
                  />
                </td>
                <td>
                  <input
                    className="block box-border m-0 w-full rounded input input-bordered focus:input-primary"
                    name="label"
                    type="text"
                    placeholder="My multisig name"
                    readOnly={complete}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          {!complete && (
            <button
              className={`btn btn-primary btn-lg font-semibold hover:text-base-100 text-2xl rounded-xl w-full ${
                loading ? 'loading' : ''
              }`}
              style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              type="submit"
              disabled={loading}
            >
              Create Multisig
            </button>
          )}
        </form>

        {error && <LineAlert variant="error" msg={error} />}

        {contractAddress !== '' && (
          <div className="text-right">
            <LineAlert variant="success" msg={`Success!`} />
            <button
              className="mt-4 box-border px-4 py-2 btn btn-primary"
              onClick={(e) => {
                e.preventDefault()
                router.push(`/${encodeURIComponent(contractAddress)}`)
              }}
            >
              View Multisig &#8599;
            </button>
          </div>
        )}
      </div>
    </WalletLoader>
  )
}

export default CreateMultisig
