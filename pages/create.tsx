import type { NextPage } from 'next'
import { FormEvent } from 'react'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { instantiateMultisigTx } from 'util/tx'
import { InstantiateMsg, Voter } from 'types/injective-cw3'
import useExecuteInstantiateTx from 'hooks/useExecuteTx'

declare global {
  interface Window {
    keplr: any
  }
}

const MULTISIG_CODE_ID =
  parseInt(process.env.NEXT_PUBLIC_MULTISIG_CODE_ID as string) || 4

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1'

const getKeplr = async (chainId: string) => {
  await window.keplr.enable(chainId)

  const offlineSigner = window.keplr.getOfflineSigner(chainId)
  const accounts = await offlineSigner.getAccounts()
  const key = await window.keplr.getKey(chainId)
  console.log('getKeplr', offlineSigner, accounts, key)

  return { offlineSigner, accounts, key }
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
  const executeInstantiateTx = useExecuteInstantiateTx()
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

    let response
    try {
      response = await instantiateMultisigTx(
        walletAddress,
        MULTISIG_CODE_ID,
        CHAIN_ID,
        pubKey,
        label,
        instantiateMsg,
        executeInstantiateTx
      )
    } catch (e) {
      console.log('error', e)
    }

    const extractContractAddress = (response: any): string | null => {
      try {
        const logs = response.logs
        for (const log of logs) {
          for (const event of log.events) {
            for (const attribute of event.attributes) {
              if (attribute.key === 'contract_address') {
                return attribute.value.replace(/\"/g, '') // Remove extra quotes
              }
            }
          }
        }
      } catch (error) {
        console.error('Error extracting contract address:', error)
      }
      return null
    }

    console.log(
      'create.extractContractAddress',
      extractContractAddress(response)
    )
    setContractAddress(extractContractAddress(response) || '')

    setLoading(false)
  }

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
          <div className="flex flex-col w-full text-right">
            <LineAlert variant="success" msg={`Success!`} />
            <span className="py-4">{contractAddress}</span>
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
